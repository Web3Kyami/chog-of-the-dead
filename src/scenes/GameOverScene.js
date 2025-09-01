import Phaser from "phaser";
import GameData from "../GameData.js";
import { saveGameData } from "../storage.js";
import { submitScore } from "../auth/onchain.js";
import { recordScore } from "../leaderboard.js"; // helper we made earlier

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  preload() {
    // Use blurred main menu bg (already in assets)
    this.load.image("bg_mainmenu_blur", "assets/ui/mainmenu/bg_mainmenu_blur.png");
    this.load.image("btn_mainnu", "assets/ui/mainmenu/main_replay.png");
    this.load.image("btn_restart", "assets/ui/mainmenu/Replay.png"); 
  }

  create() {
    // Background
    this.add.image(640, 360, "bg_mainmenu_blur");

    // ⚡ Big "GAME OVER" text
    this.add.text(640, 200, "GAME OVER", {
      fontSize: "72px",
      fontFamily: "'Press Start 2P', monospace", // pixel-gaming font
      color: "#ff0000",
      stroke: "#000000",
      strokeThickness: 8,
    }).setOrigin(0.5);

    // Sub text
    this.add.text(640, 280, "Chog died!", {
      fontSize: "32px",
      fontFamily: "'Press Start 2P', monospace",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Record score locally + onchain
    recordScore(GameData.user?.username);
    if (GameData.user?.wallet) {
      submitScore(GameData.user.wallet, GameData.points);
    }
    saveGameData();

    // Show final score
    this.add.text(640, 350, `Score: ${GameData.points}`, {
      fontSize: "28px",
      fontFamily: "Montserrat",
      color: "#ffff00",
    }).setOrigin(0.5);

    // Restart button
    const restartBtn = this.add.image(640, 460, "btn_restart").setInteractive({ useHandCursor: true });
    restartBtn.on("pointerdown", () => {
  // 🔄 Reset full GameData (except highscore & username/wallet)
  GameData.coins = 5000;
  GameData.points = 0;
  GameData.respawns = 3;
  GameData.ownedWeapons = { ak: true, arrow: false, bazooka: false };
  GameData.activeWeapon = "ak";
  GameData.upgrades = { ak: [], arrow: [], bazooka: [], health: [] };
  GameData.maxHealth = 3;

  this.scene.start("LevelOneScene");
});
    // Back to menu button
    const backBtn = this.add.image(640, 560, "btn_mainnu").setInteractive({ useHandCursor: true });
    backBtn.on("pointerdown", () => {
  // Reset game state on return to menu
  GameData.coins = 5000;
  GameData.points = 0;
  GameData.respawns = 3;
  GameData.ownedWeapons = { ak: true, arrow: false, bazooka: false };
  GameData.activeWeapon = "ak";
  GameData.upgrades = { ak: [], arrow: [], bazooka: [], health: [] };
  GameData.maxHealth = 3;

  this.scene.start("MainMenuScene");
});
  }
}
