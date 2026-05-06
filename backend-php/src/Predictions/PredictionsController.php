<?php

namespace App\Predictions;

use App\Core\Request;
use App\Core\Response;
use App\Core\AppException;

class PredictionsController
{
    private PredictionsService $service;

    public function __construct()
    {
        $this->service = new PredictionsService();
    }

    public function create(Request $req, Response $res): void
    {
        $matchId = $req->body['matchId'] ?? null;
        $predictedHome = $req->body['predictedHome'] ?? null;
        $predictedAway = $req->body['predictedAway'] ?? null;

        if (!$matchId || $predictedHome === null || $predictedAway === null) {
            throw new AppException('matchId, predictedHome, and predictedAway are required', 400);
        }

        $prediction = $this->service->create(
            $req->user['userId'],
            $matchId,
            (int)$predictedHome,
            (int)$predictedAway
        );
        $res->success($prediction, 201);
    }

    public function update(Request $req, Response $res): void
    {
        $predictedHome = $req->body['predictedHome'] ?? null;
        $predictedAway = $req->body['predictedAway'] ?? null;

        if ($predictedHome === null || $predictedAway === null) {
            throw new AppException('predictedHome and predictedAway are required', 400);
        }

        $prediction = $this->service->update(
            $req->user['userId'],
            $req->params['matchId'],
            (int)$predictedHome,
            (int)$predictedAway
        );
        $res->success($prediction);
    }

    public function getMyPredictions(Request $req, Response $res): void
    {
        $phase = $req->query['phase'] ?? null;
        $group = $req->query['group'] ?? null;
        $predictions = $this->service->getMyPredictions($req->user['userId'], $phase, $group);
        $res->success($predictions);
    }

    public function getMyPredictionForMatch(Request $req, Response $res): void
    {
        $prediction = $this->service->getMyPredictionForMatch(
            $req->user['userId'],
            $req->params['matchId']
        );
        $res->success($prediction);
    }

    public function getTournamentPrediction(Request $req, Response $res): void
    {
        $prediction = $this->service->getTournamentPrediction($req->user['userId']);
        $res->success($prediction);
    }

    public function upsertTournamentPrediction(Request $req, Response $res): void
    {
        $prediction = $this->service->upsertTournamentPrediction($req->user['userId'], $req->body);
        $res->success($prediction);
    }

    public function getAllTournamentPredictions(Request $req, Response $res): void
    {
        $predictions = $this->service->getAllTournamentPredictions();
        $res->success($predictions);
    }
}
