import { useState, useMemo, useEffect } from 'react';
import { useMatchStore } from '../store/useMatchStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, Trophy, Flame, ChevronDown, ChevronUp, MapPin, CalendarClock, Shield, CheckCircle2, XCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HeadToHeadSkeleton } from '../components/ui/HeadToHeadSkeleton';
import { CustomSelect } from '../components/CustomSelect';
import { getCurrentSeasonRange, isMatchInSeason } from '../utils/seasonUtils';

export const normalizeOpponentName = (name: string) => {
  return name.trim().toLowerCase();
};

export default function HeadToHead() {
  const { t } = useTranslation();
  const { matches } = useMatchStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();
  const [expandedOpponent, setExpandedOpponent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all_time' | 'current_season'>('current_season');
  const [matchTypeFilter, setMatchTypeFilter] = useState<'all' | 'external' | 'internal'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const seasonRange = useMemo(() => getCurrentSeasonRange(settings), [settings.seasonStartDate, settings.seasonEndDate]);
  const hasSeasonConfig = !!seasonRange?.hasSeasonConfig;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    // 1. Filter out unfinished matches and apply season & match type filters
    const validMatches = matches.filter(m => {
      if (m.status !== 'finished') return false;
      if (matchTypeFilter === 'external' && m.matchType === 'internal') return false;
      if (matchTypeFilter === 'internal' && m.matchType !== 'internal') return false;
      
      if (filterMode === 'current_season' && hasSeasonConfig) {
        return isMatchInSeason(m.date, seasonRange);
      }
      return true;
    });

    // 2. Group by normalized opponent name
    const grouped: Record<string, any> = {};
    const originalNames: Record<string, string> = {}; // Keep first encountered name

    let totalWins = 0;
    let totalLosses = 0;

    validMatches.forEach(match => {
      const isInternal = match.matchType === 'internal';
      if (!match.opponent && !isInternal) return;

      const rawOpponent = isInternal ? t('h2h.internal_opp', 'Đá Nội Bộ') : match.opponent;
      const normalized = normalizeOpponentName(rawOpponent);

      if (!originalNames[normalized]) {
        originalNames[normalized] = rawOpponent.trim();
      }

      if (!grouped[normalized]) {
        grouped[normalized] = {
          opponentName: originalNames[normalized],
          normalizedName: normalized,
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          matches: [],
          lastMatchDate: match.date,
          isInternalGroup: isInternal
        };
      }

      const us = match.scoreUs ?? 0;
      const opp = match.scoreOpponent ?? 0;

      grouped[normalized].matchesPlayed++;
      grouped[normalized].matches.push(match);

      if (!isInternal) {
        grouped[normalized].goalsFor += us;
        grouped[normalized].goalsAgainst += opp;

        if (us > opp) {
          grouped[normalized].wins++;
          totalWins++;
        } else if (us < opp) {
          grouped[normalized].losses++;
          totalLosses++;
        } else {
          grouped[normalized].draws++;
        }
      }

      // Update last match date if this one is newer
      if (!grouped[normalized].lastMatchDate || match.date > grouped[normalized].lastMatchDate) {
        grouped[normalized].lastMatchDate = match.date;
      }
    });

    // 3. Convert to array and sort by lastMatchDate desc
    const sortedOpponents = Object.values(grouped).sort((a: any, b: any) => {
      const dateA = a.lastMatchDate || '';
      const dateB = b.lastMatchDate || '';
      return dateB.localeCompare(dateA);
    });

    // Sort matches inside each opponent by date desc
    sortedOpponents.forEach((opp: any) => {
      opp.matches.sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
      opp.goalDifference = opp.goalsFor - opp.goalsAgainst;
    });

    // Calculate total matches excluding internal for the overall stats
    const totalMatchesExcludeInternal = validMatches.filter(m => m.matchType !== 'internal').length;

    return {
      opponentsList: sortedOpponents,
      totalOpponents: sortedOpponents.length,
      totalMatches: validMatches.length,
      totalWins,
      totalLosses
    };
  }, [matches, t, filterMode, hasSeasonConfig, seasonRange]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}/${m}/${y}`;
  };

  const getResultBadge = (us: number, opp: number) => {
    if (us > opp) return <span className="w-5 h-5 rounded-sm bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">{t('h2h.badge_win', 'T')}</span>;
    if (us < opp) return <span className="w-5 h-5 rounded-sm bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold">{t('h2h.badge_loss', 'B')}</span>;
    return <span className="w-5 h-5 rounded-sm bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">{t('h2h.badge_draw', 'H')}</span>;
  };

  const getAvatar = (name: string) => {
    const chars = name.trim().substring(0, 2).toUpperCase();
    return chars || '??';
  };

  if (isLoading) {
    return <HeadToHeadSkeleton />;
  }

  return (
    <div className="p-4 flex flex-col max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-2 @sm:gap-3 mb-6 pt-2">
        <button
          onClick={() => navigate('/more')}
          className="p-2 text-primary hover:bg-primary/10 border-2 border-primary/30 hover:border-primary transition-all shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl @md:text-4xl font-display uppercase text-primary leading-none">{t('h2h.title', 'Lịch sử đối đầu')}</h1>
          {hasSeasonConfig && seasonRange && (
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
              {t('stats.season', { year: seasonRange.label })}
            </p>
          )}
        </div>
      </div>

      {stats.opponentsList.length === 0 ? (
        <div className="hallmark-card p-8 text-center bg-surface border-2 border-border-main shadow-xl mt-4">
          <Shield size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-2xl font-display text-text-muted uppercase mb-2">{t('h2h.no_data_title', 'Chưa có dữ liệu')}</h2>
          <p className="text-sm font-medium text-slate-400">
            {t('h2h.no_data_desc', 'Lịch sử sẽ tự động xuất hiện sau khi bạn hoàn thành trận đấu đầu tiên.')}
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-surface p-3.5 border-2 border-border-main text-center shadow-xs">
              <div className="text-2xl md:text-3xl font-display font-bold text-primary">{stats.totalOpponents}</div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted mt-0.5">{t('h2h.opponents', 'Đối thủ')}</div>
            </div>
            <div className="bg-surface p-3.5 border-2 border-border-main text-center shadow-xs">
              <div className="text-2xl md:text-3xl font-display font-bold text-secondary">{stats.totalMatches}</div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted mt-0.5">{t('h2h.matches_played', 'Trận đã đấu')}</div>
            </div>
            <div className="bg-surface p-3.5 border-2 border-emerald-600/30 text-center bg-emerald-50/60 dark:bg-emerald-950/20 shadow-xs">
              <div className="text-2xl md:text-3xl font-display font-bold text-emerald-600">{stats.totalWins}</div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted mt-0.5">{t('h2h.wins', 'Trận thắng')}</div>
            </div>
            <div className="bg-surface p-3.5 border-2 border-rose-600/30 text-center bg-rose-50/60 dark:bg-rose-950/20 shadow-xs">
              <div className="text-2xl md:text-3xl font-display font-bold text-rose-600">{stats.totalLosses}</div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted mt-0.5">{t('h2h.losses', 'Trận thua')}</div>
            </div>
          </div>

          <div className="hallmark-divider mb-6"></div>

          {/* Match Type Filter Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setMatchTypeFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-display font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                matchTypeFilter === 'all'
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-surface text-text-muted border-border-main hover:border-primary/50'
              }`}
            >
              {t('h2h.filter_all', 'TẤT CẢ ĐỐI THỦ')}
            </button>
            <button
              onClick={() => setMatchTypeFilter('external')}
              className={`px-3.5 py-1.5 text-xs font-display font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                matchTypeFilter === 'external'
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-surface text-text-muted border-border-main hover:border-primary/50'
              }`}
            >
              {t('h2h.filter_external', 'ĐỐI THỦ NGOÀI')}
            </button>
            <button
              onClick={() => setMatchTypeFilter('internal')}
              className={`px-3.5 py-1.5 text-xs font-display font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                matchTypeFilter === 'internal'
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-surface text-text-muted border-border-main hover:border-primary/50'
              }`}
            >
              {t('h2h.filter_internal', 'ĐÁ NỘI BỘ')}
            </button>
          </div>

          {/* Search Bar & Season Filter Row */}
          <div className="mb-6 flex flex-col @md:flex-row gap-3 items-stretch @md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-text-muted" />
              </div>
              <input
                type="text"
                placeholder={t('h2h.search_placeholder', 'Tìm tên đối thủ...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border-2 border-border-main text-text-main py-2.5 pl-10 pr-3 outline-none focus:border-primary transition-colors text-sm placeholder:text-text-muted/60 placeholder:uppercase tracking-wider h-[44px]"
              />
            </div>

            {hasSeasonConfig && (
              <CustomSelect 
                value={filterMode} 
                onChange={(val) => setFilterMode(val as 'all_time' | 'current_season')}
                className="relative w-full @md:w-auto shrink-0"
                buttonClassName="bg-surface border-2 border-border-main text-xs font-bold uppercase tracking-widest text-text-main px-3 outline-none focus:border-primary cursor-pointer w-full @md:w-auto h-[44px] flex items-center justify-between transition-colors hover:border-primary/50"
                options={[
                  { value: 'current_season', label: t('stats.filter_season', 'MÙA GIẢI HIỆN TẠI') },
                  { value: 'all_time', label: t('stats.filter_all', 'TẤT CẢ THỜI GIAN') }
                ]}
              />
            )}
          </div>

          {/* Opponents List */}
          <div className="space-y-3">
            {stats.opponentsList
              .filter((opp: any) => opp.opponentName.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((opp: any) => {
              const isExpanded = expandedOpponent === opp.normalizedName || (expandedOpponent === null && stats.opponentsList.length === 1);
              const lastMatch = opp.matches[0];
              const diffSign = opp.goalDifference > 0 ? '+' : '';

              return (
                <div key={opp.normalizedName} className="hallmark-card overflow-hidden transition-all border-2 border-border-main">
                  {/* Card Header (Click to expand) */}
                  <div
                    className="p-3.5 md:p-4 flex items-center justify-between cursor-pointer hover:bg-surface-2 transition-colors"
                    onClick={() => setExpandedOpponent(isExpanded ? '__none__' : opp.normalizedName)}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div>
                        <h3 className="font-display text-lg md:text-xl uppercase text-primary leading-tight">{opp.opponentName}</h3>
                        <p className="text-xs md:text-sm text-text-muted font-medium mt-0.5">
                          {opp.matchesPlayed} <span className="capitalize">{t('h2h.matches_unit', 'trận')}</span>
                          {!opp.isInternalGroup && (
                            <>
                              {' | '}{t('h2h.goal_diff', 'Hiệu số')}: <span className={`font-bold ${opp.goalDifference > 0 ? 'text-emerald-600' : opp.goalDifference < 0 ? 'text-rose-600' : 'text-text-muted'}`}>{diffSign}{opp.goalDifference}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Form (Last Match Result) */}
                      {lastMatch && !opp.isInternalGroup && getResultBadge(lastMatch.scoreUs ?? 0, lastMatch.scoreOpponent ?? 0)}

                      {isExpanded ? <ChevronUp className="text-text-muted" size={18} /> : <ChevronDown className="text-text-muted" size={18} />}
                    </div>
                  </div>

                  {/* Expanded Match List */}
                  {isExpanded && (
                    <div className="bg-surface-2/40 border-t-2 border-border-main p-3 md:p-4 space-y-2">
                      {opp.matches.map((match: any) => (
                        <div key={match.id} className="bg-surface border-2 border-border-main p-3 flex flex-col gap-3 shadow-xs">
                          {/* Date & Location */}
                          <div className="space-y-1 w-full">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-display uppercase tracking-widest font-bold px-1.5 py-0.5 bg-surface text-text-muted border border-border-main">
                                {match.matchType === 'friendly' ? t('h2h.friendly', 'Đối đầu') : t('h2h.internal', 'Nội bộ')}
                              </span>
                              <div className="flex items-center gap-1 text-xs text-text-muted font-bold font-mono">
                                <CalendarClock size={13} className="text-secondary" />
                                {formatDate(match.date)}
                              </div>
                            </div>
                            {match.location && (
                              <div className="flex items-center gap-1 text-xs text-text-muted">
                                <MapPin size={13} className="text-secondary shrink-0" />
                                <span className="truncate max-w-[280px]">{match.location}</span>
                              </div>
                            )}
                          </div>

                          {/* Score */}
                          <div className="w-full flex items-center justify-around bg-surface-2 px-2 md:px-4 py-2.5 border-t border-border-main">
                            {match.matchType === 'internal' ? (
                              <div className="flex w-full items-center justify-around gap-1 md:gap-2">
                                <div className="text-center shrink-0">
                                  <div className="text-[10px] md:text-xs uppercase font-bold text-text-muted mb-0.5 truncate">{t('h2h.team_a', 'Team A')}</div>
                                  <div className="text-xl md:text-3xl font-display font-bold text-text-main">{match.scoreTeamA ?? 0}</div>
                                </div>
                                <span className="text-text-muted font-bold text-lg md:text-xl shrink-0 opacity-50">-</span>
                                <div className="text-center shrink-0">
                                  <div className="text-[10px] md:text-xs uppercase font-bold text-text-muted mb-0.5 truncate">{t('h2h.team_b', 'Team B')}</div>
                                  <div className="text-xl md:text-3xl font-display font-bold text-text-main">{match.scoreTeamB ?? 0}</div>
                                </div>
                                {(match.teamCount === 3 || match.teamCount === 4) && (
                                  <>
                                    <span className="text-text-muted font-bold text-lg md:text-xl shrink-0 opacity-50">-</span>
                                    <div className="text-center shrink-0">
                                      <div className="text-[10px] md:text-xs uppercase font-bold text-text-muted mb-0.5 truncate">{t('h2h.team_c', 'Team C')}</div>
                                      <div className="text-xl md:text-3xl font-display font-bold text-text-main">{match.scoreTeamC ?? 0}</div>
                                    </div>
                                  </>
                                )}
                                {match.teamCount === 4 && (
                                  <>
                                    <span className="text-text-muted font-bold text-lg md:text-xl shrink-0 opacity-50">-</span>
                                    <div className="text-center shrink-0">
                                      <div className="text-[10px] md:text-xs uppercase font-bold text-text-muted mb-0.5 truncate">{t('h2h.team_d', 'Team D')}</div>
                                      <div className="text-xl md:text-3xl font-display font-bold text-text-main">{match.scoreTeamD ?? 0}</div>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <>
                                <div className="text-center w-20 md:w-28 shrink-0">
                                  <div className="text-[10px] md:text-xs uppercase font-bold text-text-muted mb-0.5 truncate">{(settings.teamName || '5TactiQ').toUpperCase()}</div>
                                  <div className={`text-2xl md:text-3xl font-display font-bold ${(match.scoreUs ?? 0) > (match.scoreOpponent ?? 0) ? 'text-emerald-500' : 'text-text-main'}`}>{match.scoreUs ?? 0}</div>
                                </div>
                                <span className="text-text-muted font-bold text-xl md:text-2xl shrink-0">-</span>
                                <div className="text-center w-20 md:w-28 shrink-0">
                                  <div className="text-[10px] md:text-xs uppercase font-bold text-text-muted mb-0.5 truncate">{opp.opponentName}</div>
                                  <div className={`text-2xl md:text-3xl font-display font-bold ${(match.scoreOpponent ?? 0) > (match.scoreUs ?? 0) ? 'text-emerald-500' : 'text-text-main'}`}>{match.scoreOpponent ?? 0}</div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
