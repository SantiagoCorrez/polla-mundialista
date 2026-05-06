import { Router } from 'express';
import { MatchesController } from './matches.controller';
import { authMiddleware } from '../common/middlewares/auth.middleware';
import { adminGuard } from '../common/middlewares/role.middleware';
import { sanitizeBody } from '../common/middlewares/validate';

const router = Router();
const controller = new MatchesController();

// Public (authenticated) routes
router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getById);

// Admin routes
router.post('/', authMiddleware, adminGuard, sanitizeBody, controller.create);
router.patch('/:id', authMiddleware, adminGuard, sanitizeBody, controller.update);
router.delete('/:id', authMiddleware, adminGuard, controller.delete);
router.post('/:id/result', authMiddleware, adminGuard, sanitizeBody, controller.registerResult);
router.get('/:id/predictions', authMiddleware, adminGuard, controller.getMatchPredictions);
router.post('/bracket/generate', authMiddleware, adminGuard, sanitizeBody, controller.generateKnockoutBracket);

export { router as matchRoutes };
