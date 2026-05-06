<?php

namespace App\Auth;

use App\Config\Database;
use App\Core\AppException;
use PDO;

class AuthService
{
    private PDO $db;
    private const SALT_COST = 12;
    private const PASSWORD_REGEX = '/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};\':"\\\\|,.<>\/?]).{8,}$/';

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function register(array $data): array
    {
        $fullName = $data['fullName'] ?? '';
        $username = $data['username'] ?? '';
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        // Validate password
        if (!preg_match(self::PASSWORD_REGEX, $password)) {
            throw new AppException(
                'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 symbol',
                400
            );
        }

        // Check unique email
        $stmt = $this->db->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([strtolower($email)]);
        if ($stmt->fetch()) {
            throw new AppException('Email already registered', 409);
        }

        // Check unique username
        $stmt = $this->db->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            throw new AppException('Username already taken', 409);
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => self::SALT_COST]);
        $id = Database::uuid();

        $stmt = $this->db->prepare(
            'INSERT INTO users (id, full_name, username, email, password_hash, role, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())'
        );
        $stmt->execute([$id, $fullName, $username, strtolower($email), $passwordHash, 'USER', 1]);

        return [
            'id' => $id,
            'fullName' => $fullName,
            'username' => $username,
            'email' => strtolower($email),
            'role' => 'USER',
            'createdAt' => date('c'),
        ];
    }

    public function login(array $data): array
    {
        $identifier = $data['identifier'] ?? '';
        $password = $data['password'] ?? '';

        $stmt = $this->db->prepare(
            'SELECT * FROM users WHERE email = ? OR username = ?'
        );
        $stmt->execute([strtolower($identifier), $identifier]);
        $user = $stmt->fetch();

        if (!$user) {
            throw new AppException('Invalid credentials', 401);
        }

        if (!$user['is_active']) {
            throw new AppException('Account is blocked. Contact administrator.', 403);
        }

        if (!password_verify($password, $user['password_hash'])) {
            throw new AppException('Invalid credentials', 401);
        }

        $tokenPayload = ['userId' => $user['id'], 'role' => $user['role']];
        $accessToken = JwtUtils::generateAccessToken($tokenPayload);
        $refreshToken = JwtUtils::generateRefreshToken($tokenPayload);

        // Store refresh token
        $tokenId = Database::uuid();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

        $stmt = $this->db->prepare(
            'INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, NOW())'
        );
        $stmt->execute([$tokenId, $user['id'], $refreshToken, $expiresAt]);

        return [
            'user' => [
                'id' => $user['id'],
                'fullName' => $user['full_name'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role'],
            ],
            'accessToken' => $accessToken,
            'refreshToken' => $refreshToken,
        ];
    }

    public function refresh(?string $refreshToken): array
    {
        if (!$refreshToken) {
            throw new AppException('Refresh token required', 401);
        }

        $stmt = $this->db->prepare(
            'SELECT rt.*, u.id as uid, u.role, u.is_active
             FROM refresh_tokens rt
             JOIN users u ON u.id = rt.user_id
             WHERE rt.token = ?'
        );
        $stmt->execute([$refreshToken]);
        $stored = $stmt->fetch();

        if (!$stored) {
            throw new AppException('Invalid refresh token', 401);
        }

        if (strtotime($stored['expires_at']) < time()) {
            $stmt = $this->db->prepare('DELETE FROM refresh_tokens WHERE id = ?');
            $stmt->execute([$stored['id']]);
            throw new AppException('Refresh token expired', 401);
        }

        // Verify JWT
        try {
            JwtUtils::verifyRefreshToken($refreshToken);
        } catch (\Exception $e) {
            $stmt = $this->db->prepare('DELETE FROM refresh_tokens WHERE id = ?');
            $stmt->execute([$stored['id']]);
            throw new AppException('Invalid refresh token', 401);
        }

        if (!$stored['is_active']) {
            throw new AppException('Account is blocked', 403);
        }

        // Delete old, create new
        $stmt = $this->db->prepare('DELETE FROM refresh_tokens WHERE id = ?');
        $stmt->execute([$stored['id']]);

        $tokenPayload = ['userId' => $stored['uid'], 'role' => $stored['role']];
        $newAccessToken = JwtUtils::generateAccessToken($tokenPayload);
        $newRefreshToken = JwtUtils::generateRefreshToken($tokenPayload);

        $newTokenId = Database::uuid();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

        $stmt = $this->db->prepare(
            'INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, NOW())'
        );
        $stmt->execute([$newTokenId, $stored['uid'], $newRefreshToken, $expiresAt]);

        return [
            'accessToken' => $newAccessToken,
            'refreshToken' => $newRefreshToken,
        ];
    }

    public function logout(?string $refreshToken): void
    {
        if (!$refreshToken) {
            return;
        }

        $stmt = $this->db->prepare('DELETE FROM refresh_tokens WHERE token = ?');
        $stmt->execute([$refreshToken]);
    }
}
