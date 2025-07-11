import { gameState, setPlayerCanAct } from "./main.js";

let timeoutId = null;

export function showMessage(text, speed = 20) {
  return new Promise((resolve) => {
    let targetId = '';

    // ✅ gameState のチェック
    if (gameState === 'field') {
      targetId = "fieldMessage";
      setPlayerCanAct(false); 
    } else {
      targetId = "battleMessage";
    }

    const message = document.getElementById(targetId);
    if (!message) {
      console.error(`${targetId} が見つかりません`);
      resolve(); // 見つからない場合も resolve してあげる
      return;
    }

    message.innerHTML = "";
    let i = 0;

    // 既存のタイマーをクリア
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    function typeNextChar() {
      if (i < text.length) {
        const char = text.charAt(i);
        if (char === "\n") {
          message.innerHTML += "<br>";
        } else {
          message.innerHTML += char;
        }
        i++;
        timeoutId = setTimeout(typeNextChar, speed);
      } else {
        timeoutId = null;
        resolve();
      }
    }

    typeNextChar();
  });
}
