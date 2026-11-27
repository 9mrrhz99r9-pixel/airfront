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

// ボス記録の保存
function saveBossRecords(recordKey, elapsed) {
  const records = loadBossRecords(recordKey);

  records.push(elapsed);
  records.sort((a, b) => a - b);

  const topRecords = records.slice(0, 3);

  try {
    localStorage.setItem(
      recordKey,
      JSON.stringify(topRecords)
    );
  } catch (error) {
    console.warn('ボス記録の保存に失敗', error);
  }

  return topRecords;
}