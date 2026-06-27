import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const inputRoot = path.resolve("public/assets/images");
const port = 9333 + Math.floor(Math.random() * 400);
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "novablock-edge-"));

const pngFiles = [];

function collectPngFiles(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const fullPath = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      collectPngFiles(fullPath);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
      pngFiles.push(fullPath);
    }
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function stopEdge(edge) {
  if (!edge.killed) {
    edge.kill();
  }

  await delay(500);
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

async function convertFile(client, sourcePath) {
  const sourceBuffer = fs.readFileSync(sourcePath);
  const sourceDataUrl = `data:image/png;base64,${sourceBuffer.toString("base64")}`;
  const webpPath = sourcePath.replace(/\.png$/i, ".webp");
  const basename = path.basename(sourcePath).toLowerCase();
  const quality = basename.includes("replacement") ? 0.74 : 0.84;

  const expression = `
    (async () => {
      const image = new Image();
      image.src = ${JSON.stringify(sourceDataUrl)};
      await image.decode();

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);

      return canvas.toDataURL("image/webp", ${quality});
    })()
  `;

  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  const dataUrl = result.result?.value;
  if (!dataUrl?.startsWith("data:image/webp;base64,")) {
    throw new Error(`WebP conversion failed for ${sourcePath}`);
  }

  const webpBuffer = Buffer.from(dataUrl.split(",")[1], "base64");
  fs.writeFileSync(webpPath, webpBuffer);
  fs.unlinkSync(sourcePath);

  return {
    sourcePath,
    webpPath,
    sourceBytes: sourceBuffer.length,
    webpBytes: webpBuffer.length,
  };
}

async function main() {
  if (!fs.existsSync(edgePath)) {
    throw new Error(`Edge was not found at ${edgePath}`);
  }

  collectPngFiles(inputRoot);

  if (!pngFiles.length) {
    console.log("No PNG images found.");
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

    let totalBefore = 0;
    let totalAfter = 0;

    for (const file of pngFiles) {
      const result = await convertFile(client, file);
      totalBefore += result.sourceBytes;
      totalAfter += result.webpBytes;
      console.log(`${path.relative(process.cwd(), result.sourcePath)} -> ${path.relative(process.cwd(), result.webpPath)} (${result.sourceBytes} -> ${result.webpBytes})`);
    }

    console.log(`Converted ${pngFiles.length} images (${totalBefore} -> ${totalAfter} bytes).`);
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
