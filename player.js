export const player = {
  name: "はるまち",
  attackdamage: 10,
  lvl: 1,
  maxxp: 0,
  xp: 0,
  maxhp: 20,
  hp: 20,
  x: 300,
  y: 320,
  width: 32,
  height: 32,
  speed: 1.5,
  direction: 'down',
  frameIndex: 0,
  animationTimer: 0
};

export function resetPlayer() {
  Object.assign(player, {
    x: 1030,
    y: 320,
    direction: 'down',
    frameIndex: 0,
    animationTimer: 0,
    lvl: 1,
    xp: 0,
    maxxp: Math.floor((1 ** 2) * 5 + 20),
    hp: 20,
    maxhp: 20,
    name: "はるまち",
    attackdamage: 10
  });
}

export const inventory = [
  { name: "回復役のような", effect: "damage", amount: 10, count: 1 },
  { name: "ポーション", effect: "heal", amount: 30, count: 3 },
  { name: "エリクサー", effect: "heal", amount: 100, count: 1 }
];