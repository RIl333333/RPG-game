import { enemyTypes } from "./enemyTypes.js";
import { player } from "./player.js";
import { currentEnemy, endBattle, setPlayerCanAct, updatePlayerHpText } from "./main.js";
import { enemyLogicMap } from "./enemyLogic/index.js"; // 追加：敵ごとのロジック集

export const evadeCanvas = document.getElementById("bullet-evade-canvas");
export const evadeCtx = evadeCanvas.getContext("2d");

export let bullets = [];
export let evadePlayer = { x: 140, y: 160, width: 20, height: 20 };
let isEvading = false;

export function setIsEvading(value) {
  isEvading = value;
}

export function getIsEvading() {
  return isEvading;
}

let animationFrameId = null;
let spawnInterval = null;

let keysPressed = {};

window.addEventListener("keydown", (e) => {
  keysPressed[e.key] = true;
});

window.addEventListener("keyup", (e) => {
  keysPressed[e.key] = false;
});

let isInvincible = false;

export function updateEvadeGame() {
  if (!isEvading) return;

  const speed = 2;

  if (keysPressed["ArrowLeft"] || keysPressed["a"]) {
    evadePlayer.x -= speed;
  }
  if (keysPressed["ArrowRight"] || keysPressed["d"]) {
    evadePlayer.x += speed;
  }
  if (keysPressed["ArrowUp"] || keysPressed["w"]) {
    evadePlayer.y -= speed;
  }
  if (keysPressed["ArrowDown"] || keysPressed["s"]) {
    evadePlayer.y += speed;
  }

  evadePlayer.x = Math.max(0, Math.min(evadeCanvas.width - evadePlayer.width, evadePlayer.x));
  evadePlayer.y = Math.max(0, Math.min(evadeCanvas.height - evadePlayer.height, evadePlayer.y));

  evadeCtx.clearRect(0, 0, evadeCanvas.width, evadeCanvas.height);

  bullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;
    evadeCtx.beginPath();
    evadeCtx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    evadeCtx.fillStyle = "red";
    evadeCtx.fill();
  });

  evadeCtx.fillStyle = "cyan";
  evadeCtx.fillRect(evadePlayer.x, evadePlayer.y, evadePlayer.width, evadePlayer.height);

  // プレイヤー描画
if (!isInvincible || Math.floor(Date.now() / 100) % 2 === 0) {
  evadeCtx.fillStyle = "red";
  evadeCtx.fillRect(evadePlayer.x, evadePlayer.y, evadePlayer.width, evadePlayer.height);
}

  // 衝突判定
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    const dx = b.x - (evadePlayer.x + evadePlayer.width / 2);
    const dy = b.y - (evadePlayer.y + evadePlayer.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < b.radius + evadePlayer.width / 2 && !isInvincible) {
      console.log("被弾！");
      player.hp -= currentEnemy.attack;
      updatePlayerHpText();

      isInvincible = true;
      setTimeout(() => {
        isInvincible = false;
      }, 600); // 0.5秒無敵

      // 弾は消さない bullets.splice(i, 1);

      if (player.hp <= 0) {
        stopEvadeGame();
        // ゲームオーバー処理をここで呼ぶなど
        endBattle();
        setPlayerCanAct(true);// ゲーム終了時は操作許可（またはゲームオーバー処理へ）
        showMessage(`${player?.name ?? "プレイヤー"}はやられた…ゲームオーバー！`, 20);
      }
    }
  }

  animationFrameId = requestAnimationFrame(updateEvadeGame);
}

export function spawnEvadeBullet() {
  const bullet = {
    x: Math.random() * evadeCanvas.width,
    y: 0,
    dx: 0,
    dy: 3,
    radius: 5,
  };
  bullets.push(bullet);
}

export function startEvadeGame(onFinishCallback) {
  const evadeBox = document.getElementById("bullet-evade-box");
  if (!evadeBox) {
    console.error("evadeBoxが取得できませんでした");
    return;
  }

  bullets = [];
  isEvading = true;
  evadePlayer.x = 140;
  evadePlayer.y = 160;
  evadeBox.style.display = "block";

  const enemyLogic = enemyLogicMap[currentEnemy.name];

  spawnInterval = setInterval(() => {
    if (!isEvading) {
      clearInterval(spawnInterval);
      return;
    }

    if (enemyLogic?.startPattern) {
      // 敵ごとの専用パターン
      enemyLogic.startPattern(evadePlayer, bullets, evadeCanvas);
    } else {
      // デフォルトパターン
      spawnEvadeBullet();
    }
  }, 300);

  updateEvadeGame();

  setTimeout(() => {
    stopEvadeGame();
    if (onFinishCallback) onFinishCallback();
  }, 5000);
}

export function stopEvadeGame() {
  isEvading = false;
  const evadeBox = document.getElementById("bullet-evade-box");
  if (evadeBox) {
    evadeBox.style.display = "none";
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (spawnInterval) {
    clearInterval(spawnInterval);
    spawnInterval = null;
  }
}
