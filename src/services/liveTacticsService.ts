import { supabase } from '../lib/supabase';
import type { ActiveBoardState } from '../store/useTacticStore';

const BROADCAST_CHANNEL_NAME = '5tactiq_live_tactics';
const STORAGE_KEY = '5tactiq_live_tactic_event';
const SUPABASE_CHANNEL_NAME = '5tactiq_live_tactics_room';

let liveBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    liveBroadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  // ignore
}

// Shared Supabase Realtime channel singleton
let sbRealtimeChannel: any = null;
let isSbSubscribed = false;

function getSupabaseRealtimeChannel() {
  if (!sbRealtimeChannel) {
    try {
      sbRealtimeChannel = supabase.channel(SUPABASE_CHANNEL_NAME, {
        config: { broadcast: { self: false } }
      });
      sbRealtimeChannel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          isSbSubscribed = true;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isSbSubscribed = false;
        }
      });
    } catch (err) {
      console.warn('[LiveTactics] Supabase channel error:', err);
    }
  }
  return sbRealtimeChannel;
}

/**
 * Broadcast tactical board changes in real-time
 */
export function broadcastTacticsState(board: ActiveBoardState) {
  if (!board) return;

  const payload = {
    board,
    timestamp: Date.now()
  };

  // 1. BroadcastChannel (Same-browser instant messaging across tabs/windows)
  try {
    if (liveBroadcastChannel) {
      liveBroadcastChannel.postMessage(payload);
    }
  } catch (err) {
    console.warn('[LiveTactics] BroadcastChannel error:', err);
  }

  // 2. LocalStorage event (Fallback for same-browser cross-tab)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    // ignore quota errors
  }

  // 3. Supabase Realtime broadcast (Cross-device real-time sync)
  try {
    const channel = getSupabaseRealtimeChannel();
    if (channel && isSbSubscribed) {
      channel.send({
        type: 'broadcast',
        event: 'TACTICS_LIVE_UPDATE',
        payload: board
      });
    }
  } catch (err) {
    // ignore network errors
  }
}

/**
 * Subscribe to live tactical board changes
 */
export function subscribeToLiveTactics(onUpdate: (board: ActiveBoardState) => void): () => void {
  // 1. BroadcastChannel listener
  let bc: BroadcastChannel | null = null;
  try {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.onmessage = (event) => {
        if (event.data?.board) {
          onUpdate(event.data.board);
        }
      };
    }
  } catch (err) {
    console.warn('[LiveTactics] Error setting up BroadcastChannel subscriber:', err);
  }

  // 2. Storage event listener
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed.board) {
          onUpdate(parsed.board);
        }
      } catch {
        // ignore
      }
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  // 3. Supabase Realtime listener
  let channel = getSupabaseRealtimeChannel();
  try {
    if (channel) {
      channel.on('broadcast', { event: 'TACTICS_LIVE_UPDATE' }, ({ payload }: any) => {
        if (payload) {
          onUpdate(payload);
        }
      });
    }
  } catch (err) {
    console.warn('[LiveTactics] Error setting up Supabase Realtime channel listener:', err);
  }

  // Cleanup
  return () => {
    if (bc) bc.close();
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}
