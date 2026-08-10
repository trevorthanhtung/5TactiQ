import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/usePlayerStore';
import { useMatchStore } from '../store/useMatchStore';
import { useToastStore } from '../store/useToastStore';
import { User, ArrowLeft, Trash2, Award, X, Edit2, Activity, Phone, Hash, FileText } from 'lucide-react';
import { useHardwareBack } from '../hooks/useHardwareBack';
import { PlayerProfileSkeleton } from '../components/ui/PlayerProfileSkeleton';
import { BottomSheet } from '../components/ui/BottomSheet';
import type { Position, HealthStatus } from '../types';
import { useTranslation, Trans } from 'react-i18next';

export default function PlayerProfile() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { players, deletePlayer, setCaptain, updatePlayer } = usePlayerStore();
  const { matches } = useMatchStore();
  const { addToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editPositions, setEditPositions] = useState<string[]>([]);
  const [editPhone, setEditPhone] = useState('');
  const [editNote, setEditNote] = useState('');
  
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('Khỏe mạnh');
  const [healthNote, setHealthNote] = useState('');

  useHardwareBack(showEditModal, () => setShowEditModal(false));
  useHardwareBack(showHealthModal, () => setShowHealthModal(false));
  useHardwareBack(showDeleteConfirm, () => setShowDeleteConfirm(false));
  
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

  // Calculate player goals and assists across all non-internal matches
  const totalGoals = matches.reduce((sum, m) => {
    if (m.matchType !== 'internal' && m.stats) {
      const s = m.stats.find(stat => stat.playerId === player.id);
      if (s) return sum + (s.goals || 0);
    }
    return sum;
  }, 0);

  const totalAssists = matches.reduce((sum, m) => {
    if (m.matchType !== 'internal' && m.stats) {
      const s = m.stats.find(stat => stat.playerId === player.id);
      if (s) return sum + (s.assists || 0);
    }
    return sum;
  }, 0);

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
    });
    setShowEditModal(false);
    addToast({ type: 'success', message: t('toast.player_updated', { name: editName }) });
  };

  const toggleEditPosition = (pos: string) => {
    setEditPositions(prev => 
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    );
  };

  return (
    <div className="p-4 md:p-6 flex flex-col min-h-full max-w-2xl mx-auto w-full pb-8">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 font-bold text-text-muted hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft size={20} /> {t('roster.back_to_list')}
      </button>

      <div className="hallmark-card bg-surface overflow-hidden relative mb-6 p-6 sm:p-7 border-2 border-border-main shadow-md">
        {/* Large Background Watermark Number */}
        <div className="absolute right-[-10px] bottom-[-25px] text-[150px] sm:text-[180px] font-display text-primary/10 leading-none select-none pointer-events-none z-0">
          {player.jersey_number || 'X'}
        </div>

        <div className="relative z-10 flex flex-col gap-5">
          {/* Top Section: Name & Badges */}
          <div>
            <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
              <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-wide text-text-main font-bold">
                {player.name}
              </h1>
              
              {/* Jersey Pill Badge */}
              <div className="flex items-center gap-1.5 bg-surface-2 px-3 py-1 border border-border-main text-xs font-bold uppercase tracking-widest text-text-muted">
                <Hash size={14} className="text-secondary" />
                <span>{t('roster.jersey_number')}:</span>
                <span className="text-text-main font-display text-base font-bold ml-0.5">
                  {player.jersey_number !== null && player.jersey_number !== undefined ? `#${player.jersey_number}` : t('roster.no_jersey')}
                </span>
              </div>
            </div>

            {/* Badges Row */}
            <div className="flex gap-2 flex-wrap items-center">
              {player.isCaptain && (
                <span className="bg-amber-500 text-white font-display font-bold uppercase tracking-widest px-3 py-1 text-xs shadow-sm" title="Đội trưởng">
                  C
                </span>
              )}
              {player.isBorrowed && (
                <span className="bg-purple-600 text-white font-display font-bold uppercase tracking-widest px-3 py-1 text-xs shadow-sm" title={t('roster.borrowed_tooltip', 'Cầu thủ mượn')}>
                  {t('roster.borrowed_badge', 'MƯỢN')}
                </span>
              )}
              {player.isYouth && (
                <span className="bg-emerald-500 text-white font-display font-bold uppercase tracking-widest px-3 py-1 text-xs shadow-sm" title={t('roster.youth_tooltip', 'Cầu thủ đội trẻ lên')}>
                  {t('roster.youth_badge', 'TRẺ LÊN')}
                </span>
              )}
              {player.healthStatus && player.healthStatus !== 'Khỏe mạnh' && (
                <span className={`font-display font-bold uppercase tracking-widest text-white px-3 py-1 text-xs shadow-sm ${player.healthStatus.includes('Chấn thương') ? 'bg-red-500' : 'bg-sky-500'}`}>
                  {player.healthStatus === 'Chấn thương nhẹ' ? t('health.light_injury', 'Chấn thương nhẹ') :
                   player.healthStatus === 'Chấn thương nặng' ? t('health.severe_injury', 'Chấn thương nặng') :
                   player.healthStatus === 'Đang hồi phục' ? t('health.recovering', 'Đang hồi phục') :
                   player.healthStatus}
                </span>
              )}
              {player.positions.map(pos => (
                <span key={pos} className="font-display font-bold uppercase tracking-widest bg-secondary text-white px-3 py-1 text-xs shadow-sm">
                  {t(`position.${pos}`)}
                </span>
              ))}
            </div>
          </div>

          {/* Details Section: Phone & Note */}
          {(player.phone || player.note) && (
            <div className="flex flex-col gap-2.5 pt-2 border-t border-border-main/60">
              {player.phone && (
                <div className="flex items-center gap-2.5 text-sm">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-2 text-text-muted border border-border-main text-xs font-bold uppercase tracking-wider">
                    <Phone size={13} className="text-secondary" />
                    <span>{t('roster.phone_label', 'Số điện thoại')}</span>
                  </span>
                  <a href={`tel:${player.phone}`} className="font-mono font-bold text-text-main hover:text-secondary hover:underline text-base tracking-wide">
                    {player.phone}
                  </a>
                </div>
              )}

              {player.note && (
                <div className="p-3 bg-surface-2/60 border-l-4 border-secondary text-sm flex items-start gap-2.5 mt-1">
                  <FileText size={16} className="text-secondary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-[11px] uppercase tracking-wider block text-text-muted mb-0.5">
                      {t('roster.note_label', 'Ghi chú')}
                    </span>
                    <p className="text-text-main font-medium text-sm leading-relaxed break-words">
                      {player.note}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="hallmark-card p-4 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('roster.goals')}</div>
          <div className="text-4xl font-display text-text-main font-bold">{totalGoals}</div>
        </div>
        <div className="hallmark-card p-4 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('roster.assists')}</div>
          <div className="text-4xl font-display text-text-main font-bold">{totalAssists}</div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Top Action Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {player.phone && (
            <a 
              href={`tel:${player.phone}`}
              className="hallmark-btn flex justify-center items-center gap-2 bg-sky-600 text-white border-2 border-sky-600 hover:bg-sky-700 py-3.5 transition-all shadow-sm active:scale-95"
            >
              <Phone size={18} /> {t('roster.call_player', 'GỌI ĐIỆN')}
            </a>
          )}
          
          <button 
            onClick={openEditModal}
            className={`hallmark-btn flex justify-center items-center gap-2 bg-primary text-white border-2 border-primary hover:bg-[#323d29] py-3.5 transition-all shadow-sm active:scale-95 ${!player.phone ? 'sm:col-span-2' : ''}`}
          >
            <Edit2 size={18} /> {t('roster.edit_info')}
          </button>
        </div>

        {/* Roles & Status Toggles Card */}
        <div className="bg-surface border-2 border-border-main p-4 flex flex-col gap-2.5 shadow-sm">
          <div className="text-[11px] font-display uppercase tracking-widest font-bold text-text-muted mb-0.5">
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
              className={`p-3 border-2 font-display text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 ${
                player.isCaptain 
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm' 
                  : 'bg-surface-2 text-text-muted border-border-main hover:text-amber-500 hover:border-amber-500/50'
              }`}
            >
              <span>{player.isCaptain ? t('roster.remove_captain') : t('roster.set_captain')}</span>
            </button>

            {/* Borrowed Toggle */}
            <button 
              onClick={() => {
                updatePlayer(player.id, { isBorrowed: !player.isBorrowed });
                addToast({ 
                  type: 'info', 
                  message: player.isBorrowed ? t('toast.unmarked_borrowed', { name: player.name }) : t('toast.marked_borrowed', { name: player.name })
                });
              }}
              className={`p-3 border-2 font-display text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 ${
                player.isBorrowed 
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                  : 'bg-surface-2 text-text-muted border-border-main hover:text-purple-400 hover:border-purple-500/50'
              }`}
            >
              <span>{player.isBorrowed ? t('roster.unmark_borrowed') : t('roster.mark_borrowed')}</span>
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
              className={`p-3 border-2 font-display text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 ${
                player.isYouth 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                  : 'bg-surface-2 text-text-muted border-border-main hover:text-emerald-400 hover:border-emerald-500/50'
              }`}
            >
              <span>{player.isYouth ? t('roster.unmark_youth', 'BỎ CẦU THỦ TRẺ') : t('roster.mark_youth', 'CẦU THỦ TRẺ')}</span>
            </button>
          </div>
        </div>

        {/* Health & Delete Actions */}
        <button 
          onClick={openHealthModal}
          className="w-full hallmark-btn-outline flex justify-center items-center gap-2 bg-surface-2 text-text-main border-2 border-border-main hover:border-primary/50 py-3.5 transition-all active:scale-95 font-display text-xs font-bold uppercase tracking-wider"
        >
          {t('roster.edit_health', 'TÌNH TRẠNG CHẤN THƯƠNG')}
        </button>
        
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex justify-center items-center gap-2 text-rose-500 hover:text-rose-400 py-2.5 transition-colors font-display text-xs font-bold uppercase tracking-wider active:scale-95 mt-1"
        >
          <Trash2 size={16} /> {t('roster.delete_player')}
        </button>
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
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('roster.player_name_label')}</label>
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
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('roster.jersey_number_label')}</label>
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
                placeholder={t('roster.phone_placeholder', 'VD: 0912 345 678')}
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
                placeholder={t('roster.note_placeholder', 'Nhập thông tin hoặc tình trạng chấn thương...')}
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
