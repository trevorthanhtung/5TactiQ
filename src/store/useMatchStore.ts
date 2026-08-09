import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { capacitorStorage } from '../utils/capacitorStorage';
import type { MatchInfo, PlayerMatchStat } from '../types';

interface MatchState {
  matches: MatchInfo[];
  activeMatchId: string;
  
  // Active match info getter
  getMatchInfo: () => MatchInfo | null;
  
  // Actions
  createMatch: (info: Partial<MatchInfo>) => string;
  selectMatch: (id: string) => void;
  updateMatchInfo: (info: Partial<MatchInfo>) => void;
  updateMatchAttendance: (matchId: string, playerId: string, attendance: 'present' | 'absent' | 'pending', eta?: string) => void;
  updateMatchTeam: (matchId: string, playerId: string, team: 'A' | 'B' | 'C' | 'D' | null) => void;
  startMatch: (matchId: string) => void;
  endMatch: (matchId: string, result: {
    scoreUs?: number | null;
    scoreOpponent?: number | null;
    scoreTeamA?: number | null;
    scoreTeamB?: number | null;
    scoreTeamC?: number | null;
    scoreTeamD?: number | null;
    stats?: PlayerMatchStat[];
  }) => void;
  updateLiveMatch: (matchId: string, data: Partial<MatchInfo>) => void;
  deleteMatch: (id: string) => void;
  resetData: () => void;
}

const defaultMatches: MatchInfo[] = [];

export const useMatchStore = create<MatchState>()(
  persist(
    (set, get) => ({
      matches: defaultMatches,
      activeMatchId: '',

      getMatchInfo: () => {
        const { matches, activeMatchId } = get();
        if (!activeMatchId) return null;
        return matches.find(m => m.id === activeMatchId) || null;
      },

      createMatch: (info) => {
        const newId = `match-${Date.now()}`;
        const newMatch: MatchInfo = {
          id: newId,
          date: info.date || new Date().toISOString().split('T')[0],
          opponent: info.opponent || '',
          location: info.location || '',
          time: info.time || '19:00',
          matchType: info.matchType || 'internal',
          status: 'upcoming',
          weather: info.weather || {
            condition: 'clear',
            probability: 20,
            note: 'Thời tiết ổn định.'
          },
          teamCount: info.teamCount || 2,
          teamAColor: info.teamAColor || 'Đỏ',
          teamBColor: info.teamBColor || 'Xanh',
          teamCColor: info.teamCColor || 'Trắng',
          teamDColor: info.teamDColor || 'Không Bib',
          attendance: {},
          eta: {},
          teams: {},
          stats: []
        };

        set((state) => ({
          matches: [newMatch, ...state.matches],
          activeMatchId: newId
        }));

        return newId;
      },

      selectMatch: (id) => {
        set({ activeMatchId: id });
      },

      updateMatchInfo: (info) => {
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === state.activeMatchId ? { ...m, ...info } : m
          )
        }));
      },

      updateMatchAttendance: (matchId, playerId, attendance, eta) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m;
            const updatedAttendance = { ...(m.attendance || {}), [playerId]: attendance };
            const updatedEta = { ...(m.eta || {}) };
            if (eta !== undefined) {
              updatedEta[playerId] = eta;
            }
            return {
              ...m,
              attendance: updatedAttendance,
              eta: updatedEta
            };
          })
        }));
      },

      updateMatchTeam: (matchId, playerId, team) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m;
            return {
              ...m,
              teams: { ...(m.teams || {}), [playerId]: team }
            };
          })
        }));
      },

      startMatch: (matchId) => {
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId ? { ...m, status: 'live' } : m
          ),
          activeMatchId: matchId
        }));
      },

      endMatch: (matchId, result) => {
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId
              ? {
                  ...m,
                  status: 'finished',
                  scoreUs: result.scoreUs !== undefined ? result.scoreUs : m.scoreUs,
                  scoreOpponent: result.scoreOpponent !== undefined ? result.scoreOpponent : m.scoreOpponent,
                  scoreTeamA: result.scoreTeamA !== undefined ? result.scoreTeamA : m.scoreTeamA,
                  scoreTeamB: result.scoreTeamB !== undefined ? result.scoreTeamB : m.scoreTeamB,
                  scoreTeamC: result.scoreTeamC !== undefined ? result.scoreTeamC : m.scoreTeamC,
                  scoreTeamD: result.scoreTeamD !== undefined ? result.scoreTeamD : m.scoreTeamD,
                  stats: result.stats || m.stats || []
                }
              : m
          ),
          activeMatchId: ''
        }));
      },

      updateLiveMatch: (matchId, data) => {
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId ? { ...m, ...data } : m
          )
        }));
      },

      deleteMatch: (id: string) => {
        set((state) => {
          const filtered = state.matches.filter((m) => m.id !== id);
          const nextActiveId = state.activeMatchId === id ? (filtered[0]?.id || '') : state.activeMatchId;
          return {
            matches: filtered,
            activeMatchId: nextActiveId
          };
        });
      },

      resetData: () => {
        set({
          matches: [],
          activeMatchId: ''
        });
      }
    }),
    {
      name: 'katfc-match-storage-v5',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({ matches: state.matches }),
    }
  )
);
