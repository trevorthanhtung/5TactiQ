import { capacitorStorage } from '../utils/capacitorStorage';

export const STORAGE_KEYS_META: Record<string, string> = {
  'katfc-player-storage': 'Đội hình & Cầu thủ',
  'katfc-match-storage-v4': 'Dữ liệu Trận đấu',
  '5tactiq-settings-storage': 'Cài đặt Chung',
  'katfc-training-storage': 'Lịch Tập luyện',
  'katfc-fund-storage': 'Quỹ đội',
  'katfc-venues-storage': 'Danh bạ Sân bóng',
  'tactic-storage': 'Sơ đồ Chiến thuật'
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

export const importSelectedData = async (parsedData: Record<string, any>, selectedKeys: string[]): Promise<boolean> => {
  try {
    let importedCount = 0;
    
    for (const key of selectedKeys) {
      if (STORAGE_KEYS.includes(key) && parsedData[key] !== undefined && parsedData[key] !== null) {
        const valueToSave = typeof parsedData[key] === 'object' ? JSON.stringify(parsedData[key]) : String(parsedData[key]);
        await capacitorStorage.setItem(key, valueToSave);
        importedCount++;
      }
    }
    
    console.log(`[Sync] Imported ${importedCount} selected storage keys`);
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
