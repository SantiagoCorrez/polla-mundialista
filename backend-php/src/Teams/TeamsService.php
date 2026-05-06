<?php

namespace App\Teams;

use App\Config\Database;
use PDO;

class TeamsService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function getAll(): array
    {
        $stmt = $this->db->query('SELECT * FROM teams ORDER BY `group` ASC, name ASC');
        return array_map([$this, 'format'], $stmt->fetchAll());
    }

    public function getByGroup(string $group): array
    {
        $stmt = $this->db->prepare('SELECT * FROM teams WHERE `group` = ? ORDER BY name ASC');
        $stmt->execute([strtoupper($group)]);
        return array_map([$this, 'format'], $stmt->fetchAll());
    }

    public function getById(string $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM teams WHERE id = ?');
        $stmt->execute([$id]);
        $team = $stmt->fetch();
        return $team ? $this->format($team) : null;
    }

    private function format(array $row): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'flagUrl' => $row['flag_url'],
            'countryCode' => $row['country_code'],
            'group' => $row['group'],
        ];
    }
}
