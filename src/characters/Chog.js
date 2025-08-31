import Phaser from "phaser";
import GameData from "../GameData.js";

export default class Chog extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y) {
    super(scene, x, y, "chog_ak"); 
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setScale(0.85);

    // Core stats
    this.health = GameData.maxHealth || 3;
    this.maxHealth = GameData.maxHealth || 3;
    this.regenTimer = 0;

    // Weapons / Ammo
    this.weapon = GameData.activeWeapon || "ak"; 
    this.clipSize = 100;
    this.bulletsInClip = this.clipSize;
    this.arrowAmmo = 20;
    this.rocketAmmo = 5;

    this.fireRate = 120;
    this.isReloading = false;
    this.lastFiredAt = 0;

    this.arrowReloadMs = 900;
    this.rocketReloadMs = 1500;

    // Reload timers (for passive reload of arrow/bazooka)
    this.lastArrowReload = 0;
    this.lastRocketReload = 0;

    // Projectiles pool
    this.projectiles = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 60,
      runChildUpdate: false,
    });

    scene.physics.world.on("worldbounds", (body) => {
      const go = body.gameObject;
      if (!go) return;
      if (["bullet", "arrow_proj", "rocket_proj"].includes(go.texture.key)) {
        go.disableBody(true, true);
      }
    });

    // 🔹 Animations
    if (!scene.anims.exists("chog_shoot")) {
      scene.anims.create({
        key: "chog_shoot",
        frames: scene.anims.generateFrameNumbers("chog_ak", { start: 6, end: 12 }),
        frameRate: 22,
        repeat: 0,
      });
    }
    if (!scene.anims.exists("chog_reload")) {
      scene.anims.create({
        key: "chog_reload",
        frames: scene.anims.generateFrameNumbers("chog_ak", { start: 13, end: 20 }),
        frameRate: 16,
        repeat: 0,
      });
    }
    if (!scene.anims.exists("arrow_shoot")) {
      scene.anims.create({
        key: "arrow_shoot",
        frames: scene.anims.generateFrameNumbers("chog_arrow_shoot", { start: 0, end: 4 }),
        frameRate: 12,
        repeat: 0,
      });
    }
    if (!scene.anims.exists("bazooka_shoot")) {
      scene.anims.create({
        key: "bazooka_shoot",
        frames: scene.anims.generateFrameNumbers("chog_bazooka_shoot", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: 0,
      });
    }

    // ✅ Emit initial ammo info to UI after small delay
    scene.time.delayedCall(50, () => {
      if (this.weapon === "ak") scene.events.emit("bulletChanged", this.bulletsInClip, this.clipSize, "ak");
      if (this.weapon === "arrow") scene.events.emit("bulletChanged", this.arrowAmmo, null, "arrow");
      if (this.weapon === "bazooka") scene.events.emit("bulletChanged", this.rocketAmmo, null, "bazooka");
    });
  }

  // Movement
  move(cursors, keys) {
    const speed = 200;
    this.setVelocityX(0);

    if (cursors.left.isDown || keys.A.isDown) {
      this.setVelocityX(-speed);
    } else if (cursors.right.isDown || keys.D.isDown) {
      this.setVelocityX(speed);
    }

    // Passive regen
    if (this.health < this.maxHealth) {
      this.regenTimer++;
      if (this.regenTimer > 200) {
        this.health = Math.min(this.maxHealth, this.health + 1);
        this.scene.events.emit("healthChanged", this.health);
        this.regenTimer = 0;
      }
    }

    // ✅ Background reload for arrow/bazooka
    const now = this.scene.time.now;

    if (GameData.ownedWeapons.arrow && this.arrowAmmo < 100 && now - this.lastArrowReload > this.arrowReloadMs) {
      this.arrowAmmo++;
      this.lastArrowReload = now;
      if (this.weapon === "arrow") {
        this.scene.events.emit("bulletChanged", this.arrowAmmo, null, "arrow");
      }
    }

    if (GameData.ownedWeapons.bazooka && this.rocketAmmo < 5 && now - this.lastRocketReload > this.rocketReloadMs) {
      this.rocketAmmo++;
      this.lastRocketReload = now;
      if (this.weapon === "bazooka") {
        this.scene.events.emit("bulletChanged", this.rocketAmmo, null, "bazooka");
      }
    }
  }

  // Projectile spawner
  getProjectile(key, x, y) {
    let proj = this.projectiles.get(x, y);
    if (!proj) proj = this.projectiles.create(x, y, key);
    else proj.setTexture(key);

    proj.enableBody(true, x, y, true, true);
    proj.setActive(true);
    proj.setVisible(true);
    proj.body.setAllowGravity(false);
    proj.setVelocityX(650);
    return proj;
  }

  // Shoot
shoot(now) {
  if (this.isReloading) return;
  if (now < this.lastFiredAt + this.fireRate) return;

  const muzzleX = this.x + 48;
  const muzzleY = this.y + 5;
  let proj;

  if (this.weapon === "ak") {
    if (this.bulletsInClip <= 0) {
      this.isReloading = true;
      this.scene.events.emit("reloadStart");
      this.play("chog_reload", true);
      this.scene.time.delayedCall(900, () => {
        this.bulletsInClip = this.clipSize;
        this.isReloading = false;
        this.scene.events.emit("reloadEnd");
        this.scene.events.emit("bulletChanged", this.bulletsInClip, this.clipSize, "ak");
      });
      return;
    }

    proj = this.getProjectile("bullet", muzzleX, muzzleY);
    if (!proj) return;
    proj.projType = "ak";
    this.bulletsInClip--;
    this.scene.events.emit("bulletChanged", this.bulletsInClip, this.clipSize, "ak");

    this.play("chog_shoot", true);
    this.scene.sound.play("shoot", { volume: 0.3 });  // 🔊 play gunshot
    this.once("animationcomplete-chog_shoot", () => this.setFrame(0));
  }

  else if (this.weapon === "arrow" && this.arrowAmmo > 0) {
    proj = this.getProjectile("arrow_proj", muzzleX, muzzleY);
    if (!proj) return;
    proj.projType = "arrow";
    proj.pierceCount = 0;
    this.arrowAmmo--;
    this.scene.events.emit("bulletChanged", this.arrowAmmo, null, "arrow");

    this.play("arrow_shoot", true);
    this.scene.sound.play("shoot", { volume: 0.3 });  // 🔊 arrow release
    this.once("animationcomplete-arrow_shoot", () => this.setFrame(0));
  }

  else if (this.weapon === "bazooka" && this.rocketAmmo > 0) {
    proj = this.getProjectile("rocket_proj", muzzleX, muzzleY);
    if (!proj) return;
    proj.projType = "rocket";
    proj.onHit = () => {
      const boom = this.scene.add.image(proj.x, proj.y, "explosion").setScale(0.5);
      this.scene.sound.play("explosion_sfx", { volume: 0.6 }); // 🔊 explosion sound
      this.scene.tweens.add({
        targets: boom,
        scale: 2.5,
        alpha: 0,
        duration: 400,
        onComplete: () => boom.destroy()
      });
    };
    this.rocketAmmo--;
    this.scene.events.emit("bulletChanged", this.rocketAmmo, null, "bazooka");

    this.play("bazooka_shoot", true);
    this.scene.sound.play("shoot", { volume: 0.4 }); // 🔊 rocket launch
    this.once("animationcomplete-bazooka_shoot", () => this.setFrame(0));
  }

  this.lastFiredAt = now;

  }

  // ✅ Proper weapon cycle
  switchWeapon() {
    if (this.weapon === "ak") {
      if (GameData.ownedWeapons.arrow) {
        this.weapon = "arrow";
        this.setTexture("chog_arrow_idle");
      } else if (GameData.ownedWeapons.bazooka) {
        this.weapon = "bazooka";
        this.setTexture("chog_bazooka_shoot");
      }
    } else if (this.weapon === "arrow") {
      if (GameData.ownedWeapons.bazooka) {
        this.weapon = "bazooka";
        this.setTexture("chog_bazooka_shoot");
      } else {
        this.weapon = "ak";
        this.setTexture("chog_ak");
      }
    } else if (this.weapon === "bazooka") {
      this.weapon = "ak";
      this.setTexture("chog_ak");
    }

    // sync
    this.scene.activeWeapon = this.weapon;
    GameData.activeWeapon = this.weapon;

    // update HUD
    if (this.weapon === "ak") this.scene.events.emit("bulletChanged", this.bulletsInClip, this.clipSize, "ak");
    if (this.weapon === "arrow") this.scene.events.emit("bulletChanged", this.arrowAmmo, null, "arrow");
    if (this.weapon === "bazooka") this.scene.events.emit("bulletChanged", this.rocketAmmo, null, "bazooka");
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    this.scene.events.emit("healthChanged", this.health);
    return this.health <= 0;
  }
}