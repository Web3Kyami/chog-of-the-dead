import Phaser from "phaser";
import GameData from "./GameData.js";
import { initPrivy } from "./auth/privy.js";

// Import all scenes
import MainMenuScene from "./scenes/MainMenuScene.js";
import LevelOneScene from "./scenes/LevelOneScene.js";
import RespawnScene from "./scenes/RespawnScene.js";
import UIScene from "./scenes/UIScene.js";
import LeaderboardScene from "./scenes/LeaderboardScene.js";
import GameOverScene from "./scenes/GameOverScene.js";

window.onload = function () {
  // ✅ Initialize Privy first
  initPrivy();

  // ✅ Then set up Phaser
  const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    physics: {
      default: "arcade",
      arcade: { debug: false }
    },
    scene: [
      MainMenuScene,
      LevelOneScene,
      RespawnScene,
      UIScene,
      LeaderboardScene,
      GameOverScene
    ],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };

  // ✅ Launch game after Privy init
  new Phaser.Game(config);
};
