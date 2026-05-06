<?php

namespace App\Auth;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtUtils
{
    public static function generateAccessToken(array $payload): string
    {
        $secret = $_ENV['JWT_ACCESS_SECRET'] ?? 'default-access-secret';
        $expiration = (int)($_ENV['JWT_ACCESS_EXPIRATION'] ?? 900);

        $tokenPayload = [
            'userId' => $payload['userId'],
            'role' => $payload['role'],
            'iat' => time(),
            'exp' => time() + $expiration,
        ];

        return JWT::encode($tokenPayload, $secret, 'HS256');
    }

    public static function generateRefreshToken(array $payload): string
    {
        $secret = $_ENV['JWT_REFRESH_SECRET'] ?? 'default-refresh-secret';
        $expiration = (int)($_ENV['JWT_REFRESH_EXPIRATION'] ?? 604800);

        $tokenPayload = [
            'userId' => $payload['userId'],
            'role' => $payload['role'],
            'iat' => time(),
            'exp' => time() + $expiration,
        ];

        return JWT::encode($tokenPayload, $secret, 'HS256');
    }

    public static function verifyAccessToken(string $token): object
    {
        $secret = $_ENV['JWT_ACCESS_SECRET'] ?? 'default-access-secret';
        return JWT::decode($token, new Key($secret, 'HS256'));
    }

    public static function verifyRefreshToken(string $token): object
    {
        $secret = $_ENV['JWT_REFRESH_SECRET'] ?? 'default-refresh-secret';
        return JWT::decode($token, new Key($secret, 'HS256'));
    }
}
