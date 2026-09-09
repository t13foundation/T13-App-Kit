/**
 * Coarse, non-identifying client label for the session list.
 * Never returns the raw user agent string.
 */
export function clientLabel(userAgent: string | null | undefined): string {
  if (!userAgent) return "Nieznane urządzenie";
  const ua = userAgent.toLowerCase();
  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("chrome/") && !ua.includes("chromium")
      ? "Chrome"
      : ua.includes("firefox/")
        ? "Firefox"
        : ua.includes("safari/")
          ? "Safari"
          : "Przeglądarka";
  const os = ua.includes("windows")
    ? "Windows"
    : ua.includes("mac os")
      ? "macOS"
      : ua.includes("android")
        ? "Android"
        : ua.includes("iphone") || ua.includes("ipad")
          ? "iOS"
          : ua.includes("linux")
            ? "Linux"
            : "Inny system";
  return `${browser} / ${os}`;
}
