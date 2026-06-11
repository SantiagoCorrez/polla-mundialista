import { Response, NextFunction } from 'express';
import { AuthRequest } from '../common/middlewares/auth.middleware';
import { ReportsService } from './reports.service';

const reportsService = new ReportsService();

export class ReportsController {
  async getRankingExcel(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await reportsService.generateRankingExcel(res);
    } catch (error) {
      next(error);
    }
  }

  async getTournamentPredictionsExcel(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await reportsService.generateTournamentPredictionsExcel(res);
    } catch (error) {
      next(error);
    }
  }

  async getMatchPredictionsExcel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await reportsService.generateMatchPredictionsExcel(res, req.params.matchId);
    } catch (error) {
      next(error);
    }
  }

  async getPollaSummaryPdf(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await reportsService.generatePollaSummaryPdf(res);
    } catch (error) {
      next(error);
    }
  }

  async getUserPredictionsPdf(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await reportsService.generateUserPredictionsPdf(res, req.params.userId);
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await reportsService.getDashboardStats();
      res.json({ status: 'success', data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getTodayPredictionsExcel(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await reportsService.generateTodayPredictionsExcel(res);
    } catch (error) {
      next(error);
    }
  }
}
