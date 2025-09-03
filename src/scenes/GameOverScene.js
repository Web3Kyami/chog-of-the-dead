import Phaser from "phaser";
import GameData from "../GameData.js";
import { saveGameData } from "../storage.js";
import { submitScore } from "../auth/onchain.js";
import { recordScore } from "../leaderboard.js";
import { resetRun } from "../GameData.js";

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  preload() {
    this.load.image("bg_mainmenu_blur", "assets/ui/mainmenu/bg_mainmenu_blur.png");
    this.load.image("btn_mainnu", "assets/ui/mainmenu/main_replay.png");
    this.load.image("btn_restart", "assets/ui/mainmenu/Replay.png");
  }

  create() {
    const finalScore = GameData.points || 0;
        this.add.image(640, 360, "bg_mainmenu_blur");

    this.add.text(640, 200, "GAME OVER", {
      fontSize: "72px",
      fontFamily: "'Press Start 2P', monospace",
      color: "#ff0000",
      stroke: "#000000",
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(640, 280, "Chog died!", {
      fontSize: "32px",
      fontFamily: "'Press Start 2P', monospace",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6,
    }).setOrigin(0.5);

    // ✅ show final score before reset

    this.add.text(640, 350, `Score: ${finalScore}`, {
      fontSize: "28px",
      fontFamily: "Montserrat",
      color: "#ffff00",
    }).setOrigin(0.5);

    
    // ✅ Save + submit async, then reset
    (async () => {
  recordScore(GameData.user?.username, finalScore);

  if (GameData.user?.wallet) {
    try {
      await submitScore(GameData.user.wallet, finalScore);
    } catch (err) {
      console.error("❌ Onchain submit failed:", err);
    }
  }

  if (finalScore > (GameData.highScore || 0)) {
    GameData.highScore = finalScore;
  }

  saveGameData();
  resetRun();       // reset AFTER saving score
  saveGameData();   // persist reset state
})();


    const restartBtn = this.add.image(640, 460, "btn_restart").setInteractive({ useHandCursor: true });
    restartBtn.on("pointerdown", () => {
      resetRun();
  saveGameData();
  startRun();
      this.scene.start("LevelOneScene");
    });

    const backBtn = this.add.image(640, 560, "btn_mainnu").setInteractive({ useHandCursor: true });
    backBtn.on("pointerdown", () => {
      resetRun();
  saveGameData();
  startRun();
      this.scene.start("MainMenuScene");
    });
  }
}
