import { PrismaClient, Phase, MatchStatus } from '@prisma/client';
import { AppError } from '../common/middlewares/error-handler';
import { calcularPuntos } from './scoring.service';

const prisma = new PrismaClient();

export class MatchesService {
  async getAll(phase?: string, group?: string) {
    const where: any = {};
    if (phase) where.phase = phase;
    if (group) where.group = group.toUpperCase();

    return prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        _count: { select: { predictions: true } },
      },
      orderBy: { matchDate: 'asc' },
    });
  }

  async getById(id: string) {
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        predictions: {
          include: { user: { select: { id: true, username: true, fullName: true } } },
        },
      },
    });

    if (!match) throw new AppError('Match not found', 404);
    return match;
  }

  async create(data: {
    homeTeamId: string;
    awayTeamId: string;
    phase: Phase;
    group?: string;
    matchDate: string;
    stadium?: string;
  }) {
    return prisma.match.create({
      data: {
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        phase: data.phase,
        group: data.group?.toUpperCase(),
        matchDate: new Date(data.matchDate),
        stadium: data.stadium,
      },
      include: { homeTeam: true, awayTeam: true },
    });
  }

  async update(id: string, data: {
    homeTeamId?: string;
    awayTeamId?: string;
    matchDate?: string;
    stadium?: string;
    status?: MatchStatus;
    group?: string;
  }) {
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) throw new AppError('Match not found', 404);

    return prisma.match.update({
      where: { id },
      data: {
        ...(data.homeTeamId && { homeTeamId: data.homeTeamId }),
        ...(data.awayTeamId && { awayTeamId: data.awayTeamId }),
        ...(data.matchDate && { matchDate: new Date(data.matchDate) }),
        ...(data.stadium !== undefined && { stadium: data.stadium }),
        ...(data.status && { status: data.status }),
        ...(data.group && { group: data.group.toUpperCase() }),
      },
      include: { homeTeam: true, awayTeam: true },
    });
  }

  async delete(id: string) {
    const match = await prisma.match.findUnique({
      where: { id },
      include: { _count: { select: { predictions: true } } },
    });

    if (!match) throw new AppError('Match not found', 404);

    if (match._count.predictions > 0) {
      throw new AppError('Cannot delete match that has predictions', 400);
    }

    await prisma.match.delete({ where: { id } });
    return { message: 'Match deleted successfully' };
  }

  async registerResult(id: string, data: {
    homeScore: number;
    awayScore: number;
    homeScoreFinal?: number;
    awayScoreFinal?: number;
    qualifiedTeamId?: string;
  }) {
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) throw new AppError('Match not found', 404);

    // Update match with result
    const updated = await prisma.match.update({
      where: { id },
      data: {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        homeScoreFinal: data.homeScoreFinal,
        awayScoreFinal: data.awayScoreFinal,
        qualifiedTeamId: data.qualifiedTeamId,
        status: 'FINISHED',
      },
      include: { homeTeam: true, awayTeam: true },
    });

    // Calculate points for all predictions on this match
    const predictions = await prisma.prediction.findMany({
      where: { matchId: id },
    });

    for (const pred of predictions) {
      const result = calcularPuntos(
        pred.predictedHome,
        pred.predictedAway,
        data.homeScore,
        data.awayScore
      );

      await prisma.prediction.update({
        where: { id: pred.id },
        data: {
          points: result.points,
          pointType: result.pointType,
        },
      });
    }

    return {
      match: updated,
      predictionsUpdated: predictions.length,
    };
  }

  async getMatchPredictions(id: string) {
    return prisma.prediction.findMany({
      where: { matchId: id },
      include: {
        user: { select: { id: true, username: true, fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async generateKnockoutBracket(
    phase: Phase,
    matchups: Array<{ homeTeamId: string; awayTeamId: string; matchDate: string; stadium?: string }>
  ) {
    const created = [];
    for (const matchup of matchups) {
      const match = await prisma.match.create({
        data: {
          homeTeamId: matchup.homeTeamId,
          awayTeamId: matchup.awayTeamId,
          phase,
          matchDate: new Date(matchup.matchDate),
          stadium: matchup.stadium,
        },
        include: { homeTeam: true, awayTeam: true },
      });
      created.push(match);
    }
    return created;
  }
}
