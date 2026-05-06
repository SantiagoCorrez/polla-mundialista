<?php

namespace App\Reports;

use App\Config\Database;
use App\Core\AppException;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Color;
use TCPDF;
use PDO;

class ReportsService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    // ==================== EXCEL REPORTS ====================

    public function generateRankingExcel(): void
    {
        $stmt = $this->db->query(
            'SELECT u.full_name, u.username, u.email,
                    p.points, p.point_type
             FROM users u
             LEFT JOIN predictions p ON p.user_id = u.id AND p.points IS NOT NULL
             WHERE u.is_active = 1'
        );
        $rows = $stmt->fetchAll();

        // Group by user
        $users = [];
        foreach ($rows as $row) {
            $key = $row['username'];
            if (!isset($users[$key])) {
                $users[$key] = [
                    'fullName' => $row['full_name'],
                    'username' => $row['username'],
                    'email' => $row['email'],
                    'totalPoints' => 0,
                    'exactos' => 0,
                    'winnerDiff' => 0,
                    'winnerOnly' => 0,
                    'none' => 0,
                ];
            }
            if ($row['points'] !== null) {
                $users[$key]['totalPoints'] += (int)$row['points'];
                match ($row['point_type']) {
                    'EXACT' => $users[$key]['exactos']++,
                    'WINNER_DIFF' => $users[$key]['winnerDiff']++,
                    'WINNER' => $users[$key]['winnerOnly']++,
                    'NONE' => $users[$key]['none']++,
                    default => null,
                };
            }
        }

        $rankings = array_values($users);
        usort($rankings, fn($a, $b) => $b['totalPoints'] - $a['totalPoints']);

        $spreadsheet = new Spreadsheet();
        $spreadsheet->getProperties()->setCreator('Polla Mundialista');
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Ranking General');

        // Headers
        $headers = ['Posición', 'Nombre', 'Username', 'Email', 'Pts Totales', 'Exactos (5)', 'Ganador+Dif (3)', 'Solo Ganador (1)', 'Sin Puntos (0)'];
        $widths = [10, 25, 18, 30, 12, 12, 16, 16, 14];

        foreach ($headers as $i => $header) {
            $col = chr(65 + $i);
            $sheet->setCellValue("{$col}1", $header);
            $sheet->getColumnDimension($col)->setWidth($widths[$i]);
        }

        // Style header
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF1A472A']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ];
        $sheet->getStyle('A1:I1')->applyFromArray($headerStyle);

        // Data
        foreach ($rankings as $i => $r) {
            $row = $i + 2;
            $sheet->setCellValue("A{$row}", $i + 1);
            $sheet->setCellValue("B{$row}", $r['fullName']);
            $sheet->setCellValue("C{$row}", $r['username']);
            $sheet->setCellValue("D{$row}", $r['email']);
            $sheet->setCellValue("E{$row}", $r['totalPoints']);
            $sheet->setCellValue("F{$row}", $r['exactos']);
            $sheet->setCellValue("G{$row}", $r['winnerDiff']);
            $sheet->setCellValue("H{$row}", $r['winnerOnly']);
            $sheet->setCellValue("I{$row}", $r['none']);

            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:I{$row}")->getFill()
                    ->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF0F0F0');
            }
        }

        $this->sendExcel($spreadsheet, 'ranking_general.xlsx');
    }

    public function generateMatchPredictionsExcel(string $matchId): void
    {
        $stmt = $this->db->prepare(
            'SELECT m.*, ht.name as home_name, at2.name as away_name
             FROM matches m
             JOIN teams ht ON ht.id = m.home_team_id
             JOIN teams at2 ON at2.id = m.away_team_id
             WHERE m.id = ?'
        );
        $stmt->execute([$matchId]);
        $match = $stmt->fetch();

        if (!$match) {
            throw new AppException('Match not found', 404);
        }

        $stmt = $this->db->prepare(
            'SELECT p.*, u.username, u.full_name
             FROM predictions p
             JOIN users u ON u.id = p.user_id
             WHERE p.match_id = ?
             ORDER BY p.created_at ASC'
        );
        $stmt->execute([$matchId]);
        $predictions = $stmt->fetchAll();

        $spreadsheet = new Spreadsheet();
        $title = substr("{$match['home_name']} vs {$match['away_name']}", 0, 31);
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle($title);

        $headers = ['Username', 'Pred Local', 'Pred Visit', 'Resultado Pred', 'Resultado Real', 'Puntos', 'Tipo'];
        $widths = [18, 12, 12, 15, 15, 10, 15];

        foreach ($headers as $i => $h) {
            $col = chr(65 + $i);
            $sheet->setCellValue("{$col}1", $h);
            $sheet->getColumnDimension($col)->setWidth($widths[$i]);
        }

        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF1A472A']],
        ];
        $sheet->getStyle('A1:G1')->applyFromArray($headerStyle);

        foreach ($predictions as $i => $pred) {
            $row = $i + 2;
            $resultReal = $match['home_score'] !== null
                ? "{$match['home_score']} - {$match['away_score']}"
                : 'Pendiente';

            $sheet->setCellValue("A{$row}", $pred['username']);
            $sheet->setCellValue("B{$row}", $pred['predicted_home']);
            $sheet->setCellValue("C{$row}", $pred['predicted_away']);
            $sheet->setCellValue("D{$row}", "{$pred['predicted_home']} - {$pred['predicted_away']}");
            $sheet->setCellValue("E{$row}", $resultReal);
            $sheet->setCellValue("F{$row}", $pred['points'] ?? '-');
            $sheet->setCellValue("G{$row}", $pred['point_type'] ?? '-');
        }

        $this->sendExcel($spreadsheet, "predicciones_partido_{$matchId}.xlsx");
    }

    public function generateTournamentPredictionsExcel(): void
    {
        $stmt = $this->db->query(
            'SELECT tp.*,
                    u.full_name as u_full_name, u.username as u_username,
                    c.name as c_name, r.name as r_name, t.name as t_name, f.name as f_name
             FROM tournament_predictions tp
             JOIN users u ON u.id = tp.user_id
             LEFT JOIN teams c ON c.id = tp.champion_id
             LEFT JOIN teams r ON r.id = tp.runner_up_id
             LEFT JOIN teams t ON t.id = tp.third_place_id
             LEFT JOIN teams f ON f.id = tp.fourth_place_id
             ORDER BY u.full_name ASC'
        );
        $rows = $stmt->fetchAll();

        $spreadsheet = new Spreadsheet();
        $spreadsheet->getProperties()->setCreator('Polla Mundialista');
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Predicciones Top 4 y Goleador');

        $headers = ['Nombre', 'Username', 'Campeón', 'Subcampeón', '3er Lugar', '4to Lugar', 'Goleador', 'Fecha Carga'];
        $widths = [25, 18, 18, 18, 18, 18, 20, 15];

        foreach ($headers as $i => $h) {
            $col = chr(65 + $i);
            $sheet->setCellValue("{$col}1", $h);
            $sheet->getColumnDimension($col)->setWidth($widths[$i]);
        }

        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF1A472A']],
        ];
        $sheet->getStyle('A1:H1')->applyFromArray($headerStyle);

        foreach ($rows as $i => $pred) {
            $row = $i + 2;
            $sheet->setCellValue("A{$row}", $pred['u_full_name']);
            $sheet->setCellValue("B{$row}", $pred['u_username']);
            $sheet->setCellValue("C{$row}", $pred['c_name'] ?? '-');
            $sheet->setCellValue("D{$row}", $pred['r_name'] ?? '-');
            $sheet->setCellValue("E{$row}", $pred['t_name'] ?? '-');
            $sheet->setCellValue("F{$row}", $pred['f_name'] ?? '-');
            $sheet->setCellValue("G{$row}", $pred['top_scorer'] ?? '-');
            $sheet->setCellValue("H{$row}", substr($pred['updated_at'], 0, 10));
        }

        $this->sendExcel($spreadsheet, 'predicciones_fase_final.xlsx');
    }

    // ==================== PDF REPORTS ====================

    public function generatePollaSummaryPdf(): void
    {
        $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
        $pdf->SetCreator('Polla Mundialista');
        $pdf->SetTitle('Resumen Polla Mundialista');
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(15, 15, 15);
        $pdf->AddPage();

        // Title
        $pdf->SetFont('helvetica', 'B', 22);
        $pdf->SetTextColor(26, 71, 42);
        $pdf->Cell(0, 12, 'POLLA MUNDIALISTA 2026', 0, 1, 'C');
        $pdf->SetFont('helvetica', '', 13);
        $pdf->SetTextColor(102, 102, 102);
        $pdf->Cell(0, 8, 'Resumen General del Torneo', 0, 1, 'C');
        $pdf->Ln(8);

        // Stats
        $totalUsers = $this->countQuery('SELECT COUNT(*) FROM users WHERE is_active = 1');
        $totalPredictions = $this->countQuery('SELECT COUNT(*) FROM predictions');
        $totalMatches = $this->countQuery('SELECT COUNT(*) FROM matches');
        $finishedMatches = $this->countQuery("SELECT COUNT(*) FROM matches WHERE status = 'FINISHED'");
        $percent = $totalMatches > 0 ? round($finishedMatches / $totalMatches * 100) : 0;

        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->SetTextColor(26, 71, 42);
        $pdf->Cell(0, 8, 'Estadisticas Generales', 0, 1);
        $pdf->SetFont('helvetica', '', 11);
        $pdf->SetTextColor(51, 51, 51);
        $pdf->Cell(0, 6, "Total Usuarios: {$totalUsers}", 0, 1);
        $pdf->Cell(0, 6, "Total Predicciones: {$totalPredictions}", 0, 1);
        $pdf->Cell(0, 6, "Partidos Totales: {$totalMatches}", 0, 1);
        $pdf->Cell(0, 6, "Partidos Finalizados: {$finishedMatches} ({$percent}%)", 0, 1);
        $pdf->Ln(6);

        // Top 10
        $stmt = $this->db->query(
            'SELECT u.full_name, u.username,
                    COALESCE(SUM(p.points), 0) as total_points,
                    SUM(CASE WHEN p.point_type = \'EXACT\' THEN 1 ELSE 0 END) as exactos
             FROM users u
             LEFT JOIN predictions p ON p.user_id = u.id AND p.points IS NOT NULL
             WHERE u.is_active = 1
             GROUP BY u.id, u.full_name, u.username
             ORDER BY total_points DESC
             LIMIT 10'
        );
        $topUsers = $stmt->fetchAll();

        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->SetTextColor(26, 71, 42);
        $pdf->Cell(0, 8, 'Top 10 Ranking', 0, 1);
        $pdf->Ln(2);

        // Table header
        $pdf->SetFillColor(26, 71, 42);
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetFont('helvetica', 'B', 9);
        $pdf->Cell(12, 7, '#', 1, 0, 'C', true);
        $pdf->Cell(55, 7, 'Nombre', 1, 0, 'L', true);
        $pdf->Cell(40, 7, 'Username', 1, 0, 'L', true);
        $pdf->Cell(30, 7, 'Puntos', 1, 0, 'C', true);
        $pdf->Cell(30, 7, 'Exactos', 1, 0, 'C', true);
        $pdf->Ln();

        $pdf->SetFont('helvetica', '', 9);
        $pdf->SetTextColor(51, 51, 51);

        foreach ($topUsers as $i => $u) {
            $fill = ($i % 2 === 0);
            if ($fill) {
                $pdf->SetFillColor(240, 240, 240);
            }
            $pdf->Cell(12, 6, $i + 1, 1, 0, 'C', $fill);
            $pdf->Cell(55, 6, $u['full_name'], 1, 0, 'L', $fill);
            $pdf->Cell(40, 6, $u['username'], 1, 0, 'L', $fill);
            $pdf->Cell(30, 6, $u['total_points'], 1, 0, 'C', $fill);
            $pdf->Cell(30, 6, $u['exactos'], 1, 0, 'C', $fill);
            $pdf->Ln();
        }

        // Finished matches
        $stmt = $this->db->query(
            "SELECT m.*, ht.name as home_name, at2.name as away_name,
                    (SELECT COUNT(*) FROM predictions WHERE match_id = m.id) as pred_count
             FROM matches m
             JOIN teams ht ON ht.id = m.home_team_id
             JOIN teams at2 ON at2.id = m.away_team_id
             WHERE m.status = 'FINISHED'
             ORDER BY m.match_date ASC
             LIMIT 20"
        );
        $finished = $stmt->fetchAll();

        if (!empty($finished)) {
            $pdf->AddPage();
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->SetTextColor(26, 71, 42);
            $pdf->Cell(0, 8, 'Partidos Finalizados (ultimos 20)', 0, 1);
            $pdf->Ln(2);
            $pdf->SetFont('helvetica', '', 10);
            $pdf->SetTextColor(51, 51, 51);

            foreach ($finished as $m) {
                $line = "{$m['home_name']} {$m['home_score']} - {$m['away_score']} {$m['away_name']}  |  " .
                        "Predicciones: {$m['pred_count']}  |  {$m['phase']}";
                $pdf->Cell(0, 6, $line, 0, 1);
            }
        }

        $this->sendPdf($pdf, 'resumen_polla.pdf');
    }

    public function generateUserPredictionsPdf(string $userId): void
    {
        $stmt = $this->db->prepare('SELECT full_name, username, email FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            throw new AppException('User not found', 404);
        }

        $stmt = $this->db->prepare(
            'SELECT p.*, m.phase, m.home_score, m.away_score,
                    ht.name as home_name, at2.name as away_name
             FROM predictions p
             JOIN matches m ON m.id = p.match_id
             JOIN teams ht ON ht.id = m.home_team_id
             JOIN teams at2 ON at2.id = m.away_team_id
             WHERE p.user_id = ?
             ORDER BY m.match_date ASC'
        );
        $stmt->execute([$userId]);
        $predictions = $stmt->fetchAll();

        $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
        $pdf->SetCreator('Polla Mundialista');
        $pdf->SetTitle("Predicciones - {$user['username']}");
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(15, 15, 15);
        $pdf->AddPage();

        // Header
        $pdf->SetFont('helvetica', 'B', 18);
        $pdf->SetTextColor(26, 71, 42);
        $pdf->Cell(0, 10, 'Predicciones del Usuario', 0, 1, 'C');
        $pdf->SetFont('helvetica', '', 13);
        $pdf->SetTextColor(102, 102, 102);
        $pdf->Cell(0, 8, "{$user['full_name']} (@{$user['username']})", 0, 1, 'C');
        $pdf->Ln(6);

        // Stats
        $totalPoints = array_sum(array_map(fn($p) => (int)($p['points'] ?? 0), $predictions));
        $exactos = count(array_filter($predictions, fn($p) => $p['point_type'] === 'EXACT'));
        $winnerDiff = count(array_filter($predictions, fn($p) => $p['point_type'] === 'WINNER_DIFF'));
        $winnerOnly = count(array_filter($predictions, fn($p) => $p['point_type'] === 'WINNER'));

        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->SetTextColor(26, 71, 42);
        $pdf->Cell(0, 7, 'Resumen:', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->SetTextColor(51, 51, 51);
        $pdf->Cell(0, 6, "Total: " . count($predictions) . "  |  Puntos: {$totalPoints}  |  Exactos: {$exactos}  |  Ganador+Dif: {$winnerDiff}  |  Solo Ganador: {$winnerOnly}", 0, 1);
        $pdf->Ln(6);

        // Group by phase
        $phaseLabels = [
            'GROUP_STAGE' => 'Fase de Grupos',
            'ROUND_OF_32' => 'Dieciseisavos',
            'ROUND_OF_16' => 'Octavos de Final',
            'QUARTER' => 'Cuartos de Final',
            'SEMI' => 'Semifinales',
            'THIRD' => 'Tercer Puesto',
            'FINAL' => 'Final',
        ];

        $grouped = [];
        foreach ($predictions as $pred) {
            $grouped[$pred['phase']][] = $pred;
        }

        foreach ($phaseLabels as $phase => $label) {
            if (!isset($grouped[$phase])) continue;

            $pdf->SetFont('helvetica', 'B', 11);
            $pdf->SetTextColor(26, 71, 42);
            $pdf->Cell(0, 7, $label, 0, 1);

            foreach ($grouped[$phase] as $pred) {
                $icon = match ($pred['point_type']) {
                    'EXACT' => '[5]',
                    'WINNER_DIFF' => '[3]',
                    'WINNER' => '[1]',
                    'NONE' => '[0]',
                    default => '[?]',
                };

                $realScore = $pred['home_score'] !== null
                    ? "{$pred['home_score']}-{$pred['away_score']}"
                    : 'Pendiente';

                $line = "{$icon} {$pred['home_name']} vs {$pred['away_name']}  |  " .
                        "Pred: {$pred['predicted_home']}-{$pred['predicted_away']}  |  " .
                        "Real: {$realScore}  |  Pts: " . ($pred['points'] ?? '-');

                $pdf->SetFont('helvetica', '', 9);
                $pdf->SetTextColor(51, 51, 51);
                $pdf->Cell(0, 5, $line, 0, 1);
            }
            $pdf->Ln(3);
        }

        $this->sendPdf($pdf, "predicciones_{$user['username']}.pdf");
    }

    // ==================== DASHBOARD STATS ====================

    public function getDashboardStats(): array
    {
        $totalUsers = $this->countQuery('SELECT COUNT(*) FROM users WHERE is_active = 1');
        $totalPredictions = $this->countQuery('SELECT COUNT(*) FROM predictions');
        $totalMatches = $this->countQuery('SELECT COUNT(*) FROM matches');
        $finishedMatches = $this->countQuery("SELECT COUNT(*) FROM matches WHERE status = 'FINISHED'");

        // Match with most predictions
        $stmt = $this->db->query(
            'SELECT m.id, ht.name as home_name, at2.name as away_name,
                    (SELECT COUNT(*) FROM predictions WHERE match_id = m.id) as pred_count
             FROM matches m
             JOIN teams ht ON ht.id = m.home_team_id
             JOIN teams at2 ON at2.id = m.away_team_id
             ORDER BY pred_count DESC
             LIMIT 1'
        );
        $topMatch = $stmt->fetch();

        // Average points
        $stmt = $this->db->query(
            'SELECT u.id, COALESCE(SUM(p.points), 0) as total
             FROM users u
             LEFT JOIN predictions p ON p.user_id = u.id AND p.points IS NOT NULL
             WHERE u.is_active = 1
             GROUP BY u.id'
        );
        $allTotals = array_column($stmt->fetchAll(), 'total');
        $avgPoints = count($allTotals) > 0
            ? round(array_sum($allTotals) / count($allTotals), 1)
            : 0;

        // Last match distribution
        $lastMatchDistribution = null;
        $stmt = $this->db->query(
            "SELECT m.id, ht.name as home_name, at2.name as away_name
             FROM matches m
             JOIN teams ht ON ht.id = m.home_team_id
             JOIN teams at2 ON at2.id = m.away_team_id
             WHERE m.status = 'FINISHED'
             ORDER BY m.match_date DESC
             LIMIT 1"
        );
        $lastFinished = $stmt->fetch();

        if ($lastFinished) {
            $stmt = $this->db->prepare(
                'SELECT point_type, COUNT(*) as cnt
                 FROM predictions
                 WHERE match_id = ? AND points IS NOT NULL
                 GROUP BY point_type'
            );
            $stmt->execute([$lastFinished['id']]);
            $dist = $stmt->fetchAll();

            $lastMatchDistribution = [
                'match' => "{$lastFinished['home_name']} vs {$lastFinished['away_name']}",
                'distribution' => array_map(fn($d) => ['type' => $d['point_type'], 'count' => (int)$d['cnt']], $dist),
            ];
        }

        return [
            'totalUsers' => $totalUsers,
            'totalPredictions' => $totalPredictions,
            'totalMatches' => $totalMatches,
            'finishedMatches' => $finishedMatches,
            'percentFinished' => $totalMatches > 0 ? round($finishedMatches / $totalMatches * 100) : 0,
            'matchWithMostPredictions' => $topMatch ? [
                'matchName' => "{$topMatch['home_name']} vs {$topMatch['away_name']}",
                'predictionCount' => (int)$topMatch['pred_count'],
            ] : null,
            'averagePointsPerUser' => (float)$avgPoints,
            'lastMatchDistribution' => $lastMatchDistribution,
        ];
    }

    // ==================== HELPERS ====================

    private function countQuery(string $sql): int
    {
        $stmt = $this->db->query($sql);
        return (int)$stmt->fetchColumn();
    }

    private function sendExcel(Spreadsheet $spreadsheet, string $filename): void
    {
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header("Content-Disposition: attachment; filename={$filename}");
        header('Cache-Control: max-age=0');

        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
        exit;
    }

    private function sendPdf(TCPDF $pdf, string $filename): void
    {
        $pdf->Output($filename, 'D');
        exit;
    }
}
