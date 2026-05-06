<?php

namespace App\Users;

use App\Config\Database;
use App\Core\AppException;
use PDO;

class UsersService
{
    private PDO $db;
    private const SALT_COST = 12;
    private const PASSWORD_REGEX = '/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};\':"\\\\|,.<>\/?]).{8,}$/';

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getProfile(string $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, full_name, username, email, role, is_active, created_at FROM users WHERE id = ?'
        );
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            throw new AppException('User not found', 404);
        }

        // Prediction stats
        $stmt = $this->db->prepare('SELECT points, point_type FROM predictions WHERE user_id = ?');
        $stmt->execute([$userId]);
        $predictions = $stmt->fetchAll();

        $totalPoints = 0;
        $exactos = 0;
        $winnerDiff = 0;
        $winnerOnly = 0;
        $none = 0;
        $pending = 0;

        foreach ($predictions as $p) {
            if ($p['points'] !== null) {
                $totalPoints += (int)$p['points'];
                match ($p['point_type']) {
                    'EXACT' => $exactos++,
                    'WINNER_DIFF' => $winnerDiff++,
                    'WINNER' => $winnerOnly++,
                    'NONE' => $none++,
                    default => null,
                };
            } else {
                $pending++;
            }
        }

        $stats = [
            'totalPredictions' => count($predictions),
            'exactos' => $exactos,
            'winnerDiff' => $winnerDiff,
            'winnerOnly' => $winnerOnly,
            'none' => $none,
            'totalPoints' => $totalPoints,
            'pending' => $pending,
        ];

        // Ranking position
        $stmt = $this->db->query(
            'SELECT user_id, COALESCE(SUM(points), 0) as total
             FROM predictions
             WHERE points IS NOT NULL
             GROUP BY user_id
             ORDER BY total DESC'
        );
        $allRanks = $stmt->fetchAll();

        $rankPosition = 'N/A';
        foreach ($allRanks as $i => $r) {
            if ($r['user_id'] === $userId) {
                $rankPosition = $i + 1;
                break;
            }
        }

        return [
            'id' => $user['id'],
            'fullName' => $user['full_name'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'isActive' => (bool)$user['is_active'],
            'createdAt' => $user['created_at'],
            'stats' => $stats,
            'rankPosition' => $rankPosition,
        ];
    }

    public function updateProfile(string $userId, array $data): array
    {
        if (!empty($data['username'])) {
            $stmt = $this->db->prepare('SELECT id FROM users WHERE username = ? AND id != ?');
            $stmt->execute([$data['username'], $userId]);
            if ($stmt->fetch()) {
                throw new AppException('Username already taken', 409);
            }
        }

        $sets = [];
        $params = [];

        if (!empty($data['fullName'])) {
            $sets[] = 'full_name = ?';
            $params[] = $data['fullName'];
        }
        if (!empty($data['username'])) {
            $sets[] = 'username = ?';
            $params[] = $data['username'];
        }

        if (!empty($sets)) {
            $sets[] = 'updated_at = NOW()';
            $params[] = $userId;
            $sql = 'UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?';
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
        }

        $stmt = $this->db->prepare('SELECT id, full_name, username, email, role FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        return [
            'id' => $user['id'],
            'fullName' => $user['full_name'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
        ];
    }

    public function changePassword(string $userId, string $currentPassword, string $newPassword): array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            throw new AppException('User not found', 404);
        }

        if (!password_verify($currentPassword, $user['password_hash'])) {
            throw new AppException('Current password is incorrect', 400);
        }

        if (!preg_match(self::PASSWORD_REGEX, $newPassword)) {
            throw new AppException(
                'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 symbol',
                400
            );
        }

        $hash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => self::SALT_COST]);
        $stmt = $this->db->prepare('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([$hash, $userId]);

        return ['message' => 'Password updated successfully'];
    }

    public function getPredictionHistory(string $userId, ?string $phase = null): array
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
        $sql .= ' ORDER BY m.match_date ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        return array_map([$this, 'formatPredictionFull'], $rows);
    }

    // Admin methods

    public function listUsers(int $page = 1, int $limit = 20, ?string $search = null): array
    {
        $conditions = [];
        $params = [];

        if ($search) {
            $conditions[] = '(u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)';
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
        }

        $where = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';
        $offset = ($page - 1) * $limit;

        // Count
        $countSql = "SELECT COUNT(*) as cnt FROM users u {$where}";
        $stmt = $this->db->prepare($countSql);
        $stmt->execute($params);
        $total = (int)$stmt->fetch()['cnt'];

        // Users
        $sql = "SELECT u.id, u.full_name, u.username, u.email, u.role, u.is_active, u.created_at,
                       (SELECT COUNT(*) FROM predictions WHERE user_id = u.id) as predictions_count,
                       COALESCE((SELECT SUM(points) FROM predictions WHERE user_id = u.id), 0) as total_points
                FROM users u
                {$where}
                ORDER BY u.created_at DESC
                LIMIT {$limit} OFFSET {$offset}";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $users = array_map(function ($row) {
            return [
                'id' => $row['id'],
                'fullName' => $row['full_name'],
                'username' => $row['username'],
                'email' => $row['email'],
                'role' => $row['role'],
                'isActive' => (bool)$row['is_active'],
                'createdAt' => $row['created_at'],
                '_count' => ['predictions' => (int)$row['predictions_count']],
                'totalPoints' => (int)$row['total_points'],
            ];
        }, $rows);

        return [
            'users' => $users,
            'total' => $total,
            'page' => $page,
            'totalPages' => (int)ceil($total / $limit),
        ];
    }

    public function toggleUserActive(string $userId): array
    {
        $stmt = $this->db->prepare('SELECT id, is_active FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            throw new AppException('User not found', 404);
        }

        $newState = !$user['is_active'];
        $stmt = $this->db->prepare('UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([(int)$newState, $userId]);

        $stmt = $this->db->prepare('SELECT id, username, is_active FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $updated = $stmt->fetch();

        return [
            'id' => $updated['id'],
            'username' => $updated['username'],
            'isActive' => (bool)$updated['is_active'],
        ];
    }

    public function setUserRole(string $userId, string $role): array
    {
        $stmt = $this->db->prepare('UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([$role, $userId]);

        $stmt = $this->db->prepare('SELECT id, username, role FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        return [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
        ];
    }

    public function getUserPredictions(string $userId): array
    {
        return $this->getPredictionHistory($userId);
    }

    private function formatPredictionFull(array $row): array
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
}
