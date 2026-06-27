import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const imageRoot = path.resolve("public/assets/images");
const port = 9733 + Math.floor(Math.random() * 400);
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "novablock-edge-"));

const targets = [
  { match: /Replacement\.webp$/i, maxWidth: 192, maxHeight: 192, quality: 0.84 },
  { match: /^container\.webp$/i, maxWidth: 1024, maxHeight: 1024, quality: 0.86 },
  { match: /^hand-pointer\.webp$/i, maxWidth: 256, maxHeight: 256, quality: 0.84 },
  { match: /^logo\.webp$/i, maxWidth: 640, maxHeight: 320, quality: 0.86 },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPageWebSocket() {
  const listUrl = `http://127.0.0.1:${port}/json`;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(listUrl);
      const pages = await response.json();
      const page = pages.find((entry) => entry.type === "page");
      if (page?.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch {
      // Edge is still starting.
    }

    await delay(100);
  }

  throw new Error("Timed out waiting for Edge DevTools page.");
}

function createCdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) {
      return;
    }

    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);

    if (message.error) {
      reject(new Error(message.error.message));
    } else {
      resolve(message.result);
    }
  });

  return {
    ready: new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    }),
    send(method, params = {}) {
      const id = nextId;
      nextId += 1;

      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    close() {
      ws.close();
    },
  };
}

function getResizeTarget(fileName) {
  return targets.find((target) => target.match.test(fileName));
}

async function resizeFile(client, filePath, target) {
  const sourceBuffer = fs.readFileSync(filePath);
  const sourceDataUrl = `data:image/webp;base64,${sourceBuffer.toString("base64")}`;

  const expression = `
    (async () => {
      const image = new Image();
      image.src = ${JSON.stringify(sourceDataUrl)};
      await image.decode();

      const ratio = Math.min(
        1,
        ${target.maxWidth} / image.naturalWidth,
        ${target.maxHeight} / image.naturalHeight
      );
      const width = Math.max(1, Math.round(image.naturalWidth * ratio));
      const height = Math.max(1, Math.round(image.naturalHeight * ratio));

      if (width === image.naturalWidth && height === image.naturalHeight) {
        return {
          dataUrl: null,
          width,
          height,
          sourceWidth: image.naturalWidth,
          sourceHeight: image.naturalHeight,
        };
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      return {
        dataUrl: canvas.toDataURL("image/webp", ${target.quality}),
        width,
        height,
        sourceWidth: image.naturalWidth,
        sourceHeight: image.naturalHeight,
      };
    })()
  `;

  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  const value = result.result?.value;
  if (!value) {
    throw new Error(`Resize failed for ${filePath}`);
  }

  if (!value.dataUrl) {
    return {
      filePath,
      skipped: true,
      sourceBytes: sourceBuffer.length,
      webpBytes: sourceBuffer.length,
      ...value,
    };
  }

  const webpBuffer = Buffer.from(value.dataUrl.split(",")[1], "base64");
  fs.writeFileSync(filePath, webpBuffer);

  return {
    filePath,
    skipped: false,
    sourceBytes: sourceBuffer.length,
    webpBytes: webpBuffer.length,
    ...value,
  };
}

async function stopEdge(edge) {
  if (!edge.killed) {
    edge.kill();
  }
  await delay(500);
}

async function main() {
  if (!fs.existsSync(edgePath)) {
    throw new Error(`Edge was not found at ${edgePath}`);
  }

  const files = fs
    .readdirSync(imageRoot)
    .filter((fileName) => fileName.toLowerCase().endsWith(".webp"))
    .map((fileName) => ({
      fileName,
      filePath: path.join(imageRoot, fileName),
      target: getResizeTarget(fileName),
    }))
    .filter((entry) => entry.target);

  if (!files.length) {
    console.log("No matching WebP images found.");
    return;
  }

  const edge = spawn(edgePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ], {
    stdio: "ignore",
    windowsHide: true,
  });

  try {
    const wsUrl = await waitForPageWebSocket();
    const client = createCdpClient(wsUrl);
    await client.ready;
    await client.send("Runtime.enable");

    for (const { fileName, filePath, target } of files) {
      const result = await resizeFile(client, filePath, target);
      const action = result.skipped ? "kept" : "resized";
      console.log(
        `${action}: ${fileName} ${result.sourceWidth}x${result.sourceHeight} -> ${result.width}x${result.height} (${result.sourceBytes} -> ${result.webpBytes})`,
      );
    }

    client.close();
  } finally {
    await stopEdge(edge);
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Skipped locked temp profile cleanup: ${error.message}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
