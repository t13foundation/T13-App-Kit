/** Pure rules shared by the API and its fixed-target proxy. No environment access. */
export const FRESH_SESSION_MS = 5 * 60 * 1000;
export const MAX_API_BODY_BYTES = 64 * 1024;
export const CLIENT_IP_HEADER = "x-app-client-ip";

export function canonicalOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      url.hostname.includes("*")
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
export function isTrustedOrigin(
  value: string | undefined | null,
  allowed: readonly string[],
): boolean {
  if (!value || value === "null") return false;
  const origin = canonicalOrigin(value);
  return origin !== null && allowed.some((entry) => canonicalOrigin(entry) === origin);
}
export function isFreshSession(createdAt: Date | string, now = Date.now()): boolean {
  const age = now - new Date(createdAt).getTime();
  return Number.isFinite(age) && age >= 0 && age < FRESH_SESSION_MS;
}
export function mutationProblem(
  method: string,
  origin: string | null | undefined,
  contentType: string | null | undefined,
  allowed: readonly string[],
): string | null {
  if (["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) return null;
  if (!isTrustedOrigin(origin, allowed)) return "origin_not_allowed";
  if (contentType && contentType.split(";")[0]!.trim().toLowerCase() !== "application/json")
    return "unsupported_content_type";
  return null;
}
/** Exact allowlist: encoded, case-changed and trailing-slash aliases are not forwarded. */
export function authRoutePolicy(method: string, path: string): "public" | "fresh" | null {
  if (method === "GET") {
    return path === "/verify-email" || /^\/reset-password\/[A-Za-z0-9_-]+$/.test(path)
      ? "public"
      : null;
  }
  if (method !== "POST") return null;
  if (
    [
      "/change-password",
      "/two-factor/enable",
      "/two-factor/disable",
      "/two-factor/generate-backup-codes",
    ].includes(path)
  )
    return "fresh";
  return [
    "/sign-up/email",
    "/sign-in/email",
    "/sign-out",
    "/send-verification-email",
    "/request-password-reset",
    "/reset-password",
    "/two-factor/verify-totp",
    "/two-factor/verify-backup-code",
  ].includes(path)
    ? "public"
    : null;
}
