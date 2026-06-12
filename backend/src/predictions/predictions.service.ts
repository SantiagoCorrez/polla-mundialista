import { PrismaClient } from '@prisma/client';
import { AppError } from '../common/middlewares/error-handler';

const prisma = new PrismaClient();

export class PredictionsService {
  async create(userId: string, matchId: string, predictedHome: number, predictedAway: number) {
    // Validate match exists and hasn't started
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new AppError('Match not found', 404);

    if (match.status !== 'SCHEDULED') {
      throw new AppError('Cannot predict on a match that has already started or finished', 400);
    }

    await this.checkLock(match);

    if (predictedHome < 0 || predictedAway < 0) {
      throw new AppError('Scores must be non-negative', 400);
    }

    // Check if user already has a prediction
    const existing = await prisma.prediction.findUnique({
      where: { userId_matchId: { userId, matchId } },
    });

    if (existing) {
      throw new AppError('You already have a prediction for this match. Use update instead.', 409);
    }

    return prisma.prediction.create({
      data: { userId, matchId, predictedHome, predictedAway },
      include: {
        match: { include: { homeTeam: true, awayTeam: true } },
      },
    });
  }

  async update(userId: string, matchId: string, predictedHome: number, predictedAway: number) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new AppError('Match not found', 404);

    if (match.status !== 'SCHEDULED') {
      throw new AppError('Cannot edit prediction after the match has started', 400);
    }

    await this.checkLock(match);

    if (predictedHome < 0 || predictedAway < 0) {
      throw new AppError('Scores must be non-negative', 400);
    }

    const existing = await prisma.prediction.findUnique({
      where: { userId_matchId: { userId, matchId } },
    });

    if (!existing) {
      throw new AppError('No prediction found to update', 404);
    }

    return prisma.prediction.update({
      where: { id: existing.id },
      data: { predictedHome, predictedAway },
      include: {
        match: { include: { homeTeam: true, awayTeam: true } },
      },
    });
  }

  async getMyPredictions(userId: string, phase?: string, group?: string) {
    const where: any = { userId };
    if (phase || group) {
      where.match = {};
      if (phase) where.match.phase = phase;
      if (group) where.match.group = group.toUpperCase();
    }

    return prisma.prediction.findMany({
      where,
      include: {
        match: { include: { homeTeam: true, awayTeam: true } },
      },
      orderBy: { match: { matchDate: 'asc' } },
    });
  }

  async getByMatch(matchId: string) {
    return prisma.prediction.findMany({
      where: { matchId },
      include: {
        user: { select: { id: true, username: true, fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getMyPredictionForMatch(userId: string, matchId: string) {
    return prisma.prediction.findUnique({
      where: { userId_matchId: { userId, matchId } },
      include: {
        match: { include: { homeTeam: true, awayTeam: true } },
      },
    });
  }

  async getTournamentPrediction(userId: string) {
    return prisma.tournamentPrediction.findUnique({
      where: { userId },
      include: {
        champion: true,
        runnerUp: true,
        thirdPlace: true,
        fourthPlace: true,
      },
    });
  }

  async upsertTournamentPrediction(userId: string, data: { championId?: string, runnerUpId?: string, thirdPlaceId?: string, fourthPlaceId?: string, topScorer?: string }) {
    if (new Date() >= new Date('2026-07-10T12:00:00-05:00')) {
      throw new AppError('El plazo máximo para modificar estas predicciones ha finalizado', 400);
    }

    return prisma.tournamentPrediction.upsert({
      where: { userId },
      update: {
        championId: data.championId,
        runnerUpId: data.runnerUpId,
        thirdPlaceId: data.thirdPlaceId,
        fourthPlaceId: data.fourthPlaceId,
        topScorer: data.topScorer,
      },
      create: {
        userId,
        championId: data.championId,
        runnerUpId: data.runnerUpId,
        thirdPlaceId: data.thirdPlaceId,
        fourthPlaceId: data.fourthPlaceId,
        topScorer: data.topScorer,
      },
      include: {
        champion: true,
        runnerUp: true,
        thirdPlace: true,
        fourthPlace: true,
      },
    });
  }

  async getAllTournamentPredictions() {
    return prisma.tournamentPrediction.findMany({
      include: {
        user: { select: { fullName: true, username: true, email: true } },
        champion: true,
        runnerUp: true,
        thirdPlace: true,
        fourthPlace: true,
      },
      orderBy: { user: { fullName: 'asc' } },
    });
  }

  private async checkLock(match: any) {
    const localTzOffset = 5 * 60 * 60 * 1000;
    const localDate = new Date(match.matchDate.getTime() - localTzOffset);
    const startOfDayUTC = new Date(Date.UTC(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate(), 0, 0, 0));
    startOfDayUTC.setTime(startOfDayUTC.getTime() + localTzOffset);
    const endOfDayUTC = new Date(startOfDayUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

    const firstMatchOfDay = await prisma.match.findFirst({
      where: {
        matchDate: {
          gte: startOfDayUTC,
          lte: endOfDayUTC,
        }
      },
      orderBy: { matchDate: 'asc' }
    });

    const cutoffTime = firstMatchOfDay ? firstMatchOfDay.matchDate : match.matchDate;

    if (new Date() >= cutoffTime) {
      throw new AppError('No se pueden hacer o editar predicciones después de que haya comenzado el primer partido del día', 400);
    }
  }
}
