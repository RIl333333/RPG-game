export const maps = {

  field: {
    temp: {
      name: "temp",
      type: "tilemap", // ← 追加：image か tilemap
      jsonSrc: "./Maps/map_name.json", // ← JSON（Tiled出力）
      tilesetImage: "./Maps/tile/map_name_tile.png",
      tileWidth: 32,
      tileHeight: 32,
      width: 100 * 32,
      height: 100 * 32,
      startX: 700,
      startY: 300
    }, test_map: {
      name: "どこか",
      imageSrc: "./Maps/map_anywhere.png",
      collisionSrc: "./Maps/collisions/map_anywhere_collision.png",
      width: 2000,
      height: 1000,
      startX: 300,
      startY: 300
    },
    town: {
      name: "町",
      imageSrc: "./Maps/map_town.png",
      collisionSrc: "./Maps/collisions/map_town_collision.png",
      width: 3000,
      height: 2000,
      startX: 100,
      startY: 100
    },
    forest: {
      name: "森",
      imageSrc: "./Maps/map_forest.png",
      width: 1500,
      height: 900,
      startX: 200,
      startY: 200
    },
  },
  dungeon: {
    dungeon_cave1: {
      name: "ダンジョン",
      imageSrc: "./Maps/map_dungeon.png",
      width: 1200,
      height: 800,
      startX: 50,
      startY: 300
    }
  }
};