import { Router } from 'express';
import { UsersController } from './users.controller';
import { authMiddleware } from '../common/middlewares/auth.middleware';
import { adminGuard } from '../common/middlewares/role.middleware';
import { sanitizeBody } from '../common/middlewares/validate';

const router = Router();
const controller = new UsersController();

// Protected routes (authenticated users)
router.get('/profile', authMiddleware, controller.getProfile);
router.patch('/profile', authMiddleware, sanitizeBody, controller.updateProfile);
router.post('/change-password', authMiddleware, sanitizeBody, controller.changePassword);
router.get('/predictions', authMiddleware, controller.getPredictionHistory);

// Admin routes
router.get('/export-excel', authMiddleware, adminGuard, controller.exportUsers);
router.get('/', authMiddleware, adminGuard, controller.listUsers);
router.patch('/:id/toggle-active', authMiddleware, adminGuard, controller.toggleUserActive);
router.patch('/:id/role', authMiddleware, adminGuard, sanitizeBody, controller.setUserRole);
router.get('/:id/predictions', authMiddleware, adminGuard, controller.getUserPredictions);
router.patch('/:id/reset-password', authMiddleware, adminGuard, sanitizeBody, controller.adminResetPassword);

export { router as userRoutes };
