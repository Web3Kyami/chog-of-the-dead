import GameData from "./GameData.js";
import { saveGameData } from "./storage.js";

// Save to local leaderboard
export function recordScore(username) {
  if (!GameData.leaderboard) GameData.leaderboard = [];

  GameData.leaderboard.push({
    username: username || "Guest",
    score: GameData.points,
  });

  // Sort highest first
  GameData.leaderboard.sort((a, b) => b.score - a.score);

  // Keep top 10
  GameData.leaderboard = GameData.leaderboard.slice(0, 10);

  saveGameData();
}
    