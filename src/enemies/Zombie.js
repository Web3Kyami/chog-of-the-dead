import Phaser from "phaser";

export default class Zombie extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = "normal") {
    const key = type === "boss" ? "zombie_boss" : "zombie";
    super(scene, x, y, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type;

    if (type === "boss") {
      this.setScale(1.2);
      this.y += 5; // push boss down to ground
      this.speed = Phaser.Math.Between(70, 90);
      this.hp = 20;
    } else {
      this.setScale(1.2);
      this.speed = Phaser.Math.Between(50, 70);
      this.hp = 2;
    }

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