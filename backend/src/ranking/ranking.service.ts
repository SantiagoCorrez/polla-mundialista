import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RankingService {
  async getGlobalRanking(page: number = 1, limit: number = 20, phase?: string, search?: string) {
    const skip = (page - 1) * limit;

    // Build prediction filter
    const predictionWhere: any = { points: { not: null } };
    if (phase) {
      predictionWhere.match = { phase };
    }

    // Get all users with their prediction stats
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(search ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { fullName: { contains: search, mode: 'insensitive' as const } },
          ],
        } : {}),
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        predictions: {
          where: predictionWhere,
          select: {
            points: true,
            pointType: true,
          },
        },
      },
    });

    // Calculate stats for each user
    const rankings = users.map(user => {
      const preds = user.predictions;
      const totalPoints = preds.reduce((sum, p) => sum + (p.points || 0), 0);
      const exactos = preds.filter(p => p.pointType === 'EXACT').length;
      const winnerDiff = preds.filter(p => p.pointType === 'WINNER_DIFF').length;
      const winnerOnly = preds.filter(p => p.pointType === 'WINNER').length;
      const none = preds.filter(p => p.pointType === 'NONE').length;

      return {
        userId: user.id,
        fullName: user.fullName,
        username: user.username,
        totalPoints,
        exactos,
        winnerDiff,
        winnerOnly,
        none,
        totalPredictions: preds.length,
      };
    });

    // Sort by points descending, then by exactos, then by winnerDiff
    rankings.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.exactos !== a.exactos) return b.exactos - a.exactos;
      if (b.winnerDiff !== a.winnerDiff) return b.winnerDiff - a.winnerDiff;
      return b.winnerOnly - a.winnerOnly;
    });

    // Add positions
    const ranked = rankings.map((r, i) => ({ ...r, position: i + 1 }));

    // Paginate
    const total = ranked.length;
    const paginated = ranked.slice(skip, skip + limit);

    return {
      rankings: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserPosition(userId: string) {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        predictions: {
          where: { points: { not: null } },
          select: { points: true },
        },
      },
    });

    const sorted = users
      .map(u => ({
        userId: u.id,
        totalPoints: u.predictions.reduce((sum, p) => sum + (p.points || 0), 0),
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    const position = sorted.findIndex(u => u.userId === userId) + 1;
    const userEntry = sorted.find(u => u.userId === userId);

    return {
      position: position || null,
      totalPoints: userEntry?.totalPoints || 0,
      totalUsers: sorted.length,
    };
  }
}
