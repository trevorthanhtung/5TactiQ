import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player } from '../types';

interface PlayerState {
  players: Player[];
  loading: boolean;
  error: string | null;
  fetchPlayers: () => void;
  addPlayer: (player: Omit<Player, 'id'>) => Promise<void>;
  updatePlayer: (id: string, player: Partial<Player>) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
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
        set((state) => ({
          players: [...state.players, { ...player, id: Date.now().toString() } as Player]
        }));
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
    }
  )
);
