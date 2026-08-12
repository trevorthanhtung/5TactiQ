import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useMatchStore } from '../store/useMatchStore';
import { useTacticStore } from '../store/useTacticStore';
import { useVenueStore } from '../store/useVenueStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { exportData, importSelectedData, parseBackupData, STORAGE_KEYS } from '../lib/sync';
import { useTranslation } from 'react-i18next';

export type SyncStatusType = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

export function useCloudSync() {
  const { t } = useTranslation();
  const session = useAuthStore((state) => state.session);
  const addToast = useToastStore((state) => state.addToast);

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem('katfc_last_synced_at');
  });

  const supabaseChannelRef = useRef<any>(null);
  const localBcRef = useRef<BroadcastChannel | null>(null);
  const isInternalSyncRef = useRef<boolean>(false);

  // Track online / offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncStatus === 'offline') setSyncStatus('pending');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncStatus]);

  // Helper function to apply incoming cloud payload
  const applyIncomingPayload = useCallback(async (payloadStr: string | object, timestamp?: string) => {
    const parsed = parseBackupData(payloadStr);
    if (parsed) {
      isInternalSyncRef.current = true;
      await importSelectedData(parsed, STORAGE_KEYS, 'overwrite');
      const time = timestamp || new Date().toISOString();
      localStorage.setItem('katfc_last_synced_at', time);
      setLastSyncedAt(time);
      setSyncStatus('synced');
      setTimeout(() => {
        isInternalSyncRef.current = false;
      }, 300);
    }
  }, []);

  // 1. Setup Local Browser BroadcastChannel (Instant sync across tabs/windows on same PC)
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    const bc = new BroadcastChannel('5tactiq_cloud_sync_bc');
    localBcRef.current = bc;

    bc.onmessage = async (event) => {
      if (event.data?.type === 'cloud_sync_updated' && event.data?.payload) {
        console.log('[Local BC] Received sync update from another tab/window', event.data);
        await applyIncomingPayload(event.data.payload, event.data.timestamp);
      }
    };

    return () => {
      bc.close();
      localBcRef.current = null;
    };
  }, [applyIncomingPayload]);

  // 2. Setup Persistent Supabase Realtime Channel & Postgres Changes for cross-device real-time updates
  useEffect(() => {
    if (!session?.user?.id) return;

    const channelName = `cloud-sync-${session.user.id}`;
    const channel = supabase.channel(channelName);
    supabaseChannelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sync',
          filter: `user_id=eq.${session.user.id}`,
        },
        async (payload: any) => {
          console.log('[Supabase Postgres Changes] user_sync updated:', payload);
          if (payload?.new?.data) {
            await applyIncomingPayload(payload.new.data, payload.new.updated_at);
          }
        }
      )
      .on('broadcast', { event: 'cloud_sync_updated' }, async (payload) => {
        console.log('[Realtime Supabase] Received cloud_sync_updated event', payload);
        if (payload?.payload?.data) {
          await applyIncomingPayload(payload.payload.data, payload.payload.timestamp);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabaseChannelRef.current = null;
    };
  }, [session?.user?.id, applyIncomingPayload]);

  // Execute Smart 2-Way Sync (PULL if Cloud is newer, PUSH if Local is newer)
  const syncNow = useCallback(async (showToast: boolean = true) => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setSyncStatus('offline');
      if (showToast) {
        addToast({
          message: t('sync.offline_warning', 'Thiết bị đang ngoại tuyến. Vui lòng kết nối mạng để đồng bộ!'),
          type: 'warning',
        });
      }
      return;
    }

    if (!session) {
      if (showToast) {
        addToast({
          message: t('sync.login_required', 'Vui lòng đăng nhập tài khoản để sử dụng đồng bộ Đám mây!'),
          type: 'info',
        });
      }
      return;
    }

    setSyncStatus('syncing');

    try {
      const localTimestampStr = localStorage.getItem('katfc_last_synced_at');
      const localTime = localTimestampStr ? new Date(localTimestampStr).getTime() : 0;

      // 1. Fetch latest Cloud snapshot from DB & User Metadata to find the absolute newest
      let dbDataObj: any = null;
      let dbTime = 0;
      try {
        const { data, error } = await supabase
          .from('user_sync')
          .select('data, updated_at')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!error && data?.data) {
          dbDataObj = parseBackupData(data.data);
          dbTime = data.updated_at ? new Date(data.updated_at).getTime() : 0;
        }
      } catch (e) {}

      let metaDataObj: any = null;
      let metaTime = 0;
      const currentMeta = session.user?.user_metadata;
      if (currentMeta?.cloud_backup) {
        metaDataObj = parseBackupData(currentMeta.cloud_backup);
        metaTime = currentMeta.last_synced_at ? new Date(currentMeta.last_synced_at).getTime() : 0;
      }

      // Choose newest cloud payload
      let bestCloudObj = dbDataObj;
      let bestCloudTime = dbTime;
      if (metaTime > dbTime && metaDataObj) {
        bestCloudObj = metaDataObj;
        bestCloudTime = metaTime;
      }

      // 2. Decision: If Cloud data exists and is NEWER than local timestamp, PULL Cloud data!
      if (bestCloudObj && bestCloudTime > localTime + 1000) {
        console.log('[Smart Sync] Cloud data is newer. Pulling from Cloud...', { bestCloudTime, localTime });
        await importSelectedData(bestCloudObj, STORAGE_KEYS, 'overwrite');
        const time = new Date(bestCloudTime).toISOString();
        localStorage.setItem('katfc_last_synced_at', time);
        setLastSyncedAt(time);
        setSyncStatus('synced');

        if (showToast) {
          addToast({
            message: t('sync.cloud_pulled', '[Đồng bộ thành công] Đã tải về dữ liệu mới nhất từ Đám mây!'),
            type: 'success',
          });
        }

        setTimeout(() => {
          isInternalSyncRef.current = false;
        }, 300);
        return;
      }

      // 3. Otherwise (Local is newer or equal), PUSH Local data to Cloud!
      console.log('[Smart Sync] Local data is latest. Pushing to Cloud...');
      const jsonPayloadStr = await exportData();
      const timestamp = new Date().toISOString();
      const payloadObj = parseBackupData(jsonPayloadStr) || JSON.parse(jsonPayloadStr);

      // Save to DB
      try {
        await supabase.from('user_sync').upsert({
          user_id: session.user.id,
          data: payloadObj,
          updated_at: timestamp,
        });
      } catch (e) {}

      // Save to Metadata as parallel backup (preserving full_name and other user metadata)
      try {
        const existingMeta = session.user?.user_metadata || {};
        await supabase.auth.updateUser({
          data: {
            ...existingMeta,
            cloud_backup: payloadObj,
            last_synced_at: timestamp,
          },
        });
      } catch (e) {}

      // 4. Broadcast to Local Tabs via BroadcastChannel
      if (localBcRef.current) {
        localBcRef.current.postMessage({
          type: 'cloud_sync_updated',
          payload: payloadObj,
          timestamp,
        });
      }

      // 5. Broadcast to Remote Devices via Persistent Supabase Channel
      if (supabaseChannelRef.current) {
        await supabaseChannelRef.current.send({
          type: 'broadcast',
          event: 'cloud_sync_updated',
          payload: {
            data: payloadObj,
            timestamp,
          },
        });
      }

      // 6. Update local timestamp
      localStorage.setItem('katfc_last_synced_at', timestamp);
      setLastSyncedAt(timestamp);
      setSyncStatus('synced');

      if (showToast) {
        addToast({
          message: t('sync.cloud_pushed', '[Đồng bộ thành công] Đã đẩy dữ liệu mới lên Đám mây!'),
          type: 'success',
        });
      }
    } catch (err: any) {
      console.error('Cloud Sync Failed:', err);
      setSyncStatus('error');
      if (showToast) {
        addToast({
          message: err.message || t('sync.cloud_error', 'Không thể đồng bộ dữ liệu. Vui lòng thử lại sau.'),
          type: 'error',
        });
      }
    }
  }, [session, addToast, t]);

  // 3. Auto-subscribe to all Zustand stores to trigger silent cloud sync on ANY mutation
  useEffect(() => {
    if (!session?.user?.id) return;

    let timer: ReturnType<typeof setTimeout>;
    const triggerDebouncedSync = () => {
      if (isInternalSyncRef.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        syncNow(false);
      }, 800);
    };

    const unsubPlayer = usePlayerStore.subscribe(triggerDebouncedSync);
    const unsubMatch = useMatchStore.subscribe(triggerDebouncedSync);
    const unsubTactic = useTacticStore.subscribe(triggerDebouncedSync);
    const unsubVenue = useVenueStore.subscribe(triggerDebouncedSync);
    const unsubSettings = useSettingsStore.subscribe(triggerDebouncedSync);

    return () => {
      unsubPlayer();
      unsubMatch();
      unsubTactic();
      unsubVenue();
      unsubSettings();
      clearTimeout(timer);
    };
  }, [session?.user?.id, syncNow]);

  // 4. Auto-sync on Window Focus & Tab Visibility Change
  useEffect(() => {
    if (!session?.user?.id) return;

    const handleFocus = () => {
      syncNow(false);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [session?.user?.id, syncNow]);

  // 5. Silent Background Heartbeat (Checks & syncs automatically every 5 seconds)
  useEffect(() => {
    if (!session?.user?.id) return;

    syncNow(false);

    const interval = setInterval(() => {
      syncNow(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [session?.user?.id, syncNow]);

  // Global Capture Phase Keyboard Shortcut Listener (Alt+S, F9, Ctrl+Shift+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyLower = e.key ? e.key.toLowerCase() : '';
      const code = e.code || '';

      const isAltS = e.altKey && (keyLower === 's' || code === 'KeyS');
      const isF9 = e.key === 'F9' || code === 'F9';
      const isCtrlShiftS = (e.ctrlKey || e.metaKey) && e.shiftKey && (keyLower === 's' || code === 'KeyS');

      if (isAltS || isF9 || isCtrlShiftS) {
        e.preventDefault();
        e.stopPropagation();
        syncNow(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [syncNow]);

  return {
    isOnline,
    syncStatus,
    lastSyncedAt,
    syncNow,
  };
}
