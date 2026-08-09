import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { capacitorStorage } from '../utils/capacitorStorage';
import type { TeamSettings } from '../types';

interface SettingsState {
  settings: TeamSettings;
  updateSettings: (updates: Partial<TeamSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        teamName: '5TactiQ',
        logoUrl: '/splash.png',
      },
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),
    }),
    {
      name: '5tactiq-settings-storage',
      storage: createJSONStorage(() => capacitorStorage),
    }
  )
);
