const GameData = {
  coins: 5000,
  points: 0,
  respawns: 3,

  maxHealth: 3,

  ownedWeapons: { ak: true, arrow: false, bazooka: false },
  activeWeapon: "ak",

  upgrades: { ak: [], arrow: [], bazooka: [], health: [] },

  hasUpgrade(weapon, key) {
    return this.upgrades[weapon]?.includes(key);
  },

  addUpgrade(weapon, key) {
    if (!this.upgrades[weapon]) this.upgrades[weapon] = [];
    if (!this.upgrades[weapon].includes(key)) this.upgrades[weapon].push(key);
  },

  // --- UI extras ---
  highScore: 0,
  leaderboard: [
    { username: "Alice", score: 1200 },
    { username: "Bob", score: 950 },
    { username: "Chog", score: 500 },
  ],
  user: {
    wallet: null,
    username: null,
    loggedIn: false,
  }
};
export default GameData;