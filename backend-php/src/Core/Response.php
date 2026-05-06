<?php

namespace App\Core;

class Response
{
    private int $statusCode = 200;
    private array $headers = [];

    public function status(int $code): self
    {
        $this->statusCode = $code;
        return $this;
    }

    public function header(string $name, string $value): self
    {
        $this->headers[$name] = $value;
        return $this;
    }

    public function json(array $data): void
    {
        http_response_code($this->statusCode);
        header('Content-Type: application/json; charset=utf-8');
        foreach ($this->headers as $name => $value) {
            header("{$name}: {$value}");
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public function success(mixed $data, int $code = 200): void
    {
        $this->status($code)->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    public function error(string $message, int $code = 400): void
    {
        $this->status($code)->json([
            'status' => 'error',
            'message' => $message,
        ]);
    }

    public function message(string $message, int $code = 200): void
    {
        $this->status($code)->json([
            'status' => 'success',
            'message' => $message,
        ]);
    }

    public function setHeader(string $name, string $value): self
    {
        header("{$name}: {$value}");
        return $this;
    }

    public function setCookie(string $name, string $value, array $options = []): self
    {
        $defaults = [
            'expires' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => ($_ENV['APP_ENV'] ?? 'development') === 'production',
            'httponly' => true,
            'samesite' => 'Strict',
        ];
        $opts = array_merge($defaults, $options);
        setcookie($name, $value, $opts);
        return $this;
    }

    public function clearCookie(string $name): self
    {
        setcookie($name, '', ['expires' => time() - 3600, 'path' => '/']);
        return $this;
    }

    public function sendRaw(): void
    {
        http_response_code($this->statusCode);
        foreach ($this->headers as $name => $value) {
            header("{$name}: {$value}");
        }
    }
}
