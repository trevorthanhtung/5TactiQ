import type { MatchInfo } from '../types';

/**
 * Determines whether stats (goals, assists, and player ratings) from a match
 * should be counted in all-time leaderboards, player profiles, and team statistics.
 * 
 * Rules:
 * 1. Non-internal matches (friendly, tournament) are ALWAYS tracked.
 * 2. Internal matches with `trackStats === true` are tracked.
 * 3. CRITICAL: If an internal match has recorded player stats (goals > 0, assists > 0, or rating > 0),
 *    it is ALWAYS counted in stats so player contributions and ratings are never silently ignored.
 * 4. Default for new/unspecified matches is to track stats (`trackStats !== false`).
 */
export function shouldTrackMatchStats(match?: MatchInfo | null): boolean {
  if (!match) return false;
  if (match.matchType !== 'internal') return true;
  if (match.trackStats === true) return true;
  
  // If the match has recorded individual contributions, it must be counted in statistics
  if (match.stats && match.stats.some(s => (s.goals || 0) > 0 || (s.assists || 0) > 0 || (typeof s.rating === 'number' && s.rating > 0))) {
    return true;
  }

  return match.trackStats !== false;
}
