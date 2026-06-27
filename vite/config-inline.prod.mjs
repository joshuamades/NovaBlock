import { config } from '../src/config.js';
import { createHtmlPlugin } from 'vite-plugin-html';
import { defineConfig } from 'vite';
import { htmlInjectionPlugin } from 'vite-plugin-html-injection';
import { viteSingleFile } from 'vite-plugin-singlefile';
import viteString from 'vite-plugin-string';

const adNetworkType = process.env.AD_NETWORK || config.adNetworkType;

const addNetworkInjection = () => {
  switch (adNetworkType) {
    case "google":
      return {
        name: "Google Ads",
        type: "raw", // raw | js | css
        path: "./src/injections/google.html",
        injectTo: "head" // head | body | head-prepend | body-prepend
      };
    case "tiktok":
      return {
        name: "TikTok",
        type: "raw",
        path: "./src/injections/tiktok.html",
        injectTo: "head"
      };
    case "ironsource":
      return {
        name: "IronSource",
        type: "raw",
        path: "./src/injections/mraid.html",
        injectTo: "head"

      };
    case "mintegral":
      return {
        name: "Mintegral",
        type: "raw",
        path: "./src/injections/mintegral.html",
        injectTo: "head"
      };
    case "mraid":
      return {
        name: "Mraid",
        type: "raw",
        path: "./src/injections/mraid.html",
        injectTo: "head"
      };
    case "unityads":
      return {
        name: "Unity Ads",
        type: "raw",
        path: "./src/injections/mraid.html",
        injectTo: "head"
      };
    case "adcolony":
      return {
        name: "Ad Colony",
        type: "raw",
        path: "./src/injections/mraid.html",
        injectTo: "head"
      };
    case "applovin":
      return {
        name: "Ad Colony",
        type: "raw",
        path: "./src/injections/mraid.html",
        injectTo: "head"
      };
    case "kayzen":
      return {
        name: "Kayzen",
        type: "raw",
        path: "./src/injections/mraid.html",
        injectTo: "head"
      };
    case "moloco":
      return {
        name: "Moloco",
        type: "raw",
        path: "./src/injections/mraid.html",
        injectTo: "head"
      };
    default:
      return {
        name: "default",
        type: "raw",
        path: "./src/injections/blank.html",
        injectTo: "head"
      };
  }
};

export default defineConfig({
  base: '',
  logLevel: 'warning',
  publicDir: false,
  define: {
    'process.env.AD_NETWORK': JSON.stringify(adNetworkType),
  },
  build: {
    outDir: `dist-inline-${adNetworkType}`,
    assetsInlineLimit: 2097152,
    sourcemap: false,
    minify: 'terser',
    modulePreload: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
    terserOptions: {
      compress: {
        passes: 2
      },
      format: {
        comments: false
      }
    }
  },
  server: {
    port: 8080
  },
  plugins: [
    createHtmlPlugin({
      minify: false,
      removeComments: true,
      entry: "src/main.js",
    }),
    viteSingleFile({ removeViteModuleLoader: false }),
    viteString({
      compress: false,
      include: ["**/*.atlas", "**/*.xml"] // This will inline all Spine Atlas files and XML files as strings
    }),
    {
      ...htmlInjectionPlugin({
        injections: [
          addNetworkInjection(),
        ],
      }),
      apply: "build"
    },
    {
      name: "remove-module-type-and-crossorigin",
      transformIndexHtml(html) {
        // Mintegral rejects module scripts; strip module and crossorigin attributes
        return html
          .replace(/type="module"\s*/g, "")
          .replace(/\s*crossorigin(="[^"]*")?/g, "")
          .replace(/<script\s+/g, "<script defer ");
      },
      apply: "build"
    }
  ]
});
