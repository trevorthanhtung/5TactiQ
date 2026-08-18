import { useState, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { ArrowLeft, Activity, X, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
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

  const [statusFilter, setStatusFilter] = useState<'all' | 'issue' | 'healthy'>('all');

  // Filter & Sort
  const filteredPlayers = sortedPlayers
    .filter(player => {
      const matchSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (player.healthNote && player.healthNote.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchSearch) return false;

      const isIssue = player.healthStatus && player.healthStatus !== 'Khỏe mạnh';
      if (statusFilter === 'issue') return isIssue;
      if (statusFilter === 'healthy') return !isIssue;
      return true;
    });

  if (isLoading) {
    return <FitnessSkeleton />;
  }

  return (
    <div className="p-4 flex flex-col min-h-full max-w-6xl mx-auto w-full pb-32 lg:pb-8">
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

      {/* Filter & Search Bar */}
      {players.length > 0 && (
        <div className="mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-text-muted" />
            </div>
            <input
              type="text"
              placeholder={t('fitness.search_placeholder', 'Tìm tên cầu thủ, ghi chú...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border-2 border-border-main text-text-main py-2.5 pl-10 pr-3 outline-none focus:border-primary transition-colors text-sm placeholder:text-text-muted/60 placeholder:uppercase tracking-wider"
            />
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="flex border-2 border-border-main bg-surface shrink-0 overflow-hidden text-xs font-display font-bold uppercase tracking-wider">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-2 transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-primary text-white' : 'text-text-muted hover:bg-primary/5'
              }`}
            >
              {t('fitness.filter_all', 'Tất cả')} ({players.length})
            </button>
            <button
              onClick={() => setStatusFilter('issue')}
              className={`px-3.5 py-2 border-l border-border-main transition-colors cursor-pointer ${
                statusFilter === 'issue' ? 'bg-blue-600 text-white' : 'text-text-muted hover:bg-blue-500/10'
              }`}
            >
              {t('fitness.filter_issues', 'Cần chú ý')} ({players.filter(p => p.healthStatus && p.healthStatus !== 'Khỏe mạnh').length})
            </button>
            <button
              onClick={() => setStatusFilter('healthy')}
              className={`px-3.5 py-2 border-l border-border-main transition-colors cursor-pointer ${
                statusFilter === 'healthy' ? 'bg-emerald-600 text-white' : 'text-text-muted hover:bg-emerald-500/10'
              }`}
            >
              {t('fitness.filter_healthy', 'Khỏe mạnh')} ({players.filter(p => !p.healthStatus || p.healthStatus === 'Khỏe mạnh').length})
            </button>
          </div>
        </div>
      )}

      {filteredPlayers.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border-main bg-surface-2/40 text-text-muted">
          <p className="text-sm font-display uppercase tracking-wider">{t('fitness.no_players_found', 'Không tìm thấy cầu thủ nào')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPlayers.map(player => {
            const status = player.healthStatus || 'Khỏe mạnh';
            const dotColor = getStatusColor(status);
            
            return (
              <div 
                key={player.id} 
                onClick={() => handleEditClick(player)}
                className="bg-surface border-2 border-border-main shadow-sm p-3.5 flex flex-col justify-between gap-2.5 cursor-pointer hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_var(--color-primary)] transition-all group relative active:scale-[0.99]"
              >
                {status !== 'Khỏe mạnh' && (
                  <div className={`absolute top-0 right-0 w-2 h-full ${dotColor}`} />
                )}
                
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-display font-bold text-primary uppercase text-base leading-normal pt-0.5 truncate group-hover:text-secondary transition-colors">{player.name}</h3>
                    <span className={`px-2 py-0.5 text-[9px] font-display uppercase tracking-widest font-bold text-white shrink-0 ${dotColor}`}>
                      {getStatusTranslation(status)}
                    </span>
                  </div>
                  {player.healthNote && (
                    <p className="text-xs text-text-muted font-sans line-clamp-2 mt-0.5">{player.healthNote}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-text-muted/70 pt-1 border-t border-border-main/40 font-mono">
                  <span>
                    {player.healthUpdatedAt 
                      ? `${t('fitness.updated_at', 'Cập nhật:')} ${new Date(player.healthUpdatedAt).toLocaleDateString('vi-VN')}`
                      : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
