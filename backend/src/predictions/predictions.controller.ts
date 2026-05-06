import { Response, NextFunction } from 'express';
import { AuthRequest } from '../common/middlewares/auth.middleware';
import { PredictionsService } from './predictions.service';
import { AppError } from '../common/middlewares/error-handler';

const predictionsService = new PredictionsService();

export class PredictionsController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { matchId, predictedHome, predictedAway } = req.body;
      if (!matchId || predictedHome === undefined || predictedAway === undefined) {
        throw new AppError('matchId, predictedHome, and predictedAway are required', 400);
      }
      const prediction = await predictionsService.create(
        req.user!.userId, matchId,
        parseInt(predictedHome), parseInt(predictedAway)
      );
      res.status(201).json({ status: 'success', data: prediction });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { predictedHome, predictedAway } = req.body;
      if (predictedHome === undefined || predictedAway === undefined) {
        throw new AppError('predictedHome and predictedAway are required', 400);
      }
      const prediction = await predictionsService.update(
        req.user!.userId, req.params.matchId,
        parseInt(predictedHome), parseInt(predictedAway)
      );
      res.json({ status: 'success', data: prediction });
    } catch (error) {
      next(error);
    }
  }

  async getMyPredictions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { phase, group } = req.query;
      const predictions = await predictionsService.getMyPredictions(
        req.user!.userId, phase as string, group as string
      );
      res.json({ status: 'success', data: predictions });
    } catch (error) {
      next(error);
    }
  }

  async getMyPredictionForMatch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const prediction = await predictionsService.getMyPredictionForMatch(
        req.user!.userId, req.params.matchId
      );
      res.json({ status: 'success', data: prediction });
    } catch (error) {
      next(error);
    }
  }

  async getTournamentPrediction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const prediction = await predictionsService.getTournamentPrediction(req.user!.userId);
      res.json({ status: 'success', data: prediction });
    } catch (error) {
      next(error);
    }
  }

  async upsertTournamentPrediction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const prediction = await predictionsService.upsertTournamentPrediction(req.user!.userId, data);
      res.json({ status: 'success', data: prediction });
    } catch (error) {
      next(error);
    }
  }

  async getAllTournamentPredictions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const predictions = await predictionsService.getAllTournamentPredictions();
      res.json({ status: 'success', data: predictions });
    } catch (error) {
      next(error);
    }
  }
}
