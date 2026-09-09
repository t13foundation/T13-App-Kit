import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { readableError } from "./api";
/** Official client, version-matched with the API. No browser token storage. */
export const authClient = createAuthClient({ basePath: "/api/auth", plugins: [twoFactorClient()] });
export function webUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}
export function authErrorMessage(error: {
  code?: string; message?: string; status?: number; error?: { code?: string };
} | null | undefined): string {
  return readableError(error?.code ?? error?.error?.code ?? "request_failed", error?.status ?? 0);
}
