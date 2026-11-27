'use strict'; 

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

// BASTION画像
const bastionBossImage = new Image();
bastionBossImage.src = './assets/boss/boss3.PNG';

// BASTION回転装甲画像
const bastionArmorImage = new Image();
bastionArmorImage.src = './assets/boss/bastion_armor.PNG';

// BASTIONアーム画像
const bastionArmImage = new Image();
bastionArmImage.src = './assets/boss/bastion_arm.PNG';

// BASTION誘導ミサイル画像
const bastionMissileImage = new Image();
bastionMissileImage.src = './assets/boss/bastion_missile.PNG';

// ボス触手画像
const tentacleImageA = new Image();
tentacleImageA.src = './assets/boss/tentacle_a.png';

const tentacleImageB = new Image();
tentacleImageB.src = './assets/boss/tentacle_b.png';