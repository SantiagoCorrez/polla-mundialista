<?php

namespace App\Core;

class Router
{
    private array $routes = [];
    private string $prefix = '';
    private array $middlewares = [];

    public function group(string $prefix, array $middlewares, callable $callback): void
    {
        $previousPrefix = $this->prefix;
        $previousMiddlewares = $this->middlewares;

        $this->prefix = $previousPrefix . $prefix;
        $this->middlewares = array_merge($previousMiddlewares, $middlewares);

        $callback($this);

        $this->prefix = $previousPrefix;
        $this->middlewares = $previousMiddlewares;
    }

    public function get(string $path, callable|array $handler, array $middlewares = []): void
    {
        $this->addRoute('GET', $path, $handler, $middlewares);
    }

    public function post(string $path, callable|array $handler, array $middlewares = []): void
    {
        $this->addRoute('POST', $path, $handler, $middlewares);
    }

    public function patch(string $path, callable|array $handler, array $middlewares = []): void
    {
        $this->addRoute('PATCH', $path, $handler, $middlewares);
    }

    public function delete(string $path, callable|array $handler, array $middlewares = []): void
    {
        $this->addRoute('DELETE', $path, $handler, $middlewares);
    }

    private function addRoute(string $method, string $path, callable|array $handler, array $middlewares): void
    {
        $fullPath = $this->prefix . $path;
        $allMiddlewares = array_merge($this->middlewares, $middlewares);

        $this->routes[] = [
            'method' => $method,
            'path' => $fullPath,
            'handler' => $handler,
            'middlewares' => $allMiddlewares,
            'pattern' => $this->pathToRegex($fullPath),
            'paramNames' => $this->extractParamNames($fullPath),
        ];
    }

    private function pathToRegex(string $path): string
    {
        $pattern = preg_replace('/:([a-zA-Z_]+)/', '([^/]+)', $path);
        return '#^' . $pattern . '$#';
    }

    private function extractParamNames(string $path): array
    {
        preg_match_all('/:([a-zA-Z_]+)/', $path, $matches);
        return $matches[1] ?? [];
    }

    public function resolve(Request $request, Response $response): void
    {
        // Handle preflight CORS
        if ($request->method === 'OPTIONS') {
            $response->status(204)->json([]);
            return;
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $request->method) {
                continue;
            }

            if (preg_match($route['pattern'], $request->path, $matches)) {
                // Extract params
                array_shift($matches);
                foreach ($route['paramNames'] as $i => $name) {
                    $request->params[$name] = $matches[$i] ?? null;
                }

                // Run middlewares
                foreach ($route['middlewares'] as $middleware) {
                    if (is_string($middleware)) {
                        $mw = new $middleware();
                        $mw->handle($request, $response);
                    } elseif (is_callable($middleware)) {
                        $middleware($request, $response);
                    }
                }

                // Run handler
                $handler = $route['handler'];
                if (is_array($handler)) {
                    [$class, $method] = $handler;
                    $controller = is_string($class) ? new $class() : $class;
                    $controller->$method($request, $response);
                } else {
                    $handler($request, $response);
                }
                return;
            }
        }

        // No route found
        $response->error('Route not found', 404);
    }
}
