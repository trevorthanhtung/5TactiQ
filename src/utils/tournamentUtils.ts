import type { Tournament, MatchInfo } from '../types';

/**
 * Derives the list of valid rounds for a tournament based on:
 * 1. Format: 'league' (round robin), 'knockout' (elimination cup), 'combined' (groups + knockout)
 * 2. Number of teams in the tournament
 * 3. Any rounds already created / played in this tournament
 */
export function getTournamentRounds(
  tour: Tournament | null | undefined,
  allMatches: MatchInfo[] = []
): string[] {
  if (!tour) {
    return ['Vòng 1', 'Vòng 2', 'Vòng 3'];
  }

  const format = tour.format || 'league';
  const teamCount = tour.teams?.length || 0;

  // Collect rounds from existing tournament matches
  const existingRounds: string[] = [];
  (tour.matches || []).forEach(m => {
    const r = m.round?.trim();
    if (r && !existingRounds.includes(r)) {
      existingRounds.push(r);
    }
  });

  // Also collect rounds from Matchday matches for this tournament
  allMatches.forEach(m => {
    const isThisTour = m.tournamentId === tour.id || 
      (m.tournamentName && m.tournamentName.trim().toLowerCase() === tour.name.trim().toLowerCase());
    if (isThisTour && m.round?.trim() && !existingRounds.includes(m.round.trim())) {
      existingRounds.push(m.round.trim());
    }
  });

  let formatRounds: string[] = [];

  if (format === 'knockout') {
    // Cúp / Loại trực tiếp: Tuyệt đối KHÔNG có "Vòng 1", "Vòng 2", "Vòng 10"
    if (teamCount > 16) {
      formatRounds = ['Vòng 1/16', 'Vòng 1/8', 'Tứ kết', 'Bán kết', 'Tranh hạng 3', 'Chung kết'];
    } else if (teamCount > 8) {
      formatRounds = ['Vòng 1/8', 'Tứ kết', 'Bán kết', 'Tranh hạng 3', 'Chung kết'];
    } else if (teamCount > 4) {
      formatRounds = ['Tứ kết', 'Bán kết', 'Tranh hạng 3', 'Chung kết'];
    } else if (teamCount > 2) {
      formatRounds = ['Bán kết', 'Tranh hạng 3', 'Chung kết'];
    } else if (teamCount === 2) {
      formatRounds = ['Chung kết'];
    } else {
      formatRounds = ['Tứ kết', 'Bán kết', 'Tranh hạng 3', 'Chung kết'];
    }
  } else if (format === 'combined') {
    // Thể thức kết hợp: Vòng bảng + Vòng loại trực tiếp
    const groupRounds = ['Vòng 1', 'Vòng 2', 'Vòng 3'];
    const koRounds = teamCount > 8 
      ? ['Vòng 1/8', 'Tứ kết', 'Bán kết', 'Tranh hạng 3', 'Chung kết']
      : ['Tứ kết', 'Bán kết', 'Tranh hạng 3', 'Chung kết'];
    formatRounds = [...groupRounds, ...koRounds];
  } else {
    // Thể thức Đấu vòng tròn (League):
    // Số vòng tính theo số đội (N đội: N-1 vòng nếu chẵn, N vòng nếu lẻ)
    let numRounds = 3;
    if (teamCount >= 2) {
      numRounds = teamCount % 2 === 0 ? teamCount - 1 : teamCount;
      if (numRounds < 1) numRounds = 1;
    }

    // Tìm vòng số lớn nhất đã có trong các trận
    let maxRoundNum = 0;
    existingRounds.forEach(r => {
      const matchNum = r.match(/vòng\s*(\d+)/i);
      if (matchNum) {
        const num = parseInt(matchNum[1], 10);
        if (!isNaN(num) && num > maxRoundNum) {
          maxRoundNum = num;
        }
      }
    });

    // Số vòng hiển thị = tối đa giữa số vòng lý thuyết của giải và (vòng cao nhất hiện có + 1)
    // Không bao giờ tự động gợi ý nhảy tới Vòng 10 nếu giải chỉ có ít đội
    const totalRounds = Math.max(numRounds, maxRoundNum > 0 ? maxRoundNum + 1 : numRounds);
    formatRounds = Array.from({ length: totalRounds }, (_, i) => `Vòng ${i + 1}`);
  }

  // Ghép formatRounds và existingRounds theo thứ tự logic, không trùng lặp
  const result: string[] = [];
  formatRounds.forEach(r => {
    if (!result.includes(r)) result.push(r);
  });
  existingRounds.forEach(r => {
    if (!result.includes(r)) result.push(r);
  });

  return result;
}
