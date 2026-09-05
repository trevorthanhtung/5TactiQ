import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { capacitorStorage } from '../utils/capacitorStorage';
import type { Tournament, TournamentTeam, TournamentMatch } from '../types';

interface TournamentState {
  tournaments: Tournament[];
  activeTournamentId: string | null;
  
  setActiveTournament: (id: string | null) => void;
  addTournament: (tournament: Omit<Tournament, 'id' | 'teams' | 'matches'> & { initialOpponents?: string[] }, ourTeamName?: string) => string;
  updateTournament: (id: string, updates: Partial<Tournament>) => void;
  deleteTournament: (id: string) => void;

  // Teams in tournament
  addTeam: (tournamentId: string, name: string, isOurTeam?: boolean) => void;
  updateTeam: (tournamentId: string, teamId: string, name: string) => void;
  deleteTeam: (tournamentId: string, teamId: string) => void;

  // Matches in tournament
  addMatch: (tournamentId: string, match: Omit<TournamentMatch, 'id'>) => void;
  updateMatch: (tournamentId: string, matchId: string, updates: Partial<TournamentMatch>) => void;
  deleteMatch: (tournamentId: string, matchId: string) => void;
}

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set) => ({
      tournaments: [],
      activeTournamentId: null,

      setActiveTournament: (id) => set({ activeTournamentId: id }),

      addTournament: (data, ourTeamName = 'Đội nhà') => {
        const id = 'tour_' + Date.now().toString();
        const ourTeam: TournamentTeam = {
          id: 'team_our_' + Date.now().toString(),
          name: ourTeamName,
          isOurTeam: true,
        };

        const otherTeams: TournamentTeam[] = (data.initialOpponents || []).filter(Boolean).map((opp, idx) => ({
          id: `team_opp_${Date.now()}_${idx}`,
          name: opp.trim(),
          isOurTeam: false,
        }));

        const newTour: Tournament = {
          id,
          name: data.name,
          season: data.season,
          format: data.format || 'league',
          status: data.status || 'upcoming',
          startDate: data.startDate,
          endDate: data.endDate,
          notes: data.notes,
          teams: [ourTeam, ...otherTeams.slice(0, 3)],
          matches: [],
        };

        set((state) => ({
          tournaments: [newTour, ...state.tournaments],
          activeTournamentId: id,
        }));

        return id;
      },

      updateTournament: (id, updates) => set((state) => ({
        tournaments: state.tournaments.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),

      deleteTournament: (id) => set((state) => ({
        tournaments: state.tournaments.filter((t) => t.id !== id),
        activeTournamentId: state.activeTournamentId === id ? null : state.activeTournamentId,
      })),

      addTeam: (tournamentId, name, isOurTeam = false) => set((state) => ({
        tournaments: state.tournaments.map((t) => {
          if (t.id !== tournamentId) return t;
          if (t.teams.length >= 4) return t;
          const newTeam: TournamentTeam = {
            id: 'team_' + Date.now().toString(),
            name: name.trim(),
            isOurTeam,
          };
          return { ...t, teams: [...t.teams, newTeam] };
        }),
      })),

      updateTeam: (tournamentId, teamId, name) => set((state) => ({
        tournaments: state.tournaments.map((t) => {
          if (t.id !== tournamentId) return t;
          return {
            ...t,
            teams: t.teams.map((tm) => (tm.id === teamId ? { ...tm, name: name.trim() } : tm)),
          };
        }),
      })),

      deleteTeam: (tournamentId, teamId) => set((state) => ({
        tournaments: state.tournaments.map((t) => {
          if (t.id !== tournamentId) return t;
          return {
            ...t,
            teams: t.teams.filter((tm) => tm.id !== teamId),
            // Also remove matches involving this team
            matches: t.matches.filter((m) => m.homeTeamId !== teamId && m.awayTeamId !== teamId),
          };
        }),
      })),

      addMatch: (tournamentId, matchData) => set((state) => ({
        tournaments: state.tournaments.map((t) => {
          if (t.id !== tournamentId) return t;
          const newMatch: TournamentMatch = {
            ...matchData,
            id: 'match_' + Date.now().toString(),
          };
          return { ...t, matches: [...t.matches, newMatch] };
        }),
      })),

      updateMatch: (tournamentId, matchId, updates) => set((state) => ({
        tournaments: state.tournaments.map((t) => {
          if (t.id !== tournamentId) return t;
          return {
            ...t,
            matches: t.matches.map((m) => (m.id === matchId ? { ...m, ...updates } : m)),
          };
        }),
      })),

      deleteMatch: (tournamentId, matchId) => set((state) => ({
        tournaments: state.tournaments.map((t) => {
          if (t.id !== tournamentId) return t;
          return {
            ...t,
            matches: t.matches.filter((m) => m.id !== matchId),
          };
        }),
      })),
    }),
    {
      name: 'katfc-tournaments-storage',
      storage: createJSONStorage(() => capacitorStorage),
    }
  )
);
