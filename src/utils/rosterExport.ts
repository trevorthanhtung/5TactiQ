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
  theme?: 'dark' | 'light';
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
    csvNo?: string;
    playersUnit?: string;
    guestBadge?: string;
    youthBadge?: string;
    absentAndReserves?: string;
    noPlayersYet?: string;
    unknownVenue?: string;
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
 * Safe CSV field escaping according to RFC 4180:
 * - Does not wrap numbers or simple text in quotes unnecessarily
 * - Wraps in double quotes only if field contains comma, quote, or newline
 * - Escapes double quotes by doubling them ("")
 */
const escapeCsvField = (field: string | number | null | undefined): string => {
  if (field === null || field === undefined) return '';
  const str = String(field).trim();
  if (str === '') return '';
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Generate standard UTF-8 CSV content with BOM for Microsoft Excel & Google Sheets
 */
export const generateRosterCsv = (options: RosterExportOptions): string => {
  const { match, players, onlyPresent = false, labels = {} } = options;

  const attendanceMap = match.attendance || {};
  const teamsMap = match.teams || {};
  const isInternal = match.matchType === 'internal';

  // Filter players
  let targetPlayers = [...players];
  if (onlyPresent) {
    targetPlayers = targetPlayers.filter(p => attendanceMap[p.id] === 'present');
  }

  // Sort players:
  // 1. Group by Team if internal match: A -> B -> C -> D -> unassigned
  // 2. Attendance status: present (0) -> pending (1) -> absent (2)
  // 3. Jersey number: ascending numbers (1, 2, 5, 8...) -> unnumbered at the end
  // 4. Name: Vietnamese locale string comparison
  targetPlayers.sort((a, b) => {
    if (isInternal) {
      const teamA = teamsMap[a.id] || 'Z';
      const teamB = teamsMap[b.id] || 'Z';
      if (teamA !== teamB) {
        return teamA.localeCompare(teamB);
      }
    }

    const statusA = attendanceMap[a.id] || 'pending';
    const statusB = attendanceMap[b.id] || 'pending';
    const statusWeight: Record<string, number> = { present: 0, pending: 1, absent: 2 };
    const weightA = statusWeight[statusA] ?? 1;
    const weightB = statusWeight[statusB] ?? 1;
    if (weightA !== weightB) {
      return weightA - weightB;
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

  const lines: string[] = [];

  // Header row - Standard Rectangular Table (RFC 4180)
  const headerFields = isInternal
    ? [
        escapeCsvField(labels.csvNo || 'STT'),
        escapeCsvField(labels.team || 'Đội'),
        escapeCsvField(labels.jerseyNo || 'Số áo'),
        escapeCsvField(labels.name || 'Họ và tên'),
        escapeCsvField(labels.position || 'Vị trí'),
        escapeCsvField(labels.type || 'Phân loại'),
        escapeCsvField(labels.status || 'Trạng thái'),
        escapeCsvField(labels.notes || 'Ghi chú')
      ]
    : [
        escapeCsvField(labels.csvNo || 'STT'),
        escapeCsvField(labels.jerseyNo || 'Số áo'),
        escapeCsvField(labels.name || 'Họ và tên'),
        escapeCsvField(labels.position || 'Vị trí'),
        escapeCsvField(labels.type || 'Phân loại'),
        escapeCsvField(labels.status || 'Trạng thái'),
        escapeCsvField(labels.notes || 'Ghi chú')
      ];

  lines.push(headerFields.join(','));

  // Player rows
  targetPlayers.forEach((p, idx) => {
    const rawStatus = attendanceMap[p.id] || 'pending';
    const statusText = rawStatus === 'present'
      ? (labels.present || 'Có mặt')
      : rawStatus === 'absent'
      ? (labels.absent || 'Vắng')
      : (labels.pending || 'Chưa rõ');

    const rawTeam = teamsMap[p.id];
    let teamText = '';
    if (rawTeam === 'A') teamText = labels.teamA || 'Đội A';
    else if (rawTeam === 'B') teamText = labels.teamB || 'Đội B';
    else if (rawTeam === 'C') teamText = labels.teamC || 'Đội C';
    else if (rawTeam === 'D') teamText = labels.teamD || 'Đội D';

    const posText = p.positions && p.positions.length > 0 ? p.positions.join(', ') : '';

    let typeText = labels.official || 'Chính thức';
    if (p.isCaptain) typeText = labels.captain || 'Đội trưởng';
    else if (p.isBorrowed) typeText = labels.guest || 'Cầu thủ khách';
    else if (p.isYouth) typeText = labels.youth || 'Cầu thủ trẻ';

    const jerseyNumberStr = (p.jersey_number !== null && p.jersey_number !== undefined && !isNaN(Number(p.jersey_number)))
      ? p.jersey_number
      : '';

    const rowFields = isInternal
      ? [
          escapeCsvField(idx + 1),
          escapeCsvField(teamText),
          escapeCsvField(jerseyNumberStr),
          escapeCsvField(p.name),
          escapeCsvField(posText),
          escapeCsvField(typeText),
          escapeCsvField(statusText),
          escapeCsvField(p.note || p.healthNote || '')
        ]
      : [
          escapeCsvField(idx + 1),
          escapeCsvField(jerseyNumberStr),
          escapeCsvField(p.name),
          escapeCsvField(posText),
          escapeCsvField(typeText),
          escapeCsvField(statusText),
          escapeCsvField(p.note || p.healthNote || '')
        ];

    lines.push(rowFields.join(','));
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel on Windows opens UTF-8 without font corruption
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
  ctx.lineWidth = 1.5;
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
  ctx.lineWidth = 1.5;
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
  ctx.lineWidth = 1.5;
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
 * DESIGN PHILOSOPHY: Swiss Minimalist Editorial Match Sheet (Zero Neon, Zero Emoji AI-Slop)
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
    theme = 'light',
    labels = {}
  } = options;

  const isDark = theme !== 'light';

  // Strict Swiss Monochrome Palette (No neon, no candy colors)
  const colors = isDark ? {
    bg: '#0a0b0e',
    cardBg: '#121318',
    cardBorder: '#1f222a',
    headerBg: '#161820',
    headerBorder: '#262a34',
    textPrimary: '#f8fafc',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    outerBorder: '#262a34',
    divider: '#1c1f26',
    statBarBg: '#111318',
    statBarBorder: '#1e2129',
    numColor: '#f4f4f5',
    numMuted: '#52525b',
    tagColor: '#a1a1aa',
    tagBorder: '#2e323d',
  } : {
    bg: '#ffffff',
    cardBg: '#f8fafc',
    cardBorder: '#e2e8f0',
    headerBg: '#f1f5f9',
    headerBorder: '#cbd5e1',
    textPrimary: '#09090b',
    textSecondary: '#52525b',
    textMuted: '#71717a',
    outerBorder: '#e4e4e7',
    divider: '#e4e4e7',
    statBarBg: '#f8fafc',
    statBarBorder: '#e2e8f0',
    numColor: '#09090b',
    numMuted: '#94a3b8',
    tagColor: '#52525b',
    tagBorder: '#cbd5e1',
  };

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
  const ROW_GAP = 6;
  const TEAM_HEADER_HEIGHT = 40;

  // Calculate layout structure
  const isInternalSplit = groupByTeams && match.matchType === 'internal';
  const activeTeams = (['A', 'B', 'C', 'D'] as const).slice(0, match.teamCount || 2);

  // Exact Dynamic Height Calculation (No dead void)
  // Header: padding top (48) + Club bar (24) + 14 + Main title (42) + 14 + Meta bar (20) + 18 + Divider (1) + 18 + Stats bar (38) + 24
  const HEADER_HEIGHT = 48 + 24 + 14 + 42 + 14 + 20 + 18 + 1 + 18 + 38 + 24; // ~261px
  let rosterContentHeight = 0;

  if (isInternalSplit) {
    if (activeTeams.length === 2) {
      const countA = targetPlayers.filter(p => teamsMap[p.id] === 'A').length;
      const countB = targetPlayers.filter(p => teamsMap[p.id] === 'B').length;
      const maxRows = Math.max(countA, countB, 1);
      rosterContentHeight = TEAM_HEADER_HEIGHT + 8 + maxRows * (ROW_HEIGHT + ROW_GAP);
    } else if (activeTeams.length === 3) {
      const countA = targetPlayers.filter(p => teamsMap[p.id] === 'A').length;
      const countB = targetPlayers.filter(p => teamsMap[p.id] === 'B').length;
      const countC = targetPlayers.filter(p => teamsMap[p.id] === 'C').length;
      const maxRows = Math.max(countA, countB, countC, 1);
      rosterContentHeight = TEAM_HEADER_HEIGHT + 8 + maxRows * (ROW_HEIGHT + ROW_GAP);
    } else {
      const countA = targetPlayers.filter(p => teamsMap[p.id] === 'A').length;
      const countB = targetPlayers.filter(p => teamsMap[p.id] === 'B').length;
      const countC = targetPlayers.filter(p => teamsMap[p.id] === 'C').length;
      const countD = targetPlayers.filter(p => teamsMap[p.id] === 'D').length;
      const row1Max = Math.max(countA, countB, 1);
      const row2Max = Math.max(countC, countD, 1);
      rosterContentHeight = (TEAM_HEADER_HEIGHT + 8 + row1Max * (ROW_HEIGHT + ROW_GAP)) + 14 + (TEAM_HEADER_HEIGHT + 8 + row2Max * (ROW_HEIGHT + ROW_GAP));
    }
  } else {
    const totalRows = Math.ceil(targetPlayers.length / 2);
    rosterContentHeight = Math.max(totalRows, 1) * (ROW_HEIGHT + ROW_GAP);
  }

  // Absent & Pending section
  let otherSectionHeight = 0;
  const hasOtherPlayers = !onlyPresent && (absentPlayers.length > 0 || pendingPlayers.length > 0);
  if (hasOtherPlayers) {
    const otherCount = absentPlayers.length + pendingPlayers.length;
    const otherRows = Math.ceil(otherCount / 2);
    otherSectionHeight = 16 + 22 + 10 + otherRows * 32 + 10;
  }

  // Bottom padding
  const BOTTOM_PADDING = 36;

  const canvasHeight = Math.max(460, Math.ceil(HEADER_HEIGHT + rosterContentHeight + otherSectionHeight + BOTTOM_PADDING));

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Pure Minimalist Canvas Background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Outer Hairline Border
  ctx.strokeStyle = colors.outerBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2);

  // 2. Minimalist Header
  let currentY = 48;

  // Club Name
  const clubName = (teamName || 'KAT FC').toUpperCase();
  ctx.fillStyle = colors.textSecondary;
  ctx.font = '700 13px "Inter", sans-serif';
  ctx.letterSpacing = '2.5px';
  ctx.textAlign = 'left';
  ctx.fillText(clubName, paddingX, currentY);

  currentY += 36;

  // Main Match Title (Clean, Confident Swiss Typography)
  ctx.letterSpacing = '0px';
  ctx.fillStyle = colors.textPrimary;
  ctx.font = '800 36px "Barlow Condensed", "Oswald", "Inter", sans-serif';
  const mainTitleText = match.matchType === 'internal'
    ? (labels.internalMatch || 'TRẬN ĐẤU NỘI BỘ').toUpperCase()
    : match.opponent
    ? `${clubName}  VS  ${match.opponent.toUpperCase()}`
    : 'DANH SÁCH THI ĐẤU';
  ctx.fillText(mainTitleText, paddingX, currentY);

  currentY += 28;

  // Match Meta Bar: Kickoff & Venue
  ctx.font = '500 13px "Inter", sans-serif';
  ctx.fillStyle = colors.textSecondary;
  let curMetaX = paddingX;
  const metaY = currentY;
  const iconY = metaY - 11;

  // Date
  drawLucideCalendar(ctx, curMetaX, iconY, 14, colors.textSecondary);
  curMetaX += 19;
  const dateText = formatDateString(match.date);
  ctx.fillText(dateText, curMetaX, metaY);
  curMetaX += ctx.measureText(dateText).width + 12;

  // Time
  if (match.time) {
    drawLucideClock(ctx, curMetaX, iconY, 14, colors.textSecondary);
    curMetaX += 19;
    ctx.fillText(match.time, curMetaX, metaY);
    curMetaX += ctx.measureText(match.time).width + 12;
  }

  // Separator Dot
  ctx.fillStyle = colors.textMuted;
  ctx.fillText('•', curMetaX, metaY);
  curMetaX += 12;

  // Venue
  const venueStr = match.location || labels.unknownVenue || 'Chưa rõ sân';
  drawLucideMapPin(ctx, curMetaX, iconY, 14, colors.textSecondary);
  curMetaX += 19;
  ctx.fillStyle = colors.textSecondary;
  ctx.fillText(venueStr, curMetaX, metaY);

  currentY += 20;

  // Hairline Divider below Header
  ctx.strokeStyle = colors.divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingX, currentY);
  ctx.lineTo(canvasWidth - paddingX, currentY);
  ctx.stroke();

  currentY += 16;

  // 3. Minimalist Attendance Stats Strip (Zero Emojis, Pure Tabular Typography)
  drawRoundedRect(ctx, paddingX, currentY, contentWidth, 38, 4, colors.statBarBg, colors.statBarBorder, 1);

  ctx.font = '600 12px "Inter", sans-serif';
  ctx.letterSpacing = '0.5px';
  ctx.textAlign = 'left';

  let statX = paddingX + 20;
  const statY = currentY + 24;

  // Present
  ctx.fillStyle = colors.textMuted;
  ctx.fillText((labels.present || 'CÓ MẶT').toUpperCase(), statX, statY);
  statX += ctx.measureText((labels.present || 'CÓ MẶT').toUpperCase()).width + 8;
  ctx.fillStyle = colors.textPrimary;
  ctx.font = '800 14px "Inter", sans-serif';
  ctx.fillText(`${presentPlayers.length}`, statX, statY);
  statX += ctx.measureText(`${presentPlayers.length}`).width + 28;

  // Divider dot
  ctx.fillStyle = colors.textMuted;
  ctx.fillText('•', statX - 14, statY);

  // Absent
  ctx.font = '600 12px "Inter", sans-serif';
  ctx.fillStyle = colors.textMuted;
  ctx.fillText((labels.absent || 'VẮNG').toUpperCase(), statX, statY);
  statX += ctx.measureText((labels.absent || 'VẮNG').toUpperCase()).width + 8;
  ctx.fillStyle = colors.textPrimary;
  ctx.font = '800 14px "Inter", sans-serif';
  ctx.fillText(`${absentPlayers.length}`, statX, statY);
  statX += ctx.measureText(`${absentPlayers.length}`).width + 28;

  // Divider dot
  ctx.fillStyle = colors.textMuted;
  ctx.fillText('•', statX - 14, statY);

  // Pending
  ctx.font = '600 12px "Inter", sans-serif';
  ctx.fillStyle = colors.textMuted;
  ctx.fillText((labels.pending || 'CHƯA RÕ').toUpperCase(), statX, statY);
  statX += ctx.measureText((labels.pending || 'CHƯA RÕ').toUpperCase()).width + 8;
  ctx.fillStyle = colors.textPrimary;
  ctx.font = '800 14px "Inter", sans-serif';
  ctx.fillText(`${pendingPlayers.length}`, statX, statY);

  currentY += 56;

  // 4. Swiss Minimalist Player Row Renderer (Clean tabular numbers, quiet role tags)
  const drawMinimalPlayerCard = (
    p: Player,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    // Card container
    drawRoundedRect(ctx, x, y, w, h - 2, 4, colors.cardBg, colors.cardBorder, 1);

    // Jersey Number (Tabular typography, no candy colored box!)
    const jNum = (p.jersey_number !== null && p.jersey_number !== undefined && !isNaN(Number(p.jersey_number)))
      ? String(p.jersey_number).padStart(2, '0')
      : '—';

    ctx.textAlign = 'center';
    ctx.fillStyle = jNum === '—' ? colors.numMuted : colors.numColor;
    ctx.font = '700 14px "Barlow Condensed", "Oswald", monospace';
    ctx.fillText(jNum, x + 24, y + 26);

    // Role tags on the right (Quiet text, zero emoji neon!)
    let rightOffset = x + w - 12;
    ctx.textAlign = 'right';

    // 1. Captain (C)
    if (p.isCaptain) {
      ctx.fillStyle = colors.textSecondary;
      ctx.font = '700 11px "Inter", sans-serif';
      ctx.fillText('(C)', rightOffset, y + 26);
      rightOffset -= 24;
    }

    // 2. Goalkeeper (GK)
    if (p.positions && p.positions.includes('GK')) {
      ctx.fillStyle = colors.textMuted;
      ctx.font = '700 11px "Inter", sans-serif';
      ctx.fillText('GK', rightOffset, y + 26);
      rightOffset -= 24;
    }

    // 3. Guest / Borrowed
    if (p.isBorrowed) {
      const guestBadgeText = (labels.guestBadge || labels.guest || 'KHÁCH').toUpperCase();
      ctx.fillStyle = colors.textMuted;
      ctx.font = '600 10px "Inter", sans-serif';
      const badgeW = ctx.measureText(guestBadgeText).width;
      ctx.fillText(guestBadgeText, rightOffset, y + 26);
      rightOffset -= badgeW + 8;
    }

    // 4. Youth
    if (p.isYouth) {
      const youthBadgeText = (labels.youthBadge || labels.youth || 'TRẺ').toUpperCase();
      ctx.fillStyle = colors.textMuted;
      ctx.font = '600 10px "Inter", sans-serif';
      const badgeW = ctx.measureText(youthBadgeText).width;
      ctx.fillText(youthBadgeText, rightOffset, y + 26);
      rightOffset -= badgeW + 8;
    }

    // Player Full Name
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.textPrimary;
    ctx.font = '600 13px "Inter", sans-serif';
    ctx.letterSpacing = '0.2px';

    const nameStartX = x + 44;
    const maxNameWidth = Math.max(rightOffset - nameStartX - 8, 60);

    let nameStr = p.name.toUpperCase();
    while (ctx.measureText(nameStr).width > maxNameWidth && nameStr.length > 3) {
      nameStr = nameStr.slice(0, -1);
    }
    if (nameStr.length < p.name.length) nameStr += '..';
    ctx.fillText(nameStr, nameStartX, y + 26);
  };

  // 5. Roster Grid Rendering
  if (isInternalSplit) {
    const drawTeamBlock = (teamKey: 'A' | 'B' | 'C' | 'D', x: number, y: number, w: number): number => {
      const teamPlayers = targetPlayers.filter(p => teamsMap[p.id] === teamKey);
      const teamLabel = (labels as Record<string, string | undefined>)[`team${teamKey}`] || `ĐỘI ${teamKey}`;

      // Minimalist Team Header
      drawRoundedRect(ctx, x, y, w, TEAM_HEADER_HEIGHT, 4, colors.headerBg, colors.headerBorder, 1);

      // Team Title
      ctx.fillStyle = colors.textPrimary;
      ctx.font = '700 13px "Inter", sans-serif';
      ctx.letterSpacing = '1px';
      ctx.textAlign = 'left';
      ctx.fillText(teamLabel.toUpperCase(), x + 14, y + 25);

      // Player Count
      const unitPlayers = (labels.playersUnit || 'CẦU THỦ').toUpperCase();
      ctx.textAlign = 'right';
      ctx.fillStyle = colors.textSecondary;
      ctx.font = '500 11px "Inter", sans-serif';
      ctx.letterSpacing = '0.5px';
      ctx.fillText(`${teamPlayers.length} ${unitPlayers}`, x + w - 14, y + 25);
      ctx.textAlign = 'left';

      let rowY = y + TEAM_HEADER_HEIGHT + 8;
      if (teamPlayers.length === 0) {
        ctx.fillStyle = colors.textMuted;
        ctx.font = 'italic 12px "Inter", sans-serif';
        ctx.fillText(labels.noPlayersYet || 'Chưa có cầu thủ', x + 12, rowY + 20);
        rowY += ROW_HEIGHT;
      } else {
        teamPlayers.forEach(p => {
          drawMinimalPlayerCard(p, x, rowY, w, ROW_HEIGHT);
          rowY += ROW_HEIGHT + ROW_GAP;
        });
      }

      return rowY;
    };

    if (activeTeams.length === 2) {
      const colGap = 20;
      const colW = (contentWidth - colGap) / 2;
      const bottomA = drawTeamBlock('A', paddingX, currentY, colW);
      const bottomB = drawTeamBlock('B', paddingX + colW + colGap, currentY, colW);
      currentY = Math.max(bottomA, bottomB) + 16;
    } else if (activeTeams.length === 3) {
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
      const row1Bottom = Math.max(bottomA, bottomB) + 14;

      const bottomC = drawTeamBlock('C', paddingX, row1Bottom, colW);
      const bottomD = drawTeamBlock('D', paddingX + colW + colGap, row1Bottom, colW);
      currentY = Math.max(bottomC, bottomD) + 16;
    }
  } else {
    // 2-Column Standard Roster List
    const colGap = 20;
    const colW = (contentWidth - colGap) / 2;

    targetPlayers.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cardX = paddingX + col * (colW + colGap);
      const cardY = currentY + row * (ROW_HEIGHT + ROW_GAP);
      drawMinimalPlayerCard(p, cardX, cardY, colW, ROW_HEIGHT);
    });

    const totalRows = Math.ceil(targetPlayers.length / 2);
    currentY += totalRows * (ROW_HEIGHT + ROW_GAP) + 16;
  }

  // 6. Absent / Pending Section (Quiet, Compact)
  if (hasOtherPlayers) {
    ctx.strokeStyle = colors.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingX, currentY);
    ctx.lineTo(canvasWidth - paddingX, currentY);
    ctx.stroke();
    currentY += 18;

    const otherPlayers = [
      ...absentPlayers.map(p => ({ ...p, statusDisplay: (labels.absent || 'VẮNG').toUpperCase() })),
      ...pendingPlayers.map(p => ({ ...p, statusDisplay: (labels.pending || 'CHƯA RÕ').toUpperCase() }))
    ];

    const absentTitle = (labels.absentAndReserves || 'VẮNG MẶT & DỰ BỊ').toUpperCase();
    ctx.fillText(`${absentTitle} (${otherPlayers.length})`, paddingX, currentY);
    currentY += 12;

    const colGap = 20;
    const colW = (contentWidth - colGap) / 2;

    otherPlayers.forEach((p, idx) => {
      const cIdx = idx % 2;
      const rIdx = Math.floor(idx / 2);
      const cardX = paddingX + cIdx * (colW + colGap);
      const cardY = currentY + rIdx * 30;

      drawRoundedRect(ctx, cardX, cardY, colW, 26, 3, colors.cardBg, colors.cardBorder, 1);

      ctx.fillStyle = colors.textSecondary;
      ctx.font = '500 12px "Inter", sans-serif';
      ctx.letterSpacing = '0px';
      ctx.textAlign = 'left';
      ctx.fillText(p.name.toUpperCase(), cardX + 12, cardY + 17);

      ctx.textAlign = 'right';
      ctx.fillStyle = colors.textMuted;
      ctx.font = '600 10px "Inter", sans-serif';
      ctx.fillText(p.statusDisplay, cardX + colW - 10, cardY + 17);
      ctx.textAlign = 'left';
    });

    currentY += Math.ceil(otherPlayers.length / 2) * 30 + 14;
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
