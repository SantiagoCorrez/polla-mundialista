<?php

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;
use App\Core\AppException;

class AdminMiddleware
{
    public function handle(Request $request, Response $response): void
    {
        if (!$request->user) {
            throw new AppException('Authentication required', 401);
        }

        if ($request->user['role'] !== 'ADMIN') {
            throw new AppException('Admin access required', 403);
        }
    }
}
