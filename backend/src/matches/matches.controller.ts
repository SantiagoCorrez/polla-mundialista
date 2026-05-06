import { Response, NextFunction } from 'express';
import { AuthRequest } from '../common/middlewares/auth.middleware';
import { MatchesService } from './matches.service';
import { AppError } from '../common/middlewares/error-handler';

const matchesService = new MatchesService();

export class MatchesController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { phase, group } = req.query;
      const matches = await matchesService.getAll(phase as string, group as string);
      res.json({ status: 'success', data: matches });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const match = await matchesService.getById(req.params.id);
      res.json({ status: 'success', data: match });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { homeTeamId, awayTeamId, phase, group, matchDate, stadium } = req.body;
      if (!homeTeamId || !awayTeamId || !phase || !matchDate) {
        throw new AppError('homeTeamId, awayTeamId, phase, and matchDate are required', 400);
      }
      const match = await matchesService.create({ homeTeamId, awayTeamId, phase, group, matchDate, stadium });
      res.status(201).json({ status: 'success', data: match });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const match = await matchesService.update(req.params.id, req.body);
      res.json({ status: 'success', data: match });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await matchesService.delete(req.params.id);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async registerResult(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { homeScore, awayScore, homeScoreFinal, awayScoreFinal, qualifiedTeamId } = req.body;
      if (homeScore === undefined || awayScore === undefined) {
        throw new AppError('homeScore and awayScore are required', 400);
      }
      const result = await matchesService.registerResult(req.params.id, {
        homeScore, awayScore, homeScoreFinal, awayScoreFinal, qualifiedTeamId,
      });
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getMatchPredictions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const predictions = await matchesService.getMatchPredictions(req.params.id);
      res.json({ status: 'success', data: predictions });
    } catch (error) {
      next(error);
    }
  }

  async generateKnockoutBracket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { phase, matchups } = req.body;
      if (!phase || !matchups || !Array.isArray(matchups)) {
        throw new AppError('phase and matchups array are required', 400);
      }
      const matches = await matchesService.generateKnockoutBracket(phase, matchups);
      res.status(201).json({ status: 'success', data: matches });
    } catch (error) {
      next(error);
    }
  }
}
