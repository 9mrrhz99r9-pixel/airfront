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
    guard: 1
  },
  enemyScore: {
    shooter: 120,
    charger: 200,
    guard: 40
  },
  shooterFireInterval: 5,
  enemyBulletSpeed: 230,
  chargerRushDelay: 2.8,
  chargerRushSpeed: 180,
  guardGroupSize: 5,
  guardSideSpeed: 38,
  
  bossMaxHp: 50,
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
  guard: new Image()
};

enemyImages.shooter.src = './assets/enemy/shooter.PNG';
enemyImages.charger.src = './assets/enemy/charger.PNG';
enemyImages.guard.src = './assets/enemy/guard.PNG';

// ボス画像
const bossImage = new Image();
bossImage.src = './assets/boss/boss1.PNG';

const titleScreen = document.getElementById('titleScreen');
const modeScreen = document.getElementById('modeScreen');
const bossButton = document.getElementById('bossButton');
const scoreButton = document.getElementById('scoreButton');
const skinScreen = document.getElementById('skinScreen');
const skinButton = document.getElementById('skinButton');
const skinList = document.getElementById('skinList');
const skinBackButton = document.getElementById('skinBackButton');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const resultTitle = document.getElementById('resultTitle');
const resultEl = document.getElementById('result');
const resultEl = document.getElementById('result');
const startButton = document.getElementById('startButton');
const retryButton = document.getElementById('retryButton');
const titleButton = document.getElementById('titleButton');
const fireButton = document.getElementById('fireButton');
const hint = document.getElementById('hint');

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
let bossBeamWarning = null;
let leftTentacleTimer = 3;
let rightTentacleTimer = 4.5;
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

if (gameMode === 'boss') {
  boss = {
    name: 'TAINT',
    x: W / 2,
    y: -80,
    w: 120,
    h: 120,
    hp: CONFIG.bossMaxHp,
    maxHp: CONFIG.bossMaxHp,
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
  const bestKey = 'sky_defender_boss1_best';
  const savedBest = Number(localStorage.getItem(bestKey) || 0);
  const isNewRecord = savedBest === 0 || elapsed < savedBest;
  const bestTime = isNewRecord ? elapsed : savedBest;

  if (isNewRecord) {
    localStorage.setItem(bestKey, String(elapsed));
  }

  resultEl.innerHTML = `
    <strong>${boss.name} CLEAR!</strong><br>
    討伐タイム：${formatBossTime(elapsed)}<br>
    最速討伐タイム：${formatBossTime(bestTime)}
    ${isNewRecord ? '<br>NEW RECORD!' : ''}
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
  if (roll < 0.48) {
    enemies.push(makeEnemy('shooter', Math.random() * (W - 50) + 25));
  } else if (roll < 0.78) {
    enemies.push(makeEnemy('charger', Math.random() * (W - 50) + 25));
  } else {
    spawnGuardGroup();
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

    // 射撃型の停止位置（画面高さの25〜40%）
    stopY: H * (0.25 + Math.random() * 0.15),

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
    y: boss.y + 40,
    length: 0,
    maxLength: H,
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
    playerBullets.push({ x: player.x, y: player.y - 25, r: 4 });
    fireTimer = CONFIG.playerFireInterval;
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
  for (const b of playerBullets) b.y -= CONFIG.playerBulletSpeed * dt;
  playerBullets = playerBullets.filter(b => b.y > -20);

  // 敵弾
  for (const b of enemyBullets) b.y += CONFIG.enemyBulletSpeed * dt;
  enemyBullets = enemyBullets.filter(b => b.y < H + 20);

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
    }
    if (e.y > H + 50 || e.x < -60 || e.x > W + 60) e.alive = false;
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
        boss.active = true;
      leftTentacleTimer = 3;
      rightTentacleTimer = 4.5;
      }
    }
  }
      // ボスの触手攻撃
  if (gameMode === 'boss' && boss && boss.active) {
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
  }

    // ボスのビーム攻撃
  if (gameMode === 'boss' && boss && boss.active) {
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

          if (bossBeamWarning.shotsFired >= 3) {
            bossBeamWarning = null;
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
        if (e.hp <= 0) { e.alive = false; score += CONFIG.enemyScore[e.type]; }
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
      if (hit(b.x, b.y, 5, boss.x, boss.y, boss.w / 2)) {
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
        if (Math.abs(player.x - t.x) < 7 &&
            player.y >= t.y &&
            player.y <= t.y + t.length) {
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
  ctx.fillStyle = '#07111f';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(110,180,220,.12)';
  ctx.lineWidth = 1;
  for (let y = (elapsed * 35) % 48; y < H; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
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
    ctx.save();
    ctx.strokeStyle = '#398fbd';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    for (const t of bossTentacles) {
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);

      // 少し波打つ形
      for (let i = 1; i <= 8; i++) {
        const progress = i / 8;
        const wave = Math.sin(progress * Math.PI * 3) * 3;

        ctx.lineTo(
          t.x + wave,
          t.y + t.length * progress
        );
      }

      ctx.stroke();

      // 先端を尖らせる
      ctx.fillStyle = '#55b9e8';
      ctx.beginPath();
      ctx.arc(t.x, t.y + t.length, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
      // ボス画像表示
if (gameMode === 'boss' && boss) {
  if (bossImage.complete && bossImage.naturalWidth > 0) {
    const imageWidth = W * 1.25;
    const imageHeight =
      imageWidth * bossImage.naturalHeight / bossImage.naturalWidth;

    ctx.drawImage(
      bossImage,
      (W - imageWidth) / 2,
      boss.y - imageHeight / 2,
      imageWidth,
      imageHeight
    );
  }

  // ビーム発射前の赤い予告光
  if (bossBeamWarning && !bossBeamWarning.firing) {
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
  gameMode = 'boss';
  modeScreen.classList.add('hidden');
  startGame();
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
})();