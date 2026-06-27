import Phaser from "phaser";

import { adStart, onCtaPressed, onAudioVolumeChange } from "../networkPlugin";

const OVERLAY_COLOR = 0x1b1b1b;
const OVERLAY_ALPHA = 0.72;
const LOGO_WIDTH_RATIO = 0.58;
const DOWNLOAD_WIDTH_RATIO = 0.44;
const STORE_BADGE_WIDTH_RATIO = 0.31;
const STORE_BADGE_GAP_RATIO = 0.025;

export class EndScene extends Phaser.Scene {
  constructor() {
    super("EndScene");
  }

  init() {
    console.log(
      "%cSCENE::EndScene",
      "color: #fff; background: rgb(255, 106, 0);",
    );
  }

  /**
   * This is required specially for Mintegral & MRAID networks.
   * Do not remove if you are using those networks.
   */
  adNetworkSetup() {
    adStart();

    // This is required for MRAID networks, you can remove if you are not using MRAID
    onAudioVolumeChange(this.scene);
  }

  create() {
    this.adNetworkSetup();

    this.endcardSfx = this.sound.add("endcard", { volume: 0.3 });
    this.playEndcardSound();

    this.viewportLayoutTimeout = null;
    this.downloadPulseTween = null;
    this.overlay = this.add
      .rectangle(0, 0, 1, 1, OVERLAY_COLOR, OVERLAY_ALPHA)
      .setOrigin(0.5);
    this.inputBlocker = this.add.zone(0, 0, 1, 1).setOrigin(0.5);
    this.logo = this.add.image(0, 0, "logo").setOrigin(0.5);
    this.downloadNow = this.add
      .image(0, 0, "downloadNow")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.appStore = this.add
      .image(0, 0, "appStore3")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.googlePlay = this.add
      .image(0, 0, "gplay2")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.onScenePointerDown = () => onCtaPressed();
    this.input.on("pointerdown", this.onScenePointerDown);

    this.applyResponsiveLayout(this.scale.gameSize);
    this.playSceneFadeIn();

    this.onViewportLayoutChange = () => {
      this.applyResponsiveLayout(this.scale.gameSize);
      if (this.viewportLayoutTimeout) {
        window.clearTimeout(this.viewportLayoutTimeout);
      }
      this.viewportLayoutTimeout = window.setTimeout(() => {
        this.applyResponsiveLayout(this.scale.gameSize);
        this.viewportLayoutTimeout = null;
      }, 120);
    };

    window.addEventListener("resize", this.onViewportLayoutChange);
    window.addEventListener("orientationchange", this.onViewportLayoutChange);
    if (window.visualViewport) {
      window.visualViewport.addEventListener(
        "resize",
        this.onViewportLayoutChange,
      );
    }

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
      if (this.onViewportLayoutChange) {
        window.removeEventListener("resize", this.onViewportLayoutChange);
        window.removeEventListener(
          "orientationchange",
          this.onViewportLayoutChange,
        );
        if (window.visualViewport) {
          window.visualViewport.removeEventListener(
            "resize",
            this.onViewportLayoutChange,
          );
        }
      }
      if (this.viewportLayoutTimeout) {
        window.clearTimeout(this.viewportLayoutTimeout);
        this.viewportLayoutTimeout = null;
      }
      if (this.onScenePointerDown) {
        this.input.off("pointerdown", this.onScenePointerDown);
      }
      if (this.downloadPulseTween) {
        this.downloadPulseTween.stop();
        this.downloadPulseTween.remove();
        this.downloadPulseTween = null;
      }
    });
  }

  playSceneFadeIn(duration = 420) {
    const camera = this.cameras?.main;
    if (!camera) {
      return;
    }

    if (camera.fadeEffect?.isRunning) {
      camera.fadeEffect.reset();
    }
    camera.fadeIn(duration, 0, 0, 0);
  }

  playEndcardSound() {
    if (!this.sound || !this.sound.get("endcard")) {
      return;
    }

    this.sound.stopByKey("bgm");
    this.sound.play("endcard", { volume: 0.3 });
  }

  playDownloadPulse() {
    if (!this.downloadNow) {
      return;
    }

    if (this.downloadPulseTween) {
      this.downloadPulseTween.stop();
      this.downloadPulseTween.remove();
    }

    this.downloadPulseTween = this.tweens.add({
      targets: this.downloadNow,
      scale: {
        from: this.downloadBaseScale || this.downloadNow.scale,
        to: (this.downloadBaseScale || this.downloadNow.scale) * 1.04,
      },
      duration: 760,
      ease: "Sine.easeInOut",
      repeat: -1,
      yoyo: true,
    });
  }

  applyResponsiveLayout(gameSize) {
    const width = Math.max(gameSize?.width || this.scale.width, 1);
    const height = Math.max(gameSize?.height || this.scale.height, 1);
    const viewportWidth = Math.max(
      Math.round(window.visualViewport?.width || window.innerWidth || width),
      1,
    );
    const viewportHeight = Math.max(
      Math.round(window.visualViewport?.height || window.innerHeight || height),
      1,
    );
    const isLandscape = viewportWidth > viewportHeight;
    const centerX = width * 0.5;
    const safeWidth = isLandscape ? width * 0.58 : width;
    const contentX = isLandscape ? width * 0.5 : centerX;

    this.overlay.setPosition(centerX, height * 0.5).setSize(width, height);
    this.inputBlocker
      .setPosition(centerX, height * 0.5)
      .setSize(width, height)
      .setInteractive(
        new Phaser.Geom.Rectangle(0, 0, width, height),
        Phaser.Geom.Rectangle.Contains,
      );

    this.fitImageWidth(
      this.logo,
      Phaser.Math.Clamp(safeWidth * LOGO_WIDTH_RATIO, 280, 820),
    );
    this.logo.setPosition(contentX, isLandscape ? height * 0.28 : height * 0.3);

    this.fitImageWidth(
      this.downloadNow,
      Phaser.Math.Clamp(safeWidth * DOWNLOAD_WIDTH_RATIO, 220, 560),
    );
    this.downloadBaseScale = this.downloadNow.scale;
    this.downloadNow.setPosition(
      contentX,
      isLandscape ? height * 0.5 : height * 0.52,
    );
    this.playDownloadPulse();

    const badgeWidth = Phaser.Math.Clamp(
      safeWidth * STORE_BADGE_WIDTH_RATIO,
      150,
      390,
    );
    const badgeGap = safeWidth * STORE_BADGE_GAP_RATIO;
    const badgeY = isLandscape ? height * 0.66 : height * 0.66;

    this.fitImageWidth(this.appStore, badgeWidth);
    this.fitImageWidth(this.googlePlay, badgeWidth);
    this.appStore.setPosition(contentX - badgeWidth * 0.5 - badgeGap, badgeY);
    this.googlePlay.setPosition(contentX + badgeWidth * 0.5 + badgeGap, badgeY);
  }

  fitImageWidth(image, targetWidth) {
    if (!image) {
      return;
    }

    const sourceWidth = Math.max(image.width || image.displayWidth || 1, 1);
    image.setScale(Math.max(targetWidth / sourceWidth, 0.01));
  }

  handleResize(gameSize) {
    const width = Math.max(gameSize?.width || this.scale.width, 1);
    const height = Math.max(gameSize?.height || this.scale.height, 1);
    this.cameras.main.setSize(width, height);
    this.applyResponsiveLayout({ width, height });
  }
}
