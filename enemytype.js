export const enemyTypes = [
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
    //imageSrc: "./Chara/monster3.png",
    maxHp: 50,
    attack: 5,
    xpReward: 25
  }
];

export const enemyTypesByMap = {
  field: {
    temp: [
      { name: "たぬき"},
      { name: "きつね"},
    ],
    test_map: [
      //{ name: "バット", maxHp: 20, attack: 6 },
    ],
    town: [
      // 町は敵がいないとかもOK
    ],
    forest: [
      //{ name: "オオカミ", maxHp: 40, attack: 12 },
      //{ name: "クマ", maxHp: 80, attack: 20 },
    ],
  },
  dungeon: {
    dungeon_cave1: [
      //{ name: "ゾンビ", maxHp: 60, attack: 15 },
      //{ name: "スケルトン", maxHp: 45, attack: 18 },
    ]
  }
};