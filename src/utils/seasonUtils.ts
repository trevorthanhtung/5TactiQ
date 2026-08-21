import type { TeamSettings } from '../types';

export interface SeasonRange {
  startDate: Date;
  endDate: Date;
  label: string; // e.g. "2026", "2026/2027", "2027/2028"
  hasSeasonConfig: boolean;
}

/**
 * Parses a YYYY-MM-DD string into month (1-12) and day (1-31).
 */
const parseMonthDay = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length >= 3) {
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (!isNaN(month) && !isNaN(day)) {
      return { month, day };
    }
  }
  return null;
};

/**
 * Computes the active season range based on the user's configured season pattern.
 * Automatically rolls over year-to-year across calendar and cross-year cycles!
 */
export function getCurrentSeasonRange(
  settings: TeamSettings,
  refDate: Date = new Date()
): SeasonRange | null {
  if (!settings.seasonStartDate || !settings.seasonEndDate) {
    return null;
  }

  const startMD = parseMonthDay(settings.seasonStartDate);
  const endMD = parseMonthDay(settings.seasonEndDate);

  if (!startMD || !endMD) {
    return null;
  }

  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth() + 1;
  const currentDay = refDate.getDate();

  // Compare month & day to determine if the season is intra-year or cross-year
  const isCrossYear = startMD.month > endMD.month || (startMD.month === endMD.month && startMD.day > endMD.day);

  let startYear: number;
  let endYear: number;

  if (!isCrossYear) {
    // Single calendar year season (e.g. 01/01 -> 31/12 or 01/03 -> 30/11)
    startYear = currentYear;
    endYear = currentYear;
  } else {
    // Cross-year season (e.g. 20/10 -> 04/05 or 01/08 -> 31/05)
    const isAfterOrAtStart = currentMonth > startMD.month || (currentMonth === startMD.month && currentDay >= startMD.day);
    const isBeforeOrAtEnd = currentMonth < endMD.month || (currentMonth === endMD.month && currentDay <= endMD.day);

    if (isAfterOrAtStart) {
      startYear = currentYear;
      endYear = currentYear + 1;
    } else if (isBeforeOrAtEnd) {
      startYear = currentYear - 1;
      endYear = currentYear;
    } else {
      // Off-season gap (e.g. between May 5 and Oct 19).
      // Prepares for the upcoming new season starting this year
      startYear = currentYear;
      endYear = currentYear + 1;
    }
  }

  // Construct precise start and end dates
  const startDate = new Date(startYear, startMD.month - 1, startMD.day, 0, 0, 0, 0);
  const endDate = new Date(endYear, endMD.month - 1, endMD.day, 23, 59, 59, 999);
  const label = startYear === endYear ? `${startYear}` : `${startYear}/${endYear}`;

  return {
    startDate,
    endDate,
    label,
    hasSeasonConfig: true,
  };
}

/**
 * Checks if a given match date string (YYYY-MM-DD) falls inside the active season range.
 */
export function isMatchInSeason(matchDateStr?: string, season?: SeasonRange | null): boolean {
  if (!season || !season.hasSeasonConfig) return true;
  if (!matchDateStr) return true;

  const parts = matchDateStr.split('-');
  if (parts.length < 3) return true;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return true;
  const matchDate = new Date(year, month - 1, day, 12, 0, 0);

  return matchDate >= season.startDate && matchDate <= season.endDate;
}
