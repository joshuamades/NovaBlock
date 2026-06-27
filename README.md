# Phaser Unified Playable Ads Template

A Phaser 3 project template with Unified Playable Ads Network Plugin for easy integration and testing across multiple ad networks.

## Features

- Unified network plugin supporting multiple ad networks
- Base64 asset encoding and management
- Multiple build options for different network requirements
- Comprehensive asset loading system for images, audio, bitmap fonts, and Spine animations
- Optimized Phaser builds for different use cases

## Network Plugin Integration

Import and use the CTA handler in your Phaser scenes:

If you're using MRAID-based networks, you need to setup store links(**Play Store** and **App Store**) in `config.js`. Otherwise, the CTA call will not work.

```js
export const config = {
  adNetworkType: "ironsource",
  googlePlayStoreLink: "https://play.google.com/",
  appleStoreLink: "https://apps.apple.com/",
};
```

In order to make a CTA call, you need to call the `onCtaPressed` function.

```js
import { onCtaPressed } from "../networkPlugin.js";

// Use when CTA is clicked
onCtaPressed();
```

> **Note**: `onCtaPressed` automatically calls `addClose` internally, crucial for networks like Mintegral.

### Supported Ad Networks

- Google
- Meta
- Mintegral
- TikTok
- IronSource
- Vungle
- Unity Ads
- AppLovin
- AdColony
- Kayzen
- Moloco

For Unity Ads, AppLovin, AdColony, Kayzen, and Moloco, update store links in `config.js` before deployment.

## Available Commands

| Command               | Description                                       |
| --------------------- | ------------------------------------------------- |
| `npm install`         | Install project dependencies                      |
| `npm run dev`         | Launch development web server                     |
| `npm run buildzip`    | Create zipped build in `dist-split` folder        |
| `npm run buildinline` | Create inlined build in `dist-inline` folder      |
| `npm run buildall`    | Create all build types in AllNetworkBuilds folder |
| `npm run base64`      | Convert assets to base64 encoded files            |

## Project Structure

```
project-root/
├── index.html          # Main HTML container
├── src/
│   ├── main.js        # Entry point and game configuration
│   ├── scenes/        # Phaser scenes
│   ├── lib/           # Ad network API libraries
│   ├── phaser/        # Optimized Phaser builds
│   └── utils/         # Asset loading utilities
├── public/
│   └── assets/        # Original game assets
│       ├── audio/     # Sound files
│       ├── images/    # Image assets
│       ├── fonts/     # Bitmap fonts
│       └── spine/     # Spine animation files
└── media/             # Base64 encoded assets
```

## Asset Management

### Base64 Encoding Process

1. Place assets in appropriate folders under `public/assets/`
2. Run `npm run base64`
3. Encoded files are saved to `media/`
4. Import statements are generated in `media/imports.txt`

The encoder handles various file types including PNG, JPG, MP3, OGG, Atlas files, and XML.

### Base64 Manager Setup

In your Preloader Scene:

```js
import { Base64Manager } from "../utils/Base64Manager.js";

class Preloader extends Phaser.Scene {
  preload() {
    // Initialize Base64Manager first
    Base64Manager(this, () => this.base64LoaderComplete());

    // Load assets here
  }

  base64LoaderComplete() {
    adReady();
    this.scene.start("Game");
  }
}
```

### Loading Assets

#### Images

```js
// Import encoded images
import { spaceyJPG } from "../../media/images_spacey.jpg.js";
import { sukasukaPNG } from "../../media/images_sukasuka.png.js";

// In preload:
this.load.image("bg", spaceyJPG);
this.load.image("character", sukasukaPNG);

// For sprite sheets:
this.load.spritesheet("button", buttonPNG, {
  frameWidth: 64,
  frameHeight: 64,
});
```

#### Audio

```js
import { LoadBase64Audio } from "../utils/LoadBase64Audio.js";
import { bgmMP3 } from "../../media/audio_bgm.mp3.js";
import { sfxMP3 } from "../../media/audio_sfx.mp3.js";

// In preload, load multiple audio files:
LoadBase64Audio(this, [
  { key: "bgm", data: bgmMP3 },
  { key: "sfx", data: sfxMP3 },
]);

// Never call LoadBase64Audio multiple times - bundle all audio in one call
```

#### Bitmap Fonts

```js
import { LoadBase64BitmapFont } from "../utils/LoadBase64BitmapFont.js";
import { fontPNG } from "../../media/fonts_font.png.js";
import { fontXML } from "../../media/fonts_font.xml.js";

// In preload:
LoadBase64BitmapFont(this, {
  key: "gamefont",
  xml: fontXML,
  png: fontPNG,
});
```

#### Spine Animations

First, ensure Spine plugin is added to Phaser:

```js
// In main.js
import * as SpinePlugin from "./spine/SpinePlugin";

const gameConfig = {
  // ... other config
  plugins: {
    scene: [
      {
        key: "SpinePlugin",
        plugin: window["SpinePlugin"],
        mapping: "spine",
      },
    ],
  },
};
```

Then load Spine assets:

```js
import { LoadBase64SpineFile } from "../utils/LoadBase64SpineFile.js";
import { atlasATLAS } from "../../media/spine_atlas.atlas.js";
import { atlasPNG } from "../../media/spine_atlas.png.js";
import { animJSON } from "../../media/spine_anim.json.js";

// In preload:
LoadBase64SpineFile(this, {
  key: "character",
  json: animJSON,
  atlas: atlasATLAS,
  png: [{ key: "atlas.png", file: atlasPNG }],
  preMultipliedAlpha: true,
});
```

> **Note**: The special version of Spine Plugin in the `spine` folder supports Spine 4.1 files. Do not replace it.

## Testing on Ad Networks

### Meta/Facebook

- Facebook Playable Ad tester not supported
- Upload directly to [Facebook Ads Manager](https://adsmanager.facebook.com/adsmanager/)

### Unity Ads

- Android: [Creative Test App](https://play.google.com/store/apps/details?id=com.unity3d.auicreativetestapp)
- iOS: [Ad Testing App](https://apps.apple.com/sk/app/ad-testing/id1463016906)

### AppLovin

- Use [AppLovin Preview Tool](https://p.applov.in/playablePreview?create=1&qr=1)

### Mintegral

- Test via [Mindworks Creative Studio](https://www.mindworks-creative.com/review/)

### IronSource

- Testing tool deprecated
- Test on [IronSource dashboard](https://developers.is.com/ironsource-mobile/general/html-upload/)

### Google

- No testing tool available
- Test on [Google Ads Manager](https://ads.google.com/)

### TikTok

- Use [TikTok Creative Center](https://ads.tiktok.com/help/article/playable-ads?lang=en#anchor-20)

### Vungle

- Test using [Creative Verifier](https://vungle.com/creative-verifier/)

### Ad Colony

- Test via [Fyber Console](https://console.fyber.com/)

### Kayzen

- No testing tool available
- Test through Kayzen dashboard

## Optimization Tips

Since base64 encoding increases file size by ~33%, optimize source files:

- Use JPEGs where transparency isn't needed
- Optimize PNGs through [TinyPNG](https://tinypng.com/)
- Balance audio quality and file size

### Phaser Builds

Three optimized builds available in `src/phaser/`:

1. `phaser-3.87.0-core.js`
   - No Arcade Physics
   - No Matter Physics
   - No Tilemap support
   - Best for basic playable ads

2. `phaser-3.87.0-full.js`
   - Complete Phaser build
   - Use when you need all features

3. `phaser-3.80.1.js`
   - Most compressed build
   - Removes:
     - Arcade Physics
     - Matter Physics
     - Tilemaps
     - Gamepad Support
     - Mesh
     - Plane
     - PointLight
     - Lights Game Objects

Import the desired build in your source files:

```js
import * as Phaser from "./phaser/phaser-3.87.0-core.js";
```

## Testing Ad on Localhost

Use `npm run dev` to test the Ad locally. This will launch Vite dev server, so you can use localhost to view the ad.

## Building Ad

1. Update store URLs in `config.js`
2. Choose build method:
   - `npm run build:split`: Creates splitted assets with a zipped build in `dist-split-networkName` folder
   - `npm run build:inline`: Creates inlined build in `dist-inline-networkName` folder
   - `npm run build:all`: Creates all build types with all or selected networks with both split zipped & inlined.

An example of the build output would look like this with `build:all` command:

```
ad-builds/
  ├── unityads/
  │   ├── inline/
  │   │   └── [build files]
  │   └── split/
  │       └── [build files]
  ├── ironsource/
  │   ├── inline/
  │   └── split/
  └── [other networks]/
```

3. Upload appropriate build to ad network

## Community

- 🌐 [Phaser Website](https://phaser.io)
- 🐦 [Twitter](https://twitter.com/phaser_)
- 💬 [Discord](https://discord.gg/phaser)
- 📚 [API Docs](https://newdocs.phaser.io)
- 🤝 [Support Forum](https://phaser.discourse.group/)
- ❓ [Stack Overflow](https://stackoverflow.com/questions/tagged/phaser-framework)
- 🎮 [Examples](https://labs.phaser.io)
- 📰 [Newsletter](https://phaser.io/community/newsletter)

---

Created by [Phaser Studio](mailto:support@phaser.io). Powered by coffee, anime, pixels and love.

The Phaser logo and characters are © 2011 - 2024 Phaser Studio Inc. All rights reserved.
