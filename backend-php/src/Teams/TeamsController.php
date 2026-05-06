<?php

namespace App\Teams;

use App\Core\Request;
use App\Core\Response;

class TeamsController
{
    private TeamsService $service;

    public function __construct()
    {
        $this->service = new TeamsService();
    }

    public function getAll(Request $req, Response $res): void
    {
        $teams = $this->service->getAll();
        $res->success($teams);
    }

    public function getByGroup(Request $req, Response $res): void
    {
        $teams = $this->service->getByGroup($req->params['group']);
        $res->success($teams);
    }
}
