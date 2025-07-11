export function startPattern(evadePlayer, bullets, canvas) {
  // きつね：横から高速弾を撃つ
  const bullet = {
    x: 0,
    y: Math.random() * canvas.height,
    dx: 4,
    dy: 0,
    radius: 6,
  };
  bullets.push(bullet);
}