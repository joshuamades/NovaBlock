import Phaser from "phaser";

import { mraidAdNetworks, networkPlugin } from "./networkPlugin.js";
import { isIpadScreen } from "./utils/isIpadScreen.js";

import { Game } from "./scenes/Game";
import { Preloader } from "./scenes/Preloader";
import { config } from "./config.js";
import { EndScene } from "./scenes/EndScene.js";

const PORTRAIT_LOGICAL_WIDTH = 540;
const LANDSCAPE_LOGICAL_WIDTH = 960;

const gameConfig = {
  type: Phaser.WEBGL,
  parent: "ad-container",
  width: PORTRAIT_LOGICAL_WIDTH,
  height: 960,
  backgroundColor: "#181745",
  transparent: false,
  antialias: false,
  roundPixels: true,
  powerPreference: "high-performance",
  scale: {
    mode: Phaser.Scale.NONE,
  },
  scene: [Preloader, Game, EndScene],
};

function initializePhaserGame() {
  return new Phaser.Game(gameConfig);
}

function bindResponsiveResize(game) {
  const shouldRunDelayedResize = isIpadScreen();
  let isPointerActive = false;
  let pendingResize = false;

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
    if (isPointerActive) {
      pendingResize = true;
      return;
    }

    const { width, height } = getViewportSize();
    const aspect = width / height;
    const isLandscape = width > height;
    const renderWidth = isLandscape
      ? LANDSCAPE_LOGICAL_WIDTH
      : PORTRAIT_LOGICAL_WIDTH;
    const renderHeight = Math.max(Math.round(renderWidth / aspect), 1);
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

    game.scale.resize(renderWidth, renderHeight);
    game.canvas.style.width = `${width}px`;
    game.canvas.style.height = `${height}px`;
  };

  let rafId = null;
  const scheduleResize = () => {
    if (isPointerActive) {
      pendingResize = true;
      return;
    }

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
  const startPointerActivity = () => {
    isPointerActive = true;
  };
  const finishPointerActivity = () => {
    isPointerActive = false;
    if (pendingResize) {
      pendingResize = false;
      scheduleResize();
    }
  };

  window.addEventListener("pointerdown", startPointerActivity, { passive: true });
  window.addEventListener("pointerup", finishPointerActivity, { passive: true });
  window.addEventListener("pointercancel", finishPointerActivity, { passive: true });
  window.addEventListener("blur", finishPointerActivity);
  window.addEventListener("resize", scheduleResize);
  window.addEventListener("orientationchange", scheduleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleResize);
  }
  game.events.once("destroy", () => {
    window.removeEventListener("pointerdown", startPointerActivity);
    window.removeEventListener("pointerup", finishPointerActivity);
    window.removeEventListener("pointercancel", finishPointerActivity);
    window.removeEventListener("blur", finishPointerActivity);
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
