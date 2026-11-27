'use strict';

// ボス記録の読み込み
function loadBossRecords(recordKey) {
  try {
    const records = JSON.parse(
      localStorage.getItem(recordKey) || '[]'
    );

    if (!Array.isArray(records)) {
      return [];
    }

    return records.filter(
      time => Number.isFinite(time) && time >= 0
    );

  } catch (error) {
    console.warn('ボス記録の読み込みに失敗', error);
    return [];
  }
}
