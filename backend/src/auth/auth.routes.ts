import { Router } from 'express';
import { AuthController } from './auth.controller';
import { sanitizeBody } from '../common/middlewares/validate';

const router = Router();
const controller = new AuthController();

router.post('/register', sanitizeBody, controller.register);
router.post('/login', sanitizeBody, controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);

export { router as authRoutes };
