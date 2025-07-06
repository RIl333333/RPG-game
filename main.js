const h2 = document.getElementById("h2");
h2.innerHTML = new Date().toLocaleString();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');


// バトル画面のボタン群
const battleButtons = [
  document.getElementById("attackBtn"),
  document.getElementById("itemBtn"),
  document.getElementById("runBtn"),
];

let selectedIndex = 0; // 初期選択は「攻撃」

function updateSelectedButton() {
  battleButtons.forEach((btn, i) => {
    if (i === selectedIndex && playerCanAct === true) {
      btn.classList.add("selected");
      btn.focus();
    } else {
      btn.classList.remove("selected");
    }
  });
}

export function battleKeyDownHandler(e) {
  if (document.getElementById("battleScreen").style.display === "none") return;

  if ((e.key === "ArrowRight" || e.key === "ArrowDown") && playerCanAct === true) {
    selectedIndex = (selectedIndex + 1) % battleButtons.length;
    updateSelectedButton();
    e.preventDefault();
  } else if ((e.key === "ArrowLeft" || e.key === "ArrowUp") && playerCanAct === true) {
    selectedIndex = (selectedIndex - 1 + battleButtons.length) % battleButtons.length;
    updateSelectedButton();
    e.preventDefault();
  } else if (e.key === "Enter" && playerCanAct === true) {
    battleButtons[selectedIndex].click();
    e.preventDefault();
  }
}

// 通常はイベント登録
document.addEventListener("keydown", battleKeyDownHandler);

const enemyTypes = [
  {
    name: "たぬき",
    imageSrc: "./Chara/monster1.png",
    maxHp: 20,
    attack: 1,
    xpReward: 10
  },
  {
    name: "きつね",
    imageSrc: "./Chara/monster2.png",
    maxHp: 35,
    attack: 2,
    xpReward: 18
  },
  {
    name: "くま",
    imageSrc: "./Chara/monster3.png",
    maxHp: 50,
    attack: 5,
    xpReward: 25
  }
];
let currentEnemy = null;
let enemyImage = new Image();
export let gameState = "field"; // "field" か "battle"
export let playerCanAct = true; // ${player.name}が操作可能かどうか

export function setPlayerCanAct(value) {
  playerCanAct = value;
}

function startBattle() {
  document.addEventListener("keydown", battleKeyDownHandler);
  gameState = "battle";
  cancelAnimationFrame(gameLoopId);

  document.getElementById("enemyImage").src = currentEnemy.imageSrc;
  document.getElementById("enemyName").textContent = currentEnemy.name + " が現れた！";
  document.getElementById("enemyHpText").textContent = `敵HP: ${currentEnemy.hp} / ${currentEnemy.maxHp}`;
  document.getElementById("playerHpText").textContent = `${player.name}HP: ${player.hp} / ${player.maxhp}`;

  document.getElementById('battleScreen').style.display = 'block';

  playerCanAct = true;
}

const message = document.getElementById("message")

function enemyTurn() {
  playerCanAct = false; // 敵の行動中は${player.name}操作禁止

  const damage = currentEnemy.attack;
  player.hp -= damage;
  if (player.hp < 0) player.hp = 0;

  message.innerHTML = `${currentEnemy.name}の攻撃！ ${player.name}は${damage}ダメージを受けた！`;
  updatePlayerHpText();

  if (player.hp <= 0) {
    message.innerHTML = message.innerHTML = `${player?.name ?? "プレイヤー"}はやられた…ゲームオーバー！`;
    endBattle();
    playerCanAct = true; // ゲーム終了時は操作許可（またはゲームオーバー処理へ）
  } else {
    // 1秒後に操作許可（敵ターン終了）
    setTimeout(() => {
      message.innerHTML = "";
      playerCanAct = true;
      updateSelectedButton();  // 戦闘メニューの選択を戻すなど
    }, 1000);
  }
}

document.getElementById("attackBtn").addEventListener("click", () => {
  if (!playerCanAct) return;  // 連打防止

  playerCanAct = false; // 攻撃後は一旦操作禁止

  const playerDamage = player.attackdamage;
  currentEnemy.hp -= playerDamage;
  if (currentEnemy.hp < 0) currentEnemy.hp = 0;
  message.innerHTML = `${player.name}の攻撃！ ${currentEnemy.name}は${playerDamage}ダメージを受けた！`;
  document.getElementById("enemyHpText").textContent = `敵HP: ${currentEnemy.hp} / ${currentEnemy.maxHp}`;

  if (currentEnemy.hp <= 0) {
    document.getElementById("enemyName").textContent = currentEnemy.name + " を倒した！";
    gainXp(currentEnemy.xpReward);
    setTimeout(() => {
      endBattle();
      playerCanAct = true; // 戦闘終了で操作許可
    }, 1000);
    return;
  }
  setTimeout(() => {
    enemyTurn();
  }, 1000);
});

//アイテム
document.getElementById("itemBtn").addEventListener("click", () => {
  showBattleItemMenu();
});
export let currentMenu = "battleMenu";
let selectedItemIndex = 0;
let visibleItems = [];

function itemMenuIsVisible() {
  return currentMenu === "itemMenu";
}

export function showBattleItemMenu() {
  playerCanAct = false;
  document.removeEventListener("keydown", battleKeyDownHandler);
  document.addEventListener("keydown", battleItemMenuKeyDownHandler);
  currentMenu = "itemMenu";
  selectedItemIndex = 0;
  visibleItems = inventory.filter(item => item.count > 0);

  // ここでチェック：使えるアイテムがなければメニューを出さずにメッセージだけ出す
  if (visibleItems.length === 0) {
    message.innerHTML = "使えるアイテムがありません！";
    currentMenu = "messageAfterItem";  // メッセージ確認モードに
    return;
  }

  currentMenu = "itemMenu";
  selectedItemIndex = 0;

  const itemMenu = document.getElementById("itemMenu");
  itemMenu.style.display = "block";

  const itemList = document.getElementById("itemList");
  itemList.innerHTML = "";

  visibleItems.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (${item.count}個)`;
    li.dataset.index = index;
    if (index === selectedItemIndex) li.classList.add("selected-item");
    itemList.appendChild(li);
  });

  battleButtons.forEach(btn => btn.classList.remove("selected"));
  updateSelectedItemUI();
}

export function closeItemMenu() {
  playerCanAct = true;
  currentMenu = "battleMenu";
  document.getElementById("itemMenu").style.display = "none";
  updateSelectedButton();  // 戦闘メニューの選択復帰処理
  document.removeEventListener("keydown", battleItemMenuKeyDownHandler);
  document.addEventListener("keydown", battleKeyDownHandler);
}

export function battleItemMenuKeyDownHandler(e) {
  if (!itemMenuIsVisible()) return;

  if (e.key === "ArrowDown") {
    selectedItemIndex = (selectedItemIndex + 1) % visibleItems.length;
    updateSelectedItemUI();
    e.preventDefault();
  } else if (e.key === "ArrowUp") {
    selectedItemIndex = (selectedItemIndex - 1 + visibleItems.length) % visibleItems.length;
    updateSelectedItemUI();
    e.preventDefault();
  } else if (e.key === "Enter") {
    updateSelectedItemUI();
    useBattleItem(selectedItemIndex);
    setTimeout(() => {
      enemyTurn();
      playerCanAct = true;
    }, 1000);
    e.preventDefault();
  }
}

function useBattleItem(index) {
  const item = visibleItems[index];
  if (!item) return;

  if (item.effect === "heal") {
    player.hp += item.amount;
    if (player.hp > player.maxhp) player.hp = player.maxhp;
    message.innerHTML = `${item.name}を使って${item.amount}回復した！`;
  }

  item.count--;
  if (item.count < 0) item.count = 0;

  updatePlayerHpText();
  updateHUD();

  closeItemMenu();  // アイテム使用後にメニューを閉じる
}

function updateSelectedItemUI() {
  const itemList = document.getElementById("itemList");
  const items = itemList.querySelectorAll("li");
  items.forEach(li => li.classList.remove("selected-item"));
  if (items[selectedItemIndex]) {
    items[selectedItemIndex].classList.add("selected-item");
  }
}

// closeItemMenuBtnクリックイベントは初期化時に1回だけ登録
document.getElementById("closeItemMenuBtn").addEventListener("click", () => {
  playerCanAct = true;
  closeItemMenu();
});


function updatePlayerHpText() {
  document.getElementById("playerHpText").textContent =
    `${player.name}HP: ${player.hp} / ${player.maxhp}`;

  const hpBar = document.getElementById("hpBar");
  const percent = (player.hp / player.maxhp) * 100;
  hpBar.style.width = `${percent}%`;
}

document.getElementById("closeItemMenuBtn").addEventListener("click", () => {
  document.getElementById("itemMenu").style.display = "none";
});

//逃げた

document.getElementById("runBtn").addEventListener("click", () => {
  console.log("逃げた！");
  endBattle();
});

function endBattle() {
  currentEnemy = null;
  gameState = "field";
  document.getElementById('battleScreen').style.display = 'none';
  updateHUD(); // ←追加するとHUDが即時更新される
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
  name: "はるまち",
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

export const inventory = [
  { name: "ポーション", effect: "heal", amount: 30, count: 3 },
  { name: "エリクサー", effect: "heal", amount: 100, count: 1 }
];

// maxxpを計算して初期化
player.maxxp = Math.floor((player.lvl ** 2) * 5 + 20);

// レベルアップをチェックする関数
function checkLevelUp() {
  while (player.xp >= player.maxxp) {
    player.xp -= player.maxxp;
    player.lvl += 1;
    player.maxhp += Math.floor(player.lvl * 3 + 5);
    player.hp = player.maxhp; // HP全回復
    message.innerHTML = (`レベル${player.lvl}に上がった！HPが全回復！`);
    player.maxxp = Math.floor((player.lvl ** 2) * 5 + 20);
  }
}
//xpを与えるファンクション
function gainXp(amount) {
  player.xp += amount;
  checkLevelUp();
  updateHUD(); // ←これを追加すると戦闘後即HUDに反映される
  playerCanAct = true;
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

const map = {
  width: 3000,   // マップ全体の幅
  height: 2000   // マップ全体の高さ
};

let camera = {
  x: 0,
  y: 0
};

const backgroundImage = new Image();
backgroundImage.src = './Maps/map1.png'; // あなたの画像パスに合わせてください

export const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  // 他のキーもあれば
};

export function resetKeys() {
  for (let key in keys) {
    keys[key] = false;
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key in keys) keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key in keys) keys[e.key] = false;
});


function update() {
  if (!playerCanAct) {
    // 移動やアニメーション処理を全スキップ
    return;
  }
  let moving = false;

  if (keys.ArrowUp && playerCanAct === true) {
    player.y -= player.speed;
    player.direction = 'up';
    moving = true;
  }
  if (keys.ArrowDown && playerCanAct === true) {
    player.y += player.speed;
    player.direction = 'down';
    moving = true;
  }
  if (keys.ArrowLeft && playerCanAct === true) {
    player.x -= player.speed;
    player.direction = 'left';
    moving = true;
  }
  if (keys.ArrowRight && playerCanAct === true) {
    player.x += player.speed;
    player.direction = 'right';
    moving = true;
  }

  if (moving && playerCanAct === true) {
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
  if (player.x + player.width > map.width) player.x = map.width - player.width;
  if (player.y + player.height > map.height) player.y = map.height - player.height;

  //敵出現
  if (moving && gameState === "field") {
    const chance = Math.random();
    if (chance > 0.999) {  // 0.1%で出現
      document.getElementById("message").innerHTML = '';
      const chosen = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      currentEnemy = { ...chosen, hp: chosen.maxHp };
      enemyImage.src = chosen.imageSrc;
      startBattle();
    }
  }

  // ${player.name}が中心に来るようにカメラ位置を調整
  camera.x = player.x - canvas.width / 2 + player.width / 2;
  camera.y = player.y - canvas.height / 2 + player.height / 2;

  // マップ外にスクロールしないよう制限
  camera.x = Math.max(0, Math.min(camera.x, map.width - canvas.width));
  camera.y = Math.max(0, Math.min(camera.y, map.height - canvas.height));

}
//draw
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景をまず描画（カメラ位置を考慮）
  ctx.drawImage(backgroundImage, -camera.x, -camera.y, map.width, map.height);

  // ${player.name}の画像選択
  let currentImage;
  if (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight) {
    currentImage = playerImages[player.direction][player.frameIndex];
  } else {
    currentImage = standImages[player.direction];
  }

  // ${player.name}を描画
  ctx.drawImage(currentImage, player.x - camera.x, player.y - camera.y, player.width, player.height);
}

backgroundImage.onload = () => {
  console.log("背景画像が読み込まれました");
};


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
  // ① 全画面へ
  if (!document.fullscreenElement) {
    frame.requestFullscreen().catch(err =>
      alert(`全画面表示に失敗しました: ${err.message}`)
    );
  } else {
    // ② 解除
    document.exitFullscreen();
  }
});

// fullscreen 状態が変わったとき 1 か所で処理



//function save

function savePlayerPosition() {
  const ratioX = player.x / map.width;
  const ratioY = player.y / map.height;
  const saveData = {
    ratioX,
    ratioY
  };
  localStorage.setItem('playerPosition', JSON.stringify(saveData));
  message.innerHTML = (`${player.name ?? "プレイヤー"} の位置を保存しました`, saveData);
}

function loadPlayerPosition() {
  const saved = localStorage.getItem('playerPosition');
  if (saved) {
    try {
      const pos = JSON.parse(saved);
      if (pos.ratioX !== undefined && pos.ratioY !== undefined) {
        player.x = pos.ratioX * map.width;
        player.y = pos.ratioY * map.height;
        console.log('${player.name}位置を復元しました:', player.x, player.y);
      }
    } catch (e) {
      console.error('保存データの読み込み失敗:', e);
    }
  }
}

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
  player.name = "はるまち";
  player.attackdamage = 5;

  document.getElementById('menuOverlay').style.display = 'none';

  frame.requestFullscreen().then(() => {
    gameLoop();
  }).catch(err => {
    alert(`全画面表示に失敗しました: ${err.message}`);
    gameLoop(); // 失敗しても開始
  });
});

window.addEventListener('DOMContentLoaded', () => {
  const continueBtn = document.getElementById('continueGameBtn');
  const saved = localStorage.getItem('playerPosition');
  if (saved) {
    continueBtn.style.display = 'block';
  }

// 続きから押下時の処理
  continueBtn.addEventListener('click', () => {
    frame.requestFullscreen().then(() => {
      if (gameLoopId) cancelAnimationFrame(gameLoopId);
      loadPlayerPosition();
      document.getElementById('menuOverlay').style.display = 'none';
      gameLoop();
    }).catch(err => {
      alert(`全画面表示に失敗しました: ${err.message}`);
    });
  });
});

// メニュー
document.getElementById('hudSettingsBtn').addEventListener('click', () => {
});
document.getElementById('hudExitBtn').addEventListener('click', () => {
  savePlayerPosition();
});

let hasLoaded = false;

document.addEventListener('fullscreenchange', () => {
  const isFullscreen = document.fullscreenElement;

  canvas.width = isFullscreen ? 1980 : 1170;
  canvas.height = isFullscreen ? 1080 : 400;
  document.getElementById('menuOverlay').style.display = isFullscreen ? 'none' : 'flex';

  if (isFullscreen && !hasLoaded) {
    const saved = localStorage.getItem('playerPosition');
  if (saved) {
    continueBtn.style.display = 'block'; // セーブデータがあれば表示
  }
    loadPlayerPosition();
    hasLoaded = true;
  }
});