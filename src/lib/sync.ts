import { capacitorStorage } from '../utils/capacitorStorage';
import { usePlayerStore } from '../store/usePlayerStore';
import { useMatchStore } from '../store/useMatchStore';
import { useTacticStore } from '../store/useTacticStore';
import { useVenueStore } from '../store/useVenueStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useFundStore } from '../store/useFundStore';
import { useTournamentStore } from '../store/useTournamentStore';
import { useEquipmentStore } from '../store/useEquipmentStore';
import { useTrainingStore } from '../store/useTrainingStore';
import { useThemeStore } from '../store/useThemeStore';

export const VISIBLE_STORAGE_KEYS_META: Record<string, string> = {
  'katfc-player-storage': 'Đội hình, Chấn thương & Tier',
  'tactic-storage': 'Dữ liệu Sa bàn (Chiến thuật)',
  'katfc-match-storage-v5': 'Dữ liệu Trận đấu, Sự kiện & Đánh giá',
  'katfc-venues-storage': 'Danh bạ Sân bóng & Đối thủ',
  '5tactiq-settings-storage': 'Cài đặt Chung & Mùa giải',
  'katfc-fund-storage': 'Quỹ Đội & Tiền Phạt',
  'katfc-tournaments-storage': 'Giải Đấu & Cúp',
  'katfc-equipment-storage': 'Dụng Cụ & Số Áo Đấu',
};

export const HIDDEN_STORAGE_KEYS = [
  'katfc-training-storage',
  '5tactiq_bank_info',
  'theme-storage'
];

export const STORAGE_KEYS_META: Record<string, string> = {
  ...VISIBLE_STORAGE_KEYS_META,
  'katfc-training-storage': 'Buổi Tập & Điểm Danh',
  '5tactiq_bank_info': 'Tài Khoản Ngân Hàng & QR (Chia tiền)',
  'theme-storage': 'Giao Diện Sáng / Tối',
};

export const STORAGE_KEYS = Object.keys(STORAGE_KEYS_META);

export const rehydrateAllStores = async () => {
  try {
    await Promise.all([
      usePlayerStore.persist?.rehydrate?.(),
      useMatchStore.persist?.rehydrate?.(),
      useTacticStore.persist?.rehydrate?.(),
      useVenueStore.persist?.rehydrate?.(),
      useSettingsStore.persist?.rehydrate?.(),
      useFundStore.persist?.rehydrate?.(),
      useTournamentStore.persist?.rehydrate?.(),
      useEquipmentStore.persist?.rehydrate?.(),
      useTrainingStore.persist?.rehydrate?.(),
      useThemeStore.persist?.rehydrate?.(),
    ]);
  } catch (e) {
    console.error('Failed to rehydrate stores:', e);
  }
};

export interface BackupInventory {
  playerCount: number;
  matchCount: number;
  tournamentCount: number;
  tacticCount: number;
  venueCount: number;
  fundTransactionCount: number;
  fineCount: number;
  equipmentItemCount: number;
  jerseyCount: number;
  trainingSessionCount: number;
  hasBankInfo: boolean;
  exportedAt?: string;
  version?: string;
}

export const getBackupInventory = (parsedData: Record<string, any> | null): BackupInventory => {
  const result: BackupInventory = {
    playerCount: 0,
    matchCount: 0,
    tournamentCount: 0,
    tacticCount: 0,
    venueCount: 0,
    fundTransactionCount: 0,
    fineCount: 0,
    equipmentItemCount: 0,
    jerseyCount: 0,
    trainingSessionCount: 0,
    hasBankInfo: false,
    exportedAt: parsedData?._meta?.exportedAt,
    version: parsedData?._meta?.version,
  };

  if (!parsedData || typeof parsedData !== 'object') return result;

  const extractState = (rawVal: any) => {
    if (!rawVal) return null;
    if (typeof rawVal === 'object') return rawVal.state || rawVal;
    try {
      let p = JSON.parse(rawVal);
      if (typeof p === 'string') p = JSON.parse(p);
      return p?.state || p;
    } catch {
      return null;
    }
  };

  // Players
  const playerState = extractState(parsedData['katfc-player-storage']);
  if (Array.isArray(playerState?.players)) result.playerCount = playerState.players.length;

  // Matches
  const matchState = extractState(parsedData['katfc-match-storage-v5']);
  if (Array.isArray(matchState?.matches)) result.matchCount = matchState.matches.length;

  // Tournaments
  const tourState = extractState(parsedData['katfc-tournaments-storage']);
  if (Array.isArray(tourState?.tournaments)) result.tournamentCount = tourState.tournaments.length;

  // Tactics
  const tacticState = extractState(parsedData['tactic-storage']);
  if (Array.isArray(tacticState?.savedTactics)) result.tacticCount = tacticState.savedTactics.length;

  // Venues
  const venueState = extractState(parsedData['katfc-venues-storage']);
  if (Array.isArray(venueState?.venues)) result.venueCount = venueState.venues.length;

  // Fund & Fines
  const fundState = extractState(parsedData['katfc-fund-storage']);
  if (Array.isArray(fundState?.transactions)) result.fundTransactionCount = fundState.transactions.length;
  if (Array.isArray(fundState?.fines)) result.fineCount = fundState.fines.length;

  // Equipment & Jerseys
  const eqState = extractState(parsedData['katfc-equipment-storage']);
  if (Array.isArray(eqState?.items)) result.equipmentItemCount = eqState.items.length;
  if (Array.isArray(eqState?.jerseys)) result.jerseyCount = eqState.jerseys.length;

  // Training
  const trainState = extractState(parsedData['katfc-training-storage']);
  if (Array.isArray(trainState?.sessions)) result.trainingSessionCount = trainState.sessions.length;

  // Bank info
  const bankRaw = extractState(parsedData['5tactiq_bank_info']);
  if (bankRaw && (bankRaw.bankId || bankRaw.accountNo || bankRaw.accountName)) {
    result.hasBankInfo = true;
  }

  return result;
};

export const getCurrentDeviceInventory = (): BackupInventory => {
  const players = usePlayerStore.getState().players || [];
  const matches = useMatchStore.getState().matches || [];
  const tournaments = useTournamentStore.getState().tournaments || [];
  const savedTactics = useTacticStore.getState().savedTactics || [];
  const venues = useVenueStore.getState().venues || [];
  const transactions = useFundStore.getState().transactions || [];
  const fines = useFundStore.getState().fines || [];
  const items = useEquipmentStore.getState().items || [];
  const jerseys = useEquipmentStore.getState().jerseys || [];
  const sessions = useTrainingStore.getState().sessions || [];

  let hasBank = false;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const b = JSON.parse(window.localStorage.getItem('5tactiq_bank_info') || '{}');
      if (b.bankId || b.accountNo || b.accountName) hasBank = true;
    } catch {}
  }

  return {
    playerCount: players.length,
    matchCount: matches.length,
    tournamentCount: tournaments.length,
    tacticCount: savedTactics.length,
    venueCount: venues.length,
    fundTransactionCount: transactions.length,
    fineCount: fines.length,
    equipmentItemCount: items.length,
    jerseyCount: jerseys.length,
    trainingSessionCount: sessions.length,
    hasBankInfo: hasBank,
  };
};

export const exportData = async (): Promise<string> => {
  const data: Record<string, any> = {};
  for (const key of STORAGE_KEYS) {
    let val = await capacitorStorage.getItem(key);
    // Also fallback to localStorage for bank info or other web items
    if (!val && typeof window !== 'undefined' && window.localStorage) {
      val = window.localStorage.getItem(key);
    }
    data[key] = val;
  }

  // Attach metadata
  data['_meta'] = {
    appName: '5TactiQ',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    schemaVersion: 2,
  };

  return JSON.stringify(data);
};

export const parseBackupData = (jsonData: string | object): Record<string, any> | null => {
  try {
    let parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    
    // Handle double-stringified JSON from older backups
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    
    // Validate if it's an object
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("Failed to parse JSON backup data", error);
    return null;
  }
};

export const mergeZustandState = (existingRaw: string | null, incomingRaw: any): string => {
  if (!existingRaw) return typeof incomingRaw === 'object' ? JSON.stringify(incomingRaw) : String(incomingRaw);
  
  try {
    let existing = JSON.parse(existingRaw);
    if (typeof existing === 'string') existing = JSON.parse(existing);
    
    const incoming = typeof incomingRaw === 'object' ? incomingRaw : JSON.parse(String(incomingRaw));

    if (!existing || typeof existing !== 'object') return typeof incomingRaw === 'object' ? JSON.stringify(incomingRaw) : String(incomingRaw);
    if (!incoming || typeof incoming !== 'object') return typeof incomingRaw === 'object' ? JSON.stringify(incomingRaw) : String(incomingRaw);

    const result = { ...existing };
    
    if (incoming.state && existing.state) {
      const newState = { ...existing.state };
      for (const key of Object.keys(incoming.state)) {
        const incomingVal = incoming.state[key];
        const existingVal = existing.state[key];

        if (Array.isArray(incomingVal) && Array.isArray(existingVal)) {
          const getItemKey = (item: any) => {
            if (!item || typeof item !== 'object') return null;
            return item.id !== undefined ? item.id : (item.jerseyNumber !== undefined ? item.jerseyNumber : null);
          };

          const hasIdentifiableItems = incomingVal.some(getItemKey) || existingVal.some(getItemKey);

          if (hasIdentifiableItems) {
            const map = new Map();
            existingVal.forEach((item: any) => {
              const k = getItemKey(item);
              if (k !== null) map.set(k, item);
            });
            incomingVal.forEach((item: any) => {
              const k = getItemKey(item);
              if (k !== null) map.set(k, item);
            });
            newState[key] = Array.from(map.values());
          } else {
            newState[key] = incomingVal;
          }
        } else if (typeof incomingVal === 'object' && incomingVal !== null && typeof existingVal === 'object' && existingVal !== null && !Array.isArray(incomingVal)) {
          newState[key] = { ...existingVal, ...incomingVal };
        } else {
          newState[key] = incomingVal;
        }
      }
      result.state = newState;
      return JSON.stringify(result);
    }

    // Plain object without Zustand .state envelope (e.g. bank info, theme)
    return JSON.stringify({ ...existing, ...incoming });
  } catch (error) {
    console.error("Failed to merge states, falling back to incoming data", error);
    return typeof incomingRaw === 'object' ? JSON.stringify(incomingRaw) : String(incomingRaw);
  }
};

export const importSelectedData = async (parsedData: Record<string, any>, selectedKeys: string[], mode: 'overwrite' | 'merge' = 'overwrite'): Promise<boolean> => {
  try {
    let importedCount = 0;
    
    for (const key of selectedKeys) {
      if (STORAGE_KEYS.includes(key) && parsedData[key] !== undefined && parsedData[key] !== null) {
        let valueToSave = typeof parsedData[key] === 'object' ? JSON.stringify(parsedData[key]) : String(parsedData[key]);
        
        if (mode === 'merge') {
          let existingData = await capacitorStorage.getItem(key);
          if (!existingData && typeof window !== 'undefined' && window.localStorage) {
            existingData = window.localStorage.getItem(key);
          }
          valueToSave = mergeZustandState(existingData, parsedData[key]);
        }
        
        await capacitorStorage.setItem(key, valueToSave);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, valueToSave);
        }
        importedCount++;
      }
    }
    
    await rehydrateAllStores();
    console.log(`[Sync] Imported ${importedCount} selected storage keys and rehydrated all stores (Mode: ${mode})`);
    return importedCount > 0;
  } catch (error) {
    console.error("Failed to import selected data", error);
    return false;
  }
};

export const downloadJsonFile = (jsonData: string, filename: string = 'data.5tactiQ') => {
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
