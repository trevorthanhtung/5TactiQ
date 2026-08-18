import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Copy, Share2, FileSpreadsheet, Image, Check, Filter, Users, RefreshCw } from 'lucide-react';
import { BottomSheet } from './ui/BottomSheet';
import { useToastStore } from '../store/useToastStore';
import { useSettingsStore } from '../store/useSettingsStore';
import type { MatchInfo, Player } from '../types';
import {
  generateRosterCsv,
  downloadRosterCsv,
  copyCsvToClipboard,
  renderRosterToCanvas,
  downloadRosterPng,
  copyRosterPngToClipboard,
  shareRosterImage,
  formatDateString
} from '../utils/rosterExport';

interface ExportMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchInfo | null;
  players: Player[];
}

export const ExportMatchModal: React.FC<ExportMatchModalProps> = ({
  isOpen,
  onClose,
  match,
  players
}) => {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const { settings } = useSettingsStore();

  const [exportFormat, setExportFormat] = useState<'png' | 'csv'>('png');
  const [onlyPresent, setOnlyPresent] = useState<boolean>(false);
  const [groupByTeams, setGroupByTeams] = useState<boolean>(true);
  const [copiedType, setCopiedType] = useState<'png' | 'csv' | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Match title for filenames
  const matchTitleClean = useMemo(() => {
    if (!match) return 'Match';
    const datePart = match.date || 'match';
    const opponentPart = match.matchType === 'internal' ? 'Noi_Bo' : (match.opponent ? match.opponent.replace(/[^a-zA-Z0-9]/g, '_') : 'Giao_Huu');
    return `5TactiQ_Danh_Sach_${opponentPart}_${datePart}`;
  }, [match]);

  const labels = useMemo(() => ({
    internalMatch: t('matchday.internal_match_caps', 'TRẬN ĐẤU NỘI BỘ'),
    friendlyMatch: t('matchday.friendly_match_caps', 'TRẬN GIAO HỮU'),
    tournamentMatch: t('matchday.tournament_match_caps', 'GIẢI ĐẤU'),
    present: t('matchday.present', 'Có mặt'),
    absent: t('matchday.absent', 'Vắng'),
    pending: t('matchday.pending', 'Chưa rõ'),
    teamA: t('matchday.team_a', 'Đội A'),
    teamB: t('matchday.team_b', 'Đội B'),
    teamC: t('matchday.team_c', 'Đội C'),
    teamD: t('matchday.team_d', 'Đội D'),
    noBib: t('matchday.no_bib', 'Không Bib'),
    jerseyNo: t('roster.number', 'Số áo'),
    name: t('roster.name', 'Họ và tên'),
    status: t('matchday.status_label', 'Trạng thái'),
    team: t('matchday.team_label', 'Đội'),
    position: t('roster.positions', 'Vị trí'),
    type: t('roster.type_label', 'Phân loại'),
    notes: t('roster.notes', 'Ghi chú'),
    captain: t('roster.captain', 'Đội trưởng'),
    guest: t('roster.guest', 'Cầu thủ khách'),
    youth: t('roster.youth', 'Cầu thủ trẻ'),
    official: t('roster.official', 'Chính thức')
  }), [t]);

  // Generate and render Canvas when options change or modal opens
  useEffect(() => {
    if (!isOpen || !match) return;

    setIsRendering(true);
    const timer = setTimeout(() => {
      try {
        const canvas = renderRosterToCanvas({
          match,
          players,
          onlyPresent,
          groupByTeams: groupByTeams && match.matchType === 'internal',
          teamName: settings.teamName || '5TACTIQ',
          labels
        });
        canvasRef.current = canvas;
        setPreviewDataUrl(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Render canvas preview error:', err);
      } finally {
        setIsRendering(false);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, match, players, onlyPresent, groupByTeams, settings.teamName, labels]);

  // Generate CSV text
  const csvContent = useMemo(() => {
    if (!match) return '';
    return generateRosterCsv({
      match,
      players,
      onlyPresent,
      teamName: settings.teamName || '5TACTIQ',
      labels
    });
  }, [match, players, onlyPresent, settings.teamName, labels]);

  // Count metrics for quick filter toggles
  const attendanceMap = match?.attendance || {};
  const presentCount = players.filter(p => attendanceMap[p.id] === 'present').length;
  const totalCount = players.length;

  // Handlers for PNG
  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    downloadRosterPng(canvasRef.current, `${matchTitleClean}.png`);
    addToast({
      type: 'success',
      message: t('toast.png_downloaded', 'Đã tải ảnh danh sách thi đấu thành công!')
    });
  };

  const handleCopyPng = async () => {
    if (!canvasRef.current) return;
    const success = await copyRosterPngToClipboard(canvasRef.current);
    if (success) {
      setCopiedType('png');
      setTimeout(() => setCopiedType(null), 2500);
      addToast({
        type: 'success',
        message: t('toast.png_copied', 'Đã sao chép ảnh vào Clipboard! Bạn có thể dán ngay vào Zalo/Facebook.')
      });
    } else {
      addToast({
        type: 'error',
        message: t('toast.copy_error', 'Trình duyệt không hỗ trợ sao chép ảnh trực tiếp. Vui lòng bấm Tải ảnh.')
      });
    }
  };

  const handleSharePng = async () => {
    if (!canvasRef.current || !match) return;
    const matchName = match.matchType === 'internal' ? 'Trận Nội Bộ' : `VS ${match.opponent || 'Đối Thủ'}`;
    const shareTitle = `Danh sách thi đấu ${matchName} (${formatDateString(match.date)})`;
    const shareText = `Danh sách cầu thủ tham gia trận đấu ${matchName} • ${settings.teamName || '5TactiQ'}`;
    await shareRosterImage(canvasRef.current, shareTitle, shareText);
  };

  // Handlers for CSV
  const handleDownloadCsv = () => {
    if (!csvContent) return;
    downloadRosterCsv(csvContent, `${matchTitleClean}.csv`);
    addToast({
      type: 'success',
      message: t('toast.csv_downloaded', 'Đã tải file Excel (.csv) thành công!')
    });
  };

  const handleCopyCsv = async () => {
    if (!csvContent) return;
    const success = await copyCsvToClipboard(csvContent);
    if (success) {
      setCopiedType('csv');
      setTimeout(() => setCopiedType(null), 2500);
      addToast({
        type: 'success',
        message: t('toast.csv_copied', 'Đã sao chép dữ liệu CSV vào Clipboard!')
      });
    }
  };

  if (!match) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2 text-text-main">
          <Download size={20} className="text-secondary shrink-0" />
          <span className="font-display uppercase tracking-wider text-lg sm:text-xl font-bold">
            {t('matchday.export_roster_title', 'XUẤT DANH SÁCH THI ĐẤU')}
          </span>
        </div>
      }
    >
      <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
        {/* 1. Format Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-surface-2 p-1.5 border-2 border-border-main">
          <button
            type="button"
            onClick={() => setExportFormat('png')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 font-display uppercase tracking-wider text-xs sm:text-sm font-bold transition-all ${
              exportFormat === 'png'
                ? 'bg-primary text-white shadow-md border-2 border-primary'
                : 'text-text-muted hover:text-text-main border-2 border-transparent'
            }`}
          >
            <Image size={18} />
            <span>{t('matchday.export_format_png', 'FILE ẢNH')}</span>
          </button>

          <button
            type="button"
            onClick={() => setExportFormat('csv')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 font-display uppercase tracking-wider text-xs sm:text-sm font-bold transition-all ${
              exportFormat === 'csv'
                ? 'bg-primary text-white shadow-md border-2 border-primary'
                : 'text-text-muted hover:text-text-main border-2 border-transparent'
            }`}
          >
            <FileSpreadsheet size={18} />
            <span>{t('matchday.export_format_csv', 'FILE CSV')}</span>
          </button>
        </div>

        {/* 2. Options Toolbar */}
        <div className="bg-surface p-3 sm:p-3.5 border-2 border-border-main flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Filter Only Present Toggle */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Filter size={14} className="text-secondary" /> {t('matchday.export_filter_label', 'Lọc cầu thủ:')}
            </span>
            <div className="inline-flex bg-surface-2 p-0.5 border border-border-main">
              <button
                type="button"
                onClick={() => setOnlyPresent(false)}
                className={`px-2.5 py-1 font-bold uppercase transition-colors ${
                  !onlyPresent ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'
                }`}
              >
                {t('matchday.export_all', 'Tất cả')}
              </button>
              <button
                type="button"
                onClick={() => setOnlyPresent(true)}
                className={`px-2.5 py-1 font-bold uppercase transition-colors ${
                  onlyPresent ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'
                }`}
              >
                {t('matchday.export_only_present', 'Chỉ có mặt')}
              </button>
            </div>
          </div>

          {/* Team Grouping Toggle for Internal match */}
          {match.matchType === 'internal' && exportFormat === 'png' && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <Users size={14} className="text-secondary" /> {t('matchday.export_layout_label', 'Bố cục:')}
              </span>
              <div className="inline-flex bg-surface-2 p-0.5 border border-border-main">
                <button
                  type="button"
                  onClick={() => setGroupByTeams(true)}
                  className={`px-2.5 py-1 font-bold uppercase transition-colors ${
                    groupByTeams ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {t('matchday.export_by_teams', 'Theo Đội A/B')}
                </button>
                <button
                  type="button"
                  onClick={() => setGroupByTeams(false)}
                  className={`px-2.5 py-1 font-bold uppercase transition-colors ${
                    !groupByTeams ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {t('matchday.export_list_view', 'Danh sách')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Live Preview Section */}
        {exportFormat === 'png' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-text-muted font-bold uppercase tracking-wider">
              <span>{t('matchday.export_preview_png', 'Bản xem trước hình ảnh')}</span>
            </div>

            <div className="bg-[#121216] border-2 border-border-main p-2 sm:p-3 overflow-hidden flex flex-col items-center justify-center min-h-[220px] max-h-[380px] shadow-inner relative group">
              {isRendering ? (
                <div className="flex flex-col items-center gap-2 text-text-muted py-8">
                  <RefreshCw className="animate-spin text-primary" size={28} />
                  <span className="text-xs uppercase font-bold tracking-wider">{t('matchday.export_rendering', 'Đang tạo poster...')}</span>
                </div>
              ) : previewDataUrl ? (
                <div className="w-full h-full overflow-y-auto flex justify-center custom-scrollbar">
                  <img
                    src={previewDataUrl}
                    alt="Roster Poster Preview"
                    className="max-h-[340px] w-auto object-contain border border-white/10 shadow-2xl transition-transform hover:scale-[1.01]"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-text-muted font-bold uppercase tracking-wider">
              <span>{t('matchday.export_preview_csv', 'Bản xem trước nội dung')}</span>
            </div>

            <div className="bg-surface-2 border-2 border-border-main p-3 max-h-[300px] overflow-y-auto font-mono text-xs text-text-main shadow-inner leading-relaxed custom-scrollbar whitespace-pre-wrap select-text">
              {csvContent.replace(/^\uFEFF/, '')}
            </div>
          </div>
        )}

        {/* 4. Action Buttons Footer */}
        <div className="pt-3 border-t-2 border-border-main flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          {exportFormat === 'png' ? (
            <>
              <button
                type="button"
                onClick={handleCopyPng}
                className="hallmark-btn bg-surface hover:bg-surface-2 text-text-main border-2 border-border-main py-2.5 px-4 font-display text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {copiedType === 'png' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                <span>{copiedType === 'png' ? t('matchday.copied', 'ĐÃ SAO CHÉP!') : t('matchday.export_copy_png', 'SAO CHÉP')}</span>
              </button>

              <button
                type="button"
                onClick={handleSharePng}
                className="hallmark-btn bg-secondary text-white border-2 border-secondary hover:bg-[#d05c21] py-2.5 px-4 font-display text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Share2 size={16} />
                <span>{t('matchday.export_share', 'CHIA SẺ')}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPng}
                className="hallmark-btn bg-primary text-white border-2 border-primary hover:bg-[#323d29] py-2.5 px-5 font-display text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Download size={16} />
                <span>{t('matchday.export_download_png', 'TẢI ẢNH')}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCopyCsv}
                className="hallmark-btn bg-surface hover:bg-surface-2 text-text-main border-2 border-border-main py-2.5 px-4 font-display text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {copiedType === 'csv' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                <span>{copiedType === 'csv' ? t('matchday.copied', 'ĐÃ SAO CHÉP!') : t('matchday.export_copy_csv', 'SAO CHÉP')}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                className="hallmark-btn bg-primary text-white border-2 border-primary hover:bg-[#323d29] py-2.5 px-5 font-display text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Download size={16} />
                <span>{t('matchday.export_download_csv', 'TẢI FILE')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
