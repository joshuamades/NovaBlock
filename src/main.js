import Phaser from "phaser";

import { mraidAdNetworks, networkPlugin } from "./networkPlugin.js";
import { isIpadScreen } from "./utils/isIpadScreen.js";

import { Game } from "./scenes/Game";
import { Preloader } from "./scenes/Preloader";
import { config } from "./config.js";
import { EndScene } from "./scenes/EndScene.js";

const gameConfig = {
  type: Phaser.AUTO,
  parent: "ad-container",
  width: 1080,
  height: 1920,
  backgroundColor: "transparent",
  transparent: true,
  scale: {
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Preloader, Game, EndScene],
};

function initializePhaserGame() {
  return new Phaser.Game(gameConfig);
}

function bindResponsiveResize(game) {
  const shouldRunDelayedResize = isIpadScreen();

  const getViewportSize = () => {
    if (window.visualViewport) {
      return {
        width: Math.max(Math.round(window.visualViewport.width), 1),
        height: Math.max(Math.round(window.visualViewport.height), 1),
      };
    }
    return {
      width: Math.max(window.innerWidth, 1),
      height: Math.max(window.innerHeight, 1),
    };
  };

  const applyResize = () => {
    // Phaser creates the canvas asynchronously; guard until it's ready
    if (!game.isBooted || !game.canvas) {
      return;
    }
    const { width, height } = getViewportSize();
    const container = document.getElementById("ad-container");
    const app = document.getElementById("app");

    if (container) {
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
    }
    if (app) {
      app.style.width = `${width}px`;
      app.style.height = `${height}px`;
    }

    game.scale.resize(width, height);
    game.scale.refresh();
  };

  let rafId = null;
  const scheduleResize = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      applyResize();
      if (shouldRunDelayedResize) {
        // iPad can report final viewport size slightly later after rotation.
        window.setTimeout(applyResize, 120);
      }
    });
  };

  window.addEventListener("resize", scheduleResize);
  window.addEventListener("orientationchange", scheduleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleResize);
  }
  game.events.once("destroy", () => {
    window.removeEventListener("resize", scheduleResize);
    window.removeEventListener("orientationchange", scheduleResize);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", scheduleResize);
    }
  });

  // Run once the game is booted so scale manager has a canvas to resize
  if (game.isBooted) {
    scheduleResize();
  } else {
    game.events.once(Phaser.Core.Events.READY, scheduleResize);
  }
}

function setupGameInitialization(adNetworkType) {
  const game = initializePhaserGame();
  bindResponsiveResize(game);

  if (mraidAdNetworks.has(adNetworkType)) {
    networkPlugin.initMraid(() => game);
  } else {
    // vungle, google ads, facebook, tiktok
    return game;
  }
}

setupGameInitialization(config.adNetworkType);
