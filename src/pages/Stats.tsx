import { useState, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useMatchStore } from '../store/useMatchStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { ArrowLeft, Calendar, Trophy, Flame, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatsSkeleton } from '../components/ui/StatsSkeleton';
import { useTranslation } from 'react-i18next';
import { compareVietnameseNames } from '../utils/sortUtils';

export default function Stats() {
  const { t } = useTranslation();
  const { players, fetchPlayers } = usePlayerStore();
  const { matches } = useMatchStore();
  const { settings } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<'goals' | 'assists' | 'attendance'>('goals');
  const [filterMode, setFilterMode] = useState<'all_time' | 'current_season'>('current_season');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
    
    // Simulate loading transition
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [fetchPlayers]);

  // Aggregate stats from matches
  const playerStatsAgg: Record<string, { goals: number; assists: number; attendance: number }> = {};

  players.forEach(p => {
    playerStatsAgg[p.id] = { goals: 0, assists: 0, attendance: 0 };
  });

  const seasonStart = settings.seasonStartDate ? new Date(settings.seasonStartDate) : null;
  const seasonEnd = settings.seasonEndDate ? new Date(settings.seasonEndDate) : null;
  const hasSeasonConfig = !!(seasonStart && seasonEnd);

  const filteredMatches = matches.filter(m => {
    if (filterMode === 'all_time' || !hasSeasonConfig) return true;
    if (!m.date) return true;
    const matchDate = new Date(m.date);
    return matchDate >= seasonStart! && matchDate <= seasonEnd!;
  });

  const getSeasonString = () => {
    if (filterMode === 'current_season' && hasSeasonConfig) {
      const y1 = seasonStart!.getFullYear();
      const y2 = seasonEnd!.getFullYear();
      return t('stats.season', { year: y1 === y2 ? y1 : `${y1}/${y2}` });
    }
    return t('stats.aggregated_data', { count: filteredMatches.length });
  };

  filteredMatches.forEach(m => {
    // Attendance count across all matches
    if (m.attendance) {
      Object.entries(m.attendance).forEach(([playerId, status]) => {
        if (status === 'present' && playerStatsAgg[playerId]) {
          playerStatsAgg[playerId].attendance += 1;
        }
      });
    }

    // Goals & Assists from match stats
    if (m.matchType !== 'internal' && m.stats) {
      m.stats.forEach(s => {
        if (playerStatsAgg[s.playerId]) {
          playerStatsAgg[s.playerId].goals += s.goals || 0;
          playerStatsAgg[s.playerId].assists += s.assists || 0;
        }
      });
    }
  });

  const playersWithStats = players.map(p => ({
    ...p,
    goals: playerStatsAgg[p.id]?.goals || 0,
    assists: playerStatsAgg[p.id]?.assists || 0,
    attendance: playerStatsAgg[p.id]?.attendance || 0,
  }));

  const getSortedPlayers = () => {
    return [...playersWithStats].sort((a, b) => {
      // 1. Primary tab stat
      if (b[activeTab] !== a[activeTab]) {
        return b[activeTab] - a[activeTab];
      }

      // 2. Secondary stats tie-breakers
      if (activeTab === 'goals') {
        if (b.assists !== a.assists) return b.assists - a.assists;
        if (b.attendance !== a.attendance) return b.attendance - a.attendance;
      } else if (activeTab === 'assists') {
        if (b.goals !== a.goals) return b.goals - a.goals;
        if (b.attendance !== a.attendance) return b.attendance - a.attendance;
      } else if (activeTab === 'attendance') {
        if (b.goals !== a.goals) return b.goals - a.goals;
        if (b.assists !== a.assists) return b.assists - a.assists;
      }

      // 3. Fallback: Vietnamese name sorting by Given Name (Tên)
      return compareVietnameseNames(a.name, b.name);
    });
  };

  if (isLoading) {
    return <StatsSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 flex flex-col min-h-full max-w-5xl mx-auto w-full pb-8">
      <Link to="/roster" className="flex items-center gap-2 font-bold text-text-muted hover:text-primary mb-6 transition-colors">
        <ArrowLeft size={20} /> {t('stats.back_to_roster')}
      </Link>
      
      <div className="flex flex-col @lg:flex-row @lg:justify-between @lg:items-end gap-4 mb-6">
        <div>
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <h1 className="text-4xl @sm:text-5xl font-display uppercase text-primary leading-none">{t('stats.title')}</h1>
            
            {hasSeasonConfig && (
              <select 
                value={filterMode} 
                onChange={(e) => setFilterMode(e.target.value as 'all_time' | 'current_season')}
                className="bg-surface border-2 border-border-main text-xs font-bold uppercase tracking-widest text-text-main py-1 px-2 outline-none focus:border-primary cursor-pointer"
              >
                <option value="current_season">{t('stats.filter_season', 'MÙA GIẢI HIỆN TẠI')}</option>
                <option value="all_time">{t('stats.filter_all', 'TẤT CẢ THỜI GIAN')}</option>
              </select>
            )}
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
            {getSeasonString()}
          </p>
        </div>
        <Link to="/matchday" className="hallmark-btn flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold bg-primary text-white shrink-0">
          <Calendar size={18} /> {t('stats.manage_match')}
        </Link>
      </div>

      <div className="flex border-b-2 border-border-main mb-6 overflow-x-auto hide-scrollbar shrink-0 pb-1">
        <button 
          onClick={() => setActiveTab('goals')}
          className={`shrink-0 flex items-center px-4 py-3 text-lg font-display uppercase tracking-widest transition-colors border-b-4 -mb-[2px] ${activeTab === 'goals' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
        >
          {t('stats.goals')}
        </button>
        <button 
          onClick={() => setActiveTab('assists')}
          className={`shrink-0 flex items-center px-4 py-3 text-lg font-display uppercase tracking-widest transition-colors border-b-4 -mb-[2px] ${activeTab === 'assists' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
        >
          {t('stats.assists')}
        </button>
        <button 
          onClick={() => setActiveTab('attendance')}
          className={`shrink-0 flex items-center px-4 py-3 text-lg font-display uppercase tracking-widest transition-colors border-b-4 -mb-[2px] ${activeTab === 'attendance' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
        >
          {t('stats.attendance')}
        </button>
      </div>

      <div className="pb-4">
        <div className="hallmark-card p-0 overflow-hidden max-w-3xl mx-auto">
          {getSortedPlayers().length === 0 ? (
            <div className="p-8 text-center text-text-muted font-medium">{t('stats.no_data')}</div>
          ) : (
            getSortedPlayers().map((player, index) => (
              <div key={player.id} className={`flex items-center p-4 ${index !== getSortedPlayers().length - 1 ? 'border-b-2 border-primary/10' : ''} ${index === 0 ? 'bg-secondary/10' : index < 3 ? 'bg-primary/5' : 'bg-surface'}`}>
                <div className={`w-8 h-8 flex items-center justify-center font-display text-xl mr-4 font-bold ${index === 0 ? 'text-secondary' : 'text-text-muted'}`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${index === 0 ? 'text-primary' : 'text-text-main'}`}>{player.name}</h3>
                  <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                    {player.positions.map(p => t(`position.${p}`)).join(', ') || t('stats.unknown_position')}
                  </div>
                </div>
                <div className="text-4xl font-display text-primary w-20 text-right">
                  {player[activeTab]}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
