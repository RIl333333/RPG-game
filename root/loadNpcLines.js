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