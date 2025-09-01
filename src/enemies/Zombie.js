import Phaser from "phaser";

export default class Zombie extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = "normal") {
    const key = type === "boss" ? "zombie_boss" : "zombie";
    super(scene, x, y, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type;

   // 🚶 Base speed starts slower
if (type === "boss") {
  this.setScale(1.2);
  this.y += 5;
  this.baseSpeed = Phaser.Math.Between(80, 120);  // slower boss base
  this.hp = 50;
} else {
  this.setScale(1.2);
  this.baseSpeed = Phaser.Math.Between(100, 140); // slower normal base
  this.hp = 2;
}

// 🕒 Difficulty grows gently (every 30s adds speed, but capped)
const elapsedMinutes = scene.time.now / 60000;
const difficultyFactor = Math.min(elapsedMinutes / 3, 1); 
// grows from 0 → 1 over 3 minutes

this.speed = this.baseSpeed + (difficultyFactor * 80); 
// +80 max extra, spread across ~3 minutes




    this.play(type === "boss" ? "zombie_boss_walk" : "zombie_run");
  }

  static createAnimations(scene) {
    if (!scene.anims.exists("zombie_run")) {
      scene.anims.create({
        key: "zombie_run",
        frames: scene.anims.generateFrameNumbers("zombie", { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!scene.anims.exists("zombie_boss_walk")) {
      scene.anims.create({
        key: "zombie_boss_walk",
        frames: scene.anims.generateFrameNumbers("zombie_boss", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
  }

  update() {
    this.setVelocityX(-this.speed);
  }
}