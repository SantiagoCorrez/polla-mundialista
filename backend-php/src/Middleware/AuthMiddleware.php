<?php

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;
use App\Core\AppException;
use App\Auth\JwtUtils;

class AuthMiddleware
{
    public function handle(Request $request, Response $response): void
    {
        $token = $request->getBearerToken();

        if (!$token) {
            throw new AppException('Access token required', 401);
        }

        try {
            $payload = JwtUtils::verifyAccessToken($token);
            $request->user = [
                'userId' => $payload->userId,
                'role' => $payload->role,
            ];
        } catch (\Exception $e) {
            $message = $e->getMessage();
            if (str_contains($message, 'Expired')) {
                throw new AppException('Access token expired', 401);
            }
            throw new AppException('Invalid access token', 401);
        }
    }
}
