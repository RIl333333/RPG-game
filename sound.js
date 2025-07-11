export const sounds = {
  level_up: new Audio('./sounds/level_up.mp3'),
  field_battle1: new Audio('./sounds/field_battle1.mp3'),
  // 必要に応じて追加
};

export function stopSound(soundID) {
  const sound = sounds[soundID];
  if (sound) {
    sound.pause();
    sound.currentTime = 0; // 停止して巻き戻す
  }
}

export let lastPlayedSoundID = null;

export function playSound(soundID) {
  const sound = sounds[soundID];
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.error("再生エラー:", e));
    lastPlayedSoundID = soundID;
  } else {
    console.warn(`soundID "${soundID}" が見つかりません`);
  }
}

export function getLastPlayedSoundID() {
  return lastPlayedSoundID; // ← 外部から取得用
}