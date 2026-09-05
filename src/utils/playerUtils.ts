import type { Player, MatchInfo } from '../types';
import { compareVietnameseNames } from './sortUtils';

/**
 * Calculates the total number of matches a player attended ('present').
 */
export function getPlayerAttendedMatches(playerId: string, matches: MatchInfo[]): number {
  if (!matches || matches.length === 0) return 0;
  let count = 0;
  for (const m of matches) {
    if (m.status === 'finished' && m.attendance && m.attendance[playerId] === 'present') {
      count += 1;
    }
  }
  return count;
}

/**
 * Returns the per-match status including attended matches, quota, and whether the quota is met.
 */
export function getPlayerPerMatchStatus(player: Player, matches: MatchInfo[]) {
  const quota = player.matchQuota || 1;
  const attended = getPlayerAttendedMatches(player.id, matches);
  const isCompleted = attended >= quota;
  return {
    attended,
    quota,
    isCompleted
  };
}

/**
 * Determines whether a player should be placed in the "Hidden" list.
 * - Explicitly manually hidden (`isManuallyHidden === true`)
 * - OR configured as per-match (`isPerMatch === true`) and has attended >= matchQuota matches.
 */
export function isPlayerHidden(player: Player, matches: MatchInfo[]): boolean {
  if (player.isManuallyHidden) return true;
  if (player.isPerMatch) {
    const quota = player.matchQuota || 1;
    const attended = getPlayerAttendedMatches(player.id, matches);
    return attended >= quota;
  }
  return false;
}

/**
 * Category hierarchy for roster sorting:
 * 0: Main Squad (Đội hình chính)
 * 1: Youth (Đội trẻ)
 * 2: Borrowed / Loan (Mượn)
 * 3: Per-Match (Theo trận)
 * 4: NPC / Guest (NPC / Khách)
 */
export function getPlayerCategoryRank(player: Player): number {
  if (player.isNPC) return 4;
  if (player.isPerMatch) return 3;
  if (player.isBorrowed) return 2;
  if (player.isYouth) return 1;
  return 0;
}

/**
 * Standardized player sorting rule:
 * 1. Active players before Hidden players
 * 2. Category hierarchy: Main Squad -> Youth -> Borrowed -> Per-Match -> NPC
 * 3. Players with jersey number (ASC) before players without jersey number
 * 4. Vietnamese name alphabetical order (Given Name -> Family/Middle names)
 */
export function comparePlayers(a: Player, b: Player, matches: MatchInfo[] = []): number {
  // 1. Hidden status
  const aHidden = isPlayerHidden(a, matches) ? 1 : 0;
  const bHidden = isPlayerHidden(b, matches) ? 1 : 0;
  if (aHidden !== bHidden) return aHidden - bHidden;

  // 2. Category Rank
  const aRank = getPlayerCategoryRank(a);
  const bRank = getPlayerCategoryRank(b);
  if (aRank !== bRank) return aRank - bRank;

  // 3. Jersey Number
  const numA = (a.jersey_number !== null && a.jersey_number !== undefined && !isNaN(Number(a.jersey_number))) ? Number(a.jersey_number) : null;
  const numB = (b.jersey_number !== null && b.jersey_number !== undefined && !isNaN(Number(b.jersey_number))) ? Number(b.jersey_number) : null;

  if (numA !== null && numB !== null) {
    if (numA !== numB) return numA - numB;
    return compareVietnameseNames(a.name, b.name);
  }
  if (numA !== null) return -1;
  if (numB !== null) return 1;

  // 4. Name
  return compareVietnameseNames(a.name, b.name);
}

/**
 * Checks if a player is eligible for club statistics / leaderboards:
 * - Must NOT be a per-match player (isPerMatch === true / letter 'M')
 * - Must NOT be an NPC (unless explicitly includeInStats === true)
 * - Only includes: Official / Main Squad, Loan (isBorrowed), and Youth (isYouth).
 */
export function isPlayerEligibleForStats(player: Player): boolean {
  if (player.isPerMatch) return false;
  if (player.isNPC && !player.includeInStats) return false;
  return true;
}

/**
 * Checks if a player belongs to the core official squad:
 * - Includes ONLY: Official / Main Squad (Chính thức), Loan (Mượn - isBorrowed), Youth (Đội trẻ - isYouth).
 * - Excludes: Per-match players (Đá theo trận - isPerMatch) and NPCs (isNPC).
 * - Excludes: Hidden players.
 */
export function isCoreSquadPlayer(player: Player, matches: MatchInfo[] = []): boolean {
  if (player.isNPC) return false;
  if (player.isPerMatch) return false;
  if (player.isManuallyHidden) return false;
  if (isPlayerHidden(player, matches)) return false;
  return true;
}

/**
 * Identifies IDs of stale temporary NPCs that should be cleaned up:
 * - NPCs whose match has finished (`status === 'finished'`)
 * - NPCs whose match no longer exists in `matches` (orphan NPCs)
 * - NPCs without a matchId if they are not active in any ongoing/upcoming match
 */
export function getCleanupNpcIds(players: Player[], matches: MatchInfo[]): string[] {
  const ongoingMatchIds = new Set(matches.filter(m => m.status !== 'finished').map(m => m.id));
  return players
    .filter(p => {
      if (!p.isNPC) return false;
      if (p.matchId) {
        return !ongoingMatchIds.has(p.matchId);
      }
      const isInOngoingMatch = matches.some(m => m.status !== 'finished' && (m.teams?.[p.id] || m.attendance?.[p.id]));
      return !isInOngoingMatch;
    })
    .map(p => p.id);
}


