import Phaser from "phaser";
import GameData from "../GameData.js";

export default class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  init(data) {
    this.currentCoins = data?.coins ?? 0;
    this.currentPoints = data?.points ?? 0;

    // ✅ Safe health initialization
    if (data && data.health !== undefined) {
      this.currentHealth = data.health;
    } else if (GameData.maxHealth) {
      this.currentHealth = GameData.maxHealth;
    } else {
      this.currentHealth = 3; // fallback default
    }

    this.respawns = data?.respawns ?? 0;
    this.maxHealth = GameData.maxHealth || 3;

    this.weaponKind = "ak";
  }

  create() {
    const width = this.sys.game.config.width;

    // HUD background
    const g = this.add.graphics();
    g.fillGradientStyle(0x6a11cb, 0x2575fc, 0x6a11cb, 0x2575fc, 0.85);
    g.fillRoundedRect(width - 360, 16, 340, 76, 18);
    g.lineStyle(2, 0xffffff, 0.25);
    g.strokeRoundedRect(width - 360, 16, 340, 76, 18);

    // Coins
    this.add.image(width - 330, 54, "coin").setScale(0.7).setOrigin(0, 0.5);
    this.coinText = this.add.text(width - 303, 42, String(this.currentCoins), {
      fontSize: "20px",
      color: "#ffffff",
      fontFamily: "Montserrat"
    });

    // Points
    this.pointsText = this.add.text(width - 235, 42, `PTS: ${this.currentPoints}`, {
      fontSize: "20px",
      color: "#ffffff",
      fontFamily: "Montserrat"
    });

    // Ammo icon + count
    this.add.image(width - 120, 54, "ammo_icon").setOrigin(0.5, 0.5);
    this.bulletText = this.add.text(width - 100, 42, "-", {
      fontSize: "20px",
      color: "#ffffff",
      fontFamily: "Montserrat"
    });

    this.reloadLabel = this.add.text(width - 120, 64, "", {
      fontSize: "14px",
      color: "#ffee88",
      fontFamily: "Montserrat"
    });

  
      // Health bar (rounded)
    this.healthBarBg = this.add.graphics();
    this.healthBarFill = this.add.graphics();

    // Listen for LevelOneScene updates (safely)
    const level = this.scene.get("LevelOneScene");
    if (level) {
      level.events.on("coinCollected", (newTotal) => {
        this.currentCoins = newTotal;
        this.coinText.setText(String(this.currentCoins));
      });

      level.events.on("pointsChanged", (pts) => {
        this.currentPoints = pts;
        this.pointsText.setText(`PTS: ${this.currentPoints}`);
      });

      level.events.on("healthChanged", (hp) => {
        this.currentHealth = hp;
      });

      level.events.on("maxHealthChanged", (newMax) => {
        this.maxHealth = newMax;
      });

      level.events.on("bulletChanged", (inClipOrCount, clipSize, weaponKind) => {
        this.weaponKind = weaponKind ?? this.weaponKind;
        if (this.weaponKind === "ak") {
          const safeClip = clipSize ?? 0;
          this.bulletText.setText(`${inClipOrCount ?? 0}/${safeClip}`);
        } else {
          this.bulletText.setText(`${inClipOrCount ?? 0}`);
        }
      });

      level.events.on("reloadStart", () => {
        this.reloadLabel.setText("RELOADING...");
      });

      level.events.on("reloadEnd", () => {
        this.reloadLabel.setText("");
      });

      this.hearts = [];
for (let i = 0; i < GameData.respawns; i++) {
  const heart = this.add.image(800 + i * 40, 50, "heart").setScale(1);
  this.hearts.push(heart);
}

      level.events.on("respawnLost", (remaining) => {
        this.hearts.forEach((h, idx) => h.setVisible(idx < remaining));
      });

    }
  }
updateHearts() {
  this.hearts.forEach(h => h.destroy());
  this.hearts = [];
  for (let i = 0; i < GameData.respawns; i++) {
    const heart = this.add.image(1250 + i * 40, 30, "heart").setScale(0.5);
    this.hearts.push(heart);
  }
}

  update() {
    // Health bar follows Chog
    const level = this.scene.get("LevelOneScene");
    const chog = level?.player;
    if (!chog) return;

    const barWidth = 60;
    const barHeight = 8;
    const x = chog.x - barWidth / 2;
    const y = chog.y - 50;

    this.healthBarBg.clear();
    this.healthBarBg.fillStyle(0x000000, 0.6);
    this.healthBarBg.fillRoundedRect(x, y, barWidth, barHeight, 4);

    let hpPercent = Phaser.Math.Clamp(this.currentHealth / this.maxHealth, 0, 1);
    let color = 0x00ff00;
    if (hpPercent < 0.6) color = 0xffa500;
    if (hpPercent < 0.3) color = 0xff0000;

    this.healthBarFill.clear();
    this.healthBarFill.fillStyle(color, 1);
    this.healthBarFill.fillRoundedRect(x, y, barWidth * hpPercent, barHeight, 4);
    
  }
}
window.UIScene = UIScene;
