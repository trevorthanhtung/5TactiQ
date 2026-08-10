import { capacitorStorage } from '../utils/capacitorStorage';

export const STORAGE_KEYS_META: Record<string, string> = {
  'katfc-player-storage': 'Đội hình, Chấn thương & Tier',
  'tactic-storage': 'Dữ liệu Sa bàn (Chiến thuật)',
  'katfc-match-storage-v5': 'Dữ liệu Trận đấu & Lịch sử',
  'katfc-venues-storage': 'Danh bạ Đội bóng',
  '5tactiq-settings-storage': 'Cài đặt Chung'
};

export const STORAGE_KEYS = Object.keys(STORAGE_KEYS_META);

export const exportData = async (): Promise<string> => {
  const data: Record<string, string | null> = {};
  for (const key of STORAGE_KEYS) {
    data[key] = await capacitorStorage.getItem(key);
  }
  return JSON.stringify(data);
};

export const parseBackupData = (jsonData: string): Record<string, any> | null => {
  try {
    let parsed = JSON.parse(jsonData);
    
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
          // If arrays contain objects with 'id', merge them by id
          if ((incomingVal.length > 0 && typeof incomingVal[0] === 'object' && incomingVal[0] !== null && 'id' in incomingVal[0]) ||
              (existingVal.length > 0 && typeof existingVal[0] === 'object' && existingVal[0] !== null && 'id' in existingVal[0])) {
            const map = new Map();
            existingVal.forEach((item: any) => {
              if (item && item.id) map.set(item.id, item);
            });
            incomingVal.forEach((item: any) => {
              if (item && item.id) map.set(item.id, item); // Incoming overwrites existing on ID conflict
            });
            newState[key] = Array.from(map.values());
          } else {
            // Otherwise, incoming array overwrites
            newState[key] = incomingVal;
          }
        } else {
          newState[key] = incomingVal;
        }
      }
      result.state = newState;
      return JSON.stringify(result);
    }

    return typeof incomingRaw === 'object' ? JSON.stringify(incomingRaw) : String(incomingRaw);
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
          const existingData = await capacitorStorage.getItem(key);
          valueToSave = mergeZustandState(existingData, parsedData[key]);
        }
        
        await capacitorStorage.setItem(key, valueToSave);
        importedCount++;
      }
    }
    
    console.log(`[Sync] Imported ${importedCount} selected storage keys (Mode: ${mode})`);
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
