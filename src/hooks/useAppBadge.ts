import { useCallback } from 'react';

export function useAppBadge() {
  const setBadge = useCallback((count?: number) => {
    if ('setAppBadge' in navigator) {
      if (count && count > 0) {
        navigator.setAppBadge(count).catch(console.error);
      } else {
        navigator.clearAppBadge().catch(console.error);
      }
    }
  }, []);

  const clearBadge = useCallback(() => {
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(console.error);
    }
  }, []);

  return { setBadge, clearBadge };
}
