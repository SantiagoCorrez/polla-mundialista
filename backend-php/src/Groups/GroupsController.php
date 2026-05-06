<?php

namespace App\Groups;

use App\Core\Request;
use App\Core\Response;

class GroupsController
{
    private GroupsService $service;

    public function __construct()
    {
        $this->service = new GroupsService();
    }

    public function getAllGroupStandings(Request $req, Response $res): void
    {
        $standings = $this->service->getAllGroupStandings();
        $res->success($standings);
    }

    public function getGroupStandings(Request $req, Response $res): void
    {
        $standings = $this->service->getGroupStandings($req->params['group']);
        $res->success($standings);
    }

    public function markQualified(Request $req, Response $res): void
    {
        $teamIds = $req->body['teamIds'] ?? [];
        $result = $this->service->markQualified($req->params['group'], $teamIds);
        $res->success($result);
    }

    public function getBestThirdPlaced(Request $req, Response $res): void
    {
        $thirdPlaced = $this->service->getBestThirdPlaced();
        $res->success($thirdPlaced);
    }
}
