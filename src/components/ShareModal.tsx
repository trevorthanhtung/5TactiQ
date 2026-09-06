import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from './ui/BottomSheet';
import { usePlayerStore } from '../store/usePlayerStore';
import { useMatchStore } from '../store/useMatchStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTacticStore } from '../store/useTacticStore';
import { useToastStore } from '../store/useToastStore';
import { useCloudSync } from '../hooks/useCloudSync';
import { rehydrateAllStores } from '../lib/sync';
import { broadcastTacticsState } from '../services/liveTacticsService';
import { getCurrentSeasonRange, isMatchInSeason } from '../utils/seasonUtils';
import { isPlayerEligibleForStats } from '../utils/playerUtils';
import { createShareLink, type SharedStatsPayload, type SharedTacticsPayload, type SharedPlayerStat } from '../services/shareService';
import { hapticImpact } from '../utils/haptics';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'stats' | 'tactics';
  currentTacticFrames?: any[];
  currentTacticName?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'stats',
  currentTacticFrames,
  currentTacticName
}) => {
  const { t } = useTranslation();
  const addToast = useToastStore((state) => state.addToast);
  const { syncNow } = useCloudSync();
  const { players } = usePlayerStore();
  const { matches } = useMatchStore();
  const { settings } = useSettingsStore();
  const { savedTactics, activeBoard } = useTacticStore();

  const [shareType, setShareType] = useState<'stats' | 'tactics'>(defaultType);
  const [statsFilter, setStatsFilter] = useState<'current_season' | 'all_time'>('current_season');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setShareType(defaultType);
      setIsCopied(false);
      setSyncSuccess(false);

      // Auto-sync in background on open
      const performAutoSync = async () => {
        try {
          if (syncNow) {
            await syncNow(false);
          }
          if (activeBoard) {
            broadcastTacticsState(activeBoard);
          }
        } catch (err) {
          console.warn('[ShareModal] Auto sync warning:', err);
        }
      };

      performAutoSync();
    }
  }, [isOpen, defaultType]);

  const seasonRange = useMemo(() => getCurrentSeasonRange(settings), [settings.seasonStartDate, settings.seasonEndDate]);
  const hasSeasonConfig = !!seasonRange?.hasSeasonConfig;

  // Compute stats payload
  const statsPayload = useMemo<SharedStatsPayload>(() => {
    const computeForMatches = (matchList: typeof matches) => {
      const playerStatsAgg: Record<string, {
        goals: number;
        assists: number;
        attendance: number;
        totalRating: number;
        ratedMatches: number;
      }> = {};
      players.forEach((p) => {
        playerStatsAgg[p.id] = { goals: 0, assists: 0, attendance: 0, totalRating: 0, ratedMatches: 0 };
      });

      let totalGoals = 0;
      let totalAssists = 0;
      let highestMatchRating = 0;
      let matchesWithRatingsCount = 0;

      matchList.forEach((m) => {
        if (m.attendance) {
          Object.entries(m.attendance).forEach(([pId, status]) => {
            if (status === 'present' && playerStatsAgg[pId]) {
              playerStatsAgg[pId].attendance += 1;
            }
          });
        }

        const shouldTrack = m.matchType !== 'internal' || !!m.trackStats;
        let matchHasRating = false;
        if (shouldTrack && m.stats) {
          m.stats.forEach((s) => {
            if (playerStatsAgg[s.playerId]) {
              const g = s.goals || 0;
              const a = s.assists || 0;
              playerStatsAgg[s.playerId].goals += g;
              playerStatsAgg[s.playerId].assists += a;
              totalGoals += g;
              totalAssists += a;

              if (typeof s.rating === 'number' && s.rating > 0) {
                playerStatsAgg[s.playerId].totalRating += s.rating;
                playerStatsAgg[s.playerId].ratedMatches += 1;
                matchHasRating = true;
                if (s.rating > highestMatchRating) {
                  highestMatchRating = s.rating;
                }
              }
            }
          });
        }
        if (matchHasRating) {
          matchesWithRatingsCount += 1;
        }
      });

      const eligible = players.filter(isPlayerEligibleForStats);
      const sharedPlayers: SharedPlayerStat[] = eligible.map((p) => {
        const agg = playerStatsAgg[p.id];
        const ratedMatches = agg?.ratedMatches || 0;
        const avgRating = ratedMatches > 0 ? Number((agg.totalRating / ratedMatches).toFixed(1)) : 0;
        const positions = p.positions || [];
        const positionLabel = positions.length > 0
          ? positions.map((pos) => t(`position.${pos}`)).join(', ')
          : undefined;

        return {
          id: p.id,
          name: p.name,
          number: p.jersey_number ?? undefined,
          position: positionLabel,
          positions,
          photo: p.photo_url,
          goals: agg?.goals || 0,
          assists: agg?.assists || 0,
          attendance: agg?.attendance || 0,
          matchesCount: matchList.length,
          rating: avgRating,
          avgRating,
          ratedMatches
        };
      });

      const activeRatedPlayers = sharedPlayers.filter(p => (p.rating || 0) > 0);
      const avgTeamRating = activeRatedPlayers.length > 0
        ? Number((activeRatedPlayers.reduce((sum, p) => sum + (p.rating || 0), 0) / activeRatedPlayers.length).toFixed(1))
        : 0;

      return {
        summary: {
          totalGoals,
          totalAssists,
          totalMatches: matchList.length,
          playerCount: sharedPlayers.length,
          avgTeamRating,
          highestMatchRating,
          matchesWithRatingsCount
        },
        players: sharedPlayers
      };
    };

    const finishedMatches = matches.filter((m) => m.status === 'finished');
    const seasonMatches = hasSeasonConfig
      ? finishedMatches.filter((m) => isMatchInSeason(m.date, seasonRange))
      : finishedMatches;

    const seasonData = computeForMatches(seasonMatches);
    const allTimeData = computeForMatches(finishedMatches);

    return {
      v: 1,
      type: 'stats',
      teamName: settings.teamName?.trim() || '5TactiQ',
      logoUrl: settings.logoUrl,
      seasonLabel: seasonRange ? seasonRange.label : undefined,
      hasSeasonConfig: true,
      createdAt: new Date().toISOString(),
      summary: seasonData.summary,
      players: seasonData.players,
      allTimeData
    };
  }, [players, matches, settings, seasonRange, hasSeasonConfig]);

  // Compute tactics payload
  const tacticsPayload = useMemo<SharedTacticsPayload>(() => {
    let tacticName = currentTacticName || t('tactics.title', 'Chiến thuật thi đấu');
    let frames: any[] = [];
    let category = 'training';

    if (currentTacticFrames && currentTacticFrames.length > 0) {
      frames = currentTacticFrames;
    } else if (activeBoard) {
      if (activeBoard.frames && activeBoard.frames.length > 0) {
        frames = activeBoard.frames.map((f, idx) => 
          idx === activeBoard.currentFrameIndex 
            ? { ...f, positions: (activeBoard.positions && activeBoard.positions.length > 0) ? activeBoard.positions : f.positions, lines: activeBoard.lines || f.lines }
            : f
        );
      } else if (activeBoard.positions && activeBoard.positions.length > 0) {
        frames = [{ id: 'frame-1', positions: activeBoard.positions, lines: activeBoard.lines || [] }];
      }
    }
    
    if ((!frames || frames.length === 0 || frames[0].positions?.length === 0) && savedTactics.length > 0) {
      frames = savedTactics[0].frames;
      tacticName = savedTactics[0].name;
      category = savedTactics[0].category;
    }

    return {
      v: 1,
      type: 'tactics',
      teamName: settings.teamName?.trim() || '5TactiQ',
      logoUrl: settings.logoUrl,
      tacticName,
      category,
      createdAt: new Date().toISOString(),
      boardDimensions: activeBoard?.dimensions ? {
        width: activeBoard.dimensions.width,
        height: activeBoard.dimensions.height,
        isLandscape: activeBoard.dimensions.isLandscape
      } : undefined,
      frames
    };
  }, [currentTacticFrames, currentTacticName, activeBoard, savedTactics, settings, t]);

  // Generate share link whenever type or payload changes
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsGenerating(true);

    const payload = shareType === 'stats' ? statsPayload : tacticsPayload;
    createShareLink(payload).then((url) => {
      if (isMounted) {
        setShareUrl(url);
        setIsGenerating(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, shareType, statsPayload, tacticsPayload]);

  const handleManualSync = async () => {
    if (isManualSyncing) return;
    hapticImpact('light');
    setIsManualSyncing(true);
    setSyncSuccess(false);

    try {
      // 1. Rehydrate all Zustand stores from storage
      await rehydrateAllStores();

      // 2. Sync with cloud if online & logged in
      if (syncNow) {
        await syncNow(false);
      }

      // 3. Broadcast tactics in real-time if board is present
      if (activeBoard) {
        broadcastTacticsState(activeBoard);
      }

      // 4. Force re-create share link URL with newest payload
      const payload = shareType === 'stats' ? statsPayload : tacticsPayload;
      const url = await createShareLink(payload);
      setShareUrl(url);
      setSyncSuccess(true);

      addToast({
        type: 'success',
        message: t('share.sync_success_toast', 'Đã đồng bộ dữ liệu mới nhất!')
      });

      setTimeout(() => {
        setSyncSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('[ShareModal] Manual sync failed:', err);
      addToast({
        type: 'error',
        message: t('share.sync_failed_toast', 'Không thể đồng bộ dữ liệu. Vui lòng thử lại!')
      });
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      hapticImpact('medium');
      setIsCopied(true);
      addToast({
        type: 'success',
        message: t('share.copied_toast', 'Đã sao chép liên kết chia sẻ!')
      });
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      addToast({
        type: 'error',
        message: t('share.copy_failed', 'Không thể sao chép liên kết')
      });
    }
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Share2 className="text-teal-600" size={22} />
          <span className="font-display uppercase tracking-wider">{t('share.modal_title', 'CHIA SẺ CHO ĐỘI')}</span>
        </div>
      }
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4 text-text-main py-1">
        {/* Share Category Selector */}
        <div>
          <label className="block text-xs font-display font-bold uppercase tracking-wider text-text-muted mb-2">
            {t('share.select_target', '1. CHỌN NỘI DUNG CHIA SẺ')}
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Stats Card */}
            <button
              type="button"
              onClick={() => {
                hapticImpact('light');
                setShareType('stats');
              }}
              className={`p-3.5 border-2 text-left transition-all flex flex-col justify-start ${
                shareType === 'stats'
                  ? 'border-primary bg-primary/10 shadow-[3px_3px_0px_0px_var(--color-primary)]'
                  : 'border-border-main bg-surface hover:border-primary/40'
              }`}
            >
              <h4 className="font-display font-bold uppercase text-sm sm:text-base text-primary">
                {t('share.stats_tab', 'THỐNG KÊ')}
              </h4>
              <p className="text-[11px] text-text-muted mt-1 leading-snug">
                {t('share.stats_desc', 'Bàn thắng, kiến tạo, điểm danh & phong độ cầu thủ')}
              </p>
            </button>

            {/* Tactics Card */}
            <button
              type="button"
              onClick={() => {
                hapticImpact('light');
                setShareType('tactics');
              }}
              className={`p-3.5 border-2 text-left transition-all flex flex-col justify-start ${
                shareType === 'tactics'
                  ? 'border-secondary bg-secondary/10 shadow-[3px_3px_0px_0px_var(--color-secondary)]'
                  : 'border-border-main bg-surface hover:border-secondary/40'
              }`}
            >
              <h4 className="font-display font-bold uppercase text-sm sm:text-base text-secondary">
                {t('share.tactics_tab', 'SA BÀN')}
              </h4>
              <p className="text-[11px] text-text-muted mt-1 leading-snug">
                {t('share.tactics_desc', 'Sơ đồ thi đấu, vị trí di chuyển & bài chiến thuật')}
              </p>
            </button>
          </div>
        </div>

        {/* Options for Selected Target */}
        {shareType === 'stats' && hasSeasonConfig && (
          <div className="flex items-center justify-between p-3 bg-surface border border-border-main text-xs">
            <span className="font-display font-bold uppercase text-text-muted">
              {t('share.filter_season', 'Phạm vi tính số liệu:')}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setStatsFilter('current_season')}
                className={`px-2.5 py-1 text-xs font-display font-bold uppercase border ${
                  statsFilter === 'current_season'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-text-muted border-border-main hover:text-primary'
                }`}
              >
                {seasonRange?.label || t('share.current_season', 'Mùa hiện tại')}
              </button>
              <button
                type="button"
                onClick={() => setStatsFilter('all_time')}
                className={`px-2.5 py-1 text-xs font-display font-bold uppercase border ${
                  statsFilter === 'all_time'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-text-muted border-border-main hover:text-primary'
                }`}
              >
                {t('share.all_time', 'TẤT CẢ')}
              </button>
            </div>
          </div>
        )}

        {/* Share Actions Box */}
        <div className="p-3.5 bg-surface border-2 border-border-main flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-xs font-display font-bold uppercase tracking-wider text-text-muted">
              {t('share.share_link_label', '2. LIÊN KẾT XEM TRỰC TIẾP')}
            </label>

            {/* Sync button for user assurance (text only, no icon) */}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isManualSyncing}
              className={`px-2.5 py-1 text-xs font-display font-bold uppercase tracking-wider border transition-all cursor-pointer active:scale-95 ${
                syncSuccess
                  ? 'bg-emerald-600/15 text-emerald-600 border-emerald-600/40 shadow-sm'
                  : isManualSyncing
                  ? 'bg-teal-600/15 text-teal-600 border-teal-600/40'
                  : 'bg-surface-card text-text-main border-border-main hover:border-primary hover:text-primary shadow-sm'
              }`}
              title={t('share.sync_tooltip', 'Cập nhật lại dữ liệu mới nhất')}
            >
              <span>
                {isManualSyncing
                  ? t('share.syncing', 'ĐANG ĐỒNG BỘ...')
                  : syncSuccess
                  ? t('share.synced', 'ĐÃ ĐỒNG BỘ')
                  : t('share.sync_now', 'ĐỒNG BỘ DỮ LIỆU')}
              </span>
            </button>
          </div>

          {/* Link Box */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface-card border border-border-main px-3 py-2 text-xs font-mono text-text-muted truncate select-all">
              {isGenerating ? t('share.generating_link', 'Đang tạo liên kết an toàn...') : shareUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={isGenerating || !shareUrl}
              className={`px-3.5 py-2 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border transition-all shrink-0 cursor-pointer active:scale-95 ${
                isCopied
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-primary text-white border-primary hover:bg-primary/90'
              }`}
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
              <span>{isCopied ? t('share.copied', 'ĐÃ CHÉP') : t('share.copy_btn', 'CHÉP LINK')}</span>
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
