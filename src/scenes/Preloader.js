import Phaser from "phaser";

import { Base64Manager } from "../utils/Base64Manager.js";
import { LoadBase64Audio } from "../utils/LoadBase64Audio.js";
import { adReady } from "../networkPlugin";

// Images
import { appStore3WEBP } from '../../media/images_App Store 3.webp.js';
import { logoWEBP } from '../../media/images_logo.webp.js';
import { downloadnowWEBP } from '../../media/images_downloadNow.webp.js';
import { gplay2WEBP } from '../../media/images_Gplay 2.webp.js';
import { greenReplacementWEBP } from '../../media/images_Green Replacement.webp.js';
import { handPointerWEBP } from '../../media/images_hand-pointer.webp.js';
import { khakiReplacementWEBP } from '../../media/images_Khaki Replacement.webp.js';
import { orangeReplacementWEBP } from '../../media/images_Orange Replacement.webp.js';
import { pinkReplacementWEBP } from '../../media/images_Pink Replacement.webp.js';
import { redReplacementWEBP } from '../../media/images_Red Replacement.webp.js';
import { violetReplacementWEBP } from '../../media/images_Violet Replacement.webp.js';
import { yellowReplacementWEBP } from '../../media/images_Yellow Replacement.webp.js';
import { containerWEBP } from '../../media/images_container.webp.js';
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
    this.load.image("handPointer", handPointerWEBP);
    this.load.image("appStore3", appStore3WEBP);
    this.load.image("logo", logoWEBP);
    this.load.image("downloadNow", downloadnowWEBP);
    this.load.image("gplay2", gplay2WEBP);
    this.load.image("greenReplacement", greenReplacementWEBP);
    this.load.image("khakiReplacement", khakiReplacementWEBP);
    this.load.image("orangeReplacement", orangeReplacementWEBP);
    this.load.image("pinkReplacement", pinkReplacementWEBP);
    this.load.image("redReplacement", redReplacementWEBP);
    this.load.image("violetReplacement", violetReplacementWEBP);
    this.load.image("yellowReplacement", yellowReplacementWEBP);
    this.load.image("container", containerWEBP);
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
