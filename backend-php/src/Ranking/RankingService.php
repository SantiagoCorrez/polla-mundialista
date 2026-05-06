<?php

namespace App\Ranking;

use App\Config\Database;
use PDO;

class RankingService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getGlobalRanking(int $page = 1, int $limit = 20, ?string $phase = null, ?string $search = null): array
    {
        $sql = 'SELECT u.id, u.full_name, u.username,
                       p.points, p.point_type
                FROM users u
                LEFT JOIN predictions p ON p.user_id = u.id AND p.points IS NOT NULL';

        $conditions = ['u.is_active = 1'];
        $params = [];

        if ($phase) {
            $sql .= ' LEFT JOIN matches m ON m.id = p.match_id';
        }

        if ($search) {
            $conditions[] = '(u.username LIKE ? OR u.full_name LIKE ?)';
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
        }

        if ($phase) {
            $conditions[] = '(m.phase = ? OR p.id IS NULL)';
            $params[] = $phase;
        }

        if (!empty($conditions)) {
            // Rebuild SQL with conditions properly placed
            if ($phase) {
                $sql = 'SELECT u.id, u.full_name, u.username,
                               p.points, p.point_type
                        FROM users u
                        LEFT JOIN predictions p ON p.user_id = u.id AND p.points IS NOT NULL
                        LEFT JOIN matches m ON m.id = p.match_id
                        WHERE ' . implode(' AND ', $conditions);
            } else {
                $sql .= ' WHERE ' . implode(' AND ', $conditions);
            }
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        // Group by user and calculate stats
        $users = [];
        foreach ($rows as $row) {
            $uid = $row['id'];
            if (!isset($users[$uid])) {
                $users[$uid] = [
                    'userId' => $uid,
                    'fullName' => $row['full_name'],
                    'username' => $row['username'],
                    'totalPoints' => 0,
                    'exactos' => 0,
                    'winnerDiff' => 0,
                    'winnerOnly' => 0,
                    'none' => 0,
                    'totalPredictions' => 0,
                ];
            }

            if ($row['points'] !== null) {
                $users[$uid]['totalPoints'] += (int)$row['points'];
                $users[$uid]['totalPredictions']++;

                match ($row['point_type']) {
                    'EXACT' => $users[$uid]['exactos']++,
                    'WINNER_DIFF' => $users[$uid]['winnerDiff']++,
                    'WINNER' => $users[$uid]['winnerOnly']++,
                    'NONE' => $users[$uid]['none']++,
                    default => null,
                };
            }
        }

        $rankings = array_values($users);

        // Sort
        usort($rankings, function ($a, $b) {
            if ($b['totalPoints'] !== $a['totalPoints']) return $b['totalPoints'] - $a['totalPoints'];
            if ($b['exactos'] !== $a['exactos']) return $b['exactos'] - $a['exactos'];
            if ($b['winnerDiff'] !== $a['winnerDiff']) return $b['winnerDiff'] - $a['winnerDiff'];
            return $b['winnerOnly'] - $a['winnerOnly'];
        });

        // Add positions
        foreach ($rankings as $i => &$r) {
            $r['position'] = $i + 1;
        }
        unset($r);

        $total = count($rankings);
        $offset = ($page - 1) * $limit;
        $paginated = array_slice($rankings, $offset, $limit);

        return [
            'rankings' => $paginated,
            'total' => $total,
            'page' => $page,
            'totalPages' => (int)ceil($total / $limit),
        ];
    }

    public function getUserPosition(string $userId): array
    {
        $stmt = $this->db->query(
            'SELECT u.id, COALESCE(SUM(p.points), 0) as total_points
             FROM users u
             LEFT JOIN predictions p ON p.user_id = u.id AND p.points IS NOT NULL
             WHERE u.is_active = 1
             GROUP BY u.id
             ORDER BY total_points DESC'
        );
        $rows = $stmt->fetchAll();

        $position = null;
        $totalPoints = 0;
        foreach ($rows as $i => $row) {
            if ($row['id'] === $userId) {
                $position = $i + 1;
                $totalPoints = (int)$row['total_points'];
                break;
            }
        }

        return [
            'position' => $position,
            'totalPoints' => $totalPoints,
            'totalUsers' => count($rows),
        ];
    }
}
