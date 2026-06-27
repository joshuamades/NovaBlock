import { AdNetworkFactory, Mintegral, Mraid } from "./lib/ad-network-plugin.js";
import { config } from "./config.js";

// Do not touch here unless you know what you're doing
export const networkPlugin = AdNetworkFactory.createAdNetwork(config.adNetworkType);
export const mraidAdNetworks = new Set(["unityads", "adcolony", "applovin", "kayzen", "ironsource", "moloco"]);

function getFallbackStoreUrl() {
    const googlePlayStoreLink = config.googlePlayStoreLink || "";
    const appleStoreLink = config.appleStoreLink || "";

    if (!googlePlayStoreLink && !appleStoreLink) {
        return "";
    }

    const userAgent = navigator.userAgent || navigator.vendor || "";
    const isAndroid = /android/i.test(userAgent);

    if (isAndroid) {
        return googlePlayStoreLink || appleStoreLink;
    }

    return appleStoreLink || googlePlayStoreLink;
}

function openFallbackStoreUrl() {
    const url = getFallbackStoreUrl();

    if (!url) {
        console.warn("Store links are empty, fallback CTA URL was not opened.");
        return;
    }

    window.open(url, "_blank");
}

function isAdSdkAvailable() {
    switch (config.adNetworkType) {
        case "google":
            return typeof window.ExitApi !== "undefined";
        case "meta":
            return typeof window.FbPlayableAd !== "undefined";
        case "tiktok":
            return typeof window.playableSDK !== "undefined";
        case "mintegral":
            return typeof window.install === "function";
        case "unityads":
        case "adcolony":
        case "applovin":
        case "kayzen":
        case "ironsource":
        case "moloco":
            return typeof window.mraid !== "undefined";
        default:
            return true;
    }
}

export function adStart() {
    if (config.adNetworkType === "mintegral") {
        Mintegral.gameStart();
    }
}

export function adEnd() {
    if (config.adNetworkType === "mintegral") {
        Mintegral.gameEnd();
    }
}

export function adClose() {
    if (config.adNetworkType === "mintegral") {
        Mintegral.gameClose(() => {
            console.log("Game close worked!");
        });
    }
}

export function adRetry() {
    if (config.adNetworkType === "mintegral") {
        Mintegral.gameRetry();
    }
}

export function adReady() {
    if (config.adNetworkType === "mintegral") {
        Mintegral.gameReady();
    }
}

/**
 * This function is used to handle the audio volume change event for MRAID networks.
 * 
 * @param {Phaser.Scene} sceneInstance - The Phaser scene instance.
 */
export function onAudioVolumeChange(sceneInstance) {
    if (mraidAdNetworks.has(config.adNetworkType)) {
        Mraid.audioVolumeChange((volumePercentage) => {
            if (volumePercentage !== null) {
                let newVolume = volumePercentage / 100;

                if (sceneInstance) {
                    sceneInstance.getScenes(true).forEach(scene => {
                        if (scene?.sound) {
                            scene.sound.setVolume(newVolume);
                        }
                    });
                }
            }
        });
    }
}

/**
 * This function is used to handle the CTA (Call To Action) click event.
 * 
 * @returns {void}
 */
export function onCtaPressed() {
    adClose(); // these calls are needed for Mintegral
    adEnd();

    if (!networkPlugin || typeof networkPlugin.ctaPressed !== "function") {
        openFallbackStoreUrl();
        return;
    }

    if (!isAdSdkAvailable()) {
        openFallbackStoreUrl();
        return;
    }

    try {
        if (mraidAdNetworks.has(config.adNetworkType)) {
            networkPlugin.ctaPressed(config.googlePlayStoreLink, config.appleStoreLink);
        } else {
            networkPlugin.ctaPressed();
        }
    } catch (error) {
        console.warn("CTA SDK call failed, using fallback URL.", error);
        openFallbackStoreUrl();
    }
}
