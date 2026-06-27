const KNOWN_IPAD_SCREEN_SIZES = new Set([
  "744x1133",
  "768x1024",
  "810x1080",
  "820x1180",
  "834x1112",
  "834x1194",
  "1024x1366",
]);

export function isIpadScreen(options = {}) {
  const nav = typeof navigator !== "undefined" ? navigator : {};
  const win = typeof window !== "undefined" ? window : {};
  const screen = win.screen || {};

  const userAgent = (options.userAgent ?? nav.userAgent ?? "").toLowerCase();
  const platform = (options.platform ?? nav.platform ?? "").toLowerCase();
  const maxTouchPoints = Number(
    options.maxTouchPoints ?? nav.maxTouchPoints ?? 0,
  );
  const screenWidth = Number(options.screenWidth ?? screen.width ?? 0);
  const screenHeight = Number(options.screenHeight ?? screen.height ?? 0);

  const shortestSide = Math.round(Math.min(screenWidth, screenHeight));
  const longestSide = Math.round(Math.max(screenWidth, screenHeight));
  const normalizedSize = `${shortestSide}x${longestSide}`;

  const isLegacyIpadUa = /ipad/.test(userAgent);
  const isModernIpadUa = platform === "macintel" && maxTouchPoints > 1;
  const matchesKnownIpadSize = KNOWN_IPAD_SCREEN_SIZES.has(normalizedSize);

  return isLegacyIpadUa || isModernIpadUa || matchesKnownIpadSize;
}
