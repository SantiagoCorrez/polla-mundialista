<?php

namespace App\Ranking;

use App\Core\Request;
use App\Core\Response;

class RankingController
{
    private RankingService $service;

    public function __construct()
    {
        $this->service = new RankingService();
    }

    public function getGlobalRanking(Request $req, Response $res): void
    {
        $page = (int)($req->query['page'] ?? 1);
        $limit = (int)($req->query['limit'] ?? 20);
        $phase = $req->query['phase'] ?? null;
        $search = $req->query['search'] ?? null;
        $result = $this->service->getGlobalRanking($page, $limit, $phase, $search);
        $res->success($result);
    }

    public function getMyPosition(Request $req, Response $res): void
    {
        $position = $this->service->getUserPosition($req->user['userId']);
        $res->success($position);
    }
}
