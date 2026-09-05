import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { capacitorStorage } from '../utils/capacitorStorage';
import type { Player } from '../types';

interface PlayerState {
  players: Player[];
  loading: boolean;
  error: string | null;
  fetchPlayers: () => void;
  addPlayer: (player: Omit<Player, 'id'>) => Promise<string>;
  updatePlayer: (id: string, player: Partial<Player>) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  deletePlayers: (ids: string[]) => Promise<void>;
  clearAllNpcs: () => Promise<void>;
  setCaptain: (id: string | null) => Promise<void>;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      players: [],
      loading: false,
      error: null,
      fetchPlayers: () => {
        // No-op for now, data is loaded from LocalStorage automatically
      },
      addPlayer: async (player) => {
        const newId = `player-${Date.now()}`;
        set((state) => ({
          players: [...state.players, { ...player, id: newId } as Player]
        }));
        return newId;
      },
      updatePlayer: async (id, player) => {
        set((state) => ({
          players: state.players.map(p => p.id === id ? { ...p, ...player } : p)
        }));
      },
      deletePlayer: async (id) => {
        set((state) => ({
          players: state.players.filter(p => p.id !== id)
        }));
      },
      deletePlayers: async (ids) => {
        if (!ids || ids.length === 0) return;
        const idSet = new Set(ids);
        set((state) => ({
          players: state.players.filter(p => !idSet.has(p.id))
        }));
      },
      clearAllNpcs: async () => {
        set((state) => ({
          players: state.players.filter(p => !p.isNPC)
        }));
      },
      setCaptain: async (id) => {
        set((state) => ({
          players: state.players.map(p => ({
            ...p,
            isCaptain: id !== null ? p.id === id : p.isCaptain ? false : p.isCaptain
          }))
        }));
      },
    }),
    {
      name: 'katfc-player-storage',
      storage: createJSONStorage(() => capacitorStorage),
    }
  )
);
