<?php

namespace App\Auth;

use App\Core\Request;
use App\Core\Response;
use App\Core\AppException;

class AuthController
{
    private AuthService $service;

    public function __construct()
    {
        $this->service = new AuthService();
    }

    public function register(Request $req, Response $res): void
    {
        $fullName = $req->body['fullName'] ?? null;
        $username = $req->body['username'] ?? null;
        $email = $req->body['email'] ?? null;
        $password = $req->body['password'] ?? null;

        if (!$fullName || !$username || !$email || !$password) {
            throw new AppException('All fields are required: fullName, username, email, password', 400);
        }

        $user = $this->service->register($req->body);
        $res->success($user, 201);
    }

    public function login(Request $req, Response $res): void
    {
        $identifier = $req->body['identifier'] ?? null;
        $password = $req->body['password'] ?? null;

        if (!$identifier || !$password) {
            throw new AppException('Identifier (email/username) and password are required', 400);
        }

        $result = $this->service->login($req->body);

        // Set refresh token cookie
        $res->setCookie('refreshToken', $result['refreshToken'], [
            'expires' => time() + (7 * 24 * 60 * 60),
            'httponly' => true,
            'samesite' => 'Strict',
        ]);

        $res->success([
            'user' => $result['user'],
            'accessToken' => $result['accessToken'],
        ]);
    }

    public function refresh(Request $req, Response $res): void
    {
        $refreshToken = $req->cookies['refreshToken'] ?? $req->body['refreshToken'] ?? null;
        $result = $this->service->refresh($refreshToken);

        $res->setCookie('refreshToken', $result['refreshToken'], [
            'expires' => time() + (7 * 24 * 60 * 60),
            'httponly' => true,
            'samesite' => 'Strict',
        ]);

        $res->success([
            'accessToken' => $result['accessToken'],
        ]);
    }

    public function logout(Request $req, Response $res): void
    {
        $refreshToken = $req->cookies['refreshToken'] ?? $req->body['refreshToken'] ?? null;
        $this->service->logout($refreshToken);
        $res->clearCookie('refreshToken');
        $res->message('Logged out successfully');
    }
}
