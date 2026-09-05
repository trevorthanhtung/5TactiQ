import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trophy, 
  Trash2, Shield, X, CalendarClock, MapPin, Pencil
} from 'lucide-react';
import { useTournamentStore } from '../store/useTournamentStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useMatchStore } from '../store/useMatchStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { TournamentSkeleton } from '../components/ui/TournamentSkeleton';
import { BottomSheet } from '../components/ui/BottomSheet';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { OptionPickerModal } from '../components/OptionPickerModal';
import { useToastStore } from '../store/useToastStore';
import { useTranslation } from 'react-i18next';
import { isPlayerEligibleForStats } from '../utils/playerUtils';
import { compareVietnameseNames } from '../utils/sortUtils';
import type { Tournament, TournamentMatch, TournamentTeam, MatchInfo, Player } from '../types';

interface StandingRow {
  teamId: string;
  teamName: string;
  isOurTeam: boolean;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export default function Tournaments() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const { settings, updateSettings } = useSettingsStore();
  const ourTeamName = settings.teamName || 'Đội nhà';

  const { matches: matchStoreMatches, selectMatch, updateLiveMatch, deleteMatch: deleteMatchStoreMatch } = useMatchStore();
  const { players } = usePlayerStore();

  const {
    tournaments,
    activeTournamentId,
    setActiveTournament,
    addTournament,
    updateTournament,
    deleteTournament,
    addTeam,
    updateTeam,
    deleteTeam,
    updateMatch,
    deleteMatch
  } = useTournamentStore();

  const activeTournament = useMemo(() => {
    if (activeTournamentId) {
      return tournaments.find(t => t.id === activeTournamentId) || tournaments[0] || null;
    }
    return tournaments[0] || null;
  }, [tournaments, activeTournamentId]);

  const [activeTab, setActiveTab] = useState<'standings' | 'matches' | 'stats'>('standings');
  const [statTab, setStatTab] = useState<'goals' | 'assists' | 'attendance'>('goals');

  // Modals
  const [showCreateTourModal, setShowCreateTourModal] = useState(false);
  const [showEditTourModal, setShowEditTourModal] = useState(false);
  const [showDeleteTourModal, setShowDeleteTourModal] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<TournamentMatch | null>(null);

  // Edit Tournament Form State
  const [editTourData, setEditTourData] = useState({
    name: '',
    season: new Date().getFullYear().toString(),
    format: 'league' as 'league' | 'knockout' | 'combined',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // New Tournament Form State
  const [newTourData, setNewTourData] = useState({
    name: '',
    season: new Date().getFullYear().toString(),
    format: 'league' as 'league' | 'knockout' | 'combined',
    opponents: [] as string[],
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [opponentInput, setOpponentInput] = useState('');

  // All tournament teams: includes explicit teams + opponents played in Matchday for this tournament
  const allTournamentTeams = useMemo<TournamentTeam[]>(() => {
    if (!activeTournament) return [];
    const tourNameLower = activeTournament.name.trim().toLowerCase();

    // Filter out any team that was mistakenly added with the tournament's own name or 'đối thủ'
    const teams: TournamentTeam[] = activeTournament.teams.filter(t => 
      t.name.trim().toLowerCase() !== tourNameLower && 
      t.name.trim().toLowerCase() !== 'đối thủ'
    );

    // Ensure our team is always present
    let ourTeam = teams.find(t => t.isOurTeam) || teams.find(t => t.name.toLowerCase() === ourTeamName.toLowerCase());
    if (!ourTeam) {
      ourTeam = {
        id: 'our_team_default',
        name: ourTeamName,
        isOurTeam: true
      };
      teams.unshift(ourTeam);
    } else {
      ourTeam.isOurTeam = true;
    }

    // Auto-discover opponents from Matchday matches belonging to this tournament
    matchStoreMatches.forEach(m => {
      const isForTour = m.matchType === 'tournament' && 
        (m.tournamentId === activeTournament.id || (m.tournamentName && m.tournamentName.trim().toLowerCase() === tourNameLower));
      if (!isForTour) return;

      const oppName = (m.opponent || '').trim();
      if (!oppName || oppName.toLowerCase() === tourNameLower || oppName.toLowerCase() === 'đối thủ') return;

      const exists = teams.some(t => t.name.toLowerCase() === oppName.toLowerCase());
      if (!exists) {
        teams.push({
          id: `opp_${oppName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: oppName,
          isOurTeam: false
        });
      }
    });

    return teams.slice(0, 4);
  }, [activeTournament, matchStoreMatches, ourTeamName]);

  // Combined matches (matches from tournament store + matches played in Matchday for this tournament)
  const allTournamentMatches = useMemo(() => {
    if (!activeTournament) return [];
    const list: (TournamentMatch & { rawMatch?: any })[] = [...activeTournament.matches];

    const ourTeam = allTournamentTeams.find(t => t.isOurTeam) || allTournamentTeams[0];
    if (!ourTeam) return list;

    matchStoreMatches.forEach(m => {
      const isForTour = m.matchType === 'tournament' && 
        (m.tournamentId === activeTournament.id || (m.tournamentName && m.tournamentName.trim().toLowerCase() === activeTournament.name.trim().toLowerCase()));
      if (!isForTour) return;

      const mRound = (m.round || 'Vòng 1').trim();
      const alreadyExists = activeTournament.matches.some(tm => 
        tm.date === m.date && (tm.round || '').trim().toLowerCase() === mRound.toLowerCase()
      );
      if (alreadyExists) return;

      const homeScoreVal = m.scoreTeamA ?? m.scoreUs;
      const awayScoreVal = m.scoreTeamB ?? m.scoreOpponent;

      list.push({
        id: `matchstore_${m.id}`,
        round: mRound,
        homeTeamId: allTournamentTeams[0]?.id || ourTeam.id,
        awayTeamId: allTournamentTeams[1]?.id || 'opp_team',
        homeScore: m.status === 'finished' ? (homeScoreVal ?? 0) : null,
        awayScore: m.status === 'finished' ? (awayScoreVal ?? 0) : null,
        date: m.date,
        time: m.time,
        venue: m.location,
        status: m.status === 'finished' ? 'finished' : 'scheduled',
        rawMatch: m
      });
    });

    return list;
  }, [activeTournament, allTournamentTeams, matchStoreMatches]);

  const handleAddOpponent = () => {
    if (!opponentInput.trim()) return;
    if (newTourData.opponents.length >= 3) {
      addToast({
        type: 'warning',
        message: 'Giải đấu nội bộ giới hạn tối đa 4 đội (1 đội nhà + 3 đối thủ)'
      });
      return;
    }
    const rawNames = opponentInput
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const availableSlots = 3 - newTourData.opponents.length;
    const uniqueNew = rawNames.filter(name => 
      name.toLowerCase() !== ourTeamName.toLowerCase() && 
      !newTourData.opponents.some(o => o.toLowerCase() === name.toLowerCase())
    ).slice(0, availableSlots);

    if (uniqueNew.length > 0) {
      setNewTourData(prev => ({
        ...prev,
        opponents: [...prev.opponents, ...uniqueNew]
      }));
    } else if (rawNames.length > 0 && availableSlots <= 0) {
      addToast({
        type: 'warning',
        message: 'Đã đạt giới hạn tối đa 4 đội cho giải đấu nội bộ'
      });
    }
    setOpponentInput('');
  };

  const handleRemoveOpponent = (indexToRemove: number) => {
    setNewTourData(prev => ({
      ...prev,
      opponents: prev.opponents.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState('');

  // Editing Team State (Modal Chỉnh sửa / Xóa đội)
  const [editingTeam, setEditingTeam] = useState<{
    id: string;
    name: string;
    isOurTeam: boolean;
  } | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleOpenEditTeam = (teamId: string, teamName: string, isOurTeam?: boolean) => {
    if (isOurTeam) return;
    setEditingTeam({ id: teamId, name: teamName, isOurTeam: false });
    setEditTeamName(teamName);
    setShowDeleteConfirm(false);
  };

  // Score Update State
  const [scoreData, setScoreData] = useState<{
    homeScore: string | number;
    awayScore: string | number;
  }>({
    homeScore: '',
    awayScore: ''
  });

  // Calculate Standings Table from Matches
  const standings = useMemo<StandingRow[]>(() => {
    if (!activeTournament) return [];

    const statsMap: Record<string, StandingRow> = {};

    // Initialize map with all teams (including auto-discovered opponents)
    allTournamentTeams.forEach(team => {
      statsMap[team.id] = {
        teamId: team.id,
        teamName: team.name,
        isOurTeam: !!team.isOurTeam,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0
      };
    });

    // Process finished matches
    allTournamentMatches.forEach(match => {
      if (match.status === 'finished' && match.homeScore !== null && match.awayScore !== null) {
        const homeStats = statsMap[match.homeTeamId];
        const awayStats = statsMap[match.awayTeamId];

        if (homeStats && awayStats) {
          homeStats.played += 1;
          awayStats.played += 1;

          homeStats.goalsFor += match.homeScore;
          homeStats.goalsAgainst += match.awayScore;
          homeStats.goalDiff = homeStats.goalsFor - homeStats.goalsAgainst;

          awayStats.goalsFor += match.awayScore;
          awayStats.goalsAgainst += match.homeScore;
          awayStats.goalDiff = awayStats.goalsFor - awayStats.goalsAgainst;

          if (match.homeScore > match.awayScore) {
            homeStats.won += 1;
            homeStats.points += 3;
            awayStats.lost += 1;
          } else if (match.homeScore < match.awayScore) {
            awayStats.won += 1;
            awayStats.points += 3;
            homeStats.lost += 1;
          } else {
            homeStats.drawn += 1;
            homeStats.points += 1;
            awayStats.drawn += 1;
            awayStats.points += 1;
          }
        }
      }
    });

    // Sort by Points -> Goal Difference -> Goals For -> Name
    return Object.values(statsMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.teamName.localeCompare(b.teamName);
    });
  }, [activeTournament, allTournamentTeams, allTournamentMatches]);

  // Filter eligible players (exclude NPCs and non-eligible members)
  const eligiblePlayers = useMemo(() => {
    return players.filter(p => !p.isNPC && isPlayerEligibleForStats(p));
  }, [players]);

  // Aggregate stats: ONLY calculate for finished matches belonging to this tournament (m.matchType === 'tournament')
  const playerStatsAgg = useMemo(() => {
    const agg: Record<string, { goals: number; assists: number; attendance: number }> = {};
    eligiblePlayers.forEach(p => {
      agg[p.id] = { goals: 0, assists: 0, attendance: 0 };
    });

    if (!activeTournament) return agg;

    const tourMatches = matchStoreMatches.filter(m => {
      const isForTour = m.matchType === 'tournament' && 
        (m.tournamentId === activeTournament.id || (m.tournamentName && m.tournamentName.trim().toLowerCase() === activeTournament.name.trim().toLowerCase()));
      return isForTour && m.status === 'finished';
    });

    tourMatches.forEach(m => {
      if (m.attendance) {
        Object.entries(m.attendance).forEach(([playerId, status]) => {
          if (status === 'present' && agg[playerId]) {
            agg[playerId].attendance += 1;
          }
        });
      }

      if (m.stats) {
        m.stats.forEach(s => {
          if (agg[s.playerId]) {
            agg[s.playerId].goals += s.goals || 0;
            agg[s.playerId].assists += s.assists || 0;
          }
        });
      }
    });

    return agg;
  }, [activeTournament, matchStoreMatches, eligiblePlayers]);

  const sortedTournamentPlayers = useMemo(() => {
    const list = eligiblePlayers.map(p => ({
      player: p,
      goals: playerStatsAgg[p.id]?.goals || 0,
      assists: playerStatsAgg[p.id]?.assists || 0,
      attendance: playerStatsAgg[p.id]?.attendance || 0,
    }));

    list.sort((a, b) => {
      if (b[statTab] !== a[statTab]) {
        return b[statTab] - a[statTab];
      }
      if (statTab === 'goals') {
        if (b.assists !== a.assists) return b.assists - a.assists;
        if (b.attendance !== a.attendance) return b.attendance - a.attendance;
      } else if (statTab === 'assists') {
        if (b.goals !== a.goals) return b.goals - a.goals;
        if (b.attendance !== a.attendance) return b.attendance - a.attendance;
      } else if (statTab === 'attendance') {
        if (b.goals !== a.goals) return b.goals - a.goals;
        if (b.assists !== a.assists) return b.assists - a.assists;
      }
      return compareVietnameseNames(a.player.name, b.player.name);
    });

    // Only return players who have recorded stats > 0 in this tournament
    const activeList = list.filter(item => item[statTab] > 0);
    return activeList;
  }, [eligiblePlayers, playerStatsAgg, statTab]);

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourData.name.trim()) return;

    const initialOpponents = [...newTourData.opponents];
    if (opponentInput.trim() && initialOpponents.length < 3) {
      const extra = opponentInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      extra.forEach(name => {
        if (!initialOpponents.includes(name) && name.toLowerCase() !== ourTeamName.toLowerCase() && initialOpponents.length < 3) {
          initialOpponents.push(name);
        }
      });
    }

    addTournament({
      name: newTourData.name.trim(),
      season: newTourData.season,
      format: newTourData.format,
      status: 'ongoing',
      startDate: newTourData.startDate,
      notes: newTourData.notes,
      initialOpponents
    }, ourTeamName);

    setShowCreateTourModal(false);
    setNewTourData({
      name: '',
      season: new Date().getFullYear().toString(),
      format: 'league',
      opponents: [],
      startDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setOpponentInput('');
  };

  const handleOpenEditTour = () => {
    if (!activeTournament) return;
    setEditTourData({
      name: activeTournament.name,
      season: activeTournament.season || new Date().getFullYear().toString(),
      format: activeTournament.format || 'league',
      startDate: activeTournament.startDate || new Date().toISOString().split('T')[0],
      notes: activeTournament.notes || ''
    });
    setShowEditTourModal(true);
  };

  const handleSaveEditTour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTournament || !editTourData.name.trim()) return;

    updateTournament(activeTournament.id, {
      name: editTourData.name.trim(),
      season: editTourData.season.trim(),
      format: editTourData.format,
      startDate: editTourData.startDate,
      notes: editTourData.notes.trim()
    });

    addToast({
      type: 'success',
      message: `Đã cập nhật giải đấu "${editTourData.name.trim()}"`
    });
    setShowEditTourModal(false);
  };

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTournament || !newTeamName.trim()) return;
    if (allTournamentTeams.length >= 4) {
      addToast({
        type: 'warning',
        message: 'Giải đấu nội bộ giới hạn tối đa 4 đội'
      });
      setShowAddTeamModal(false);
      return;
    }
    addTeam(activeTournament.id, newTeamName.trim(), false);
    setNewTeamName('');
    setShowAddTeamModal(false);
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTournament || !editingTeam || !editTeamName.trim() || editingTeam.isOurTeam) return;
    const trimmed = editTeamName.trim();
    const oldName = editingTeam.name;

    const existing = activeTournament.teams.find(t => t.id === editingTeam.id || t.name.toLowerCase() === oldName.toLowerCase());
    if (existing) {
      updateTeam(activeTournament.id, existing.id, trimmed);
    } else {
      addTeam(activeTournament.id, trimmed, false);
    }

    // Đồng bộ các trận đấu đã lưu trong matchStore
    matchStoreMatches.forEach(m => {
      const isForTour = m.matchType === 'tournament' &&
        (m.tournamentId === activeTournament.id || (m.tournamentName && m.tournamentName.trim().toLowerCase() === activeTournament.name.trim().toLowerCase()));
      if (isForTour && m.opponent && m.opponent.trim().toLowerCase() === oldName.trim().toLowerCase()) {
        updateLiveMatch(m.id, { opponent: trimmed });
      }
    });

    addToast({
      type: 'success',
      message: `Đã đổi tên đội thành "${trimmed}"`
    });

    setEditingTeam(null);
  };

  const handleDeleteTeam = () => {
    if (!activeTournament || !editingTeam) return;
    if (editingTeam.isOurTeam) {
      addToast({
        type: 'warning',
        message: 'Không thể xóa đội nhà khỏi giải đấu'
      });
      return;
    }

    const teamToDelete = editingTeam;
    const oldName = teamToDelete.name;

    // Xóa khỏi tournament store
    const existing = activeTournament.teams.find(t => t.id === teamToDelete.id || t.name.toLowerCase() === oldName.toLowerCase());
    if (existing) {
      deleteTeam(activeTournament.id, existing.id);
    }

    // Xóa các trận đấu tương ứng trong matchStore nếu có
    matchStoreMatches.forEach(m => {
      const isForTour = m.matchType === 'tournament' &&
        (m.tournamentId === activeTournament.id || (m.tournamentName && m.tournamentName.trim().toLowerCase() === activeTournament.name.trim().toLowerCase()));
      if (isForTour && m.opponent && m.opponent.trim().toLowerCase() === oldName.trim().toLowerCase()) {
        deleteMatchStoreMatch(m.id);
      }
    });

    addToast({
      type: 'success',
      message: `Đã xóa đội "${oldName}" khỏi giải đấu`
    });

    setEditingTeam(null);
    setShowDeleteConfirm(false);
  };

  const handleOpenScoreModal = (match: TournamentMatch) => {
    setEditingMatch(match);
    setScoreData({
      homeScore: match.homeScore !== null ? match.homeScore : 0,
      awayScore: match.awayScore !== null ? match.awayScore : 0
    });
  };

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTournament || !editingMatch) return;

    const hScore = Number(scoreData.homeScore);
    const aScore = Number(scoreData.awayScore);

    updateMatch(activeTournament.id, editingMatch.id, {
      homeScore: isNaN(hScore) ? null : hScore,
      awayScore: isNaN(aScore) ? null : aScore,
      status: 'finished'
    });

    setEditingMatch(null);
  };

  const getTeamName = (teamId: string) => {
    const team = allTournamentTeams.find(t => t.id === teamId);
    return team ? team.name : 'Đội bóng';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}/${m}/${y}`;
  };

  const formatRound = (round: string) => {
    if (!round) return '';
    const match = round.match(/^Vòng\s+(\d+)$/i);
    if (match) {
      return `${t('tournaments.round_prefix', 'Vòng')} ${match[1]}`;
    }
    return round;
  };

  const getFormatOptions = () => [
    { 
      value: 'league', 
      label: t('tournaments.format_league', 'Vòng tròn tính điểm'), 
      desc: t('tournaments.format_league_desc', 'Các đội đá vòng tròn tính điểm (3đ thắng, 1đ hòa)') 
    },
    { 
      value: 'knockout', 
      label: t('tournaments.format_knockout', 'Loại trực tiếp (Cúp)'), 
      desc: t('tournaments.format_knockout_desc', 'Đấu loại từng vòng trực tiếp đến chung kết') 
    },
    { 
      value: 'combined', 
      label: t('tournaments.format_combined', 'Vòng bảng + Knockout'), 
      desc: t('tournaments.format_combined_desc', 'Chia bảng đá điểm rồi vào bán kết/chung kết') 
    }
  ];

  if (isLoading) {
    return <TournamentSkeleton />;
  }

  return (
    <div className="p-3 sm:p-4 flex flex-col max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pt-1">
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={() => navigate('/more')}
            className="p-1.5 sm:p-2 text-primary hover:bg-primary/10 border-2 border-primary/30 hover:border-primary transition-all shrink-0"
            title={t('common.back_to_more', 'Trở về Thêm')}
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl md:text-3xl font-display uppercase text-primary leading-tight truncate">
              {t('tournaments.page_title', 'Giải Đấu & Cúp')}
            </h1>
          </div>
        </div>

        <button 
          onClick={() => setShowCreateTourModal(true)}
          className="hallmark-btn flex items-center justify-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold uppercase tracking-wider shrink-0 whitespace-nowrap active:scale-95"
        >
          <Plus size={15} /> <span>{t('tournaments.btn_new', 'Tạo giải')}</span>
        </button>
      </div>

      <div className="hallmark-divider mb-4"></div>

      {/* No Tournaments Empty State */}
      {tournaments.length === 0 ? (
        <div className="bg-surface border-2 border-dashed border-border-main p-8 sm:p-12 text-center my-4 sm:my-8">
          <Trophy size={48} className="mx-auto text-primary/40 mb-3" />
          <h3 className="font-display uppercase text-xl text-primary mb-2">
            {t('tournaments.no_tournaments_title', 'Chưa có giải đấu nào')}
          </h3>
          <p className="text-text-muted text-sm max-w-md mx-auto">
            {t('tournaments.no_tournaments_desc', 'Chưa có dữ liệu giải đấu. Bạn có thể bấm nút "Tạo giải" ở góc trên để bắt đầu theo dõi bảng xếp hạng và lịch thi đấu.')}
          </p>
        </div>
      ) : (
        <>
          {/* Tournament Selector Bar (2 dòng: dòng 1 chọn giải đấu, dòng 2 sửa & xóa) */}
          <div className="flex flex-col gap-2.5 mb-6 bg-surface p-3 border-2 border-border-main shadow-xs">
            {/* Dòng 1: Chọn giải đấu */}
            <div className="flex items-center gap-2 w-full">
              <label className="text-xs font-display uppercase tracking-wider text-text-muted shrink-0">
                {t('tournaments.selector_label', 'Giải đấu')}:
              </label>
              <div className="flex-1 min-w-0">
                <OptionPickerModal
                  value={activeTournament?.id || ''}
                  onChange={(id) => setActiveTournament(id)}
                  title={t('tournaments.select_tour_title', 'Chọn Giải Đấu')}
                  options={tournaments.map((t) => ({
                    value: t.id,
                    label: t.name,
                    badge: t.season,
                  }))}
                />
              </div>
            </div>

            {/* Dòng 2: Sửa và Xóa giải đấu */}
            {activeTournament && (
              <div className="flex items-center gap-2 pt-1 border-t border-border-main/40">
                <button
                  type="button"
                  onClick={handleOpenEditTour}
                  className="flex-1 py-2 px-3 border-2 border-border-main bg-surface-2 hover:bg-surface text-text-main hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-1.5 text-xs font-display uppercase tracking-wider font-bold cursor-pointer active:scale-95 shadow-xs whitespace-nowrap"
                  title={t('tournaments.btn_edit', 'Sửa giải đấu')}
                >
                  <Pencil size={14} className="text-primary shrink-0" />
                  <span>{t('tournaments.btn_edit', 'Sửa giải đấu')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteTourModal(true)}
                  className="flex-1 py-2 px-3 border-2 border-border-main bg-surface-2 hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 hover:border-rose-500/50 transition-colors flex items-center justify-center gap-1.5 text-xs font-display uppercase tracking-wider font-bold cursor-pointer active:scale-95 shadow-xs whitespace-nowrap"
                  title={t('tournaments.btn_delete', 'Xóa giải đấu')}
                >
                  <Trash2 size={14} className="shrink-0" />
                  <span>{t('tournaments.btn_delete', 'Xóa giải đấu')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-border-main mb-4 gap-2">
            <div className="flex overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setActiveTab('standings')}
                className={`flex-1 sm:flex-initial flex items-center justify-center px-3.5 sm:px-5 py-2.5 sm:py-3 font-display uppercase tracking-wider text-xs sm:text-sm whitespace-nowrap transition-colors border-b-4 -mb-[2px] ${
                  activeTab === 'standings' 
                    ? 'border-primary text-primary font-bold' 
                    : 'border-transparent text-text-muted hover:text-text-main'
                }`}
              >
                <span>{t('tournaments.tab_standings', 'Bảng Xếp Hạng')}</span>
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`flex-1 sm:flex-initial flex items-center justify-center px-3.5 sm:px-5 py-2.5 sm:py-3 font-display uppercase tracking-wider text-xs sm:text-sm whitespace-nowrap transition-colors border-b-4 -mb-[2px] ${
                  activeTab === 'matches' 
                    ? 'border-primary text-primary font-bold' 
                    : 'border-transparent text-text-muted hover:text-text-main'
                }`}
              >
                <span>{t('tournaments.tab_fixtures', 'Lịch & Kết Quả')}</span>
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-1 sm:flex-initial flex items-center justify-center px-3.5 sm:px-5 py-2.5 sm:py-3 font-display uppercase tracking-wider text-xs sm:text-sm whitespace-nowrap transition-colors border-b-4 -mb-[2px] ${
                  activeTab === 'stats' 
                    ? 'border-primary text-primary font-bold' 
                    : 'border-transparent text-text-muted hover:text-text-main'
                }`}
              >
                <span>{t('tournaments.tab_stats', 'Thống Kê')}</span>
              </button>
            </div>

            {/* 3 sub-tabs right-aligned: BÀN THẮNG | KIẾN TẠO | SỐ TRẬN CÓ MẶT */}
            {activeTab === 'stats' && (
              <div className="flex items-center justify-end overflow-x-auto hide-scrollbar gap-1 sm:gap-2 -mb-[2px] pb-1 md:pb-0">
                <button 
                  type="button"
                  onClick={() => setStatTab('goals')}
                  className={`shrink-0 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-display uppercase tracking-wider transition-all border-b-4 -mb-[2px] font-bold ${
                    statTab === 'goals' 
                      ? 'border-primary text-primary bg-primary/10' 
                      : 'border-transparent text-text-muted hover:text-text-main'
                  }`}
                >
                  {t('tournaments.stat_goals', 'BÀN THẮNG')}
                </button>
                <button 
                  type="button"
                  onClick={() => setStatTab('assists')}
                  className={`shrink-0 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-display uppercase tracking-wider transition-all border-b-4 -mb-[2px] font-bold ${
                    statTab === 'assists' 
                      ? 'border-primary text-primary bg-primary/10' 
                      : 'border-transparent text-text-muted hover:text-text-main'
                  }`}
                >
                  {t('tournaments.stat_assists', 'KIẾN TẠO')}
                </button>
                <button 
                  type="button"
                  onClick={() => setStatTab('attendance')}
                  className={`shrink-0 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-display uppercase tracking-wider transition-all border-b-4 -mb-[2px] font-bold ${
                    statTab === 'attendance' 
                      ? 'border-primary text-primary bg-primary/10' 
                      : 'border-transparent text-text-muted hover:text-text-main'
                  }`}
                >
                  {t('tournaments.stat_matches', 'SỐ TRẬN CÓ MẶT')}
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: BẢNG XẾP HẠNG (STANDINGS) */}
          {activeTab === 'standings' && (
            <div className="space-y-4">
              <div>
                {allTournamentTeams.length < 4 ? (
                  <button
                    onClick={() => setShowAddTeamModal(true)}
                    className="w-full py-2.5 px-3 border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary flex items-center justify-center gap-1.5 font-display uppercase tracking-wider text-xs font-bold transition-colors cursor-pointer active:scale-95"
                  >
                    <Plus size={14} /> <span>{t('tournaments.add_team', 'Thêm đội vào bảng')}</span>
                  </button>
                ) : (
                  <div className="w-full py-2 px-3 text-center text-xs font-display uppercase tracking-wider text-text-muted font-bold bg-surface-2 border border-border-main">
                    {t('tournaments.max_teams', 'Đã đủ tối đa 4 đội')}
                  </div>
                )}
              </div>

              <div className="bg-surface border-2 border-border-main overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-accent/30 border-b-2 border-border-main font-display uppercase tracking-wider text-xs text-text-muted">
                      <th className="py-3 px-3 w-12 text-center">{t('tournaments.col_rank', '#')}</th>
                      <th className="py-3 px-3">{t('tournaments.col_team', 'Đội bóng')}</th>
                      <th className="py-3 px-2 text-center w-12" title="Số trận đã đấu">{t('tournaments.col_played', 'Trận')}</th>
                      <th className="py-3 px-2 text-center w-12" title="Thắng">{t('tournaments.col_won', 'T')}</th>
                      <th className="py-3 px-2 text-center w-12" title="Hòa">{t('tournaments.col_drawn', 'H')}</th>
                      <th className="py-3 px-2 text-center w-12" title="Thua">{t('tournaments.col_lost', 'B')}</th>
                      <th className="py-3 px-2 text-center w-12" title="Hiệu số">{t('tournaments.col_diff', 'HS')}</th>
                      <th className="py-3 px-3 text-center w-16 font-bold text-primary">{t('tournaments.col_points', 'Điểm')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-text-muted font-medium">
                          {t('tournaments.empty_standings', 'Chưa có đội bóng nào trong giải đấu này.')}
                        </td>
                      </tr>
                    ) : (
                      standings.map((row, idx) => (
                        <tr 
                          key={row.teamId}
                          onClick={row.isOurTeam ? undefined : () => handleOpenEditTeam(row.teamId, row.teamName, false)}
                          className={`border-b border-border-main/50 transition-colors ${
                            row.isOurTeam 
                              ? 'bg-primary/10 font-bold text-primary' 
                              : 'cursor-pointer hover:bg-accent/20 group'
                          }`}
                          title={row.isOurTeam ? undefined : "Nhấn để chỉnh sửa hoặc xóa đội đối thủ"}
                        >
                          <td className="py-3 px-3 text-center font-display font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 font-medium whitespace-nowrap">
                            <span className={row.isOurTeam ? '' : 'group-hover:text-primary transition-colors'}>{row.teamName}</span>
                          </td>
                          <td className="py-3 px-2 text-center font-display font-medium">{row.played}</td>
                          <td className="py-3 px-2 text-center font-display text-emerald-600 font-bold">{row.won}</td>
                          <td className="py-3 px-2 text-center font-display text-text-muted">{row.drawn}</td>
                          <td className="py-3 px-2 text-center font-display text-rose-600">{row.lost}</td>
                          <td className="py-3 px-2 text-center font-display font-medium">
                            {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                          </td>
                          <td className="py-3 px-3 text-center font-display font-bold text-base text-primary">
                            {row.points}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] sm:text-xs text-text-muted flex flex-col gap-1 pt-2">
                <span>{t('tournaments.legend_won', 'T: Thắng (3 điểm)')}</span>
                <span>{t('tournaments.legend_drawn', 'H: Hòa (1 điểm)')}</span>
                <span>{t('tournaments.legend_lost', 'B: Bại (0 điểm)')}</span>
                <span>{t('tournaments.legend_diff', 'HS: Hiệu số bàn thắng / bại')}</span>
              </div>
            </div>
          )}

          {/* TAB 2: LỊCH THI ĐẤU & KẾT QUẢ */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {allTournamentMatches.length === 0 ? (
                  <div className="bg-surface border-2 border-dashed border-border-main p-8 text-center text-text-muted font-medium flex flex-col items-center gap-3">
                    <div>{t('tournaments.empty_matches', 'Chưa có trận đấu nào thuộc giải này. Hãy chọn giải đấu khi lên lịch tại mục Trận Đấu.')}</div>
                    <button
                      onClick={() => navigate('/matchday')}
                      className="px-4 py-2 bg-primary text-white text-xs font-display uppercase tracking-wider font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={15} /> <span>{t('tournaments.btn_create_match', 'Tạo Trận Đấu Mới')}</span>
                    </button>
                  </div>
                ) : (
                  allTournamentMatches.map((match) => {
                  const isFromMatchStore = match.id.startsWith('matchstore_');
                  const matchStatus = match.rawMatch ? match.rawMatch.status : match.status;
                  const isFinished = matchStatus === 'finished';
                  const isLive = matchStatus === 'live';

                  const matchTeams = (() => {
                    if (match.rawMatch) {
                      return allTournamentTeams.map((t, idx) => {
                        const slot = (['A', 'B', 'C', 'D'] as const)[idx];
                        const scoreKey = `scoreTeam${slot}` as keyof MatchInfo;
                        const scoreVal = match.rawMatch![scoreKey] ?? (slot === 'A' ? match.rawMatch!.scoreUs : slot === 'B' ? match.rawMatch!.scoreOpponent : 0);
                        return {
                          id: t.id,
                          name: t.name,
                          isOurTeam: t.isOurTeam,
                          score: scoreVal
                        };
                      });
                    }

                    const homeT = allTournamentTeams.find(t => t.id === match.homeTeamId);
                    const awayT = allTournamentTeams.find(t => t.id === match.awayTeamId);

                    return [
                      {
                        id: match.homeTeamId,
                        name: homeT ? homeT.name : getTeamName(match.homeTeamId),
                        isOurTeam: homeT?.isOurTeam,
                        score: match.homeScore
                      },
                      {
                        id: match.awayTeamId,
                        name: awayT ? awayT.name : getTeamName(match.awayTeamId),
                        isOurTeam: awayT?.isOurTeam,
                        score: match.awayScore
                      }
                    ];
                  })();

                  return (
                    <div 
                      key={match.id} 
                      className="bg-surface border-2 border-border-main p-3 sm:p-4 flex flex-col gap-3 shadow-xs"
                    >
                      {/* Top Header: Round, Badge, Date, Venue */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted">
                          <span className="text-[10px] font-display uppercase tracking-widest font-bold px-1.5 py-0.5 bg-surface text-text-muted border border-border-main">
                            {formatRound(match.round)}
                          </span>
                          {isLive && (
                            <span className="font-display uppercase font-bold text-rose-500 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-[10px] animate-pulse">
                              {t('tournaments.match_live', 'Đang diễn ra')}
                            </span>
                          )}
                          {match.date && (
                            <div className="flex items-center gap-1 text-xs text-text-muted font-bold font-mono">
                              <CalendarClock size={13} className="text-secondary" />
                              <span>{formatDate(match.date)}</span>
                              {match.time && <span>- {match.time}</span>}
                            </div>
                          )}
                        </div>

                        {match.venue && (
                          <div className="flex items-center gap-1 text-xs text-text-muted">
                            <MapPin size={13} className="text-secondary shrink-0" />
                            <span className="truncate max-w-[280px] sm:max-w-md">{match.venue}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons: Full width across card */}
                      <div className="w-full">
                        {isFromMatchStore ? (
                          <button
                            onClick={() => {
                              const rawId = match.id.replace('matchstore_', '');
                              selectMatch(rawId);
                              navigate('/matchday');
                            }}
                            className="w-full py-2 px-3 border border-primary/40 hover:border-primary text-xs font-display uppercase tracking-wider transition-colors font-bold text-primary bg-primary/5 hover:bg-primary/10 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                          >
                            <span>{t('tournaments.view_in_matchday', 'Xem ở Trận Đấu')}</span>
                            <span>→</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 w-full">
                            <button
                              onClick={() => handleOpenScoreModal(match)}
                              className="flex-1 py-2 px-3 border-2 border-border-main hover:border-primary text-xs font-display uppercase tracking-wider transition-colors font-bold text-primary bg-surface hover:bg-accent/10 cursor-pointer text-center"
                            >
                              {isFinished ? t('tournaments.btn_edit_score', 'Sửa tỉ số') : t('tournaments.btn_enter_score', 'Nhập kết quả')}
                            </button>
                            <button
                              onClick={() => deleteMatch(activeTournament.id, match.id)}
                              className="p-2 text-text-muted hover:text-rose-600 border-2 border-border-main transition-colors cursor-pointer"
                              title={t('tournaments.btn_delete_match', 'Xóa trận đấu')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Score Strip (Exact same style as Lịch sử đối đầu) */}
                      <div className="w-full flex items-center justify-around bg-surface-2 px-2 md:px-4 py-2.5 sm:py-3 border-t border-border-main overflow-x-auto">
                        <div className="flex w-full items-center justify-around gap-1 md:gap-2">
                          {matchTeams.map((t, idx) => (
                            <React.Fragment key={t.id || idx}>
                              {idx > 0 && (
                                <span className="text-text-muted font-bold text-lg md:text-xl shrink-0 opacity-50">-</span>
                              )}
                              <div className="text-center shrink-0 min-w-[65px] sm:min-w-[85px] max-w-[140px]">
                                <div className="text-[10px] md:text-xs uppercase font-bold text-text-muted mb-0.5 truncate">
                                  {t.name}
                                </div>
                                <div className={`text-xl sm:text-2xl md:text-3xl font-display font-bold ${t.isOurTeam ? 'text-primary' : 'text-text-main'}`}>
                                  {isFinished || isLive ? (Number(t.score) ?? 0) : '-'}
                                </div>
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: THỐNG KÊ (STATISTICS) */}
          {activeTab === 'stats' && (
            <div className="space-y-4 animate-fade-in">
              {/* Detailed Ranking Table (Identical to Stats page) */}
              <div className="hallmark-card p-0 overflow-hidden bg-surface border-2 border-border-main shadow-sm">
                {/* Table Subheader */}
                <div className="p-3 sm:p-4 bg-surface-2 border-b-2 border-border-main flex justify-between items-center text-xs font-display font-bold uppercase tracking-wider text-text-muted">
                  <span>{t('tournaments.stat_header_player', 'HẠNG & CẦU THỦ')}</span>
                  <span>{statTab === 'goals' ? t('tournaments.stat_header_total_goals', 'TỔNG BÀN') : statTab === 'assists' ? t('tournaments.stat_header_total_assists', 'TỔNG KIẾN TẠO') : t('tournaments.stat_header_total_matches', 'SỐ TRẬN')}</span>
                </div>

                {sortedTournamentPlayers.length === 0 ? (
                  <div className="p-8 text-center text-text-muted font-medium text-sm flex flex-col items-center justify-center gap-1.5">
                    <p className="font-bold text-text-main text-base">{t('tournaments.empty_stats_title', 'Chưa có dữ liệu thống kê cho giải đấu này')}</p>
                    <p className="text-xs text-text-muted">
                      {t('tournaments.empty_stats_desc', 'Hệ thống chỉ ghi nhận thống kê từ các trận đấu loại Giải đấu khi đã kết thúc.')}
                    </p>
                  </div>
                ) : (
                  sortedTournamentPlayers.map((item, index) => {
                    const isLeader = index === 0 && item[statTab] > 0;
                    const isPodium = index < 3 && item[statTab] > 0;
                    const unitLabel = statTab === 'goals' ? t('tournaments.unit_goals', 'BÀN') : statTab === 'assists' ? t('tournaments.unit_assists', 'KIẾN TẠO') : t('tournaments.unit_matches', 'TRẬN');
                    const { player } = item;

                    return (
                      <div 
                        key={player.id} 
                        onClick={() => navigate(`/roster/${player.id}`)}
                        className={`flex items-center p-3.5 sm:p-4 transition-colors cursor-pointer hover:bg-accent/20 ${
                          index !== sortedTournamentPlayers.length - 1 ? 'border-b border-border-main/50' : ''
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
                            {player.isNPC && (
                              <span className="text-[9px] px-1 py-0.2 bg-amber-500/15 text-amber-600 font-display font-bold uppercase">
                                {t('tournaments.badge_guest', 'Khách')}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-muted mt-0.5 font-display">
                            {Array.isArray(player.positions) && player.positions.length > 0 
                              ? player.positions.join(', ') 
                              : t('tournaments.pos_unknown', 'CHƯA RÕ')}
                          </div>
                        </div>

                        {/* Score Value with Unit */}
                        <div className="text-right shrink-0">
                          <span className={`text-2xl sm:text-3xl font-display font-bold leading-none ${
                            isLeader ? 'text-secondary' : 'text-primary'
                          }`}>
                            {item[statTab]}
                          </span>
                          <span className="text-[11px] sm:text-xs text-text-muted font-bold font-display uppercase ml-1.5">
                            {unitLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: Chỉnh Sửa Giải Đấu */}
      <BottomSheet
        isOpen={showEditTourModal}
        onClose={() => setShowEditTourModal(false)}
        title={
          <span className="flex items-center gap-2">
            <Pencil size={20} className="text-primary" /> {t('tournaments.modal_edit_title', 'Chỉnh Sửa Giải Đấu')}
          </span>
        }
      >
        <form onSubmit={handleSaveEditTour} className="space-y-4 pr-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('tournaments.label_name', 'Tên giải đấu')} *
            </label>
            <input 
              type="text"
              required
              value={editTourData.name}
              onChange={e => setEditTourData({...editTourData, name: e.target.value})}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-lg text-primary"
              placeholder={t('tournaments.placeholder_name', 'Ví dụ: KAT LEAGUE 2026...')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('tournaments.label_season', 'Mùa giải / Năm')}
              </label>
              <input 
                type="text"
                value={editTourData.season}
                onChange={e => setEditTourData({...editTourData, season: e.target.value})}
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium"
                placeholder="2026"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('tournaments.label_format', 'Thể thức thi đấu')}
              </label>
              <OptionPickerModal
                value={editTourData.format}
                onChange={(f) => setEditTourData({ ...editTourData, format: f as any })}
                title={t('tournaments.format_picker_title', 'Chọn Thể Thức Thi Đấu')}
                options={getFormatOptions()}
              />
            </div>
          </div>

          <div>
            <CustomDatePicker
              label={t('tournaments.label_start_date', 'Ngày bắt đầu')}
              value={editTourData.startDate}
              onChange={(date) => setEditTourData({ ...editTourData, startDate: date })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('tournaments.label_notes_rules', 'Ghi chú & Thể lệ')}
            </label>
            <textarea 
              rows={2}
              value={editTourData.notes}
              onChange={e => setEditTourData({...editTourData, notes: e.target.value})}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none text-sm resize-none"
              placeholder={t('tournaments.placeholder_edit_notes', 'Ghi chú thêm về giải đấu (nếu có)...')}
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowEditTourModal(false)}
              className="flex-1 py-3 border-2 border-border-main font-display uppercase tracking-wider text-xs font-bold hover:bg-surface-2 transition-colors cursor-pointer"
            >
              {t('tournaments.btn_cancel', 'HỦY BỎ')}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-primary text-white font-display uppercase tracking-wider text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              {t('tournaments.btn_save_changes', 'LƯU THAY ĐỔI')}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Modal: Xác Nhận Xóa Giải Đấu */}
      <BottomSheet
        isOpen={showDeleteTourModal}
        onClose={() => setShowDeleteTourModal(false)}
        variant="danger"
        title={
          <span className="flex items-center gap-2">
            <Trash2 size={20} className="text-rose-500" />
            <span>{t('tournaments.modal_delete_title', 'Xác Nhận Xóa Giải Đấu')}</span>
          </span>
        }
      >
        <div className="space-y-4 text-center">
          <p className="text-base font-bold text-text-main uppercase tracking-wide">
            {t('tournaments.delete_prompt', 'Bạn có chắc chắn muốn xóa giải đấu này?')}
          </p>

          {activeTournament && (
            <div className="bg-surface-2 p-4 border-2 border-rose-500/40 text-center">
              <div className="text-xl font-display text-text-main uppercase font-bold">
                {activeTournament.name}
              </div>
              {activeTournament.season && (
                <div className="text-xs font-bold text-text-muted mt-1 uppercase font-display">
                  {t('tournaments.label_season', 'Mùa giải / Năm')}: {activeTournament.season}
                </div>
              )}
            </div>
          )}

          <p className="text-xs font-semibold text-rose-500 bg-rose-500/10 p-2.5 border border-rose-500/20 text-center">
            {t('tournaments.delete_note', 'Toàn bộ bảng xếp hạng, danh sách đội và các dữ liệu liên quan của giải đấu này sẽ bị xóa.')}
          </p>
        </div>

        <div className="pt-6 flex gap-3 mt-4">
          <button
            type="button"
            onClick={() => setShowDeleteTourModal(false)}
            className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-border-main hover:bg-surface-2 transition-colors active:scale-95 cursor-pointer font-bold text-xs"
          >
            {t('tournaments.btn_cancel', 'HỦY BỎ')}
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeTournament) {
                const tourName = activeTournament.name;
                deleteTournament(activeTournament.id);
                setShowDeleteTourModal(false);
                addToast({
                  type: 'info',
                  message: `Đã xóa giải đấu "${tourName}"`
                });
              }
            }}
            className="flex-1 bg-rose-600 text-white font-display uppercase tracking-wider py-3 border-2 border-rose-700 hover:bg-rose-700 transition-colors active:scale-95 cursor-pointer font-bold text-xs"
          >
            {t('tournaments.btn_confirm_delete', 'XÁC NHẬN XÓA')}
          </button>
        </div>
      </BottomSheet>

      {/* Modal: Tạo Giải Đấu Mới */}
      <BottomSheet
        isOpen={showCreateTourModal}
        onClose={() => setShowCreateTourModal(false)}
        title={
          <span className="flex items-center gap-2">
            <Trophy size={20} className="text-amber-600" /> {t('tournaments.modal_create_title', 'Tạo Giải Đấu Mới')}
          </span>
        }
      >
        <form onSubmit={handleCreateTournament} className="space-y-4 pr-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('tournaments.label_name', 'Tên giải đấu')} *
            </label>
            <input 
              type="text"
              required
              value={newTourData.name}
              onChange={e => setNewTourData({...newTourData, name: e.target.value})}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-lg text-primary"
              placeholder={t('tournaments.placeholder_name', 'Ví dụ: KAT LEAGUE 2026...')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('tournaments.label_season', 'Mùa giải / Năm')}
              </label>
              <input 
                type="text"
                value={newTourData.season}
                onChange={e => setNewTourData({...newTourData, season: e.target.value})}
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium"
                placeholder="2026"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('tournaments.label_format', 'Thể thức thi đấu')}
              </label>
              <OptionPickerModal
                value={newTourData.format}
                onChange={(f) => setNewTourData({ ...newTourData, format: f as any })}
                title={t('tournaments.format_picker_title', 'Chọn Thể Thức Thi Đấu')}
                options={getFormatOptions()}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted">
                {t('tournaments.label_opponents', 'Đội đối thủ')}
              </label>
              <span className={`text-[11px] font-bold ${newTourData.opponents.length >= 3 ? 'text-amber-500' : 'text-text-muted'}`}>
                {t('tournaments.max_4_teams', 'Tối đa 4 đội')}
              </span>
            </div>
            <div className="flex gap-2">
              <input 
                type="text"
                value={opponentInput}
                disabled={newTourData.opponents.length >= 3}
                onChange={e => setOpponentInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOpponent();
                  }
                }}
                className={`flex-1 border-2 border-border-main bg-surface p-2.5 rounded-none focus:border-primary outline-none font-medium text-sm ${
                  newTourData.opponents.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                placeholder={newTourData.opponents.length >= 3 ? t('tournaments.max_teams_reached', 'Đã đủ tối đa 4 đội') : t('tournaments.placeholder_team_name', 'Thêm tên đội...')}
              />
              <button
                type="button"
                disabled={newTourData.opponents.length >= 3}
                onClick={handleAddOpponent}
                className={`px-4 bg-primary text-white font-display uppercase tracking-wider text-xs font-bold hover:bg-primary/90 transition-colors shrink-0 flex items-center gap-1 ${
                  newTourData.opponents.length >= 3 ? 'opacity-50 cursor-not-allowed hover:bg-primary' : ''
                }`}
              >
                <Plus size={15} /> {t('tournaments.btn_add_opp', 'Thêm')}
              </button>
            </div>

            {/* Chips: Home Team is always visible, plus opponents */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="inline-flex items-center px-2.5 py-1 bg-surface border border-border-main text-xs font-bold text-primary">
                {ourTeamName}
              </span>

              {newTourData.opponents.map((opp, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border-main text-xs font-bold text-text-main"
                >
                  <span>{opp}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOpponent(idx)}
                    className="text-text-muted hover:text-rose-600 transition-colors"
                    title={t('common.delete', 'Xóa')}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <CustomDatePicker 
              label={t('tournaments.label_start_date', 'Ngày bắt đầu')}
              value={newTourData.startDate}
              onChange={d => setNewTourData({...newTourData, startDate: d})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('tournaments.label_notes_rules', 'Ghi chú & Thể lệ')}
            </label>
            <input 
              type="text"
              value={newTourData.notes}
              onChange={e => setNewTourData({...newTourData, notes: e.target.value})}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium"
              placeholder={t('tournaments.placeholder_notes', 'Sân bóng tổ chức, giải thưởng...')}
            />
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-primary/90 transition-colors">
              {t('tournaments.btn_confirm_create', 'XÁC NHẬN TẠO GIẢI ĐẤU')}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Modal: Thêm Đội Bóng Vào Giải */}
      <BottomSheet
        isOpen={showAddTeamModal}
        onClose={() => setShowAddTeamModal(false)}
        title={t('tournaments.modal_add_team_title', 'Thêm Đội Bóng Vào Bảng Đấu')}
      >
        <form onSubmit={handleAddTeam} className="space-y-4 pr-1">
          <div className="text-xs text-text-muted">
            {t('tournaments.limit_4_teams_note', 'Giải đấu nội bộ giới hạn tối đa 4 đội.')}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('tournaments.label_opp_team_name', 'Tên đội bóng đối thủ')} *
            </label>
            <input 
              type="text"
              required
              disabled={allTournamentTeams.length >= 4}
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-lg text-primary disabled:opacity-50"
              placeholder={allTournamentTeams.length >= 4 ? t('tournaments.max_teams_reached', 'Đã đủ tối đa 4 đội') : t('tournaments.placeholder_team_example', 'Ví dụ: FC Ngôi Sao...')}
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={allTournamentTeams.length >= 4}
              className="w-full bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('tournaments.btn_save_team', 'LƯU ĐỘI BÓNG')}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Modal: Chỉnh Sửa / Xóa Đội Bóng Đối Thủ */}
      <BottomSheet
        isOpen={!!editingTeam}
        onClose={() => {
          setEditingTeam(null);
          setShowDeleteConfirm(false);
        }}
        title={
          <span className="flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            <span>{t('tournaments.modal_edit_team_title', 'Chỉnh Sửa Đội Đối Thủ')}: {editingTeam?.name}</span>
          </span>
        }
      >
        {editingTeam && (
          <div className="space-y-4 pr-1">
            {showDeleteConfirm ? (
              <div className="p-4 bg-rose-500/10 border-2 border-rose-500 space-y-3">
                <div className="text-sm font-bold text-rose-500 flex items-center gap-2">
                  <Trash2 size={18} />
                  <span>{t('tournaments.modal_delete_team_title', 'Xác Nhận Xóa Đội Bóng')}</span>
                </div>
                <p className="text-xs text-text-muted">
                  {t('tournaments.delete_team_prompt', 'Bạn có chắc chắn muốn xóa đội đối thủ khỏi giải đấu này không? Tất cả các trận đấu và dữ liệu liên quan của đội này sẽ bị loại bỏ khỏi bảng xếp hạng.')}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 bg-surface border-2 border-border-main text-xs font-display uppercase tracking-wider font-bold hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    {t('tournaments.btn_cancel', 'HỦY BỎ')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteTeam}
                    className="flex-1 py-2.5 bg-rose-600 text-white text-xs font-display uppercase tracking-wider font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    {t('tournaments.btn_confirm_delete', 'XÁC NHẬN XÓA')}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveTeam} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                    {t('tournaments.label_opp_team_name', 'Tên đội bóng đối thủ')} *
                  </label>
                  <input 
                    type="text"
                    required
                    value={editTeamName}
                    onChange={e => setEditTeamName(e.target.value)}
                    className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-lg text-primary"
                    placeholder={t('tournaments.placeholder_edit_team', 'Nhập tên đội bóng...')}
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <button 
                    type="submit" 
                    className="w-full bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-primary/90 transition-colors font-bold text-sm cursor-pointer"
                  >
                    {t('tournaments.btn_save_changes', 'LƯU THAY ĐỔI')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-3 bg-surface border-2 border-rose-500/50 text-rose-500 font-display uppercase tracking-wider hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer"
                  >
                    <Trash2 size={16} /> {t('tournaments.btn_delete_team_from_tour', 'XÓA ĐỘI BÓNG KHỎI GIẢI')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Modal: Nhập / Sửa Tỉ Số Trận Đấu */}
      <BottomSheet
        isOpen={!!editingMatch}
        onClose={() => setEditingMatch(null)}
        title={
          <span className="flex items-center gap-2">
            {t('tournaments.modal_score_title', 'Cập Nhật Tỉ Số')}: {editingMatch ? `${getTeamName(editingMatch.homeTeamId)} vs ${getTeamName(editingMatch.awayTeamId)}` : ''}
          </span>
        }
      >
        {editingMatch && (
          <form onSubmit={handleSaveScore} className="space-y-4 pr-1">
            <div className="grid grid-cols-2 gap-4 items-center p-4 bg-accent/10 border-2 border-border-main">
              <div className="text-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-primary mb-2 truncate">
                  {getTeamName(editingMatch.homeTeamId)}
                </label>
                <input 
                  type="number"
                  min="0"
                  max="99"
                  required
                  value={scoreData.homeScore}
                  onChange={e => setScoreData({...scoreData, homeScore: e.target.value})}
                  className="w-20 text-center font-display font-bold text-4xl p-2 border-2 border-border-main bg-surface focus:border-primary outline-none mx-auto block"
                />
              </div>

              <div className="text-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-primary mb-2 truncate">
                  {getTeamName(editingMatch.awayTeamId)}
                </label>
                <input 
                  type="number"
                  min="0"
                  max="99"
                  required
                  value={scoreData.awayScore}
                  onChange={e => setScoreData({...scoreData, awayScore: e.target.value})}
                  className="w-20 text-center font-display font-bold text-4xl p-2 border-2 border-border-main bg-surface focus:border-primary outline-none mx-auto block"
                />
              </div>
            </div>

            <div className="text-xs text-text-muted text-center">
              {t('tournaments.score_hint', '* Điểm số và hiệu số trên Bảng Xếp Hạng sẽ được cập nhật ngay lập tức.')}
            </div>

            <div className="pt-2">
              <button type="submit" className="w-full bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-primary/90 transition-colors">
                {t('tournaments.btn_confirm_score', 'XÁC NHẬN KẾT QUẢ')}
              </button>
            </div>
          </form>
        )}
      </BottomSheet>
    </div>
  );
}
