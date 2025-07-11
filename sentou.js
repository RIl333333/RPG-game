export let damageTexts = [];
const canvas = document.getElementById('battleCanvas'); // ← gameCanvasではない

export function addDamageText(text, color = "yellow") {
  const enemyImg = document.getElementById("enemyImage");
  if (!enemyImg) return;

  const canvasRect = canvas.getBoundingClientRect();
  const enemyRect = enemyImg.getBoundingClientRect();

  const scaleX = canvas.width / canvasRect.width;
  const scaleY = canvas.height / canvasRect.height;

  const x = (enemyRect.left + enemyRect.width / 2 - canvasRect.left) * scaleX;
  const y = (enemyRect.top + enemyRect.height / 2 - canvasRect.top) * scaleY;

  console.log("DamageText座標", x, y, scaleX, scaleY);

  damageTexts.push({
    x: x,
    y: y,
    text: text,
    alpha: 1,
    dy: -0.5,
    lifetime: 60,
    color: color
  });
}

