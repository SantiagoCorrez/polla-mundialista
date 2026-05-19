<?php
/**
 * API Routes - Polla Mundialista
 *
 * All routes are prefixed with /api/
 * Middleware is applied via route groups.
 */

use App\Core\App;
use App\Middleware\AuthMiddleware;
use App\Middleware\AdminMiddleware;

use App\Auth\AuthController;
use App\Teams\TeamsController;
use App\Matches\MatchesController;
use App\Predictions\PredictionsController;
use App\Ranking\RankingController;
use App\Groups\GroupsController;
use App\Users\UsersController;
use App\Reports\ReportsController;

$router = App::getInstance()->getRouter();

// ==================== Health Check ====================
$router->get('/api/health', function ($req, $res) {
    $res->success(['status' => 'ok', 'timestamp' => date('c')]);
});

// ==================== Auth (public) ====================
$router->group('/api/auth', [], function ($router) {
    $router->post('/register', [AuthController::class, 'register']);
    $router->post('/login', [AuthController::class, 'login']);
    $router->post('/refresh', [AuthController::class, 'refresh']);
    $router->post('/logout', [AuthController::class, 'logout']);
});

// ==================== Teams ====================
$router->group('/api/teams', [AuthMiddleware::class], function ($router) {
    $router->get('', [TeamsController::class, 'getAll']);
    $router->get('/group/:group', [TeamsController::class, 'getByGroup']);
});

// ==================== Matches ====================
$router->group('/api/matches', [AuthMiddleware::class], function ($router) {
    // Public (authenticated)
    $router->get('', [MatchesController::class, 'getAll']);
    // Bracket generate must be before /:id to avoid route collision
    $router->post('/bracket/generate', [MatchesController::class, 'generateKnockoutBracket'], [AdminMiddleware::class]);
    $router->get('/:id', [MatchesController::class, 'getById']);

    // Admin
    $router->post('', [MatchesController::class, 'create'], [AdminMiddleware::class]);
    $router->patch('/:id', [MatchesController::class, 'update'], [AdminMiddleware::class]);
    $router->delete('/:id', [MatchesController::class, 'delete'], [AdminMiddleware::class]);
    $router->post('/:id/result', [MatchesController::class, 'registerResult'], [AdminMiddleware::class]);
    $router->get('/:id/predictions', [MatchesController::class, 'getMatchPredictions'], [AdminMiddleware::class]);
});

// ==================== Predictions ====================
$router->group('/api/predictions', [AuthMiddleware::class], function ($router) {
    // Tournament predictions must come before generic routes
    $router->get('/tournament', [PredictionsController::class, 'getTournamentPrediction']);
    $router->post('/tournament', [PredictionsController::class, 'upsertTournamentPrediction']);
    $router->get('/tournament/all', [PredictionsController::class, 'getAllTournamentPredictions'], [AdminMiddleware::class]);

    $router->get('', [PredictionsController::class, 'getMyPredictions']);
    $router->get('/match/:matchId', [PredictionsController::class, 'getMyPredictionForMatch']);
    $router->post('', [PredictionsController::class, 'create']);
    $router->patch('/match/:matchId', [PredictionsController::class, 'update']);
});

// ==================== Ranking ====================
$router->group('/api/ranking', [AuthMiddleware::class], function ($router) {
    $router->get('', [RankingController::class, 'getGlobalRanking']);
    $router->get('/me', [RankingController::class, 'getMyPosition']);
});

// ==================== Groups ====================
$router->group('/api/groups', [AuthMiddleware::class], function ($router) {
    $router->get('', [GroupsController::class, 'getAllGroupStandings']);
    $router->get('/best-third', [GroupsController::class, 'getBestThirdPlaced']);
    $router->get('/:group', [GroupsController::class, 'getGroupStandings']);
    $router->post('/:group/qualify', [GroupsController::class, 'markQualified'], [AdminMiddleware::class]);
});

// ==================== Users ====================
$router->group('/api/users', [AuthMiddleware::class], function ($router) {
    // Profile routes
    $router->get('/profile', [UsersController::class, 'getProfile']);
    $router->patch('/profile', [UsersController::class, 'updateProfile']);
    $router->post('/change-password', [UsersController::class, 'changePassword']);
    $router->get('/predictions', [UsersController::class, 'getPredictionHistory']);

    // Admin routes
    $router->get('/export-excel', [UsersController::class, 'exportUsers'], [AdminMiddleware::class]);
    $router->get('', [UsersController::class, 'listUsers'], [AdminMiddleware::class]);
    $router->patch('/:id/toggle-active', [UsersController::class, 'toggleUserActive'], [AdminMiddleware::class]);
    $router->patch('/:id/role', [UsersController::class, 'setUserRole'], [AdminMiddleware::class]);
    $router->get('/:id/predictions', [UsersController::class, 'getUserPredictions'], [AdminMiddleware::class]);
});

// ==================== Reports ====================
$router->group('/api/reports', [AuthMiddleware::class, AdminMiddleware::class], function ($router) {
    $router->get('/dashboard', [ReportsController::class, 'getDashboardStats']);
    $router->get('/ranking/excel', [ReportsController::class, 'getRankingExcel']);
    $router->get('/tournament/excel', [ReportsController::class, 'getTournamentPredictionsExcel']);
    $router->get('/match/:matchId/excel', [ReportsController::class, 'getMatchPredictionsExcel']);
    $router->get('/summary/pdf', [ReportsController::class, 'getPollaSummaryPdf']);
    $router->get('/user/:userId/pdf', [ReportsController::class, 'getUserPredictionsPdf']);
});
