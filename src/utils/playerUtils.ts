import type { Player, MatchInfo } from '../types';

/**
 * Calculates the total number of matches a player attended ('present').
 */
export function getPlayerAttendedMatches(playerId: string, matches: MatchInfo[]): number {
  if (!matches || matches.length === 0) return 0;
  let count = 0;
  for (const m of matches) {
    if (m.attendance && m.attendance[playerId] === 'present') {
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
