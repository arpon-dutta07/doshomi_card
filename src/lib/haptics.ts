/** Short vibration on phones that support it (Android Chrome). Silently does nothing elsewhere. */
export function buzz(pattern: number | number[] = 12) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    // some browsers throw when vibration is blocked; ignore
  }
}
