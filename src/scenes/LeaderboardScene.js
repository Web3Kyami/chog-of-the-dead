import Phaser from "phaser";
import GameData from "../GameData.js";

export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super("LeaderboardScene");
  }

  preload() {
    // Background + overlay
    this.load.image("bg_mainmenu_blur", "assets/ui/mainmenu/bg_mainmenu_blur.png");
    this.load.image("bg_leaderboard", "assets/leaderboard/bg_leaderboard.png");
    this.load.image("btn_back", "assets/leaderboard/btn_back.png");
  }

  create() {
    // Background (blurred main menu style)
    this.add.image(640, 360, "bg_mainmenu_blur");
    this.add.image(640, 360, "bg_leaderboard").setOrigin(0.5);

    // Title
    this.add.text(640, 170, "LEADERBOARD", {
      fontSize: "42px",
      fontFamily: "'Press Start 2P', monospace",
      color: "#680c0cff",
    }).setOrigin(0.5);

    // Container for scrollable leaderboard entries
    const maskHeight = 350;
    const maskY = 260;
    this.scrollContainer = this.add.container(640, maskY);

    // Fill with local scores (later we’ll fetch Monad ID global scores)
    if (GameData.leaderboard && GameData.leaderboard.length > 0) {
      GameData.leaderboard.forEach((entry, index) => {
        const txt = this.add.text(0, index * 40, `${index + 1}. ${entry.username} - ${entry.score}`, {
          fontSize: "28px",
          fontFamily: "Montserrat",
          color: "#000000"
        }).setOrigin(0.5, 0);
        this.scrollContainer.add(txt);
      });
    } else {
      this.add.text(640, 300, "No scores yet!", {
        fontSize: "28px",
        fontFamily: "Montserrat",
        color: "#000000"
      }).setOrigin(0.5);
    }

    // Mask (scroll window)
    const shape = this.make.graphics();
    shape.fillStyle(0xffffff);
    shape.fillRect(340, maskY - maskHeight / 2, 600, maskHeight);
    const mask = shape.createGeometryMask();
    this.scrollContainer.setMask(mask);

    // Enable scrolling
    this.input.on("wheel", (pointer, dx, dy) => {
      this.scrollContainer.y -= dy * 0.25;
      const minY = maskY - Math.max(0, (GameData.leaderboard.length * 40) - maskHeight);
      const maxY = maskY;
      this.scrollContainer.y = Phaser.Math.Clamp(this.scrollContainer.y, minY, maxY);
    });

    // Back button
    const backBtn = this.add.image(870, 170, "btn_back").setInteractive({ useHandCursor: true });
    backBtn.on("pointerdown", () => {
      this.scene.start("MainMenuScene");
    });
  }
}
