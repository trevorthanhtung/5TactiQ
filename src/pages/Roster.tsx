import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerStore } from '../store/usePlayerStore';
import { useToastStore } from '../store/useToastStore';
import { Plus, X, BarChart2, Check } from 'lucide-react';
import { useHardwareBack } from '../hooks/useHardwareBack';
import { RosterSkeleton } from '../components/ui/RosterSkeleton';
import { BottomSheet } from '../components/ui/BottomSheet';
import type { Position } from '../types';
import { useTranslation } from 'react-i18next';
import { compareVietnameseNames } from '../utils/sortUtils';

export default function Roster() {
  const { t } = useTranslation();
  const { players, fetchPlayers, addPlayer } = usePlayerStore();
  const { addToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newPositions, setNewPositions] = useState<string[]>([]);
  type FilterType = 'all' | 'injured' | 'recovering' | 'borrowed';
  const [filter, setFilter] = useState<FilterType>('all');
  const [newIsBorrowed, setNewIsBorrowed] = useState(false);

  useHardwareBack(showAddForm, () => setShowAddForm(false));

  useEffect(() => {
    fetchPlayers();
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // 500ms delay to simulate Native loading
    return () => clearTimeout(timer);
  }, [fetchPlayers]);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    await addPlayer({
      name: newName,
      jersey_number: newNumber ? parseInt(newNumber) : null,
      positions: newPositions as Position[],
      isBorrowed: newIsBorrowed,
    });
    setNewName('');
    setNewNumber('');
    setNewPositions([]);
    setNewIsBorrowed(false);
    setShowAddForm(false);
    addToast({ type: 'success', message: t('toast.roster_added', { name: newName }) });
  };

  const togglePosition = (pos: string) => {
    setNewPositions(prev =>
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    );
  };

  if (isLoading) {
    return <RosterSkeleton />;
  }

  const sortedPlayers = [...players].sort((a, b) => {
    const numA = (a.jersey_number !== null && a.jersey_number !== undefined && !isNaN(Number(a.jersey_number))) ? Number(a.jersey_number) : null;
    const numB = (b.jersey_number !== null && b.jersey_number !== undefined && !isNaN(Number(b.jersey_number))) ? Number(b.jersey_number) : null;

    if (numA !== null && numB !== null) {
      if (numA !== numB) return numA - numB;
      return compareVietnameseNames(a.name, b.name);
    }
    if (numA !== null) return -1;
    if (numB !== null) return 1;

    return compareVietnameseNames(a.name, b.name);
  });

  const filteredPlayers = sortedPlayers.filter(player => {
    if (filter === 'injured') {
      return player.healthStatus && player.healthStatus.includes('Chấn thương');
    }
    if (filter === 'recovering') {
      return player.healthStatus === 'Đang hồi phục';
    }
    if (filter === 'borrowed') {
      return !!player.isBorrowed;
    }
    return true;
  });

  return (
    <div className="p-4 md:p-6 flex flex-col min-h-full max-w-5xl mx-auto w-full pb-8">
      <div className="flex justify-between items-end mb-6 pt-2">
        <h1 className="text-4xl @sm:text-5xl font-display uppercase text-primary leading-none">{t('roster.title')}</h1>
        <div className="flex items-center gap-4">
          <Link to="/stats" className="hallmark-btn-outline flex items-center gap-2 shrink-0">
            <BarChart2 size={20} /> <span className="hidden @xl:inline">{t('roster.stats')}</span>
          </Link>
          <button
            onClick={() => setShowAddForm(true)}
            className="hallmark-btn flex items-center gap-2 bg-secondary text-white shrink-0"
          >
            <Plus size={20} /> <span className="hidden @xl:inline">{t('roster.add_player')}</span>
          </button>
        </div>
      </div>
      <div className="hallmark-divider mt-0"></div>

      <BottomSheet
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title={
          <span className="flex items-center gap-2">
            <Plus size={20} /> {t('roster.add_rookie')}
          </span>
        }
      >
        <form onSubmit={handleAddPlayer} className="space-y-6">
          <div className="grid grid-cols-1 @sm:grid-cols-3 gap-4">
            <div className="@sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('roster.player_name_label')}</label>
              <input
                type="text"
                inputMode="text"
                enterKeyHint="next"
                autoComplete="name"
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-lg text-primary"
                value={newName}
                onChange={e => setNewName(e.target.value)}
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
                value={newNumber}
                onChange={e => setNewNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder={t('roster.jersey_number_placeholder')}
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
                  onClick={() => togglePosition(pos)}
                  className={`px-4 py-2 font-display uppercase tracking-widest border-2 transition-colors ${newPositions.includes(pos) ? 'border-primary bg-primary text-white' : 'border-border-main text-text-muted hover:border-primary'}`}
                >
                  {t(`position.${pos}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">{t('roster.status_label')}</label>
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                newIsBorrowed ? 'bg-primary border-primary text-white' : 'bg-surface border-border-main group-hover:border-primary/50'
              }`}>
                {newIsBorrowed && <Check size={14} strokeWidth={3} />}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={newIsBorrowed}
                onChange={(e) => setNewIsBorrowed(e.target.checked)}
              />
              <span className="font-bold text-text-main font-display">{t('roster.borrowed_label')}</span>
            </label>
          </div>
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-border-main hover:bg-surface transition-colors active:scale-95">
              {t('roster.cancel')}
            </button>
            <button type="submit" className="flex-1 bg-secondary text-white font-display uppercase tracking-wider py-3 border-2 border-secondary hover:bg-[#d05c21] transition-colors active:scale-95">
              {t('roster.save')}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto hide-scrollbar shrink-0 py-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-2 text-xs font-display uppercase tracking-wider font-bold border-2 transition-all shrink-0 ${
            filter === 'all'
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-surface text-text-muted border-border-main hover:border-primary/50'
          }`}
        >
          {t('roster.filter_all', 'Tất cả')} ({players.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('injured')}
          className={`px-3.5 py-2 text-xs font-display uppercase tracking-wider font-bold border-2 transition-all shrink-0 ${
            filter === 'injured'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-surface text-text-muted border-border-main hover:border-rose-500/50'
          }`}
        >
          {t('roster.filter_injured', 'Chấn thương')} ({players.filter(p => p.healthStatus && p.healthStatus.includes('Chấn thương')).length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('recovering')}
          className={`px-3.5 py-2 text-xs font-display uppercase tracking-wider font-bold border-2 transition-all shrink-0 ${
            filter === 'recovering'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-surface text-text-muted border-border-main hover:border-blue-500/50'
          }`}
        >
          {t('roster.filter_recovering', 'Phục hồi')} ({players.filter(p => p.healthStatus === 'Đang hồi phục').length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('borrowed')}
          className={`px-3.5 py-2 text-xs font-display uppercase tracking-wider font-bold border-2 transition-all shrink-0 ${
            filter === 'borrowed'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-surface text-text-muted border-border-main hover:border-purple-500/50'
          }`}
        >
          {t('roster.filter_borrowed', 'Mượn')} ({players.filter(p => p.isBorrowed).length})
        </button>
      </div>

      {/* Roster Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-surface border-2 border-border-main p-8 text-center my-4">
          <p className="text-text-muted font-bold text-sm uppercase tracking-wider">
            {t('roster.no_filtered_players', 'Không tìm thấy cầu thủ phù hợp')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 @md:grid-cols-3 @xl:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredPlayers.map(player => (
            <Link key={player.id} to={`/roster/${player.id}`} className="block group">
              <div className="hallmark-card p-0 relative overflow-hidden bg-surface hover:border-secondary transition-colors h-full flex flex-col">
                {/* Top Right Badges */}
                <div className="absolute top-0 right-0 flex z-10 shadow-sm">
                  {player.healthStatus && player.healthStatus !== 'Khỏe mạnh' && (
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border-l-2 border-border-main ${
                        player.healthStatus.includes('Chấn thương') 
                          ? 'bg-white text-red-600' 
                          : 'bg-blue-500 text-white'
                      }`}
                      title={player.healthStatus}
                    >
                      <Plus size={16} strokeWidth={4} />
                    </div>
                  )}
                  {player.isBorrowed && (
                    <div className="bg-purple-600 text-white font-display font-bold w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm sm:text-base border-l-2 border-slate-100/20" title={t('roster.borrowed_tooltip')}>
                      L
                    </div>
                  )}
                  {player.isCaptain && (
                    <div className="bg-amber-500 text-white font-display font-bold w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm sm:text-base border-l-2 border-slate-100/20" title={t('roster.captain_tooltip')}>
                      C
                    </div>
                  )}
                </div>

                {/* Top Left Jersey Number */}
                <div className="absolute top-0 left-0 bg-primary text-white font-display text-lg sm:text-xl min-w-9 h-9 sm:min-w-10 sm:h-10 px-1.5 flex items-center justify-center shadow-sm z-10">
                  {player.jersey_number || '-'}
                </div>

                {/* Card Content */}
                <div className="p-3 pt-11 sm:p-4 sm:pt-13 flex-1 flex flex-col justify-between">
                  <h3 className="font-bold text-sm sm:text-base leading-tight mb-2 uppercase tracking-wide group-hover:text-secondary transition-colors">
                    {player.name}
                  </h3>
                  <div className="flex gap-1 flex-wrap mt-auto">
                    {player.positions.map(pos => (
                      <span key={pos} className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-accent/40 text-primary px-1.5 py-0.5">
                        {t(`position.${pos}`)}
                      </span>
                    ))}
                    {player.positions.length === 0 && <span className="text-[9px] sm:text-[10px] text-slate-400">{t('roster.no_position')}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
