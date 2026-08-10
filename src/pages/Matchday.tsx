import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, CloudRain, Sun, Cloud, Save, Navigation2, Activity, Edit2, Shuffle, MapPin, CalendarClock, Bell, Play, CheckCircle2, Trophy, Flame, Trash2, ChevronDown, Check, X, RotateCcw, Users, CloudLightning, CloudFog, CloudDrizzle, ArrowLeft, Eye, Search } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useMatchStore } from '../store/useMatchStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useVenueStore } from '../store/useVenueStore';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { CustomTimePicker } from '../components/CustomTimePicker';
import { Autocomplete } from '../components/Autocomplete';
import { CustomSelect } from '../components/CustomSelect';
import { BottomSheet } from '../components/ui/BottomSheet';
import { MatchdaySkeleton } from '../components/ui/MatchdaySkeleton';
import { MatchdayDetailSkeleton } from '../components/ui/MatchdayDetailSkeleton';
import { fetchWeatherForecast, type WeatherData } from '../lib/weather';
import { normalizeOpponentName } from './HeadToHead';
import { useTranslation } from 'react-i18next';
import { compareVietnameseNames } from '../utils/sortUtils';

export default function Matchday() {
  const { t } = useTranslation();
  const { players } = usePlayerStore();
  const { settings } = useSettingsStore();
  const { venues } = useVenueStore();
  const {
    matches,
    activeMatchId,
    getMatchInfo,
    selectMatch,
    createMatch,
    updateMatchInfo,
    updateMatchAttendance,
    updateMatchTeam,
    startMatch,
    endMatch,
    updateLiveMatch,
    deleteMatch,
    resetData
  } = useMatchStore();

  const [isLoading, setIsLoading] = useState(true);

  // Auto-start match when scheduled time arrives/passes
  useEffect(() => {
    const checkAutoStart = () => {
      const now = new Date();
      matches.forEach(m => {
        if (m.status === 'upcoming' && m.date && m.time) {
          const matchDateTime = new Date(`${m.date}T${m.time}:00`);
          if (!isNaN(matchDateTime.getTime()) && now >= matchDateTime) {
            startMatch(m.id);
          }
        }
      });
    };

    checkAutoStart();
    const interval = setInterval(checkAutoStart, 10000);

    // Simulate initial loading
    const timer = setTimeout(() => setIsLoading(false), 500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [matches, startMatch]);

  // Auto-select match from URL query param (?id=xxx)
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const matchIdFromUrl = searchParams.get('id');
    if (matchIdFromUrl && matches.some(m => m.id === matchIdFromUrl)) {
      selectMatch(matchIdFromUrl);
    }
  }, [searchParams, matches, selectMatch]);

  // Clear selected match when leaving Matchday page
  useEffect(() => {
    return () => selectMatch('');
  }, [selectMatch]);

  const formatDateDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}/${m}/${y}`;
  };

  const currentMatch = getMatchInfo();

  const [activeTab, setActiveTab] = useState<'attendance' | 'teams' | 'summary'>('attendance');
  const [filterMode, setFilterMode] = useState<'all_time' | 'current_season'>('current_season');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showLiveUpdateModal, setShowLiveUpdateModal] = useState(false);
  const [isMatchDropdownOpen, setIsMatchDropdownOpen] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [bibColorSelection, setBibColorSelection] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  const getBibColorLabel = (val: string) => {
    switch (val) {
      case 'Đỏ': return t('matchday.red_shirt');
      case 'Xanh': return t('matchday.blue_shirt');
      case 'Trắng': return t('matchday.white_shirt');
      case 'Không Bib': return t('matchday.no_bib');
      default: return val || t('matchday.no_bib');
    }
  };
  const [liveWeather, setLiveWeather] = useState<WeatherData | null>(null);

  // Derive unique past opponent names for autocomplete
  const pastOpponents = useMemo(() => {
    const map = new Map<string, string>(); // normalized -> original
    matches.forEach(m => {
      if (m.matchType !== 'internal' && m.opponent) {
        const normalized = normalizeOpponentName(m.opponent);
        if (!map.has(normalized)) {
          map.set(normalized, m.opponent.trim());
        }
      }
    });
    return Array.from(map.values()).sort();
  }, [matches]);

  useEffect(() => {
    if (currentMatch && currentMatch.date && currentMatch.time) {
      const fetchWeather = (lat: number, lon: number) => {
        fetchWeatherForecast(currentMatch.date, currentMatch.time, lat, lon).then(data => {
          if (data) {
            setLiveWeather(data);
          } else if (currentMatch.weather) {
            setLiveWeather(currentMatch.weather as any);
          } else {
            setLiveWeather(null);
          }
        });
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeather(position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.warn("Lỗi GPS, dùng vị trí mặc định:", error);
            fetchWeather(10.823, 106.6296); // Mặc định TP.HCM
          },
          { timeout: 5000 }
        );
      } else {
        fetchWeather(10.823, 106.6296);
      }
    } else {
      setLiveWeather(null);
    }
  }, [currentMatch?.id, currentMatch?.date, currentMatch?.time]);

  // Live Update Form State
  const [liveData, setLiveData] = useState({ scoreUs: 0, scoreOpponent: 0, scoreTeamA: 0, scoreTeamB: 0, scoreTeamC: 0, scoreTeamD: 0 });
  const [liveStatsMap, setLiveStatsMap] = useState<Record<string, { goals: number; assists: number }>>({});

  const openLiveUpdateModal = () => {
    const match = getMatchInfo();
    if (!match) return;
    setLiveData({
      scoreUs: match.scoreUs ?? 0,
      scoreOpponent: match.scoreOpponent ?? 0,
      scoreTeamA: match.scoreTeamA ?? 0,
      scoreTeamB: match.scoreTeamB ?? 0,
      scoreTeamC: match.scoreTeamC ?? 0,
      scoreTeamD: match.scoreTeamD ?? 0,
    });

    const initialMap: Record<string, { goals: number; assists: number }> = {};
    if (match.stats && match.stats.length > 0) {
      match.stats.forEach(s => {
        initialMap[s.playerId] = { goals: s.goals, assists: s.assists };
      });
    }
    setLiveStatsMap(initialMap);
    setShowLiveUpdateModal(true);
  };

  const handleSaveLiveUpdate = () => {
    if (!currentMatch) return;
    const statsArray = Object.entries(liveStatsMap)
      .filter(([_, stat]) => stat.goals > 0 || stat.assists > 0)
      .map(([playerId, stat]) => ({
        playerId,
        goals: stat.goals,
        assists: stat.assists
      }));

    updateLiveMatch(currentMatch.id, {
      scoreUs: liveData.scoreUs,
      scoreOpponent: liveData.scoreOpponent,
      scoreTeamA: liveData.scoreTeamA,
      scoreTeamB: liveData.scoreTeamB,
      scoreTeamC: liveData.scoreTeamC,
      scoreTeamD: liveData.scoreTeamD,
      stats: statsArray
    });

    setShowLiveUpdateModal(false);
  };

  const handleLiveGoalChange = (p: any, increment: boolean) => {
    const currentGoals = liveStatsMap[p.id]?.goals || 0;
    const newGoals = increment ? currentGoals + 1 : Math.max(0, currentGoals - 1);

    if (newGoals === currentGoals) return;

    setLiveStatsMap(prev => ({
      ...prev,
      [p.id]: { ...(prev[p.id] || { goals: 0, assists: 0 }), goals: newGoals }
    }));

    if (currentMatch) {
      if (currentMatch.matchType === 'internal') {
        const team = currentMatch.teams?.[p.id] || p.team;
        if (team === 'A') {
          setLiveData(prev => ({ ...prev, scoreTeamA: prev.scoreTeamA + (increment ? 1 : -1) }));
        } else if (team === 'B') {
          setLiveData(prev => ({ ...prev, scoreTeamB: prev.scoreTeamB + (increment ? 1 : -1) }));
        } else if (team === 'C') {
          setLiveData(prev => ({ ...prev, scoreTeamC: (prev.scoreTeamC || 0) + (increment ? 1 : -1) }));
        } else if (team === 'D') {
          setLiveData(prev => ({ ...prev, scoreTeamD: (prev.scoreTeamD || 0) + (increment ? 1 : -1) }));
        }
      } else {
        setLiveData(prev => ({ ...prev, scoreUs: prev.scoreUs + (increment ? 1 : -1) }));
      }
    }
  };

  // New Match Form state
  const [newMatchData, setNewMatchData] = useState({
    matchType: 'internal' as 'internal' | 'friendly' | 'tournament',
    teamCount: 2 as 2 | 3 | 4,
    opponent: '',
    location: '',
    time: '19:00',
    date: new Date().toISOString().split('T')[0],
    weatherCondition: 'rain' as 'rain' | 'clear' | 'cloudy',
    weatherProb: 70,
    weatherNote: 'weather.rain',
    teamAColor: 'Đỏ',
    teamBColor: 'Xanh'
  });

  // Edit Form state
  const [editInfo, setEditInfo] = useState(currentMatch || {} as any);

  // End Match Form state
  const [endMatchScore, setEndMatchScore] = useState({
    scoreUs: currentMatch?.scoreUs || 0,
    scoreOpponent: currentMatch?.scoreOpponent || 0,
    scoreTeamA: currentMatch?.scoreTeamA || 0,
    scoreTeamB: currentMatch?.scoreTeamB || 0,
    scoreTeamC: currentMatch?.scoreTeamC || 0,
    scoreTeamD: currentMatch?.scoreTeamD || 0,
  });

  const [playerStatsMap, setPlayerStatsMap] = useState<Record<string, { goals: number; assists: number }>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to open Edit Modal initialized with currentMatch
  const openEditModal = () => {
    const match = getMatchInfo();
    if (match) {
      setEditInfo(match);
      setShowEditModal(true);
    }
  };

  // Helper to open End Modal initialized with present players
  const openEndModal = () => {
    const match = getMatchInfo();
    if (!match) return;
    setEndMatchScore({
      scoreUs: match.scoreUs ?? 0,
      scoreOpponent: match.scoreOpponent ?? 0,
      scoreTeamA: match.scoreTeamA ?? 0,
      scoreTeamB: match.scoreTeamB ?? 0,
      scoreTeamC: match.scoreTeamC ?? 0,
      scoreTeamD: match.scoreTeamD ?? 0,
    });

    const initialMap: Record<string, { goals: number; assists: number }> = {};
    if (match.stats && match.stats.length > 0) {
      match.stats.forEach(s => {
        initialMap[s.playerId] = { goals: s.goals, assists: s.assists };
      });
    } else {
      players.forEach(p => {
        const att = match.attendance?.[p.id] || p.attendance || 'pending';
        if (att === 'present') {
          initialMap[p.id] = { goals: 0, assists: 0 };
        }
      });
    }
    setPlayerStatsMap(initialMap);
    setShowEndModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMatch({
      matchType: newMatchData.matchType,
      teamCount: newMatchData.matchType === 'internal' ? newMatchData.teamCount : undefined,
      opponent: newMatchData.opponent,
      location: newMatchData.location,
      time: newMatchData.time,
      date: newMatchData.date,
      weather: {
        condition: newMatchData.weatherCondition,
        probability: newMatchData.weatherProb,
        note: newMatchData.weatherNote,
      },
      teamAColor: newMatchData.teamAColor,
      teamBColor: newMatchData.teamBColor,
    });
    setShowCreateModal(false);
  };

  const handleEditSave = () => {
    updateMatchInfo(editInfo);
    setShowEditModal(false);
  };

  const handleEndMatchSubmit = () => {
    const match = getMatchInfo();
    if (!match) return;

    endMatch(match.id, {
      scoreUs: match.matchType !== 'internal' ? Number(endMatchScore.scoreUs) : null,
      scoreOpponent: match.matchType !== 'internal' ? Number(endMatchScore.scoreOpponent) : null,
      scoreTeamA: match.matchType === 'internal' ? Number(endMatchScore.scoreTeamA) : null,
      scoreTeamB: match.matchType === 'internal' ? Number(endMatchScore.scoreTeamB) : null,
      stats: match.stats || []
    });

    setShowEndModal(false);
  };

  // Player state getters based on current match
  const getPlayerAttendance = (playerId: string) => {
    return currentMatch?.attendance?.[playerId] ?? 'pending';
  };

  const getPlayerEta = (playerId: string) => {
    return currentMatch?.eta?.[playerId] ?? '';
  };

  const getPlayerTeam = (playerId: string) => {
    return currentMatch?.teams?.[playerId] ?? null;
  };

  const presentPlayers = [...players]
    .filter(p => getPlayerAttendance(p.id) === 'present')
    .sort((a, b) => {
      const aIsGuest = a.isBorrowed || a.isYouth ? 1 : 0;
      const bIsGuest = b.isBorrowed || b.isYouth ? 1 : 0;
      if (aIsGuest !== bIsGuest) return aIsGuest - bIsGuest;
      return compareVietnameseNames(a.name, b.name);
    });
  const presentCount = presentPlayers.length;
  const absentCount = players.filter(p => getPlayerAttendance(p.id) === 'absent').length;
  const pendingCount = players.filter(p => getPlayerAttendance(p.id) === 'pending').length;

  const handleAttendance = (id: string, status: 'present' | 'absent' | 'pending') => {
    if (currentMatch) {
      updateMatchAttendance(currentMatch.id, id, status);
    }
  };

  const handleBulkAttendance = (status: 'present' | 'absent' | 'pending') => {
    if (currentMatch) {
      players.forEach(p => {
        updateMatchAttendance(currentMatch.id, p.id, status);
      });
    }
  };

  const handleEtaChange = (id: string, eta: string) => {
    if (currentMatch) {
      updateMatchAttendance(currentMatch.id, id, 'present', eta);
    }
  };

  const handleRandomize = () => {
    if (!currentMatch) return;
    
    const tiers = ['S', 'A', 'B', 'C', 'Other', 'Youth'] as const;
    const grouped = { 'S': [], 'A': [], 'B': [], 'C': [], 'Other': [], 'Youth': [] } as Record<string, typeof presentPlayers>;
    
    presentPlayers.forEach(p => {
      if (p.isYouth) {
        grouped['Youth'].push(p);
      } else if (p.tier && grouped[p.tier]) {
        grouped[p.tier].push(p);
      } else {
        grouped['Other'].push(p);
      }
    });

    const orderedPlayers: typeof presentPlayers = [];
    tiers.forEach(t => {
      const shuffledGroup = grouped[t].sort(() => Math.random() - 0.5);
      orderedPlayers.push(...shuffledGroup);
    });

    const numTeams = currentMatch.teamCount || 2;
    const teamsList = ['A', 'B', 'C', 'D'].slice(0, numTeams) as ('A'|'B'|'C'|'D')[];
    
    const MAX_PLAYERS_PER_TEAM = 5;
    const maxTotalPlayers = numTeams * MAX_PLAYERS_PER_TEAM;
    
    // Snake draft distribution for better balance
    orderedPlayers.forEach((p, idx) => {
      if (idx < maxTotalPlayers) {
        const round = Math.floor(idx / numTeams);
        const isEvenRound = round % 2 === 0;
        const remainder = idx % numTeams;
        const teamIndex = isEvenRound ? remainder : (numTeams - 1 - remainder);
        
        updateMatchTeam(currentMatch.id, p.id, teamsList[teamIndex]);
      } else {
        // Exceeds capacity, leave unassigned
        updateMatchTeam(currentMatch.id, p.id, null);
      }
    });
  };

  const handleResetTeams = () => {
    if (!currentMatch) return;
    presentPlayers.forEach(p => {
      if (getPlayerTeam(p.id)) {
        updateMatchTeam(currentMatch.id, p.id, null);
      }
    });
  };

  const handleMoveTeam = (id: string, team: 'A' | 'B' | 'C' | 'D' | null) => {
    if (currentMatch) {
      updateMatchTeam(currentMatch.id, id, team);
    }
  };

  const getWarning = () => {
    if (!currentMatch || currentMatch.status === 'finished') return null;
    if (currentMatch.matchType === 'internal' && presentCount < 10) {
      return `Đá nội bộ cần 10 người. Đang thiếu ${10 - presentCount} người!`;
    }
    if (currentMatch.matchType !== 'internal' && presentCount < 5) {
      return `Chưa đủ đội hình thi đấu. Đang thiếu ${5 - presentCount} người!`;
    }
    return null;
  };

  // Result calculation for finished match
  const getMatchResultBadge = () => {
    if (!currentMatch) return { label: '', color: '' };
    if (currentMatch.matchType === 'internal') {
      const a = currentMatch.scoreTeamA ?? 0;
      const b = currentMatch.scoreTeamB ?? 0;
      if (a > b) return { label: `ĐỘI A THẮNG (${a}-${b})`, color: 'bg-primary text-white' };
      if (b > a) return { label: `ĐỘI B THẮNG (${b}-${a})`, color: 'bg-slate-800 text-white' };
      return { label: `HÒA (${a}-${b})`, color: 'bg-secondary text-white' };
    } else {
      const us = currentMatch.scoreUs ?? 0;
      const opp = currentMatch.scoreOpponent ?? 0;
      if (us > opp) return { label: `THẮNG ${settings.teamName || '5TactiQ'} (${us}-${opp})`, color: 'bg-emerald-600 text-white' };
      if (opp > us) return { label: `THUA (${us}-${opp})`, color: 'bg-rose-600 text-white' };
      return { label: `HÒA (${us}-${opp})`, color: 'bg-amber-600 text-white' };
    }
  };

  if (isLoading) {
    if (currentMatch) {
      return <MatchdayDetailSkeleton />;
    }
    return <MatchdaySkeleton />;
  }

  if (!currentMatch) {
    // No matches at all — show empty state
    if (matches.length === 0) {
      return (
        <div className="p-4 flex flex-col h-full max-w-5xl mx-auto w-full justify-center items-center">
          <div className="hallmark-card p-8 text-center max-w-md w-full bg-surface border-2 border-border-main shadow-xl">
            <CalendarClock size={48} className="mx-auto text-primary mb-4" />
            <h2 className="text-3xl font-display text-primary uppercase mb-2">{t('matchday.no_match_title')}</h2>
            <p className="text-sm font-medium text-text-muted mb-6">
              {t('matchday.no_match_desc')}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="hallmark-btn w-full py-4 text-lg font-bold bg-primary text-white flex items-center justify-center gap-2"
            >
              <Plus size={20} /> <span>{t('matchday.create_new_caps')}</span>
            </button>
          </div>

          {/* CREATE MATCH MODAL */}
          <BottomSheet
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title={
              <span className="flex items-center gap-2">
                <Plus size={24} /> {t('matchday.create_modal_title')}
              </span>
            }
          >
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.match_type_label')}</label>
                <CustomSelect
                  value={newMatchData.matchType}
                  onChange={val => setNewMatchData({ ...newMatchData, matchType: val as any })}
                  options={[
                    { value: 'internal', label: t('matchday.type_internal') },
                    { value: 'friendly', label: t('matchday.type_friendly') }
                  ]}
                />
              </div>

              {newMatchData.matchType === 'internal' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.team_count_label')}</label>
                  <div className="flex border border-border-main overflow-hidden">
                    {([2, 3, 4] as const).map(count => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setNewMatchData({ ...newMatchData, teamCount: count })}
                        className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wider transition-all ${
                          newMatchData.teamCount === count
                            ? 'bg-primary text-white'
                            : 'bg-surface text-text-muted hover:bg-surface-2'
                        }`}
                      >
                        {count} {t('matchday.team_count_unit')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {newMatchData.matchType !== 'internal' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.opponent_label')}</label>
                  <Autocomplete
                    value={newMatchData.opponent}
                    onChange={(val) => setNewMatchData({ ...newMatchData, opponent: val })}
                    options={pastOpponents}
                    placeholder={t('matchday.opponent_input_placeholder')}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <CustomDatePicker
                  value={newMatchData.date}
                  onChange={d => setNewMatchData({ ...newMatchData, date: d })}
                />
                <CustomTimePicker
                  value={newMatchData.time}
                  onChange={t => setNewMatchData({ ...newMatchData, time: t })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.venue_label')}</label>
                <Autocomplete
                  value={newMatchData.location}
                  onChange={(val) => setNewMatchData({ ...newMatchData, location: val })}
                  options={venues.map(v => v.name)}
                  placeholder={t('matchday.venue_placeholder')}
                />
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-[#323d29] transition-colors active:scale-95">
                  {t('matchday.create_btn')}
                </button>
              </div>
            </form>
          </BottomSheet>
        </div>
      );
    }

    // Has matches but none selected — show Match List view
    const seasonStart = settings.seasonStartDate ? new Date(settings.seasonStartDate) : null;
    const seasonEnd = settings.seasonEndDate ? new Date(settings.seasonEndDate) : null;
    const hasSeasonConfig = !!(seasonStart && seasonEnd);

    const filteredMatches = matches.filter(m => {
      // Season filter
      if (filterMode === 'current_season' && hasSeasonConfig) {
        if (m.date) {
          const matchDate = new Date(m.date);
          if (matchDate < seasonStart! || matchDate > seasonEnd!) return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const opponentName = m.opponent?.toLowerCase() || '';
        const isInternalMatch = m.matchType === 'internal';
        
        // If it's an internal match, we might want to let them search by "internal" or translation
        // For simplicity, just check opponent or fallback
        if (!opponentName.includes(query) && !(isInternalMatch && 'nội bộ internal'.includes(query))) {
          return false;
        }
      }

      return true;
    });

    const liveMatches = filteredMatches.filter(m => m.status === 'live');
    const upcomingMatches = filteredMatches.filter(m => m.status === 'upcoming');
    const finishedMatches_list = filteredMatches.filter(m => m.status === 'finished');

    const MatchCard = ({ match }: { match: typeof matches[0] }) => {
      const getScore = () => {
        if (match.status === 'upcoming') return null;
        if (match.matchType === 'internal') {
          return { left: match.scoreTeamA ?? 0, right: match.scoreTeamB ?? 0, leftLabel: `${t('matchday.team_a')} (${getBibColorLabel(match.teamAColor)})`, rightLabel: `${t('matchday.team_b')} (${getBibColorLabel(match.teamBColor)})` };
        }
        return { left: match.scoreUs ?? 0, right: match.scoreOpponent ?? 0, leftLabel: settings.teamName || '5TactiQ', rightLabel: match.opponent || t('matchday.opponent_placeholder') };
      };

      const score = getScore();

      return (
        <div
          className={`hallmark-card p-0 overflow-hidden cursor-pointer group hover:shadow-lg transition-all flex flex-col h-full ${match.status === 'live' ? 'ring-2 ring-rose-400 ring-offset-2' : ''}`}
          onClick={() => selectMatch(match.id)}
        >
          {/* Card Top Accent */}
          <div className={`h-1.5 ${match.status === 'live' ? 'bg-rose-500' : match.status === 'upcoming' ? 'bg-primary' : 'bg-slate-400'}`} />

          <div className="p-4 flex flex-col flex-1 justify-between">
            {/* Status + Type row */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-display uppercase tracking-widest font-bold text-slate-400">
                {match.matchType === 'internal' ? t('matchday.type_internal') : match.matchType === 'friendly' ? t('matchday.type_friendly') : t('matchday.type_tournament')}
              </span>
              {match.status === 'live' && (
                <span className="px-2 py-0.5 text-[10px] font-display uppercase font-bold bg-rose-600 text-white animate-pulse">
                  {t('matchday.live_badge')}
                </span>
              )}
              {match.status === 'upcoming' && (
                <span className="px-2 py-0.5 text-[10px] font-display uppercase font-bold bg-primary/10 text-primary border border-primary/30">
                  {t('matchday.upcoming_badge')}
                </span>
              )}
              {match.status === 'finished' && (
                <span className="px-2 py-0.5 text-[10px] font-display uppercase font-bold bg-surface text-text-muted border border-border-main">
                  {t('matchday.finished_badge')}
                </span>
              )}
            </div>

            {/* Match Title */}
            <h3 className="font-display text-xl uppercase text-primary leading-tight mb-3 group-hover:text-secondary transition-colors">
              {match.matchType === 'internal' ? t('matchday.internal_match') : `VS ${match.opponent || t('matchday.opponent_placeholder')}`}
            </h3>

            {/* Score (if live or finished) */}
            {match.status !== 'upcoming' && (
              <div className="bg-surface-2 border-y border-border-main px-2.5 py-2.5 mb-3 min-h-[90px] flex items-center justify-center">
                {match.matchType === 'internal' ? (
                  <div className={`grid gap-2 w-full ${
                    (match.teamCount || 2) === 2 ? 'grid-cols-2' : 
                    (match.teamCount || 2) === 3 ? 'grid-cols-3' : 
                    'grid-cols-2'
                  }`}>
                    {(['A', 'B', 'C', 'D'] as const).slice(0, match.teamCount || 2).map((team) => {
                      const scoreField = `scoreTeam${team}` as keyof typeof match;
                      return (
                        <div key={team} className="bg-surface border border-border-main p-1.5 flex flex-col items-center justify-center text-center">
                          <span className="text-[9px] uppercase font-bold text-text-muted truncate max-w-full">
                            {t(`matchday.team_${team.toLowerCase()}`)}
                          </span>
                          <span className={`text-lg sm:text-xl font-display font-bold ${team === 'A' ? 'text-primary' : 'text-text-main'}`}>
                            {Number(match[scoreField] ?? 0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-6 sm:gap-8">
                    <div className="text-center">
                      <div className="text-[10px] uppercase font-bold text-text-muted mb-0.5">{settings.teamName || '5TactiQ'}</div>
                      <div className="text-3xl font-display font-bold text-primary">{match.scoreUs ?? 0}</div>
                    </div>
                    <span className="text-2xl font-display text-text-muted font-bold opacity-40">-</span>
                    <div className="text-center">
                      <div className="text-[9px] uppercase font-bold text-text-muted mb-0.5">{match.opponent || t('matchday.opponent_placeholder')}</div>
                      <div className="text-3xl font-display font-bold text-text-main">{match.scoreOpponent ?? 0}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            <div className="space-y-1.5 text-xs text-text-muted font-medium mt-auto pt-2">
              <div className="flex items-center gap-1.5">
                <CalendarClock size={13} className="text-secondary shrink-0" />
                <span>{formatDateDDMMYYYY(match.date)} • {match.time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-secondary shrink-0" />
                <span className="truncate">{match.location || t('matchday.unknown_venue')}</span>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="p-4 md:p-6 flex flex-col min-h-full max-w-5xl mx-auto w-full pb-8">
        {/* Header - matching Roster page style */}
        <div className="flex flex-col @lg:flex-row @lg:justify-between @lg:items-end gap-4 mb-6 pt-2">
          <div>
            <h1 className="text-4xl @sm:text-5xl font-display uppercase text-primary leading-none mb-2">{t('matchday.title')}</h1>
            {(filterMode === 'current_season' && hasSeasonConfig) && (
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
                {t('stats.season', { year: seasonStart!.getFullYear() === seasonEnd!.getFullYear() ? seasonStart!.getFullYear() : `${seasonStart!.getFullYear()}/${seasonEnd!.getFullYear()}` })}
              </p>
            )}
          </div>
          <div className="flex flex-col @sm:flex-row items-stretch @sm:items-center gap-3 shrink-0">
            {hasSeasonConfig && (
              <CustomSelect 
                value={filterMode} 
                onChange={(val) => setFilterMode(val as 'all_time' | 'current_season')}
                className="relative w-full @sm:w-auto shrink-0"
                buttonClassName="bg-surface border-2 border-border-main text-xs font-bold uppercase tracking-widest text-text-main px-3 outline-none focus:border-primary cursor-pointer w-full @sm:w-auto h-[44px] flex items-center justify-between transition-colors hover:border-primary/50"
                options={[
                  { value: 'current_season', label: t('stats.filter_season', 'MÙA GIẢI HIỆN TẠI') },
                  { value: 'all_time', label: t('stats.filter_all', 'TẤT CẢ THỜI GIAN') }
                ]}
              />
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="hallmark-btn flex items-center justify-center gap-2 bg-secondary text-white shrink-0 h-[44px]"
            >
              <Plus size={20} /> <span className="hidden @xl:inline">{t('matchday.create_new')}</span>
            </button>
          </div>
        </div>

        <div className="hallmark-divider"></div>

        {/* Search Bar */}
        <div className="mb-6 relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-text-muted" />
          </div>
          <input
            type="text"
            placeholder={t('matchday.search_placeholder', 'Tìm đối thủ...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border-2 border-border-main text-text-main py-2.5 pl-10 pr-3 outline-none focus:border-primary transition-colors text-sm placeholder:text-text-muted/60 placeholder:uppercase tracking-wider"
          />
        </div>

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-sm uppercase tracking-widest text-rose-600 mb-4 flex items-center gap-2 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              {t('matchday.live', { count: liveMatches.length })}
            </h2>
            <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4">
              {liveMatches.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-sm uppercase tracking-widest text-primary mb-4 font-bold">
              {t('matchday.upcoming', { count: upcomingMatches.length })}
            </h2>
            <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4">
              {upcomingMatches.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        )}

        {/* Finished Matches */}
        {finishedMatches_list.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-sm uppercase tracking-widest text-slate-400 mb-4 font-bold">
              {t('matchday.finished', { count: finishedMatches_list.length })}
            </h2>
            <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4">
              {finishedMatches_list.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        )}

        {/* CREATE MATCH MODAL */}
        <BottomSheet
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={
            <span className="flex items-center gap-2">
              <Plus size={24} /> {t('matchday.create_new')}
            </span>
          }
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.match_type_label') || 'Loại trận đấu'}</label>
              <CustomSelect
                value={newMatchData.matchType}
                onChange={val => setNewMatchData({ ...newMatchData, matchType: val as any })}
                options={[
                  { value: 'internal', label: t('matchday.type_internal') },
                  { value: 'friendly', label: t('matchday.type_friendly') }
                ]}
              />
            </div>

            {newMatchData.matchType === 'internal' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.team_count_label')}</label>
                <div className="flex border border-border-main overflow-hidden">
                  {([2, 3, 4] as const).map(count => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setNewMatchData({ ...newMatchData, teamCount: count })}
                      className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wider transition-all ${
                        newMatchData.teamCount === count
                          ? 'bg-primary text-white'
                          : 'bg-surface text-text-muted hover:bg-surface-2'
                      }`}
                    >
                      {count} {t('matchday.team_count_unit')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {newMatchData.matchType !== 'internal' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.opponent_label') || 'Tên Đối thủ'}</label>
                <Autocomplete
                  value={newMatchData.opponent}
                  onChange={(val) => setNewMatchData({ ...newMatchData, opponent: val })}
                  options={pastOpponents}
                  placeholder={t('matchday.opponent_placeholder')}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <CustomDatePicker
                value={newMatchData.date}
                onChange={d => setNewMatchData({ ...newMatchData, date: d })}
              />
              <CustomTimePicker
                value={newMatchData.time}
                onChange={t => setNewMatchData({ ...newMatchData, time: t })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.venue_label') || 'Sân bóng'}</label>
              <Autocomplete
                value={newMatchData.location}
                onChange={(val) => setNewMatchData({ ...newMatchData, location: val })}
                options={venues.map(v => v.name)}
                placeholder={t('matchday.venue_placeholder') || 'Nhập tên sân bóng...'}
              />
            </div>

            <div className="pt-4">
              <button type="submit" className="w-full bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-[#323d29] transition-colors active:scale-95">
                {t('matchday.create_btn') || 'TẠO TRẬN ĐẤU'}
              </button>
            </div>
          </form>
        </BottomSheet>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 flex flex-col min-h-full max-w-5xl mx-auto w-full gap-6">

      {/* 1. Header Toolbar Card */}
      <div className="bg-surface border-2 border-border-main p-3 md:p-4 shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 md:gap-4 shrink-0">
        {/* Left: Select Match */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          {/* Back to Match List */}
          <button
            type="button"
            onClick={() => selectMatch('')}
            className="p-2 text-primary hover:bg-primary/10 border-2 border-primary/30 hover:border-primary transition-all shrink-0"
            title={t('matchday.back_to_list')}
          >
            <ArrowLeft size={18} />
          </button>
          {/* Custom Branded Match Selector Dropdown Component */}
          <div className="relative flex-1 min-w-0 lg:w-80">
            <button
              type="button"
              onClick={() => setIsMatchDropdownOpen(!isMatchDropdownOpen)}
              className={`w-full ${isMatchDropdownOpen ? 'bg-surface-2 border-primary text-primary' : 'bg-surface border-border-main hover:border-primary text-text-main'} border-2 font-display uppercase tracking-wider text-sm md:text-base font-bold py-2 px-2 md:px-3.5 flex items-center justify-between transition-all cursor-pointer shadow-sm`}
            >
              <span className="truncate">
                {currentMatch.matchType === 'internal' ? t('matchday.internal_dropdown') : `VS ${currentMatch.opponent || t('matchday.opponent_placeholder')}`} ({formatDateDDMMYYYY(currentMatch.date)})
              </span>
              <ChevronDown size={18} className={`${isMatchDropdownOpen ? 'text-primary' : 'text-text-muted'} transition-transform duration-200 shrink-0 ml-2 ${isMatchDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Custom Floating Dropdown Menu */}
            {isMatchDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMatchDropdownOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1.5 w-full min-w-[280px] bg-surface border-2 border-border-main shadow-2xl z-50 divide-y divide-border-main max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                  {matches.map((m) => {
                    const isSelected = m.id === currentMatch.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          selectMatch(m.id);
                          setIsMatchDropdownOpen(false);
                        }}
                        className={`w-full text-left p-3 flex justify-between items-center transition-colors cursor-pointer ${isSelected
                            ? 'bg-primary text-white font-bold'
                            : 'hover:bg-surface-2 text-text-main'
                          }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-display uppercase text-base tracking-wider leading-tight">
                            {m.matchType === 'internal' ? t('matchday.internal_match').toUpperCase() : `VS ${m.opponent || t('matchday.opponent_placeholder').toUpperCase()}`}
                          </span>
                          <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-text-muted'} font-sans`}>
                            {formatDateDDMMYYYY(m.date)} • {m.time}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {m.status === 'live' && (
                            <span className="px-2 py-0.5 bg-rose-600 text-white font-display text-[10px] uppercase font-bold animate-pulse">
                              {t('matchday.live_badge')}
                            </span>
                          )}
                          {m.status === 'finished' && (
                            <span className={`px-2 py-0.5 font-display text-[10px] uppercase font-bold ${isSelected ? 'bg-surface/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                              {t('matchday.finished_badge')}
                            </span>
                          )}
                          {m.status === 'upcoming' && (
                            <span className={`px-2 py-0.5 font-display text-[10px] uppercase font-bold ${isSelected ? 'bg-accent text-primary' : 'bg-surface text-text-muted'}`}>
                              {t('matchday.upcoming_badge')}
                            </span>
                          )}
                          <div className="w-5 flex items-center justify-end">
                            {isSelected && <Check size={16} className="text-accent" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {currentMatch.status === 'live' && (
            <span className="px-2.5 py-1 bg-rose-600 text-white font-display text-xs uppercase font-bold animate-pulse shrink-0">{t('matchday.live_badge')}</span>
          )}
          {currentMatch.status === 'finished' && (
            <span className="px-2.5 py-1 bg-slate-700 text-white font-display text-xs uppercase font-bold shrink-0">{t('matchday.finished_badge')}</span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="hallmark-btn-outline px-3 py-2 text-xs md:text-sm border-border-main text-text-main hover:bg-surface-2 hover:text-text-main hover:border-border-main flex items-center justify-center flex-1 sm:flex-none whitespace-nowrap"
          >
            {t('matchday.create_short')}
          </button>

          {currentMatch.status === 'upcoming' && (
            <button
              onClick={() => startMatch(currentMatch.id)}
              className="hallmark-btn px-3 py-2 text-xs md:text-sm font-bold bg-primary text-white border-primary hover:bg-primary/90 flex items-center justify-center flex-1 sm:flex-none whitespace-nowrap"
            >
              {t('matchday.start_btn')}
            </button>
          )}

          {currentMatch.status === 'live' && (
            <button
              onClick={openLiveUpdateModal}
              className="hallmark-btn px-3 py-2 text-xs md:text-sm font-bold bg-secondary text-white border-secondary hover:bg-secondary/90 flex items-center justify-center shadow-md flex-1 sm:flex-none whitespace-nowrap"
            >
              {t('matchday.update_btn')}
            </button>
          )}

          {currentMatch.status !== 'finished' && (
            <button
              onClick={openEndModal}
              className="hallmark-btn px-3 py-2 text-xs md:text-sm font-bold bg-rose-600 text-white border-rose-600 hover:bg-rose-700 hover:border-rose-700 flex items-center justify-center flex-1 sm:flex-none whitespace-nowrap"
            >
              {t('matchday.end_match')}
            </button>
          )}

          {currentMatch.status === 'finished' && (
            <button
              onClick={() => startMatch(currentMatch.id)}
              className="hallmark-btn px-3 py-2 text-xs md:text-sm font-bold bg-surface-2 text-text-main border-border-main hover:bg-border-main flex items-center justify-center flex-1 sm:flex-none whitespace-nowrap"
            >
              {t('matchday.edit_result')}
            </button>
          )}

          <div className="flex items-center justify-center gap-1 w-full sm:w-auto sm:border-l-2 border-border-main sm:pl-2 sm:ml-1 mt-1 sm:mt-0 order-last sm:order-none">
            <button onClick={openEditModal} className="p-2 text-text-muted hover:text-text-main hover:bg-surface-2 border border-border-main sm:border-none flex-1 sm:flex-none flex justify-center transition-colors" title="Chỉnh sửa">
              <Edit2 size={16} />
            </button>
            <button onClick={() => setShowDeleteConfirmModal(true)} className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 sm:border-none flex-1 sm:flex-none flex justify-center transition-colors" title="Xóa">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Match Hero Overview Banner */}
      <div className="bg-surface p-5 sm:p-6 border-2 border-primary shadow-lg flex flex-col items-center text-center relative shrink-0">
        <div className="text-xs font-display uppercase tracking-widest text-secondary mb-1 font-bold">
          {currentMatch.matchType === 'internal' 
            ? `${t('matchday.internal_match_caps')} • ${currentMatch.teamCount || 2} ĐỘI`
            : currentMatch.matchType === 'friendly' 
            ? t('matchday.friendly_match_caps') 
            : t('matchday.tournament_match_caps')}
        </div>

        <h1 className="text-3xl md:text-5xl font-display uppercase text-primary leading-none my-1">
          {currentMatch.matchType === 'internal' 
            ? t('matchday.internal_match_caps') 
            : (currentMatch.opponent ? `VS ${currentMatch.opponent}` : t('matchday.friendly_match_caps'))}
        </h1>

        {/* Live / Finished Scoreboard */}
        {(currentMatch.status === 'live' || currentMatch.status === 'finished') && (
          <div className="w-full max-w-xl my-4">
            {currentMatch.matchType === 'internal' ? (
              <div className={`grid gap-2.5 sm:gap-3.5 w-full ${
                (currentMatch.teamCount || 2) === 2 ? 'grid-cols-2 max-w-sm mx-auto' : 
                (currentMatch.teamCount || 2) === 3 ? 'grid-cols-3 max-w-lg mx-auto' : 
                'grid-cols-2 sm:grid-cols-4 max-w-xl mx-auto'
              }`}>
                {(['A', 'B', 'C', 'D'] as const).slice(0, currentMatch.teamCount || 2).map((team) => {
                  const scoreField = `scoreTeam${team}` as keyof typeof currentMatch;
                  const colorField = `team${team}Color` as keyof typeof currentMatch;
                  return (
                    <div key={team} className="bg-surface-2 border-2 border-border-main p-3 sm:p-4 flex flex-col items-center justify-center shadow-sm relative group hover:border-primary/50 transition-colors">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-muted mb-1 truncate max-w-full">
                        {t(`matchday.team_${team.toLowerCase()}`)} ({getBibColorLabel(currentMatch[colorField] as string)})
                      </span>
                      <span className={`text-3xl sm:text-5xl font-display font-bold ${team === 'A' ? 'text-primary' : 'text-text-main'}`}>
                        {Number(currentMatch[scoreField] ?? 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-6 bg-surface-2 px-8 py-3.5 border-2 border-border-main shadow-sm max-w-md mx-auto">
                <div className="text-center">
                  <div className="text-[10px] uppercase font-bold text-secondary">{(settings.teamName || '5TactiQ').toUpperCase()}</div>
                  <div className="text-4xl font-display text-primary font-bold">{currentMatch.scoreUs ?? 0}</div>
                </div>
                <div className="text-3xl font-display text-text-muted font-bold opacity-40">-</div>
                <div className="text-center">
                  <div className="text-[10px] uppercase font-bold text-text-muted">{currentMatch.opponent || t('matchday.opponent_placeholder')}</div>
                  <div className="text-4xl font-display text-text-main font-bold">{currentMatch.scoreOpponent ?? 0}</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-center items-center gap-4 text-xs md:text-sm text-text-muted font-bold uppercase tracking-wider mt-2">
          <span className="flex items-center gap-1"><MapPin size={15} className="text-secondary" /> {currentMatch.location}</span>
          <span className="flex items-center gap-1"><CalendarClock size={15} className="text-secondary" /> {formatDateDDMMYYYY(currentMatch.date)} - {currentMatch.time}</span>
        </div>

      </div>

      {/* 3. Weather Alert (If any) */}
      {liveWeather && (
        <div className={`border-2 p-3.5 flex items-center gap-3 shrink-0 ${liveWeather.condition === 'rain' || liveWeather.condition === 'thunderstorm'
            ? 'border-secondary/40 bg-amber-500/10'
            : 'border-slate-300/50 bg-surface/50'
          }`}>
          {liveWeather.condition === 'rain' && <CloudRain className="text-secondary shrink-0" size={24} />}
          {liveWeather.condition === 'clear' && <Sun className="text-amber-500 shrink-0" size={24} />}
          {liveWeather.condition === 'cloudy' && <Cloud className="text-text-muted shrink-0" size={24} />}
          {liveWeather.condition === 'thunderstorm' && <CloudLightning className="text-red-500 shrink-0" size={24} />}
          {liveWeather.condition === 'fog' && <CloudFog className="text-slate-400 shrink-0" size={24} />}
          {liveWeather.condition === 'drizzle' && <CloudDrizzle className="text-blue-400 shrink-0" size={24} />}

          <div>
            <span className={`font-display uppercase font-bold text-base ${liveWeather.condition === 'rain' || liveWeather.condition === 'thunderstorm' ? 'text-secondary' : 'text-text-main'}`}>
              {liveWeather.condition === 'rain' ? t('matchday.weather_rain') : t('matchday.weather_forecast')} ({liveWeather.probability}%){liveWeather.temperature ? ` - ${liveWeather.temperature}°C` : ''}
            </span>
          </div>
        </div>
      )}

      {/* 4. Navigation Segmented Tabs */}
      <div className="flex bg-surface-2 p-1 border-2 border-border-main gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-2 text-sm md:text-base md:py-2.5 font-display uppercase tracking-wider transition-all ${activeTab === 'attendance' ? 'bg-primary text-white font-bold shadow-sm' : 'text-text-muted hover:text-primary font-bold'}`}
        >
          {t('matchday.attendance_list')}
        </button>
        {currentMatch.matchType === 'internal' && (
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 py-2 text-sm md:text-base md:py-2.5 font-display uppercase tracking-wider transition-all ${activeTab === 'teams' ? 'bg-primary text-white font-bold shadow-sm' : 'text-text-muted hover:text-primary font-bold'}`}
          >
            {t('matchday.split_teams')}
          </button>
        )}
      </div>

      {/* 5. Tab Content: Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-4 pb-8">
          {/* Summary Pills */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface p-3 border-2 border-border-main text-center shadow-sm">
              <div className="text-2xl font-display text-primary font-bold">{presentCount}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{t('matchday.present')}</div>
            </div>
            <div className="bg-surface p-3 border-2 border-border-main text-center shadow-sm">
              <div className="text-2xl font-display text-secondary font-bold">{absentCount}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{t('matchday.absent')}</div>
            </div>
            <div className="bg-surface p-3 border-2 border-border-main text-center shadow-sm">
              <div className="text-2xl font-display text-text-muted font-bold">{pendingCount}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{t('matchday.pending')}</div>
            </div>
          </div>

          {/* Search and Bulk Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mt-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="text"
                placeholder={t('matchday.search_player') || 'Tìm tên cầu thủ...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border-main pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            {currentMatch.status !== 'finished' && (
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => handleBulkAttendance('present')}
                  className="flex-1 md:flex-none text-[11px] sm:text-xs font-display font-bold uppercase tracking-wider px-3.5 py-2 bg-primary text-white border-2 border-primary hover:bg-[#323d29] transition-all text-center shadow-sm active:scale-95"
                >
                  {t('matchday.all_yes') || 'ALL YES'}
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAttendance('absent')}
                  className="flex-1 md:flex-none text-[11px] sm:text-xs font-display font-bold uppercase tracking-wider px-3.5 py-2 bg-secondary text-white border-2 border-secondary hover:bg-[#d05c21] transition-all text-center shadow-sm active:scale-95"
                >
                  {t('matchday.all_no') || 'ALL NO'}
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAttendance('pending')}
                  className="flex-1 md:flex-none text-[11px] sm:text-xs font-display font-bold uppercase tracking-wider px-3.5 py-2 bg-surface-2 text-text-main border-2 border-border-main hover:bg-surface hover:border-primary/50 transition-all text-center shadow-sm active:scale-95"
                >
                  {t('matchday.all_pending') || 'ALL ?'}
                </button>
              </div>
            )}
          </div>

          {/* Player List */}
          <div className="bg-surface border-2 border-border-main shadow-sm divide-y divide-border-main mt-4">
            {[...players]
              .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .sort((a, b) => {
                const aIsGuest = a.isBorrowed || a.isYouth ? 1 : 0;
                const bIsGuest = b.isBorrowed || b.isYouth ? 1 : 0;
                if (aIsGuest !== bIsGuest) return aIsGuest - bIsGuest;
                
                const numA = (a.jersey_number !== null && a.jersey_number !== undefined && !isNaN(Number(a.jersey_number))) ? Number(a.jersey_number) : null;
                const numB = (b.jersey_number !== null && b.jersey_number !== undefined && !isNaN(Number(b.jersey_number))) ? Number(b.jersey_number) : null;
                
                if (numA !== null && numB !== null) {
                  if (numA !== numB) return numA - numB;
                } else if (numA !== null) {
                  return -1;
                } else if (numB !== null) {
                  return 1;
                }
                
                return compareVietnameseNames(a.name, b.name);
              })
              .map((p) => {
              const status = getPlayerAttendance(p.id);
              return (
                <div key={p.id} className="flex justify-between items-center p-3 md:p-4 hover:bg-surface-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 flex items-center justify-center bg-surface text-text-muted font-display text-sm font-bold border border-border-main">
                      {p.jersey_number || '?'}
                    </span>
                    <span className="font-bold text-text-main text-base uppercase">{p.name}</span>
                  </div>

                  <div className={`flex items-center gap-1 bg-surface p-1 border border-border-main ${currentMatch.status === 'finished' ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}>
                    <button
                      disabled={currentMatch.status === 'finished'}
                      onClick={() => handleAttendance(p.id, 'present')}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${status === 'present' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'} ${currentMatch.status === 'finished' ? 'pointer-events-none' : ''}`}
                    >
                      {t('matchday.yes')}
                    </button>
                    <button
                      disabled={currentMatch.status === 'finished'}
                      onClick={() => handleAttendance(p.id, 'absent')}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${status === 'absent' ? 'bg-secondary text-white shadow-sm' : 'text-text-muted hover:text-text-main'} ${currentMatch.status === 'finished' ? 'pointer-events-none' : ''}`}
                    >
                      {t('matchday.no')}
                    </button>
                    <button
                      disabled={currentMatch.status === 'finished'}
                      onClick={() => handleAttendance(p.id, 'pending')}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${status === 'pending' ? 'bg-slate-700 text-white shadow-sm' : 'text-text-muted hover:text-text-main'} ${currentMatch.status === 'finished' ? 'pointer-events-none' : ''}`}
                    >
                      ?
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'teams' && currentMatch.matchType === 'internal' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center bg-surface p-4 border-2 border-border-main">
            <h3 className="font-display text-2xl text-primary uppercase">{t('matchday.team_lineup')}</h3>
            <div className="flex items-stretch gap-2">
              <button disabled={currentMatch.status === 'finished'} onClick={handleResetTeams} className={`hallmark-btn bg-surface hover:bg-surface-2 text-text-muted flex items-center justify-center gap-2 px-3 border border-border-main ${currentMatch.status === 'finished' ? 'opacity-50 cursor-not-allowed' : ''}`} title={t('matchday.reset_teams') || 'Làm lại'}>
                <RotateCcw size={18} />
              </button>
              <button disabled={currentMatch.status === 'finished'} onClick={handleRandomize} className={`hallmark-btn flex items-center justify-center gap-2 px-4 py-2 ${currentMatch.status === 'finished' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Shuffle size={18} /> <span className="hidden @xl:inline">{t('matchday.randomize')}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team Cards */}
            {(['A', 'B', 'C', 'D'] as const).map(team => {
              if (team === 'C' && (currentMatch.teamCount || 2) < 3) return null;
              if (team === 'D' && (currentMatch.teamCount || 2) < 4) return null;

              const teamColors = {
                A: 'bg-primary',
                B: 'bg-slate-800',
                C: 'bg-emerald-700',
                D: 'bg-amber-600'
              };

              const teamColorField = `team${team}Color` as keyof typeof currentMatch;
              
              const otherTeams = (['A', 'B', 'C', 'D'] as const).filter(t => {
                if (t === team) return false;
                if (t === 'C' && (currentMatch.teamCount || 2) < 3) return false;
                if (t === 'D' && (currentMatch.teamCount || 2) < 4) return false;
                return true;
              });

              return (
                <div 
                  key={team} 
                  className="hallmark-card p-0 overflow-hidden flex flex-col h-full"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (currentMatch.status === 'finished') return;
                    const playerId = e.dataTransfer.getData('playerId');
                    if (playerId) handleMoveTeam(playerId, team);
                  }}
                >
                  <div className={`${teamColors[team]} text-white p-3 flex justify-between items-center`}>
                    <h4 className="font-display text-xl uppercase">{t(`matchday.team_${team.toLowerCase()}`) || `TEAM ${team}`}</h4>
                    <button
                      disabled={currentMatch.status === 'finished'}
                      onClick={() => setBibColorSelection(team)}
                      className="bg-transparent text-white font-bold outline-none text-sm uppercase text-right disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {getBibColorLabel(currentMatch[teamColorField] as string)} <ChevronDown size={14} />
                    </button>
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    {presentPlayers.filter(p => getPlayerTeam(p.id) === team).length === 0 && (
                      <div className="text-sm text-slate-400 p-2 italic">{t('matchday.no_players_yet')}</div>
                    )}
                    {presentPlayers.filter(p => getPlayerTeam(p.id) === team).map(p => (
                      <div 
                        key={p.id} 
                        draggable={currentMatch.status !== 'finished'}
                        onDragStart={(e) => e.dataTransfer.setData('playerId', p.id)}
                        className="flex justify-between items-center py-2 border-b border-border-main last:border-0 hover:bg-surface-2 px-2 -mx-2 transition-colors group cursor-grab active:cursor-grabbing"
                      >
                        <span className="font-bold text-text-main uppercase text-sm truncate pr-2">{p.name}</span>
                        <div className="flex gap-1 shrink-0 @md:hidden">
                          {otherTeams.map(targetTeam => (
                            <button
                              key={targetTeam}
                              disabled={currentMatch.status === 'finished'}
                              onClick={() => handleMoveTeam(p.id, targetTeam)}
                              className={`text-[10px] font-bold text-text-muted uppercase tracking-widest border border-border-main px-2 py-1 ${currentMatch.status === 'finished' ? 'opacity-50 cursor-not-allowed' : 'hover:text-primary hover:bg-primary/10 hover:border-primary/30'}`}
                              title={`${t('matchday.move_to')} ${targetTeam}`}
                            >
                              {targetTeam}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unassigned */}
          <div 
            className="mt-2 hallmark-card p-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (currentMatch.status === 'finished') return;
              const playerId = e.dataTransfer.getData('playerId');
              if (playerId) handleMoveTeam(playerId, null);
            }}
          >
            <h4 className="font-display text-sm uppercase text-text-muted tracking-widest mb-3">{t('matchday.unassigned')} ({presentPlayers.filter(p => !getPlayerTeam(p.id)).length})</h4>
            <div className="flex flex-col gap-2">
              {presentPlayers.filter(p => !getPlayerTeam(p.id)).map(p => (
                <div 
                  key={p.id} 
                  draggable={currentMatch.status !== 'finished'}
                  onDragStart={(e) => e.dataTransfer.setData('playerId', p.id)}
                  className="flex items-center justify-between bg-surface border border-border-main cursor-grab active:cursor-grabbing w-full"
                >
                  <span className="font-bold text-text-main text-sm px-3 py-2 uppercase truncate">{p.name}</span>
                  <div className="flex shrink-0 ml-auto @md:hidden">
                    {(['A', 'B', 'C', 'D'] as const).map(team => {
                      if (team === 'C' && (currentMatch.teamCount || 2) < 3) return null;
                      if (team === 'D' && (currentMatch.teamCount || 2) < 4) return null;
                      
                      return (
                        <button 
                          key={team}
                          disabled={currentMatch.status === 'finished'} 
                          onClick={() => handleMoveTeam(p.id, team)} 
                          className={`text-xs font-bold text-text-muted hover:text-primary px-3 py-2 border-l border-border-main transition-colors ${currentMatch.status === 'finished' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/10'}`}
                        >
                          {team}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE MATCH MODAL */}
      <BottomSheet
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={
          <span className="flex items-center gap-2">
            <Plus size={24} /> {t('matchday.create_new')}
          </span>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.match_type_label') || 'Loại trận đấu'}</label>
            <CustomSelect
              value={newMatchData.matchType}
              onChange={val => setNewMatchData({ ...newMatchData, matchType: val as any })}
              options={[
                { value: 'internal', label: t('matchday.type_internal') },
                { value: 'friendly', label: t('matchday.type_friendly') }
              ]}
            />
          </div>

          {newMatchData.matchType === 'internal' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.team_count_label')}</label>
              <div className="flex border border-border-main overflow-hidden">
                {([2, 3, 4] as const).map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setNewMatchData({ ...newMatchData, teamCount: count })}
                    className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wider transition-all ${
                      newMatchData.teamCount === count
                        ? 'bg-primary text-white'
                        : 'bg-surface text-text-muted hover:bg-surface-2'
                    }`}
                  >
                    {count} {t('matchday.team_count_unit')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {newMatchData.matchType !== 'internal' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.opponent_label') || 'Tên Đối thủ'}</label>
              <Autocomplete
                value={newMatchData.opponent}
                onChange={(val) => setNewMatchData({ ...newMatchData, opponent: val })}
                options={pastOpponents}
                placeholder={t('matchday.opponent_placeholder') || 'Nhập tên đối thủ...'}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <CustomDatePicker
              value={newMatchData.date}
              onChange={d => setNewMatchData({ ...newMatchData, date: d })}
            />
            <CustomTimePicker
              value={newMatchData.time}
              onChange={t => setNewMatchData({ ...newMatchData, time: t })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.venue_label') || 'Sân bóng'}</label>
            <Autocomplete
              value={newMatchData.location}
              onChange={(val) => setNewMatchData({ ...newMatchData, location: val })}
              options={venues.map(v => v.name)}
              placeholder={t('matchday.venue_placeholder') || 'Nhập tên sân bóng...'}
            />
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-[#323d29] transition-colors active:scale-95">
              {t('matchday.create_btn') || 'TẠO TRẬN ĐẤU'}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* EDIT MATCH MODAL */}
      <BottomSheet
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={
          <span className="flex items-center gap-2">
            <Edit2 size={24} /> {t('matchday.match_info')}
          </span>
        }
      >
        <div className="space-y-4 pr-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.match_type_label') || 'Loại trận'}</label>
            <CustomSelect
              value={editInfo.matchType}
              onChange={val => setEditInfo({ ...editInfo, matchType: val as any })}
              options={[
                { value: 'internal', label: t('matchday.type_internal') },
                { value: 'friendly', label: t('matchday.type_friendly') }
              ]}
            />
          </div>

          {editInfo.matchType === 'internal' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.team_count_label')}</label>
              <div className="flex border border-border-main overflow-hidden">
                {([2, 3, 4] as const).map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setEditInfo({ ...editInfo, teamCount: count })}
                    className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wider transition-all ${
                      (editInfo.teamCount || 2) === count
                        ? 'bg-primary text-white'
                        : 'bg-surface text-text-muted hover:bg-surface-2'
                    }`}
                  >
                    {count} {t('matchday.team_count_unit')}
                  </button>
                ))}
              </div>
            </div>
          )}


          {editInfo.matchType !== 'internal' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.opponent_label') || 'Đối thủ'}</label>
              <Autocomplete
                value={editInfo.opponent}
                onChange={(val) => setEditInfo({ ...editInfo, opponent: val })}
                options={pastOpponents}
                placeholder={t('matchday.opponent_placeholder') || 'Nhập tên đối thủ...'}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <CustomDatePicker
              value={editInfo.date}
              onChange={d => setEditInfo({ ...editInfo, date: d })}
            />
            <CustomTimePicker
              value={editInfo.time}
              onChange={t => setEditInfo({ ...editInfo, time: t })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{t('matchday.venue_label') || 'Sân bóng'}</label>
            <Autocomplete
              value={editInfo.location || ''}
              onChange={(val) => setEditInfo({ ...editInfo, location: val })}
              options={venues.map(v => v.name)}
              placeholder={t('matchday.venue_placeholder') || 'Nhập tên sân bóng...'}
            />
          </div>
        </div>

        <div className="pt-6 shrink-0 mt-4">
          <button onClick={handleEditSave} className="w-full bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-[#323d29] transition-colors active:scale-95">
            {t('matchday.save_info')}
          </button>
        </div>
      </BottomSheet>

      {/* END MATCH CONFIRMATION MODAL */}
      <BottomSheet
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        title={
          <span className="flex items-center gap-2">
            {t('matchday.end_match_caps')}
          </span>
        }
        maxWidth="3xl"
      >
        <div className="space-y-5 text-center">
          <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            {t('matchday.confirm_end_match')}
          </p>

          {/* Read-Only Score Banner */}
          {currentMatch && (
            <div className="bg-surface-2 p-4 sm:p-5 border-2 border-border-main shadow-lg">
              {currentMatch.matchType === 'internal' ? (
                <div className={`grid gap-2.5 w-full ${
                  (currentMatch.teamCount || 2) === 2 ? 'grid-cols-2 max-w-xs mx-auto' : 
                  (currentMatch.teamCount || 2) === 3 ? 'grid-cols-3' : 
                  'grid-cols-2 sm:grid-cols-4'
                }`}>
                  {(['A', 'B', 'C', 'D'] as const).slice(0, currentMatch.teamCount || 2).map((team) => {
                    const scoreField = `scoreTeam${team}` as keyof typeof currentMatch;
                    const colorField = `team${team}Color` as keyof typeof currentMatch;
                    return (
                      <div key={team} className="bg-surface border-2 border-border-main p-2.5 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5 truncate max-w-full">
                          {t(`matchday.team_${team.toLowerCase()}`)} ({getBibColorLabel(currentMatch[colorField] as string)})
                        </span>
                        <span className={`text-3xl sm:text-4xl font-display font-bold ${team === 'A' ? 'text-primary' : 'text-text-main'}`}>
                          {Number(currentMatch[scoreField] ?? 0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-around">
                  <div>
                    <div className="text-xs font-bold text-secondary mb-1">{(settings.teamName || '5TactiQ').toUpperCase()}</div>
                    <div className="text-5xl font-display text-primary">{currentMatch.scoreUs ?? 0}</div>
                  </div>
                  <div className="text-4xl font-display text-text-muted opacity-40">-</div>
                  <div>
                    <div className="text-xs font-bold text-text-muted mb-1">{currentMatch.opponent || t('matchday.opponent_placeholder')}</div>
                    <div className="text-5xl font-display text-text-main">{currentMatch.scoreOpponent ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-xs font-medium text-text-muted">
            {t('matchday.end_match_warning')}
          </p>
        </div>

        <div className="pt-6 flex gap-3 mt-2">
          <button
            type="button"
            onClick={() => setShowEndModal(false)}
            className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-slate-300 hover:bg-surface transition-colors active:scale-95"
          >
            {t('matchday.cancel')}
          </button>
          <button
            type="button"
            onClick={() => {
              endMatch(currentMatch!.id, {
                scoreUs: currentMatch!.matchType !== 'internal' ? currentMatch!.scoreUs : null,
                scoreOpponent: currentMatch!.matchType !== 'internal' ? currentMatch!.scoreOpponent : null,
                scoreTeamA: currentMatch!.matchType === 'internal' ? currentMatch!.scoreTeamA : null,
                scoreTeamB: currentMatch!.matchType === 'internal' ? currentMatch!.scoreTeamB : null,
                scoreTeamC: currentMatch!.matchType === 'internal' ? currentMatch!.scoreTeamC : null,
                scoreTeamD: currentMatch!.matchType === 'internal' ? currentMatch!.scoreTeamD : null,
              });
              setShowEndModal(false);
            }}
            className="flex-1 bg-secondary text-white font-display uppercase tracking-wider py-3 border-2 border-secondary hover:bg-amber-600 transition-colors active:scale-95"
          >
            {t('matchday.end_now')}
          </button>
        </div>
      </BottomSheet>

      {/* LIVE UPDATE MODAL */}
      <BottomSheet
        isOpen={showLiveUpdateModal}
        onClose={() => setShowLiveUpdateModal(false)}
        title={t('matchday.update_match_progress')}
        noScroll
        maxWidth="3xl"
      >
        {currentMatch && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 space-y-4 sm:space-y-6 overflow-y-auto pr-1 hide-scrollbar">
              {/* Score Editor Section */}
              <div className="bg-surface-2 p-4 sm:p-6 border-2 border-border-main text-center shadow-lg">
                <div className="text-xs font-display uppercase tracking-widest text-primary mb-3 font-bold flex items-center justify-center gap-1.5">
                  {t('matchday.match_score')}
                </div>

                {currentMatch.matchType === 'internal' ? (
                  <div className="flex flex-col items-center gap-6 w-full pb-2 px-1">
                    {[
                      ['A', 'B'],
                      ['C', 'D']
                    ].map((row, rowIdx) => {
                      if (rowIdx === 1 && (currentMatch.teamCount || 2) < 3) return null;
                      
                      return (
                        <div key={rowIdx} className="flex justify-center items-center gap-3 sm:gap-6 w-full">
                          {row.map((team, idx) => {
                            if (team === 'C' && (currentMatch.teamCount || 2) < 3) return null;
                            if (team === 'D' && (currentMatch.teamCount || 2) < 4) return null;
                            const scoreField = `scoreTeam${team}` as keyof typeof liveData;
                            const colorField = `team${team}Color` as keyof typeof currentMatch;
                            
                            return (
                              <div key={team} className="flex items-center gap-3 sm:gap-6">
                                {idx > 0 && <span className="text-2xl sm:text-3xl font-display text-text-muted px-1">-</span>}
                                <div className="flex flex-col items-center gap-1 sm:gap-2">
                                  <span className="text-[10px] sm:text-xs font-bold text-text-muted">{t(`matchday.team_${team.toLowerCase()}`)} ({getBibColorLabel(currentMatch[colorField] as string)})</span>
                                  <div className="flex items-center gap-1.5 sm:gap-3">
                                    <button
                                      type="button"
                                      onClick={() => setLiveData(prev => ({ ...prev, [scoreField]: Math.max(0, (prev[scoreField] as number) - 1) }))}
                                      className="w-8 h-8 sm:w-10 sm:h-10 bg-surface hover:bg-surface-2 text-text-main font-display text-xl sm:text-2xl font-bold border border-border-main flex items-center justify-center shrink-0"
                                    >
                                      -
                                    </button>
                                    <span className={`text-4xl sm:text-5xl font-display w-10 sm:w-12 text-center ${team === 'A' ? 'text-primary' : 'text-text-main'}`}>{liveData[scoreField]}</span>
                                    <button
                                      type="button"
                                      onClick={() => setLiveData(prev => ({ ...prev, [scoreField]: (prev[scoreField] as number) + 1 }))}
                                      className={`w-8 h-8 sm:w-10 sm:h-10 text-white font-display text-xl sm:text-2xl font-bold flex items-center justify-center shrink-0 hover:opacity-90 ${team === 'A' ? 'bg-primary' : team === 'B' ? 'bg-secondary' : team === 'C' ? 'bg-emerald-700' : 'bg-amber-600'}`}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex justify-around items-center">
                    {/* 5TactiQ */}
                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                      <span className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-wider">{(settings.teamName || '5TactiQ').toUpperCase()}</span>
                      <div className="flex items-center gap-1.5 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => setLiveData(prev => ({ ...prev, scoreUs: Math.max(0, prev.scoreUs - 1) }))}
                          className="w-8 h-8 sm:w-10 sm:h-10 bg-surface hover:bg-surface-2 text-text-main font-display text-xl sm:text-2xl font-bold border border-border-main flex items-center justify-center shrink-0"
                        >
                          -
                        </button>
                        <span className="text-4xl sm:text-5xl font-display text-primary w-10 sm:w-12 text-center">{liveData.scoreUs}</span>
                        <button
                          type="button"
                          onClick={() => setLiveData(prev => ({ ...prev, scoreUs: prev.scoreUs + 1 }))}
                          className="w-8 h-8 sm:w-10 sm:h-10 bg-primary text-white font-display text-xl sm:text-2xl font-bold hover:bg-primary/90 flex items-center justify-center shrink-0"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <span className="text-2xl sm:text-3xl font-display text-text-muted px-1">-</span>

                    {/* Opponent */}
                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                      <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">{currentMatch.opponent || t('matchday.opponent_placeholder')}</span>
                      <div className="flex items-center gap-1.5 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => setLiveData(prev => ({ ...prev, scoreOpponent: Math.max(0, prev.scoreOpponent - 1) }))}
                          className="w-8 h-8 sm:w-10 sm:h-10 bg-surface hover:bg-surface-2 text-text-main font-display text-xl sm:text-2xl font-bold border border-border-main flex items-center justify-center shrink-0"
                        >
                          -
                        </button>
                        <span className="text-4xl sm:text-5xl font-display text-text-main w-10 sm:w-12 text-center">{liveData.scoreOpponent}</span>
                        <button
                          type="button"
                          onClick={() => setLiveData(prev => ({ ...prev, scoreOpponent: prev.scoreOpponent + 1 }))}
                          className="w-8 h-8 sm:w-10 sm:h-10 bg-primary text-white font-display text-xl sm:text-2xl font-bold hover:bg-primary/90 flex items-center justify-center shrink-0"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Player Goals & Assists Logging */}
              <div>
                <h4 className="text-xs font-display uppercase tracking-widest text-primary mb-3 font-bold flex items-center gap-1.5">
                  {t('matchday.goals_assists_direct')}
                </h4>

                {players.filter(p => currentMatch?.attendance?.[p.id] === 'present').length === 0 ? (
                  <div className="text-center text-slate-400 py-4">{t('matchday.no_players_yet')}</div>
                ) : (
                  <div className="space-y-2.5">
                    {players.filter(p => currentMatch?.attendance?.[p.id] === 'present').map((p) => {
                      const stat = liveStatsMap[p.id] || { goals: 0, assists: 0 };
                      return (
                        <div key={p.id} className="p-2.5 sm:p-3 bg-surface border-2 border-border-main flex items-center justify-between gap-3 hover:border-primary/40 transition-colors">
                          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                            <span className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-surface-2 text-text-muted border border-border-main font-display text-xs font-bold shrink-0">
                              {p.jersey_number || '?'}
                            </span>
                            <span className="font-bold text-sm sm:text-base text-text-main leading-snug uppercase truncate" title={p.name}>
                              {p.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 ml-auto">
                            {/* Goals */}
                            <div className="flex shrink-0 justify-center items-center gap-1 sm:gap-1.5 bg-surface-2 px-1.5 sm:px-2.5 py-1 border border-border-main shadow-sm">
                              <span className="text-[10px] sm:text-xs font-bold text-text-muted">{t('matchday.goals_short')}</span>
                              <button
                                type="button"
                                onClick={() => handleLiveGoalChange(p, false)}
                                className="w-6 h-6 sm:w-7 sm:h-7 bg-surface hover:bg-surface-2 font-bold border border-border-main text-text-main flex items-center justify-center text-xs sm:text-sm shrink-0"
                              >
                                -
                              </button>
                              <span className="w-4 sm:w-6 text-center font-display text-base sm:text-lg text-primary font-bold">{stat.goals}</span>
                              <button
                                type="button"
                                onClick={() => handleLiveGoalChange(p, true)}
                                className="w-6 h-6 sm:w-7 sm:h-7 bg-primary text-white font-bold hover:bg-emerald-800 flex items-center justify-center text-xs sm:text-sm shrink-0"
                              >
                                +
                              </button>
                            </div>

                            {/* Assists */}
                            <div className="flex shrink-0 justify-center items-center gap-1 sm:gap-1.5 bg-surface-2 px-1.5 sm:px-2.5 py-1 border border-border-main shadow-sm">
                              <span className="text-[10px] sm:text-xs font-bold text-text-muted">{t('matchday.assists_short')}</span>
                              <button
                                type="button"
                                onClick={() => setLiveStatsMap(prev => ({
                                  ...prev,
                                  [p.id]: { ...stat, assists: Math.max(0, stat.assists - 1) }
                                }))}
                                className="w-6 h-6 sm:w-7 sm:h-7 bg-surface hover:bg-surface-2 font-bold border border-border-main text-text-main flex items-center justify-center text-xs sm:text-sm shrink-0"
                              >
                                -
                              </button>
                              <span className="w-4 sm:w-6 text-center font-display text-base sm:text-lg text-secondary font-bold">{stat.assists}</span>
                              <button
                                type="button"
                                onClick={() => setLiveStatsMap(prev => ({
                                  ...prev,
                                  [p.id]: { ...stat, assists: stat.assists + 1 }
                                }))}
                                className="w-6 h-6 sm:w-7 sm:h-7 bg-secondary text-white font-bold hover:bg-amber-600 flex items-center justify-center text-xs sm:text-sm shrink-0"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 shrink-0 mt-2">
              <button
                type="button"
                onClick={handleSaveLiveUpdate}
                className="w-full bg-secondary text-white font-display uppercase tracking-wider py-3 border-2 border-secondary hover:bg-[#d05c21] transition-colors active:scale-95"
              >
                {t('matchday.save_match_update')}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* DELETE CONFIRMATION MODAL */}
      <BottomSheet
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        variant="danger"
        title={
          <span className="flex items-center gap-2">
            <Trash2 size={24} /> {t('matchday.delete_match')}
          </span>
        }
      >
        <div className="space-y-5 text-center">
          <p className="text-base font-bold text-text-main uppercase tracking-wide">
            {t('matchday.confirm_delete_match')}
          </p>

          {/* Match Card Preview */}
          {currentMatch && (
            <div className="bg-surface-2 p-4 border-2 border-rose-500/40">
              <div className="text-xs font-display text-text-muted font-bold uppercase mb-1">
                {currentMatch.matchType === 'internal' ? t('matchday.internal_match_caps') : t('matchday.friendly_match_caps')}
              </div>
              <div className="text-2xl font-display text-text-main uppercase font-bold">
                {currentMatch.matchType === 'internal' ? t('matchday.internal_match_caps') : `VS ${currentMatch.opponent || t('matchday.opponent_placeholder').toUpperCase()}`}
              </div>
              <div className="text-xs text-text-muted font-bold mt-1 text-center">
                {formatDateDDMMYYYY(currentMatch.date)} • {currentMatch.time}
              </div>
            </div>
          )}

          <p className="text-xs font-semibold text-rose-500 bg-rose-500/10 p-2.5 border border-rose-500/20">
            {t('matchday.delete_match_warning')}
          </p>
        </div>

        <div className="pt-6 flex gap-3 mt-4">
          <button
            type="button"
            onClick={() => setShowDeleteConfirmModal(false)}
            className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-border-main hover:bg-surface-2 transition-colors active:scale-95"
          >
            {t('matchday.cancel')}
          </button>
          <button
            type="button"
            onClick={() => {
              deleteMatch(currentMatch!.id);
              setShowDeleteConfirmModal(false);
            }}
            className="flex-1 bg-rose-600 text-white font-display uppercase tracking-wider py-3 border-2 border-rose-700 hover:bg-rose-700 transition-colors active:scale-95"
          >
            {t('matchday.delete_match')}
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={bibColorSelection !== null}
        onClose={() => setBibColorSelection(null)}
        title={
          bibColorSelection === 'A' ? t('matchday.team_a') :
          bibColorSelection === 'B' ? t('matchday.team_b') :
          bibColorSelection === 'C' ? (t('matchday.team_c') || 'TEAM C') :
          (t('matchday.team_d') || 'TEAM D')
        }
      >
        <div className="flex flex-col gap-2">
          {['Đỏ', 'Xanh', 'Trắng', 'Không Bib'].map(color => (
            <button
              key={color}
              onClick={() => {
                if (bibColorSelection) {
                  updateMatchInfo({ [`team${bibColorSelection}Color`]: color });
                }
                setBibColorSelection(null);
              }}
              className={`p-4 text-center font-display text-xl uppercase border-2 ${(bibColorSelection && currentMatch?.[`team${bibColorSelection}Color` as keyof typeof currentMatch] === color) ? 'border-primary bg-primary/10 text-primary' : 'border-border-main hover:bg-surface-2 text-text-main'}`}
            >
              {getBibColorLabel(color)}
            </button>
          ))}
        </div>
      </BottomSheet>


      <datalist id="opponent-suggestions">
        {pastOpponents.map(opp => (
          <option key={opp} value={opp} />
        ))}
      </datalist>

      <datalist id="venue-suggestions">
        {venues.map(v => (
          <option key={v.id} value={v.name} />
        ))}
      </datalist>
    </div>
  );
}
