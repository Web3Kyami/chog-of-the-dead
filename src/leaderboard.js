// src/leaderboard.js
import GameData from "./GameData.js";
import { saveGameData } from "./storage.js";

const API_BASE = "https://monad-games-id-site.vercel.app/api";

// ✅ Local fallback leaderboard
export function recordScore(username) {
  if (!GameData.leaderboard) GameData.leaderboard = [];

  GameData.leaderboard.push({
    username: username || "Guest",
    score: GameData.points,
  });

  // Sort highest first
  GameData.leaderboard.sort((a, b) => b.score - a.score);

  // Keep top 10 locally
  GameData.leaderboard = GameData.leaderboard.slice(0, 10);

  saveGameData();
}

// ✅ Fetch global leaderboard (with fallback to local)
export async function fetchLeaderboard() {
  try {
    const res = await fetch(`${API_BASE}/leaderboard`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      return data.map(entry => ({
        username: entry.username || "Guest",
        score: entry.score || 0,
      }));
    }
  } catch (e) {
    console.warn("⚠️ Failed to fetch global leaderboard, using local:", e);
  }

  // Fallback → local scores
  return GameData.leaderboard || [];
}
