import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePlayerStore } from '../store/usePlayerStore';
import { useMatchStore } from '../store/useMatchStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';
import { 
  ArrowLeft, Edit2, Activity, Phone, Hash, FileText, 
  Calendar, Check, ShieldCheck, Zap, Trophy, TrendingUp, EyeOff
} from 'lucide-react';
import { useHardwareBack } from '../hooks/useHardwareBack';
import { PlayerProfileSkeleton } from '../components/ui/PlayerProfileSkeleton';
import { BottomSheet } from '../components/ui/BottomSheet';
import type { Position, HealthStatus } from '../types';
import { useTranslation, Trans } from 'react-i18next';
import { isPlayerHidden, getPlayerPerMatchStatus } from '../utils/playerUtils';

export default function PlayerProfile() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { players, deletePlayer, setCaptain, updatePlayer } = usePlayerStore();
  const { matches } = useMatchStore();
  const { settings } = useSettingsStore();
  const { addToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewAddCount, setRenewAddCount] = useState('1');

  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editPositions, setEditPositions] = useState<string[]>([]);
  const [editPhone, setEditPhone] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editIsBorrowed, setEditIsBorrowed] = useState(false);
  const [editIsYouth, setEditIsYouth] = useState(false);
  const [editIsPerMatch, setEditIsPerMatch] = useState(false);
  const [editMatchQuota, setEditMatchQuota] = useState('1');
  const [editIsManuallyHidden, setEditIsManuallyHidden] = useState(false);
  
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('Khỏe mạnh');
  const [healthNote, setHealthNote] = useState('');

  useHardwareBack(showEditModal, () => setShowEditModal(false));
  useHardwareBack(showHealthModal, () => setShowHealthModal(false));
  useHardwareBack(showDeleteConfirm, () => setShowDeleteConfirm(false));
  useHardwareBack(showRenewModal, () => setShowRenewModal(false));
  
  useEffect(() => {
    setIsLoading(true);
    window.scrollTo(0, 0);
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.scrollTo(0, 0);
      setTimeout(() => {
        mainContent.scrollTop = 0;
      }, 10);
    }
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Simulate Native loading transition
    
    return () => clearTimeout(timer);
  }, [id]);
  
  const player = players.find(p => p.id === id);

  if (isLoading) {
    return <PlayerProfileSkeleton />;
  }

  if (!player) {
    return <div className="p-4 text-center mt-10">{t('roster.not_found')}</div>;
  }

  // Calculate player goals and assists across all valid finished matches
  const totalGoals = matches.reduce((sum, m) => {
    if (m.status !== 'finished') return sum;
    const shouldTrackStats = m.matchType !== 'internal' || !!m.trackStats;
    if (shouldTrackStats && m.stats) {
      const s = m.stats.find(stat => stat.playerId === player.id);
      if (s) return sum + (s.goals || 0);
    }
    return sum;
  }, 0);

  const totalAssists = matches.reduce((sum, m) => {
    if (m.status !== 'finished') return sum;
    const shouldTrackStats = m.matchType !== 'internal' || !!m.trackStats;
    if (shouldTrackStats && m.stats) {
      const s = m.stats.find(stat => stat.playerId === player.id);
      if (s) return sum + (s.assists || 0);
    }
    return sum;
  }, 0);

  // Filter all finished matches this player participated in
  const playerMatches = matches.filter(m => {
    if (m.status !== 'finished') return false;
    const isAttended = m.attendance?.[player.id] === 'present';
    const stat = m.stats?.find(s => s.playerId === player.id);
    const hasStats = stat && ((stat.goals || 0) > 0 || (stat.assists || 0) > 0);
    const hasTeam = !!m.teams?.[player.id];
    return isAttended || hasStats || hasTeam;
  });

  const handleDelete = async () => {
    const idToDelete = player.id;
    const playerName = player.name;
    navigate('/roster', { replace: true });
    await deletePlayer(idToDelete);
    addToast({ type: 'success', message: t('toast.player_removed', { name: playerName }) });
  };

  const openEditModal = () => {
    if (!player) return;
    setEditName(player.name);
    setEditNumber(player.jersey_number ? String(player.jersey_number) : '');
    setEditPositions(player.positions || []);
    setEditPhone(player.phone || '');
    setEditNote(player.note || '');
    setEditIsBorrowed(!!player.isBorrowed);
    setEditIsYouth(!!player.isYouth);
    setEditIsPerMatch(!!player.isPerMatch);
    setEditMatchQuota(String(player.matchQuota || 1));
    setEditIsManuallyHidden(!!player.isManuallyHidden);
    setShowEditModal(true);
  };

  const openHealthModal = () => {
    if (!player) return;
    setHealthStatus(player.healthStatus || 'Khỏe mạnh');
    setHealthNote(player.healthNote || '');
    setShowHealthModal(true);
  };

  const handleSaveHealth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;
    updatePlayer(player.id, {
      healthStatus,
      healthNote,
      healthUpdatedAt: new Date().toISOString()
    });
    addToast({ 
      type: 'success', 
      message: t('toast.health_updated', 'Đã cập nhật tình trạng sức khỏe cho {{name}}.', { name: player.name }) 
    });
    setShowHealthModal(false);
  };

  const handleEditPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName) return;
    await updatePlayer(player.id, {
      name: editName,
      jersey_number: editNumber ? parseInt(editNumber) : null,
      positions: editPositions as Position[],
      phone: editPhone,
      note: editNote,
      isBorrowed: editIsBorrowed,
      isYouth: editIsYouth,
      isPerMatch: editIsPerMatch,
      matchQuota: editIsPerMatch ? Math.max(1, parseInt(editMatchQuota) || 1) : undefined,
      isManuallyHidden: editIsManuallyHidden,
    });
    setShowEditModal(false);
    addToast({ type: 'success', message: t('toast.player_updated', { name: editName }) });
  };

  const handleQuickRenew = async (additionalMatches: number) => {
    if (!player) return;
    const currentQuota = player.matchQuota || 1;
    const newQuota = currentQuota + additionalMatches;
    await updatePlayer(player.id, {
      isPerMatch: true,
      matchQuota: newQuota,
      isManuallyHidden: false
    });
    addToast({
      type: 'success',
      message: t('roster.renew_success', 'Đã gia hạn thêm {{count}} trận cho {{name}}', { count: additionalMatches, name: player.name })
    });
    setShowRenewModal(false);
  };

  const toggleEditPosition = (pos: string) => {
    setEditPositions(prev => 
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    );
  };

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 flex flex-col max-w-7xl 2xl:max-w-[1520px] mx-auto w-full animate-fade-in-up">
      
      {/* 🧭 Back Navigation */}
      <div className="mb-6">
        <Link 
          to="/roster" 
          className="inline-flex items-center gap-2 font-display text-xs sm:text-sm uppercase tracking-wider font-bold text-text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} /> 
          <span>{t('roster.title', 'ĐỘI HÌNH')}</span>
        </Link>
      </div>

      {/* 📐 2-Column Responsive Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 👈 LEFT COLUMN: Player Card & Actions (5 cols on lg, 4 cols on 2xl) */}
        <div className="lg:col-span-5 2xl:col-span-4 flex flex-col gap-4 sm:gap-6">
          
          {/* 🎴 Athletic Player Identity Card */}
          <div className="hallmark-card bg-surface overflow-hidden relative p-5 sm:p-6 border-2 border-border-main shadow-sm">
            {/* Background Watermark Number */}
            <div className="absolute right-[-10px] bottom-[-25px] text-[140px] sm:text-[170px] font-display font-bold text-primary/[0.07] leading-none select-none pointer-events-none z-0">
              {player.jersey_number !== null && player.jersey_number !== undefined ? player.jersey_number : '—'}
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                  <h1 className="text-2xl sm:text-3xl font-display uppercase tracking-wide text-text-main font-bold leading-none">
                    {player.name}
                  </h1>
                  
                  {/* Jersey Pill */}
                  <div className="flex items-center gap-1 bg-surface-2 px-2.5 py-1 border border-border-main text-xs font-bold uppercase tracking-wider text-text-muted">
                    <Hash size={13} className="text-secondary" />
                    <span>{t('roster.jersey_number')}:</span>
                    <span className="text-text-main font-display text-sm font-bold">
                      {player.jersey_number !== null && player.jersey_number !== undefined ? `#${player.jersey_number}` : t('roster.no_jersey')}
                    </span>
                  </div>
                </div>

                {/* Badges Row */}
                <div className="flex gap-1.5 flex-wrap items-center pt-1">
                  {isPlayerHidden(player, matches) && (
                    <span className="bg-slate-700 text-white font-display font-bold uppercase tracking-widest px-2.5 py-0.5 text-xs shadow-sm">
                      {t('roster.hidden_badge', 'ẨN')}
                    </span>
                  )}
                  {player.isCaptain && (
                    <span className="bg-amber-500 text-white font-display font-bold uppercase tracking-widest px-2.5 py-0.5 text-xs shadow-sm" title="Đội trưởng">
                      C • {t('roster.captain_label', 'ĐỘI TRƯỞNG')}
                    </span>
                  )}
                  {player.isBorrowed && (
                    <span className="bg-purple-600 text-white font-display font-bold uppercase tracking-widest px-2.5 py-0.5 text-xs shadow-sm">
                      {t('roster.borrowed_badge', 'MƯỢN')}
                    </span>
                  )}
                  {player.isYouth && (
                    <span className="bg-emerald-500 text-white font-display font-bold uppercase tracking-widest px-2.5 py-0.5 text-xs shadow-sm">
                      {t('roster.youth_badge', 'TRẺ LÊN')}
                    </span>
                  )}
                  {player.isPerMatch && (
                    <span className="bg-amber-600 text-white font-display font-bold uppercase tracking-widest px-2.5 py-0.5 text-xs shadow-sm">
                      {t('roster.per_match_badge', 'THEO TRẬN')}
                    </span>
                  )}
                  {player.positions.map(pos => (
                    <span key={pos} className="font-display font-bold uppercase tracking-wider bg-accent/40 text-primary px-2 py-0.5 text-xs">
                      {t(`position.${pos}`)}
                    </span>
                  ))}
                  {player.positions.length === 0 && (
                    <span className="text-xs text-text-muted italic">{t('roster.no_position')}</span>
                  )}
                </div>
              </div>

              {/* Details: Phone & Note */}
              {(player.phone || player.note) && (
                <div className="flex flex-col gap-2 pt-3 border-t border-border-main/60">
                  {player.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="inline-flex items-center px-2 py-0.5 bg-surface-2 text-text-muted border border-border-main text-[11px] font-bold uppercase tracking-wider">
                        {t('roster.phone_label', 'Số điện thoại')}
                      </span>
                      <a href={`tel:${player.phone}`} className="font-mono font-bold text-text-main hover:text-secondary hover:underline text-sm tracking-wide">
                        {player.phone}
                      </a>
                    </div>
                  )}

                  {player.note && (
                    <div className="p-2.5 bg-surface-2/60 border-l-4 border-secondary text-xs flex items-start gap-2">
                      <FileText size={14} className="text-secondary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-[10px] uppercase tracking-wider block text-text-muted mb-0.5">
                          {t('roster.note_label', 'Ghi chú')}
                        </span>
                        <p className="text-text-main font-medium text-xs leading-relaxed break-words">
                          {player.note}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 🏥 Health & Injury Status Card (Inline Status) */}
          <div className="hallmark-card bg-surface border-2 border-border-main p-4 sm:p-5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-text-muted">
                {t('fitness.status', 'Tình trạng thể lực')}
              </span>
              <button
                type="button"
                onClick={openHealthModal}
                className="text-xs font-display font-bold uppercase tracking-wider text-secondary hover:underline"
              >
                {t('roster.edit_health', 'Cập nhật')}
              </button>
            </div>

            {/* Visual Status Indicator Banner */}
            <div className={`p-2.5 sm:p-3 border-2 flex items-center justify-between gap-3 ${
              !player.healthStatus || player.healthStatus === 'Khỏe mạnh'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : player.healthStatus === 'Chấn thương nặng'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                : player.healthStatus === 'Chấn thương nhẹ'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  !player.healthStatus || player.healthStatus === 'Khỏe mạnh'
                    ? 'bg-emerald-500'
                    : player.healthStatus === 'Chấn thương nặng'
                    ? 'bg-rose-500 animate-pulse'
                    : player.healthStatus === 'Chấn thương nhẹ'
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`} />
                <span className="font-display font-bold text-xs sm:text-sm uppercase tracking-wider">
                  {player.healthStatus === 'Chấn thương nhẹ' ? t('health.light_injury', 'Chấn thương nhẹ') :
                   player.healthStatus === 'Chấn thương nặng' ? t('health.severe_injury', 'Chấn thương nặng') :
                   player.healthStatus === 'Đang hồi phục' ? t('health.recovering', 'Đang hồi phục') :
                   t('health.healthy', 'Khỏe mạnh (Sẵn sàng thi đấu)')}
                </span>
              </div>
            </div>

            {player.healthNote && (
              <div className="text-xs text-text-muted italic bg-surface-2 p-2 border border-border-main">
                <span className="font-bold not-italic">{t('fitness.note', 'Ghi chú')}:</span> {player.healthNote}
              </div>
            )}
          </div>

          {/* 📅 Match-based Contract Banner & Renewal (if applicable) */}
          {player.isPerMatch && (() => {
            const perMatch = getPlayerPerMatchStatus(player, matches);
            return (
              <div className="bg-surface border-2 border-border-main p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-amber-600" />
                    <span className="font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-text-main">
                      {t('roster.per_match_label', 'HỢP ĐỒNG THEO TRẬN')}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 text-[11px] font-display font-bold uppercase tracking-wider border ${
                    perMatch.isCompleted 
                      ? 'bg-slate-700 text-white border-slate-700' 
                      : 'bg-amber-500 text-white border-amber-600'
                  }`}>
                    {perMatch.isCompleted 
                      ? t('roster.per_match_completed', 'Đã hết số trận') 
                      : t('roster.per_match_active', { attended: perMatch.attended, quota: perMatch.quota, defaultValue: `Đang hoạt động (${perMatch.attended}/${perMatch.quota} trận)` })}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                    <span>{t('roster.per_match_attended_label', 'Số trận đã đá')}:</span>
                    <span className="text-text-main font-mono text-xs">{perMatch.attended} / {perMatch.quota} {t('roster.match_unit', 'Trận')}</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-2 border border-border-main overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${perMatch.isCompleted ? 'bg-slate-600' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, (perMatch.attended / perMatch.quota) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Quick Renewal Buttons */}
                <div className="mt-3 pt-2.5 border-t border-border-main/60 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted mr-1">
                    {t('roster.renew_label', 'Gia hạn')}:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickRenew(1)}
                    className="px-2.5 py-1 text-xs font-display font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/40 hover:bg-amber-500 hover:text-white transition-colors active:scale-95"
                  >
                    +1 {t('roster.match_unit', 'Trận')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRenew(2)}
                    className="px-2.5 py-1 text-xs font-display font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/40 hover:bg-amber-500 hover:text-white transition-colors active:scale-95"
                  >
                    +2 {t('roster.match_unit', 'Trận')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenewAddCount('3');
                      setShowRenewModal(true);
                    }}
                    className="px-2.5 py-1 text-xs font-display font-bold uppercase tracking-wider bg-surface-2 text-text-main border border-border-main hover:border-primary transition-colors active:scale-95 ml-auto"
                  >
                    {t('roster.renew_matches', 'Tùy chọn')}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 🏷️ Balanced 1-Line Role Toggles */}
          <div className="bg-surface border-2 border-border-main p-4 flex flex-col gap-2.5 shadow-sm">
            <div className="text-[11px] font-display uppercase tracking-widest font-bold text-text-muted">
              {t('roster.status_role_title', 'VAI TRÒ & PHÂN LOẠI')}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Captain Toggle */}
              <button 
                onClick={() => {
                  if (player.isCaptain) {
                    setCaptain(null);
                    addToast({ type: 'info', message: t('toast.captain_removed', { name: player.name }) });
                  } else {
                    setCaptain(player.id);
                    addToast({ type: 'success', message: t('toast.captain_set', { name: player.name }) });
                  }
                }}
                className={`p-2.5 border-2 font-display text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  player.isCaptain 
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm' 
                    : 'bg-surface-2 text-text-muted border-border-main hover:text-amber-500 hover:border-amber-500/50'
                }`}
              >
                <span>{player.isCaptain ? t('roster.remove_captain', 'BỎ ĐỘI TRƯỞNG') : t('roster.set_captain', 'ĐỘI TRƯỞNG')}</span>
              </button>

              {/* Borrowed Toggle (Single line title) */}
              <button 
                onClick={() => {
                  updatePlayer(player.id, { isBorrowed: !player.isBorrowed });
                  addToast({ 
                    type: 'info', 
                    message: player.isBorrowed ? t('toast.unmarked_borrowed', { name: player.name }) : t('toast.marked_borrowed', { name: player.name })
                  });
                }}
                className={`p-2.5 border-2 font-display text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  player.isBorrowed 
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                    : 'bg-surface-2 text-text-muted border-border-main hover:text-purple-400 hover:border-purple-500/50'
                }`}
              >
                <span>{player.isBorrowed ? t('roster.unmark_borrowed', 'BỎ MƯỢN') : t('roster.mark_borrowed', 'MƯỢN TỪ ĐỘI KHÁC')}</span>
              </button>

              {/* Youth Toggle */}
              <button 
                onClick={() => {
                  updatePlayer(player.id, { isYouth: !player.isYouth });
                  addToast({ 
                    type: 'info', 
                    message: player.isYouth ? t('toast.unmarked_youth', { name: player.name }) : t('toast.marked_youth', { name: player.name })
                  });
                }}
                className={`p-2.5 border-2 font-display text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  player.isYouth 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                    : 'bg-surface-2 text-text-muted border-border-main hover:text-emerald-400 hover:border-emerald-500/50'
                }`}
              >
                <span>{player.isYouth ? t('roster.unmark_youth', 'BỎ CẦU THỦ TRẺ') : t('roster.mark_youth', 'CẦU THỦ TRẺ')}</span>
              </button>
            </div>
          </div>

          {/* ⚡ Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {player.phone && (
                <a 
                  href={`tel:${player.phone}`}
                  className="hallmark-btn flex justify-center items-center bg-sky-600 text-white border-2 border-sky-600 hover:bg-sky-700 py-3 transition-all shadow-sm active:scale-95 font-display text-sm uppercase tracking-wider"
                >
                  {t('roster.call_player', 'GỌI ĐIỆN')}
                </a>
              )}
              
              <button 
                onClick={openEditModal}
                className={`hallmark-btn flex justify-center items-center bg-primary text-white border-2 border-primary hover:bg-[#323d29] py-3 transition-all shadow-sm active:scale-95 font-display text-sm uppercase tracking-wider ${!player.phone ? 'sm:col-span-2' : ''}`}
              >
                {t('roster.edit_info', 'SỬA THÔNG TIN')}
              </button>
            </div>

            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex justify-center items-center gap-1.5 text-rose-500 hover:text-rose-400 py-2 transition-colors font-display text-xs font-bold uppercase tracking-wider active:scale-95 mt-1"
            >
              {t('roster.delete_player', 'XÓA KHỎI ĐỘI')}
            </button>
          </div>

        </div>

        {/* 👉 RIGHT COLUMN: Performance Stats & Match Log (7 cols on lg, 8 cols on 2xl) */}
        <div className="lg:col-span-7 2xl:col-span-8 flex flex-col gap-4 sm:gap-6">
          
          {/* 📊 Performance KPI Grid (4 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">{t('roster.goals', 'Bàn thắng')}</div>
              <div className="text-3xl sm:text-4xl font-display text-primary font-bold">{totalGoals}</div>
            </div>

            <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">{t('roster.assists', 'Kiến tạo')}</div>
              <div className="text-3xl sm:text-4xl font-display text-secondary font-bold">{totalAssists}</div>
            </div>

            <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">{t('roster.matches_played', 'Số trận đã đá')}</div>
              <div className="text-3xl sm:text-4xl font-display text-text-main font-bold">{playerMatches.length}</div>
            </div>

            <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">{t('roster.contribution_rate', 'Đóng góp / Trận')}</div>
              <div className="text-3xl sm:text-4xl font-display text-text-main font-bold">
                {playerMatches.length > 0 ? ((totalGoals + totalAssists) / playerMatches.length).toFixed(1) : '0.0'}
              </div>
            </div>
          </div>

          {/* ⚽ Recent Match Appearances & Contributions Log */}
          <div className="hallmark-card bg-surface border-2 border-border-main p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-border-main">
              <h2 className="font-display text-lg sm:text-xl uppercase tracking-widest text-primary font-bold flex items-center gap-2">
                {t('roster.match_history_title', 'LỊCH SỬ THI ĐẤU & ĐÓNG GÓP')}
              </h2>
              <span className="text-xs font-display uppercase tracking-wider text-text-muted font-bold">
                {playerMatches.length} {t('roster.match_unit', 'Trận')}
              </span>
            </div>

            {playerMatches.length === 0 ? (
              <div className="p-8 text-center bg-surface-2 border-2 border-border-main/50">
                <p className="text-text-muted font-medium text-sm">
                  {t('roster.no_matches_yet', 'Chưa có lịch sử thi đấu nào cho cầu thủ này.')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {playerMatches.slice(0, 8).map(m => {
                  const stat = m.stats?.find(s => s.playerId === player.id);
                  const matchGoals = stat?.goals || 0;
                  const matchAssists = stat?.assists || 0;

                  let resultBadge = null;
                  if (m.status === 'finished' && typeof m.scoreUs === 'number' && typeof m.scoreOpponent === 'number') {
                    if (m.scoreUs > m.scoreOpponent) {
                      resultBadge = <span className="px-2 py-0.5 bg-emerald-500 text-white font-display text-xs font-bold">THẮNG {m.scoreUs}-{m.scoreOpponent}</span>;
                    } else if (m.scoreUs < m.scoreOpponent) {
                      resultBadge = <span className="px-2 py-0.5 bg-rose-600 text-white font-display text-xs font-bold">THUA {m.scoreUs}-{m.scoreOpponent}</span>;
                    } else {
                      resultBadge = <span className="px-2 py-0.5 bg-amber-500 text-white font-display text-xs font-bold">HÒA {m.scoreUs}-{m.scoreOpponent}</span>;
                    }
                  }

                  return (
                    <div 
                      key={m.id}
                      className="p-3 sm:p-3.5 bg-surface-2 border-2 border-border-main hover:border-primary/50 transition-colors flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-sm sm:text-base text-text-main uppercase tracking-wide">
                            vs {m.opponent || 'Trận đấu nội bộ'}
                          </span>
                          {resultBadge}
                        </div>
                        <div className="text-[11px] text-text-muted font-medium mt-0.5">
                          {m.date ? new Date(m.date).toLocaleDateString('vi-VN') : ''} • {m.location || 'Sân bóng'}
                        </div>
                      </div>

                      {/* In-match individual player contributions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {matchGoals > 0 && (
                          <span className="px-2 py-1 bg-primary text-white font-display text-xs font-bold uppercase">
                            {matchGoals} {t('roster.goal_unit', 'Bàn')}
                          </span>
                        )}
                        {matchAssists > 0 && (
                          <span className="px-2 py-1 bg-secondary text-white font-display text-xs font-bold uppercase">
                            {matchAssists} {t('roster.assist_unit', 'Kiến tạo')}
                          </span>
                        )}
                        {matchGoals === 0 && matchAssists === 0 && (
                          <span className="text-[11px] text-text-muted font-display uppercase tracking-wider font-bold">
                            {t('roster.attended_badge', 'ĐÃ RA SÂN')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <BottomSheet
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('roster.delete_confirm_title')}
        variant="danger"
      >
        <div className="flex flex-col">
          <p className="text-text-muted text-sm md:text-base font-sans mb-8 leading-relaxed">
            <Trans i18nKey="roster.delete_confirm_desc" values={{ name: player.name }}>
              Bạn có chắc chắn muốn xóa <span className="font-bold text-primary">{"{{name}}"}</span> khỏi danh sách đội? Hành động này không thể hoàn tác.
            </Trans>
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-slate-300 hover:bg-surface transition-colors active:scale-95"
            >
              {t('roster.cancel_delete')}
            </button>
            <button 
              onClick={handleDelete}
              className="flex-1 bg-red-500 text-white font-display uppercase tracking-wider py-3 border-2 border-red-600 hover:bg-red-600 transition-colors active:scale-95"
            >
              {t('roster.delete_now')}
            </button>
          </div>
        </div>
      </BottomSheet>
      <BottomSheet
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={
          <span className="flex items-center gap-2">
            <Edit2 size={20} /> {t('roster.edit_title')}
          </span>
        }
      >
        <form onSubmit={handleEditPlayer} className="space-y-6">
          <div className="grid grid-cols-3 gap-4 items-end">
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1 truncate" title={t('roster.player_name_label')}>{t('roster.player_name_label')}</label>
              <input 
                type="text" 
                inputMode="text"
                enterKeyHint="next"
                autoComplete="name"
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-lg text-primary"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                required
                placeholder={t('roster.player_name_placeholder')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1 truncate" title={t('roster.jersey_number_label')}>{t('roster.jersey_number_label')}</label>
              <input 
                type="text" 
                inputMode="numeric"
                enterKeyHint="done"
                pattern="[0-9]*"
                autoComplete="off"
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium text-lg"
                value={editNumber}
                onChange={e => setEditNumber(e.target.value)}
                placeholder={t('roster.jersey_number_placeholder')}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('roster.phone_label', 'Số điện thoại')}</label>
              <input
                type="tel"
                inputMode="tel"
                enterKeyHint="next"
                autoComplete="tel"
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium text-lg"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder={t('roster.phone_placeholder', 'Ví dụ: 0912 345 678...')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('roster.note_label', 'Ghi chú')}</label>
              <input
                type="text"
                enterKeyHint="done"
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium text-lg"
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                placeholder={t('roster.note_placeholder', 'Biệt danh, chấn thương, chân thuận...')}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">{t('roster.position_label')}</label>
            <div className="flex gap-2 flex-wrap">
              {['GK', 'Fixo', 'Ala', 'Pivô'].map(pos => (
                <button 
                  key={pos}
                  type="button"
                  onClick={() => toggleEditPosition(pos)}
                  className={`px-4 py-2 font-display uppercase tracking-widest border-2 transition-colors ${editPositions.includes(pos) ? 'border-primary bg-primary text-white' : 'border-border-main text-text-muted hover:border-primary'}`}
                >
                  {t(`position.${pos}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">{t('roster.status_label')}</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                  editIsBorrowed ? 'bg-primary border-primary text-white' : 'bg-surface border-border-main group-hover:border-primary/50'
                }`}>
                  {editIsBorrowed && <Check size={14} strokeWidth={3} />}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={editIsBorrowed}
                  onChange={(e) => setEditIsBorrowed(e.target.checked)}
                />
                <span className="font-bold text-text-main font-display">{t('roster.borrowed_label')}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                  editIsYouth ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-surface border-border-main group-hover:border-emerald-500/50'
                }`}>
                  {editIsYouth && <Check size={14} strokeWidth={3} />}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={editIsYouth}
                  onChange={(e) => setEditIsYouth(e.target.checked)}
                />
                <span className="font-bold text-text-main font-display">{t('roster.youth_label', 'Cầu thủ đội trẻ lên')}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                  editIsPerMatch ? 'bg-amber-600 border-amber-600 text-white' : 'bg-surface border-border-main group-hover:border-amber-600/50'
                }`}>
                  {editIsPerMatch && <Check size={14} strokeWidth={3} />}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={editIsPerMatch}
                  onChange={(e) => setEditIsPerMatch(e.target.checked)}
                />
                <span className="font-bold text-text-main font-display">{t('roster.per_match_label', 'ĐÁ THEO SỐ TRẬN')}</span>
              </label>

              {editIsPerMatch && (
                <div className="mt-2 p-3.5 bg-surface-2 border-2 border-border-main flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                      {t('roster.match_quota_label', 'SỐ TRẬN ĐĂNG KÝ')}
                    </span>
                    
                    {/* Stepper Input */}
                    <div className="flex items-center border-2 border-border-main bg-surface shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setEditMatchQuota(q => String(Math.max(1, (parseInt(q) || 1) - 1)))}
                        className="w-8 h-8 flex items-center justify-center font-bold text-base hover:bg-surface-2 active:bg-border-main transition-colors text-text-muted hover:text-text-main"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        inputMode="numeric"
                        className="w-12 h-8 text-center bg-transparent font-display font-bold text-base text-primary outline-none"
                        value={editMatchQuota}
                        onChange={e => setEditMatchQuota(e.target.value.replace(/[^0-9]/g, ''))}
                      />
                      <button
                        type="button"
                        onClick={() => setEditMatchQuota(q => String((parseInt(q) || 1) + 1))}
                        className="w-8 h-8 flex items-center justify-center font-bold text-base hover:bg-surface-2 active:bg-border-main transition-colors text-text-muted hover:text-text-main"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 5].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setEditMatchQuota(String(num))}
                        className={`py-1 text-xs font-display font-bold uppercase tracking-wider border-2 transition-all active:scale-95 ${
                          Number(editMatchQuota) === num
                            ? 'bg-secondary text-white border-secondary shadow-sm'
                            : 'bg-surface text-text-muted border-border-main hover:border-secondary/50'
                        }`}
                      >
                        {num} {t('roster.match_unit', 'Trận')}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-text-muted leading-tight mt-0.5">
                    {t('roster.per_match_desc', 'Cầu thủ sẽ tự động chuyển sang Mục Ẩn sau khi thi đấu đủ số trận.')}
                  </p>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer select-none group pt-2 border-t border-border-main/60">
                <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                  editIsManuallyHidden ? 'bg-slate-700 border-slate-700 text-white' : 'bg-surface border-border-main group-hover:border-slate-500'
                }`}>
                  {editIsManuallyHidden && <Check size={14} strokeWidth={3} />}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={editIsManuallyHidden}
                  onChange={(e) => setEditIsManuallyHidden(e.target.checked)}
                />
                <span className="font-bold text-text-main font-display">
                  {t('roster.hide_player', 'CHUYỂN VÀO MỤC ẨN')}
                </span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-slate-300 hover:bg-surface transition-colors active:scale-95">
              {t('roster.cancel')}
            </button>
            <button type="submit" className="flex-1 bg-secondary text-white font-display uppercase tracking-wider py-3 border-2 border-secondary hover:bg-[#d05c21] transition-colors active:scale-95">
              {t('roster.save')}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Renew Matches Custom Modal */}
      <BottomSheet
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        title={
          <span className="flex items-center gap-2">
            <Calendar size={20} className="text-amber-500" /> {t('roster.renew_matches_title', 'GIA HẠN THÊM SỐ TRẬN THI ĐẤU')}
          </span>
        }
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const count = Math.max(1, parseInt(renewAddCount) || 1);
          handleQuickRenew(count);
        }} className="space-y-5">
          <div>
            <p className="text-sm text-text-muted mb-4 leading-relaxed">
              {t('roster.renew_modal_desc', 'Cộng thêm số trận vào hạn mức thi đấu hiện tại của {{name}}. Cầu thủ sẽ tự động được chuyển ra khỏi mục ẩn nếu số trận mới lớn hơn số trận đã đá.', { name: player.name })}
            </p>
            
            <div className="p-3.5 bg-surface-2 border-2 border-border-main flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  {t('roster.renew_add_matches', 'Số trận cộng thêm')}
                </span>

                {/* Stepper Input */}
                <div className="flex items-center border-2 border-border-main bg-surface shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setRenewAddCount(q => String(Math.max(1, (parseInt(q) || 1) - 1)))}
                    className="w-8 h-8 flex items-center justify-center font-bold text-base hover:bg-surface-2 active:bg-border-main transition-colors text-text-muted hover:text-text-main"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    inputMode="numeric"
                    className="w-12 h-8 text-center bg-transparent font-display font-bold text-base text-primary outline-none"
                    value={renewAddCount}
                    onChange={e => setRenewAddCount(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                  <button
                    type="button"
                    onClick={() => setRenewAddCount(q => String((parseInt(q) || 1) + 1))}
                    className="w-8 h-8 flex items-center justify-center font-bold text-base hover:bg-surface-2 active:bg-border-main transition-colors text-text-muted hover:text-text-main"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRenewAddCount(String(num))}
                    className={`py-1 text-xs font-display font-bold uppercase tracking-wider border-2 transition-all active:scale-95 ${
                      Number(renewAddCount) === num
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-surface text-text-muted border-border-main hover:border-amber-500/50'
                    }`}
                  >
                    +{num} {t('roster.match_unit', 'Trận')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={() => setShowRenewModal(false)} className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-border-main hover:bg-surface transition-colors active:scale-95">
              {t('roster.cancel', 'HỦY')}
            </button>
            <button type="submit" className="flex-1 bg-amber-600 text-white font-display uppercase tracking-wider py-3 border-2 border-amber-600 hover:bg-amber-700 transition-colors active:scale-95">
              {t('roster.confirm_renew', 'XÁC NHẬN GIA HẠN')}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Health Status Modal */}
      <BottomSheet
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        title={
          <span className="flex items-center gap-2">
            <Activity size={20} className="text-rose-500" /> {t('roster.edit_health_title', 'TÌNH TRẠNG SỨC KHỎE / CHẤN THƯƠNG')}
          </span>
        }
      >
        <form onSubmit={handleSaveHealth} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-3">{t('fitness.status', 'Tình trạng sức khỏe')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Khỏe mạnh', 'Chấn thương nhẹ', 'Chấn thương nặng', 'Đang hồi phục'] as HealthStatus[]).map(status => {
                const isSelected = healthStatus === status;
                let colorClass = 'border-border-main text-text-muted hover:border-primary';
                if (isSelected) {
                  if (status === 'Khỏe mạnh') colorClass = 'border-emerald-500 bg-emerald-500 text-white';
                  else if (status === 'Chấn thương nhẹ') colorClass = 'border-amber-500 bg-amber-500 text-white';
                  else if (status === 'Chấn thương nặng') colorClass = 'border-red-500 bg-red-500 text-white';
                  else if (status === 'Đang hồi phục') colorClass = 'border-sky-500 bg-sky-500 text-white';
                }

                let statusLabel: string = status;
                if (status === 'Khỏe mạnh') statusLabel = t('health.healthy', 'Khỏe mạnh');
                if (status === 'Chấn thương nhẹ') statusLabel = t('health.light_injury', 'Chấn thương nhẹ');
                if (status === 'Chấn thương nặng') statusLabel = t('health.severe_injury', 'Chấn thương nặng');
                if (status === 'Đang hồi phục') statusLabel = t('health.recovering', 'Đang hồi phục');

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setHealthStatus(status)}
                    className={`p-3 font-display text-sm font-bold uppercase tracking-wider border-2 transition-colors text-center ${colorClass}`}
                  >
                    {statusLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('fitness.note', 'Ghi chú chấn thương / sức khỏe')}</label>
            <input
              type="text"
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium text-sm"
              value={healthNote}
              onChange={e => setHealthNote(e.target.value)}
              placeholder={t('fitness.note_placeholder', 'Ví dụ: Trật khớp gối, nghỉ 2 tuần...')}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={() => setShowHealthModal(false)} className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-slate-300 hover:bg-surface transition-colors active:scale-95">
              {t('roster.cancel', 'HỦY')}
            </button>
            <button type="submit" className="flex-1 bg-secondary text-white font-display uppercase tracking-wider py-3 border-2 border-secondary hover:bg-secondary/90 transition-colors active:scale-95">
              {t('roster.save', 'LƯU TÌNH TRẠNG')}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
