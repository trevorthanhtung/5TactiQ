import { supabase } from '../lib/supabase';
import type { TacticalFrame } from '../pages/Tactics';

export interface SharedPlayerStat {
  id: string;
  name: string;
  number?: number;
  position?: string;
  photo?: string;
  goals: number;
  assists: number;
  attendance: number;
  matchesCount: number;
}

export interface SharedStatsPayload {
  v: number;
  type: 'stats';
  teamName: string;
  logoUrl?: string;
  seasonLabel?: string;
  hasSeasonConfig?: boolean;
  createdAt: string;
  summary: {
    totalGoals: number;
    totalAssists: number;
    totalMatches: number;
    playerCount: number;
  };
  players: SharedPlayerStat[];
  allTimeData?: {
    summary: {
      totalGoals: number;
      totalAssists: number;
      totalMatches: number;
      playerCount: number;
    };
    players: SharedPlayerStat[];
  };
}

export interface SharedTacticsPayload {
  v: number;
  type: 'tactics';
  teamName: string;
  logoUrl?: string;
  tacticName: string;
  category?: string;
  createdAt: string;
  boardDimensions?: {
    width: number;
    height: number;
    isLandscape?: boolean;
  };
  frames: TacticalFrame[];
}

export type SharedPayload = SharedStatsPayload | SharedTacticsPayload;

// Utility to convert ArrayBuffer to Base64URL
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Utility to convert Base64URL to Uint8Array
function base64UrlToBytes(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Compress JSON payload into compact Base64URL string
export async function compressShareData(data: SharedPayload): Promise<string> {
  const jsonStr = JSON.stringify(data);

  if (typeof CompressionStream !== 'undefined') {
    try {
      const stream = new Blob([jsonStr]).stream().pipeThrough(new CompressionStream('deflate'));
      const compressedBuffer = await new Response(stream).arrayBuffer();
      return 'c.' + bufferToBase64Url(compressedBuffer);
    } catch (e) {
      console.warn('[ShareService] Compression failed, falling back:', e);
    }
  }

  // Fallback to base64url if CompressionStream is unavailable
  return 'u.' + btoa(encodeURIComponent(jsonStr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Decompress Base64URL string back to SharedPayload
export async function decompressShareData(encoded: string): Promise<SharedPayload | null> {
  if (!encoded) return null;

  try {
    if (encoded.startsWith('c.')) {
      const rawBase64 = encoded.slice(2);
      const bytes = base64UrlToBytes(rawBase64);
      if (typeof DecompressionStream !== 'undefined') {
        const stream = new Blob([bytes as any]).stream().pipeThrough(new DecompressionStream('deflate'));
        const decompressedText = await new Response(stream).text();
        return JSON.parse(decompressedText);
      }
    } else if (encoded.startsWith('u.')) {
      const rawBase64 = encoded.slice(2);
      let base64 = rawBase64.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      const decodedJson = decodeURIComponent(atob(base64));
      return JSON.parse(decodedJson);
    } else {
      // Direct base64url attempt
      const bytes = base64UrlToBytes(encoded);
      if (typeof DecompressionStream !== 'undefined') {
        try {
          const stream = new Blob([bytes as any]).stream().pipeThrough(new DecompressionStream('deflate'));
          const text = await new Response(stream).text();
          return JSON.parse(text);
        } catch {
          // ignore
        }
      }
      let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      return JSON.parse(decodeURIComponent(atob(base64)));
    }
  } catch (error) {
    console.error('[ShareService] Failed to decompress share payload:', error);
    return null;
  }

  return null;
}

// Generate share link
export async function createShareLink(payload: SharedPayload): Promise<string> {
  // 1. Try Supabase cloud share if online and table is accessible
  try {
    const shareId = 's_' + Math.random().toString(36).substring(2, 10);
    const { error } = await supabase.from('team_shares').insert({
      id: shareId,
      share_type: payload.type,
      title: payload.type === 'stats' ? payload.teamName : payload.tacticName,
      payload: payload,
      created_at: new Date().toISOString()
    });

    if (!error) {
      const baseUrl = window.location.origin;
      return `${baseUrl}/share?id=${shareId}`;
    }
  } catch {
    // Graceful fallback to client-side compressed URL hash
  }

  // 2. Client-side URL Hash Compression (Works 100% offline, zero database required)
  const compressed = await compressShareData(payload);
  const baseUrl = window.location.origin;
  return `${baseUrl}/share?d=${compressed}`;
}

// Fetch shared payload (from cloud ID or compressed URL hash)
export async function fetchSharedPayload(searchParams: URLSearchParams): Promise<SharedPayload | null> {
  // Check compressed data parameter first
  const compressedData = searchParams.get('d');
  if (compressedData) {
    return await decompressShareData(compressedData);
  }

  // Check cloud share ID
  const shareId = searchParams.get('id');
  if (shareId) {
    try {
      const { data, error } = await supabase
        .from('team_shares')
        .select('payload')
        .eq('id', shareId)
        .single();

      if (!error && data?.payload) {
        return data.payload as SharedPayload;
      }
    } catch (e) {
      console.error('[ShareService] Error fetching cloud share:', e);
    }
  }

  return null;
}
