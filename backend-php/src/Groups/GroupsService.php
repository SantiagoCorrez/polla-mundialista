<?php

namespace App\Groups;

use App\Config\Database;
use App\Core\AppException;
use PDO;

class GroupsService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getGroupStandings(string $group): array
    {
        $groupUpper = strtoupper($group);

        // Get teams
        $stmt = $this->db->prepare('SELECT * FROM teams WHERE `group` = ?');
        $stmt->execute([$groupUpper]);
        $teams = $stmt->fetchAll();

        if (empty($teams)) {
            throw new AppException("No teams found for group {$groupUpper}", 404);
        }

        // Get finished matches
        $stmt = $this->db->prepare(
            'SELECT * FROM matches
             WHERE phase = ? AND `group` = ? AND status = ? AND home_score IS NOT NULL AND away_score IS NOT NULL'
        );
        $stmt->execute(['GROUP_STAGE', $groupUpper, 'FINISHED']);
        $matches = $stmt->fetchAll();

        // Calculate standings
        $standings = [];
        foreach ($teams as $team) {
            $standings[$team['id']] = [
                'teamId' => $team['id'],
                'teamName' => $team['name'],
                'countryCode' => $team['country_code'],
                'flagUrl' => $team['flag_url'],
                'played' => 0,
                'won' => 0,
                'drawn' => 0,
                'lost' => 0,
                'goalsFor' => 0,
                'goalsAgainst' => 0,
                'goalDifference' => 0,
                'points' => 0,
            ];
        }

        foreach ($matches as $match) {
            $homeId = $match['home_team_id'];
            $awayId = $match['away_team_id'];

            if (!isset($standings[$homeId]) || !isset($standings[$awayId])) continue;

            $homeScore = (int)$match['home_score'];
            $awayScore = (int)$match['away_score'];

            $standings[$homeId]['played']++;
            $standings[$awayId]['played']++;
            $standings[$homeId]['goalsFor'] += $homeScore;
            $standings[$homeId]['goalsAgainst'] += $awayScore;
            $standings[$awayId]['goalsFor'] += $awayScore;
            $standings[$awayId]['goalsAgainst'] += $homeScore;

            if ($homeScore > $awayScore) {
                $standings[$homeId]['won']++;
                $standings[$homeId]['points'] += 3;
                $standings[$awayId]['lost']++;
            } elseif ($homeScore < $awayScore) {
                $standings[$awayId]['won']++;
                $standings[$awayId]['points'] += 3;
                $standings[$homeId]['lost']++;
            } else {
                $standings[$homeId]['drawn']++;
                $standings[$awayId]['drawn']++;
                $standings[$homeId]['points'] += 1;
                $standings[$awayId]['points'] += 1;
            }

            $standings[$homeId]['goalDifference'] = $standings[$homeId]['goalsFor'] - $standings[$homeId]['goalsAgainst'];
            $standings[$awayId]['goalDifference'] = $standings[$awayId]['goalsFor'] - $standings[$awayId]['goalsAgainst'];
        }

        $sorted = array_values($standings);
        usort($sorted, function ($a, $b) {
            if ($b['points'] !== $a['points']) return $b['points'] - $a['points'];
            if ($b['goalDifference'] !== $a['goalDifference']) return $b['goalDifference'] - $a['goalDifference'];
            return $b['goalsFor'] - $a['goalsFor'];
        });

        return $sorted;
    }

    public function getAllGroupStandings(): array
    {
        $groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
        $allStandings = [];

        foreach ($groups as $group) {
            try {
                $allStandings[$group] = $this->getGroupStandings($group);
            } catch (\Throwable) {
                $allStandings[$group] = [];
            }
        }

        return $allStandings;
    }

    public function markQualified(string $group, array $teamIds): array
    {
        if (count($teamIds) < 1 || count($teamIds) > 4) {
            throw new AppException('Must select between 1 and 4 qualified teams', 400);
        }

        $placeholders = implode(',', array_fill(0, count($teamIds), '?'));
        $params = array_merge($teamIds, [strtoupper($group)]);

        $stmt = $this->db->prepare(
            "SELECT * FROM teams WHERE id IN ({$placeholders}) AND `group` = ?"
        );
        $stmt->execute($params);
        $teams = $stmt->fetchAll();

        if (count($teams) !== count($teamIds)) {
            throw new AppException('Some teams do not belong to this group', 400);
        }

        $formattedTeams = array_map(function ($t) {
            return [
                'id' => $t['id'],
                'name' => $t['name'],
                'flagUrl' => $t['flag_url'],
                'countryCode' => $t['country_code'],
                'group' => $t['group'],
            ];
        }, $teams);

        return ['group' => strtoupper($group), 'qualifiedTeams' => $formattedTeams];
    }

    public function getBestThirdPlaced(): array
    {
        $allStandings = $this->getAllGroupStandings();
        $thirdPlaced = [];

        foreach ($allStandings as $group => $standings) {
            if (count($standings) >= 3) {
                $third = $standings[2];
                $third['group'] = $group;
                $thirdPlaced[] = $third;
            }
        }

        usort($thirdPlaced, function ($a, $b) {
            if ($b['points'] !== $a['points']) return $b['points'] - $a['points'];
            if ($b['goalDifference'] !== $a['goalDifference']) return $b['goalDifference'] - $a['goalDifference'];
            return $b['goalsFor'] - $a['goalsFor'];
        });

        return $thirdPlaced;
    }
}
