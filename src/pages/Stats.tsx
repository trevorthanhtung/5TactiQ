import { useState, useEffect, useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useMatchStore } from '../store/useMatchStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { ArrowLeft, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatsSkeleton } from '../components/ui/StatsSkeleton';
import { CustomSelect } from '../components/CustomSelect';
import { useTranslation } from 'react-i18next';
import { compareVietnameseNames } from '../utils/sortUtils';

export default function Stats() {
  const { t } = useTranslation();
  const { players, fetchPlayers } = usePlayerStore();
  const { matches } = useMatchStore();
  const { settings } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<'goals' | 'assists' | 'attendance'>('goals');
  const [filterMode, setFilterMode] = useState<'all_time' | 'current_season'>('current_season');
  const [showAllZeroStats, setShowAllZeroStats] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
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
    if (m.status !== 'finished') return false;
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
    const shouldTrackStats = m.matchType !== 'internal' || !!m.trackStats;
    if (shouldTrackStats && m.stats) {
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

  const sortedPlayers = useMemo(() => {
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

      // 3. Fallback: Vietnamese name sorting
      return compareVietnameseNames(a.name, b.name);
    });
  }, [playersWithStats, activeTab]);

  // Calculations for KPI & Visual Chart
  const totalTeamGoals = playersWithStats.reduce((sum, p) => sum + p.goals, 0);
  const totalTeamAssists = playersWithStats.reduce((sum, p) => sum + p.assists, 0);
  const avgGoalsPerMatch = filteredMatches.length > 0 ? (totalTeamGoals / filteredMatches.length).toFixed(1) : '0.0';

  const maxStat = sortedPlayers.length > 0 && sortedPlayers[0][activeTab] > 0 ? sortedPlayers[0][activeTab] : 1;
  const topPerformers = sortedPlayers.filter(p => p[activeTab] > 0).slice(0, 5);

  // Split players into active contributors vs zero-stat
  const activeContributors = sortedPlayers.filter(p => p[activeTab] > 0);
  const zeroStatPlayers = sortedPlayers.filter(p => p[activeTab] === 0);

  // If no one has > 0, show top 5 anyway
  const displayedPlayers = activeContributors.length > 0 
    ? (showAllZeroStats ? sortedPlayers : activeContributors)
    : sortedPlayers.slice(0, 6);

  const getUnitLabel = () => {
    if (activeTab === 'goals') return t('roster.goal_unit', 'bàn');
    if (activeTab === 'assists') return t('roster.assist_unit', 'kiến tạo');
    return t('roster.match_unit', 'trận');
  };

  if (isLoading) {
    return <StatsSkeleton />;
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 flex flex-col min-h-full max-w-7xl 2xl:max-w-[1520px] mx-auto w-full pb-32 lg:pb-12 animate-fade-in-up">
      
      {/* 🧭 Back Navigation */}
      <div className="mb-4 sm:mb-5">
        <Link 
          to="/roster" 
          className="inline-flex items-center gap-1.5 font-display text-xs sm:text-sm uppercase tracking-wider font-bold text-text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} /> 
          <span>{t('roster.title', 'VỀ ĐỘI HÌNH')}</span>
        </Link>
      </div>
      
      {/* 🏆 Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 sm:gap-4 mb-5 sm:mb-6 pb-2 border-b-2 border-border-main">
        <div>
          <h1 className="text-3xl sm:text-5xl font-display uppercase text-primary leading-none mb-1">{t('stats.title')}</h1>
          <p className="text-[11px] sm:text-xs font-bold text-text-muted uppercase tracking-widest font-display">
            {getSeasonString()}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-2 sm:gap-3 shrink-0">
          {hasSeasonConfig && (
            <CustomSelect 
              value={filterMode} 
              onChange={(val) => setFilterMode(val as 'all_time' | 'current_season')}
              className="relative w-full md:w-auto shrink-0"
              buttonClassName="bg-surface border-2 border-border-main text-xs font-bold uppercase tracking-widest text-text-main px-3 outline-none focus:border-primary cursor-pointer w-full md:w-auto h-[38px] sm:h-[40px] flex items-center justify-between transition-colors hover:border-primary/50"
              options={[
                { value: 'current_season', label: t('stats.filter_season', 'MÙA GIẢI HIỆN TẠI') },
                { value: 'all_time', label: t('stats.filter_all', 'TẤT CẢ THỜI GIAN') }
              ]}
            />
          )}
          <Link to="/matchday" className="hallmark-btn flex items-center justify-center bg-primary text-white shrink-0 h-[38px] sm:h-[40px] px-4 sm:px-5 text-xs font-display uppercase tracking-wider font-bold">
            <span>{t('stats.manage_match', 'QUẢN LÝ TRẬN ĐẤU')}</span>
          </Link>
        </div>
      </div>

      {/* 🏷️ Navigation Tabs */}
      <div className="flex border-b-2 border-border-main mb-5 sm:mb-6 overflow-x-auto hide-scrollbar shrink-0 gap-1.5 sm:gap-2">
        <button 
          onClick={() => { setActiveTab('goals'); setShowAllZeroStats(false); }}
          className={`shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-display uppercase tracking-wider transition-all border-b-4 -mb-[2px] font-bold ${
            activeTab === 'goals' 
              ? 'border-primary text-primary bg-primary/5' 
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          {t('stats.goals', 'BÀN THẮNG')}
        </button>
        <button 
          onClick={() => { setActiveTab('assists'); setShowAllZeroStats(false); }}
          className={`shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-display uppercase tracking-wider transition-all border-b-4 -mb-[2px] font-bold ${
            activeTab === 'assists' 
              ? 'border-primary text-primary bg-primary/5' 
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          {t('stats.assists', 'KIẾN TẠO')}
        </button>
        <button 
          onClick={() => { setActiveTab('attendance'); setShowAllZeroStats(false); }}
          className={`shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-display uppercase tracking-wider transition-all border-b-4 -mb-[2px] font-bold ${
            activeTab === 'attendance' 
              ? 'border-primary text-primary bg-primary/5' 
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          {t('stats.attendance', 'SỐ TRẬN CÓ MẶT')}
        </button>
      </div>

      {/* 📐 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 👈 LEFT COLUMN: Detailed Ranking Table (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="hallmark-card p-0 overflow-hidden bg-surface border-2 border-border-main shadow-sm">
            
            {/* Table Subheader */}
            <div className="p-3 sm:p-4 bg-surface-2 border-b-2 border-border-main flex justify-between items-center text-xs font-display font-bold uppercase tracking-wider text-text-muted">
              <span>HẠNG & CẦU THỦ</span>
              <span>{activeTab === 'goals' ? 'TỔNG BÀN' : activeTab === 'assists' ? 'TỔNG KIẾN TẠO' : 'SỐ TRẬN'}</span>
            </div>

            {displayedPlayers.length === 0 ? (
              <div className="p-8 text-center text-text-muted font-medium text-sm">{t('stats.no_data', 'Chưa có dữ liệu thống kê')}</div>
            ) : (
              displayedPlayers.map((player, index) => {
                const isLeader = index === 0 && player[activeTab] > 0;
                const isPodium = index < 3 && player[activeTab] > 0;

                return (
                  <Link 
                    key={player.id} 
                    to={`/roster/${player.id}`}
                    className={`flex items-center p-3.5 sm:p-4 transition-colors hover:bg-accent/20 ${
                      index !== displayedPlayers.length - 1 ? 'border-b border-border-main/50' : ''
                    } ${isLeader ? 'bg-secondary/10' : isPodium ? 'bg-primary/5' : 'bg-surface'}`}
                  >
                    {/* Rank Number */}
                    <div className={`w-7 sm:w-8 text-center font-display text-lg sm:text-xl mr-3 sm:mr-4 font-bold ${
                      isLeader ? 'text-secondary' : isPodium ? 'text-primary' : 'text-text-muted'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-bold text-sm sm:text-base truncate uppercase tracking-wide ${
                          isLeader ? 'text-primary font-bold' : 'text-text-main'
                        }`}>
                          {player.name}
                        </h3>
                        {player.jersey_number !== null && player.jersey_number !== undefined && (
                          <span className="text-[10px] font-display font-bold px-1.5 py-0.2 bg-surface-2 text-text-muted border border-border-main">
                            #{player.jersey_number}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-muted mt-0.5 font-display">
                        {player.positions.map(p => t(`position.${p}`)).join(', ') || t('stats.unknown_position', 'Chưa rõ vị trí')}
                      </div>
                    </div>

                    {/* Score Value with Unit */}
                    <div className="text-right shrink-0">
                      <span className={`text-2xl sm:text-3xl font-display font-bold leading-none ${
                        isLeader ? 'text-secondary' : 'text-primary'
                      }`}>
                        {player[activeTab]}
                      </span>
                      <span className="text-[11px] sm:text-xs text-text-muted font-bold font-display uppercase ml-1.5">
                        {getUnitLabel()}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}

            {/* Collapsible toggle for zero-stat players */}
            {activeContributors.length > 0 && zeroStatPlayers.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllZeroStats(!showAllZeroStats)}
                className="w-full p-3 bg-surface-2 hover:bg-surface border-t-2 border-border-main text-xs font-display font-bold uppercase tracking-wider text-text-muted hover:text-text-main transition-colors flex items-center justify-center gap-1.5"
              >
                {showAllZeroStats ? (
                  <>
                    <ChevronUp size={15} />
                    <span>Thu gọn danh sách (Ẩn {zeroStatPlayers.length} cầu thủ 0 {getUnitLabel()})</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={15} />
                    <span>Xem thêm {zeroStatPlayers.length} cầu thủ chưa có {getUnitLabel()} (0)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 👉 RIGHT COLUMN: Visual Analytics Hub & Bar Chart (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6">
          
          {/* 📊 Team Summary Metrics (3-4 KPI Cards) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1 font-display">TỔNG BÀN THẮNG</div>
              <div className="text-3xl sm:text-4xl font-display text-primary font-bold">{totalTeamGoals}</div>
            </div>

            <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1 font-display">TỔNG KIẾN TẠO</div>
              <div className="text-3xl sm:text-4xl font-display text-secondary font-bold">{totalTeamAssists}</div>
            </div>

            <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1 font-display">SỐ TRẬN TỔNG</div>
              <div className="text-3xl sm:text-4xl font-display text-text-main font-bold">{filteredMatches.length}</div>
            </div>

            <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1 font-display">TB BÀN / TRẬN</div>
              <div className="text-3xl sm:text-4xl font-display text-text-main font-bold">{avgGoalsPerMatch}</div>
            </div>
          </div>

          {/* 📈 Visual Horizontal Bar Chart */}
          <div className="hallmark-card bg-surface border-2 border-border-main p-4 sm:p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-border-main">
              <h2 className="font-display text-base sm:text-lg uppercase tracking-widest text-primary font-bold">
                TOP HIỆU SUẤT TRỰC QUAN
              </h2>
              <span className="text-[11px] font-display uppercase tracking-wider text-text-muted font-bold">
                {activeTab === 'goals' ? 'GHI BÀN' : activeTab === 'assists' ? 'KIẾN TẠO' : 'RA SÂN'}
              </span>
            </div>

            {topPerformers.length === 0 ? (
              <div className="p-6 text-center text-text-muted text-xs font-medium">
                Chưa có số liệu cho hạng mục này
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 pt-1">
                {topPerformers.map((player, idx) => {
                  const percentage = Math.max(8, (player[activeTab] / maxStat) * 100);
                  const isTop1 = idx === 0;

                  return (
                    <div key={player.id} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-text-main uppercase tracking-wide truncate max-w-[200px]">
                          {idx + 1}. {player.name}
                        </span>
                        <span className="font-display font-bold text-primary text-sm">
                          {player[activeTab]} <span className="text-[10px] text-text-muted font-normal uppercase">{getUnitLabel()}</span>
                        </span>
                      </div>

                      {/* Bar Meter Container */}
                      <div className="w-full h-3 bg-surface-2 border border-border-main overflow-hidden p-0.5">
                        <div 
                          className={`h-full transition-all duration-700 ${
                            isTop1 ? 'bg-secondary' : idx === 1 ? 'bg-primary' : 'bg-primary/60'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
