import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerStore } from '../store/usePlayerStore';
import { useMatchStore } from '../store/useMatchStore';
import { useToastStore } from '../store/useToastStore';
import { Plus, X, BarChart2, Check, Cross, Activity, Search, EyeOff, Calendar } from 'lucide-react';
import { useHardwareBack } from '../hooks/useHardwareBack';
import { RosterSkeleton } from '../components/ui/RosterSkeleton';
import { BottomSheet } from '../components/ui/BottomSheet';
import type { Position } from '../types';
import { useTranslation } from 'react-i18next';
import { compareVietnameseNames } from '../utils/sortUtils';
import { isPlayerHidden, getPlayerPerMatchStatus } from '../utils/playerUtils';

export default function Roster() {
  const { t } = useTranslation();
  const { players, fetchPlayers, addPlayer } = usePlayerStore();
  const { matches } = useMatchStore();
  const { addToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newPositions, setNewPositions] = useState<string[]>([]);
  type FilterType = 'all' | 'injured' | 'recovering' | 'borrowed' | 'youth' | 'per_match' | 'hidden';
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newIsBorrowed, setNewIsBorrowed] = useState(false);
  const [newIsYouth, setNewIsYouth] = useState(false);
  const [newIsPerMatch, setNewIsPerMatch] = useState(false);
  const [newMatchQuota, setNewMatchQuota] = useState('1');

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
      isYouth: newIsYouth,
      isPerMatch: newIsPerMatch,
      matchQuota: newIsPerMatch ? Math.max(1, parseInt(newMatchQuota) || 1) : undefined,
      phone: newPhone,
      note: newNote,
    });
    setNewName('');
    setNewNumber('');
    setNewPhone('');
    setNewNote('');
    setNewPositions([]);
    setNewIsBorrowed(false);
    setNewIsYouth(false);
    setNewIsPerMatch(false);
    setNewMatchQuota('1');
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
    const aHidden = isPlayerHidden(a, matches) ? 1 : 0;
    const bHidden = isPlayerHidden(b, matches) ? 1 : 0;
    if (aHidden !== bHidden) {
      return aHidden - bHidden;
    }

    // 1. Group hierarchy: Main squad (0) -> Youth (1) -> Borrowed/Loan (2) -> Per-Match (3)
    const getCategoryRank = (p: typeof a) => {
      if (p.isPerMatch) return 3;
      if (p.isBorrowed) return 2;
      if (p.isYouth) return 1;
      return 0;
    };

    const aRank = getCategoryRank(a);
    const bRank = getCategoryRank(b);
    
    if (aRank !== bRank) {
      return aRank - bRank;
    }

    // 2. Sort by jersey number if both have one
    const numA = (a.jersey_number !== null && a.jersey_number !== undefined && !isNaN(Number(a.jersey_number))) ? Number(a.jersey_number) : null;
    const numB = (b.jersey_number !== null && b.jersey_number !== undefined && !isNaN(Number(b.jersey_number))) ? Number(b.jersey_number) : null;

    if (numA !== null && numB !== null) {
      if (numA !== numB) return numA - numB;
      return compareVietnameseNames(a.name, b.name);
    }
    
    // 3. Players with jersey numbers come before those without
    if (numA !== null) return -1;
    if (numB !== null) return 1;

    // 4. Finally sort by name
    return compareVietnameseNames(a.name, b.name);
  });

  const filteredPlayers = sortedPlayers.filter(player => {
    if (searchQuery && !player.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    const isHidden = isPlayerHidden(player, matches);

    if (filter === 'hidden') {
      return isHidden;
    }

    // All other tabs exclude hidden players
    if (isHidden) {
      return false;
    }

    if (filter === 'injured') {
      return player.healthStatus && player.healthStatus.includes('Chấn thương');
    }
    if (filter === 'recovering') {
      return player.healthStatus === 'Đang hồi phục';
    }
    if (filter === 'borrowed') {
      return !!player.isBorrowed;
    }
    if (filter === 'youth') {
      return !!player.isYouth;
    }
    if (filter === 'per_match') {
      return !!player.isPerMatch;
    }
    return true;
  });

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 flex flex-col min-h-full max-w-7xl 2xl:max-w-[1520px] mx-auto w-full pb-20 lg:pb-12 animate-fade-in-up">
      <div className="flex justify-between items-end mb-6 pt-2">
        <h1 className="text-3xl sm:text-5xl font-display uppercase text-primary leading-none">{t('roster.title')}</h1>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/stats" className="hallmark-btn-outline flex items-center gap-2 shrink-0 py-2 px-4 sm:px-6 text-sm sm:text-base">
            <BarChart2 size={18} /> <span className="hidden sm:inline">{t('roster.stats')}</span>
          </Link>
          <button
            onClick={() => setShowAddForm(true)}
            className="hallmark-btn flex items-center gap-2 bg-secondary text-white shrink-0 py-2 px-4 sm:px-6 text-sm sm:text-base"
          >
            <Plus size={18} /> <span className="hidden sm:inline">{t('roster.add_player')}</span>
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
          <div className="grid grid-cols-1 @sm:grid-cols-3 gap-4 items-end">
            <div className="@sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1 truncate" title={t('roster.player_name_label')}>{t('roster.player_name_label')}</label>
              <input
                type="text"
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-lg text-primary"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                placeholder={t('roster.player_name_placeholder')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1 truncate" title={t('roster.jersey_number_label')}>{t('roster.jersey_number_label')}</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium text-lg"
                value={newNumber}
                onChange={e => setNewNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder={t('roster.jersey_number_placeholder')}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('roster.phone_label', 'Số điện thoại')}</label>
              <input
                type="tel"
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium text-lg"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder={t('roster.phone_placeholder', 'Ví dụ: 0912 345 678...')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('roster.note_label', 'Ghi chú')}</label>
              <input
                type="text"
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium text-lg"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
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
              <input type="checkbox" className="sr-only" checked={newIsBorrowed} onChange={(e) => setNewIsBorrowed(e.target.checked)} />
              <span className="font-bold text-text-main font-display">{t('roster.borrowed_label')}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none group mt-3">
              <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                newIsYouth ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-surface border-border-main group-hover:border-emerald-500/50'
              }`}>
                {newIsYouth && <Check size={14} strokeWidth={3} />}
              </div>
              <input type="checkbox" className="sr-only" checked={newIsYouth} onChange={(e) => setNewIsYouth(e.target.checked)} />
              <span className="font-bold text-text-main font-display">{t('roster.youth_label', 'Cầu thủ đội trẻ lên')}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none group mt-3">
              <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                newIsPerMatch ? 'bg-amber-600 border-amber-600 text-white' : 'bg-surface border-border-main group-hover:border-amber-600/50'
              }`}>
                {newIsPerMatch && <Check size={14} strokeWidth={3} />}
              </div>
              <input type="checkbox" className="sr-only" checked={newIsPerMatch} onChange={(e) => setNewIsPerMatch(e.target.checked)} />
              <span className="font-bold text-text-main font-display">{t('roster.per_match_label', 'ĐÁ THEO SỐ TRẬN')}</span>
            </label>

            {newIsPerMatch && (
              <div className="mt-3 p-3.5 bg-surface-2 border-2 border-border-main flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-text-muted">{t('roster.match_quota_label', 'SỐ TRẬN ĐĂNG KÝ')}</span>
                  <div className="flex items-center border-2 border-border-main bg-surface shadow-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseInt(newMatchQuota) || 1;
                        if (val > 1) setNewMatchQuota((val - 1).toString());
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-surface hover:bg-surface-2 border-r-2 border-border-main text-text-main active:bg-accent/40 transition-colors font-bold text-lg select-none"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      className="w-14 h-10 text-center font-display font-bold text-lg bg-surface text-primary outline-none focus:bg-surface-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={newMatchQuota}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || parseInt(val) >= 1) setNewMatchQuota(val);
                      }}
                      onBlur={() => {
                        if (!newMatchQuota || parseInt(newMatchQuota) < 1) setNewMatchQuota('1');
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseInt(newMatchQuota) || 0;
                        setNewMatchQuota((val + 1).toString());
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-surface hover:bg-surface-2 border-l-2 border-border-main text-text-main active:bg-accent/40 transition-colors font-bold text-lg select-none"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-text-muted italic">
                  * {t('roster.match_quota_hint', 'Hệ thống sẽ tự động đếm số trận cầu thủ tham gia.')}
                </div>
              </div>
            )}
          </div>
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-border-main hover:bg-surface transition-colors active:scale-95 text-base font-bold"
            >
              {t('roster.cancel', 'HỦY')}
            </button>
            <button
              type="submit"
              className="flex-1 bg-secondary text-white font-display uppercase tracking-wider py-3 border-2 border-secondary hover:bg-[#d05c21] transition-colors active:scale-95 text-base font-bold"
            >
              {t('roster.save', 'LƯU CẦU THỦ')}
            </button>
          </div>
        </form>
      </BottomSheet>

      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            className="w-full border-2 border-border-main bg-surface pl-10 pr-10 py-2.5 rounded-none focus:border-secondary outline-none font-medium text-sm text-text-main placeholder:text-text-muted/60 transition-colors"
            placeholder={t('roster.search_placeholder', 'Tìm kiếm cầu thủ...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <button type="button" onClick={() => setFilter('all')} className={`px-3.5 py-2 text-xs font-display uppercase tracking-wider font-bold border-2 transition-all shrink-0 ${filter === 'all' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface text-text-muted border-border-main hover:border-primary/50'}`}>
            {t('roster.filter_all', 'Tất cả')} ({players.filter(p => !isPlayerHidden(p, matches)).length})
          </button>
          <button type="button" onClick={() => setFilter('injured')} className={`px-3.5 py-2 text-xs font-display uppercase tracking-wider font-bold border-2 transition-all shrink-0 ${filter === 'injured' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-surface text-text-muted border-border-main hover:border-rose-500/50'}`}>
            {t('roster.filter_injured', 'Chấn thương')} ({players.filter(p => !isPlayerHidden(p, matches) && p.healthStatus && p.healthStatus.includes('Chấn thương')).length})
          </button>
          <button type="button" onClick={() => setFilter('recovering')} className={`px-3.5 py-2 text-xs font-display uppercase tracking-wider font-bold border-2 transition-all shrink-0 ${filter === 'recovering' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-surface text-text-muted border-border-main hover:border-blue-500/50'}`}>
            {t('roster.filter_recovering', 'Phục hồi')} ({players.filter(p => !isPlayerHidden(p, matches) && p.healthStatus === 'Đang hồi phục').length})
          </button>
          <button type="button" onClick={() => setFilter('borrowed')} className={`px-3.5 py-2 text-xs font-display uppercase tracking-wider font-bold border-2 transition-all shrink-0 ${filter === 'borrowed' ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-surface text-text-muted border-border-main hover:border-purple-500/50'}`}>
            {t('roster.filter_borrowed', 'Mượn')} ({players.filter(p => !isPlayerHidden(p, matches) && p.isBorrowed).length})
          </button>
          <button type="button" onClick={() => setFilter('youth')} className={`px-3.5 py-2 text-xs font-display uppercase tracking-wider font-bold border-2 transition-all shrink-0 ${filter === 'youth' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-surface text-text-muted border-border-main hover:border-emerald-500/50'}`}>
            {t('roster.filter_youth', 'Đội trẻ')} ({players.filter(p => !isPlayerHidden(p, matches) && p.isYouth).length})
          </button>
          <button type="button" onClick={() => setFilter('per_match')} className={`px-3.5 py-2 text-xs font-display uppercase tracking-wider font-bold border-2 transition-all shrink-0 ${filter === 'per_match' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-surface text-text-muted border-border-main hover:border-amber-500/50'}`}>
            {t('roster.filter_per_match', 'Theo trận')} ({players.filter(p => !isPlayerHidden(p, matches) && p.isPerMatch).length})
          </button>
          <button type="button" onClick={() => setFilter('hidden')} className={`px-3.5 py-2 text-xs font-display uppercase tracking-wider font-bold border-2 transition-all shrink-0 ${filter === 'hidden' ? 'bg-slate-700 text-white border-slate-700 shadow-sm' : 'bg-surface text-text-muted border-border-main hover:border-slate-500/50'}`}>
            {t('roster.filter_hidden', 'Ẩn')} ({players.filter(p => isPlayerHidden(p, matches)).length})
          </button>
        </div>
      </div>

      {filteredPlayers.length === 0 ? (
        <div className="bg-surface border-2 border-border-main p-8 text-center my-4">
          <p className="text-text-muted font-bold text-sm uppercase tracking-wider">
            {t('roster.no_filtered_players', 'Không tìm thấy cầu thủ phù hợp')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 items-stretch">
          {filteredPlayers.map(player => {
            const isHidden = isPlayerHidden(player, matches);
            const perMatchStatus = player.isPerMatch ? getPlayerPerMatchStatus(player, matches) : null;

            return (
              <Link key={player.id} to={`/roster/${player.id}`} className="flex flex-col group h-full">
                <div className={`hallmark-card p-0 relative overflow-hidden bg-surface hover:border-secondary transition-colors flex-1 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] ${isHidden ? 'opacity-85 border-dashed border-border-main' : ''}`}>
                  <div className="absolute top-0 right-0 flex z-10 shadow-sm">
                    {isHidden && (
                      <div className="bg-slate-700 text-white font-display font-bold px-2 h-8 sm:h-9 flex items-center justify-center text-xs sm:text-sm border-l-2 border-slate-100/20" title={t('roster.hidden_tooltip')}>
                        {t('roster.hidden_badge', 'ẨN')}
                      </div>
                    )}
                    {player.healthStatus && player.healthStatus !== 'Khỏe mạnh' && (
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border-l-2 border-border-main ${player.healthStatus.includes('Chấn thương') ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'}`}>
                        {player.healthStatus.includes('Chấn thương') ? <Cross size={16} className="fill-current" /> : <Activity size={16} />}
                      </div>
                    )}
                    {player.isBorrowed && <div className="bg-purple-600 text-white font-display font-bold w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm sm:text-base border-l-2 border-slate-100/20" title={t('roster.borrowed_tooltip')}>L</div>}
                    {player.isCaptain && <div className="bg-amber-500 text-white font-display font-bold w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm sm:text-base border-l-2 border-slate-100/20" title={t('roster.captain_tooltip')}>C</div>}
                    {player.isYouth && <div className="bg-emerald-500 text-white font-display font-bold w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm sm:text-base border-l-2 border-slate-100/20" title={t('roster.youth_tooltip')}>Y</div>}
                    {player.isPerMatch && <div className="bg-amber-600 text-white font-display font-bold w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm sm:text-base border-l-2 border-slate-100/20" title={t('roster.per_match_tooltip')}>M</div>}
                  </div>

                  <div className="absolute top-0 left-0 bg-primary text-white font-display text-lg sm:text-xl min-w-9 h-9 sm:min-w-10 sm:h-10 px-1.5 flex items-center justify-center shadow-sm z-10">
                    {player.jersey_number || '-'}
                  </div>

                  <div className="p-3 pt-11 sm:p-4 sm:pt-13 flex-1 flex flex-col justify-between">
                    <div className="flex-1 flex flex-col">
                      <h3 className="font-bold text-sm sm:text-base leading-snug mb-1.5 uppercase tracking-wide group-hover:text-secondary transition-colors line-clamp-2">
                        {player.name}
                      </h3>
                      {perMatchStatus && (
                        <div className="mt-0.5 mb-1.5">
                          <span className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold font-display uppercase tracking-wider px-1.5 py-0.5 border ${
                            perMatchStatus.isCompleted 
                              ? 'bg-surface-2 text-text-muted border-border-main' 
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}>
                            <Calendar size={10} className={perMatchStatus.isCompleted ? 'text-text-muted' : 'text-secondary'} />
                            <span>{perMatchStatus.attended}/{perMatchStatus.quota} {t('roster.match_unit', 'Trận')}</span>
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1 flex-wrap mt-auto pt-2 min-h-[26px] items-center">
                      {player.positions.map(pos => (
                        <span key={pos} className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-accent/40 text-primary px-1.5 py-0.5 font-display">
                          {t(`position.${pos}`)}
                        </span>
                      ))}
                      {player.positions.length === 0 && (
                        <span className="text-[9px] sm:text-[10px] text-slate-400 italic">
                          {t('roster.no_position')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
