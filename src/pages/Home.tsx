import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useMatchStore } from '../store/useMatchStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { 
  Users, 
  ArrowRight, 
  Trophy, 
  Calendar, 
  MapPin, 
  Clock, 
  Zap, 
  PlusCircle, 
  ShieldCheck, 
  Activity,
  Award
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HomeSkeleton } from '../components/ui/HomeSkeleton';
import { compareVietnameseNames } from '../utils/sortUtils';
import { getCurrentSeasonRange, isMatchInSeason } from '../utils/seasonUtils';

export default function Home() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Artificial delay to show the Skeleton loading state (simulate native app DB parse)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const { players } = usePlayerStore();
  const { matches } = useMatchStore();
  const { settings } = useSettingsStore();

  const activeOrUpcomingMatch = useMemo(() => {
    return matches.find(m => m.status === 'live') || matches.find(m => m.status === 'upcoming');
  }, [matches]);

  const seasonRange = useMemo(() => getCurrentSeasonRange(settings), [settings.seasonStartDate, settings.seasonEndDate]);
  const hasSeasonConfig = !!seasonRange?.hasSeasonConfig;

  // Calculate top scorers from finished matches within the configured season
  const finishedMatches = useMemo(() => {
    return matches.filter(m => {
      if (m.status !== 'finished') return false;
      if (!hasSeasonConfig) return true;
      return isMatchInSeason(m.date, seasonRange);
    }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [matches, hasSeasonConfig, seasonRange]);

  const goalCounts: Record<string, number> = {};
  
  finishedMatches.forEach(m => {
    const shouldTrackStats = m.matchType !== 'internal' || !!m.trackStats;
    if (shouldTrackStats) {
      m.stats?.forEach(s => {
        if (s.goals > 0) {
          goalCounts[s.playerId] = (goalCounts[s.playerId] || 0) + s.goals;
        }
      });
    }
  });

  const topScorers = useMemo(() => {
    return players
      .map(p => ({ ...p, goals: goalCounts[p.id] || 0 }))
      .sort((a, b) => {
        const diff = b.goals - a.goals;
        if (diff !== 0) return diff;
        return compareVietnameseNames(a.name, b.name);
      })
      .slice(0, 3);
  }, [players, goalCounts]);

  const maxGoals = topScorers.length > 0 && topScorers[0].goals > 0 ? topScorers[0].goals : 1;

  // Recent match form (Last 5 finished matches)
  const recentForm = useMemo(() => {
    return finishedMatches.slice(0, 5).map(m => {
      if (m.matchType === 'internal') {
        return { id: m.id, type: 'internal', label: 'NB', result: 'D' as const, note: 'Nội bộ' };
      }
      const scoreUs = m.scoreUs ?? 0;
      const scoreOpp = m.scoreOpponent ?? 0;
      if (scoreUs > scoreOpp) return { id: m.id, type: 'friendly', label: 'W', result: 'W' as const, note: `${scoreUs}-${scoreOpp}` };
      if (scoreUs < scoreOpp) return { id: m.id, type: 'friendly', label: 'L', result: 'L' as const, note: `${scoreUs}-${scoreOpp}` };
      return { id: m.id, type: 'friendly', label: 'D', result: 'D' as const, note: `${scoreUs}-${scoreOpp}` };
    });
  }, [finishedMatches]);

  // Position breakdown
  const positionStats = useMemo(() => {
    const counts = { GK: 0, Fixo: 0, Ala: 0, Pivô: 0 };
    players.forEach(p => {
      p.positions?.forEach(pos => {
        if (pos in counts) counts[pos as keyof typeof counts]++;
      });
    });
    return counts;
  }, [players]);

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 flex flex-col max-w-7xl 2xl:max-w-[1520px] mx-auto w-full gap-4 sm:gap-6 animate-fade-in-up">
      
      {/* ⚽ Athletic Hero Header */}
      <header className="relative overflow-hidden hallmark-card bg-surface border-2 border-border-main p-4 sm:p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div>
            {/* Main Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold text-primary leading-none uppercase tracking-tighter">
              {t('home.title')}<br/>
              <span className="text-secondary tracking-tight">{settings.teamName || 'KAT FC'}</span>
            </h1>
          </div>

          {/* Quick Hub Key Metrics (Responsive: Grid on Mobile, Flex on Desktop) */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6 border-t md:border-t-0 md:border-l-2 border-border-main pt-3 md:pt-0 md:pl-6 mt-1 md:mt-0">
            <div className="flex flex-col">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-text-muted font-bold leading-normal pt-0.5">{t('home.roster_title')}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-primary">{players.length}</span>
                <span className="text-[11px] sm:text-xs text-text-muted font-medium">cầu thủ</span>
              </div>
            </div>

            <div className="w-[1px] h-8 bg-border-main hidden sm:block" />

            <div className="flex flex-col">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-text-muted font-bold leading-normal pt-0.5">Đã đấu</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-secondary">{finishedMatches.length}</span>
                <span className="text-[11px] sm:text-xs text-text-muted font-medium">trận</span>
              </div>
            </div>

            <div className="w-[1px] h-8 bg-border-main hidden sm:block" />

            <div className="flex flex-col">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-text-muted font-bold leading-normal pt-0.5">Bàn thắng</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-text-main">
                  {Object.values(goalCounts).reduce((a, b) => a + b, 0)}
                </span>
                <span className="text-[11px] sm:text-xs text-text-muted font-medium">bàn</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 🏟️ Bento Grid: 3-column Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* 1️⃣ Matchday Hero Card (Spans 2 columns on tablet & desktop) */}
        <div className="hallmark-card p-4 sm:p-6 md:col-span-2 flex flex-col justify-between relative overflow-hidden bg-surface">
          {/* Subtle Match Poster Background Accent */}
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-secondary/5 rounded-bl-full pointer-events-none" />

          {activeOrUpcomingMatch ? (
            <>
              <div>
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div className="flex items-center gap-2">
                    {activeOrUpcomingMatch.status === 'live' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500 text-white font-display text-[11px] sm:text-xs uppercase tracking-widest font-bold shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        {t('home.match_live')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 font-display text-[11px] sm:text-xs uppercase tracking-widest font-bold">
                        <Calendar size={12} />
                        {(() => {
                          const today = new Date().toISOString().split('T')[0];
                          if (activeOrUpcomingMatch.date > today) return t('home.match_upcoming');
                          if (activeOrUpcomingMatch.date === today) return t('home.match_today');
                          return t('home.match_overdue');
                        })()}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs sm:text-sm font-display tracking-widest text-text-muted flex items-center gap-1">
                    <Calendar size={13} className="text-secondary" />
                    <span>{activeOrUpcomingMatch.date?.split('-').reverse().join('/')}</span>
                  </div>
                </div>

                {/* Opponent & Match Title */}
                <div className="my-1 sm:my-2">
                  <div className="text-[11px] sm:text-xs uppercase tracking-wider text-text-muted font-bold mb-1">
                    {activeOrUpcomingMatch.matchType === 'internal' ? 'Đấu Tập Nội Bộ' : 'Trận Đấu Giao Hữu'}
                  </div>
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-display uppercase leading-tight sm:leading-none text-primary break-words">
                    {activeOrUpcomingMatch.matchType === 'internal' 
                      ? t('home.internal_match') 
                      : `VS ${activeOrUpcomingMatch.opponent || 'ĐỐI THỦ'}`}
                  </h2>
                </div>

                {/* Match Details: Time & Venue */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 sm:gap-x-6 text-xs sm:text-sm text-text-muted font-medium mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border-main">
                  <div className="flex items-center gap-1.5 text-text-main font-semibold">
                    <Clock size={15} className="text-secondary" />
                    <span>{activeOrUpcomingMatch.time || 'Chưa định giờ'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={15} className="text-primary" />
                    <span className="truncate max-w-[200px] sm:max-w-xs">{activeOrUpcomingMatch.location || t('home.no_location')}</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border-main flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-[11px] sm:text-xs text-text-muted hidden sm:inline-block">
                  Xem bảng đội hình & ghi nhận tỷ số trực tiếp
                </span>
                <Link 
                  to={`/matchday?id=${activeOrUpcomingMatch.id}`} 
                  className="hallmark-btn flex items-center justify-center gap-2 w-full sm:w-auto text-center py-2.5 sm:py-2 text-sm sm:text-base font-bold"
                >
                  <span>{t('home.go_to_match')}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-6 sm:py-8 px-2 sm:px-4 h-full my-auto">
              <h2 className="font-display text-xl sm:text-2xl uppercase tracking-widest text-primary mb-2">
                {t('home.no_match_title')}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-text-muted mb-6 max-w-md">
                {t('home.no_match_desc')}
              </p>
              <Link to="/matchday" className="hallmark-btn flex items-center justify-center w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-2 px-6">
                <span>{t('home.create_match')}</span>
              </Link>
            </div>
          )}
        </div>

        {/* 2️⃣ Squad Pulse / Roster Breakdown Card (Column 3 on desktop) */}
        <div className="hallmark-card p-4 sm:p-6 flex flex-col justify-between bg-surface">
          <div>
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="font-display text-lg sm:text-xl uppercase tracking-widest text-primary">
                {t('home.roster_title')}
              </h2>
            </div>

            <div className="flex items-baseline gap-2 mb-3 sm:mb-4">
              <div className="text-4xl sm:text-5xl font-display font-bold text-primary">{players.length}</div>
              <div className="text-xs sm:text-sm text-text-muted font-medium uppercase tracking-wider">{t('home.players_ready')}</div>
            </div>

            {/* Position Badges Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-border-main text-xs">
              <div className="p-2 sm:p-2.5 bg-accent/30 flex justify-between items-center">
                <span className="font-bold text-text-muted text-xs sm:text-sm font-display tracking-wider">GK</span>
                <span className="font-display font-bold text-primary text-sm sm:text-base">{positionStats.GK}</span>
              </div>
              <div className="p-2 sm:p-2.5 bg-accent/30 flex justify-between items-center">
                <span className="font-bold text-text-muted text-xs sm:text-sm font-display tracking-wider">Fixo</span>
                <span className="font-display font-bold text-primary text-sm sm:text-base">{positionStats.Fixo}</span>
              </div>
              <div className="p-2 sm:p-2.5 bg-accent/30 flex justify-between items-center">
                <span className="font-bold text-text-muted text-xs sm:text-sm font-display tracking-wider">Ala</span>
                <span className="font-display font-bold text-primary text-sm sm:text-base">{positionStats.Ala}</span>
              </div>
              <div className="p-2 sm:p-2.5 bg-accent/30 flex justify-between items-center">
                <span className="font-bold text-text-muted text-xs sm:text-sm font-display tracking-wider">Pivô</span>
                <span className="font-display font-bold text-primary text-sm sm:text-base">{positionStats.Pivô}</span>
              </div>
            </div>
          </div>

          <Link to="/roster" className="mt-4 sm:mt-6 pt-3 border-t border-border-main flex items-center justify-between text-secondary font-bold font-display uppercase tracking-widest text-xs sm:text-sm group hover:text-primary transition-colors">
            <span>{t('home.manage_team')}</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 3️⃣ Quick Interactive Tactics Board */}
        <div className="hallmark-card p-4 sm:p-6 flex flex-col justify-between bg-surface">
          <div>
            <div className="flex justify-between items-center mb-2.5 sm:mb-3">
              <h2 className="font-display text-lg sm:text-xl uppercase tracking-widest text-primary">{t('home.tactics_title')}</h2>
            </div>
            <p className="text-[11px] sm:text-xs text-text-muted font-medium mb-2.5 sm:mb-3">
              {t('home.tactics_desc', 'Tạo sơ đồ đội hình, phối hợp và di chuyển chiến thuật.')}
            </p>
          </div>
          
          <Link to="/tactics" className="relative flex-1 bg-emerald-900/15 dark:bg-emerald-950/40 border-2 border-emerald-800/30 rounded-none overflow-hidden min-h-[150px] sm:min-h-[170px] hover:border-secondary transition-colors group cursor-pointer block">
            {/* Field Turf Grass Stripes Effect */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.15)_50%)] bg-[length:40px_100%]" />

            {/* Field Pitch Lines */}
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-700/40 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-12 sm:w-14 h-12 sm:h-14 rounded-full border-2 border-emerald-700/40 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-emerald-700/40" />
            </div>
            <div className="absolute top-0 left-[22%] right-[22%] h-6 sm:h-7 border-b-2 border-x-2 border-emerald-700/40"></div>
            <div className="absolute bottom-0 left-[22%] right-[22%] h-6 sm:h-7 border-t-2 border-x-2 border-emerald-700/40"></div>
            
            {/* Home Team (Orange Dots) - 1-2-1 Formation */}
            <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2">
              <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 bg-secondary rounded-full shadow-md border-2 border-white/60 animate-drift-1" />
            </div>
            <div className="absolute bottom-[38%] left-[25%] -translate-x-1/2">
              <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 bg-secondary rounded-full shadow-md border-2 border-white/60 animate-drift-2" />
            </div>
            <div className="absolute bottom-[38%] right-[25%] translate-x-1/2">
              <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 bg-secondary rounded-full shadow-md border-2 border-white/60 animate-drift-3" />
            </div>
            <div className="absolute top-[38%] left-1/2 -translate-x-1/2">
              <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 bg-secondary rounded-full shadow-md border-2 border-white/60 animate-drift-1" />
            </div>

            {/* Away Team (Olive/Dark Dots) - 2-2-1 Formation */}
            <div className="absolute top-[10%] left-[35%] -translate-x-1/2">
              <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-primary rounded-full shadow-sm border border-white/40 animate-drift-3" />
            </div>
            <div className="absolute top-[10%] right-[35%] translate-x-1/2">
              <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-primary rounded-full shadow-sm border border-white/40 animate-drift-1" />
            </div>
            <div className="absolute top-[30%] left-[20%] -translate-x-1/2">
              <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-primary rounded-full shadow-sm border border-white/40 animate-drift-2" />
            </div>
            <div className="absolute top-[30%] right-[20%] translate-x-1/2">
              <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-primary rounded-full shadow-sm border border-white/40 animate-drift-1" />
            </div>

            {/* Touch & Hover Action Overlay */}
            <div className="absolute inset-0 bg-surface/50 backdrop-blur-[1px] sm:opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
              <span className="hallmark-btn text-xs py-1.5 px-4 shadow-lg">
                <span>{t('home.open_tactics')}</span>
              </span>
            </div>
          </Link>
        </div>

        {/* 4️⃣ Golden Boot Leaderboard Card */}
        <div className="hallmark-card p-4 sm:p-6 flex flex-col justify-between bg-surface">
          <div>
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="font-display text-lg sm:text-xl uppercase tracking-widest text-primary">
                {t('home.top_scorers')}
              </h2>
              <Link to="/stats" className="text-[11px] sm:text-xs text-text-muted hover:text-secondary uppercase font-bold tracking-widest transition-colors">
                {t('home.see_all')} &rarr;
              </Link>
            </div>

            {topScorers.length > 0 && topScorers[0].goals > 0 ? (
              <div className="space-y-3">
                {topScorers.map((p, i) => {
                  const percentage = Math.round((p.goals / maxGoals) * 100);
                  return (
                    <div key={p.id} className="flex flex-col gap-1 pb-2 border-b border-border-main last:border-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`font-display font-bold text-lg w-4 ${i === 0 ? 'text-secondary' : 'text-text-muted'}`}>
                            {i + 1}
                          </span>
                          <span className="font-semibold uppercase text-text-main text-xs sm:text-sm truncate max-w-[130px] sm:max-w-[150px]">
                            {p.name}
                          </span>
                        </div>
                        <span className="font-display font-bold text-base sm:text-lg text-primary">
                          {p.goals} <span className="text-xs text-text-muted font-normal">{t('home.goals')}</span>
                        </span>
                      </div>
                      
                      {/* Visual Goal Meter */}
                      <div className="w-full bg-accent/40 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${i === 0 ? 'bg-secondary' : 'bg-primary/70'}`}
                          style={{ width: `${Math.max(percentage, 15)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-text-muted text-xs">
                Chưa có dữ liệu bàn thắng mùa này. Hãy ghi nhận bàn thắng trong chi tiết trận đấu!
              </div>
            )}
          </div>

          <Link to="/stats" className="mt-3 sm:mt-4 pt-3 border-t border-border-main flex items-center justify-between text-secondary font-bold font-display uppercase tracking-widest text-xs group hover:text-primary transition-colors">
            <span>Xem bảng xếp hạng đầy đủ</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 5️⃣ Team Form & Quick Hub Panel (Column 3) */}
        <div className="hallmark-card p-4 sm:p-6 flex flex-col justify-between bg-surface">
          <div>
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="font-display text-lg sm:text-xl uppercase tracking-widest text-primary">
                Phong Độ Gần Đây
              </h2>
            </div>

            {recentForm.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  {recentForm.map((f, idx) => (
                    <div 
                      key={f.id || idx}
                      title={`Trận ${f.note}`}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded flex flex-col items-center justify-center font-display font-bold text-xs text-white shadow-sm ${
                        f.result === 'W' ? 'bg-emerald-600' :
                        f.result === 'L' ? 'bg-rose-600' : 'bg-amber-600'
                      }`}
                    >
                      <span>{f.label}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] sm:text-xs text-text-muted font-medium">
                  {recentForm.filter(f => f.result === 'W').length} Thắng - {recentForm.filter(f => f.result === 'D').length} Hòa - {recentForm.filter(f => f.result === 'L').length} Thua
                </div>
              </div>
            ) : (
              <div className="py-3 text-xs text-text-muted">
                Chưa có dữ liệu phong độ trận đấu.
              </div>
            )}

            {/* Quick Action Shortcuts (Clean Typography Buttons) */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border-main">
              <div className="text-[11px] sm:text-xs uppercase tracking-wider text-text-muted font-bold mb-2">Thao tác nhanh</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link to="/matchday" className="p-2 sm:p-2.5 bg-accent/30 hover:bg-surface-2 hover:border-secondary border border-transparent active:scale-95 transition-all font-display font-bold uppercase tracking-wider text-text-main text-center">
                  Lịch thi đấu
                </Link>
                <Link to="/tactics" className="p-2 sm:p-2.5 bg-accent/30 hover:bg-surface-2 hover:border-secondary border border-transparent active:scale-95 transition-all font-display font-bold uppercase tracking-wider text-text-main text-center">
                  Vẽ sa bàn
                </Link>
                <Link to="/roster" className="p-2 sm:p-2.5 bg-accent/30 hover:bg-surface-2 hover:border-secondary border border-transparent active:scale-95 transition-all font-display font-bold uppercase tracking-wider text-text-main text-center">
                  Điểm danh
                </Link>
                <Link to="/stats" className="p-2 sm:p-2.5 bg-accent/30 hover:bg-surface-2 hover:border-secondary border border-transparent active:scale-95 transition-all font-display font-bold uppercase tracking-wider text-text-main text-center">
                  Thống kê
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

