import GameData from "./GameData.js";

export function saveGameData() {
  try {
    localStorage.setItem("GameData", JSON.stringify(GameData));
  } catch (err) {
    console.error("Failed to save GameData:", err);
  }
}

export function loadGameData() {
  try {
    const saved = localStorage.getItem("GameData");
    if (saved) {
      Object.assign(GameData, JSON.parse(saved));
    }
  } catch (err) {
    console.error("Failed to load GameData:", err);
  }
}
