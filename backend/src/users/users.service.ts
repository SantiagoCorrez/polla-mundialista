import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppError } from '../common/middlewares/error-handler';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export class UsersService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get prediction stats
    const predictions = await prisma.prediction.findMany({
      where: { userId },
      include: { match: { include: { homeTeam: true, awayTeam: true } } },
    });

    const stats = {
      totalPredictions: predictions.length,
      exactos: predictions.filter(p => p.pointType === 'EXACT').length,
      winnerDiff: predictions.filter(p => p.pointType === 'WINNER_DIFF').length,
      winnerOnly: predictions.filter(p => p.pointType === 'WINNER').length,
      none: predictions.filter(p => p.pointType === 'NONE').length,
      totalPoints: predictions.reduce((sum, p) => sum + (p.points || 0), 0),
      pending: predictions.filter(p => p.points === null).length,
    };

    // Get ranking position
    const usersWithPoints = await prisma.prediction.groupBy({
      by: ['userId'],
      _sum: { points: true },
      orderBy: { _sum: { points: 'desc' } },
    });

    const rankPosition = usersWithPoints.findIndex(u => u.userId === userId) + 1;

    return { ...user, stats, rankPosition: rankPosition || 'N/A' };
  }

  async updateProfile(userId: string, data: { fullName?: string; username?: string }) {
    if (data.username) {
      const existing = await prisma.user.findFirst({
        where: { username: data.username, NOT: { id: userId } },
      });
      if (existing) {
        throw new AppError('Username already taken', 409);
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.username && { username: data.username }),
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        role: true,
      },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new AppError('Current password is incorrect', 400);

    if (!PASSWORD_REGEX.test(newPassword)) {
      throw new AppError(
        'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 symbol',
        400
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return { message: 'Password updated successfully' };
  }

  async getPredictionHistory(userId: string, phase?: string) {
    const where: any = { userId };
    if (phase) {
      where.match = { phase };
    }

    return prisma.prediction.findMany({
      where,
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
      orderBy: { match: { matchDate: 'asc' } },
    });
  }

  // Admin methods
  async listUsers(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { predictions: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Add points to each user
    const usersWithPoints = await Promise.all(
      users.map(async (user) => {
        const result = await prisma.prediction.aggregate({
          where: { userId: user.id },
          _sum: { points: true },
        });
        return { ...user, totalPoints: result._sum.points || 0 };
      })
    );

    return { users: usersWithPoints, total, page, totalPages: Math.ceil(total / limit) };
  }

  async toggleUserActive(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    return prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, username: true, isActive: true },
    });
  }

  async setUserRole(userId: string, role: 'USER' | 'ADMIN') {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, username: true, role: true },
    });
  }

  async getUserPredictions(userId: string) {
    return prisma.prediction.findMany({
      where: { userId },
      include: {
        match: {
          include: { homeTeam: true, awayTeam: true },
        },
      },
      orderBy: { match: { matchDate: 'asc' } },
    });
  }

  async adminResetPassword(userId: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    if (!PASSWORD_REGEX.test(newPassword)) {
      throw new AppError(
        'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 symbol',
        400
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return { message: 'Password reset successfully' };
  }
}
