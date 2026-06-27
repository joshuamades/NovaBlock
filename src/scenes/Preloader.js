import Phaser from "phaser";

import { Base64Manager } from "../utils/Base64Manager.js";
import { LoadBase64Audio } from "../utils/LoadBase64Audio.js";
import { adReady } from "../networkPlugin";

// Images
import { appStore3PNG } from '../../media/images_App Store 3.png.js';
import { BGPNG } from '../../media/images_BG.png.js';
import { BlackFadedPNG } from '../../media/images_Black_Faded.png.js';
import { logoPNG } from '../../media/images_logo.png.js';
import { ctaPNG } from '../../media/images_cta.png.js';
import { downloadNow1PNG } from '../../media/images_downloadNow 1.png.js';
import { downloadNowWEBP } from '../../media/images_downloadNow.webp.js';
import { bgLandscapePNG } from '../../media/images_endcard_bg-landscape.png.js';
import { gemsCollectionPNG } from '../../media/images_endcard_gems-collection.png.js';
import { slide1PNG } from '../../media/images_endcard_slide1.png.js';
import { slide2PNG } from '../../media/images_endcard_slide2.png.js';
import { slide3PNG } from '../../media/images_endcard_slide3.png.js';
import { slide4PNG } from '../../media/images_endcard_slide4.png.js';
import { topTextEndcardPNG } from '../../media/images_endcard_top-text-endcard.png.js';
import { gplay2PNG } from '../../media/images_Gplay 2.png.js';
import { greenReplacementPNG } from '../../media/images_Green Replacement.png.js';
import { greyReplacementPNG } from '../../media/images_Grey Replacement.png.js';
import { handPointerWEBP } from '../../media/images_hand-pointer.webp.js';
import { khakiReplacementPNG } from '../../media/images_Khaki Replacement.png.js';
import { orangeReplacementPNG } from '../../media/images_Orange Replacement.png.js';
import { pinkReplacementPNG } from '../../media/images_Pink Replacement.png.js';
import { redReplacementPNG } from '../../media/images_Red Replacement.png.js';
import { violetReplacementPNG } from '../../media/images_Violet Replacement.png.js';
import { yellowReplacementPNG } from '../../media/images_Yellow Replacement.png.js';
import { containerPNG } from '../../media/images_container.png.js';
// SFX
import { bgmMP3 } from '../../media/audio_bgm.mp3.js';
import { endcardMP3 } from '../../media/audio_endcard.mp3.js';
import { switchCombo1MP3 } from '../../media/audio_switch-combo-1.mp3.js';
import { switchCombo2MP3 } from '../../media/audio_switch-combo-2.mp3.js';
import { switchCombo3MP3 } from '../../media/audio_switch-combo-3.mp3.js';
import { switchMP3 } from '../../media/audio_switch.mp3.js';

export class Preloader extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  init() {
    console.log("%cSCENE::Preloader", "color: #fff; background: #f00;");
  }

  preload() {
    //  Invoke the Base64Manager - pass in the current scene reference and a callback to invoke when it's done
    Base64Manager(this, () => this.base64LoaderComplete());

    //  Images load normally as base64 encoded strings
    this.load.image("appStore3", appStore3PNG);
    this.load.image("BG", BGPNG);
    this.load.image("blackFaded", BlackFadedPNG);
    this.load.image("logo", logoPNG);
    this.load.image("cta", ctaPNG);
    this.load.image("downloadNow1", downloadNow1PNG);
    this.load.image("downloadNow", downloadNowWEBP);
    this.load.image("bgLandscape", bgLandscapePNG);
    this.load.image("gemsCollection", gemsCollectionPNG);
    this.load.image("slide1", slide1PNG);
    this.load.image("slide2", slide2PNG);
    this.load.image("slide3", slide3PNG);
    this.load.image("slide4", slide4PNG);
    this.load.image("topTextEndcard", topTextEndcardPNG);
    this.load.image("gplay2", gplay2PNG);
    this.load.image("greenReplacement", greenReplacementPNG);
    this.load.image("greyReplacement", greyReplacementPNG);
    this.load.image("handPointer", handPointerWEBP);
    this.load.image("khakiReplacement", khakiReplacementPNG);
    this.load.image("orangeReplacement", orangeReplacementPNG);
    this.load.image("pinkReplacement", pinkReplacementPNG);
    this.load.image("redReplacement", redReplacementPNG);
    this.load.image("violetReplacement", violetReplacementPNG);
    this.load.image("yellowReplacement", yellowReplacementPNG);
    this.load.image("container", containerPNG);
    // Sfx
    LoadBase64Audio(this, [
      { key: "switch", data: switchMP3 },
      { key: "bgm", data: bgmMP3 },
      { key: "endcard", data: endcardMP3 },
      { key: "switchCombo1", data: switchCombo1MP3 },
      { key: "switchCombo2", data: switchCombo2MP3 },
      { key: "switchCombo3", data: switchCombo3MP3 },
    ]);
  }

  create() {
    //  This may run before the Loader has completed, so don't use in-flight assets here
  }

  base64LoaderComplete() {
    adReady();

    this.scene.start("Game");
  }
}
