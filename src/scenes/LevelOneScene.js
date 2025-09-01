import Phaser from "phaser";
import GameData from "../GameData.js";
import Chog from "../characters/Chog.js";
import Zombie from "../enemies/Zombie.js";

export default class LevelOneScene extends Phaser.Scene {
  constructor() {
    super("LevelOneScene");
  }

  init(data) {
  // Only set to 3 once, if never initialized
  if (GameData.respawns === undefined) {
    GameData.respawns = 3;
  }

  // Keep respawns passed from RespawnScene
  if (data?.respawns !== undefined) {
    GameData.respawns = data.respawns;
  }

  GameData.coins  = data?.coins  ?? GameData.coins  ?? 0;
  GameData.points = data?.points ?? GameData.points ?? 0;

  this.killCount    = 0;
  this.spawnDelay   = 1700;
  this.bgSpeed      = 1.7;
  this.isPaused     = false;
  this.lastBossTime = 0;
  this.testBoss     = true;
}

  preload() {
    // Background
    this.load.image("road", "assets/backgrounds/road.png");

    // UI
    this.load.image("coin", "assets/ui/coin.png");
    this.load.image("heart", "assets/ui/heart.webp");
    this.load.image("pause_btn", "assets/ui/pause.png");
    this.load.image("ammo_icon", "assets/ui/ammo_icon.png");

    // Projectiles
    this.load.image("bullet", "assets/projectiles/bullet.webp");
    this.load.image("arrow_proj", "assets/projectiles/arrow.png");
    this.load.image("rocket_proj", "assets/projectiles/rocket.png");

    // Effects
    this.load.image("explosion", "assets/effects/explosion.png");

    this.load.audio("bgm_level", "assets/sounds/bgm_level.mp3");
    this.load.audio("shoot", "assets/sounds/shoot.wav");
    this.load.audio("explosion_sfx", "assets/sounds/explosion.wav");

    // Chog + weapons
    this.load.spritesheet("chog_ak", "assets/characters/chog_spritesheet.png",
      { frameWidth: 310.6, frameHeight: 209.5 });
    this.load.spritesheet("chog_arrow_idle", "assets/characters/arrow_idle.png",
      { frameWidth: 213.1, frameHeight: 224.4 });
    this.load.spritesheet("chog_arrow_shoot", "assets/characters/arrow_shoot.png",
      { frameWidth: 212.4, frameHeight: 223.7 });
    this.load.spritesheet("chog_bazooka_shoot", "assets/characters/bazooka_shoot.png",
      { frameWidth: 317.3, frameHeight: 215 });

    // Normal zombies
    this.load.spritesheet("zombie", "assets/characters/zombie_spritesheet.png",
      { frameWidth: 50, frameHeight: 68 });

    // NEW boss spritesheet 
    this.load.spritesheet("zombie_boss", "assets/characters/zombie_boss.png", {
      frameWidth: 127.2,
      frameHeight: 176
    });
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.sound.context.resume();
    this.bgm = this.sound.add("bgm_level", { loop: true, volume: 0.5 });
    this.sound.context.resume();   // ✅ fix autoplay block
    this.bgm.play();

    // Background
    this.background = this.add.tileSprite(
      0, 0, this.sys.game.config.width, this.sys.game.config.height, "road"
    ).setOrigin(0, 0);

    // In scene shutdown/transition
    this.events.on("shutdown", () => {
      if (this.bgm) this.bgm.stop();
    });

    // Player
    this.player = new Chog(this, 120, 550).setScale(0.7);

    // Weapon to use
    this.activeWeapon = (GameData.activeWeapon && (
      GameData.activeWeapon === "ak" ||
      (GameData.activeWeapon === "arrow" && GameData.ownedWeapons?.arrow) ||
      (GameData.activeWeapon === "bazooka" && GameData.ownedWeapons?.bazooka)
    )) ? GameData.activeWeapon : "ak";

    // Launch HUD first
    this.scene.launch("UIScene", {
      coins: GameData.coins,
      points: GameData.points,
      health: this.player.health,
      respawns: GameData.respawns
    });

    // Apply upgrades after HUD is up
    this.time.delayedCall(50, () => {
      this._applyUpgradesToPlayer();
    });

    // Emit initial ammo/health safely
    this.time.delayedCall(100, () => {
      if (this.activeWeapon === "ak") {
        this.events.emit("bulletChanged", this.player.bulletsInClip || 0, this.player.clipSize || 0, "ak");
      } else if (this.activeWeapon === "arrow") {
        this.events.emit("bulletChanged", this.player.arrowAmmo || 0, null, "arrow");
      } else if (this.activeWeapon === "bazooka") {
        this.events.emit("bulletChanged", this.player.rocketAmmo || 0, null, "bazooka");
      }
      this.events.emit("healthChanged", this.player.health);
    });

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      UP: Phaser.Input.Keyboard.KeyCodes.UP,
      P: Phaser.Input.Keyboard.KeyCodes.P
    });

    // Pause button
    this.pauseBtn = this.add.image(24, 24, "pause_btn")
      .setOrigin(0, 0)
      .setDisplaySize(35, 35)
      .setInteractive({ useHandCursor: true });
    this.pauseBtn.on("pointerdown", () => this.togglePause());
    this.input.keyboard.on("keydown-P", () => this.togglePause());

    // Normal zombie anims
    Zombie.createAnimations(this);

    // Ensure boss anim exists
    if (!this.anims.exists("zombie_boss_walk")) {
      this.anims.create({
        key: "zombie_boss_walk",
        frames: this.anims.generateFrameNumbers("zombie_boss", { start: 0, end: 14 }),
        frameRate: 10,
        repeat: -1
      });
    }

    // Groups
    this.zombies = this.physics.add.group();

    
    // Spawn loop (random groups instead of 1-by-1)
this.spawnTimer = this.time.addEvent({
  delay: Phaser.Math.Between(800, 1100),  // random interval between spawns
  loop: true,
  callback: () => {
    const groupCount = Phaser.Math.Between(1, 3); 
    for (let i = 0; i < groupCount; i++) {
      this.spawnZombie();
    }
    // reset next delay dynamically
    this.spawnTimer.delay = Phaser.Math.Between(800, 1100);
  }
});


    // Shooting + switch
    this.input.on("pointerdown", () => this.player.shoot(this.time.now));
    this.input.keyboard.on("keydown-SPACE", () => this.player.shoot(this.time.now));
    this.input.keyboard.on("keydown-UP", () => this.player.switchWeapon());

    // Projectile vs Zombie
    this.physics.add.overlap(this.player.projectiles, this.zombies, (proj, zombie) => {
      if (!proj.active || !zombie.active) return;

      let dmg = 1;
      if (proj.projType === "arrow")  dmg = 2;
      if (proj.projType === "rocket") dmg = 25;

      if (proj.projType === "arrow") {
        zombie.takeDamage(dmg);
        if (zombie.type === "boss") this._rewardBossHit(zombie, dmg);
        if (zombie.hp <= 0) this._killZombie(zombie);

        proj.pierceCount++;
        if (proj.pierceCount >= 2) proj.disableBody(true, true);
        return;
      }

      if (proj.projType === "rocket") {
        proj.onHit?.();
        this.cameras.main.shake(300, 0.02);
        this.zombies.children.iterate(z => {
          if (z.active && Phaser.Math.Distance.Between(proj.x, proj.y, z.x, z.y) < 600) {
            z.takeDamage(dmg);
            if (z.type === "boss") this._rewardBossHit(z, dmg);
            if (z.hp <= 0) this._killZombie(z);
          }
        });
        proj.disableBody(true, true);
        return;
      }

      proj.disableBody(true, true);
      zombie.takeDamage(dmg);
      if (zombie.type === "boss") this._rewardBossHit(zombie, dmg);
      if (zombie.hp <= 0) this._killZombie(zombie);
    });

    // Player vs Zombie
    this.physics.add.overlap(this.player, this.zombies, (player, zombie) => {
      if (!zombie.active) return;
      if (zombie.type !== "boss") {
        zombie.disableBody(true, true);
      }

      const noUpgrades =
        GameData.upgrades.ak.length === 0 &&
        GameData.upgrades.arrow.length === 0 &&
        GameData.upgrades.bazooka.length === 0;

      if (zombie.type === "boss" && noUpgrades) {
        if (zombie.healthBar) zombie.healthBar.destroy();
        this.scene.stop("UIScene");
        this.scene.start("RespawnScene", {
          coins: GameData.coins,
          points: GameData.points,
          respawns: GameData.respawns
        });
        return;
      }

      const dead = this.player.takeDamage(1);
if (dead) {
  if (GameData.points > (GameData.highScore || 0)) {
    GameData.highScore = GameData.points;
  }

  // Lose a life
  GameData.respawns -= 1;

  this.cameras.main.fadeOut(300, 0, 0, 0);
  this.cameras.main.once("camerafadeoutcomplete", () => {
    this.scene.stop("UIScene");

    if (GameData.respawns > 0) {
      // still have lives → respawn
      this.scene.start("RespawnScene", {
        coins: GameData.coins,
        points: GameData.points,
        respawns: GameData.respawns
      });
    } else {
      // no lives → game over
      this.scene.start("GameOverScene");
    }
  });
}

    });
  }

  togglePause() {
    if (!this.isPaused) {
      this.isPaused = true;
      this.physics.pause();
      this.spawnTimer.paused = true;
      this.anims.pauseAll();
      this.scene.pause("UIScene");
    } else {
      this.isPaused = false;
      this.physics.resume();
      this.spawnTimer.paused = false;
      this.anims.resumeAll();
      this.scene.resume("UIScene");
    }
  }

  spawnZombie() {
    const baseY  = 580;
    const xSpawn = this.sys.game.config.width + 80;

    let waveSize = 1;
    if (GameData.points >= 700)  waveSize = 2;
    if (GameData.points >= 1500) waveSize = 3;
    if (GameData.points >= 3000) waveSize = 4;

    for (let i = 0; i < waveSize; i++) {
      const isBoss = (GameData.points >= 1500 && Phaser.Math.Between(0, 100) < 6);

      if (isBoss) {
        if (this.time.now - this.lastBossTime < 60000) return;
        this.lastBossTime = this.time.now;

        const boss = new Zombie(this, xSpawn, 500, "zombie_boss");
        boss.play("zombie_boss_walk");
        boss.setScale(1.2);
        boss.type   = "boss";
        boss.hp     = 50;
        boss.maxHp  = 100;
        boss.setSize(100, 150).setOffset(12, 10);

        boss.healthBar = this.add.graphics();
        boss.updateHealthBar = () => {
          boss.healthBar.clear();
          boss.healthBar.fillStyle(0x000000, 0.6);
          boss.healthBar.fillRect(boss.x - 60, boss.y - 120, 120, 12);
          boss.healthBar.fillStyle(0xff3b3b, 1);
          boss.healthBar.fillRect(boss.x - 58, boss.y - 118, 116 * (boss.hp / boss.maxHp), 8);
        };
        boss.updateHealthBar();

        this.zombies.add(boss);
        this.cameras.main.shake(500, 0.004);
        continue;
      }

      const yOffset = Phaser.Math.Between(-5, 5);
      const xOffset = i * Phaser.Math.Between(40, 70);
      const zombie = new Zombie(this, xSpawn + xOffset, baseY + yOffset, "normal");
      zombie.activeForScoring = false;
      this.zombies.add(zombie);
    }
  }

  _killZombie(zombie) {
    zombie.disableBody(true, true);
    if (zombie.type === "boss" && zombie.healthBar) zombie.healthBar.destroy();

    if (zombie.activeForScoring && zombie.type !== "boss") {
      GameData.points += 10;
      GameData.coins  += 2;
      this.killCount += 1;
      this.events.emit("pointsChanged", GameData.points);

      const coin = this.add.image(zombie.x, zombie.y, "coin").setScale(1.0);
      this.tweens.add({
        targets: coin, y: coin.y + 60, alpha: 0, duration: 1500,
        onComplete: () => coin.destroy()
      });
      this.events.emit("coinCollected", GameData.coins);
    }
  }

  _rewardBossHit(zombie, dmg) {
    const totalPts = 200, totalCoi = 20;
    const addPts = Math.max(0, Math.round((totalPts * dmg) / zombie.maxHp));
    GameData.points += addPts;
    this.events.emit("pointsChanged", GameData.points);

    zombie._coinFloat = (zombie._coinFloat || 0) + (totalCoi * dmg / zombie.maxHp);
    const addCoinsInt = Math.floor(zombie._coinFloat);
    if (addCoinsInt > 0) {
      GameData.coins += addCoinsInt;
      zombie._coinFloat -= addCoinsInt;
      this.events.emit("coinCollected", GameData.coins);
    }
  }

  _applyUpgradesToPlayer() {
    this.player.maxHealth = GameData.maxHealth || 3;
    this.player.health    = this.player.maxHealth;

    this.player.weapon = this.activeWeapon;
    if (this.activeWeapon === "arrow")   this.player.setTexture("chog_arrow_idle");
    if (this.activeWeapon === "bazooka") this.player.setTexture("chog_bazooka_shoot");
    if (this.activeWeapon === "ak")      this.player.setTexture("chog_ak");

    const akSet = GameData.upgrades.ak || [];
    let akClip = 35;
    if (akSet.includes("ak47_bullets_100")) akClip = 100;
    else if (akSet.includes("ak47_bullets_75")) akClip = 75;
    else if (akSet.includes("ak47_bullets_50")) akClip = 50;
    else if (akSet.includes("ak47_bullets_35")) akClip = 35;

    let akLevel =
      akSet.includes("ak47_bullets_100") ? 4 :
      akSet.includes("ak47_bullets_75")  ? 3 :
      akSet.includes("ak47_bullets_50")  ? 2 :
      akSet.includes("ak47_bullets_35")  ? 1 : 0;

    this.player.clipSize      = akClip;
    this.player.bulletsInClip = akClip;
    this.player.fireRate      = Math.max(90, 140 - akLevel * 10);

    const arSet = GameData.upgrades.arrow || [];
    let arrowAmmo = 0;
    if (GameData.ownedWeapons.arrow) {
      if (arSet.includes("arrow_100")) arrowAmmo = 100;
      else if (arSet.includes("arrow_75")) arrowAmmo = 75;
      else if (arSet.includes("arrow_50")) arrowAmmo = 50;
      else if (arSet.includes("arrow_25")) arrowAmmo = 25;
      else arrowAmmo = 20;
    }
    let arLevel =
      arSet.includes("arrow_100") ? 4 :
      arSet.includes("arrow_75")  ? 3 :
      arSet.includes("arrow_50")  ? 2 :
      arSet.includes("arrow_25")  ? 1 : 0;

    this.player.arrowAmmo     = arrowAmmo;
    this.player.arrowReloadMs = Math.max(550, 900 - arLevel * 100);

    const rkSet = GameData.upgrades.bazooka || [];
    let rocketAmmo = 0;
    if (GameData.ownedWeapons.bazooka) {
      if (rkSet.includes("rocket_100")) rocketAmmo = 5;
      else if (rkSet.includes("rocket_75")) rocketAmmo = 4;
      else if (rkSet.includes("rocket_50")) rocketAmmo = 3;
      else if (rkSet.includes("rocket_25")) rocketAmmo = 2;
      else rocketAmmo = 1;
    }
    let rkLevel =
      rkSet.includes("rocket_100") ? 4 :
      rkSet.includes("rocket_75")  ? 3 :
      rkSet.includes("rocket_50")  ? 2 :
      rkSet.includes("rocket_25")  ? 1 : 0;

    this.player.rocketAmmo     = rocketAmmo;
    this.player.rocketReloadMs = Math.max(900, 1500 - rkLevel * 150);

    if (this.activeWeapon === "ak") {
      this.events.emit("bulletChanged", this.player.bulletsInClip || 0, this.player.clipSize || 0, "ak");
    } else if (this.activeWeapon === "arrow") {
      this.events.emit("bulletChanged", this.player.arrowAmmo || 0, null, "arrow");
    } else if (this.activeWeapon === "bazooka") {
      this.events.emit("bulletChanged", this.player.rocketAmmo || 0, null, "bazooka");
    }

    this.events.emit("healthChanged", this.player.health);
    this.events.emit("maxHealthChanged", this.player.maxHealth);
  }

  update() {
    if (!this.isPaused) {
      this.background.tilePositionX += this.bgSpeed;
      this.player.move(this.cursors, this.keys);

      this.zombies.children.iterate(zombie => {
        if (!zombie) return;
        zombie.update?.();
        if (!zombie.activeForScoring && zombie.x < this.sys.game.config.width - 100) {
          zombie.activeForScoring = true;
        }
      });

      this.player.projectiles.children.iterate(p => {
        if (p?.active && p.x > this.sys.game.config.width + 40) {
          p.disableBody(true, true);
        }
      });

      this.zombies.children.iterate(z => {
        if (z?.active && z.type === "boss" && z.updateHealthBar) z.updateHealthBar();
      });
    }
  }
}
