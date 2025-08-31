import { useEffect } from "react";
import Phaser from "phaser";
import MainMenuScene from "./scenes/MainMenuScene.js";
import LevelOneScene from "./scenes/LevelOneScene.js";
import RespawnScene from "./scenes/RespawnScene.js";
import UIScene from "./scenes/UIScene.js";
import LeaderboardScene from "./scenes/LeaderboardScene.js";
import GameOverScene from "./scenes/GameOverScene.js";

export default function PhaserGame() {
  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      physics: { default: "arcade", arcade: { debug: false } },
      scene: [
        MainMenuScene,
        LevelOneScene,
        RespawnScene,
        UIScene,
        LeaderboardScene,
        GameOverScene,
      ],
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    };

    new Phaser.Game(config);
  }, []);

  return null;
}
