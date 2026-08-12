import { Capacitor } from '@capacitor/core';

/**
 * Checks if the application is running in an installed environment:
 * - PWA Standalone Mode (Android/Desktop PWA)
 * - iOS Safari Standalone Mode
 * - Android TWA (Trusted Web Activity)
 * - Native Mobile App (Capacitor Android/iOS)
 * - Desktop Native App (Electron)
 */
export const isInstalledApp = (): boolean => {
  if (typeof window === 'undefined') return false;

  // 1. W3C display-mode media query check
  const isDisplayModeStandalone = window.matchMedia(
    '(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)'
  ).matches;

  // 2. iOS Safari web app standalone check
  const isIOSStandalone = 'standalone' in navigator && (navigator as any).standalone === true;

  // 3. Android TWA referrer check
  const isAndroidTWA = typeof document !== 'undefined' && document.referrer.includes('android-app://');

  // 4. Capacitor Native Platform check
  const isCapacitorNative = Capacitor.isNativePlatform();

  // 5. Electron Desktop environment check
  const isElectron = navigator.userAgent.toLowerCase().includes('electron');

  return isDisplayModeStandalone || isIOSStandalone || isAndroidTWA || isCapacitorNative || isElectron;
};
