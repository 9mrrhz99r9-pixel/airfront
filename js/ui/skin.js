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