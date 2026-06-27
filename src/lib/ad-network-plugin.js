var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/networks/Google.js
var googleAdNetwork = {
  /**
   * Handles the event when the Call To Action (CTA) is pressed.
   * If a global `install` function is defined on the window object, it will be called.
   */
  ctaPressed: () => {
    if (!window.ExitApi) {
      console.warn("ExitApi not defined");
      console.warn(
        "ExitApi.exit() called in development environment! Test it on: https://h5validator.appspot.com/adwords/asset"
      );
      return;
    }
    window.ExitApi.exit();
  }
};

// src/networks/Meta.js
var metaAdNetwork = {
  /**
   * Handles the event when the Call To Action (CTA) is pressed.
   * If the `FbPlayableAd` object is not defined, it logs a warning message to the console.
   * If the `FbPlayableAd` object is defined, it calls the `onCTAClick` method on the `FbPlayableAd` object.
   */
  ctaPressed: () => {
    if (typeof FbPlayableAd === "undefined") {
      console.warn(
        "FBPlayableAd.onCTAClick called in development environment! Test it on: https://adsmanager.facebook.com/adsmanager/"
      );
    } else {
      FbPlayableAd.onCTAClick();
    }
  }
};

// src/networks/Tiktok.js
var tiktokAdNetwork = {
  /**
   * Handles the event when the Call To Action (CTA) is pressed.
   * If the `playableSDK` object is not defined on the window, it logs a warning message to the console.
   * If the `playableSDK` object is defined, it calls the `openAppStore` method on the `playableSDK` object.
   */
  ctaPressed: () => {
    if (typeof window.playableSDK === "undefined") {
      console.warn("Tiktok click event called in development environment!");
    } else {
      window.playableSDK.openAppStore();
    }
  },
  /**
   * Initializes the TikTok Ad SDK.
   * If the `playableSDK` object is not defined on the window, it logs a warning message to the console.
   * If the `playableSDK` object is defined, it checks if the page is viewable.
   */
  initAdSDK: () => {
    if (typeof window.playableSDK === "undefined") {
      console.warn("Tiktok ad SDK not initialized in development environment!");
    } else {
      window.playableSDK.isViewable().then((viewable) => {
        if (viewable) {
        } else {
        }
      });
    }
  }
};

// src/networks/Vungle.js
var ctaPressed = /* @__PURE__ */ __name(() => {
  parent.postMessage("download", "*");
}, "ctaPressed");
var firstInteraction = /* @__PURE__ */ __name(() => {
  parent.postMessage("interacted", "*");
}, "firstInteraction");
var gameComplete = /* @__PURE__ */ __name(() => {
  parent.postMessage("complete", "*");
}, "gameComplete");
var adPause = /* @__PURE__ */ __name((callback) => {
  window.addEventListener("ad-event-pause", () => {
    callback();
  });
}, "adPause");
var adResume = /* @__PURE__ */ __name((callback) => {
  window.addEventListener("ad-event-resume", () => {
    callback();
  });
}, "adResume");
var adInit = /* @__PURE__ */ __name((callback) => {
  window.addEventListener("ad-event-init", () => {
    callback();
  });
}, "adInit");
var vungleAdNetwork = {
  ctaPressed,
  firstInteraction,
  gameComplete,
  adPause,
  adResume
};

// src/networks/Mintegral.js
var ctaPressed2 = /* @__PURE__ */ __name(() => {
  window.install && window.install();
  console.log("CTA pressed!");
}, "ctaPressed");
var gameReady = /* @__PURE__ */ __name(() => {
  window.gameReady && window.gameReady();
  console.log("Game ready!");
}, "gameReady");
function gameStart() {
  console.log("game start");
}
__name(gameStart, "gameStart");
window.gameStart = gameStart;
var gameRetry = /* @__PURE__ */ __name(() => {
  window.gameRetry && window.gameRetry();
}, "gameRetry");
var gameEnd = /* @__PURE__ */ __name(() => {
  window.gameEnd && window.gameEnd();
}, "gameEnd");
function gameClose(gameClose2) {
  console.log("game closed");
  gameClose2();
}
__name(gameClose, "gameClose");
window.gameClose = gameClose;
var mintegralAdNetwork = {
  gameReady,
  gameStart,
  ctaPressed: ctaPressed2,
  gameRetry,
  gameEnd,
  gameClose
};

// src/networks/MraidHandler.js
var getPlatform = /* @__PURE__ */ __name((googlePlayStore, appleStore) => {
  const userAgent = navigator.userAgent || navigator.vendor;
  let url = appleStore;
  if (/android/i.test(userAgent)) {
    url = googlePlayStore;
  }
  return url;
}, "getPlatform");
var getMraidState = /* @__PURE__ */ __name((initGame) => {
  if (mraid.getState() === "loading") {
    mraid.addEventListener("ready", onSdkReady);
  } else {
    onSdkReady(initGame);
  }
}, "getMraidState");
var onSdkReady = /* @__PURE__ */ __name((initGame) => {
  mraid.addEventListener("viewableChange", viewableChangeHandler);
  if (mraid.isViewable()) {
    showMyAd(initGame());
  }
}, "onSdkReady");
var showMyAd = /* @__PURE__ */ __name((initGame) => {
  initGame();
  return;
}, "showMyAd");
var viewableChangeHandler = /* @__PURE__ */ __name((viewable) => {
  if (viewable) {
    showMyAd();
  } else {
  }
}, "viewableChangeHandler");
var audioVolumeChange = /* @__PURE__ */ __name((handlerCallback) => {
  if (typeof mraid === "undefined") {
    console.warn("Mraid audioVolumeChange called in development environment!");
  } else {
    mraid.addEventListener("audioVolumeChange", (volumePercentage) => {
      handlerCallback(volumePercentage);
    });
  }
}, "audioVolumeChange");
var checkMraid = /* @__PURE__ */ __name((initGame) => {
  if (typeof mraid === "undefined") {
    console.warn("Mraid not found!");
    initGame();
    return;
  } else {
    getMraidState(initGame);
  }
}, "checkMraid");
var initMraid = /* @__PURE__ */ __name((initGame) => {
  checkMraid(initGame);
}, "initMraid");
var ctaPressed3 = /* @__PURE__ */ __name((googlePlayStore, appleStore) => {
  if (typeof mraid === "undefined") {
    console.warn("Mraid called in development environment!");
  } else {
    if (googlePlayStore !== "" && appleStore !== "") {
      const url = getPlatform(googlePlayStore, appleStore);
      mraid.open(url);
    } else {
      console.warn("googlePlayStore and appleStore parameters are empty!");
    }
  }
}, "ctaPressed");
var mraidNetwork = {
  initMraid,
  checkMraid,
  ctaPressed: ctaPressed3,
  audioVolumeChange
};

// src/AdNetwork.js
var init = {
  displayAd: () => console.log("init: ad display")
};
var AdNetworkFactory = {
  /**
   * Creates an ad network object based on the given type.
   * @param {string} type - The type of the ad network. Can be one of the following: 'google', 'meta', 'mintegral', 'tiktok', 'ironsource', 'vungle', 'unityads', 'applovin', 'adcolony', 'kayzen', 'moloco'.
   * @returns {Object} The created ad network object.
   * @throws {Error} Will throw an error if the provided type is not supported.
   */
  createAdNetwork: (type) => {
    switch (type) {
      case "google":
        return { ...init, ...googleAdNetwork };
      case "meta":
        return { ...init, ...metaAdNetwork };
      case "mintegral":
        return { ...init, ...mintegralAdNetwork };
      case "tiktok":
        return { ...init, ...tiktokAdNetwork };
      case "ironsource":
        return { ...init, ...mraidNetwork };
      case "vungle":
        return { ...init, ...vungleAdNetwork };
      case "unityads":
        return { ...init, ...mraidNetwork };
      case "applovin":
        return { ...init, ...mraidNetwork };
      case "adcolony":
        return { ...init, ...mraidNetwork };
      case "kayzen":
        return { ...init, ...mraidNetwork };
      case "moloco":
        return { ...init, ...mraidNetwork };
      default:
        throw new Error("Invalid ad network type");
    }
  }
};
var Mintegral = mintegralAdNetwork;
var Meta = metaAdNetwork;
var Tiktok = tiktokAdNetwork;
var Vungle = vungleAdNetwork;
var Google = googleAdNetwork;
var Mraid = mraidNetwork;
export {
  AdNetworkFactory,
  Google,
  Meta,
  Mintegral,
  Mraid,
  Tiktok,
  Vungle
};
