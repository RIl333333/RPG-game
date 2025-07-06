import { showBattleItemMenu, closeItemMenu, inventory, currentMenu, gameState, setPlayerCanAct , resetKeys, playerCanAct} from "./main.js";

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

export function updateItemUI() {
  itemList.innerHTML = "";
  inventory.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (${item.count}個)`;
    if (index === selectedItemIndex) {
      li.classList.add("selected-item");
    }
    itemList.appendChild(li);
  });
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
