export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  cedula: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  flagUrl: string | null;
  countryCode: string;
  group: string;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: Team;
  awayTeam: Team;
  phase: Phase;
  group: string | null;
  matchDate: string;
  stadium: string | null;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreFinal: number | null;
  awayScoreFinal: number | null;
  qualifiedTeamId: string | null;
  _count?: { predictions: number };
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  user?: { id: string; username: string; fullName: string };
  match?: Match;
  predictedHome: number;
  predictedAway: number;
  points: number | null;
  pointType: PointType | null;
  createdAt: string;
}

export interface RankingEntry {
  position: number;
  userId: string;
  fullName: string;
  username: string;
  totalPoints: number;
  exactos: number;
  winnerDiff: number;
  winnerOnly: number;
  none: number;
  totalPredictions: number;
}

export interface TeamStanding {
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

export interface DashboardStats {
  totalUsers: number;
  totalPredictions: number;
  totalMatches: number;
  finishedMatches: number;
  percentFinished: number;
  matchWithMostPredictions: { matchName: string; predictionCount: number } | null;
  averagePointsPerUser: number;
  lastMatchDistribution: {
    match: string;
    distribution: Array<{ type: string; count: number }>;
  } | null;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export type Phase = 'GROUP_STAGE' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER' | 'SEMI' | 'THIRD' | 'FINAL';
export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED';
export type PointType = 'EXACT' | 'WINNER_DIFF' | 'WINNER' | 'NONE';

export const PHASE_LABELS: Record<Phase, string> = {
  GROUP_STAGE: 'Fase de Grupos',
  ROUND_OF_32: 'Dieciseisavos',
  ROUND_OF_16: 'Octavos de Final',
  QUARTER: 'Cuartos de Final',
  SEMI: 'Semifinales',
  THIRD: 'Tercer Puesto',
  FINAL: 'Final',
};

export const GROUP_LABELS = ['A','B','C','D','E','F','G','H','I','J','K','L'];
