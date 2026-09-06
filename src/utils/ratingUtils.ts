/**
 * PES / FIFA Style Match Rating Utility
 * 
 * Features:
 * - Diminishing returns to strictly prevent rating inflation
 * - Base rating: 6.0 (standard performance when stepping onto the pitch)
 * - Goals:
 *   - 1st goal: +0.6 (6.6)
 *   - 2nd goal: +0.5 (7.1)
 *   - 3rd goal (Hat-trick): +0.5 (7.6)
 *   - 4th goal (Poker): +0.4 (8.0)
 *   - 5th+ goal: +0.3 each
 * - Assists:
 *   - 1st assist: +0.3 (6.3)
 *   - 2nd assist: +0.3 (6.6)
 *   - 3rd assist: +0.2 (6.8)
 *   - 4th+ assist: +0.15 each
 * - Clean sheet GK: +0.4 (6.4)
 * - Clamped strictly between 1.0 and 10.0, rounded to 1 decimal place.
 */

export function calculateDefaultRating(
  goals: number = 0,
  assists: number = 0,
  cleanSheetGK: boolean = false
): number {
  let rating = 6.0;
  if (cleanSheetGK) {
    rating += 0.4;
  }

  const g = Math.max(0, goals || 0);
  if (g === 1) {
    rating += 0.6;
  } else if (g === 2) {
    rating += 1.1;
  } else if (g === 3) {
    rating += 1.6;
  } else if (g === 4) {
    rating += 2.0;
  } else if (g >= 5) {
    rating += 2.0 + (g - 4) * 0.3;
  }

  const a = Math.max(0, assists || 0);
  if (a === 1) {
    rating += 0.3;
  } else if (a === 2) {
    rating += 0.6;
  } else if (a === 3) {
    rating += 0.8;
  } else if (a >= 4) {
    rating += 0.8 + (a - 3) * 0.15;
  }

  return Number(Math.min(10.0, Math.max(1.0, rating)).toFixed(1));
}

/**
 * Resolves the match rating for a player stat entry.
 * If explicitly rated (> 0), uses that rating.
 * Otherwise, calculates the realistic fallback from goals & assists.
 */
export function resolvePlayerMatchRating(
  stat?: { goals?: number; assists?: number; rating?: number },
  isCleanSheet: boolean = false
): number {
  if (!stat) return 0;
  if (typeof stat.rating === 'number' && stat.rating > 0) {
    return Number(stat.rating.toFixed(1));
  }
  const g = stat.goals || 0;
  const a = stat.assists || 0;
  if (g > 0 || a > 0 || isCleanSheet) {
    return calculateDefaultRating(g, a, isCleanSheet);
  }
  return 0;
}
