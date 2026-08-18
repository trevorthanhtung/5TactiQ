import type { MatchInfo, Player } from '../types';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface RosterExportOptions {
  match: MatchInfo;
  players: Player[];
  onlyPresent?: boolean;
  groupByTeams?: boolean;
  teamName?: string;
  labels?: {
    internalMatch?: string;
    friendlyMatch?: string;
    tournamentMatch?: string;
    present?: string;
    absent?: string;
    pending?: string;
    teamA?: string;
    teamB?: string;
    teamC?: string;
    teamD?: string;
    noBib?: string;
    jerseyNo?: string;
    name?: string;
    status?: string;
    team?: string;
    position?: string;
    type?: string;
    notes?: string;
    captain?: string;
    guest?: string;
    youth?: string;
    official?: string;
  };
}

/**
 * Format Date helper
 */
export const formatDateString = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    if (y && m && d) return `${d}/${m}/${y}`;
    const dt = new Date(dateStr);
    if (!isNaN(dt.getTime())) {
      return dt.toLocaleDateString('vi-VN');
    }
  } catch {
    // fallback
  }
  return dateStr;
};

/**
 * Safe CSV field escaping
 */
const escapeCsvField = (field: string | number | null | undefined): string => {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Generate UTF-8 CSV content with BOM for perfect Excel compatibility
 */
export const generateRosterCsv = (options: RosterExportOptions): string => {
  const { match, players, onlyPresent = false, teamName = '5TactiQ', labels = {} } = options;

  const matchTitle = match.matchType === 'internal'
    ? (labels.internalMatch || 'Trận Đấu Nội Bộ')
    : (match.opponent ? `VS ${match.opponent}` : (labels.friendlyMatch || 'Trận Giao Hữu'));

  const attendanceMap = match.attendance || {};
  const teamsMap = match.teams || {};

  // Filter players
  let targetPlayers = [...players];
  if (onlyPresent) {
    targetPlayers = targetPlayers.filter(p => attendanceMap[p.id] === 'present');
  }

  // Sort players: present first, then jersey number, then name
  targetPlayers.sort((a, b) => {
    const statusA = attendanceMap[a.id] || 'pending';
    const statusB = attendanceMap[b.id] || 'pending';
    const statusWeight = { present: 0, pending: 1, absent: 2 };
    if (statusWeight[statusA] !== statusWeight[statusB]) {
      return statusWeight[statusA] - statusWeight[statusB];
    }

    const numA = (a.jersey_number !== null && a.jersey_number !== undefined && !isNaN(Number(a.jersey_number))) ? Number(a.jersey_number) : null;
    const numB = (b.jersey_number !== null && b.jersey_number !== undefined && !isNaN(Number(b.jersey_number))) ? Number(b.jersey_number) : null;
    if (numA !== null && numB !== null) {
      if (numA !== numB) return numA - numB;
    } else if (numA !== null) {
      return -1;
    } else if (numB !== null) {
      return 1;
    }
    return a.name.localeCompare(b.name, 'vi');
  });

  const presentCount = players.filter(p => attendanceMap[p.id] === 'present').length;
  const absentCount = players.filter(p => attendanceMap[p.id] === 'absent').length;
  const pendingCount = players.filter(p => !attendanceMap[p.id] || attendanceMap[p.id] === 'pending').length;

  const lines: string[] = [];

  // Metadata block
  lines.push(`${escapeCsvField('ĐỘI BÓNG / CLB')},${escapeCsvField(teamName)}`);
  lines.push(`${escapeCsvField('TRẬN ĐẤU')},${escapeCsvField(matchTitle)}`);
  lines.push(`${escapeCsvField('THỜI GIAN')},${escapeCsvField(`${formatDateString(match.date)} ${match.time || ''}`.trim())}`);
  lines.push(`${escapeCsvField('ĐỊA ĐIỂM')},${escapeCsvField(match.location || 'Chưa rõ sân')}`);
  lines.push(`${escapeCsvField('TỔNG CÓ MẶT')},${escapeCsvField(presentCount)}`);
  lines.push(`${escapeCsvField('TỔNG VẮNG')},${escapeCsvField(absentCount)}`);
  lines.push(`${escapeCsvField('TỔNG CHƯA RÕ')},${escapeCsvField(pendingCount)}`);
  lines.push(''); // Empty line

  // Header row
  lines.push([
    escapeCsvField('STT'),
    escapeCsvField(labels.jerseyNo || 'Số áo'),
    escapeCsvField(labels.name || 'Họ và tên'),
    escapeCsvField(labels.status || 'Trạng thái'),
    escapeCsvField(labels.team || 'Đội'),
    escapeCsvField(labels.position || 'Vị trí'),
    escapeCsvField(labels.type || 'Phân loại'),
    escapeCsvField(labels.notes || 'Ghi chú')
  ].join(','));

  // Player rows
  targetPlayers.forEach((p, idx) => {
    const rawStatus = attendanceMap[p.id] || 'pending';
    const statusText = rawStatus === 'present'
      ? (labels.present || 'Có mặt')
      : rawStatus === 'absent'
      ? (labels.absent || 'Vắng')
      : (labels.pending || 'Chưa rõ');

    const rawTeam = teamsMap[p.id];
    let teamText = '-';
    if (rawTeam === 'A') teamText = labels.teamA || 'Đội A';
    else if (rawTeam === 'B') teamText = labels.teamB || 'Đội B';
    else if (rawTeam === 'C') teamText = labels.teamC || 'Đội C';
    else if (rawTeam === 'D') teamText = labels.teamD || 'Đội D';

    const posText = p.positions && p.positions.length > 0 ? p.positions.join(', ') : '-';

    let typeText = labels.official || 'Chính thức';
    if (p.isCaptain) typeText = labels.captain || 'Đội trưởng';
    else if (p.isBorrowed) typeText = labels.guest || 'Cầu thủ khách';
    else if (p.isYouth) typeText = labels.youth || 'Cầu thủ trẻ';

    lines.push([
      escapeCsvField(idx + 1),
      escapeCsvField(p.jersey_number !== null && p.jersey_number !== undefined ? p.jersey_number : '?'),
      escapeCsvField(p.name),
      escapeCsvField(statusText),
      escapeCsvField(teamText),
      escapeCsvField(posText),
      escapeCsvField(typeText),
      escapeCsvField(p.note || p.healthNote || '')
    ].join(','));
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel opens UTF-8 properly without font corruption
  return '\uFEFF' + lines.join('\r\n');
};

/**
 * Trigger download of CSV file
 */
export const downloadRosterCsv = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copy CSV text to Clipboard
 */
export const copyCsvToClipboard = async (csvContent: string): Promise<boolean> => {
  try {
    // Strip BOM before copying plain text to clipboard for clean pasting
    const cleanText = csvContent.replace(/^\uFEFF/, '');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(cleanText);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = cleanText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch (err) {
    console.error('Failed to copy CSV:', err);
    return false;
  }
};

/**
 * Helper: Draw a clean subtle rounded rect
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillColor?: string,
  strokeColor?: string,
  lineWidth: number = 1
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/**
 * Vector Lucide Calendar Icon for Canvas
 */
function drawLucideCalendar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number = 14, color: string = '#94a3b8') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.roundRect(x, y + 2, size, size - 2, 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(x, y + 6);
  ctx.lineTo(x + size, y + 6);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(x + 3.5, y);
  ctx.lineTo(x + 3.5, y + 3.5);
  ctx.moveTo(x + size - 3.5, y);
  ctx.lineTo(x + size - 3.5, y + 3.5);
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Vector Lucide Clock Icon for Canvas
 */
function drawLucideClock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number = 14, color: string = '#94a3b8') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2 - 0.5;
  
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(cx, cy - r + 3);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx + r - 3.5, cy);
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Vector Lucide MapPin Icon for Canvas
 */
function drawLucideMapPin(ctx: CanvasRenderingContext2D, x: number, y: number, size: number = 14, color: string = '#94a3b8') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const cx = x + size / 2;
  const topY = y + 1;
  const r = size / 2 - 1.5;
  const centerCy = topY + r;
  
  ctx.beginPath();
  ctx.arc(cx, centerCy, r, Math.PI * 0.78, Math.PI * 2.22, false);
  ctx.lineTo(cx, y + size);
  ctx.closePath();
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(cx, centerCy, 1.8, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Render match roster onto a high-definition HTML5 Canvas (1080px wide)
 * DESIGN PHILOSOPHY: Ultra-Clean, Minimalist Swiss/Editorial Football Match Sheet
 */
export const renderRosterToCanvas = (
  options: RosterExportOptions
): HTMLCanvasElement => {
  const {
    match,
    players,
    onlyPresent = false,
    groupByTeams = false,
    teamName = '5TACTIQ',
    labels = {}
  } = options;

  const attendanceMap = match.attendance || {};
  const teamsMap = match.teams || {};

  // Filter players
  let targetPlayers = [...players];
  if (onlyPresent) {
    targetPlayers = targetPlayers.filter(p => attendanceMap[p.id] === 'present');
  }

  // Count stats
  const presentPlayers = players.filter(p => attendanceMap[p.id] === 'present');
  const absentPlayers = players.filter(p => attendanceMap[p.id] === 'absent');
  const pendingPlayers = players.filter(p => !attendanceMap[p.id] || attendanceMap[p.id] === 'pending');

  const canvasWidth = 1080;
  const paddingX = 52;
  const contentWidth = canvasWidth - paddingX * 2; // 976px

  const ROW_HEIGHT = 44;
  const TEAM_HEADER_HEIGHT = 38;

  // Calculate layout structure
  const isInternalSplit = groupByTeams && match.matchType === 'internal';
  const activeTeams = (['A', 'B', 'C', 'D'] as const).slice(0, match.teamCount || 2);
  
  // Calculate dynamic canvas height
  let estimatedHeight = 230; // Header area + stats bar + divider

  if (isInternalSplit) {
    if (activeTeams.length === 2) {
      // 2 columns
      const countA = targetPlayers.filter(p => teamsMap[p.id] === 'A').length;
      const countB = targetPlayers.filter(p => teamsMap[p.id] === 'B').length;
      const maxRows = Math.max(countA, countB, 1);
      estimatedHeight += TEAM_HEADER_HEIGHT + maxRows * ROW_HEIGHT + 36;
    } else if (activeTeams.length === 3) {
      // 3 columns
      const countA = targetPlayers.filter(p => teamsMap[p.id] === 'A').length;
      const countB = targetPlayers.filter(p => teamsMap[p.id] === 'B').length;
      const countC = targetPlayers.filter(p => teamsMap[p.id] === 'C').length;
      const maxRows = Math.max(countA, countB, countC, 1);
      estimatedHeight += TEAM_HEADER_HEIGHT + maxRows * ROW_HEIGHT + 36;
    } else {
      // 4 teams: 2x2 grid
      const countA = targetPlayers.filter(p => teamsMap[p.id] === 'A').length;
      const countB = targetPlayers.filter(p => teamsMap[p.id] === 'B').length;
      const countC = targetPlayers.filter(p => teamsMap[p.id] === 'C').length;
      const countD = targetPlayers.filter(p => teamsMap[p.id] === 'D').length;
      const row1Max = Math.max(countA, countB, 1);
      const row2Max = Math.max(countC, countD, 1);
      estimatedHeight += (TEAM_HEADER_HEIGHT + row1Max * ROW_HEIGHT + 24) + (TEAM_HEADER_HEIGHT + row2Max * ROW_HEIGHT + 36);
    }
  } else {
    // 2-column standard list
    const rows = Math.ceil(targetPlayers.length / 2);
    estimatedHeight += rows * ROW_HEIGHT + 40;
  }

  // Absent & Pending summary list (if not onlyPresent and any exist)
  if (!onlyPresent && (absentPlayers.length > 0 || pendingPlayers.length > 0)) {
    const otherCount = absentPlayers.length + pendingPlayers.length;
    const otherRows = Math.ceil(otherCount / 2);
    estimatedHeight += 32 + otherRows * 36 + 24;
  }

  estimatedHeight += 36; // Clean bottom padding

  const canvasHeight = Math.max(760, estimatedHeight);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Sleek, Minimalist Matte Dark Canvas Background
  ctx.fillStyle = '#0f1013';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Subtle outer border
  ctx.strokeStyle = '#1e2128';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2);

  // 2. Minimalist Header
  let currentY = 46;

  // Club Name & Match Type in elegant single row
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 15px "Inter", sans-serif';
  ctx.letterSpacing = '1.5px';
  const clubName = (teamName || '5TACTIQ').toUpperCase();
  ctx.fillText(clubName, paddingX, currentY);

  const matchTypeStr = match.matchType === 'internal'
    ? (labels.internalMatch || 'TRẬN ĐẤU NỘI BỘ').toUpperCase()
    : match.matchType === 'tournament'
    ? (labels.tournamentMatch || 'GIẢI ĐẤU').toUpperCase()
    : (labels.friendlyMatch || 'TRẬN GIAO HỮU').toUpperCase();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.font = '600 13px "Inter", sans-serif';
  ctx.fillText(matchTypeStr, canvasWidth - paddingX, currentY);
  ctx.textAlign = 'left';

  currentY += 36;

  // Main Match Title
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 36px "Oswald", "Inter", sans-serif';
  const mainTitleText = match.matchType === 'internal'
    ? (labels.internalMatch || 'TRẬN ĐẤU NỘI BỘ').toUpperCase()
    : match.opponent
    ? `${clubName}  VS  ${match.opponent.toUpperCase()}`
    : 'DANH SÁCH THI ĐẤU';
  ctx.fillText(mainTitleText, paddingX, currentY);

  currentY += 30;

  // Match Meta Bar with Vector Lucide Icons (Date, Time, Venue, Weather)
  ctx.font = '500 14px "Inter", sans-serif';
  ctx.fillStyle = '#94a3b8';
  let curMetaX = paddingX;
  const metaY = currentY;
  const iconY = metaY - 12;

  // 1. Date with Lucide Calendar
  drawLucideCalendar(ctx, curMetaX, iconY, 15, '#94a3b8');
  curMetaX += 20;
  const dateText = formatDateString(match.date);
  ctx.fillText(dateText, curMetaX, metaY);
  curMetaX += ctx.measureText(dateText).width + 14;

  // 2. Time with Lucide Clock (if present)
  if (match.time) {
    drawLucideClock(ctx, curMetaX, iconY, 15, '#94a3b8');
    curMetaX += 20;
    ctx.fillText(match.time, curMetaX, metaY);
    curMetaX += ctx.measureText(match.time).width + 14;
  }

  // Dot separator
  ctx.fillStyle = '#475569';
  ctx.fillText('•', curMetaX, metaY);
  curMetaX += 14;

  // 3. Venue with Lucide MapPin
  const venueStr = match.location || 'Chưa rõ sân';
  drawLucideMapPin(ctx, curMetaX, iconY, 15, '#94a3b8');
  curMetaX += 20;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(venueStr, curMetaX, metaY);
  curMetaX += ctx.measureText(venueStr).width + 14;

  currentY += 28;

  // Minimalist Summary Strip (Counters with subtle color dots)
  drawRoundedRect(ctx, paddingX, currentY, contentWidth, 38, 6, '#15171d', '#222631', 1);

  // Present
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(paddingX + 22, currentY + 19, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px "Inter", sans-serif';
  ctx.fillText(`${presentPlayers.length}`, paddingX + 34, currentY + 24);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 13px "Inter", sans-serif';
  ctx.fillText((labels.present || 'Có mặt').toUpperCase(), paddingX + 54, currentY + 24);

  // Absent
  const absentX = paddingX + 180;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(absentX, currentY + 19, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px "Inter", sans-serif';
  ctx.fillText(`${absentPlayers.length}`, absentX + 12, currentY + 24);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 13px "Inter", sans-serif';
  ctx.fillText((labels.absent || 'Vắng').toUpperCase(), absentX + 32, currentY + 24);

  // Pending
  const pendingX = absentX + 160;
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(pendingX, currentY + 19, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px "Inter", sans-serif';
  ctx.fillText(`${pendingPlayers.length}`, pendingX + 12, currentY + 24);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 13px "Inter", sans-serif';
  ctx.fillText((labels.pending || 'Chưa rõ').toUpperCase(), pendingX + 32, currentY + 24);

  currentY += 56;

  // 3. Minimalist Player Row Renderer (ONLY Jersey number + Full Player Name)
  const drawMinimalPlayerRow = (p: Player, x: number, y: number, w: number, h: number) => {
    // Row container background
    drawRoundedRect(ctx, x, y, w, h - 4, 4, '#14161c', '#1e222b', 1);

    // Jersey Number
    const jNum = (p.jersey_number !== null && p.jersey_number !== undefined && !isNaN(Number(p.jersey_number)))
      ? String(p.jersey_number).padStart(2, '0')
      : '—';

    drawRoundedRect(ctx, x + 8, y + 6, 32, h - 16, 4, '#1c1f28');
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px "Oswald", "Inter", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(jNum, x + 24, y + 23);

    // Player Full Name - Clean, bold, full available width!
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 14px "Inter", sans-serif';
    
    let nameStr = p.name.toUpperCase();
    const nameX = x + 48;
    const maxTextW = w - 58; // Full width dedicated to the player's name
    while (ctx.measureText(nameStr).width > maxTextW && nameStr.length > 3) {
      nameStr = nameStr.slice(0, -1);
    }
    if (nameStr.length < p.name.length) nameStr += '..';
    ctx.fillText(nameStr, nameX, y + 24);
  };

  // 4. Roster Render Logic
  if (isInternalSplit) {
    const drawTeamBlock = (teamKey: 'A' | 'B' | 'C' | 'D', x: number, y: number, w: number): number => {
      const teamPlayers = targetPlayers.filter(p => teamsMap[p.id] === teamKey);

      // Clean Uniform Minimalist Team Header
      drawRoundedRect(ctx, x, y, w, TEAM_HEADER_HEIGHT, 4, '#15171e', '#1f232e', 1);

      // Team Title
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 14px "Oswald", "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`ĐỘI ${teamKey}`, x + 14, y + 23);

      // Player Count
      ctx.textAlign = 'right';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 12px "Inter", sans-serif';
      ctx.fillText(`${teamPlayers.length} CẦU THỦ`, x + w - 12, y + 23);
      ctx.textAlign = 'left';

      let rowY = y + TEAM_HEADER_HEIGHT + 8;
      if (teamPlayers.length === 0) {
        ctx.fillStyle = '#475569';
        ctx.font = 'italic 13px "Inter", sans-serif';
        ctx.fillText('Chưa có cầu thủ trong đội', x + 12, rowY + 18);
        rowY += 36;
      } else {
        teamPlayers.forEach(p => {
          drawMinimalPlayerRow(p, x, rowY, w, ROW_HEIGHT);
          rowY += ROW_HEIGHT;
        });
      }

      return rowY;
    };

    if (activeTeams.length === 2) {
      // 2 columns
      const colGap = 20;
      const colW = (contentWidth - colGap) / 2;
      const bottomA = drawTeamBlock('A', paddingX, currentY, colW);
      const bottomB = drawTeamBlock('B', paddingX + colW + colGap, currentY, colW);
      currentY = Math.max(bottomA, bottomB) + 16;
    } else if (activeTeams.length === 3) {
      // 3 columns
      const colGap = 16;
      const colW = (contentWidth - colGap * 2) / 3;
      const bottomA = drawTeamBlock('A', paddingX, currentY, colW);
      const bottomB = drawTeamBlock('B', paddingX + colW + colGap, currentY, colW);
      const bottomC = drawTeamBlock('C', paddingX + (colW + colGap) * 2, currentY, colW);
      currentY = Math.max(bottomA, bottomB, bottomC) + 16;
    } else {
      // 4 teams (2x2 grid)
      const colGap = 20;
      const colW = (contentWidth - colGap) / 2;
      const bottomA = drawTeamBlock('A', paddingX, currentY, colW);
      const bottomB = drawTeamBlock('B', paddingX + colW + colGap, currentY, colW);
      const row1Bottom = Math.max(bottomA, bottomB) + 16;

      const bottomC = drawTeamBlock('C', paddingX, row1Bottom, colW);
      const bottomD = drawTeamBlock('D', paddingX + colW + colGap, row1Bottom, colW);
      currentY = Math.max(bottomC, bottomD) + 16;
    }
  } else {
    // 2-COLUMN STANDARD LIST
    const colGap = 20;
    const colW = (contentWidth - colGap) / 2;

    targetPlayers.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cardX = paddingX + col * (colW + colGap);
      const cardY = currentY + row * ROW_HEIGHT;
      drawMinimalPlayerRow(p, cardX, cardY, colW, ROW_HEIGHT);
    });

    const totalRows = Math.ceil(targetPlayers.length / 2);
    currentY += totalRows * ROW_HEIGHT + 16;
  }

  // 5. Absent / Pending List (if not onlyPresent and any exist)
  if (!onlyPresent && (absentPlayers.length > 0 || pendingPlayers.length > 0)) {
    currentY += 8;
    ctx.strokeStyle = '#1e2128';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingX, currentY);
    ctx.lineTo(canvasWidth - paddingX, currentY);
    ctx.stroke();
    currentY += 18;

    const otherPlayers = [
      ...absentPlayers.map(p => ({ ...p, statusDisplay: (labels.absent || 'Vắng').toUpperCase(), statusColor: '#ef4444' })),
      ...pendingPlayers.map(p => ({ ...p, statusDisplay: (labels.pending || 'Chưa rõ').toUpperCase(), statusColor: '#64748b' }))
    ];

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px "Inter", sans-serif';
    ctx.fillText(`VẮNG MẶT & CHƯA XÁC NHẬN (${otherPlayers.length})`, paddingX, currentY);
    currentY += 14;

    const colGap = 20;
    const colW = (contentWidth - colGap) / 2;

    otherPlayers.forEach((p, idx) => {
      const cIdx = idx % 2;
      const rIdx = Math.floor(idx / 2);
      const cardX = paddingX + cIdx * (colW + colGap);
      const cardY = currentY + rIdx * 34;

      drawRoundedRect(ctx, cardX, cardY, colW, 28, 4, '#121318', '#1c1f26', 1);

      ctx.fillStyle = p.statusColor;
      ctx.beginPath();
      ctx.arc(cardX + 12, cardY + 14, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 12px "Inter", sans-serif';
      ctx.fillText(p.name.toUpperCase(), cardX + 24, cardY + 18);

      ctx.textAlign = 'right';
      ctx.fillStyle = p.statusColor;
      ctx.font = '600 11px "Inter", sans-serif';
      ctx.fillText(p.statusDisplay, cardX + colW - 10, cardY + 18);
      ctx.textAlign = 'left';
    });

    currentY += Math.ceil(otherPlayers.length / 2) * 34 + 16;
  }

  return canvas;
};

/**
 * Trigger download of PNG image
 */
export const downloadRosterPng = (canvas: HTMLCanvasElement, filename: string): void => {
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Copy PNG image directly to clipboard
 */
export const copyRosterPngToClipboard = async (canvas: HTMLCanvasElement): Promise<boolean> => {
  try {
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
      return false;
    }
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          resolve(true);
        } catch (err) {
          console.error('Clipboard item write error:', err);
          resolve(false);
        }
      }, 'image/png');
    });
  } catch (err) {
    console.error('Failed to copy canvas to clipboard:', err);
    return false;
  }
};

/**
 * Share Roster Image on Mobile
 */
export const shareRosterImage = async (
  canvas: HTMLCanvasElement,
  title: string,
  text: string
): Promise<boolean> => {
  try {
    const dataUrl = canvas.toDataURL('image/png');

    // 1. Capacitor Native Platform check
    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = dataUrl.split(',')[1];
        const fileName = `5tactiq_roster_${Date.now()}.png`;
        const writeRes = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        });

        await Share.share({
          title,
          text,
          url: writeRes.uri,
          dialogTitle: title
        });
        return true;
      } catch (nativeErr) {
        console.warn('Capacitor Share failed, fallback to Web Share:', nativeErr);
      }
    }

    // 2. Web Share API with File support
    if (navigator.share && navigator.canShare) {
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
      if (blob) {
        const file = new File([blob], '5tactiq_roster.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title,
            text,
            files: [file]
          });
          return true;
        }
      }
    }

    // 3. Fallback to direct download
    downloadRosterPng(canvas, `5TactiQ_Roster_${Date.now()}.png`);
    return true;
  } catch (err) {
    console.error('Share roster failed:', err);
    return false;
  }
};
