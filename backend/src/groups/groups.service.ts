import { PrismaClient } from '@prisma/client';
import { AppError } from '../common/middlewares/error-handler';

const prisma = new PrismaClient();

interface TeamStanding {
  teamId: string;
  teamName: string;
  countryCode: string;
  flagUrl: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export class GroupsService {
  async getGroupStandings(group: string): Promise<TeamStanding[]> {
    const groupUpper = group.toUpperCase();

    // Get teams in this group
    const teams = await prisma.team.findMany({
      where: { group: groupUpper },
    });

    if (teams.length === 0) {
      throw new AppError(`No teams found for group ${groupUpper}`, 404);
    }

    // Get finished matches in this group
    const matches = await prisma.match.findMany({
      where: {
        phase: 'GROUP_STAGE',
        group: groupUpper,
        status: 'FINISHED',
        homeScore: { not: null },
        awayScore: { not: null },
      },
    });

    // Calculate standings
    const standings: Map<string, TeamStanding> = new Map();

    for (const team of teams) {
      standings.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        countryCode: team.countryCode,
        flagUrl: team.flagUrl,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
    }

    for (const match of matches) {
      const home = standings.get(match.homeTeamId);
      const away = standings.get(match.awayTeamId);
      if (!home || !away) continue;

      const homeScore = match.homeScore!;
      const awayScore = match.awayScore!;

      home.played++;
      away.played++;
      home.goalsFor += homeScore;
      home.goalsAgainst += awayScore;
      away.goalsFor += awayScore;
      away.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        home.won++;
        home.points += 3;
        away.lost++;
      } else if (homeScore < awayScore) {
        away.won++;
        away.points += 3;
        home.lost++;
      } else {
        home.drawn++;
        away.drawn++;
        home.points += 1;
        away.points += 1;
      }

      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    }

    // Sort: points desc, goal difference desc, goals for desc
    const sorted = Array.from(standings.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    return sorted;
  }

  async getAllGroupStandings() {
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const allStandings: Record<string, TeamStanding[]> = {};

    for (const group of groups) {
      try {
        allStandings[group] = await this.getGroupStandings(group);
      } catch {
        allStandings[group] = [];
      }
    }

    return allStandings;
  }

  async markQualified(group: string, teamIds: string[]) {
    if (teamIds.length < 1 || teamIds.length > 4) {
      throw new AppError('Must select between 1 and 4 qualified teams', 400);
    }

    // Verify teams belong to the group
    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds }, group: group.toUpperCase() },
    });

    if (teams.length !== teamIds.length) {
      throw new AppError('Some teams do not belong to this group', 400);
    }

    return { group: group.toUpperCase(), qualifiedTeams: teams };
  }

  async getBestThirdPlaced() {
    // Get all groups' standings and extract 3rd place teams
    const allStandings = await this.getAllGroupStandings();
    const thirdPlaced: (TeamStanding & { group: string })[] = [];

    for (const [group, standings] of Object.entries(allStandings)) {
      if (standings.length >= 3) {
        thirdPlaced.push({ ...standings[2], group });
      }
    }

    // Sort third-placed teams
    thirdPlaced.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    return thirdPlaced;
  }
}
