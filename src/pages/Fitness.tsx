import { useState, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { ArrowLeft, Activity, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FitnessSkeleton } from '../components/ui/FitnessSkeleton';
import { BottomSheet } from '../components/ui/BottomSheet';
import { useTranslation } from 'react-i18next';
import type { HealthStatus } from '../types';
import { compareVietnameseNames } from '../utils/sortUtils';

export default function Fitness() {
  const { t } = useTranslation();
  const { players, updatePlayer } = usePlayerStore();
  const navigate = useNavigate();
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const [editData, setEditData] = useState<{ status: HealthStatus; note: string }>({
    status: 'Khỏe mạnh',
    note: ''
  });

  const getStatusColor = (status?: HealthStatus) => {
    switch (status) {
      case 'Khỏe mạnh': return 'bg-emerald-500';
      case 'Chấn thương nhẹ': return 'bg-amber-500';
      case 'Chấn thương nặng': return 'bg-rose-600';
      case 'Đang hồi phục': return 'bg-blue-500';
      default: return 'bg-emerald-500';
    }
  };

  const getStatusTranslation = (status: HealthStatus) => {
    switch (status) {
      case 'Khỏe mạnh': return t('fitness.status_healthy', 'Khỏe mạnh');
      case 'Chấn thương nhẹ': return t('fitness.status_light', 'Chấn thương nhẹ');
      case 'Chấn thương nặng': return t('fitness.status_heavy', 'Chấn thương nặng');
      case 'Đang hồi phục': return t('fitness.status_recovering', 'Đang hồi phục');
      default: return status;
    }
  };

  // Sort: issues first, then name
  const sortedPlayers = [...players].sort((a, b) => {
    const aIssue = a.healthStatus && a.healthStatus !== 'Khỏe mạnh';
    const bIssue = b.healthStatus && b.healthStatus !== 'Khỏe mạnh';
    if (aIssue && !bIssue) return -1;
    if (!aIssue && bIssue) return 1;
    return compareVietnameseNames(a.name, b.name);
  });

  const handleEditClick = (player: any) => {
    setSelectedPlayer(player);
    setEditData({
      status: player.healthStatus || 'Khỏe mạnh',
      note: player.healthNote || ''
    });
  };

  const handleSave = () => {
    if (selectedPlayer) {
      updatePlayer(selectedPlayer.id, {
        healthStatus: editData.status,
        healthNote: editData.note,
        healthUpdatedAt: new Date().toISOString()
      });
      setSelectedPlayer(null);
    }
  };

  if (isLoading) {
    return <FitnessSkeleton />;
  }

  return (
    <div className="p-4 flex flex-col min-h-full max-w-5xl mx-auto w-full pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 @sm:gap-3 mb-6 pt-2">
        <button 
          onClick={() => navigate('/more')}
          className="p-2 text-primary hover:bg-primary/10 border-2 border-primary/30 hover:border-primary transition-all shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl @md:text-4xl font-display uppercase text-primary leading-none">{t('fitness.title', 'Chấn thương & Thể lực')}</h1>
        </div>
      </div>

      <div className="hallmark-divider mb-6"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sortedPlayers.map(player => {
          const status = player.healthStatus || 'Khỏe mạnh';
          const dotColor = getStatusColor(status);
          
          return (
            <div 
              key={player.id} 
              onClick={() => handleEditClick(player)}
              className="bg-surface border-2 border-border-main shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-colors group relative"
            >
              {status !== 'Khỏe mạnh' && (
                <div className={`absolute top-0 right-0 w-2 h-full ${dotColor}`} />
              )}
              
              {/* Avatar removed as per request */}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-display font-bold text-primary uppercase leading-normal pt-1 truncate">{player.name}</h3>
                  <span className={`px-2 py-0.5 text-[9px] font-display uppercase tracking-widest font-bold text-white shrink-0 ${dotColor}`}>
                    {getStatusTranslation(status)}
                  </span>
                </div>
                {player.healthNote && (
                  <p className="text-xs text-text-muted truncate">{player.healthNote}</p>
                )}
                {player.healthUpdatedAt && (
                  <p className="text-[10px] text-slate-400 mt-1">{t('fitness.updated_at', 'Cập nhật:')} {new Date(player.healthUpdatedAt).toLocaleDateString('vi-VN')}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Cập nhật */}
      <BottomSheet
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        title={
          <span className="flex items-center gap-2">
            <Activity size={24} /> {t('fitness.update_modal_title', 'Cập nhật thể trạng')}
          </span>
        }
      >
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h4 className="font-display text-2xl text-primary uppercase">{selectedPlayer?.name}</h4>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">{t('fitness.status_label', 'Trạng thái')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Khỏe mạnh', 'Chấn thương nhẹ', 'Chấn thương nặng', 'Đang hồi phục'] as HealthStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setEditData({ ...editData, status: s })}
                  className={`p-2 text-xs font-bold uppercase tracking-widest border-2 transition-colors ${
                    editData.status === s 
                      ? `border-primary ${getStatusColor(s)} text-white` 
                      : 'border-border-main text-text-muted hover:border-primary/50 bg-surface-2 transition-colors'
                  }`}
                >
                  {getStatusTranslation(s)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('fitness.notes_label', 'Ghi chú (Tùy chọn)')}</label>
            <textarea 
              value={editData.note}
              onChange={e => setEditData({...editData, note: e.target.value})}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium min-h-[80px] text-sm"
              placeholder={t('fitness.notes_placeholder', 'Ví dụ: Đau gối, nghỉ 2 tuần...')}
            />
          </div>

          <div className="pt-6">
            <button onClick={handleSave} className="w-full bg-secondary text-white font-display uppercase tracking-wider py-3 border-2 border-secondary hover:bg-[#d05c21] transition-colors active:scale-95">
              {t('fitness.save_btn', 'LƯU THAY ĐỔI')}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
