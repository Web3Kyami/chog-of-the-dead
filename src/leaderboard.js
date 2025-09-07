// src/leaderboard.js
import GameData from "./GameData.js";
import { saveGameData } from "./storage.js";

const GAME_ID = "252"; // your unique Monad Game ID

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
  const urls = [
    `https://monad-games-id-site.vercel.app/api/leaderboard?gameId=${GAME_ID}&sortBy=scores&page=1`,
    `https://monad-games-id-site.vercel.app/api/leaderboard?page=1&gameId=${GAME_ID}&sortBy=scores`
  ];

  for (const url of urls) {
    try {
      const resp = await fetch(url);
      const text = await resp.text();

      if (resp.ok && text.trim().startsWith("{")) {
        const data = JSON.parse(text);
        const rawEntries = data?.data || [];
        return rawEntries.map((entry, i) => ({
          rank: i + 1,
          username:
            entry.username ||
            entry.player ||
            (entry.walletAddress
              ? `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`
              : "Unknown"),
          score: Number(entry.score || 0),
        }));
      }
    } catch (err) {
      console.error("❌ Failed to fetch global leaderboard:", err);
    }
  }

  // fallback → local scores
  return GameData.leaderboard || [];
}
