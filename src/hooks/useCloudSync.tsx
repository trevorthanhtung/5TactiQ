import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
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

interface CloudSyncContextType {
  isOnline: boolean;
  syncStatus: SyncStatusType;
  lastSyncedAt: string | null;
  syncNow: (showToast?: boolean) => Promise<void>;
}

const CloudSyncContext = createContext<CloudSyncContextType | null>(null);

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
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
  const isSyncingRef = useRef<boolean>(false);
  const lastPushedPayloadRef = useRef<string | null>(null);

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

  // Helper function to apply incoming cloud payload safely
  const applyIncomingPayload = useCallback(async (payloadStr: string | object, timestamp?: string) => {
    const parsed = parseBackupData(payloadStr);
    if (!parsed) return;

    isInternalSyncRef.current = true;
    try {
      await importSelectedData(parsed, STORAGE_KEYS, 'overwrite');
      const time = timestamp || new Date().toISOString();
      localStorage.setItem('katfc_last_synced_at', time);
      setLastSyncedAt(time);
      setSyncStatus('synced');
      lastPushedPayloadRef.current = await exportData();
    } catch (err) {
      console.error('[CloudSync] Failed to apply incoming payload:', err);
    } finally {
      setTimeout(() => {
        isInternalSyncRef.current = false;
      }, 1000);
    }
  }, []);

  // 1. Setup Local Browser BroadcastChannel (Instant sync across tabs/windows on same PC)
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    const bc = new BroadcastChannel('5tactiq_cloud_sync_bc');
    localBcRef.current = bc;

    bc.onmessage = async (event) => {
      if (event.data?.type === 'cloud_sync_updated' && event.data?.payload) {
        const localTime = localStorage.getItem('katfc_last_synced_at')
          ? new Date(localStorage.getItem('katfc_last_synced_at')!).getTime()
          : 0;
        const incomingTime = event.data.timestamp ? new Date(event.data.timestamp).getTime() : 0;
        if (incomingTime > localTime + 500) {
          console.log('[Local BC] Received sync update from another tab/window', event.data);
          await applyIncomingPayload(event.data.payload, event.data.timestamp);
        }
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
    const realtimeTopic = `realtime:${channelName}`;

    // Clean up any existing channel with the same topic/name to prevent duplicate subscription errors
    const existing = supabase.getChannels().find(
      (c) => c.topic === realtimeTopic || (c as any).name === channelName
    );
    if (existing) {
      supabase.removeChannel(existing);
      (supabase.realtime as any).channels = (supabase.realtime as any).channels.filter(
        (c: any) => c.topic !== realtimeTopic && c.name !== channelName
      );
    }

    const channel = supabase.channel(channelName);
    supabaseChannelRef.current = channel;

    try {
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
            const localTime = localStorage.getItem('katfc_last_synced_at')
              ? new Date(localStorage.getItem('katfc_last_synced_at')!).getTime()
              : 0;
            const incomingTime = payload?.new?.updated_at ? new Date(payload.new.updated_at).getTime() : 0;
            if (incomingTime > localTime + 1000 && payload?.new?.data) {
              console.log('[Supabase Postgres Changes] user_sync updated:', payload);
              await applyIncomingPayload(payload.new.data, payload.new.updated_at);
            }
          }
        )
        .on('broadcast', { event: 'cloud_sync_updated' }, async (payload) => {
          const localTime = localStorage.getItem('katfc_last_synced_at')
            ? new Date(localStorage.getItem('katfc_last_synced_at')!).getTime()
            : 0;
          const incomingTime = payload?.payload?.timestamp ? new Date(payload.payload.timestamp).getTime() : 0;
          if (incomingTime > localTime + 1000) {
            console.log('[Realtime Supabase] Received cloud_sync_updated event', payload);
            if (payload?.payload?.data) {
              await applyIncomingPayload(payload.payload.data, payload.payload.timestamp);
            } else {
              const { data } = await supabase
                .from('user_sync')
                .select('data, updated_at')
                .eq('user_id', session.user.id)
                .maybeSingle();
              if (data?.data) {
                await applyIncomingPayload(data.data, data.updated_at);
              }
            }
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('[useCloudSync] Error subscribing to channel:', err);
    }

    return () => {
      if (supabaseChannelRef.current) {
        supabase.removeChannel(supabaseChannelRef.current);
        supabaseChannelRef.current = null;
      }
    };
  }, [session?.user?.id, applyIncomingPayload]);

  // Execute Smart 2-Way Sync (PULL if Cloud is newer, PUSH if Local is modified)
  const syncNow = useCallback(async (showToast: boolean = true) => {
    if (isSyncingRef.current || isInternalSyncRef.current) {
      return;
    }

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

    isSyncingRef.current = true;
    setSyncStatus('syncing');

    try {
      const localTimestampStr = localStorage.getItem('katfc_last_synced_at');
      const localTime = localTimestampStr ? new Date(localTimestampStr).getTime() : 0;

      // 1. Fetch latest Cloud snapshot from DB
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

      // Check legacy session metadata if DB is empty
      let metaDataObj: any = null;
      let metaTime = 0;
      const currentMeta = session.user?.user_metadata;
      if (!dbDataObj && currentMeta?.cloud_backup) {
        metaDataObj = parseBackupData(currentMeta.cloud_backup);
        metaTime = currentMeta.last_synced_at ? new Date(currentMeta.last_synced_at).getTime() : 0;
      }

      const bestCloudObj = dbDataObj || metaDataObj;
      const bestCloudTime = dbTime || metaTime;

      // 2. Decision: If Cloud data exists and is NEWER than local timestamp, PULL Cloud data!
      if (bestCloudObj && bestCloudTime > localTime + 1000) {
        console.log('[Smart Sync] Cloud data is newer. Pulling from Cloud...', { bestCloudTime, localTime });
        isInternalSyncRef.current = true;
        await importSelectedData(bestCloudObj, STORAGE_KEYS, 'overwrite');
        const time = new Date(bestCloudTime).toISOString();
        localStorage.setItem('katfc_last_synced_at', time);
        setLastSyncedAt(time);
        setSyncStatus('synced');
        lastPushedPayloadRef.current = await exportData();

        if (showToast) {
          addToast({
            message: t('sync.cloud_pulled', '[Đồng bộ thành công] Đã tải về dữ liệu mới nhất từ Đám mây!'),
            type: 'success',
          });
        }

        setTimeout(() => {
          isInternalSyncRef.current = false;
        }, 1000);
        return;
      }

      // 3. Otherwise, check if Local data has changed since last push
      const jsonPayloadStr = await exportData();
      if (lastPushedPayloadRef.current && jsonPayloadStr === lastPushedPayloadRef.current) {
        console.log('[Smart Sync] Local data unchanged. Skipping push.');
        setSyncStatus('synced');
        return;
      }

      console.log('[Smart Sync] Local data modified. Pushing to Cloud...');
      const timestamp = new Date().toISOString();
      const payloadObj = parseBackupData(jsonPayloadStr) || JSON.parse(jsonPayloadStr);

      // Save to user_sync table ONLY (do NOT call auth.updateUser to avoid 429 & 431 header errors)
      const { error: upsertError } = await supabase.from('user_sync').upsert({
        user_id: session.user.id,
        data: payloadObj,
        updated_at: timestamp,
      });

      if (upsertError) {
        throw upsertError;
      }

      lastPushedPayloadRef.current = jsonPayloadStr;

      // Broadcast to Local Tabs via BroadcastChannel
      if (localBcRef.current) {
        localBcRef.current.postMessage({
          type: 'cloud_sync_updated',
          payload: payloadObj,
          timestamp,
        });
      }

      // Broadcast to Remote Devices via Persistent Supabase Channel (Lightweight ping)
      if (
        supabaseChannelRef.current &&
        (supabaseChannelRef.current.state === 'joined' || supabaseChannelRef.current.state === 'SUBSCRIBED')
      ) {
        try {
          await supabaseChannelRef.current.send({
            type: 'broadcast',
            event: 'cloud_sync_updated',
            payload: {
              timestamp,
            },
          });
        } catch (err) {
          console.warn('[useCloudSync] Broadcast send failed:', err);
        }
      }

      // Update local timestamp
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
    } finally {
      isSyncingRef.current = false;
    }
  }, [session, addToast, t]);

  // 3. Auto-subscribe to Zustand stores to trigger debounced cloud sync on mutation
  useEffect(() => {
    if (!session?.user?.id) return;

    let timer: ReturnType<typeof setTimeout>;
    const triggerDebouncedSync = () => {
      if (isInternalSyncRef.current || isSyncingRef.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        syncNow(false);
      }, 1500);
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

  // 5. Background Heartbeat (Checks & syncs automatically every 30 seconds)
  useEffect(() => {
    if (!session?.user?.id) return;

    syncNow(false);

    const interval = setInterval(() => {
      syncNow(false);
    }, 30000);

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

  return (
    <CloudSyncContext.Provider value={{ isOnline, syncStatus, lastSyncedAt, syncNow }}>
      {children}
    </CloudSyncContext.Provider>
  );
}

export function useCloudSync() {
  const context = useContext(CloudSyncContext);
  if (!context) {
    throw new Error('useCloudSync must be used within a CloudSyncProvider');
  }
  return context;
}
