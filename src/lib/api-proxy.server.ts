import { canonicalOrigin, MAX_API_BODY_BYTES, mutationProblem } from '../../shared/security-policy.ts';

const REQUEST_HEADERS = ['accept', 'content-type', 'cookie', 'origin', 'user-agent'];
const RESPONSE_HEADERS = ['content-type', 'location', 'retry-after', 'www-authenticate'];
function json(status: number, code: string) {
  return new Response(JSON.stringify({ error: { code, message: code } }), {
    status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** Read incrementally, enforcing the limit BEFORE allocating an unbounded body. */
async function readBody(request: Request): Promise<Uint8Array | undefined> {
  if (!request.body) return undefined;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      length += item.value.byteLength;
      if (length > MAX_API_BODY_BYTES) {
        await reader.cancel();
        throw new RangeError('payload_too_large');
      }
      chunks.push(item.value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

/** Fixed target only. Client-supplied forwarding headers never cross this boundary. */
export async function proxyApi(request: Request, backend: string | undefined,
  fetcher: typeof fetch = fetch): Promise<Response> {
  if (!backend) return json(503, 'api_not_configured');
  const origin = canonicalOrigin(backend);
  if (!origin) return json(503, 'api_not_configured');
  const incoming = new URL(request.url);
  if (!incoming.pathname.startsWith('/api/')) return json(404, 'not_found');
  const problem = mutationProblem(request.method, request.headers.get('origin'),
    request.headers.get('content-type'), [incoming.origin]);
  if (problem) return json(problem === 'unsupported_content_type' ? 415 : 403, problem);

  const headers = new Headers();
  for (const key of REQUEST_HEADERS) {
    const value = request.headers.get(key);
    if (value !== null) headers.set(key, value);
  }
  // No Forwarded, X-Forwarded-*, X-Real-IP or client-selected target headers.
  try {
    const body = await readBody(request);
    const upstream = await fetcher(`${origin}${incoming.pathname}${incoming.search}`, {
      method: request.method, headers, body,
      redirect: 'manual', signal: AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]),
    });
    const out = new Headers({
      'cache-control': 'private, no-store', 'pragma': 'no-cache',
      'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff',
    });
    for (const key of RESPONSE_HEADERS) {
      const value = upstream.headers.get(key);
      if (value !== null) out.set(key, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) out.append('set-cookie', cookie);
    return new Response(upstream.body, { status: upstream.status, headers: out });
  } catch (cause) {
    if (cause instanceof RangeError) return json(413, 'payload_too_large');
    const timeout = cause instanceof Error && ['AbortError', 'TimeoutError'].includes(cause.name);
    return json(timeout ? 504 : 502, timeout ? 'api_timeout' : 'api_unreachable');
  }
}
