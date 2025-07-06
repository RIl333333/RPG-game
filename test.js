const h2 = document.getElementById("h2");
h2.innerHTML = new Date().toLocaleString();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

//戦闘
//敵(狸)1号
const enemyTypes = [
  {
    name: "たぬき",
    imageSrc: "./Chara/monster1.png",
    maxHp: 20,
    attack: 5,
    xpReward: 10
  },
  {
    name: "きつね",
    imageSrc: "./Chara/monster2.png",
    maxHp: 35,
    attack: 8,
    xpReward: 18
  },
  {
    name: "くま",
    imageSrc: "./Chara/monster3.png",
    maxHp: 50,
    attack: 12,
    xpReward: 25
  }
];
let currentEnemy = null;
let enemyImage = new Image();
let gameState = "field"; // "field" か "battle"

function startBattle() {
  gameState = "battle";
  cancelAnimationFrame(gameLoopId);

  document.getElementById("enemyImage").src = currentEnemy.imageSrc;
  document.getElementById("enemyName").textContent = currentEnemy.name + " が現れた！";
  document.getElementById("enemyHpText").textContent = `敵HP: ${currentEnemy.hp} / ${currentEnemy.maxHp}`;
  document.getElementById("playerHpText").textContent = `プレイヤーHP: ${player.hp} / ${player.maxhp}`;

  document.getElementById('battleScreen').style.display = 'block';
}

document.getElementById("attackBtn").addEventListener("click", () => {
  const playerDamage = player.attackdamage;  // プレイヤーの攻撃力（仮）
  const enemyDamage = currentEnemy.attack; // 敵の攻撃力（enemyTypesで定義済み）

  // プレイヤーの攻撃
  currentEnemy.hp -= playerDamage;
  if (currentEnemy.hp < 0) currentEnemy.hp = 0;

  // 敵のHP更新
  document.getElementById("enemyHpText").textContent = `敵HP: ${currentEnemy.hp} / ${currentEnemy.maxHp}`;

  if (currentEnemy.hp <= 0) {
    document.getElementById("enemyName").textContent = currentEnemy.name + " を倒した！";
    gainXp(currentEnemy.xpReward);
    setTimeout(() => {
      endBattle();
    }, 1000);
    return;
  }

  // 敵の攻撃（敵が生きている間に攻撃）
  player.hp -= enemyDamage;
  if (player.hp < 0) player.hp = 0;

  // プレイヤーのHP更新
  document.getElementById("playerHpText").textContent = `プレイヤーHP: ${player.hp} / ${player.maxhp}`;

  // プレイヤーがやられた判定
  if (player.hp <= 0) {
    alert("プレイヤーはやられた…ゲームオーバー！");
    // ゲームオーバー処理（リセットなど）
    endBattle();
    // 必要ならプレイヤーのHP回復やリセットもここに
  }
});


document.getElementById("runBtn").addEventListener("click", () => {
  console.log("逃げた！");
  endBattle();
});

function endBattle() {
  currentEnemy = null;
  gameState = "field";
  document.getElementById('battleScreen').style.display = 'none';
  gameLoop();
}




//別枠
const standImages = {
  up: new Image(),
  down: new Image(),
  left: new Image(),
  right: new Image()
};
standImages.up.src = './Chara/harumachi_stand_up.png';
standImages.down.src = './Chara/harumachi_stand_down.png';
standImages.left.src = './Chara/harumachi_stand_left.png';
standImages.right.src = './Chara/harumachi_stand_right.png';

const playerImages = {
  down: [],
  up: [],
  left: [],
  right: []
};
const directions = ['down', 'up', 'left', 'right'];
const totalFrames = 2;

let allImages = [];
directions.forEach(dir => {
  for (let i = 1; i <= totalFrames; i++) {
    const img = new Image();
    img.src = `./Chara/harumachi_${dir}${i}.png`;
    playerImages[dir].push(img);
    allImages.push(img);
  }
});


const monsterImages = enemyTypes.map(enemy => {
  const img = new Image();
  img.src = enemy.imageSrc;
  return { type: enemy, img: img };
});

let monsterLoadedCount = 0;
monsterImages.forEach(monster => {
  monster.img.onload = () => {
    monsterLoadedCount++;
    if (monsterLoadedCount === monsterImages.length) {
      console.log("すべての敵画像を読み込み完了");
    }
  };
});

let loadedCount = 0;
allImages.forEach(img => {
  img.onload = () => {
    loadedCount++;
    if (loadedCount === allImages.length) {
      console.log("すべての画像を読み込み完了");
      // ↓ここでは gameLoop はまだ呼ばない（ボタンで呼び出す）
    }
  };
});

const player = {
  attackdamage: 5,
  lvl: 1,
  maxxp: 0,
  xp: 0,
  maxhp: 20,
  hp: 20,
  x: 130,
  y: 90,
  width: 32 * 3,
  height: 32 * 3,
  speed: 5,
  direction: 'down',
  frameIndex: 0,
  animationTimer: 0
};

// maxxpを計算して初期化
player.maxxp = Math.floor((player.lvl ** 2) * 5 + 20);

// レベルアップをチェックする関数
function checkLevelUp() {
  while (player.xp >= player.maxxp) {
    player.xp -= player.maxxp;
    player.lvl += 1;
    player.maxhp += Math.floor(player.lvl * 3 + 5);
    player.maxxp = Math.floor((player.lvl ** 2) * 5 + 20);
  }
}
//xpを与えるファンクション
function gainXp(amount) {
  player.xp += amount;   // 経験値を増やす
  checkLevelUp();        // レベルアップ判定
}

function updateHUD() {
  const levelValue = document.getElementById('levelValue');
  const hpValue = document.getElementById('hpValue');
  const maxHpValue = document.getElementById('maxHpValue');
  const hpBar = document.getElementById('hpBar');
  const xpValue = document.getElementById('xpValue');
  const maxXpValue = document.getElementById('maxXpValue');
  const xpBar = document.getElementById('xpBar');

  levelValue.textContent = player.lvl;       // ここでレベル更新
  hpValue.textContent = player.hp;
  maxHpValue.textContent = player.maxhp;

  const hpPercent = Math.min(player.hp / player.maxhp * 100, 100);
  hpBar.style.width = hpPercent + '%';

  xpValue.textContent = player.xp;
  maxXpValue.textContent = player.maxxp;

  const xpPercent = Math.min(player.xp / player.maxxp * 100, 100);
  xpBar.style.width = xpPercent + '%';
}



// ロード処理を最初に呼び出す！
//loadPlayerPosition();

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

window.addEventListener('keydown', (e) => {
  if (e.key in keys) keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key in keys) keys[e.key] = false;
});

function update() {
  let moving = false;

  if (keys.ArrowUp) {
    player.y -= player.speed;
    player.direction = 'up';
    moving = true;
  }
  if (keys.ArrowDown) {
    player.y += player.speed;
    player.direction = 'down';
    moving = true;
  }
  if (keys.ArrowLeft) {
    player.x -= player.speed;
    player.direction = 'left';
    moving = true;
  }
  if (keys.ArrowRight) {
    player.x += player.speed;
    player.direction = 'right';
    moving = true;
  }

  if (moving) {
    player.animationTimer++;
    if (player.animationTimer >= 10) {
      player.frameIndex = (player.frameIndex + 1) % playerImages[player.direction].length;
      player.animationTimer = 0;
    }
  } else {
    player.frameIndex = 0; // 静止時のフレーム
    player.animationTimer = 0;
  }

  // 画面外制限
  if (player.x < 0) player.x = 0;
  if (player.y < 0) player.y = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

  //敵出現
  if (moving && gameState === "field") {
  const chance = Math.random();
  if (chance > 0.97) {  // 3%で出現
    const chosen = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    currentEnemy = { ...chosen, hp: chosen.maxHp };
    enemyImage.src = chosen.imageSrc;
    startBattle();
  }
}
}



function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let currentImage;

  if (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight) {
    // 移動中：対応する方向の画像
    currentImage = playerImages[player.direction][player.frameIndex];
  } else {
    // 静止中：スタンディング画像
    currentImage = standImages[player.direction];
  }

  ctx.drawImage(currentImage, player.x, player.y, player.width, player.height);

  //if (enemy.visible && enemy.type) {
    //ctx.drawImage(enemy.type.img, enemy.x, enemy.y, enemy.width, enemy.height);
  //}
}



let gameLoopId = null;

function gameLoop() {
  if (gameState === "field") {
    update();
    draw();
    updateHUD();
    gameLoopId = requestAnimationFrame(gameLoop);
  }
}



// 全画面処理
const fullscreenBtn = document.getElementById('fullscreenBtn');
const frame = document.getElementById('frame');

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    frame.requestFullscreen().catch(err => {
      alert(`全画面表示に失敗しました: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }

  if (!document.fullscreenElement) {
    document.getElementById('menuOverlay').style.display = 'flex';
  }
});


//function save
function savePlayerPosition() {
  const ratioX = player.x / canvas.width;
  const ratioY = player.y / canvas.height;
  localStorage.setItem('playerPosition', JSON.stringify({ ratioX, ratioY }));
}

function loadPlayerPosition() {
  const saved = localStorage.getItem('playerPosition');
  if (saved) {
    try {
      const pos = JSON.parse(saved);
      if (pos.ratioX !== undefined && pos.ratioY !== undefined) {
        player.x = pos.ratioX * canvas.width;
        player.y = pos.ratioY * canvas.height;
        console.log('プレイヤー位置を復元しました:', player.x, player.y);
      }
    } catch (e) {
      console.error('保存データの読み込み失敗:', e);
    }
  }
}

// フルスクリーン切替時
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    canvas.width = 1980;
    canvas.height = 1080;
    loadPlayerPosition(); // 一度だけ呼ぶ
  } else {
    canvas.width = 1170;
    canvas.height = 400;
    document.getElementById('menuOverlay').style.display = 'flex';
  }
});

// メニュー
document.getElementById('hudSettingsBtn').addEventListener('click', () => {
});
document.getElementById('hudExitBtn').addEventListener('click', () => {
  savePlayerPosition();
});


//スタートメニュー
const continueBtn = document.getElementById('continueGameBtn');
const startBtn = document.getElementById('startGameBtn');

// ページ読み込み時にセーブデータを確認
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('playerPosition');
  if (saved) {
    continueBtn.style.display = 'block'; // セーブデータがあれば表示
  }
});

//はじめから

startBtn.addEventListener('click', () => {
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  localStorage.removeItem('playerPosition');

  // 初期状態にリセット
  player.x = 130;
  player.y = 90;
  player.direction = 'down';
  player.frameIndex = 0;
  player.animationTimer = 0;
  player.lvl = 1;
  player.xp = 0;
  player.maxxp = Math.floor((player.lvl ** 2) * 5 + 20);
  player.hp = 20;
  player.maxhp = 20;

  document.getElementById('menuOverlay').style.display = 'none';

  frame.requestFullscreen().then(() => {
    gameLoop();
  }).catch(err => {
    alert(`全画面表示に失敗しました: ${err.message}`);
    gameLoop(); // 失敗しても開始
  });
});

//続きから
continueBtn.addEventListener('click', () => {
  frame.requestFullscreen().then(() => {
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    loadPlayerPosition();  // ここでだけ復元
    document.getElementById('menuOverlay').style.display = 'none';
    gameLoop();
  }).catch(err => {
    alert(`全画面表示に失敗しました: ${err.message}`);
  });
});

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    canvas.width = 1980;
    canvas.height = 1080;
    //loadPlayerPosition(); // ここで一度だけ呼ぶ
  } else {
    canvas.width = 1170;
    canvas.height = 400;
    document.getElementById('menuOverlay').style.display = 'flex';
  }
});

