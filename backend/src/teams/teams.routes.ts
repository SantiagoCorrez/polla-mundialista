import { Router } from 'express';
import { TeamsController } from './teams.controller';
import { authMiddleware } from '../common/middlewares/auth.middleware';

const router = Router();
const controller = new TeamsController();

router.get('/', authMiddleware, controller.getAll);
router.get('/group/:group', authMiddleware, controller.getByGroup);

export { router as teamRoutes };
