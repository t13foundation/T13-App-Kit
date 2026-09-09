/** Same-origin, cookie-based transport. No token or account data in localStorage. */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message?: string) {
    super(message ?? code); this.name = 'ApiRequestError'; this.status = status; this.code = code;
  }
}
const messages: Record<string, string> = {
  api_not_configured: 'Backend nie jest jeszcze skonfigurowany.',
  api_unreachable: 'Nie można połączyć się z serwerem. Spróbuj ponownie.',
  api_timeout: 'Serwer nie odpowiedział na czas. Sprawdź stan przed ponowieniem.',
  reauthentication_required: 'Ze względów bezpieczeństwa zaloguj się ponownie i powtórz tę czynność.',
  unauthenticated: 'Sesja wygasła. Zaloguj się ponownie.',
  email_not_verified: 'Najpierw potwierdź adres e-mail.',
  invalid_preferences: 'Sprawdź język i nazwę strefy czasowej.',
  invalid_profile: 'Wpisz nazwę o długości od 1 do 120 znaków.',
  INVALID_EMAIL_OR_PASSWORD: 'Nieprawidłowy adres e-mail lub hasło.',
  EMAIL_NOT_VERIFIED: 'Najpierw potwierdź adres e-mail.',
  INVALID_PASSWORD: 'Nieprawidłowe hasło.',
  INVALID_TWO_FACTOR_CODE: 'Nieprawidłowy kod. Spróbuj ponownie.',
};
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = init.method ?? 'GET';
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method, credentials: 'same-origin', cache: 'no-store',
      headers: { accept: 'application/json', ...(method !== 'GET' ? { 'content-type': 'application/json' } : {}) },
      body: method === 'GET' ? undefined : JSON.stringify(init.body ?? {}),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (cause) {
    const timeout = cause instanceof Error && ['AbortError', 'TimeoutError'].includes(cause.name);
    const code = timeout ? 'api_timeout' : 'api_unreachable';
    throw new ApiRequestError(0, code, messages[code]);
  }
  let payload: unknown;
  try { payload = response.status === 204 ? null : await response.json(); }
  catch { throw new ApiRequestError(response.status, 'invalid_response', 'Serwer zwrócił nieprawidłową odpowiedź.'); }
  if (!response.ok) {
    const result = payload as { error?: { code?: string }; code?: string } | null;
    const code = result?.error?.code ?? result?.code ?? `http_${response.status}`;
    // Do not display arbitrary server errors, which may contain private data.
    throw new ApiRequestError(response.status, code,
      messages[code] ?? (response.status === 429 ? 'Zbyt wiele prób. Spróbuj ponownie później.' : 'Nie udało się wykonać operacji. Sprawdź dane i spróbuj ponownie.'));
  }
  return payload as T;
}
export const authApi = <T>(path: string, body?: unknown) =>
  api<T>(`/auth${path}`, body === undefined ? {} : { method: 'POST', body });
