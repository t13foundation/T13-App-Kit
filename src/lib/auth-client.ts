import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Official Better Auth client (version-matched with server/package.json).
 * All traffic goes through the same-origin /api proxy so the session cookie
 * stays HttpOnly and no token is ever stored in the browser.
 */
export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [twoFactorClient()],
});

/** Absolute URL on the public web origin, used for e-mail callbacks. */
export function webUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

/** Normalises a Better Auth client error into a readable message. */
export function authErrorMessage(error: { code?: string; message?: string } | null | undefined) {
  return error?.message ?? error?.code ?? "request_failed";
}
