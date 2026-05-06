<?php

namespace App\Users;

use App\Core\Request;
use App\Core\Response;
use App\Core\AppException;

class UsersController
{
    private UsersService $service;

    public function __construct()
    {
        $this->service = new UsersService();
    }

    public function getProfile(Request $req, Response $res): void
    {
        $profile = $this->service->getProfile($req->user['userId']);
        $res->success($profile);
    }

    public function updateProfile(Request $req, Response $res): void
    {
        $user = $this->service->updateProfile($req->user['userId'], [
            'fullName' => $req->body['fullName'] ?? null,
            'username' => $req->body['username'] ?? null,
        ]);
        $res->success($user);
    }

    public function changePassword(Request $req, Response $res): void
    {
        $current = $req->body['currentPassword'] ?? null;
        $new = $req->body['newPassword'] ?? null;

        if (!$current || !$new) {
            throw new AppException('Current and new password are required', 400);
        }

        $result = $this->service->changePassword($req->user['userId'], $current, $new);
        $res->success($result);
    }

    public function getPredictionHistory(Request $req, Response $res): void
    {
        $phase = $req->query['phase'] ?? null;
        $predictions = $this->service->getPredictionHistory($req->user['userId'], $phase);
        $res->success($predictions);
    }

    // Admin
    public function listUsers(Request $req, Response $res): void
    {
        $page = (int)($req->query['page'] ?? 1);
        $limit = (int)($req->query['limit'] ?? 20);
        $search = $req->query['search'] ?? null;
        $result = $this->service->listUsers($page, $limit, $search);
        $res->success($result);
    }

    public function toggleUserActive(Request $req, Response $res): void
    {
        $user = $this->service->toggleUserActive($req->params['id']);
        $res->success($user);
    }

    public function setUserRole(Request $req, Response $res): void
    {
        $role = $req->body['role'] ?? '';
        if (!in_array($role, ['USER', 'ADMIN'])) {
            throw new AppException('Invalid role. Must be USER or ADMIN', 400);
        }
        $user = $this->service->setUserRole($req->params['id'], $role);
        $res->success($user);
    }

    public function getUserPredictions(Request $req, Response $res): void
    {
        $predictions = $this->service->getUserPredictions($req->params['id']);
        $res->success($predictions);
    }
}
