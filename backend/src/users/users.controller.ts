import { Response, NextFunction } from 'express';
import { AuthRequest } from '../common/middlewares/auth.middleware';
import { UsersService } from './users.service';
import { AppError } from '../common/middlewares/error-handler';

const usersService = new UsersService();

export class UsersController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await usersService.getProfile(req.user!.userId);
      res.json({ status: 'success', data: profile });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fullName, username } = req.body;
      const user = await usersService.updateProfile(req.user!.userId, { fullName, username });
      res.json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        throw new AppError('Current and new password are required', 400);
      }
      const result = await usersService.changePassword(req.user!.userId, currentPassword, newPassword);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getPredictionHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { phase } = req.query;
      const predictions = await usersService.getPredictionHistory(
        req.user!.userId,
        phase as string
      );
      res.json({ status: 'success', data: predictions });
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoints
  async listUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const result = await usersService.listUsers(page, limit, search);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async toggleUserActive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.toggleUserActive(req.params.id);
      res.json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  }

  async setUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      if (!['USER', 'ADMIN'].includes(role)) {
        throw new AppError('Invalid role. Must be USER or ADMIN', 400);
      }
      const user = await usersService.setUserRole(req.params.id, role);
      res.json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  }

  async getUserPredictions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const predictions = await usersService.getUserPredictions(req.params.id);
      res.json({ status: 'success', data: predictions });
    } catch (error) {
      next(error);
    }
  }

  async adminResetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { newPassword } = req.body;
      if (!newPassword) {
        throw new AppError('New password is required', 400);
      }
      const result = await usersService.adminResetPassword(req.params.id, newPassword);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }
}
