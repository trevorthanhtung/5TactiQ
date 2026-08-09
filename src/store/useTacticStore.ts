import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TacticalFrame } from '../pages/Tactics';

export interface SavedTactic {
  id: string;
  name: string;
  category: 'training' | 'opponent' | 'other';
  createdAt: string;
  frames: TacticalFrame[];
}

export interface ActiveBoardState {
  positions: any[];
  lines: any[];
  frames: TacticalFrame[];
  currentFrameIndex: number;
}

interface TacticState {
  savedTactics: SavedTactic[];
  activeBoard: ActiveBoardState | null;
  setActiveBoard: (board: ActiveBoardState | null) => void;
  addTactic: (tactic: Omit<SavedTactic, 'id' | 'createdAt'>) => void;
  updateTactic: (id: string, tactic: Partial<SavedTactic>) => void;
  deleteTactic: (id: string) => void;
  duplicateTactic: (id: string) => void;
}

export const useTacticStore = create<TacticState>()(
  persist(
    (set) => ({
      savedTactics: [],
      activeBoard: null,
      setActiveBoard: (activeBoard) => set({ activeBoard }),
      addTactic: (tactic) => set((state) => {
        const newTactic: SavedTactic = {
          ...tactic,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
        };
        return { savedTactics: [newTactic, ...state.savedTactics] };
      }),
      updateTactic: (id, updatedTactic) => set((state) => ({
        savedTactics: state.savedTactics.map((t) => 
          t.id === id ? { ...t, ...updatedTactic } : t
        )
      })),
      deleteTactic: (id) => set((state) => ({
        savedTactics: state.savedTactics.filter((t) => t.id !== id)
      })),
      duplicateTactic: (id) => set((state) => {
        const tacticToDuplicate = state.savedTactics.find((t) => t.id === id);
        if (!tacticToDuplicate) return state;
        
        const duplicatedTactic: SavedTactic = {
          ...tacticToDuplicate,
          id: Math.random().toString(36).substr(2, 9),
          name: `${tacticToDuplicate.name} (Copy)`,
          createdAt: new Date().toISOString(),
        };
        return { savedTactics: [duplicatedTactic, ...state.savedTactics] };
      })
    }),
    {
      name: 'tactic-storage',
    }
  )
);
