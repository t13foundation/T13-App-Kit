import type { ApiError } from "@shared/contracts";

/**
 * Thin API client. Everything goes through the same-origin /api proxy with
 * cookies; no token is ever read from or written to localStorage.
 */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: init.method ?? "GET",
    credentials: "include",
    headers: init.body ? { "content-type": "application/json" } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const asApiError = payload as Partial<ApiError> & { code?: string; message?: string };
    const code = asApiError?.error?.code ?? asApiError?.code ?? `http_${response.status}`;
    const message = asApiError?.error?.message ?? asApiError?.message ?? code;
    throw new ApiRequestError(response.status, code, message);
  }

  return payload as T;
}

export const authApi = <T>(path: string, body?: unknown) =>
  api<T>(`/auth${path}`, body === undefined ? {} : { method: "POST", body });
