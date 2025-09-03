import Phaser from "phaser";
import GameData from "../GameData.js";
import { fetchLeaderboard } from "../leaderboard.js";

export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super("LeaderboardScene");
  }

  preload() {
    this.load.image("bg_mainmenu_blur", "assets/ui/mainmenu/bg_mainmenu_blur.png");
    this.load.image("bg_leaderboard", "assets/leaderboard/bg_leaderboard.png");
    this.load.image("btn_back", "assets/leaderboard/btn_back.png");
  }

  async create() {
    this.add.image(640, 360, "bg_mainmenu_blur");
    this.add.image(640, 360, "bg_leaderboard").setOrigin(0.5);

    this.add.text(640, 170, "LEADERBOARD", {
      fontSize: "35px",
      fontFamily: "'Press Start 2P', monospace",
      color: "#680c0cff",
    }).setOrigin(0.5);

    // Container for scrollable entries
    this.scrollContainer = this.add.container(640, 260);

    // Loading text
    const loadingText = this.add.text(640, 300, "Loading leaderboard...", {
      fontSize: "26px",
      fontFamily: "Montserrat",
      color: "#000000"
    }).setOrigin(0.5);

    // Fetch global leaderboard
    let entries = [];
    try {
      entries = await fetchLeaderboard();
    } catch (err) {
      console.error("❌ Failed to fetch global leaderboard:", err);
    }

    // Remove loading text
    loadingText.destroy();

    if (entries && entries.length > 0) {
      entries.forEach((entry, i) => {
        // Rank
        const rankTxt = this.add.text(-250, i * 40, `${i + 1}.`, {
          fontSize: "28px",
          fontFamily: "Montserrat",
          color: "#000000"
        }).setOrigin(0, 0);

        // Username
        const nameTxt = this.add.text(-200, i * 40, entry.username, {
          fontSize: "28px",
          fontFamily: "Montserrat",
          color: "#000000"
        }).setOrigin(0, 0);

        // Score (aligned right column)
        const scoreTxt = this.add.text(200, i * 40, entry.score.toString(), {
          fontSize: "28px",
          fontFamily: "Montserrat",
          color: "#000000"
        }).setOrigin(1, 0);

        this.scrollContainer.add([rankTxt, nameTxt, scoreTxt]);
      });
    } else if (GameData.leaderboard && GameData.leaderboard.length > 0) {
      GameData.leaderboard.forEach((entry, i) => {
        const rankTxt = this.add.text(-250, i * 40, `${i + 1}.`, {
          fontSize: "28px",
          fontFamily: "Montserrat",
          color: "#000000"
        }).setOrigin(0, 0);

        const nameTxt = this.add.text(-210, i * 40, entry.username, {
          fontSize: "28px",
          fontFamily: "Montserrat",
          color: "#000000"
        }).setOrigin(0, 0);

        const scoreTxt = this.add.text(210, i * 40, entry.score.toString(), {
          fontSize: "28px",
          fontFamily: "Montserrat",
          color: "#000000"
        }).setOrigin(1, 0);

        this.scrollContainer.add([rankTxt, nameTxt, scoreTxt]);
      });
    } else {
      this.add.text(640, 300, "No scores yet!", {
        fontSize: "28px",
        fontFamily: "Montserrat",
        color: "#000000"
      }).setOrigin(0.5);
    }

    // Mask + scrolling
    const maskHeight = 350, maskY = 260;
    const shape = this.make.graphics();
    shape.fillStyle(0xffffff);
    shape.fillRect(340, maskY - maskHeight / 2, 600, maskHeight);
    const mask = shape.createGeometryMask();
    this.scrollContainer.setMask(mask);

    this.input.on("wheel", (pointer, dx, dy) => {
      this.scrollContainer.y -= dy * 0.25;
      const contentHeight = (this.scrollContainer.list.length / 3) * 40; // 3 items per row
      const minY = maskY - Math.max(0, contentHeight - maskHeight);
      const maxY = maskY;
      this.scrollContainer.y = Phaser.Math.Clamp(this.scrollContainer.y, minY, maxY);
    });

    // Back button
    const backBtn = this.add.image(870, 170, "btn_back").setInteractive({ useHandCursor: true });
    backBtn.on("pointerdown", () => this.scene.start("MainMenuScene"));
  }
}
