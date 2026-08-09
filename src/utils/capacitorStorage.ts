import { Preferences } from '@capacitor/preferences';
import type { StateStorage } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';

/**
 * Custom Storage Adapter cho Zustand.
 * Nếu đang chạy trên App Native (Android/iOS), dữ liệu sẽ được lưu vĩnh viễn bằng SharedPreferences/UserDefaults.
 * Nếu đang chạy trên Web (PWA), dữ liệu sẽ fallback về localStorage.
 */
export const capacitorStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: name });
      return value;
    } else {
      return localStorage.getItem(name);
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: name, value });
    } else {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: name });
    } else {
      localStorage.removeItem(name);
    }
  },
};
