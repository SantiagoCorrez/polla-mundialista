import { Router } from 'express';
import { RankingController } from './ranking.controller';
import { authMiddleware } from '../common/middlewares/auth.middleware';

const router = Router();
const controller = new RankingController();

router.get('/', authMiddleware, controller.getGlobalRanking);
router.get('/me', authMiddleware, controller.getMyPosition);

export { router as rankingRoutes };
