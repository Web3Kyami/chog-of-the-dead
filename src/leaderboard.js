// src/leaderboard.js
import GameData from "./GameData.js";
import { saveGameData } from "./storage.js";

const API_BASE = "https://monad-games-id-site.vercel.app/api";

/**
 * Record a single FINAL score locally (top-10). Will only record ONCE per run.
 * @param {string} username
 * @param {number} finalScore
 */
export function recordScore(username, finalScore) {
  if (GameData._scoreRecorded) return; // guard: only once per run

  if (!GameData.leaderboard) GameData.leaderboard = [];
  const name = (username && username.trim()) ? username : "Guest";
  const score = typeof finalScore === "number" ? finalScore : (GameData.points || 0);

  GameData.leaderboard.push({ username: name, score });

  // Sort highest first and keep top 10
  GameData.leaderboard.sort((a, b) => b.score - a.score);
  GameData.leaderboard = GameData.leaderboard.slice(0, 10);

  GameData._scoreRecorded = true; // mark as recorded for this run
  saveGameData();
}

/**
 * Fetch global leaderboard (with fallback to local)
 */
export async function fetchLeaderboard() {
  try {
    const res = await fetch(`${API_BASE}/leaderboard`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.map(entry => ({
        username: entry.username || "Guest",
        score: Number(entry.score || 0),
      }));
    }
  } catch (e) {
    console.warn("⚠️ Failed to fetch global leaderboard, using local:", e);
  }
  return GameData.leaderboard || [];
}
