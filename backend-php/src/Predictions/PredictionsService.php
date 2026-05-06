<?php

namespace App\Predictions;

use App\Config\Database;
use App\Core\AppException;
use PDO;

class PredictionsService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function create(string $userId, string $matchId, int $predictedHome, int $predictedAway): array
    {
        // Validate match
        $stmt = $this->db->prepare('SELECT * FROM matches WHERE id = ?');
        $stmt->execute([$matchId]);
        $match = $stmt->fetch();

        if (!$match) {
            throw new AppException('Match not found', 404);
        }

        if ($match['status'] !== 'SCHEDULED') {
            throw new AppException('Cannot predict on a match that has already started or finished', 400);
        }

        if (strtotime($match['match_date']) <= time()) {
            throw new AppException('Cannot predict after the match start time', 400);
        }

        if ($predictedHome < 0 || $predictedAway < 0) {
            throw new AppException('Scores must be non-negative', 400);
        }

        // Check existing
        $stmt = $this->db->prepare('SELECT id FROM predictions WHERE user_id = ? AND match_id = ?');
        $stmt->execute([$userId, $matchId]);
        if ($stmt->fetch()) {
            throw new AppException('You already have a prediction for this match. Use update instead.', 409);
        }

        $id = Database::uuid();
        $stmt = $this->db->prepare(
            'INSERT INTO predictions (id, user_id, match_id, predicted_home, predicted_away, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([$id, $userId, $matchId, $predictedHome, $predictedAway]);

        return $this->getPredictionWithMatch($id);
    }

    public function update(string $userId, string $matchId, int $predictedHome, int $predictedAway): array
    {
        $stmt = $this->db->prepare('SELECT * FROM matches WHERE id = ?');
        $stmt->execute([$matchId]);
        $match = $stmt->fetch();

        if (!$match) {
            throw new AppException('Match not found', 404);
        }

        if ($match['status'] !== 'SCHEDULED') {
            throw new AppException('Cannot edit prediction after the match has started', 400);
        }

        if (strtotime($match['match_date']) <= time()) {
            throw new AppException('Cannot edit prediction after the match start time', 400);
        }

        if ($predictedHome < 0 || $predictedAway < 0) {
            throw new AppException('Scores must be non-negative', 400);
        }

        $stmt = $this->db->prepare('SELECT * FROM predictions WHERE user_id = ? AND match_id = ?');
        $stmt->execute([$userId, $matchId]);
        $existing = $stmt->fetch();

        if (!$existing) {
            throw new AppException('No prediction found to update', 404);
        }

        $stmt = $this->db->prepare('UPDATE predictions SET predicted_home = ?, predicted_away = ? WHERE id = ?');
        $stmt->execute([$predictedHome, $predictedAway, $existing['id']]);

        return $this->getPredictionWithMatch($existing['id']);
    }

    public function getMyPredictions(string $userId, ?string $phase = null, ?string $group = null): array
    {
        $sql = 'SELECT p.*,
                    m.home_team_id, m.away_team_id, m.phase, m.`group` as m_group, m.match_date, m.stadium, m.status,
                    m.home_score, m.away_score, m.home_score_final, m.away_score_final, m.qualified_team_id,
                    ht.id as ht_id, ht.name as ht_name, ht.flag_url as ht_flag_url, ht.country_code as ht_country_code, ht.`group` as ht_group,
                    at2.id as at_id, at2.name as at_name, at2.flag_url as at_flag_url, at2.country_code as at_country_code, at2.`group` as at_group
                FROM predictions p
                JOIN matches m ON m.id = p.match_id
                JOIN teams ht ON ht.id = m.home_team_id
                JOIN teams at2 ON at2.id = m.away_team_id
                WHERE p.user_id = ?';

        $params = [$userId];

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

        return array_map([$this, 'formatPredictionWithMatch'], $rows);
    }

    public function getMyPredictionForMatch(string $userId, string $matchId): ?array
    {
        $sql = 'SELECT p.*,
                    m.home_team_id, m.away_team_id, m.phase, m.`group` as m_group, m.match_date, m.stadium, m.status,
                    m.home_score, m.away_score, m.home_score_final, m.away_score_final, m.qualified_team_id,
                    ht.id as ht_id, ht.name as ht_name, ht.flag_url as ht_flag_url, ht.country_code as ht_country_code, ht.`group` as ht_group,
                    at2.id as at_id, at2.name as at_name, at2.flag_url as at_flag_url, at2.country_code as at_country_code, at2.`group` as at_group
                FROM predictions p
                JOIN matches m ON m.id = p.match_id
                JOIN teams ht ON ht.id = m.home_team_id
                JOIN teams at2 ON at2.id = m.away_team_id
                WHERE p.user_id = ? AND p.match_id = ?';

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId, $matchId]);
        $row = $stmt->fetch();

        return $row ? $this->formatPredictionWithMatch($row) : null;
    }

    public function getTournamentPrediction(string $userId): ?array
    {
        $sql = 'SELECT tp.*,
                    c.id as c_id, c.name as c_name, c.flag_url as c_flag_url, c.country_code as c_code, c.`group` as c_group,
                    r.id as r_id, r.name as r_name, r.flag_url as r_flag_url, r.country_code as r_code, r.`group` as r_group,
                    t.id as t_id, t.name as t_name, t.flag_url as t_flag_url, t.country_code as t_code, t.`group` as t_group,
                    f.id as f_id, f.name as f_name, f.flag_url as f_flag_url, f.country_code as f_code, f.`group` as f_group
                FROM tournament_predictions tp
                LEFT JOIN teams c ON c.id = tp.champion_id
                LEFT JOIN teams r ON r.id = tp.runner_up_id
                LEFT JOIN teams t ON t.id = tp.third_place_id
                LEFT JOIN teams f ON f.id = tp.fourth_place_id
                WHERE tp.user_id = ?';

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        if (!$row) return null;

        return $this->formatTournamentPrediction($row);
    }

    public function upsertTournamentPrediction(string $userId, array $data): array
    {
        // Check deadline
        if (time() >= strtotime('2026-06-11T16:00:00Z')) {
            throw new AppException('No se pueden modificar estas predicciones después del inicio del torneo', 400);
        }

        $stmt = $this->db->prepare('SELECT id FROM tournament_predictions WHERE user_id = ?');
        $stmt->execute([$userId]);
        $existing = $stmt->fetch();

        if ($existing) {
            $stmt = $this->db->prepare(
                'UPDATE tournament_predictions SET champion_id = ?, runner_up_id = ?, third_place_id = ?,
                 fourth_place_id = ?, top_scorer = ?, updated_at = NOW() WHERE user_id = ?'
            );
            $stmt->execute([
                $data['championId'] ?? null,
                $data['runnerUpId'] ?? null,
                $data['thirdPlaceId'] ?? null,
                $data['fourthPlaceId'] ?? null,
                $data['topScorer'] ?? null,
                $userId,
            ]);
        } else {
            $id = Database::uuid();
            $stmt = $this->db->prepare(
                'INSERT INTO tournament_predictions (id, user_id, champion_id, runner_up_id, third_place_id, fourth_place_id, top_scorer, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())'
            );
            $stmt->execute([
                $id,
                $userId,
                $data['championId'] ?? null,
                $data['runnerUpId'] ?? null,
                $data['thirdPlaceId'] ?? null,
                $data['fourthPlaceId'] ?? null,
                $data['topScorer'] ?? null,
            ]);
        }

        return $this->getTournamentPrediction($userId);
    }

    public function getAllTournamentPredictions(): array
    {
        $sql = 'SELECT tp.*,
                    u.full_name as u_full_name, u.username as u_username, u.email as u_email,
                    c.id as c_id, c.name as c_name, c.flag_url as c_flag_url, c.country_code as c_code, c.`group` as c_group,
                    r.id as r_id, r.name as r_name, r.flag_url as r_flag_url, r.country_code as r_code, r.`group` as r_group,
                    t.id as t_id, t.name as t_name, t.flag_url as t_flag_url, t.country_code as t_code, t.`group` as t_group,
                    f.id as f_id, f.name as f_name, f.flag_url as f_flag_url, f.country_code as f_code, f.`group` as f_group
                FROM tournament_predictions tp
                JOIN users u ON u.id = tp.user_id
                LEFT JOIN teams c ON c.id = tp.champion_id
                LEFT JOIN teams r ON r.id = tp.runner_up_id
                LEFT JOIN teams t ON t.id = tp.third_place_id
                LEFT JOIN teams f ON f.id = tp.fourth_place_id
                ORDER BY u.full_name ASC';

        $stmt = $this->db->query($sql);
        $rows = $stmt->fetchAll();

        return array_map(function ($row) {
            $result = $this->formatTournamentPrediction($row);
            $result['user'] = [
                'fullName' => $row['u_full_name'],
                'username' => $row['u_username'],
                'email' => $row['u_email'],
            ];
            return $result;
        }, $rows);
    }

    private function getPredictionWithMatch(string $predictionId): array
    {
        $sql = 'SELECT p.*,
                    m.home_team_id, m.away_team_id, m.phase, m.`group` as m_group, m.match_date, m.stadium, m.status,
                    m.home_score, m.away_score, m.home_score_final, m.away_score_final, m.qualified_team_id,
                    ht.id as ht_id, ht.name as ht_name, ht.flag_url as ht_flag_url, ht.country_code as ht_country_code, ht.`group` as ht_group,
                    at2.id as at_id, at2.name as at_name, at2.flag_url as at_flag_url, at2.country_code as at_country_code, at2.`group` as at_group
                FROM predictions p
                JOIN matches m ON m.id = p.match_id
                JOIN teams ht ON ht.id = m.home_team_id
                JOIN teams at2 ON at2.id = m.away_team_id
                WHERE p.id = ?';

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$predictionId]);
        $row = $stmt->fetch();

        return $this->formatPredictionWithMatch($row);
    }

    private function formatPredictionWithMatch(array $row): array
    {
        return [
            'id' => $row['id'],
            'userId' => $row['user_id'],
            'matchId' => $row['match_id'],
            'predictedHome' => (int)$row['predicted_home'],
            'predictedAway' => (int)$row['predicted_away'],
            'points' => $row['points'] !== null ? (int)$row['points'] : null,
            'pointType' => $row['point_type'],
            'createdAt' => $row['created_at'],
            'match' => [
                'id' => $row['match_id'],
                'homeTeamId' => $row['home_team_id'],
                'awayTeamId' => $row['away_team_id'],
                'phase' => $row['phase'],
                'group' => $row['m_group'],
                'matchDate' => $row['match_date'],
                'stadium' => $row['stadium'],
                'status' => $row['status'],
                'homeScore' => $row['home_score'] !== null ? (int)$row['home_score'] : null,
                'awayScore' => $row['away_score'] !== null ? (int)$row['away_score'] : null,
                'homeScoreFinal' => $row['home_score_final'] !== null ? (int)$row['home_score_final'] : null,
                'awayScoreFinal' => $row['away_score_final'] !== null ? (int)$row['away_score_final'] : null,
                'qualifiedTeamId' => $row['qualified_team_id'],
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
            ],
        ];
    }

    private function formatTournamentPrediction(array $row): array
    {
        $result = [
            'id' => $row['id'],
            'userId' => $row['user_id'],
            'championId' => $row['champion_id'],
            'runnerUpId' => $row['runner_up_id'],
            'thirdPlaceId' => $row['third_place_id'],
            'fourthPlaceId' => $row['fourth_place_id'],
            'topScorer' => $row['top_scorer'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];

        // Add team objects
        if ($row['c_id'] ?? null) {
            $result['champion'] = ['id' => $row['c_id'], 'name' => $row['c_name'], 'flagUrl' => $row['c_flag_url'], 'countryCode' => $row['c_code'], 'group' => $row['c_group']];
        } else {
            $result['champion'] = null;
        }
        if ($row['r_id'] ?? null) {
            $result['runnerUp'] = ['id' => $row['r_id'], 'name' => $row['r_name'], 'flagUrl' => $row['r_flag_url'], 'countryCode' => $row['r_code'], 'group' => $row['r_group']];
        } else {
            $result['runnerUp'] = null;
        }
        if ($row['t_id'] ?? null) {
            $result['thirdPlace'] = ['id' => $row['t_id'], 'name' => $row['t_name'], 'flagUrl' => $row['t_flag_url'], 'countryCode' => $row['t_code'], 'group' => $row['t_group']];
        } else {
            $result['thirdPlace'] = null;
        }
        if ($row['f_id'] ?? null) {
            $result['fourthPlace'] = ['id' => $row['f_id'], 'name' => $row['f_name'], 'flagUrl' => $row['f_flag_url'], 'countryCode' => $row['f_code'], 'group' => $row['f_group']];
        } else {
            $result['fourthPlace'] = null;
        }

        return $result;
    }
}
