export function startPattern(evadePlayer, bullets, canvas) {
  // たぬきの弾パターン（例：単発遅い）
  bullets.push({
    x: Math.random() * canvas.width,
    y: 0,
    dx: 0,
    dy: 2,
    radius: 5,
  });
}