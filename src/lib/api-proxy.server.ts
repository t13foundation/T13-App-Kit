import {
  canonicalOrigin,
  MAX_API_BODY_BYTES,
  mutationProblem,
} from "../../shared/security-policy.ts";

const REQUEST_HEADERS = [
  "accept",
  "content-type",
  "cookie",
  "origin",
  "user-agent",
  "sec-fetch-site",
];
const RESPONSE_HEADERS = ["content-type", "location", "retry-after", "www-authenticate"];
const SAFETY_HEADERS = {
  "cache-control": "private, no-store",
  pragma: "no-cache",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};
function json(status: number, code: string): Response {
  return new Response(JSON.stringify({ error: { code, message: code } }), {
    status,
    headers: { ...SAFETY_HEADERS, "content-type": "application/json" },
  });
}
/** Bound memory and total read time, including a client that stops sending its body. */
async function readBody(request: Request, signal: AbortSignal): Promise<ArrayBuffer | undefined> {
  if (!request.body) return undefined;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  const cancel = () => {
    void reader.cancel().catch(() => {});
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    signal.throwIfAborted();
    while (true) {
      const item = await reader.read();
      signal.throwIfAborted();
      if (item.done) break;
      length += item.value.byteLength;
      if (length > MAX_API_BODY_BYTES) {
        void reader.cancel().catch(() => {});
        throw new RangeError("payload_too_large");
      }
      chunks.push(item.value);
    }
  } finally {
    signal.removeEventListener("abort", cancel);
    reader.releaseLock();
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result.buffer;
}
/** The operator supplies ONE target. No caller-controlled forwarding or IP headers. */
export async function proxyApi(
  request: Request,
  backend: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  const origin = backend ? canonicalOrigin(backend) : null;
  if (!origin) return json(503, "api_not_configured");
  const incoming = new URL(request.url);
  if (!incoming.pathname.startsWith("/api/")) return json(404, "not_found");
  const problem = mutationProblem(
    request.method,
    request.headers.get("origin"),
    request.headers.get("content-type"),
    [incoming.origin],
  );
  if (problem) return json(problem === "unsupported_content_type" ? 415 : 403, problem);
  const headers = new Headers();
  for (const key of REQUEST_HEADERS) {
    const value = request.headers.get(key);
    if (value !== null) headers.set(key, value);
  }
  try {
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]);
    const body = ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await readBody(request, signal);
    const upstream = await fetcher(`${origin}${incoming.pathname}${incoming.search}`, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
      signal,
    });
    const out = new Headers(SAFETY_HEADERS);
    for (const key of RESPONSE_HEADERS) {
      const value = upstream.headers.get(key);
      if (value !== null) out.set(key, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) out.append("set-cookie", cookie);
    const noBody = request.method === "HEAD" || [204, 205, 304].includes(upstream.status);
    return new Response(noBody ? null : upstream.body, { status: upstream.status, headers: out });
  } catch (cause) {
    if (cause instanceof RangeError) return json(413, "payload_too_large");
    const timeout = cause instanceof Error && ["AbortError", "TimeoutError"].includes(cause.name);
    return json(timeout ? 504 : 502, timeout ? "api_timeout" : "api_unreachable");
  }
}
