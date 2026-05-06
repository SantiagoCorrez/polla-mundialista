import { Router } from 'express';
import { PredictionsController } from './predictions.controller';
import { authMiddleware } from '../common/middlewares/auth.middleware';
import { adminGuard } from '../common/middlewares/role.middleware';
import { sanitizeBody } from '../common/middlewares/validate';

const router = Router();
const controller = new PredictionsController();

router.get('/tournament', authMiddleware, controller.getTournamentPrediction);
router.post('/tournament', authMiddleware, sanitizeBody, controller.upsertTournamentPrediction);
router.get('/tournament/all', authMiddleware, adminGuard, controller.getAllTournamentPredictions);

router.get('/', authMiddleware, controller.getMyPredictions);
router.get('/match/:matchId', authMiddleware, controller.getMyPredictionForMatch);
router.post('/', authMiddleware, sanitizeBody, controller.create);
router.patch('/match/:matchId', authMiddleware, sanitizeBody, controller.update);

export { router as predictionRoutes };
