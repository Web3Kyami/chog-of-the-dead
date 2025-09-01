// src/main.js
import Phaser from "phaser";
import { initPrivy } from "./auth/privy.js";

// Import game state
import GameData from "./GameData.js";

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

  // ✅ Set up Phaser game
  const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: "#000000",
    physics: {
      default: "arcade",
      arcade: { debug: false },
    },
    scene: [
      MainMenuScene,
      LevelOneScene,
      RespawnScene,
      UIScene,
      LeaderboardScene,
      GameOverScene,
    ],
    scale: {
      mode: Phaser.Scale.FIT,          // ✅ scales to fit any screen
      autoCenter: Phaser.Scale.CENTER_BOTH, // ✅ center on screen
    },
    render: {
      pixelArt: true, // ✅ crisp pixels for retro look
      antialias: false,
    },
  };

  new Phaser.Game(config);
};
