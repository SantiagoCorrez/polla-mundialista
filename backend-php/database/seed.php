<?php
/**
 * Database Seeder - Polla Mundialista
 *
 * Run: php database/seed.php
 *
 * Seeds the database with:
 * - Admin user (admin / Admin123!)
 * - Test user (testuser / User123!)
 * - 48 teams for World Cup 2026
 * - 72 group stage matches
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Config\Database;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$db = Database::getConnection();

echo "🌱 Starting seed...\n";

// ==================== USERS ====================
$adminHash = password_hash('Admin123!', PASSWORD_BCRYPT, ['cost' => 12]);
$adminId = uuidv4();

$stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute(['admin']);
$existing = $stmt->fetch();

if (!$existing) {
    $db->prepare(
        'INSERT INTO users (id, full_name, username, email, password_hash, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())'
    )->execute([$adminId, 'Administrador', 'admin', 'admin@polla.com', $adminHash, 'ADMIN', 1]);
    echo "👤 Admin created: admin\n";
} else {
    $adminId = $existing['id'];
    echo "👤 Admin verified: admin\n";
}

$userHash = password_hash('User123!', PASSWORD_BCRYPT, ['cost' => 12]);
$testUserId = uuidv4();

$stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute(['testuser']);
$existing = $stmt->fetch();

if (!$existing) {
    $db->prepare(
        'INSERT INTO users (id, full_name, username, email, password_hash, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())'
    )->execute([$testUserId, 'Usuario Test', 'testuser', 'test@polla.com', $userHash, 'USER', 1]);
    echo "👤 Test user created: testuser\n";
}

// ==================== TEAMS ====================
$teams = [
    ['México', 'MX', 'A'],
    ['Sudáfrica', 'ZA', 'A'],
    ['Rep. de Corea', 'KR', 'A'],
    ['Checa', 'CZ', 'A'],
    ['Canadá', 'CA', 'B'],
    ['Bosnia/Herzeg.', 'BA', 'B'],
    ['EE.UU.', 'US', 'D'],
    ['Paraguay', 'PY', 'D'],
    ['Qatar', 'QA', 'B'],
    ['Suiza', 'CH', 'B'],
    ['Brasil', 'BR', 'C'],
    ['Marruecos', 'MA', 'C'],
    ['Haiti', 'HT', 'C'],
    ['Escocia', 'GB-SCT', 'C'],
    ['Australia', 'AU', 'D'],
    ['Turquía', 'TR', 'D'],
    ['Alemania', 'DE', 'E'],
    ['Curazao', 'CW', 'E'],
    ['Países Bajos', 'NL', 'F'],
    ['Japón', 'JP', 'F'],
    ['Costa de Marfil', 'CI', 'E'],
    ['Ecuador', 'EC', 'E'],
    ['Suecia', 'SE', 'F'],
    ['Túnez', 'TN', 'F'],
    ['España', 'ES', 'H'],
    ['Cabo Verde', 'CV', 'H'],
    ['Bélgica', 'BE', 'G'],
    ['Egipto', 'EG', 'G'],
    ['Arabia Saudita', 'SA', 'H'],
    ['Uruguay', 'UY', 'H'],
    ['IR Irán', 'IR', 'G'],
    ['Nueva Zelanda', 'NZ', 'G'],
    ['Francia', 'FR', 'I'],
    ['Senegal', 'SN', 'I'],
    ['Iraq', 'IQ', 'I'],
    ['Noruega', 'NO', 'I'],
    ['Argentina', 'AR', 'J'],
    ['Argelia', 'DZ', 'J'],
    ['Austria', 'AT', 'J'],
    ['Jordán', 'JO', 'J'],
    ['Portugal', 'PT', 'K'],
    ['RD Congo', 'CD', 'K'],
    ['Inglaterra', 'GB-ENG', 'L'],
    ['Croacia', 'HR', 'L'],
    ['Ghana', 'GH', 'L'],
    ['Panamá', 'PA', 'L'],
    ['Uzbekistán', 'UZ', 'K'],
    ['Colombia', 'CO', 'K'],
];

$teamIds = [];
$insertTeam = $db->prepare(
    'INSERT INTO teams (id, name, country_code, `group`, flag_url) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), `group` = VALUES(`group`)'
);
$selectTeam = $db->prepare('SELECT id FROM teams WHERE country_code = ?');

foreach ($teams as [$name, $code, $group]) {
    $selectTeam->execute([$code]);
    $existing = $selectTeam->fetch();

    if ($existing) {
        $teamIds[$name] = $existing['id'];
        // Update
        $db->prepare('UPDATE teams SET name = ?, `group` = ? WHERE id = ?')
           ->execute([$name, $group, $existing['id']]);
    } else {
        $tid = uuidv4();
        $flagUrl = 'https://flagcdn.com/w80/' . strtolower($code) . '.png';
        $insertTeam->execute([$tid, $name, $code, $group, $flagUrl]);
        $teamIds[$name] = $tid;
    }
}
echo "🏴 Inserted/Verified " . count($teams) . " teams\n";

// ==================== MATCHES ====================
$fixtures = [
    ['México', 'Sudáfrica', '2026-06-11 21:00:00', 'Mexico City', 'A'],
    ['Rep. de Corea', 'Checa', '2026-06-12 04:00:00', 'Guadalajara', 'A'],
    ['Canadá', 'Bosnia/Herzeg.', '2026-06-12 21:00:00', 'Toronto', 'B'],
    ['EE.UU.', 'Paraguay', '2026-06-13 03:00:00', 'Los Angeles', 'D'],
    ['Qatar', 'Suiza', '2026-06-13 21:00:00', 'San Francisco Bay Area', 'B'],
    ['Brasil', 'Marruecos', '2026-06-14 00:00:00', 'New York/New Jersey', 'C'],
    ['Haiti', 'Escocia', '2026-06-14 03:00:00', 'Boston', 'C'],
    ['Australia', 'Turquía', '2026-06-14 06:00:00', 'Vancouver', 'D'],
    ['Alemania', 'Curazao', '2026-06-14 19:00:00', 'Houston', 'E'],
    ['Países Bajos', 'Japón', '2026-06-14 22:00:00', 'Dallas', 'F'],
    ['Costa de Marfil', 'Ecuador', '2026-06-15 01:00:00', 'Philadelphia', 'E'],
    ['Suecia', 'Túnez', '2026-06-15 04:00:00', 'Monterrey', 'F'],
    ['España', 'Cabo Verde', '2026-06-15 18:00:00', 'Atlanta', 'H'],
    ['Bélgica', 'Egipto', '2026-06-15 21:00:00', 'Seattle', 'G'],
    ['Arabia Saudita', 'Uruguay', '2026-06-16 00:00:00', 'Miami', 'H'],
    ['IR Irán', 'Nueva Zelanda', '2026-06-16 03:00:00', 'Los Angeles', 'G'],
    ['Francia', 'Senegal', '2026-06-16 21:00:00', 'New York/New Jersey', 'I'],
    ['Iraq', 'Noruega', '2026-06-17 00:00:00', 'Boston', 'I'],
    ['Argentina', 'Argelia', '2026-06-17 03:00:00', 'Kansas City', 'J'],
    ['Austria', 'Jordán', '2026-06-17 06:00:00', 'San Francisco Bay Area', 'J'],
    ['Portugal', 'RD Congo', '2026-06-17 19:00:00', 'Houston', 'K'],
    ['Inglaterra', 'Croacia', '2026-06-17 22:00:00', 'Dallas', 'L'],
    ['Ghana', 'Panamá', '2026-06-18 01:00:00', 'Toronto', 'L'],
    ['Uzbekistán', 'Colombia', '2026-06-18 04:00:00', 'Mexico City', 'K'],
    ['Checa', 'Sudáfrica', '2026-06-18 18:00:00', 'Atlanta', 'A'],
    ['Suiza', 'Bosnia/Herzeg.', '2026-06-18 21:00:00', 'Los Angeles', 'B'],
    ['Canadá', 'Qatar', '2026-06-19 00:00:00', 'Vancouver', 'B'],
    ['México', 'Rep. de Corea', '2026-06-19 03:00:00', 'Guadalajara', 'A'],
    ['EE.UU.', 'Australia', '2026-06-19 21:00:00', 'Seattle', 'D'],
    ['Escocia', 'Marruecos', '2026-06-20 00:00:00', 'Boston', 'C'],
    ['Brasil', 'Haiti', '2026-06-20 03:00:00', 'Philadelphia', 'C'],
    ['Turquía', 'Paraguay', '2026-06-20 06:00:00', 'San Francisco Bay Area', 'D'],
    ['Países Bajos', 'Suecia', '2026-06-20 19:00:00', 'Houston', 'F'],
    ['Alemania', 'Costa de Marfil', '2026-06-20 22:00:00', 'Toronto', 'E'],
    ['Ecuador', 'Curazao', '2026-06-21 02:00:00', 'Kansas City', 'E'],
    ['Túnez', 'Japón', '2026-06-21 06:00:00', 'Monterrey', 'F'],
    ['España', 'Arabia Saudita', '2026-06-21 18:00:00', 'Atlanta', 'H'],
    ['Bélgica', 'IR Irán', '2026-06-21 21:00:00', 'Los Angeles', 'G'],
    ['Uruguay', 'Cabo Verde', '2026-06-22 00:00:00', 'Miami', 'H'],
    ['Nueva Zelanda', 'Egipto', '2026-06-22 03:00:00', 'Vancouver', 'G'],
    ['Argentina', 'Austria', '2026-06-22 19:00:00', 'Dallas', 'J'],
    ['Francia', 'Iraq', '2026-06-22 23:00:00', 'Philadelphia', 'I'],
    ['Noruega', 'Senegal', '2026-06-23 02:00:00', 'New York/New Jersey', 'I'],
    ['Jordán', 'Argelia', '2026-06-23 05:00:00', 'San Francisco Bay Area', 'J'],
    ['Portugal', 'Uzbekistán', '2026-06-23 19:00:00', 'Houston', 'K'],
    ['Inglaterra', 'Ghana', '2026-06-23 22:00:00', 'Boston', 'L'],
    ['Panamá', 'Croacia', '2026-06-24 01:00:00', 'Toronto', 'L'],
    ['Colombia', 'RD Congo', '2026-06-24 04:00:00', 'Guadalajara', 'K'],
    ['Suiza', 'Canadá', '2026-06-24 21:00:00', 'Vancouver', 'B'],
    ['Bosnia/Herzeg.', 'Qatar', '2026-06-24 21:00:00', 'Seattle', 'B'],
    ['Escocia', 'Brasil', '2026-06-25 00:00:00', 'Miami', 'C'],
    ['Marruecos', 'Haiti', '2026-06-25 00:00:00', 'Atlanta', 'C'],
    ['Checa', 'México', '2026-06-25 03:00:00', 'Mexico City', 'A'],
    ['Sudáfrica', 'Rep. de Corea', '2026-06-25 03:00:00', 'Monterrey', 'A'],
    ['Curazao', 'Costa de Marfil', '2026-06-25 22:00:00', 'Philadelphia', 'E'],
    ['Ecuador', 'Alemania', '2026-06-25 22:00:00', 'New York/New Jersey', 'E'],
    ['Japón', 'Suecia', '2026-06-26 01:00:00', 'Dallas', 'F'],
    ['Túnez', 'Países Bajos', '2026-06-26 01:00:00', 'Kansas City', 'F'],
    ['Turquía', 'EE.UU.', '2026-06-26 04:00:00', 'Los Angeles', 'D'],
    ['Paraguay', 'Australia', '2026-06-26 04:00:00', 'San Francisco Bay Area', 'D'],
    ['Noruega', 'Francia', '2026-06-26 21:00:00', 'Boston', 'I'],
    ['Senegal', 'Iraq', '2026-06-26 21:00:00', 'Toronto', 'I'],
    ['Cabo Verde', 'Arabia Saudita', '2026-06-27 02:00:00', 'Houston', 'H'],
    ['Uruguay', 'España', '2026-06-27 02:00:00', 'Guadalajara', 'H'],
    ['Egipto', 'IR Irán', '2026-06-27 05:00:00', 'Seattle', 'G'],
    ['Nueva Zelanda', 'Bélgica', '2026-06-27 05:00:00', 'Vancouver', 'G'],
    ['Panamá', 'Inglaterra', '2026-06-27 23:00:00', 'New York/New Jersey', 'L'],
    ['Croacia', 'Ghana', '2026-06-27 23:00:00', 'Philadelphia', 'L'],
    ['Colombia', 'Portugal', '2026-06-28 01:30:00', 'Miami', 'K'],
    ['RD Congo', 'Uzbekistán', '2026-06-28 01:30:00', 'Atlanta', 'K'],
    ['Argelia', 'Austria', '2026-06-28 04:00:00', 'Kansas City', 'J'],
    ['Jordán', 'Argentina', '2026-06-28 04:00:00', 'Dallas', 'J'],
];

$checkMatch = $db->prepare(
    'SELECT id FROM matches WHERE home_team_id = ? AND away_team_id = ? AND phase = ?'
);
$insertMatch = $db->prepare(
    'INSERT INTO matches (id, home_team_id, away_team_id, phase, `group`, match_date, stadium, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())'
);

$matchCount = 0;
foreach ($fixtures as [$home, $away, $date, $stadium, $group]) {
    $homeId = $teamIds[$home] ?? null;
    $awayId = $teamIds[$away] ?? null;

    if (!$homeId || !$awayId) {
        echo "⚠️  Skipping: {$home} vs {$away} (team not found)\n";
        continue;
    }

    $checkMatch->execute([$homeId, $awayId, 'GROUP_STAGE']);
    if (!$checkMatch->fetch()) {
        $mid = uuidv4();
        $insertMatch->execute([$mid, $homeId, $awayId, 'GROUP_STAGE', $group, $date, $stadium, 'SCHEDULED']);
        $matchCount++;
    }
}

echo "⚽ Inserted {$matchCount} new group stage matches (total fixtures: " . count($fixtures) . ")\n";
echo "✅ Seed completed successfully!\n";

// ==================== UUID FUNCTION ====================
function uuidv4(): string
{
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
