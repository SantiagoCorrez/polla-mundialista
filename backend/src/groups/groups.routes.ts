import { Router } from 'express';
import { GroupsController } from './groups.controller';
import { authMiddleware } from '../common/middlewares/auth.middleware';
import { adminGuard } from '../common/middlewares/role.middleware';
import { sanitizeBody } from '../common/middlewares/validate';

const router = Router();
const controller = new GroupsController();

router.get('/', authMiddleware, controller.getAllGroupStandings);
router.get('/best-third', authMiddleware, controller.getBestThirdPlaced);
router.get('/:group', authMiddleware, controller.getGroupStandings);
router.post('/:group/qualify', authMiddleware, adminGuard, sanitizeBody, controller.markQualified);

export { router as groupRoutes };
