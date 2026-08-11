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
  tier?: 'S' | 'A' | 'B' | 'C' | null;
  phone?: string;
  note?: string;
}

export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface PlayerMatchStat {
  playerId: string;
  goals: number;
  assists: number;
}

export interface MatchInfo {
  id: string;
  date: string;
  opponent: string;
  location: string;
  time: string;
  matchType: 'friendly' | 'internal' | 'tournament';
  status: MatchStatus;
  weather?: {
    condition: 'rain' | 'clear' | 'cloudy';
    probability: number;
    note: string;
  };
  teamCount?: 2 | 3 | 4;
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
  category: 'Đóng quỹ thành viên' | 'Thuê sân' | 'Đồng phục' | 'Nước uống' | 'Khác';
  amount: number;
  note: string;
  playerId?: string | null;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  phone: string;
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
}
