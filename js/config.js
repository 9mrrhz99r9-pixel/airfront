'use strict';
// =========================
// 調整用パラメータ
// 数値を変更するとゲームバランスを調整できます。
// =========================
const CONFIG = {
  playerSpeed: 430,           // プレイヤー移動速度(px/秒)
  playerFireInterval: 0.5,    // プレイヤー発射間隔(秒)
  playerBulletSpeed: 620,     // プレイヤー弾速度
  playerMaxHp: 3,
  invincibleTime: 1.2,        // 被弾後の無敵時間(秒)

  enemyInitialLimit: 8,       // 初期の敵同時出現上限
  enemyLimitIncrease: 2,      // 30秒ごとの上限増加数
  enemyLimitInterval: 30,
  enemySpawnInterval: 1.35,   // 初期敵出現間隔(秒)
  enemySpawnShorten: 0.08,    // 30秒ごとの短縮量
  enemySpawnMin: 0.35,        // 最短出現間隔

  enemySpeed: {
    shooter: 75,
    charger: 62,
    guard: 48
  },
  enemyHp: {
    shooter: 2,
    charger: 3,
    guard: 1,
    bomber: 1,
    splitter: 3
  },
  enemyScore: {
    shooter: 120,
    charger: 200,
    guard: 40,
    bomber: 100,
    splitter: 200
  },
  shooterFireInterval: 3,
  enemyBulletSpeed: 230,
  chargerRushDelay: 2.8,
  chargerRushSpeed: 180,
  guardGroupSize: 5,
  guardSideSpeed: 38,
  
  bossMaxHp: 150,
  bossSpeed: 45
};
