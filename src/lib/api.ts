/** Same-origin client. Session credentials stay in HttpOnly cookies. */
const MESSAGES: Record<string, string> = {
  api_not_configured: "Backend nie jest skonfigurowany. Funkcje konta są niedostępne.",
  api_unreachable: "Nie można połączyć się z serwerem aplikacji.",
  api_timeout: "Serwer nie odpowiedział na czas. Spróbuj ponownie.",
  network_unavailable: "Brak połączenia z serwerem aplikacji.",
  auth_unavailable: "Usługa konta jest chwilowo niedostępna.",
  rate_limited: "Zbyt wiele prób. Spróbuj ponownie za chwilę.",
  unauthenticated: "Sesja wygasła. Zaloguj się ponownie.",
  reauthentication_required: "Ta operacja wymaga ponownego zalogowania.",
  email_not_verified: "Potwierdź adres e-mail przed zalogowaniem.",
  EMAIL_NOT_VERIFIED: "Potwierdź adres e-mail przed zalogowaniem.",
  INVALID_EMAIL_OR_PASSWORD: "Nieprawidłowy adres e-mail lub hasło.",
  INVALID_PASSWORD: "Nieprawidłowe obecne hasło.",
  INVALID_TWO_FACTOR_COOKIE: "Potwierdzenie logowania wygasło. Zaloguj się ponownie.",
  INVALID_TOTP: "Nieprawidłowy kod z aplikacji uwierzytelniającej.",
  INVALID_BACKUP_CODE: "Nieprawidłowy lub wykorzystany kod odzyskiwania.",
  invalid_origin: "Żądanie zostało odrzucone ze względów bezpieczeństwa.",
  origin_not_allowed: "Żądanie zostało odrzucone ze względów bezpieczeństwa.",
  invalid_profile: "Nazwa musi mieć od 1 do 120 znaków.",
  invalid_preferences: "Sprawdź język i strefę czasową.",
  not_found: "Nie znaleziono wskazanego elementu.",
  use_sign_out: "Bieżącą sesję zakończ przyciskiem Wyloguj się.",
};
export function readableError(code: string, status = 0): string {
  if (MESSAGES[code]) return MESSAGES[code];
  if (status === 429) return MESSAGES["rate_limited"]!;
  if (status === 401) return MESSAGES["unauthenticated"]!;
  if (status >= 500) return MESSAGES["auth_unavailable"]!;
  return "Nie udało się wykonać operacji. Spróbuj ponownie.";
}
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string) {
    super(readableError(code, status));
    this.name = "ApiRequestError"; this.status = status; this.code = code;
  }
}
export async function api<T>(path: string, options: {
  method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown; signal?: AbortSignal;
} = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: options.method ?? "GET", credentials: "same-origin", cache: "no-store",
      headers: { accept: "application/json", ...(options.body !== undefined ? { "content-type": "application/json" } : {}) },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}), signal: options.signal,
    });
  } catch { throw new ApiRequestError(0, "network_unavailable"); }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload as { error?: { code?: string }; code?: string } | null;
    throw new ApiRequestError(response.status, error?.error?.code ?? error?.code ?? "request_failed");
  }
  if (payload === null) throw new ApiRequestError(502, "invalid_response");
  return payload as T;
}
