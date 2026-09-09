/**
 * Same-origin API client.
 *
 * Every request goes to `/api/*` on the current origin, which the TanStack
 * server route in `src/routes/api.$.ts` forwards to the configured backend.
 * Sessions live in HttpOnly cookies — nothing is ever stored in localStorage.
 */

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = options.method ?? "GET";

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "include",
      headers: options.body ? { "content-type": "application/json" } : {},
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch {
    throw new ApiRequestError(0, "network_unavailable");
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = (payload as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiRequestError(response.status, error?.code ?? "request_failed", error?.message);
  }

  return payload as T;
}
