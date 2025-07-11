import { setIsEvading, startEvadeGame, stopEvadeGame, updateEvadeGame } from "./bullet.js";
import { inventory, resetPlayer, player } from "./player.js";
import { showMessage } from "./showmessage.js";
import { loadNpcLines } from "./loadNpcLines.js";
import { enemyTypesByMap, enemyTypes } from "./enemytypes.js";
import { sounds, stopSound, playSound, getLastPlayedSoundID} from "./sound.js";
import { maps } from "./Maps/mapdata.js";

const volumeRange = document.getElementById('volumeRange');

let volume = parseFloat(volumeRange.value);

volumeRange.addEventListener('input', () => {
  // すべての音の音量を一括で変更する例
  Object.values(sounds).forEach(sound => {
    sound.volume = volume;
  });
});

let currentMapType = 'field';    // field or dungeon など
let currentMapName = 'temp';

function waitForEnter() {
  return new Promise((resolve) => {
    function onKeyDown(e) {
      if (e.key === "Enter") {
        document.removeEventListener("keydown", onKeyDown);
        setPlayerCanAct(true);
        resolve();
      }
    }
    document.addEventListener("keydown", onKeyDown);
  });
}
//volume設定
const hudSettingsBtn = document.getElementById("settingsBtn");
const volumeLabel = document.getElementById("volumeLabel");

hudSettingsBtn.addEventListener("click", () => {
  const isHidden = volumeRange.style.display === "none";
  volumeRange.style.display = isHidden ? "flex" : "none";
  volumeLabel.style.display = isHidden ? "flex" : "none";
});

async function talkToNPC(npcId) {
  const npcData = await loadNpcLines(npcId);
  if (npcData) {
    for (const line of npcData.lines) {
      const fullText = `\n${npcData.lines.join("\n")}`;
      await showMessage(fullText, 20, fieldMessage);

      console.log(`${npcData.name}：${line}`);
      await waitForEnter();

      const box = document.getElementById("message-field");
      box.style.display = "none";
      // 必要ならここでキー入力待ちも追加可能
    }
    document.getElementById('menuOverlay').style.display = 'none';
  } else {
    showMessage("……（無反応）", 20, fieldMessage);
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "t" || e.key === "T") {
    const box = document.getElementById("message-field");
    box.style.display = "flex";
    talkToNPC("StartMessage.json");
    console.log("Tを押せている");
  }
})

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
export let gameState = "field"; // "field" か "battle"
export let playerCanAct = true; // ${player.name}が操作可能かどうか

export let currentEnemy = null;  // グローバルで宣言

// 名前から完全な敵データを取得する関数
function getEnemyByName(name) {
  const enemy = enemyTypes.find(e => e.name === name);
  return enemy;
}

// マップとエリアを指定して敵をランダム選択しcurrentEnemyにセット
function chooseRandomEnemy(mapType, mapArea) {
  const possibleEnemies = enemyTypesByMap[mapType]?.[mapArea];
  if (!possibleEnemies || possibleEnemies.length === 0) {
    console.error("そのマップに敵がいません", mapType, mapArea);
    return;
  }

  const randomIndex = Math.floor(Math.random() * possibleEnemies.length);
  const enemyName = possibleEnemies[randomIndex].name;
  const baseEnemy = getEnemyByName(enemyName);

  if (!baseEnemy) {
    console.error("enemyTypesに敵データがありません:", enemyName);
    return;
  }

  currentEnemy = {
    ...baseEnemy,
    hp: baseEnemy.maxHp,
  };

  console.log("選ばれた敵", currentEnemy);
}

export function setPlayerCanAct(value) {
  playerCanAct = value;
}

function startBattle() {
  if (currentMapType === "field" && currentMapName === "temp") {
    playSound("field_battle1");
  }
  chooseRandomEnemy(currentMapType, currentMapName);

console.log("選ばれた敵", currentEnemy);
  document.addEventListener("keydown", battleKeyDownHandler);
  gameState = "battle";
  cancelAnimationFrame(gameLoopId);

  document.getElementById("enemyImage").src = currentEnemy.imageSrc;
  document.getElementById("enemyHpText").textContent = `敵HP: ${currentEnemy.hp} / ${currentEnemy.maxHp}`;
  document.getElementById("playerHpText").textContent = `${player.name}HP: ${player.hp} / ${player.maxhp}`;

  document.getElementById('battleScreen').style.display = 'block';
  setTimeout(() => {
    playerCanAct = true;
  }, 2000);
  showMessage(`${currentEnemy.name ?? "敵"}が現れた！`, 20);

}

function enemyTurn() {
  playerCanAct = false; // 敵の行動中は操作禁止
  setIsEvading(true);
  gameState = "battle";
  startEvadeGame(() => {
    // 弾避け終了後の処理
    if (player.hp <= 0) {
      endBattle();
      playerCanAct = true;
      showMessage(`${player?.name ?? "プレイヤー"}はやられた…ゲームオーバー！`, 20);
    } else {
      stopEvadeGame();
      showMessage("", 0);
      playerCanAct = true;
      updateSelectedButton();  // メニュー選択復元など
    }
  });
}


document.getElementById("attackBtn").addEventListener("click", () => {
  if (!playerCanAct) return;

  playerCanAct = false;

  const playerDamage = player.attackdamage;
  currentEnemy.hp -= playerDamage;
  if (currentEnemy.hp < 0) currentEnemy.hp = 0;

  document.getElementById("enemyHpText").textContent = `敵HP: ${currentEnemy.hp} / ${currentEnemy.maxHp}`;
  showMessage(`${player.name}の攻撃！ ${currentEnemy.name}は${playerDamage}ダメージを受けた！`, 20);

  if (currentEnemy.hp <= 0) {
    gainXp(currentEnemy.xpReward);
    setTimeout(() => {
    }, 1000);
    showMessage(currentEnemy.name + " を倒した！" + `\n経験値: ${Math.floor(currentEnemy.xpReward)}xpを獲得した！`, 20);
    setTimeout(() => {
    }, 1000);

    // ここで操作禁止は続けておく
    playerCanAct = false;

    setTimeout(() => {
      endBattle();
      playerCanAct = true; // 戦闘終了で操作許可
    }, 2000);
    return;
  }

  setTimeout(() => {
    enemyTurn();
  }, 2000);
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
    currentMenu = "messageAfterItem";  // メッセージ確認モードに
    showMessage("使えるアイテムがありません！", 20);
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
    }, 2000);
    e.preventDefault();
  }
}

function useBattleItem(index) {
  const item = visibleItems[index];
  if (!item) return;

  if (item.effect === "heal") {
    player.hp += item.amount;
    if (player.hp > player.maxhp) player.hp = player.maxhp;
    showMessage(`${item.name}を使って${item.amount}回復した！`, 20);
  }
  if (item.effect === "damage") {
    player.hp -= item.amount;
    if (player.hp < 0) player.hp = 0;
    updatePlayerHpText();
    showMessage(`${item.name}を使ってしまった。${item.amount}ダメージを食らった！`, 20);

    if (player.hp <= 0) {
      endBattle();
      playerCanAct = true; // ゲーム終了時は操作許可（またはゲームオーバー処理へ）
      showMessage(`${player?.name ?? "プレイヤー"}はやられた…ゲームオーバー！`, 20);
    }
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


export function updatePlayerHpText() {
  document.getElementById("playerHpText").textContent =
    `${player.name}HP: ${player.hp} / ${player.maxhp}`;

  const hpBar = document.getElementById("hpBar");
  const percent = (player.hp / player.maxhp) * 100;
  hpBar.style.width = `${percent}%`;
}

//逃げた

document.getElementById("runBtn").addEventListener("click", () => {
  console.log("逃げた！");
  endBattle();
});

export function endBattle() {
  stopSound(getLastPlayedSoundID()); // ← () を付ける
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

// maxxpを計算して初期化
player.maxxp = Math.floor((player.lvl ** 2) * 5 + 20);

// レベルアップをチェックする関数
function checkLevelUp() {
  while (player.xp >= player.maxxp) {
    playSound("level_up");
    player.xp -= player.maxxp;
    player.lvl += 1;
    player.maxhp += Math.floor(player.lvl * 3 + 5);
    player.hp = player.maxhp; // HP全回復
    player.maxxp = Math.floor((player.lvl ** 2) * 5 + 20);
    showMessage((`レベル${player.lvl}に上がった！HPが全回復！`), 20);
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

  const hpPercent = Math.min(player.hp / player.maxhp * 100, 200);
  hpBar.style.width = hpPercent + '%';

  xpValue.textContent = player.xp;
  maxXpValue.textContent = player.maxxp;

  const xpPercent = Math.min(player.xp / player.maxxp * 100, 200);
  xpBar.style.width = xpPercent + '%';
}



// ロード処理を最初に呼び出す！
//loadPlayerPosition();

// マップデータの定義

function getMapByKey(key) {
  const parts = key.split(".");
  let map = maps;
  for (let part of parts) {
    if (!map[part]) return null;
    map = map[part];
  }
  return map;
}

let currentMapKey = "field.temp";
let currentMap = getMapByKey(currentMapKey);
let mapImage = new Image(); // マップ画像
let camera = { x: 0, y: 0 };
let collisionImg = new Image();
let isMapLoaded = false;

function switchMap(key) {
  const selectedMap = getMapByKey(key);
  if (!selectedMap) {
    console.error("存在しないマップです:", key);
    return;
  }

  currentMapType = 'field';
  currentMapName = 'temp';
  currentMapKey = key;
  currentMap = selectedMap;
  isMapLoaded = false;

  if (selectedMap.type === "tilemap") {
    Promise.all([
      fetch(selectedMap.jsonSrc).then(res => res.json()),
      new Promise(resolve => {
        const img = new Image();
        img.src = selectedMap.tilesetImage;
        img.onload = () => resolve(img);
      })
    ]).then(([json, tilesetImg]) => {
      currentMap.tilemapData = json;
      currentMap.tilesetImg = tilesetImg;
      currentMap.collisionMap = getCollisionMap(json);

      player.x = selectedMap.startX;
      player.y = selectedMap.startY;
      isMapLoaded = true;
      console.log(`${selectedMap.name} のタイルマップを読み込みました`);
    });
  } else {
    mapImage.src = selectedMap.imageSrc;
    let imageLoaded = false;
    let collisionLoaded = !selectedMap.collisionSrc; // ない場合は即trueにしておく

    mapImage.onload = () => {
      console.log(`${selectedMap.name} を読み込みました`);
      player.x = selectedMap.startX;
      player.y = selectedMap.startY;
      imageLoaded = true;
      if (imageLoaded && collisionLoaded) isMapLoaded = true;
    };

    if (selectedMap.collisionSrc) {
      collisionImg = new Image();
      collisionImg.src = selectedMap.collisionSrc;
      collisionImg.onload = () => {
        // 衝突画像読み込み処理...
        console.log(`${selectedMap.name} の衝突判定画像を読み込みました`);
        collisionLoaded = true;
        if (imageLoaded && collisionLoaded) isMapLoaded = true;
      };
    }
  }
}

function isCollidingWithPlayerArea(x, y) {
  const centerX = x + player.width / 2;
  const centerY = y + player.height / 2;

  const upperWidth = player.width * 0.4;
  const upperHeight = player.height * -0.6;
  const lowerWidth = player.width * 0.4;
  const lowerHeight = player.height * 1;

  const upperPoints = [
    { x: centerX - upperWidth / 2, y: centerY - upperHeight / 2 },
    { x: centerX + upperWidth / 2, y: centerY - upperHeight / 2 },
    { x: centerX, y: centerY - upperHeight / 2 },
  ];

  const lowerPoints = [
    { x: centerX - lowerWidth / 2, y: centerY + lowerHeight / 2 },
    { x: centerX + lowerWidth / 2, y: centerY + lowerHeight / 2 },
    { x: centerX, y: centerY + lowerHeight / 2 },
  ];

  const centerPoint = { x: centerX, y: centerY - player.height * -0.4 };

  const allPoints = upperPoints.concat(lowerPoints).concat([centerPoint]);

  // デバッグ用に描画とログ
  drawCollisionPoints(allPoints);

  for (const point of allPoints) {
    if (isColliding(point.x, point.y)) {
      return true;
    }
  }
  return false;
}

function drawCollisionPoints(x, y) {
  const centerX = x + player.width / 2;
  const centerY = y + player.height / 2;

  const upperWidth = player.width * 0.4;
  const upperHeight = player.height * -0.6;
  const lowerWidth = player.width * 0.4;
  const lowerHeight = player.height * 1;

  const upperPoints = [
    { x: centerX - upperWidth / 2, y: centerY - upperHeight / 2 },
    { x: centerX + upperWidth / 2, y: centerY - upperHeight / 2 },
    { x: centerX, y: centerY - upperHeight / 2 },
  ];

  const lowerPoints = [
    { x: centerX - lowerWidth / 2, y: centerY + lowerHeight / 2 },
    { x: centerX + lowerWidth / 2, y: centerY + lowerHeight / 2 },
    { x: centerX, y: centerY + lowerHeight / 2 },
  ];

  const centerPoint = { x: centerX, y: centerY - player.height * -0.4 };

  ctx.fillStyle = 'red';

  [...upperPoints, ...lowerPoints, centerPoint].forEach(point => {
    ctx.beginPath();
    ctx.arc(
      (point.x - camera.x) * scale,
      (point.y - camera.y) * scale,
      4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
}

function isColliding(x, y) {
  if (currentMap.type === "tilemap") {
    const tileX = Math.floor(x / currentMap.tileWidth);
    const tileY = Math.floor(y / currentMap.tileHeight);

    // currentMap.collisionMapを明示的に渡す
    return isBlocked(tileX, tileY, currentMap.collisionMap);

  } else {
    // 画像マップ方式の衝突処理（既存のピクセルベース）
    const colX = Math.floor(x * scaleX);
    const colY = Math.floor(y * scaleY);

    const index = (colY * collisionData.width + colX) * 4;
    const r = collisionData.data[index];
    const g = collisionData.data[index + 1];
    const b = collisionData.data[index + 2];

    return r === 0 && g === 0 && b === 0;
  }
}


function getCollisionMap(mapJson) {
  const collisionLayer = mapJson.layers.find(layer => layer.name === "collision");
  if (!collisionLayer) {
    console.warn("Collisionレイヤーが見つかりません");
    return [];
  }

  const width = collisionLayer.width || 0;
  const height = collisionLayer.height || 0;

  // まず全体をfalseで初期化
  const collisionTiles = Array.from({ length: height }, () => Array(width).fill(false));

  if (collisionLayer.chunks) {
    for (const chunk of collisionLayer.chunks) {
      const { x, y, width: chunkWidth, height: chunkHeight, data } = chunk;
      for (let row = 0; row < chunkHeight; row++) {
        for (let col = 0; col < chunkWidth; col++) {
          const tileIndex = row * chunkWidth + col;
          const tile = data[tileIndex];

          const mapY = y + row;
          const mapX = x + col;

          if (
            mapY >= 0 && mapY < collisionTiles.length &&
            mapX >= 0 && mapX < collisionTiles[0].length
          ) {
            collisionTiles[mapY][mapX] = tile !== 0;
          } else {
            console.warn(`タイル(${mapX},${mapY})がマップ範囲外です`);
          }
        }
      }
    }
  }


  return collisionTiles;
}

const tileSize = 32;

function isBlocked(x, y, collisionMap) {
  if (!collisionMap) return false;
  if (!collisionMap[y]) return false;
  if (!Array.isArray(collisionMap[y])) return false;
  if (typeof collisionMap[y][x] === "undefined") return false;

  const blocked = collisionMap[y][x] === true;

  const pixelX = x * tileSize;
  const pixelY = y * tileSize;

  return blocked;
}

// 初期マップを読み込む
switchMap(currentMapKey);



// キー入力処理
export const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

export function resetKeys() {
  for (let key in keys) keys[key] = false;
}

window.addEventListener('keydown', (e) => {
  if (e.key in keys) keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key in keys) keys[e.key] = false;
});

function update() {
  if (!playerCanAct) return;

  let moving = false;

  let nextX = player.x;
  let nextY = player.y;

  if (keys.ArrowUp) {
    nextY -= player.speed;
  }
  if (keys.ArrowDown) {
    nextY += player.speed;
  }
  if (keys.ArrowLeft) {
    nextX -= player.speed;
  }
  if (keys.ArrowRight) {
    nextX += player.speed;
  }

  // 衝突判定OKなら移動
  if (!isCollidingWithPlayerArea(nextX, nextY)) {
    if (nextX !== player.x || nextY !== player.y) {
      player.x = nextX;
      player.y = nextY;
      moving = true;
    }
  }

  // 動いていなくても方向はキー押下に応じて変える
  if (keys.ArrowUp) {
    player.direction = 'up';
  } else if (keys.ArrowDown) {
    player.direction = 'down';
  } else if (keys.ArrowLeft) {
    player.direction = 'left';
  } else if (keys.ArrowRight) {
    player.direction = 'right';
  }

  // アニメーション処理は moving に依存してもいいし、別途調整してもOK
  if (moving) {
    player.animationTimer++;
    if (player.animationTimer >= 10) {
      player.frameIndex = (player.frameIndex + 1) % playerImages[player.direction].length;
      player.animationTimer = 0;
    }
  } else {
    player.frameIndex = 0;
    player.animationTimer = 0;
  }

  // マップ外制限は残す
  if (player.x < 0) player.x = 0;
  if (player.y < 0) player.y = 0;
  if (player.x + player.width > currentMap.width) player.x = currentMap.width - player.width;
  if (player.y + player.height > currentMap.height) player.y = currentMap.height - player.height;

  // 現在のマップ名またはIDを変数で管理している想定

  // エンカウント判定部分
  if (moving && gameState === "field") {
    const chance = Math.random();
    if (chance > 0.999) {
      document.getElementById("fieldMessage").innerHTML = '';

      // マップごとの敵リストを取得（なければ空配列）
      const possibleEnemies = (enemyTypesByMap[currentMapType] && enemyTypesByMap[currentMapType][currentMapName]) || [];

      if (possibleEnemies.length === 0) {
        // 敵がいないマップなら処理終了
        return;
      }

      const chosen = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];

      currentEnemy = { ...chosen, hp: chosen.maxHp };
      startBattle();
    }
  }


  // カメラ
  camera.x = player.x - (canvas.width / scale) / 2 + player.width / 2;
  camera.y = player.y - (canvas.height / scale) / 2 + player.height / 2;

  // カメラの境界制限もスケール前の座標系で計算
  camera.x = Math.max(0, Math.min(camera.x, currentMap.width - canvas.width / scale));
  camera.y = Math.max(0, Math.min(camera.y, currentMap.height - canvas.height / scale));
}

const scale = 2;  // 拡大倍率

function drawTileMap() {
  const mapData = currentMap.tilemapData;
  const tileset = currentMap.tilesetImg;
  const tileW = currentMap.tileWidth;
  const tileH = currentMap.tileHeight;
  const tilesetCols = Math.floor(tileset.width / tileW);

  for (const layer of mapData.layers) {
    if (layer.type !== "tilelayer") continue;

    if (Array.isArray(layer.data)) {
      for (let i = 0; i < layer.data.length; i++) {
        const gid = layer.data[i];
        if (gid === 0) continue;

        const sx = ((gid - 1) % tilesetCols) * tileW;
        const sy = Math.floor((gid - 1) / tilesetCols) * tileH;

        const dx = (i % layer.width) * tileW * scale;
        const dy = Math.floor(i / layer.width) * tileH * scale;

        ctx.drawImage(
          tileset,
          sx, sy, tileW, tileH,
          dx - camera.x * scale, dy - camera.y * scale,  // カメラ座標もスケール
          tileW * scale,
          tileH * scale
        );
      }
    } else if (Array.isArray(layer.chunks)) {
      ctx.imageSmoothingEnabled = false;  // 拡大縮小時のアンチエイリアスをオフ

      for (const chunk of layer.chunks) {
        const { x: chunkX, y: chunkY, width, height, data } = chunk;
        const maxGid = tilesetCols * Math.floor(tileset.height / tileH);

        for (let i = 0; i < data.length; i++) {
          const gid = data[i];
          if (gid === 0) continue;
          if (gid > maxGid) {
            console.warn("不正な GID:", gid, "をスキップ");
            continue;
          }

          const sx = ((gid - 1) % tilesetCols) * tileW;
          const sy = Math.floor((gid - 1) / tilesetCols) * tileH;

          const localX = i % width;
          const localY = Math.floor(i / width);

          // 描画位置は整数に丸める
          const dx = Math.floor((chunkX + localX) * tileW * scale - camera.x * scale);
          const dy = Math.floor((chunkY + localY) * tileH * scale - camera.y * scale);

          ctx.drawImage(
            tileset,
            sx, sy, tileW, tileH,
            dx, dy,
            tileW * scale,
            tileH * scale
          );
        }
      }

    }
  }
}

// 描画
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentMap.type === "tilemap" && isMapLoaded) {
    drawTileMap();
  } else if (mapImage.complete && mapImage.naturalWidth !== 0) {
    ctx.drawImage(
      mapImage,
      -camera.x * scale,
      -camera.y * scale,
      currentMap.width * scale,
      currentMap.height * scale
    );
  }

  const currentImage = (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight)
    ? playerImages[player.direction][player.frameIndex]
    : standImages[player.direction];

  ctx.drawImage(
    currentImage,
    (player.x - camera.x) * scale,
    (player.y - camera.y) * scale,
    player.width * scale,
    player.height * scale
  );

  drawCollisionPoints(player.x, player.y);  // ここも必要ならスケール対応
}

let gameLoopId = null;

function gameLoop() {
  if (gameState === "field") {
    update();
    draw();
    updateHUD();
    gameLoopId = requestAnimationFrame(gameLoop);
  } else if (gameState === "battle") {
    updateEvadeGame();
  }
}
gameLoop();


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

function saveSettings() {
  if (!currentMap?.width || !currentMap?.height || currentMap.width <= 0 || currentMap.height <= 0) {
    console.warn("マップサイズが無効なため、位置を保存しません");
    return;
  }

  const ratioX = player.x / currentMap.width;
  const ratioY = player.y / currentMap.height;

  if (!currentMap?.width || !currentMap?.height || currentMap.width <= 0 || currentMap.height <= 0) {
  console.warn("セーブ時: currentMapのサイズが不正");
  return;
}
  
  volume = parseFloat(volumeRange.value); // ← グローバル変数に代入

  const saveData = { ratioX, ratioY, volume };
  localStorage.setItem('playerSettings', JSON.stringify(saveData));

  showMessage(`${player.name ?? "プレイヤー"} の位置と音量を保存しました`, 20);
}

function loadSettings() {
  const saved = localStorage.getItem('playerSettings');
  if (saved) {
    try {
      const pos = JSON.parse(saved);

      // 位置復元
      if (
        typeof pos.ratioX === 'number' &&
        typeof pos.ratioY === 'number' &&
        currentMap?.width > 0 &&
        currentMap?.height > 0
      ) {
        const restoredX = pos.ratioX * currentMap.width;
        const restoredY = pos.ratioY * currentMap.height;

        // コリジョンブロック確認があればここで入れる
        player.x = restoredX;
        player.y = restoredY;
        console.log(`${player.name} 位置を復元しました:`, player.x, player.y);
      } else {
        console.warn("保存データの形式が不正またはマップ情報不足:", pos);
      }

      // 音量復元
      if (typeof pos.volume === 'number' && !isNaN(pos.volume)) {
        volume = pos.volume;
        volumeRange.value = volume.toString();
        if (typeof updateAllSoundsVolume === 'function') {
          updateAllSoundsVolume(volume); // ← ここで音量適用
        } else {
          console.warn("updateAllSoundsVolume 関数が定義されていません");
        }
        console.log(`音量を復元しました: ${volume}`);
      }
    } catch (e) {
      console.error("保存データの読み込み失敗:", e);
    }
  }
}

function updateAllSoundsVolume(volume) {
  for (const key in sounds) {
    if (sounds[key] instanceof Audio) {
      sounds[key].volume = volume;
    }
  }
}

//スタートメニュー
const continueBtn = document.getElementById('continueGameBtn');
const startBtn = document.getElementById('startGameBtn');

// ページ読み込み時にセーブデータを確認
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('playerSettings');
  if (saved) {
    continueBtn.style.display = 'block'; // セーブデータがあれば表示
  }
});

//はじめから

startBtn.addEventListener('click', () => {
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  localStorage.removeItem('playerSettings');

  // 初期状態にリセット
  resetPlayer();

  document.getElementById('menuOverlay').style.display = 'none';

  frame.requestFullscreen().then(() => {
    gameLoop();
  }).catch(err => {
    alert(`全画面表示に失敗しました: ${err.message}`);
    gameLoop(); // 失敗しても開始
  });
});

window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('playerSettings');
  if (saved) {
    continueBtn.style.display = 'block';
  }

  // 続きから押下時の処理
  continueBtn.addEventListener('click', () => {
    frame.requestFullscreen().then(() => {
      if (gameLoopId) cancelAnimationFrame(gameLoopId);
      loadSettings();
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
  saveSettings();
});

let hasLoaded = false;

document.addEventListener('fullscreenchange', () => {
  const isFullscreen = document.fullscreenElement;

  canvas.width = isFullscreen ? 1980 : 1170;
  canvas.height = isFullscreen ? 1080 : 400;
  document.getElementById('menuOverlay').style.display = isFullscreen ? 'none' : 'flex';

  if (isFullscreen && !hasLoaded) {
    const saved = localStorage.getItem('playerSettings');
    if (saved) {
      continueBtn.style.display = 'block'; // セーブデータがあれば表示
    }
    loadSettings();
    hasLoaded = true;
  }
});
