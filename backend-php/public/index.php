<?php
/**
 * Polla Mundialista - PHP Backend Entry Point
 * Routes all requests through the application router.
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Core\App;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Start the application
$app = new App();

// Load routes
require_once __DIR__ . '/../routes/api.php';

// Run
$app->run();
