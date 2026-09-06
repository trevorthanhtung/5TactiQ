export type Position = 'GK' | 'Fixo' | 'Ala' | 'Pivô';

export type HealthStatus = 'Khỏe mạnh' | 'Chấn thương nhẹ' | 'Chấn thương nặng' | 'Đang hồi phục';

export interface Player {
  id: string;
  name: string;
  jersey_number: number | null;
  positions: Position[];
  photo_url?: string;
  attendance?: 'present' | 'absent' | 'pending';
  eta?: string;
  team?: 'A' | 'B' | 'C' | 'D' | null;
  healthStatus?: HealthStatus;
  healthNote?: string;
  healthUpdatedAt?: string;
  isCaptain?: boolean;
  isBorrowed?: boolean;
  isYouth?: boolean;
  isPerMatch?: boolean;
  matchQuota?: number;
  isManuallyHidden?: boolean;
  isNPC?: boolean;
  matchId?: string;
  includeInStats?: boolean;
  tier?: 'S' | 'A' | 'B' | 'C' | null;
  phone?: string;
  note?: string;
}

export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface PlayerMatchStat {
  playerId: string;
  playerName?: string;
  goals: number;
  assists: number;
  rating?: number;
  isRatingOverridden?: boolean;
}

export interface MatchInfo {
  id: string;
  date: string;
  opponent: string;
  location: string;
  time: string;
  matchType: 'friendly' | 'internal' | 'tournament';
  tournamentId?: string;
  tournamentName?: string;
  round?: string;
  status: MatchStatus;
  weather?: {
    condition: 'rain' | 'clear' | 'cloudy';
    probability: number;
    note: string;
  };
  teamCount?: 2 | 3 | 4;
  trackStats?: boolean;
  teamAColor: string;
  teamBColor: string;
  teamCColor?: string;
  teamDColor?: string;
  scoreUs?: number | null;
  scoreOpponent?: number | null;
  scoreTeamA?: number | null;
  scoreTeamB?: number | null;
  scoreTeamC?: number | null;
  scoreTeamD?: number | null;
  attendance?: Record<string, 'present' | 'absent' | 'pending'>;
  eta?: Record<string, string>;
  teams?: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  stats?: PlayerMatchStat[];
  pitchFee?: number | null;
  feeTimeSlot?: 'day' | 'night' | null;
  feePayments?: Record<string, boolean>;
}

export interface Match {
  id: string;
  date: string; // ISO string
  opponent: string;
  location: string;
  score_us: number | null;
  score_opponent: number | null;
  weather_note?: string;
}

export interface MatchStat {
  id: string;
  match_id: string;
  player_id: string;
  goals: number;
  assists: number;
  attended: boolean;
}

export interface TrainingSession {
  id: string;
  date: string;
  time: string;
  venue: string;
  note: string;
  status: 'upcoming' | 'finished' | 'cancelled';
  attendance: Record<string, 'present' | 'absent' | 'late' | 'excused' | 'pending'>;
}

export interface TacticFrame {
  player_id: string;
  x: number;
  y: number;
}

export interface Tactic {
  id: string;
  name: string;
  formation_type: string;
  frames: TacticFrame[][]; // Array of animation steps, each step = array of player positions
}

export interface FundTransaction {
  id: string;
  date: string;
  type: 'Thu' | 'Chi';
  category: 'Đóng quỹ thành viên' | 'Tiền phạt' | 'Thuê sân' | 'Đồng phục' | 'Nước uống' | 'Khác' | string;
  amount: number;
  note: string;
  playerId?: string | null;
}

export interface FineRecord {
  id: string;
  playerId: string;
  reason: string;
  amount: number;
  date: string;
  status: 'unpaid' | 'paid';
  paidAt?: string;
  transactionId?: string;
  note?: string;
}

export interface TournamentTeam {
  id: string;
  name: string;
  isOurTeam?: boolean;
}

export interface TournamentMatch {
  id: string;
  round: string; // VD: "Vòng 1", "Tứ kết", "Bán kết", "Chung kết"
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  date?: string;
  time?: string;
  venue?: string;
  status: 'scheduled' | 'finished';
}

export interface Tournament {
  id: string;
  name: string;
  season?: string;
  format: 'league' | 'knockout' | 'combined';
  status: 'upcoming' | 'ongoing' | 'completed';
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: 'ball' | 'bib' | 'medical' | 'training' | 'other';
  quantity: number;
  condition: 'good' | 'fair' | 'damaged' | 'missing';
  assignedPlayerId?: string | null;
  assignedDate?: string;
  notes?: string;
}

export interface JerseyAssignment {
  id: string;
  jerseyNumber: number;
  playerId?: string | null;
  size?: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  status: 'assigned' | 'available';
  kitType?: 'home' | 'away' | 'third';
  notes?: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  phone: string;
  note?: string;
  priceDay?: number | null;
  priceNight?: number | null;
  dayTimeRange?: string;
  nightTimeRange?: string;
}

export interface TeamSettings {
  teamName: string;
  logoUrl: string;
  userDisplayName?: string;
  foundedYear?: number;
  primaryColor?: string;
  secondaryColor?: string;
  seasonStartDate?: string; // ISO format YYYY-MM-DD
  seasonEndDate?: string;   // ISO format YYYY-MM-DD
  currency?: string;
}

