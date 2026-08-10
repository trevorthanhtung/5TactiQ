const assert = require('assert');

// Mock capacitor storage
const mockStorage = new Map();
mockStorage.set('katfc-player-storage', '{"state":{"players":[{"name":"Player1"}]},"version":0}');
mockStorage.set('tactic-storage', '{"state":{"savedTactics":[{"name":"Tactic1"}]},"version":0}');

const STORAGE_KEYS_META = {
  'katfc-player-storage': 'P',
  'tactic-storage': 'T',
};
const STORAGE_KEYS = Object.keys(STORAGE_KEYS_META);

async function exportData() {
  const data = {};
  for (const key of STORAGE_KEYS) {
    data[key] = mockStorage.get(key) || null;
  }
  return JSON.stringify(data);
}

function parseBackupData(jsonData) {
  let parsed = JSON.parse(jsonData);
  if (typeof parsed === 'string') parsed = JSON.parse(parsed);
  return typeof parsed === 'object' && parsed !== null ? parsed : null;
}

async function importSelectedData(parsedData, selectedKeys) {
  for (const key of selectedKeys) {
    if (STORAGE_KEYS.includes(key) && parsedData[key] !== undefined && parsedData[key] !== null) {
      const valueToSave = typeof parsedData[key] === 'object' ? JSON.stringify(parsedData[key]) : String(parsedData[key]);
      mockStorage.set(key, valueToSave);
    }
  }
}

(async () => {
  const exported = await exportData();
  console.log("Exported:", exported);
  
  // Clear storage to simulate receiving device
  mockStorage.clear();
  
  const parsed = parseBackupData(exported);
  console.log("Parsed keys:", Object.keys(parsed));
  
  await importSelectedData(parsed, Object.keys(parsed));
  
  console.log("Restored Player:", mockStorage.get('katfc-player-storage'));
  console.log("Restored Tactic:", mockStorage.get('tactic-storage'));
})();
