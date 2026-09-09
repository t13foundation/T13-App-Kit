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

/** Readable messages for the codes the API and the proxy actually return. */
const MESSAGES: Record<string, string> = {
  api_not_configured: "Backend nie jest skonfigurowany, więc logowanie jest niedostępne.",
  api_unreachable: "Nie można połączyć się z serwerem aplikacji.",
  api_timeout: "Serwer aplikacji nie odpowiedział na czas.",
  network_unavailable: "Brak połączenia z serwerem aplikacji.",
  rate_limited: "Zbyt wiele prób. Spróbuj ponownie za chwilę.",
  email_not_verified: "Potwierdź adres e-mail, zanim się zalogujesz.",
  invalid_origin: "Żądanie zostało odrzucone ze względów bezpieczeństwa.",
  INVALID_EMAIL_OR_PASSWORD: "Nieprawidłowy adres e-mail lub hasło.",
};

/** Normalises a Better Auth client error into a readable message. */
export function authErrorMessage(
  error: { code?: string; message?: string; status?: number } | null | undefined,
) {
  const code = error?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  if (error?.status === 503) return MESSAGES["api_not_configured"]!;
  if (error?.status === 429) return MESSAGES["rate_limited"]!;
  if (error?.status === 502 || error?.status === 504) return MESSAGES["api_unreachable"]!;
  return error?.message ?? code ?? "Nie udało się wykonać operacji. Spróbuj ponownie.";
}
