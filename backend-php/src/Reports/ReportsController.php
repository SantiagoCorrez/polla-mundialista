<?php

namespace App\Reports;

use App\Core\Request;
use App\Core\Response;

class ReportsController
{
    private ReportsService $service;

    public function __construct()
    {
        $this->service = new ReportsService();
    }

    public function getDashboardStats(Request $req, Response $res): void
    {
        $stats = $this->service->getDashboardStats();
        $res->success($stats);
    }

    public function getRankingExcel(Request $req, Response $res): void
    {
        $this->service->generateRankingExcel();
    }

    public function getTournamentPredictionsExcel(Request $req, Response $res): void
    {
        $this->service->generateTournamentPredictionsExcel();
    }

    public function getMatchPredictionsExcel(Request $req, Response $res): void
    {
        $this->service->generateMatchPredictionsExcel($req->params['matchId']);
    }

    public function getPollaSummaryPdf(Request $req, Response $res): void
    {
        $this->service->generatePollaSummaryPdf();
    }

    public function getUserPredictionsPdf(Request $req, Response $res): void
    {
        $this->service->generateUserPredictionsPdf($req->params['userId']);
    }
}
