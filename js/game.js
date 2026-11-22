(() => {
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

// =========================
// DOM・Canvas
// =========================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// 敵画像
const enemyImages = {
  shooter: new Image(),
  charger: new Image(),
  guard: new Image(),
  bomber: new Image(),
  splitter: new Image()
};

enemyImages.shooter.src = './assets/enemy/shooter.PNG';
enemyImages.charger.src = './assets/enemy/charger.PNG';
enemyImages.guard.src = './assets/enemy/guard.PNG';
enemyImages.bomber.src = './assets/enemy/bomber.PNG';
enemyImages.splitter.src = './assets/enemy/splitter.PNG';

// ボス画像
const bossImage = new Image();
bossImage.src = './assets/boss/boss1.PNG';

// DREADNOUGHT画像
const dreadnoughtBossImage = new Image();
dreadnoughtBossImage.src = './assets/boss/boss2.PNG';

// ボス触手画像
const tentacleImageA = new Image();
tentacleImageA.src = './assets/boss/tentacle_a.png';

const tentacleImageB = new Image();
tentacleImageB.src = './assets/boss/tentacle_b.png';

const titleScreen = document.getElementById('titleScreen');
const modeScreen = document.getElementById('modeScreen');
const bossButton = document.getElementById('bossButton');
const bossSelectScreen = document.getElementById('bossSelectScreen');
const taintButton = document.getElementById('taintButton');
const bossInfoName = document.getElementById('bossInfoName');
const bossInfoText = document.getElementById('bossInfoText');
const bossRecordList = document.getElementById('bossRecordList');
const bossDifficultyList = document.getElementById('bossDifficultyList');
const bossList = document.getElementById('bossList');
const bossBackButton = document.getElementById('bossBackButton');
const bossStartButton = document.getElementById('bossStartButton');
const scoreButton = document.getElementById('scoreButton');
const skinScreen = document.getElementById('skinScreen');
const skinButton = document.getElementById('skinButton');
const skinList = document.getElementById('skinList');
const skinBackButton = document.getElementById('skinBackButton');

// アタッチメント選択画面
const attachmentScreen = document.getElementById('attachmentScreen');
const attachmentSelectButton = document.getElementById('attachmentSelectButton');
const attachmentBackButton = document.getElementById('attachmentBackButton');
// アタッチメント一覧・情報表示
const attachmentList = document.getElementById('attachmentList');
const attachmentInfoName = document.getElementById('attachmentInfoName');
const attachmentInfoRarity = document.getElementById('attachmentInfoRarity');
const attachmentInfoEffect = document.getElementById('attachmentInfoEffect');
const attachmentInfoCount = document.getElementById('attachmentInfoCount');
const attachmentInfoStatus = document.getElementById('attachmentInfoStatus');
const attachmentEquipButton = document.getElementById('attachmentEquipButton');
const attachmentSynthesizeButton = document.getElementById('attachmentSynthesizeButton');
const attachmentSynthesizeHint = document.getElementById('attachmentSynthesizeHint');

// =========================
// アタッチメント基本データ
// =========================
const ATTACHMENT_DATA = [
  {
    id: 'bullet_accelerator',
    name: '弾体加速モジュール',
    image: 'assets/attachments/bullet_accelerator.PNG',
    effects: ['弾速+10%', '弾速+20%', '弾速+30%', '弾速+50%']
  },
  {
    id: 'rapid_loader',
    name: '高速装填機構',
    image: 'assets/attachments/rapid_loader.PNG',
    effects: ['発射間隔0.45秒', '発射間隔0.40秒', '発射間隔0.30秒', '発射間隔0.20秒']
  },
  {
    id: 'spread_unit',
    name: '拡散射撃ユニット',
    image: 'assets/attachments/spread_unit.PNG',
    effects: ['2方向射撃', '3方向射撃', '4方向射撃', '5方向射撃']
  },
  {
    id: 'armor_module',
    name: '複合装甲モジュール',
    image: 'assets/attachments/armor_module.PNG',
    effects: ['最大HP4', '最大HP5', '最大HP6', '最大HP8']
  },
  {
    id: 'shield_generator',
    name: '電磁防壁発生器',
    image: 'assets/attachments/shield_generator.PNG',
    effects: [
      '防壁HP1・再展開20秒',
      '防壁HP1・再展開16秒',
      '防壁HP1・再展開12秒',
      '防壁HP2・再展開10秒'
    ]
  },
  {
    id: 'evasion_system',
    name: '緊急回避システム',
    image: 'assets/attachments/evasion_system.PNG',
    effects: ['ダメージ無効化5%', 'ダメージ無効化10%', 'ダメージ無効化15%', 'ダメージ無効化25%']
  }
];

const ATTACHMENT_RARITIES = [
  { id: 'common', name: 'COMMON', color: '#ffffff' },
  { id: 'rare', name: 'RARE', color: '#3498ff' },
  { id: 'epic', name: 'EPIC', color: '#ad63ff' },
  { id: 'legendary', name: 'LEGENDARY', color: '#ffcc33' }
];

// =========================
// アタッチメント所持・装備データ
// =========================
const ATTACHMENT_SAVE_KEY = 'sky_defender_attachments_v1';

// 所持数：アタッチメントID → レアリティ → 個数
let attachmentInventory = {};

// 装備中：未装備ならnull
let equippedAttachment = null;

// 保存データの読み込み
function loadAttachmentData() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(ATTACHMENT_SAVE_KEY)
    );

    attachmentInventory =
      saved?.inventory &&
      typeof saved.inventory === 'object' &&
      !Array.isArray(saved.inventory)
        ? saved.inventory
        : {};

    equippedAttachment = saved?.equipped ?? null;
  } catch (error) {
    attachmentInventory = {};
    equippedAttachment = null;
  }
}

// 保存データの書き込み
function saveAttachmentData() {
  localStorage.setItem(
    ATTACHMENT_SAVE_KEY,
    JSON.stringify({
      inventory: attachmentInventory,
      equipped: equippedAttachment
    })
  );
}

// 指定した種類・レアリティの所持数
function getAttachmentCount(id, rarity) {
  return attachmentInventory[id]?.[rarity] ?? 0;
}

// アタッチメントを所持品に追加
function addAttachment(id, rarity, amount = 1) {
  if (!ATTACHMENT_DATA.some(item => item.id === id)) return;
  if (!ATTACHMENT_RARITIES.some(item => item.id === rarity)) return;
  if (!Number.isInteger(amount) || amount <= 0) return;

  if (!attachmentInventory[id]) {
    attachmentInventory[id] = {};
  }

  attachmentInventory[id][rarity] =
    getAttachmentCount(id, rarity) + amount;

  saveAttachmentData();
}

// 保存済みデータを読み込む
loadAttachmentData();

// =========================
// アタッチメント一覧表示
// =========================
function renderAttachmentList() {
  // =========================
// アタッチメント合成
// =========================
attachmentSynthesizeButton.addEventListener('click', () => {
  if (!selectedAttachment) return;

  const { id, rarity } = selectedAttachment;

  const rarityIndex = ATTACHMENT_RARITIES.findIndex(
    item => item.id === rarity
  );

  // 最高レアリティは合成不可
  if (
    rarityIndex < 0 ||
    rarityIndex >= ATTACHMENT_RARITIES.length - 1
  ) return;

  // 同種・同レアリティが3個必要
  if (getAttachmentCount(id, rarity) < 3) return;

  const attachment = ATTACHMENT_DATA.find(
    item => item.id === id
  );

  const nextRarity = ATTACHMENT_RARITIES[rarityIndex + 1];

  if (!attachment) return;

  // 合成前の確認
  const confirmed = confirm(
    `${attachment.name}\n` +
    `${ATTACHMENT_RARITIES[rarityIndex].name} ×3\n` +
    `↓\n` +
    `${nextRarity.name} ×1\n\n` +
    `合成しますか？`
  );

  if (!confirmed) return;

  // 素材を3個消費
  attachmentInventory[id][rarity] -= 3;

  // 素材が0個になった場合、装備を解除
  if (
    attachmentInventory[id][rarity] === 0 &&
    equippedAttachment?.id === id &&
    equippedAttachment?.rarity === rarity
  ) {
    equippedAttachment = null;
  }

  // 上位レアリティを1個獲得
  addAttachment(id, nextRarity.id, 1);

  // 保存
  saveAttachmentData();

  // 一覧と詳細を更新
  renderAttachmentList();

  const rarityData = ATTACHMENT_RARITIES[rarityIndex];
  showAttachmentInfo(attachment, rarityData);

  alert(
    `合成成功！\n` +
    `${attachment.name}\n` +
    `${nextRarity.name} ×1 を獲得しました`
  );
});
  // =========================
// アタッチメント装備・解除
// =========================
let selectedAttachment = null;

attachmentEquipButton.addEventListener('click', () => {
  if (!selectedAttachment) return;

  const { id, rarity } = selectedAttachment;

  // 未所持なら操作できない
  if (getAttachmentCount(id, rarity) <= 0) return;

  const isEquipped =
    equippedAttachment?.id === id &&
    equippedAttachment?.rarity === rarity;

  // 装備中なら解除、それ以外なら装備
  equippedAttachment = isEquipped
    ? null
    : { id, rarity };

  saveAttachmentData();

  // 一覧と詳細を更新
  renderAttachmentList();

  const attachment = ATTACHMENT_DATA.find(
    item => item.id === id
  );

  const rarityData = ATTACHMENT_RARITIES.find(
    item => item.id === rarity
  );

  showAttachmentInfo(attachment, rarityData);
});
  // =========================
// アタッチメント詳細表示
// =========================
function showAttachmentInfo(attachment, rarity) {
  const count = getAttachmentCount(
    attachment.id,
    rarity.id
  );

  attachmentInfoName.textContent = attachment.name;
  attachmentInfoRarity.textContent = rarity.name;
  attachmentInfoRarity.style.color = rarity.color;

  // 未所持
  if (count <= 0) {
    attachmentInfoEffect.textContent = '未所持';
    attachmentInfoCount.textContent = '';
    attachmentInfoStatus.textContent = '';

    attachmentEquipButton.classList.add('hidden');
    attachmentSynthesizeButton.classList.add('hidden');
    attachmentSynthesizeHint.textContent = '';
    return;
  }

  const rarityIndex = ATTACHMENT_RARITIES.findIndex(
    item => item.id === rarity.id
  );

  attachmentInfoEffect.textContent =
    attachment.effects[rarityIndex];

  attachmentInfoCount.textContent = `所持数：${count}`;

  const isEquipped =
    equippedAttachment?.id === attachment.id &&
    equippedAttachment?.rarity === rarity.id;

  attachmentInfoStatus.textContent =
    isEquipped ? '装備中' : '未装備';

  attachmentEquipButton.textContent =
    isEquipped ? '装備解除' : '装備';

  attachmentEquipButton.classList.remove('hidden');

  // 合成条件
  const isMaxRarity = rarity.id === 'legendary';
  const canSynthesize = count >= 3 && !isMaxRarity;

  attachmentSynthesizeButton.classList.remove('hidden');
  attachmentSynthesizeButton.disabled = !canSynthesize;

  attachmentSynthesizeHint.textContent = isMaxRarity
    ? '最高レアリティ'
    : canSynthesize
      ? '合成可能'
      : `合成まであと${3 - count}個`;
}
  attachmentList.innerHTML = '';

  // レアリティ順 → アタッチメント種類順
  for (const rarity of ATTACHMENT_RARITIES) {
    for (const attachment of ATTACHMENT_DATA) {
      const count = getAttachmentCount(
        attachment.id,
        rarity.id
      );

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'attachment-item';

      // レアリティごとの枠色
      button.style.borderColor = rarity.color;

      // 未所持は暗く表示
      if (count === 0) {
        button.classList.add('unowned');
      }

      const img = document.createElement('img');
      img.src = attachment.image;
      img.alt = attachment.name;
      img.className = 'attachment-icon';

      button.appendChild(img);

      // 所持数を右下に表示
      if (count > 0) {
        const countLabel = document.createElement('span');
        countLabel.className = 'attachment-count';
        countLabel.textContent = `×${count}`;
        button.appendChild(countLabel);
      }

      // 装備中のアタッチメントを強調
      if (
        equippedAttachment?.id === attachment.id &&
        equippedAttachment?.rarity === rarity.id
      ) {
        button.classList.add('equipped');
      }

      button.addEventListener('click', () => {
  // 選択中のアタッチメントを記録
  selectedAttachment = {
    id: attachment.id,
    rarity: rarity.id
  };

  // 詳細情報を更新
  showAttachmentInfo(attachment, rarity);
});

      attachmentList.appendChild(button);
    }
  }
}

const gameOverScreen = document.getElementById('gameOverScreen');
const resultTitle = document.getElementById('resultTitle');
const resultEl = document.getElementById('result');
const startButton = document.getElementById('startButton');
const retryButton = document.getElementById('retryButton');
const titleButton = document.getElementById('titleButton');
const fireButton = document.getElementById('fireButton');
const hint = document.getElementById('hint');

// ボスデータ
const BOSS_DATA = [
  {
    id: 'taint',
    name: 'TAINT',
    description:
      '異星から侵入した、正体不明の生物。' +
      '巨大な単眼と無数の小さな眼を持ち、無数の触手を伸ばす。' +
      'その身体は周囲の環境を侵食し、異質なものへと変えていく。' +
      '人類にとって、極めて危険な侵略生命体である。',

    difficulties: [
      'EASY',
      'NORMAL',
      'HARD',
      'EXPERT'
    ]
    },
  {
    id: 'dreadnought',
    name: 'DREADNOUGHT',
    description:
      'かつて宇宙を航行していた巨大戦艦。' +
      'その船体は正体不明の異星生命体に侵食され、' +
      '今や意思を持つ異形の戦闘兵器と化している。',

    difficulties: [
      'EASY',
      'NORMAL',
      'HARD',
      'EXPERT'
    ]
  }
];
let selectedBoss = null;
let selectedBossDifficulty = null;

// TAINT 難易度別設定
const TAINT_DIFFICULTY = {
  EASY: {
    hp: 100
  },
  NORMAL: {
    hp: 150
  },
  HARD: {
    hp: 200
  },
  EXPERT: {
    hp: 350
  }
};

// DREADNOUGHT 難易度別設定
const DREADNOUGHT_DIFFICULTY = {
  EASY: {
    hp: 100
  },
  NORMAL: {
    hp: 150
  },
  HARD: {
    hp: 200
  },
  EXPERT: {
    hp: 350
  }
};

// ボス一覧生成
function renderBossList() {
  bossList.querySelectorAll('button, .bossDifficultyControl')
    .forEach(element => element.remove());

  for (const boss of BOSS_DATA) {
    const row = document.createElement('div');
    row.className = 'bossDifficultyControl';

    const button = document.createElement('button');
    button.textContent = boss.name;

    const difficultyArea = document.createElement('div');
    difficultyArea.className = 'difficultyArea';

    const leftButton = document.createElement('button');
    leftButton.textContent = '◀';

    const difficultyText = document.createElement('span');
    difficultyText.textContent = '未選択';

    const rightButton = document.createElement('button');
    rightButton.textContent = '▶';

    let difficultyIndex = 0;

    function updateDifficulty() {
  difficultyText.textContent = boss.difficulties[difficultyIndex];
  selectedBossDifficulty = boss.difficulties[difficultyIndex];

  renderBossRecords(selectedBossDifficulty);
}

    button.addEventListener('click', () => {
      selectedBoss = boss;

      bossInfoName.textContent = boss.name;
      bossInfoText.textContent = boss.description;

      selectedBossDifficulty = null;
      difficultyIndex = 0;

      updateDifficulty();
      bossStartButton.disabled = false;

      bossList.querySelectorAll('button')
        .forEach(b => b.classList.remove('selected'));

      button.classList.add('selected');
    });

    leftButton.addEventListener('click', () => {
      if (selectedBoss !== boss) return;

      difficultyIndex =
        (difficultyIndex - 1 + boss.difficulties.length) %
        boss.difficulties.length;

      updateDifficulty();
    });

    rightButton.addEventListener('click', () => {
      if (selectedBoss !== boss) return;

      difficultyIndex =
        (difficultyIndex + 1) % boss.difficulties.length;

      updateDifficulty();
    });

    difficultyArea.appendChild(leftButton);
    difficultyArea.appendChild(difficultyText);
    difficultyArea.appendChild(rightButton);

    row.appendChild(button);
    row.appendChild(difficultyArea);

    bossList.appendChild(row);
  }
}


// プレイヤースキン管理
const PLAYER_SKINS = {
  default: {
    name: '汎用迎撃機',
    image: './assets/player/player_default.png',
    unlocked: true,
    hint: ''
  },

  stealth: {
    name: '低被探知型迎撃機',
    image: './assets/player/stealth_sheet.PNG',
    unlocked: localStorage.getItem('sky_defender_stealth_unlocked') === 'true',
    hint: 'SCORE ATTACKで10,000点以上を獲得する'
  },

  experimental: {
    name: '実験機',
    image: './assets/player/04_experimental.png',
    unlocked: true,
    hint: ''
  },

  organic: {
    name: '異形機',
    image: './assets/player/05_organic.png',
    unlocked: true,
    hint: ''
  },

  special: {
    name: '特別仕様機',
    image: './assets/player/06_special.png',
    unlocked: true,
    hint: ''
  },

  saucer: {
    name: '円盤型宇宙艇',
    image: './assets/player/07_saucer.png',
    unlocked: true,
    hint: ''
  },
  
  heavyArmor: {
    name: '重装甲機',
    image: './assets/player/01_heavy_armor.png',
    unlocked: true,
    hint: ''
  },

  highMobility: {
    name: '高機動機',
    image: './assets/player/02_high_mobility.png',
    unlocked: true,
    hint: ''
  },

  heavyArmed: {
    name: '重武装機',
    image: './assets/player/03_heavy_armed.png',
    unlocked: true,
    hint: ''
  }
};

let selectedSkin = 'default';
let previewSkinId = selectedSkin;
const playerImage = new Image();
playerImage.src = PLAYER_SKINS[selectedSkin].image;
const stealthImage = new Image();
stealthImage.src = './assets/player/stealth_sheet.PNG';
function changePlayerSkin(skinId) {
  if (!PLAYER_SKINS[skinId]) return;

  selectedSkin = skinId;
  playerImage.src = PLAYER_SKINS[skinId].image;
}

let W = 0, H = 0, dpr = 1;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// =========================
// ゲーム状態
// =========================
let state = 'title';
let gameMode = 'score';
let player, playerBullets, enemyBullets, enemies, guardGroups;
let score = 0, elapsed = 0, spawnTimer = 0, fireTimer = 0;
let boss = null;
let bossTentacles = [];
let bossBeams = [];
let bossBeamTimer = 5;
let dreadnoughtGuardTimer = 8;
let dreadnoughtRainTimer = 0.4;

// DREADNOUGHT 主砲レーザー
let dreadnoughtLaser = {
  chargeTimer: 0,
  firingTimer: 0,
  reloadTimer: 0,
  targetX: 0,
  targetY: 0,
  directionX: 0,
  directionY: 0,
  charging: false,
  firing: false
};

let bossBeamWarning = null;
let leftTentacleTimer = 3;
let rightTentacleTimer = 4.5;
let leftThirdTentacleTimer = 6.5;
let rightThirdTentacleTimer = 6.5;
let invincibleTimer = 0, lastTime = 0;
let pointerActive = false, firing = false;
let bestScore = Number(localStorage.getItem('sky_defender_best') || 0);

function resetGame() {
  player = { x: W / 2, y: H - 140, w: 34, h: 42, hp: CONFIG.playerMaxHp };
  playerBullets = [];
  enemyBullets = [];
  enemies = [];
  guardGroups = [];
  score = 0;
  elapsed = 0;
  spawnTimer = 0;
  fireTimer = 0;
  invincibleTimer = 0;
  firing = false;
  
  boss = null;
  bossTentacles = [];
  bossBeams = [];
  bossBeamWarning = null;
  bossBeamTimer = 5;
  dreadnoughtGuardTimer = 8;
  dreadnoughtRainTimer = 0.4;
  
  dreadnoughtLaser = {
  chargeTimer: 0,
  firingTimer: 0,
  reloadTimer: 0,
  targetX: 0,
  targetY: 0,
  directionX: 0,
  directionY: 0,
  charging: false,
  firing: false
};

  leftTentacleTimer = 3;
  rightTentacleTimer = 4.5;
  leftThirdTentacleTimer = 6.5;
  rightThirdTentacleTimer = 6.5;

if (gameMode === 'boss') {
  const difficultyTable =
    selectedBoss.id === 'dreadnought'
      ? DREADNOUGHT_DIFFICULTY
      : TAINT_DIFFICULTY;

  const difficultyConfig =
    difficultyTable[selectedBossDifficulty] || difficultyTable.EASY;

  boss = {
    id: selectedBoss.id,
    name: selectedBoss.name,
    x: W / 2,
    y: -80,
    w: 120,
    h: 120,
    hp: difficultyConfig.hp,
    maxHp: difficultyConfig.hp,
    speed: CONFIG.bossSpeed,
    active: false
  };
}
}

function startGame() {
  resize();
  resetGame();
  state = 'playing';
  titleScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  fireButton.classList.remove('hidden');
  hint.classList.remove('hidden');
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

// 難易度別クリアタイム上位3件
function renderBossRecords(difficulty) {
  const bossRecordId = selectedBoss.id === 'dreadnought' ? 'boss2' : 'boss1';
  const recordKey = `sky_defender_${bossRecordId}_records_${difficulty}`;
  const records = JSON.parse(localStorage.getItem(recordKey) || '[]');

  records.sort((a, b) => a - b);

  const topRecords = records.slice(0, 3);

  bossRecordList.innerHTML = `
    <h3>BEST TIME</h3>
    ${
      topRecords.length > 0
        ? topRecords.map((time, index) =>
            `<p>${index + 1}位：${formatBossTime(time)}</p>`
          ).join('')
        : '<p>記録なし</p>'
    }
  `;
}

// 討伐時間の表示形式
function formatBossTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const milliseconds = Math.floor((time % 1) * 100);

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
}

function endGame(isClear = false) {
  if (state !== 'playing') return;
  state = 'gameover';
  
  // 低被探知型迎撃機の解放判定
if (
  score >= 10000 &&
  PLAYER_SKINS.stealth &&
  !PLAYER_SKINS.stealth.unlocked
) {
  PLAYER_SKINS.stealth.unlocked = true;
  localStorage.setItem('sky_defender_stealth_unlocked', 'true');
}
  firing = false;
  fireButton.classList.add('hidden');
  hint.classList.add('hidden');
  
  resultTitle.textContent =
  gameMode === 'boss' && isClear
    ? 'BOSS CLEAR!'
    : 'GAME OVER';
    
  if (gameMode === 'boss' && isClear) {
  const bossRecordId = boss.id === 'dreadnought' ? 'boss2' : 'boss1';
const recordKey = `sky_defender_${bossRecordId}_records_${selectedBossDifficulty}`;
  const records = JSON.parse(localStorage.getItem(recordKey) || '[]');

  records.push(elapsed);
  records.sort((a, b) => a - b);

  const topRecords = records.slice(0, 3);
  localStorage.setItem(recordKey, JSON.stringify(topRecords));

  resultEl.innerHTML = `
    <strong>${boss.name} CLEAR!</strong><br>
    難易度：${selectedBossDifficulty}<br>
    討伐タイム：${formatBossTime(elapsed)}<br>
    最速討伐タイム：${formatBossTime(topRecords[0])}
  `;
} else {
  const isNewBest = score > bestScore;

  if (isNewBest) {
    bestScore = score;
    localStorage.setItem('sky_defender_best', String(bestScore));
    saveBestScore(score);
  }

  resultEl.innerHTML = `今回のスコア：<strong>${score}</strong><br>自己ベスト：<strong>${bestScore}</strong>${isNewBest ? '<br>NEW RECORD!' : ''}`;
}
  gameOverScreen.classList.remove('hidden');
}

// =========================
// 敵生成
// =========================
function activeEnemyCount() {
  // 生存している敵だけ数える
  return enemies.length + guardGroups.reduce(
    (sum, group) =>
      sum + group.members.filter(m => m.alive).length,
    0
  );
}
function currentEnemyLimit() {
  return CONFIG.enemyInitialLimit +
    Math.floor(elapsed / CONFIG.enemyLimitInterval) * CONFIG.enemyLimitIncrease;
}
function currentSpawnInterval() {
  return Math.max(CONFIG.enemySpawnMin,
    CONFIG.enemySpawnInterval -
    Math.floor(elapsed / CONFIG.enemyLimitInterval) * CONFIG.enemySpawnShorten);
}
function spawnEnemy() {
  const roll = Math.random();
  if (roll < 0.43) {
    enemies.push(makeEnemy('shooter', Math.random() * (W - 50) + 25));
  } else if (roll < 0.70) {
    enemies.push(makeEnemy('charger', Math.random() * (W - 50) + 25));
  } else if (roll < 0.85) {
    spawnGuardGroup();
  } else if (roll < 0.925) {
    enemies.push(makeEnemy('bomber', Math.random() * (W - 50) + 25));
  } else {
    enemies.push(makeEnemy('splitter', Math.random() * (W - 50) + 25));
  }
}
function makeEnemy(type, x) {
  const size = type === 'guard' ? 25 : 30;

  return {
    type, x, y: -35, w: size, h: size,
    hp: CONFIG.enemyHp[type],
    fireTimer: CONFIG.shooterFireInterval,
    age: 0,
    rushing: false,
    vx: 0,
    direction: Math.random() < 0.5 ? -1 : 1,

    // 停止位置
    stopY: type === 'bomber'
      ? H * 0.5
      : type === 'splitter'
        ? H * (0.2 + Math.random() * 0.3)
        : H * (0.25 + Math.random() * 0.15),

    // SPLITTER小型機用
    isSplitterChild: false,
    splitPhase: 0,
    targetX: 0,
    targetY: 0,

    alive: true
  };
}
function spawnGuardGroup() {
  const count = Math.min(CONFIG.guardGroupSize, currentEnemyLimit() - activeEnemyCount());
  if (count <= 0) return;
  const spacing = 34;
  const totalWidth = (count - 1) * spacing;
  const startX = Math.max(20, Math.min(W - totalWidth - 20, W / 2 - totalWidth / 2));
  const members = [];
  for (let i = 0; i < count; i++) {
    members.push({
      x: startX + i * spacing, y: -30 - Math.floor(i / 5) * 30,
      w: 24, h: 24, hp: CONFIG.enemyHp.guard, alive: true
    });
  }
  guardGroups.push({ members, direction: 1, stopped: false, stopY: H * 0.5 });
}

// DREADNOUGHT専用 GUARD召喚
function spawnDreadnoughtGuards() {
  for (const side of [-1, 1]) {
    const count = 3 + Math.floor(Math.random() * 3);
    const spacing = 34;
    const startX = side === -1
      ? 20
      : W - 20 - (count - 1) * spacing;

    const members = [];

    for (let i = 0; i < count; i++) {
      members.push({
        x: startX + i * spacing,
        y: -30 - Math.random() * 80,
        w: 24,
        h: 24,
        hp: CONFIG.enemyHp.guard,
        alive: true
      });
    }

    guardGroups.push({
      members,
      direction: side === -1 ? 1 : -1,
      stopped: false,
      stopY: H * (0.3 + Math.random() * 0.2)
    });
  }
}

// =========================
// 入力
// =========================
let movePointerId = null;
let firePointerId = null;

let lastPointerX = 0;
let moveDeltaX = 0;

canvas.addEventListener('pointerdown', e => {
  if (state !== 'playing') return;
  if (e.clientY > H - 100) return;

  // 移動担当の指がすでにある場合は無視
  if (movePointerId !== null) return;

  movePointerId = e.pointerId;
  lastPointerX = e.clientX;
  moveDeltaX = 0;

  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', e => {
  if (e.pointerId !== movePointerId || state !== 'playing') return;

  const diffX = e.clientX - lastPointerX;
  const rect = canvas.getBoundingClientRect();

  moveDeltaX += diffX * (W / rect.width);

  lastPointerX = e.clientX;
});

function stopPointer(e) {
  if (e.pointerId !== movePointerId) return;

  movePointerId = null;
  moveDeltaX = 0;
}

canvas.addEventListener('pointerup', stopPointer);
canvas.addEventListener('pointercancel', stopPointer);

fireButton.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (state === 'playing') firing = true;
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(type =>
  fireButton.addEventListener(type, () => firing = false)
);

// ボス触手の生成
function spawnBossTentacles(side) {
  // プレイヤーを狙う触手
  bossTentacles.push({
    x: player.x + side * 12,
    length: 0,
    maxLength: H + 50,
    speed: 900,
    retracting: false,
    alive: true
  });

  // ランダム位置を狙う触手
  const randomX = side === -1
    ? Math.random() * (W / 2)
    : W / 2 + Math.random() * (W / 2);

  bossTentacles.push({
    x: randomX,
    y: boss.y + 40,
    length: 0,
    maxLength: H,
    speed: 900,
    retracting: false,
    alive: true
  });
}

// 3本目の触手
function spawnBossThirdTentacle(side) {
  const randomX = side === -1
    ? Math.random() * (W / 2)
    : W / 2 + Math.random() * (W / 2);

  bossTentacles.push({
    x: randomX,
    y: boss.y + 40,
    length: 0,
    maxLength: H,
    speed: 900,
    retracting: false,
    alive: true
  });
}

// =========================
// 更新処理
// =========================
function update(dt) {
  elapsed += dt;
  if (invincibleTimer > 0) invincibleTimer -= dt;

  // プレイヤー左右移動
player.x += moveDeltaX;
moveDeltaX = 0;

player.x = Math.max(
  player.w / 2,
  Math.min(W - player.w / 2, player.x)
);

  // 発砲
fireTimer -= dt;

if (firing && fireTimer <= 0) {
  playerBullets.push({
    x: player.x,
    y: player.y - 25,
    r: 4
  });

  // 基本発射間隔
  let fireInterval = CONFIG.playerFireInterval;

  // 高速装填機構の効果
  if (equippedAttachment?.id === 'rapid_loader') {
    const fireIntervals = {
      common: 0.45,
      rare: 0.40,
      epic: 0.30,
      legendary: 0.20
    };

    fireInterval =
      fireIntervals[equippedAttachment.rarity] ?? fireInterval;
  }

  fireTimer = fireInterval;
}

  // 難易度に応じた敵出現
if (gameMode === 'score') {
  spawnTimer -= dt;
  if (spawnTimer <= 0 && activeEnemyCount() < currentEnemyLimit()) {
    spawnEnemy();
    spawnTimer = currentSpawnInterval();
  }
}

  // プレイヤー弾
let bulletSpeed = CONFIG.playerBulletSpeed;

// 弾体加速モジュールの効果
if (equippedAttachment?.id === 'bullet_accelerator') {
  const speedMultiplier = {
    common: 1.10,
    rare: 1.20,
    epic: 1.30,
    legendary: 1.50
  };

  bulletSpeed *= speedMultiplier[equippedAttachment.rarity] ?? 1;
}

// 弾の移動
for (const b of playerBullets) {
  b.y -= bulletSpeed * dt;
}

playerBullets = playerBullets.filter(b => b.y > -20);

// 敵弾
for (const b of enemyBullets) {
  if (b.vx !== undefined && b.vy !== undefined) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  } else {
    b.y += (b.speed || CONFIG.enemyBulletSpeed) * dt;
  }
}

enemyBullets = enemyBullets.filter(b =>
  b.x > -30 && b.x < W + 30 &&
  b.y > -30 && b.y < H + 30
);

  // 通常敵
  for (const e of enemies) {
    e.age += dt;
    if (e.type === 'shooter') {
  const stopY = e.stopY;

// 停止位置まで降下
if (e.y < stopY) {
  e.y = Math.min(
    e.y + CONFIG.enemySpeed.shooter * dt,
    stopY
  );
} else {
  // 停止後は左右に往復移動
  const moveSpeed = 90;

  e.x += e.direction * moveSpeed * dt;

  // 左右の端で反転
  if (e.x <= 25) {
    e.x = 25;
    e.direction = 1;
  }

  if (e.x >= W - 25) {
    e.x = W - 25;
    e.direction = -1;
  }
}

  e.fireTimer -= dt;
      if (e.fireTimer <= 0) {
        enemyBullets.push({ x: e.x, y: e.y + 15, r: 5 });
        e.fireTimer = CONFIG.shooterFireInterval;
      }
        } else if (e.type === 'charger') {
      if (!e.rushing && e.age >= CONFIG.chargerRushDelay) {
        e.rushing = true;
        e.vx = (player.x >= e.x ? 1 : -1) * CONFIG.chargerRushSpeed * 0.25;
      }

      if (e.rushing) {
        e.y += CONFIG.chargerRushSpeed * dt;
        e.x += e.vx * dt;
      } else {
        e.y += CONFIG.enemySpeed.charger * dt;
      }

    } else if (e.type === 'bomber') {
      if (e.y < e.stopY) {
        e.y = Math.min(
          e.y + CONFIG.enemySpeed.guard * dt,
          e.stopY
        );
      } else {
        e.x += e.direction * CONFIG.guardSideSpeed * dt;

        if (e.x <= 25) {
          e.x = 25;
          e.direction = 1;
        }

        if (e.x >= W - 25) {
          e.x = W - 25;
          e.direction = -1;
        }
      }

    }
    
     else if (e.type === 'splitter' && !e.isSplitterChild) {
  if (e.y < e.stopY) {
    e.y = Math.min(
      e.y + CONFIG.enemySpeed.guard * dt,
      e.stopY
    );
  } else {
    e.x += e.direction * CONFIG.guardSideSpeed * 1.5 * dt;

    if (e.x <= 25) {
      e.x = 25;
      e.direction = 1;
    }

    if (e.x >= W - 25) {
      e.x = W - 25;
      e.direction = -1;
    }
  }

} else if (e.type === 'splitter' && e.isSplitterChild) {
  if (e.splitPhase === 0) {
    const splitSpeed = W * 0.2;

    e.x += e.direction * splitSpeed * dt;

    if (
      (e.direction === -1 && e.x <= e.targetX) ||
      (e.direction === 1 && e.x >= e.targetX)
    ) {
      e.x = e.targetX;

      e.targetX = player.x;
      e.targetY = player.y;

      const dx = e.targetX - e.x;
      const dy = e.targetY - e.y;
      const length = Math.hypot(dx, dy) || 1;
      const speed = CONFIG.chargerRushSpeed * 2;

      e.vx = dx / length * speed;
      e.vy = dy / length * speed;

      e.splitPhase = 1;
    }
  } else if (e.splitPhase === 1) {
    e.x += e.vx * dt;
    e.y += e.vy * dt;
  }
}

    if (e.y > H + 50 || e.x < -60 || e.x > W + 60) {
      e.alive = false;
    }
  }

  enemies = enemies.filter(e => e.alive);

  // 防御型集団：所定位置まで進んだら横移動
  for (const group of guardGroups) {
    let lowest = Math.max(...group.members.filter(m => m.alive).map(m => m.y), -999);
    if (!group.stopped && lowest >= group.stopY) group.stopped = true;
    for (const m of group.members) {
      if (!m.alive) continue;
      if (!group.stopped) m.y += CONFIG.enemySpeed.guard * dt;
      else m.x += group.direction * CONFIG.guardSideSpeed * dt;
    }
    if (group.stopped) {
      const alive = group.members.filter(m => m.alive);
      if (alive.length) {
        const left = Math.min(...alive.map(m => m.x - m.w / 2));
        const right = Math.max(...alive.map(m => m.x + m.w / 2));
        if (right >= W - 8) group.direction = -1;
        if (left <= 8) group.direction = 1;
      }
    }
  }

  // プレイヤー弾と敵の衝突
  // ボスの登場
  if (gameMode === 'boss' && boss) {
    if (!boss.active) {
      boss.y += boss.speed * dt;

      if (boss.y >= 100) {
        boss.y = 100;
        dreadnoughtGuardTimer = 8;
        boss.active = true;
      leftTentacleTimer = 3;
      rightTentacleTimer = 4.5;
      leftThirdTentacleTimer = 6.5;
      rightThirdTentacleTimer = 6.5;
      }
    }
  }
  
  // DREADNOUGHT 主砲レーザー
if (gameMode === 'boss' && boss && boss.active && boss.id === 'dreadnought') {
  const laser = dreadnoughtLaser;
  const reloadDelay = {
  EASY: 5,
  NORMAL: 3,
  HARD: 0,
  EXPERT: 0
}[selectedBossDifficulty] ?? 0;
  
  const rainMultiplier = {
  EASY: 1,
  NORMAL: 1,
  HARD: 1.5,
  EXPERT: 3
}[selectedBossDifficulty] ?? 1;

  if (laser.reloadTimer > 0) {
  laser.reloadTimer -= dt;
}

  dreadnoughtGuardTimer -= dt;

if (dreadnoughtGuardTimer <= 0) {
  spawnDreadnoughtGuards();
  dreadnoughtGuardTimer = 8;
}

dreadnoughtRainTimer -= dt;

if (dreadnoughtRainTimer <= 0) {
  enemyBullets.push({
    x: 20 + Math.random() * (W - 40),
    y: -10,
    r: 5,
    speed: CONFIG.enemyBulletSpeed * 1.25
  });

  dreadnoughtRainTimer = 0.4 / rainMultiplier;
}

  if (!laser.charging && !laser.firing && laser.reloadTimer <= 0) {
  laser.charging = true;
  laser.chargeTimer = 2;
  laser.targetX = player.x;
  laser.targetY = player.y;
}

  if (laser.charging) {
    laser.chargeTimer -= dt;

    if (laser.chargeTimer <= 0) {
      const dx = laser.targetX - boss.x;
      const dy = laser.targetY - (boss.y + 55);
      const distance = Math.hypot(dx, dy) || 1;

      laser.directionX = dx / distance;
      laser.directionY = dy / distance;

      laser.charging = false;
      laser.firing = true;
      laser.firingTimer = 3;
    }
  }

  if (laser.firing) {
    laser.firingTimer -= dt;

    if (laser.firingTimer <= 0) {
  laser.firing = false;
  laser.reloadTimer = reloadDelay;
}
  }
}
  
      // ボスの触手攻撃
  if (gameMode === 'boss' && boss && boss.active && boss.id === 'taint') {
    leftTentacleTimer -= dt;
    rightTentacleTimer -= dt;

    // 左側
    if (leftTentacleTimer <= 0) {
      spawnBossTentacles(-1);
      leftTentacleTimer = 3 + Math.random() * 2;
    }

    // 右側
    if (rightTentacleTimer <= 0) {
      spawnBossTentacles(1);
      rightTentacleTimer = 3 + Math.random() * 2;
    }
    // HARD・EXPERT専用の3本目
if (
  selectedBossDifficulty === 'HARD' ||
  selectedBossDifficulty === 'EXPERT'
) {
  leftThirdTentacleTimer -= dt;
  rightThirdTentacleTimer -= dt;

  if (leftThirdTentacleTimer <= 0) {
    spawnBossThirdTentacle(-1);
    leftThirdTentacleTimer = 3 + Math.random() * 2;
  }

  if (rightThirdTentacleTimer <= 0) {
    spawnBossThirdTentacle(1);
    rightThirdTentacleTimer = 3 + Math.random() * 2;
  }
}
  }

    // ボスのビーム攻撃
  if (gameMode === 'boss' && boss && boss.active && boss.id === 'taint') {
    if (!bossBeamWarning) {
      bossBeamTimer -= dt;

      if (bossBeamTimer <= 0) {
        bossBeamWarning = {
          timer: 0.5,
          shotsFired: 0,
          firing: false,
          shotTimer: 0
        };
      }
    }

    if (bossBeamWarning) {
      if (!bossBeamWarning.firing) {
        bossBeamWarning.timer -= dt;

        if (bossBeamWarning.timer <= 0) {
          bossBeamWarning.firing = true;
          bossBeamWarning.shotTimer = 0;
        }
      }

      if (bossBeamWarning.firing) {
        bossBeamWarning.shotTimer -= dt;

        if (bossBeamWarning.shotTimer <= 0) {
          const dx = player.x - boss.x;
          const dy = player.y - (boss.y + 45);
          const distance = Math.hypot(dx, dy);
          const speed = 700;

          bossBeams.push({
            x: boss.x,
            y: boss.y + 45,
            vx: (dx / distance) * speed,
            vy: (dy / distance) * speed,
            length: 70,
            alive: true
          });

          bossBeamWarning.shotsFired++;

          if (
          bossBeamWarning.shotsFired >=
          (selectedBossDifficulty === 'EXPERT' ? 5 : 3)
         ) {bossBeamWarning = null;
            bossBeamTimer = 3 + Math.random() * 3;
          } else {
            bossBeamWarning.shotTimer = 0.5;
          }
        }
      }
    }
  }
  
    // ボスビームの移動
  for (const b of bossBeams) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (
      b.x < -100 || b.x > W + 100 ||
      b.y < -100 || b.y > H + 100
    ) {
      b.alive = false;
    }
  }

  bossBeams = bossBeams.filter(b => b.alive);
  
  // 触手の伸縮
for (const t of bossTentacles) {
  if (!t.retracting) {
    t.length += t.speed * dt;

    if (t.length >= t.maxLength) {
      t.length = t.maxLength;
      t.retracting = true;
    }
  } else {
    t.length -= t.speed * dt;

    if (t.length <= 0) {
      t.alive = false;
    }
  }
}

bossTentacles = bossTentacles.filter(t => t.alive);
  for (const b of playerBullets) {
    if (b.dead) continue;
    for (const e of enemies) {
      if (e.alive && hit(b.x, b.y, 5, e.x, e.y, e.w / 2)) {
        e.hp--; b.dead = true;
        if (e.hp <= 0) {
  e.alive = false;
  score += CONFIG.enemyScore[e.type];

  if (e.type === 'bomber') {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;

      enemyBullets.push({
        x: e.x,
        y: e.y,
        vx: Math.cos(angle) * CONFIG.enemyBulletSpeed,
        vy: Math.sin(angle) * CONFIG.enemyBulletSpeed,
        r: 5
      });
    }
  } else if (e.type === 'splitter' && !e.isSplitterChild) {
    for (const direction of [-1, 1]) {
      const child = makeEnemy('splitter', e.x);

      child.x = e.x;
      child.y = e.y;
      child.hp = 1;
      child.w = 22;
      child.h = 22;
      child.isSplitterChild = true;
      child.splitPhase = 0;
      child.direction = direction;

      child.targetX = Math.max(
        25,
        Math.min(W - 25, e.x + direction * W * 0.2)
      );

      enemies.push(child);
    }
  }
}
        break;
      }
    }
    if (b.dead) continue;
    for (const group of guardGroups) {
      for (const m of group.members) {
        if (m.alive && hit(b.x, b.y, 5, m.x, m.y, m.w / 2)) {
          m.hp--; b.dead = true;
          if (m.hp <= 0) { m.alive = false; score += CONFIG.enemyScore.guard; }
          break;
        }
      }
      if (b.dead) break;
    }
         // ボスとの衝突
    if (!b.dead && gameMode === 'boss' && boss && boss.active) {
      const bossHit = boss.id === 'dreadnought'
  ? (() => {
      const isSide = Math.abs(b.x - boss.x) > boss.w / 2;
      const hitboxY = boss.y - (isSide ? 25 : 0);

      return (
        b.y + 5 >= hitboxY - boss.h / 2 &&
        b.y - 5 <= hitboxY + boss.h / 2
      );
    })()
  : hit(b.x, b.y, 5, boss.x, boss.y, boss.w / 2);

if (bossHit) {
        boss.hp--;
        b.dead = true;

        if (boss.hp <= 0) {
          boss.hp = 0;
          endGame(true);
        }
      }
    }
  }
  playerBullets = playerBullets.filter(b => !b.dead);
  enemies = enemies.filter(e => e.alive);
  guardGroups = guardGroups.filter(g => g.members.some(m => m.alive));

  // 被弾判定
  if (invincibleTimer <= 0) {
    let damaged = false;
    for (const b of enemyBullets) {
      if (hit(b.x, b.y, b.r, player.x, player.y, 17)) {
        b.dead = true; damaged = true; break;
      }
    }
        // ボスの触手との衝突
if (!damaged && gameMode === 'boss') {
  for (const t of bossTentacles) {
    if (
      Math.abs(player.x - t.x) < 14 &&
      player.y >= 0 &&
      player.y <= t.length
    ) {
      damaged = true;
      break;
    }
  }
}
        // ボスビームとの衝突
    if (!damaged && gameMode === 'boss') {
      for (const b of bossBeams) {
        const length = Math.hypot(b.vx, b.vy);
        const dx = b.vx / length;
        const dy = b.vy / length;

        const endX = b.x + dx * b.length;
        const endY = b.y + dy * b.length;

        const px = player.x - b.x;
        const py = player.y - b.y;

        const projection = Math.max(
          0,
          Math.min(
            b.length,
            px * dx + py * dy
          )
        );

        const closestX = b.x + dx * projection;
        const closestY = b.y + dy * projection;

        if (
          Math.hypot(
            player.x - closestX,
            player.y - closestY
          ) < 19
        ) {
          damaged = true;
          break;
        }
      }
    }
    
    // DREADNOUGHT 主砲レーザーとの衝突
    if (!damaged && boss && boss.id === 'dreadnought' && dreadnoughtLaser.firing) {
      const laser = dreadnoughtLaser;
      const startX = boss.x;
      const startY = boss.y + 55;
      const length = Math.hypot(W, H) * 1.5;

      const endX = startX + laser.directionX * length;
      const endY = startY + laser.directionY * length;

      const px = player.x - startX;
      const py = player.y - startY;

      const projection = Math.max(
        0,
        Math.min(
          length,
          px * laser.directionX + py * laser.directionY
        )
      );

      const closestX = startX + laser.directionX * projection;
      const closestY = startY + laser.directionY * projection;

      if (
        Math.hypot(
          player.x - closestX,
          player.y - closestY
        ) < 27
      ) {
        damaged = true;
      }
    }
    
    if (!damaged) {
      for (const e of enemies) {
        if (e.alive && hit(e.x, e.y, e.w / 2, player.x, player.y, 18)) {
          e.alive = false; damaged = true; break;
        }
      }
    }
    if (!damaged) {
      for (const g of guardGroups) {
        for (const m of g.members) {
          if (m.alive && hit(m.x, m.y, m.w / 2, player.x, player.y, 18)) {
            m.alive = false; damaged = true; break;
          }
        }
        if (damaged) break;
      }
    }
    if (damaged) {
      player.hp--;
      invincibleTimer = CONFIG.invincibleTime;
      if (player.hp <= 0) endGame();
    }
  }
  enemyBullets = enemyBullets.filter(b => !b.dead);
  enemies = enemies.filter(e => e.alive);
  guardGroups = guardGroups.filter(g => g.members.some(m => m.alive));
}
function hit(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2, dy = y1 - y2;
  return dx * dx + dy * dy < (r1 + r2) * (r1 + r2);
}

// =========================
// 描画
// =========================
function drawBackground() {
  ctx.fillStyle =
  gameMode === 'boss' && selectedBossDifficulty === 'EXPERT'
    ? '#3b1018'
    : '#07111f';
  ctx.fillRect(0, 0, W, H);
  
  for (let i = 0; i < 35; i++) {
    const x = (i * 97) % W;
    const y = (i * 173 + elapsed * 20) % H;
    ctx.fillStyle = 'rgba(210,235,255,.45)';
    ctx.fillRect(x, y, 2, 2);
  }
}
function drawPlayer() {
  if (invincibleTimer > 0 && Math.floor(invincibleTimer * 12) % 2 === 0) return;

  const width = 42;
  const height = 52;
  
    if (
    selectedSkin === 'experimental' ||
    selectedSkin === 'organic' ||
    selectedSkin === 'special' ||
    selectedSkin === 'saucer' ||
    selectedSkin === 'heavyArmor' ||
    selectedSkin === 'highMobility' ||
    selectedSkin === 'heavyArmed'
  ) {
    if (!playerImage.complete || playerImage.naturalWidth === 0) return;

    const maxWidth = width;
    const maxHeight = height;

    const scale = Math.min(
      maxWidth / playerImage.naturalWidth,
      maxHeight / playerImage.naturalHeight
    );

    const drawWidth = playerImage.naturalWidth * scale;
    const drawHeight = playerImage.naturalHeight * scale;

    ctx.drawImage(
      playerImage,
      player.x - drawWidth / 2,
      player.y - drawHeight / 2,
      drawWidth,
      drawHeight
    );
    return;
  }

  if (selectedSkin === 'stealth') {
    if (!stealthImage.complete || stealthImage.naturalWidth === 0) return;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(Math.PI);

    ctx.drawImage(
      stealthImage,
      48, 26, 238, 290,
      -width / 2, -height / 2,
      width, height
    );

    ctx.restore();
    return;
  }

  if (!playerImage.complete || playerImage.naturalWidth === 0) return;

  ctx.drawImage(
    playerImage,
    player.x - width / 2,
    player.y - height / 2,
    width,
    height
  );
}

function drawEnemy(e) {
  ctx.save();

  const img = enemyImages[e.type];

  if (img && img.complete && img.naturalWidth > 0) {
    let w = 42;
    let h = 56;

    // CHARGERは少し大きく表示
    if (e.type === 'charger') {
      w = 54;
      h = 62;
    }

    // 画像は下向きのため回転させない
    ctx.drawImage(
      img,
      e.x - w / 2,
      e.y - h / 2,
      w,
      h
    );
  }

  ctx.restore();
}
function drawGuard(m) {
  const img = enemyImages.guard;

  if (img && img.complete && img.naturalWidth > 0) {
    const w = 42;
    const h = 42;

    ctx.drawImage(
      img,
      m.x - w / 2,
      m.y - h / 2,
      w,
      h
    );
  }
}
function draw() {
  drawBackground();
  if (!player) return;
  // プレイヤー弾
  ctx.fillStyle = '#9cecff';
  for (const b of playerBullets) {
    ctx.fillRect(b.x - 2, b.y - 9, 4, 18);
  }
    // 敵弾
  ctx.fillStyle = '#ff3030';
  for (const b of enemyBullets) {
    ctx.fillRect(b.x - 2, b.y - 8, 4, 16);
  }
    // ボスの赤いビーム
  ctx.save();
  ctx.strokeStyle = '#ff2020';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  for (const b of bossBeams) {
    const length = b.length;
    const dx = b.vx / Math.hypot(b.vx, b.vy);
    const dy = b.vy / Math.hypot(b.vx, b.vy);

    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(
      b.x + dx * length,
      b.y + dy * length
    );
    ctx.stroke();
  }

  ctx.restore();
  enemies.forEach(drawEnemy);
  guardGroups.forEach(g => g.members.filter(m => m.alive).forEach(drawGuard));
    // ボスの触手
if (gameMode === 'boss' && boss) {
  for (let i = 0; i < bossTentacles.length; i++) {
    const t = bossTentacles[i];

    const img = i % 2 === 0
      ? tentacleImageA
      : tentacleImageB;

    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(
        img,
        t.x - 12,
        0,
        24,
        t.length
      );
    }
  }
}
if (gameMode === 'boss' && boss) {
      // ボス画像表示
const currentBossImage =
  boss.id === 'dreadnought'
    ? dreadnoughtBossImage
    : bossImage;

if (currentBossImage.complete && currentBossImage.naturalWidth > 0) {
  const imageWidth = W * 1.25;
  const imageHeight =
    imageWidth * currentBossImage.naturalHeight / currentBossImage.naturalWidth;

  ctx.drawImage(
    currentBossImage,
    (W - imageWidth) / 2,
    boss.y - imageHeight / 2,
    imageWidth,
    imageHeight
  );
}

  // DREADNOUGHT 主砲レーザー
  if (boss.id === 'dreadnought') {
    const laser = dreadnoughtLaser;
    const cannonX = boss.x;
    const cannonY = boss.y + 45;

    // チャージ中の発光
    if (laser.charging) {
      const chargeRatio = 1 - laser.chargeTimer / 2;
      const radius = 6 + chargeRatio * 12;

      ctx.save();
      ctx.globalAlpha = 0.5 + chargeRatio * 0.5;
      ctx.fillStyle = '#ff3344';
      ctx.shadowColor = '#ff2020';
      ctx.shadowBlur = 12 + chargeRatio * 25;

      ctx.beginPath();
      ctx.arc(cannonX, cannonY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // レーザー照射中
    if (laser.firing) {
      const length = Math.hypot(W, H) * 1.5;
      const endX = cannonX + laser.directionX * length;
      const endY = cannonY + laser.directionY * length;

      ctx.save();
      ctx.lineCap = 'round';

      ctx.strokeStyle = '#ff3344';
      ctx.lineWidth = 60;
      ctx.shadowColor = '#ff2020';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.moveTo(cannonX, cannonY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 16;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(cannonX, cannonY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.restore();
    }
  }
  
  // ビーム発射前の赤い予告光
  if (boss && boss.id === 'taint' && bossBeamWarning && !bossBeamWarning.firing) {
    ctx.fillStyle = '#ff2020';
    ctx.beginPath();
    ctx.arc(boss.x, boss.y + 45, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
  drawPlayer();

  // ボスHPバー
  if (gameMode === 'boss' && boss) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(boss.name, 20, 54);
    const barWidth = W - 40;
    const barHeight = 10;
    const ratio = Math.max(0, boss.hp / boss.maxHp);

    ctx.fillStyle = '#333';
    ctx.fillRect(20, 62, barWidth, barHeight);

    ctx.fillStyle = '#4fc5e8';
    ctx.fillRect(20, 62, barWidth * ratio, barHeight);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 62, barWidth, barHeight);
  }
  
  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('♥ '.repeat(player.hp), 14, 30);
  ctx.textAlign = 'right';
    ctx.fillText(`TIME ${formatTime(elapsed)}`, W - 14, 28);
  if (gameMode === 'score') {
    ctx.fillText(`SCORE ${score}`, W - 14, 52);
  }
}
function formatTime(seconds) {
  const s = Math.floor(seconds);
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

// =========================
// メインループ
// =========================
function loop(now) {
  if (state !== 'playing') return;
  const dt = Math.min((now - lastTime) / 1000, 0.04);
  lastTime = now;
  update(dt);
  draw();
  if (state === 'playing') requestAnimationFrame(loop);
}

// =========================
// 自己ベスト保存
// SupabaseのURLとAnon Keyを設定するとクラウド保存処理を追加できます。
// 現段階ではローカル保存のみ。
// =========================
async function saveBestScore(newScore) {
  // TODO: Supabase接続設定後に実装
  // DB接続に失敗してもゲーム本体には影響させない。
}

function renderSkinList() {
  skinList.innerHTML = '';

  const previewImage = document.getElementById('skinPreviewImage');
  const previewName = document.getElementById('skinPreviewName');
  const previewHint = document.getElementById('skinPreviewHint');

  // プレビュー中の機体を上部に表示
const skin = PLAYER_SKINS[previewSkinId];

previewImage.innerHTML = '';

if (previewSkinId === 'stealth') {
  const canvas = document.createElement('canvas');
  canvas.width = 238;
  canvas.height = 290;

  const ctxPreview = canvas.getContext('2d');

  if (stealthImage.complete && stealthImage.naturalWidth > 0) {
    ctxPreview.save();
ctxPreview.translate(238, 290);
ctxPreview.rotate(Math.PI);

ctxPreview.drawImage(
  stealthImage,
  48, 26, 238, 290,
  0, 0, 238, 290
);

ctxPreview.restore();
  }

  if (!skin.unlocked) {
    canvas.style.filter = 'brightness(0)';
    previewName.textContent = '？？？';
    previewHint.textContent = skin.hint || '入手条件不明';
  } else {
    previewName.textContent = skin.name;
    previewHint.textContent = '';
  }

  canvas.style.width = 'auto';
  canvas.style.height = '100%';
  canvas.style.maxWidth = '100%';
  canvas.style.objectFit = 'contain';

  previewImage.appendChild(canvas);

} else {
  const img = document.createElement('img');
  img.src = skin.image;
  img.alt = skin.name;

  previewName.textContent = skin.name;
  previewHint.textContent = '';

  previewImage.appendChild(img);
}

  // 機体一覧を生成
  for (const [id, skin] of Object.entries(PLAYER_SKINS)) {
    const button = document.createElement('button');
    button.type = 'button';

 const visual = document.createElement('div');

if (skin.unlocked) {
  if (id === 'stealth') {
    const canvas = document.createElement('canvas');
    canvas.width = 238;
    canvas.height = 290;

    const ctxIcon = canvas.getContext('2d');

    if (stealthImage.complete && stealthImage.naturalWidth > 0) {
      ctxIcon.save();
      ctxIcon.translate(238, 290);
      ctxIcon.rotate(Math.PI);

      ctxIcon.drawImage(
        stealthImage,
        48, 26, 238, 290,
        0, 0, 238, 290
      );

      ctxIcon.restore();
    }

    canvas.style.width = '84px';
    canvas.style.height = '84px';
    canvas.style.objectFit = 'contain';

    visual.appendChild(canvas);
  } else {
    const img = document.createElement('img');
    img.src = skin.image;
    img.alt = skin.name;
    img.width = 84;
    visual.appendChild(img);
  }
} else {
  visual.textContent = '？';
  visual.style.width = '84px';
  visual.style.height = '84px';
  visual.style.display = 'flex';
  visual.style.alignItems = 'center';
  visual.style.justifyContent = 'center';
  visual.style.fontSize = '36px';
  visual.style.fontWeight = 'bold';
}

const name = document.createElement('div');
name.textContent = skin.unlocked ? skin.name : '？？？';

const status = document.createElement('div');

if (!skin.unlocked) {
  status.textContent = '未入手';
} else {
  status.textContent = id === selectedSkin ? '使用中' : '選択する';
}

button.append(visual, name, status);

    button.addEventListener('click', () => {
  previewSkinId = id;

  if (skin.unlocked) {
    changePlayerSkin(id);
  }

  renderSkinList();
});

    skinList.appendChild(button);
  }
}

// START → モード選択画面
startButton.addEventListener('click', () => {
  titleScreen.classList.add('hidden');
  modeScreen.classList.remove('hidden');
});

// SCORE ATTACK選択
scoreButton.addEventListener('click', () => {
  gameMode = 'score';
  modeScreen.classList.add('hidden');
  startGame();
});

// BOSS BATTLE選択
bossButton.addEventListener('click', () => {
  renderBossList();
  modeScreen.classList.add('hidden');
  bossSelectScreen.classList.remove('hidden');
  bossInfoName.textContent = '未選択';
  bossInfoText.textContent = 'ボスを選択してください。';
  bossStartButton.disabled = true;
});

// BATTLE START
bossStartButton.addEventListener('click', () => {
  gameMode = 'boss';
  bossSelectScreen.classList.add('hidden');
  startGame();
});

// ボス選択から戻る
bossBackButton.addEventListener('click', () => {
  bossSelectScreen.classList.add('hidden');
  modeScreen.classList.remove('hidden');
});

// リトライ
retryButton.addEventListener('click', startGame);

// 機体選択画面
skinButton.addEventListener('click', () => {
  renderSkinList();
  modeScreen.classList.add('hidden');
  skinScreen.classList.remove('hidden');
});

skinBackButton.addEventListener('click', () => {
  skinScreen.classList.add('hidden');
  titleScreen.classList.remove('hidden');
});

titleButton.addEventListener('click', () => {
  state = 'title';
  gameOverScreen.classList.add('hidden');
  titleScreen.classList.remove('hidden');
});

// 機体選択 → アタッチメント選択
attachmentSelectButton.addEventListener('click', () => {
  skinScreen.classList.add('hidden');
  attachmentScreen.classList.remove('hidden');

  // 選択状態を初期化
  selectedAttachment = null;

  // 一覧を生成
  renderAttachmentList();

  // 装備中のアタッチメントがある場合
  if (equippedAttachment) {
    const attachment = ATTACHMENT_DATA.find(
      item => item.id === equippedAttachment.id
    );

    const rarity = ATTACHMENT_RARITIES.find(
      item => item.id === equippedAttachment.rarity
    );

    if (
      attachment &&
      rarity &&
      getAttachmentCount(attachment.id, rarity.id) > 0
    ) {
      selectedAttachment = {
        id: attachment.id,
        rarity: rarity.id
      };

      showAttachmentInfo(attachment, rarity);
      return;
    }
  }

  // 未装備の場合
  attachmentInfoName.textContent = '未装備';
  attachmentInfoRarity.textContent = '';
  attachmentInfoEffect.textContent = '';
  attachmentInfoCount.textContent = '';
  attachmentInfoStatus.textContent = '';

  attachmentEquipButton.classList.add('hidden');
  attachmentSynthesizeButton.classList.add('hidden');
  attachmentSynthesizeHint.textContent = '';
});

// アタッチメント選択 → 機体選択
attachmentBackButton.addEventListener('click', () => {
  attachmentScreen.classList.add('hidden');
  skinScreen.classList.remove('hidden');
});

})();