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
    shooter: 1,
    charger: 1,
    guard: 1
  },
  enemyScore: {
    shooter: 100,
    charger: 150,
    guard: 40
  },
  shooterFireInterval: 5,
  enemyBulletSpeed: 230,
  chargerRushDelay: 2.8,
  chargerRushSpeed: 180,
  guardGroupSize: 5,
  guardSideSpeed: 38
};

// =========================
// DOM・Canvas
// =========================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const titleScreen = document.getElementById('titleScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const resultEl = document.getElementById('result');
const startButton = document.getElementById('startButton');
const retryButton = document.getElementById('retryButton');
const titleButton = document.getElementById('titleButton');
const fireButton = document.getElementById('fireButton');
const hint = document.getElementById('hint');

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
let player, playerBullets, enemyBullets, enemies, guardGroups;
let score = 0, elapsed = 0, spawnTimer = 0, fireTimer = 0;
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

function endGame() {
  if (state !== 'playing') return;
  state = 'gameover';
  firing = false;
  fireButton.classList.add('hidden');
  hint.classList.add('hidden');
  const isNewBest = score > bestScore;
  if (isNewBest) {
    bestScore = score;
    localStorage.setItem('sky_defender_best', String(bestScore));
    saveBestScore(score); // Supabase接続後にクラウド保存
  }
  resultEl.innerHTML = `今回のスコア：<strong>${score}</strong><br>自己ベスト：<strong>${bestScore}</strong>${isNewBest ? '<br>NEW RECORD!' : ''}`;
  gameOverScreen.classList.remove('hidden');
}

// =========================
// 敵生成
// =========================
function activeEnemyCount() {
  // 防御型の集団も1機ずつ数える
  return enemies.length + guardGroups.reduce((sum, group) => sum + group.members.length, 0);
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
    alive: true
  };
}
function spawnGuardGroup() {
  const count = Math.min(CONFIG.guardGroupSize, Math.max(1, currentEnemyLimit() - activeEnemyCount()));
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
  guardGroups.push({ members, direction: 1, stopped: false, stopY: H * 0.28 });
}

// =========================
// 入力
// =========================
let lastPointerX = 0;
let moveDeltaX = 0;

canvas.addEventListener('pointerdown', e => {
  if (state !== 'playing') return;
  if (e.clientY > H - 100) return;

  pointerActive = true;
  lastPointerX = e.clientX;
  moveDeltaX = 0;

  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', e => {
  if (!pointerActive || state !== 'playing') return;

  const diffX = e.clientX - lastPointerX;
  const rect = canvas.getBoundingClientRect();

  moveDeltaX += diffX * (W / rect.width);

  lastPointerX = e.clientX;
});

function stopPointer() {
  pointerActive = false;
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

// =========================
// 更新処理
// =========================
function update(dt) {
  elapsed += dt;
  if (invincibleTimer > 0) invincibleTimer -= dt;

  // プレイヤー左右移動
player.x += moveDirection * CONFIG.playerSpeed * dt;

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
  spawnTimer -= dt;
  if (spawnTimer <= 0 && activeEnemyCount() < currentEnemyLimit()) {
    spawnEnemy();
    spawnTimer = currentSpawnInterval();
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
  const stopY = H * 0.3;

  if (e.y < stopY) {
    e.y = Math.min(
      e.y + CONFIG.enemySpeed.shooter * dt,
      stopY
    );
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
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = '#b9eaff';
  ctx.beginPath();
  ctx.moveTo(0, -24); ctx.lineTo(17, 18); ctx.lineTo(0, 10); ctx.lineTo(-17, 18);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#258bc2';
  ctx.fillRect(-5, -3, 10, 17);
  ctx.restore();
}
function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = e.type === 'shooter' ? '#ff9b64' : '#ff5c72';
  if (e.type === 'charger') ctx.rotate(Math.PI);
  ctx.beginPath();
  ctx.moveTo(0, -16); ctx.lineTo(15, 12); ctx.lineTo(0, 7); ctx.lineTo(-15, 12);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawGuard(m) {
  ctx.fillStyle = '#e5c86b';
  ctx.fillRect(m.x - 10, m.y - 10, 20, 20);
  ctx.fillStyle = '#5c4c25';
  ctx.fillRect(m.x - 4, m.y - 4, 8, 8);
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
  ctx.fillStyle = '#ffb45f';
  for (const b of enemyBullets) {
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  }
  enemies.forEach(drawEnemy);
  guardGroups.forEach(g => g.members.filter(m => m.alive).forEach(drawGuard));
  drawPlayer();

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('♥ '.repeat(player.hp), 14, 30);
  ctx.textAlign = 'right';
  ctx.fillText(`TIME ${formatTime(elapsed)}`, W - 14, 28);
  ctx.fillText(`SCORE ${score}`, W - 14, 52);
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

startButton.addEventListener('click', startGame);
retryButton.addEventListener('click', startGame);
titleButton.addEventListener('click', () => {
  state = 'title';
  gameOverScreen.classList.add('hidden');
  titleScreen.classList.remove('hidden');
});
})();
