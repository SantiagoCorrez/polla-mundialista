<?php

namespace App\Matches;

use App\Config\Database;
use App\Core\AppException;
use PDO;

class MatchesService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getAll(?string $phase = null, ?string $group = null): array
    {
        $sql = 'SELECT m.*,
                    ht.id as ht_id, ht.name as ht_name, ht.flag_url as ht_flag_url, ht.country_code as ht_country_code, ht.`group` as ht_group,
                    at2.id as at_id, at2.name as at_name, at2.flag_url as at_flag_url, at2.country_code as at_country_code, at2.`group` as at_group,
                    (SELECT COUNT(*) FROM predictions p WHERE p.match_id = m.id) as predictions_count
                FROM matches m
                JOIN teams ht ON ht.id = m.home_team_id
                JOIN teams at2 ON at2.id = m.away_team_id
                WHERE 1=1';

        $params = [];

        if ($phase) {
            $sql .= ' AND m.phase = ?';
            $params[] = $phase;
        }
        if ($group) {
            $sql .= ' AND m.`group` = ?';
            $params[] = strtoupper($group);
        }

        $sql .= ' ORDER BY m.match_date ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        return array_map([$this, 'formatMatch'], $rows);
    }

    public function getById(string $id): array
    {
        $sql = 'SELECT m.*,
                    ht.id as ht_id, ht.name as ht_name, ht.flag_url as ht_flag_url, ht.country_code as ht_country_code, ht.`group` as ht_group,
                    at2.id as at_id, at2.name as at_name, at2.flag_url as at_flag_url, at2.country_code as at_country_code, at2.`group` as at_group
                FROM matches m
                JOIN teams ht ON ht.id = m.home_team_id
                JOIN teams at2 ON at2.id = m.away_team_id
                WHERE m.id = ?';

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        $match = $stmt->fetch();

        if (!$match) {
            throw new AppException('Match not found', 404);
        }

        $result = $this->formatMatch($match);

        // Include predictions with user info
        $stmt = $this->db->prepare(
            'SELECT p.*, u.id as u_id, u.username as u_username, u.full_name as u_full_name
             FROM predictions p
             JOIN users u ON u.id = p.user_id
             WHERE p.match_id = ?
             ORDER BY p.created_at ASC'
        );
        $stmt->execute([$id]);
        $preds = $stmt->fetchAll();

        $result['predictions'] = array_map(function ($p) {
            return [
                'id' => $p['id'],
                'userId' => $p['user_id'],
                'matchId' => $p['match_id'],
                'predictedHome' => (int)$p['predicted_home'],
                'predictedAway' => (int)$p['predicted_away'],
                'points' => $p['points'] !== null ? (int)$p['points'] : null,
                'pointType' => $p['point_type'],
                'createdAt' => $p['created_at'],
                'user' => [
                    'id' => $p['u_id'],
                    'username' => $p['u_username'],
                    'fullName' => $p['u_full_name'],
                ],
            ];
        }, $preds);

        return $result;
    }

    public function create(array $data): array
    {
        $id = Database::uuid();
        $stmt = $this->db->prepare(
            'INSERT INTO matches (id, home_team_id, away_team_id, phase, `group`, match_date, stadium, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([
            $id,
            $data['homeTeamId'],
            $data['awayTeamId'],
            $data['phase'],
            isset($data['group']) ? strtoupper($data['group']) : null,
            $data['matchDate'],
            $data['stadium'] ?? null,
            'SCHEDULED',
        ]);

        return $this->getById($id);
    }

    public function update(string $id, array $data): array
    {
        $match = $this->findRaw($id);
        if (!$match) {
            throw new AppException('Match not found', 404);
        }

        $sets = [];
        $params = [];

        if (isset($data['homeTeamId'])) {
            $sets[] = 'home_team_id = ?';
            $params[] = $data['homeTeamId'];
        }
        if (isset($data['awayTeamId'])) {
            $sets[] = 'away_team_id = ?';
            $params[] = $data['awayTeamId'];
        }
        if (isset($data['matchDate'])) {
            $sets[] = 'match_date = ?';
            $params[] = $data['matchDate'];
        }
        if (array_key_exists('stadium', $data)) {
            $sets[] = 'stadium = ?';
            $params[] = $data['stadium'];
        }
        if (isset($data['status'])) {
            $sets[] = 'status = ?';
            $params[] = $data['status'];
        }
        if (isset($data['group'])) {
            $sets[] = '`group` = ?';
            $params[] = strtoupper($data['group']);
        }

        if (empty($sets)) {
            return $this->getById($id);
        }

        $params[] = $id;
        $sql = 'UPDATE matches SET ' . implode(', ', $sets) . ' WHERE id = ?';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->getById($id);
    }

    public function delete(string $id): array
    {
        $match = $this->findRaw($id);
        if (!$match) {
            throw new AppException('Match not found', 404);
        }

        // Check predictions count
        $stmt = $this->db->prepare('SELECT COUNT(*) as cnt FROM predictions WHERE match_id = ?');
        $stmt->execute([$id]);
        $count = (int)$stmt->fetch()['cnt'];

        if ($count > 0) {
            throw new AppException('Cannot delete match that has predictions', 400);
        }

        $stmt = $this->db->prepare('DELETE FROM matches WHERE id = ?');
        $stmt->execute([$id]);

        return ['message' => 'Match deleted successfully'];
    }

    public function registerResult(string $id, array $data): array
    {
        $match = $this->findRaw($id);
        if (!$match) {
            throw new AppException('Match not found', 404);
        }

        $stmt = $this->db->prepare(
            'UPDATE matches SET home_score = ?, away_score = ?, home_score_final = ?, away_score_final = ?,
             qualified_team_id = ?, status = ? WHERE id = ?'
        );
        $stmt->execute([
            (int)$data['homeScore'],
            (int)$data['awayScore'],
            $data['homeScoreFinal'] ?? null,
            $data['awayScoreFinal'] ?? null,
            $data['qualifiedTeamId'] ?? null,
            'FINISHED',
            $id,
        ]);

        // Calculate points for all predictions
        $stmt = $this->db->prepare('SELECT * FROM predictions WHERE match_id = ?');
        $stmt->execute([$id]);
        $predictions = $stmt->fetchAll();

        $updateStmt = $this->db->prepare('UPDATE predictions SET points = ?, point_type = ? WHERE id = ?');

        foreach ($predictions as $pred) {
            $result = ScoringService::calcularPuntos(
                (int)$pred['predicted_home'],
                (int)$pred['predicted_away'],
                (int)$data['homeScore'],
                (int)$data['awayScore']
            );

            $updateStmt->execute([$result['points'], $result['pointType'], $pred['id']]);
        }

        $updatedMatch = $this->getById($id);

        return [
            'match' => $updatedMatch,
            'predictionsUpdated' => count($predictions),
        ];
    }

    public function getMatchPredictions(string $id): array
    {
        $stmt = $this->db->prepare(
            'SELECT p.*, u.id as u_id, u.username as u_username, u.full_name as u_full_name
             FROM predictions p
             JOIN users u ON u.id = p.user_id
             WHERE p.match_id = ?
             ORDER BY p.created_at ASC'
        );
        $stmt->execute([$id]);
        $preds = $stmt->fetchAll();

        return array_map(function ($p) {
            return [
                'id' => $p['id'],
                'userId' => $p['user_id'],
                'matchId' => $p['match_id'],
                'predictedHome' => (int)$p['predicted_home'],
                'predictedAway' => (int)$p['predicted_away'],
                'points' => $p['points'] !== null ? (int)$p['points'] : null,
                'pointType' => $p['point_type'],
                'createdAt' => $p['created_at'],
                'user' => [
                    'id' => $p['u_id'],
                    'username' => $p['u_username'],
                    'fullName' => $p['u_full_name'],
                ],
            ];
        }, $preds);
    }

    public function generateKnockoutBracket(string $phase, array $matchups): array
    {
        $created = [];
        foreach ($matchups as $matchup) {
            $id = Database::uuid();
            $stmt = $this->db->prepare(
                'INSERT INTO matches (id, home_team_id, away_team_id, phase, match_date, stadium, status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())'
            );
            $stmt->execute([
                $id,
                $matchup['homeTeamId'],
                $matchup['awayTeamId'],
                $phase,
                $matchup['matchDate'],
                $matchup['stadium'] ?? null,
                'SCHEDULED',
            ]);
            $created[] = $this->getById($id);
        }
        return $created;
    }

    private function findRaw(string $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM matches WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    private function formatMatch(array $row): array
    {
        $result = [
            'id' => $row['id'],
            'homeTeamId' => $row['home_team_id'],
            'awayTeamId' => $row['away_team_id'],
            'phase' => $row['phase'],
            'group' => $row['group'],
            'matchDate' => $row['match_date'],
            'stadium' => $row['stadium'],
            'status' => $row['status'],
            'homeScore' => $row['home_score'] !== null ? (int)$row['home_score'] : null,
            'awayScore' => $row['away_score'] !== null ? (int)$row['away_score'] : null,
            'homeScoreFinal' => $row['home_score_final'] !== null ? (int)$row['home_score_final'] : null,
            'awayScoreFinal' => $row['away_score_final'] !== null ? (int)$row['away_score_final'] : null,
            'qualifiedTeamId' => $row['qualified_team_id'],
            'createdAt' => $row['created_at'],
            'homeTeam' => [
                'id' => $row['ht_id'],
                'name' => $row['ht_name'],
                'flagUrl' => $row['ht_flag_url'],
                'countryCode' => $row['ht_country_code'],
                'group' => $row['ht_group'],
            ],
            'awayTeam' => [
                'id' => $row['at_id'],
                'name' => $row['at_name'],
                'flagUrl' => $row['at_flag_url'],
                'countryCode' => $row['at_country_code'],
                'group' => $row['at_group'],
            ],
        ];

        if (isset($row['predictions_count'])) {
            $result['_count'] = ['predictions' => (int)$row['predictions_count']];
        }

        return $result;
    }
}
