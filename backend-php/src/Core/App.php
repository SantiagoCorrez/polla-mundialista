<?php

namespace App\Core;

class App
{
    private static ?App $instance = null;
    private Router $router;
    private Request $request;
    private Response $response;

    public function __construct()
    {
        self::$instance = $this;
        $this->router = new Router();
        $this->request = new Request();
        $this->response = new Response();

        // Set CORS headers early
        $this->setCorsHeaders();

        // Handle OPTIONS preflight immediately
        if ($this->request->method === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }

    public static function getInstance(): self
    {
        return self::$instance;
    }

    public function getRouter(): Router
    {
        return $this->router;
    }

    public function run(): void
    {
        try {
            $this->router->resolve($this->request, $this->response);
        } catch (AppException $e) {
            $this->response->error($e->getMessage(), $e->getStatusCode());
        } catch (\Throwable $e) {
            error_log("Unexpected error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            $code = ($_ENV['APP_ENV'] ?? 'production') === 'development' ? 500 : 500;
            $message = ($_ENV['APP_ENV'] ?? 'production') === 'development'
                ? $e->getMessage()
                : 'Internal server error';
            $this->response->error($message, 500);
        }
    }

    private function setCorsHeaders(): void
    {
        $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:4200';
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        // Allow the configured frontend URL
        if ($origin === $frontendUrl || ($_ENV['APP_ENV'] ?? '') === 'development') {
            header("Access-Control-Allow-Origin: " . ($origin ?: $frontendUrl));
        }

        header("Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: 86400");
    }
}
