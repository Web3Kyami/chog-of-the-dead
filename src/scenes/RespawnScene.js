import Phaser from "phaser";
import GameData from "../GameData.js";

export default class RespawnScene extends Phaser.Scene {
  constructor() {
    super("RespawnScene");

    // ✅ DO NOT reset anything here (we only display and let the player resume)
    GameData.coins    = (GameData.coins   !== undefined) ? GameData.coins   : 5000;
    GameData.points   = (GameData.points  !== undefined) ? GameData.points  : 0;
    GameData.respawns = (GameData.respawns!== undefined) ? GameData.respawns: 3;

    GameData.ownedWeapons = GameData.ownedWeapons || { ak: true, arrow: false, bazooka: false };
    GameData.activeWeapon = GameData.activeWeapon || "ak";
    this.activeWeapon = GameData.activeWeapon;

    GameData.upgrades  = GameData.upgrades || { ak: [], arrow: [], bazooka: [], health: [] };
    GameData.maxHealth = GameData.maxHealth || 3;

    this.ticks = { ak: [], arrow: [], bazooka: [], health: [] };
    this.akUpgrades = [];
    this.arrowUpgrades = [];
    this.bazookaUpgrades = [];
    this.healthUpgrades = [];
  }

  preload() {
    this.load.json("layout", "layout.json");
    // UI
    this.load.image("bg_layer", "assets/respawn-assets/ui/bg_layer.png");
    this.load.image("chog_title", "assets/respawn-assets/ui/chog_title.png");
    this.load.image("respawn_button", "assets/respawn-assets/ui/respawn_button.png");

    // Zombies
    this.load.image("falling_zombie", "assets/respawn-assets/zombies/falling_zombie.png");
    this.load.image("background_zombies", "assets/respawn-assets/zombies/background_zombies.png");

    // Weapons
    this.load.image("ak47_bullets_35", "assets/respawn-assets/weapons/ak47/bullets_35.png");
    this.load.image("ak47_bullets_50", "assets/respawn-assets/weapons/ak47/bullets_50.png");
    this.load.image("ak47_bullets_75", "assets/respawn-assets/weapons/ak47/bullets_75.png");
    this.load.image("ak47_bullets_100","assets/respawn-assets/weapons/ak47/bullets_100.png");
    this.load.image("icon_ak47", "assets/respawn-assets/weapons/ak47/icon.png");

    this.load.image("arrow_25", "assets/respawn-assets/weapons/arrow/arrows_25.png");
    this.load.image("arrow_50", "assets/respawn-assets/weapons/arrow/arrows_50.png");
    this.load.image("arrow_75", "assets/respawn-assets/weapons/arrow/arrows_75.png");
    this.load.image("arrow_100","assets/respawn-assets/weapons/arrow/arrows_100.png");
    this.load.image("icon_arrow", "assets/respawn-assets/weapons/arrow/icon.png");

    this.load.image("rocket_25", "assets/respawn-assets/weapons/bazooka/rockets_25.png");
    this.load.image("rocket_50", "assets/respawn-assets/weapons/bazooka/rockets_50.png");
    this.load.image("rocket_75", "assets/respawn-assets/weapons/bazooka/rockets_75.png");
    this.load.image("rocket_100","assets/respawn-assets/weapons/bazooka/rockets_100.png");
    this.load.image("icon_bazooka", "assets/respawn-assets/weapons/bazooka/icon.png");

    // Health
    this.load.image("hits_3", "assets/respawn-assets/health/hits_3.png");
    this.load.image("hits_4", "assets/respawn-assets/health/hits_4.png");
    this.load.image("hits_5", "assets/respawn-assets/health/hits_5.png");
    this.load.image("hits_6", "assets/respawn-assets/health/hits_6.png");

    // Extra UI
    this.load.image("coin_icon", "assets/ui/coin.png");
    this.load.image("help_icon", "assets/ui/help.png");
    this.load.image("tick", "assets/ui/tick.png");
    this.load.image("heart", "assets/ui/heart.webp");
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const map = this.cache.json.get("layout");
    map.layers.forEach(layer => {
      if (layer.type === "group") layer.layers.forEach(subLayer => this._spawnObjects(subLayer));
      else if (layer.type === "objectgroup") this._spawnObjects(layer);
    });

    this._createHUD();
    this._createHelp();
    this._restorePurchases();
    this._updateWeaponVisibility();
  }

  _spawnObjects(layer) {
    if (!layer.objects) return;

    layer.objects.forEach(obj => {
      const texture = this._gidToTexture(obj.gid);
      if (!texture || !this.textures.exists(texture)) return;

      let sprite = this.add.image(obj.x, obj.y, texture).setOrigin(0, 1);
      sprite.textureKey = texture;

      // Respawn button
      if (texture === "respawn_button") {
        sprite.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
          this.tweens.add({
            targets: sprite,
            scale: 0.9,
            duration: 100,
            yoyo: true,
            ease: "Sine.easeInOut",
            onComplete: () => {
              // Go back to the level with current points/coins and remaining lives
              this.scene.stop("RespawnScene");
              this.scene.start("LevelOneScene", {
                coins: GameData.coins,
                points: GameData.points,
                respawns: GameData.respawns
              });
            }
          });
        });
      }

      if (texture === "chog_title") {
        sprite.setOrigin(0.5, 0.5);
        sprite.x += sprite.displayWidth / 1.95;
        sprite.y -= sprite.displayHeight / 2;
        this.tweens.add({
          targets: sprite,
          scale: { from: 1, to: 1.05 },
          duration: 1000,
          yoyo: true,
          repeat: -1
        });
      }

      if (texture === "falling_zombie") {
        sprite.y = -200;
        this.tweens.add({
          targets: sprite, y: obj.y, duration: 1200, ease: "Bounce.easeOut"
        });
      }

      if (texture === "icon_ak47") this.icon_ak47Btn = sprite.setInteractive({ useHandCursor: true });
      if (texture === "icon_arrow") {
        this.icon_arrowBtn = sprite.setInteractive({ useHandCursor: true });
        this.arrowCostText = this.add.text(sprite.x + 35, sprite.y - 35, "500", { fontSize: "16px", fill: "#ff0" })
          .setOrigin(0.5);
      }
      if (texture === "icon_bazooka") {
        this.icon_bazookaBtn = sprite.setInteractive({ useHandCursor: true });
        this.bazookaCostText = this.add.text(sprite.x + 35, sprite.y - 35, "1000", { fontSize: "16px", fill: "#ff0" })
          .setOrigin(0.5);
      }

      if (["icon_ak47", "icon_arrow", "icon_bazooka"].includes(texture)) {
        sprite.on("pointerdown", () => this._handleWeaponIcon(texture));
      }

      this._mapUpgrade(texture, sprite);
    });
  }

  _mapUpgrade(tex, sprite) {
    const costs = {
      "ak47_bullets_35": 100, "ak47_bullets_50": 200, "ak47_bullets_75": 400, "ak47_bullets_100": 1000,
      "arrow_25": 200, "arrow_50": 400, "arrow_75": 800, "arrow_100": 1200,
      "rocket_25": 500, "rocket_50": 1000, "rocket_75": 1500, "rocket_100": 2000,
      "hits_3": 150, "hits_4": 350, "hits_5": 800, "hits_6": 1500
    };
    if (!(tex in costs)) return;

    sprite.cost = costs[tex];
    sprite.setInteractive().on("pointerdown", () => this._handleUpgrade(sprite));

    if (tex.includes("ak47")) this.akUpgrades.push(sprite);
    if (tex.includes("arrow")) this.arrowUpgrades.push(sprite);
    if (tex.includes("rocket")) this.bazookaUpgrades.push(sprite);
    if (tex.includes("hits")) this.healthUpgrades.push(sprite);
  }

  _handleWeaponIcon(tex) {
    if (tex === "icon_arrow") {
      if (!GameData.ownedWeapons.arrow && GameData.coins >= 500) {
        GameData.coins -= 500;
        GameData.ownedWeapons.arrow = true;
        if (this.arrowCostText) this.arrowCostText.setVisible(false);
      }
      if (GameData.ownedWeapons.arrow) this.activeWeapon = GameData.activeWeapon = "arrow";
    } else if (tex === "icon_bazooka") {
      if (!GameData.ownedWeapons.bazooka && GameData.coins >= 1000) {
        GameData.coins -= 1000;
        GameData.ownedWeapons.bazooka = true;
        if (this.bazookaCostText) this.bazookaCostText.setVisible(false);
      }
      if (GameData.ownedWeapons.bazooka) this.activeWeapon = GameData.activeWeapon = "bazooka";
    } else if (tex === "icon_ak47") {
      this.activeWeapon = GameData.activeWeapon = "ak";
    }

    this.coinText?.setText(GameData.coins);
    this._updateWeaponVisibility();
  }

  _handleUpgrade(sprite) {
    let weapon;
    if (sprite.textureKey.includes("ak47")) weapon = "ak";
    else if (sprite.textureKey.includes("arrow")) weapon = "arrow";
    else if (sprite.textureKey.includes("rocket")) weapon = "bazooka";
    else if (sprite.textureKey.includes("hits")) weapon = "health";
    if (!weapon) return;

    if (GameData.coins >= sprite.cost && !GameData.upgrades[weapon].includes(sprite.textureKey)) {
      GameData.coins -= sprite.cost;
      this.coinText.setText(GameData.coins);
      GameData.upgrades[weapon].push(sprite.textureKey);

      if (weapon === "health") {
        const hpMap = { "hits_3": 3, "hits_4": 4, "hits_5": 5, "hits_6": 6 };
        GameData.maxHealth = Math.max(GameData.maxHealth, hpMap[sprite.textureKey] || 3);
      }

      sprite.setAlpha(0.3);
      const tick = this.add.image(sprite.x + sprite.displayWidth / 2, sprite.y - sprite.displayHeight / 2, "tick")
        .setOrigin(0.5).setScale(0.6);
      tick.upgradeKey = sprite.textureKey;
      this.ticks[weapon].push(tick);

      this._updateWeaponVisibility();
    }
  }

  _restorePurchases() {
    const all = [
      { list: this.akUpgrades, w: "ak" },
      { list: this.arrowUpgrades, w: "arrow" },
      { list: this.bazookaUpgrades, w: "bazooka" },
      { list: this.healthUpgrades, w: "health" },
    ];
    all.forEach(({ list, w }) => {
      list.forEach(sprite => {
        if (GameData.upgrades[w].includes(sprite.textureKey)) {
          sprite.setAlpha(0.3);
          const tick = this.add.image(sprite.x + sprite.displayWidth / 2, sprite.y - sprite.displayHeight / 2, "tick")
            .setOrigin(0.5).setScale(0.6);
          tick.upgradeKey = sprite.textureKey;
          this.ticks[w].push(tick);
        }
      });
    });
  }

  _updateWeaponVisibility() {
    this.akUpgrades.forEach(b => b.setVisible(this.activeWeapon === "ak"));
    this.arrowUpgrades.forEach(b => b.setVisible(this.activeWeapon === "arrow" && GameData.ownedWeapons.arrow));
    this.bazookaUpgrades.forEach(b => b.setVisible(this.activeWeapon === "bazooka" && GameData.ownedWeapons.bazooka));
    this.healthUpgrades.forEach(b => b.setVisible(true));

    // dim lower tiers if higher bought
    const hideLower = (list, owned) => {
      let maxLevel = 0;
      list.forEach(s => {
        if (GameData.upgrades[owned].includes(s.textureKey)) {
          const lvl = parseInt(s.textureKey.match(/\d+/)[0]);
          if (lvl > maxLevel) maxLevel = lvl;
        }
      });
      list.forEach(s => {
        const lvl = parseInt(s.textureKey.match(/\d+/)[0]);
        if (lvl < maxLevel) s.setAlpha(0.2).disableInteractive();
      });
    };
    hideLower(this.akUpgrades, "ak");
    hideLower(this.arrowUpgrades, "arrow");
    hideLower(this.bazookaUpgrades, "bazooka");

    // Health tiers
    const healthMap = { "hits_3": 3, "hits_4": 4, "hits_5": 5, "hits_6": 6 };
    let maxHealth = GameData.maxHealth || 3;
    this.healthUpgrades.forEach(s => {
      const val = healthMap[s.textureKey] || 0;
      if (val < maxHealth) s.setAlpha(0.2).disableInteractive();
    });

    // Icons
    if (this.icon_ak47Btn)    this.icon_ak47Btn.setAlpha(this.activeWeapon === "ak" ? 1 : 0.4);
    if (this.icon_arrowBtn)   this.icon_arrowBtn.setAlpha(GameData.ownedWeapons.arrow ? (this.activeWeapon === "arrow" ? 1 : 0.4) : 0.2);
    if (this.icon_bazookaBtn) this.icon_bazookaBtn.setAlpha(GameData.ownedWeapons.bazooka ? (this.activeWeapon === "bazooka" ? 1 : 0.4) : 0.2);
  }

  _createHUD() {
    let box1 = this.add.graphics();
    box1.fillGradientStyle(0x6a11cb, 0x2575fc, 0x6a11cb, 0x2575fc, 1);
    box1.fillRoundedRect(880, 20, 130, 35, 10);
    this.add.image(905, 35, "coin_icon").setScale(0.6);
    this.coinText = this.add.text(920, 28, GameData.coins, { fontSize: "18px", color: "#fff" });

    let box2 = this.add.graphics();
    box2.fillGradientStyle(0x6a11cb, 0x2575fc, 0x6a11cb, 0x2575fc, 1);
    box2.fillRoundedRect(1060, 20, 130, 35, 10);
    this.pointsText = this.add.text(1080, 28, GameData.points, { fontSize: "18px", color: "#fff" });

    // ❤️ lives (respawns)
    this.respawnHearts = [];
    for (let i = 0; i < GameData.respawns; i++) {
      const heart = this.add.image(700 + i * 40, 40, "heart").setScale(1);
      this.respawnHearts.push(heart);
    }
  }

  _createHelp() {
    this.helpBtn = this.add.text(30, 350, "?", {
      fontSize: "32px", color: "#fff", fontStyle: "bold", backgroundColor: "#3d0101ff"
    }).setPadding(10).setInteractive().setOrigin(0.5);

    this.helpPopup = this.add.rectangle(640, 360, 600, 400, 0x000000, 0.85).setVisible(false);
    this.helpText = this.add.text(380, 200,
  "Respawn Shop Guide:\n\n" +
  "- Earn coins by defeating zombies\n" +
  "- Unlock new weapons:\n" +
  "   • Arrow (500 coins)\n" +
  "   • Bazooka (1000 coins)\n" +
  "- Buy upgrades for each weapon\n" +
  "- Each upgrade improves ammo, reload speed or damage\n" +
  "- Health upgrades increase max hearts (up to 6)\n" +
  "- Upgrades stack and stay active across lives\n" +
  "- Choose wisely before you respawn!",
  {
    fontSize: "20px",
    color: "#ffffff",
    fontFamily: "Montserrat",
    wordWrap: { width: 560 }
  }
).setVisible(false);


    this.helpBtn.on("pointerdown", () => {
      let v = !this.helpPopup.visible;
      this.helpPopup.setVisible(v);
      this.helpText.setVisible(v);
    });
  }

  _gidToTexture(gid) {
    switch (gid) {
      case 1: return "bg_layer";
      case 2: return "chog_title";
      case 3: return "respawn_button";
      case 4: return "background_zombies";
      case 5: return "falling_zombie";
      case 6: return "hits_3";
      case 7: return "hits_4";
      case 8: return "hits_5";
      case 9: return "hits_6";
      case 10: return "ak47_bullets_35";
      case 11: return "ak47_bullets_50";
      case 12: return "ak47_bullets_75";
      case 13: return "ak47_bullets_100";
      case 14: return "icon_ak47";
      case 15: return "arrow_25";
      case 16: return "arrow_50";
      case 17: return "arrow_75";
      case 18: return "arrow_100";
      case 19: return "icon_arrow";
      case 20: return "icon_bazooka";
      case 21: return "rocket_25";
      case 22: return "rocket_50";
      case 23: return "rocket_75";
      case 24: return "rocket_100";
      default: return null;
    }
  }
}
