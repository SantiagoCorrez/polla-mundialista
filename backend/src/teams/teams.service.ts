import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TeamsService {
  async getAll() {
    return prisma.team.findMany({
      orderBy: [{ group: 'asc' }, { name: 'asc' }],
    });
  }

  async getByGroup(group: string) {
    return prisma.team.findMany({
      where: { group: group.toUpperCase() },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string) {
    return prisma.team.findUnique({ where: { id } });
  }
}
