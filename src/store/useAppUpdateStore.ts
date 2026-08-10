import { create } from 'zustand';
import { APP_VERSION } from '../config/version';

interface AppUpdateState {
  hasUpdate: boolean;
  latestVersion: string;
  isChecking: boolean;
  checkUpdate: () => Promise<void>;
  dismissUpdate: () => void;
  showUpdateModal: boolean;
  setShowUpdateModal: (show: boolean) => void;
}

// Helper to compare versions (e.g., '1.0.0' vs 'v1.1.0')
const isNewerVersion = (current: string, latest: string) => {
  const normalize = (v: string) => v.replace(/^v/, '').split('.').map(Number);
  const curr = normalize(current);
  const lat = normalize(latest);
  
  for (let i = 0; i < Math.max(curr.length, lat.length); i++) {
    const c = curr[i] || 0;
    const l = lat[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
};

export const useAppUpdateStore = create<AppUpdateState>((set) => ({
  hasUpdate: false,
  latestVersion: APP_VERSION,
  isChecking: false,
  showUpdateModal: false,
  
  checkUpdate: async () => {
    set({ isChecking: true });
    try {
      // Vì Github Release luôn dùng tag 'latest', ta sẽ check version từ file code trên nhánh main
      const response = await fetch('https://raw.githubusercontent.com/trevorthanhtung/5TactiQ/main/src/config/version.ts', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch version file');
      
      const text = await response.text();
      // Extract version using regex, e.g. from export const APP_VERSION = '1.1.0';
      const match = text.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
      const latestTag = match ? match[1] : null;
      
      if (latestTag && isNewerVersion(APP_VERSION, latestTag)) {
        set({ hasUpdate: true, latestVersion: latestTag });
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      set({ isChecking: false });
    }
  },
  
  dismissUpdate: () => set({ hasUpdate: false }),
  setShowUpdateModal: (show) => set({ showUpdateModal: show }),
}));
