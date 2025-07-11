import { showMessage } from "./showmessage.js";
import { setPlayerCanAct } from "./main.js";

export async function loadNpcLines(filename) {
  try {
    const response = await fetch(`./NpcLines/${filename}`);
    if (!response.ok) throw new Error("読み込み失敗");
    return await response.json();
  } catch (e) {
    console.error("NPCセリフの読み込み失敗:", filename, e);
    return null;
  }
}

export async function talkToNPC(npcId) {
  const npcData = await loadNpcLines(npcId);
  if (npcData) {
    for (const line of npcData.lines) {
      const box = document.getElementById("message-field");
      box.style.display = "flex";

      const fullText = `${npcData.lines.join("\n")}`;
      await showMessage(fullText, 20, fieldMessage);

      await waitForEnter();

      box.style.display = "none";
      // 必要ならここでキー入力待ちも追加可能
    }
    document.getElementById('menuOverlay').style.display = 'none';
  } else {
    showMessage("……（無反応）", 20, fieldMessage);
  }
}

export function waitForEnter() {
  return new Promise((resolve) => {
    function onKeyDown(e) {
      if (e.key === "Enter") {
        document.removeEventListener("keydown", onKeyDown);
        setPlayerCanAct(true);
        resolve();
      }
    }
    document.addEventListener("keydown", onKeyDown);
  });
}