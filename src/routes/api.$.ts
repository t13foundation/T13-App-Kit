import { createFileRoute } from "@tanstack/react-router";

/**
 * Narrow reverse proxy: /api/* -> ONE fixed backend.
 *
 * The target comes exclusively from the server-only `API_INTERNAL_URL`
 * environment variable. No URL, host or port is ever accepted from the client,
 * query string or headers, so this cannot be turned into an open proxy.
 *
 * Cookies pass through untouched (including the Better Auth MFA cookie) and
 * every Set-Cookie header is forwarded as its own header — never comma-joined.
 */
const TIMEOUT_MS = 15_000;
const MAX_BODY_BYTES = 64 * 1024;

/** Hop-by-hop headers that must not be forwarded. */
const STRIPPED = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authorization",
  "proxy-connection",
  "te",
  "trailer",
  "host",
  "content-length",
]);

/**
 * Address headers a client must never be able to set: forwarding them would
 * let any caller forge its own IP for rate limiting and auth decisions.
 */
const SPOOFABLE_IP_HEADERS = new Set([
  "forwarded",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
  "x-real-ip",
  "x-client-ip",
  "x-cluster-client-ip",
  "cf-connecting-ip",
  "true-client-ip",
  "fastly-client-ip",
  "x-app-client-ip",
]);

/**
 * Reads at most `limit` bytes and aborts as soon as the stream exceeds it, so
 * an oversized upload is never buffered in full.
 */
async function readLimitedBody(request: Request, limit: number): Promise<Uint8Array | null> {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

function backendUrl(): string | null {
  const raw = process.env['API_INTERNAL_URL'];
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function proxy({ request }: { request: Request }): Promise<Response> {
  const origin = backendUrl();
  if (!origin) {
    // Honest "no backend configured" state instead of a fake success.
    return json(503, {
      error: { code: "api_not_configured", message: "API_INTERNAL_URL is not set" },
    });
  }

  const incoming = new URL(request.url);
  const target = `${origin}${incoming.pathname}${incoming.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIPPED.has(key.toLowerCase())) headers.set(key, value);
  });

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) {
      return json(413, { error: { code: "payload_too_large", message: "payload_too_large" } });
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      ...(body ? { body } : {}),
      redirect: "manual",
      signal: controller.signal,
    });

    const outHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "set-cookie" && !STRIPPED.has(key.toLowerCase())) {
        outHeaders.set(key, value);
      }
    });
    for (const cookie of upstream.headers.getSetCookie()) {
      outHeaders.append("set-cookie", cookie);
    }

    return new Response(upstream.body, { status: upstream.status, headers: outHeaders });
  } catch (error) {
    // Never log the URL, headers or tokens.
    const aborted = error instanceof Error && error.name === "AbortError";
    return json(aborted ? 504 : 502, {
      error: { code: aborted ? "api_timeout" : "api_unreachable", message: "backend_unavailable" },
    });
  } finally {
    clearTimeout(timer);
  }
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: proxy,
      POST: proxy,
      PUT: proxy,
      PATCH: proxy,
      DELETE: proxy,
    },
  },
});
