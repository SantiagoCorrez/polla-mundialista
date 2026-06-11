import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authMiddleware } from '../common/middlewares/auth.middleware';
import { adminGuard } from '../common/middlewares/role.middleware';

const router = Router();
const controller = new ReportsController();

// All report routes require admin access
router.get('/dashboard', authMiddleware, adminGuard, controller.getDashboardStats);
router.get('/ranking/excel', authMiddleware, adminGuard, controller.getRankingExcel);
router.get('/tournament/excel', authMiddleware, adminGuard, controller.getTournamentPredictionsExcel);
router.get('/match/:matchId/excel', authMiddleware, adminGuard, controller.getMatchPredictionsExcel);
router.get('/summary/pdf', authMiddleware, adminGuard, controller.getPollaSummaryPdf);
router.get('/user/:userId/pdf', authMiddleware, adminGuard, controller.getUserPredictionsPdf);
router.get('/today/excel', authMiddleware, adminGuard, controller.getTodayPredictionsExcel);

export { router as reportRoutes };
