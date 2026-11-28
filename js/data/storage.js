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

// 自己ベストの読み込み
function loadLocalBestScore() {
  return Number(
    localStorage.getItem('sky_defender_best') || 0
  );
}

// 自己ベストの保存
function saveLocalBestScore(newScore) {
  localStorage.setItem(
    'sky_defender_best',
    String(newScore)
  );
}

// ステルス機の解放状態を読み込む
function loadStealthUnlocked() {
  return localStorage.getItem(
    'sky_defender_stealth_unlocked'
  ) === 'true';
}

// ステルス機の解放状態を保存する
function saveStealthUnlocked() {
  localStorage.setItem(
    'sky_defender_stealth_unlocked',
    'true'
  );
}