import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/usePlayerStore';
import { useToastStore } from '../store/useToastStore';
import { User, ArrowLeft, Trash2, Award, X, Edit2, Activity } from 'lucide-react';
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

      <div className="hallmark-card bg-surface overflow-hidden relative mb-6">
        {/* Large Background Number */}
        <div className="absolute right-[-20px] top-[-20px] text-[180px] font-display text-accent/30 leading-none select-none z-0">
          {player.jersey_number || 'X'}
        </div>

        <div className="relative z-10 flex flex-col @sm:flex-row items-center @sm:items-start p-6 gap-6">
          <div className="flex-1 text-center @sm:text-left">
            <h1 className="text-4xl font-display uppercase leading-tight mb-3 text-primary text-center @sm:text-left">
              {player.name}
            </h1>
            <div className="flex gap-2 justify-center @sm:justify-start flex-wrap mb-4">
              {player.isCaptain && (
                <span className="bg-amber-500 text-white font-display font-bold uppercase tracking-widest px-3 py-1 text-sm shadow-sm" title="Đội trưởng">
                  C
                </span>
              )}
              {player.isBorrowed && (
                <span className="bg-purple-600 text-white font-display font-bold uppercase tracking-widest px-3 py-1 text-sm shadow-sm" title={t('roster.borrowed_tooltip', 'Cầu thủ mượn')}>
                  MƯỢN
                </span>
              )}
              {player.isYouth && (
                <span className="bg-emerald-500 text-white font-display font-bold uppercase tracking-widest px-3 py-1 text-sm shadow-sm" title={t('roster.youth_tooltip', 'Cầu thủ đội trẻ lên')}>
                  TRẺ LÊN
                </span>
              )}
              {player.healthStatus && player.healthStatus !== 'Khỏe mạnh' && (
                <span className={`font-display font-bold uppercase tracking-widest text-white px-3 py-1 text-sm shadow-sm ${player.healthStatus.includes('Chấn thương') ? 'bg-red-500' : 'bg-sky-500'}`}>
                  {player.healthStatus}
                </span>
              )}
              {player.positions.map(pos => (
                <span key={pos} className="font-display font-bold uppercase tracking-widest bg-secondary text-white px-3 py-1 text-sm shadow-sm">
                  {t(`position.${pos}`)}
                </span>
              ))}
            </div>
            <div className="text-sm font-bold uppercase tracking-widest text-slate-400">
              {t('roster.jersey_number')} <span className="text-primary text-xl font-display ml-1">{player.jersey_number || t('roster.no_jersey')}</span>
            </div>
            {(player.phone || player.note) && (
              <div className="mt-4 flex flex-col gap-2">
                {player.phone && (
                  <div className="text-sm font-bold text-slate-500 flex items-center gap-2 justify-center @sm:justify-start">
                    <span className="uppercase tracking-widest">{t('roster.phone_label', 'Số điện thoại')}:</span>
                    <a href={`tel:${player.phone}`} className="text-primary hover:underline">{player.phone}</a>
                  </div>
                )}
                {player.note && (
                  <div className="text-sm font-bold text-slate-500 flex items-start gap-2 justify-center @sm:justify-start text-left">
                    <span className="uppercase tracking-widest whitespace-nowrap">{t('roster.note_label', 'Ghi chú')}:</span>
                    <span className="text-text-main font-medium">{player.note}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="hallmark-card p-4 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{t('roster.goals')}</div>
          <div className="text-4xl font-display text-primary">0</div>
        </div>
        <div className="hallmark-card p-4 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{t('roster.assists')}</div>
          <div className="text-4xl font-display text-primary">0</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={openEditModal}
          className="hallmark-btn w-full flex justify-center items-center gap-2 bg-primary text-white hover:bg-primary/90"
        >
          {t('roster.edit_info')}
        </button>

        {player.isCaptain ? (
          <button 
            onClick={() => { setCaptain(null); addToast({ type: 'info', message: t('toast.captain_removed', { name: player.name }) }); }}
            className="hallmark-btn-outline w-full flex justify-center items-center gap-2 text-text-muted border-slate-300 hover:bg-surface hover:text-slate-700"
          >
            {t('roster.remove_captain')}
          </button>
        ) : (
          <button 
            onClick={() => { setCaptain(player.id); addToast({ type: 'success', message: t('toast.captain_set', { name: player.name }) }); }}
            className="hallmark-btn w-full flex justify-center items-center gap-2 bg-amber-500 text-white hover:bg-amber-600"
          >
            {t('roster.set_captain')}
          </button>
        )}

        {player.isBorrowed ? (
          <button 
            onClick={() => { updatePlayer(player.id, { isBorrowed: false }); addToast({ type: 'info', message: t('toast.unmarked_borrowed', { name: player.name }) }); }}
            className="hallmark-btn-outline w-full flex justify-center items-center gap-2 text-purple-600 border-purple-300 hover:bg-purple-50 hover:border-purple-600"
          >
            {t('roster.unmark_borrowed')}
          </button>
        ) : (
          <button 
            onClick={() => { updatePlayer(player.id, { isBorrowed: true }); addToast({ type: 'info', message: t('toast.marked_borrowed', { name: player.name }) }); }}
            className="hallmark-btn-outline w-full flex justify-center items-center gap-2 text-purple-600 border-purple-300 hover:bg-purple-50 hover:border-purple-600"
          >
            {t('roster.mark_borrowed')}
          </button>
        )}

        {player.isYouth ? (
          <button 
            onClick={() => { updatePlayer(player.id, { isYouth: false }); addToast({ type: 'info', message: t('toast.unmarked_youth', { name: player.name }) }); }}
            className="hallmark-btn-outline w-full flex justify-center items-center gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-600"
          >
            {t('roster.unmark_youth', 'BỎ ĐÁNH DẤU CẦU THỦ TRẺ')}
          </button>
        ) : (
          <button 
            onClick={() => { updatePlayer(player.id, { isYouth: true }); addToast({ type: 'info', message: t('toast.marked_youth', { name: player.name }) }); }}
            className="hallmark-btn-outline w-full flex justify-center items-center gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-600"
          >
            {t('roster.mark_youth', 'ĐÁNH DẤU LÀ CẦU THỦ TRẺ')}
          </button>
        )}

        <button 
          onClick={openHealthModal}
          className="hallmark-btn-outline w-full flex justify-center items-center text-rose-600 border-rose-300 hover:bg-rose-50 hover:border-rose-600"
        >
          {t('roster.edit_health', 'TÌNH TRẠNG CHẤN THƯƠNG')}
        </button>
        
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="hallmark-btn-outline w-full flex justify-center items-center gap-2 border-red-500 text-red-600 hover:bg-red-500 hover:border-red-500"
        >
          {t('roster.delete_player')}
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

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setHealthStatus(status)}
                    className={`p-3 font-display text-sm font-bold uppercase tracking-wider border-2 transition-colors text-center ${colorClass}`}
                  >
                    {status}
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
