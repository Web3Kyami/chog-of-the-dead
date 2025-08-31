import Phaser from "phaser";
import GameData from "../GameData.js";
import { loginWithMonadID } from "../auth/privy.js"; // ✅ only this

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
    this.bgm = null;
    this.soundOn = true;
  }

  preload() {
    // Main menu art
    this.load.image("bg_mainmenu", "assets/ui/mainmenu/bg_mainmenu.png");
    this.load.image("title", "assets/ui/mainmenu/title.png");
    this.load.image("btn_play", "assets/ui/mainmenu/btn_play.png");
    this.load.image("btn_leaderboard", "assets/ui/mainmenu/btn_leaderboard.png");
    this.load.image("btn_login", "assets/ui/mainmenu/btn_login.png");
    this.load.image("btn_howto", "assets/ui/mainmenu/btn_howto.png");
    this.load.image("btn_sound_on", "assets/ui/mainmenu/btn_sound_on.png");
    this.load.image("btn_sound_off", "assets/ui/mainmenu/btn_sound_off.png");
    this.load.image("chog_character", "assets/ui/mainmenu/chog_character.png");
    this.load.image("zombie_character", "assets/ui/mainmenu/zombie_character.png");

    // How-to popup art
    this.load.image("howto_bg", "assets/ui/howto/howto_bg.png");
    this.load.image("btn_close", "assets/ui/howto/btn_close.png");

    // Audio
    this.load.audio("bgm_menu", "assets/sounds/bgm_menu.mp3");
  }

  create() {
    this.sound.context.resume();

    // Background + title
    this.add.image(640, 360, "bg_mainmenu");
    this.add.image(640, 230, "title").setOrigin(0.5);

    // BGM
    this.bgm = this.sound.add("bgm_menu", { loop: true, volume: 0.5 });
    this.bgm.play();

    // High score label
    this.highScoreText = this.add.text(
      640,
      60,
      "High Score: " + (GameData.highScore || 0),
      { fontSize: "28px", fontFamily: "Montserrat", color: "#000000" }
    ).setOrigin(0.5);

    // Characters
    this.add.image(280, 520, "chog_character").setOrigin(0.5);
    this.add.image(1060, 520, "zombie_character").setOrigin(0.5);

    // ▶️ Play button
    this.createButton(640, 440, "btn_play", () => {
      if (this.bgm) this.bgm.stop();
      this.scene.start("LevelOneScene");
    }, true);

    // 🔑 Login button
    // Inside create()
this.createButton(640, 520, "btn_login", async () => {
  if (!window.privyLogin) {
    console.error("Privy not ready");
    return;
  }

  await window.privyLogin();
  const user = window.privyUser?.();

  if (user) {
    // ✅ Save username (or wallet address if no username)
    const username = user.username || user.wallet?.address?.slice(0, 8);
    this.add.text(640, 620, `Welcome, ${username}`, {
      fontSize: "22px", color: "#000",
    }).setOrigin(0.5);

    // ✅ Store in GameData
    GameData.user = { 
      wallet: user.wallet?.address, 
      username, 
      loggedIn: true 
    };

    // ✅ Save immediately so it persists
    if (typeof saveGameData === "function") saveGameData();

    // ✅ Submit score onchain (starts with 0 if new)
    if (GameData.points > 0) {
      try {
        await submitScore(GameData.user.wallet, GameData.points);
      } catch (err) {
        console.error("Onchain score submission failed:", err);
      }
    }
  }
});

    // 📜 Leaderboard button
    this.createButton(1150, 60, "btn_leaderboard", () => {
      if (this.bgm) this.bgm.stop();
      this.scene.start("LeaderboardScene");
    });

    // ❓ How-to button
    this.createButton(980, 100, "btn_howto", () => this.showHowToPopup());

    // 🔈 Sound toggle
    this.soundOn = !this.sound.mute;
    this.soundBtn = this.add.image(
      100,
      60,
      this.soundOn ? "btn_sound_on" : "btn_sound_off"
    ).setInteractive();
    this.soundBtn.on("pointerdown", () => {
      this.soundOn = !this.soundOn;
      this.soundBtn.setTexture(this.soundOn ? "btn_sound_on" : "btn_sound_off");
      this.sound.mute = !this.soundOn;
    });
  }

  // Reusable button helper
  createButton(x, y, key, callback, pulse = false) {
    const btn = this.add.image(x, y, key).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on("pointerdown", () => {
      this.tweens.add({
        targets: btn,
        scale: 0.9,
        duration: 100,
        yoyo: true,
        onComplete: () => callback && callback()
      });
    });

    if (pulse) {
      this.tweens.add({
        targets: btn,
        scale: { from: 1, to: 1.1 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    }
    return btn;
  }

  // Popup for How To Play
  showHowToPopup() {
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
    const popup = this.add.image(640, 360, "howto_bg").setOrigin(0.5);
    const text = this.add.text(640, 360,
      "HOW TO PLAY:\n- Move with arrows/WASD\n- Shoot with SPACE / click\n- Switch weapon: ↑\n- Survive!",
      { fontSize: "24px", color: "#000000", align: "center", wordWrap: { width: 600 } }
    ).setOrigin(0.5);

    const closeBtn = this.add.image(970, 200, "btn_close").setInteractive();
    closeBtn.on("pointerdown", () => {
      overlay.destroy();
      popup.destroy();
      text.destroy();
      closeBtn.destroy();
    });
  }

  update() {
    this.highScoreText.setText("High Score: " + (GameData.highScore || 0));
  }
}
