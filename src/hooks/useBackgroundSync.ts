import { useEffect } from 'react';

export function useBackgroundSync() {
  useEffect(() => {
    async function registerBackgroundSync() {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          // @ts-expect-error sync is not fully typed in standard lib yet
          await registration.sync.register('5tactiq-sync-data');
          console.log('Background Sync registered successfully');
        } catch (err) {
          console.error('Background Sync registration failed:', err);
        }
      }
    }

    // Register sync when online status changes from offline to online
    const handleOnline = () => {
      registerBackgroundSync();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);
}
