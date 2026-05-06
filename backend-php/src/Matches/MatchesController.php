<?php

namespace App\Matches;

use App\Core\Request;
use App\Core\Response;
use App\Core\AppException;

class MatchesController
{
    private MatchesService $service;

    public function __construct()
    {
        $this->service = new MatchesService();
    }

    public function getAll(Request $req, Response $res): void
    {
        $phase = $req->query['phase'] ?? null;
        $group = $req->query['group'] ?? null;
        $matches = $this->service->getAll($phase, $group);
        $res->success($matches);
    }

    public function getById(Request $req, Response $res): void
    {
        $match = $this->service->getById($req->params['id']);
        $res->success($match);
    }

    public function create(Request $req, Response $res): void
    {
        $homeTeamId = $req->body['homeTeamId'] ?? null;
        $awayTeamId = $req->body['awayTeamId'] ?? null;
        $phase = $req->body['phase'] ?? null;
        $matchDate = $req->body['matchDate'] ?? null;

        if (!$homeTeamId || !$awayTeamId || !$phase || !$matchDate) {
            throw new AppException('homeTeamId, awayTeamId, phase, and matchDate are required', 400);
        }

        $match = $this->service->create($req->body);
        $res->success($match, 201);
    }

    public function update(Request $req, Response $res): void
    {
        $match = $this->service->update($req->params['id'], $req->body);
        $res->success($match);
    }

    public function delete(Request $req, Response $res): void
    {
        $result = $this->service->delete($req->params['id']);
        $res->success($result);
    }

    public function registerResult(Request $req, Response $res): void
    {
        if (!isset($req->body['homeScore']) || !isset($req->body['awayScore'])) {
            throw new AppException('homeScore and awayScore are required', 400);
        }
        $result = $this->service->registerResult($req->params['id'], $req->body);
        $res->success($result);
    }

    public function getMatchPredictions(Request $req, Response $res): void
    {
        $predictions = $this->service->getMatchPredictions($req->params['id']);
        $res->success($predictions);
    }

    public function generateKnockoutBracket(Request $req, Response $res): void
    {
        $phase = $req->body['phase'] ?? null;
        $matchups = $req->body['matchups'] ?? null;

        if (!$phase || !$matchups || !is_array($matchups)) {
            throw new AppException('phase and matchups array are required', 400);
        }

        $matches = $this->service->generateKnockoutBracket($phase, $matchups);
        $res->success($matches, 201);
    }
}
