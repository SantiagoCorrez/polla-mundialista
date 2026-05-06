import { Response, NextFunction } from 'express';
import { AuthRequest } from '../common/middlewares/auth.middleware';
import { TeamsService } from './teams.service';

const teamsService = new TeamsService();

export class TeamsController {
  async getAll(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const teams = await teamsService.getAll();
      res.json({ status: 'success', data: teams });
    } catch (error) {
      next(error);
    }
  }

  async getByGroup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const teams = await teamsService.getByGroup(req.params.group);
      res.json({ status: 'success', data: teams });
    } catch (error) {
      next(error);
    }
  }
}
