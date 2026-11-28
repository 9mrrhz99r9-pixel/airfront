'use strict';
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
    unlocked: loadStealthUnlocked(),
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

const skinList = document.getElementById('skinList');
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