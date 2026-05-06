import { Response, NextFunction } from 'express';
import { AuthRequest } from '../common/middlewares/auth.middleware';
import { RankingService } from './ranking.service';

const rankingService = new RankingService();

export class RankingController {
  async getGlobalRanking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const phase = req.query.phase as string;
      const search = req.query.search as string;
      const result = await rankingService.getGlobalRanking(page, limit, phase, search);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getMyPosition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const position = await rankingService.getUserPosition(req.user!.userId);
      res.json({ status: 'success', data: position });
    } catch (error) {
      next(error);
    }
  }
}
