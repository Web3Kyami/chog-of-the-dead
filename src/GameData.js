export function resetRun() {
  GameData.coins = 5000;
  GameData.points = 0;
  GameData.respawns = 3;

  GameData.ownedWeapons = { ak: true, arrow: false, bazooka: false };
  GameData.activeWeapon = "ak";
  GameData.upgrades = { ak: [], arrow: [], bazooka: [], health: [] };
  GameData.maxHealth = 3;

  GameData._runActive = false;
  GameData._scoreRecorded = false;
}

export function startRun() {
  GameData._runActive = true;
  GameData._scoreRecorded = false;
}


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
  _runActive: false,
  _scoreRecorded: false,

  user: {
    wallet: null,
    username: null,
    loggedIn: false,
  }

};
export default GameData;