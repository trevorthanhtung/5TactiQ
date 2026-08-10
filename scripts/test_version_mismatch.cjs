const STORAGE_KEYS_META_OLD = {
  'katfc-player-storage': 'Đội hình & Cầu thủ',
  'katfc-match-storage-v4': 'Dữ liệu Trận đấu',
  'tactic-storage': 'Sơ đồ Chiến thuật'
};

const parsedData = {
  'katfc-match-storage-v5': '{"state":{"matches":[{"opponent":"THẢO VY 4"}]},"version":0}'
};

const uiKeys = Object.keys(parsedData).filter(k => STORAGE_KEYS_META_OLD[k]);
console.log("Keys shown in UI checkboxes:", uiKeys);
