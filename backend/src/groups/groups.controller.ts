import { Response, NextFunction } from 'express';
import { AuthRequest } from '../common/middlewares/auth.middleware';
import { GroupsService } from './groups.service';

const groupsService = new GroupsService();

export class GroupsController {
  async getGroupStandings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const standings = await groupsService.getGroupStandings(req.params.group);
      res.json({ status: 'success', data: standings });
    } catch (error) {
      next(error);
    }
  }

  async getAllGroupStandings(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const standings = await groupsService.getAllGroupStandings();
      res.json({ status: 'success', data: standings });
    } catch (error) {
      next(error);
    }
  }

  async markQualified(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { teamIds } = req.body;
      const result = await groupsService.markQualified(req.params.group, teamIds);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getBestThirdPlaced(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const thirdPlaced = await groupsService.getBestThirdPlaced();
      res.json({ status: 'success', data: thirdPlaced });
    } catch (error) {
      next(error);
    }
  }
}
