import { showBattleItemMenu, closeItemMenu, currentMenu, gameState, setPlayerCanAct , resetKeys, playerCanAct} from "./main.js";
import { inventory } from "./player.js";

const itemList = document.getElementById("itemList");
let selectedItemIndex = 0;

if (gameState === "field") {
  document.addEventListener("keydown", (e) => {
    // 「E」キーだけは常に受け付ける
    if (e.key === "e" || e.key === "E") {
      if (currentMenu === "battleMenu" || currentMenu === "fieldMenu") {
        resetKeys();
        showBattleItemMenu();
        selectedItemIndex = 0;
        updateItemUI();
        setPlayerCanAct(false); // メニュー開いたら行動不可
      } else if (currentMenu === "itemMenu") {
        closeItemMenu();
        setPlayerCanAct(true); // メニュー閉じたら行動可
      }
      return; // Eキー処理だけで終了
    }

    // Eキー以外の入力は playerCanAct が true のときだけ通す
    if (!playerCanAct) return;

    // ここに通常のキー入力処理が来るならここで処理
  });
}

function updateItemUI() {
  const itemList = document.getElementById("itemList");
  itemList.innerHTML = ""; // 一旦リセット

  // count が 0 より大きいものだけ表示
  const visibleItems = inventory.filter(item => item.count > 0);

  visibleItems.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} ×${item.count}`;
    if (index === selectedItemIndex) {
      li.classList.add("selected-item");
    }
    itemList.appendChild(li);
  });

  // 選択中インデックスが範囲外にならないように調整
  if (selectedItemIndex >= visibleItems.length) {
    selectedItemIndex = visibleItems.length - 1;
  }
}


document.addEventListener("keydown", (e) => {
  if (currentMenu !== "itemMenu") return;

  if (e.key === "ArrowDown") {
    selectedItemIndex = (selectedItemIndex + 1) % inventory.length;
    updateItemUI();
    e.preventDefault();
  } else if (e.key === "ArrowUp") {
    selectedItemIndex = (selectedItemIndex - 1 + inventory.length) % inventory.length;
    updateItemUI();
    e.preventDefault();
  } else if (e.key === "Enter") {
    console.log("選択中のアイテムを使う:", inventory[selectedItemIndex]);
  }
});
