export const player = {
  x: 130,
  y: 90,
  width: 32 * 3,
  height: 32 * 3,
  speed: 10,
  direction: 'down',
  frameIndex: 0,
  animationTimer: 0
};

export const inventory = [
    { name: "ポーション", effect: "heal", amount: 30, count: 3 },
    { name: "エリクサー", effect: "heal", amount: 100, count: 1 }
];