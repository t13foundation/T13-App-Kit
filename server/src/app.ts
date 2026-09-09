import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { fromNodeHeaders } from 'better-auth/node';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { meSchema, preferencesSchema, profileSchema } from '@shared/contracts.ts';
import { authRoutePolicy, isFreshSession, isTrustedOrigin, MAX_API_BODY_BYTES, mutationProblem } from '../../shared/security-policy.ts';
import { AUTH_BASE_PATH, auth } from './auth.ts';
import { db } from './db/client.ts';
import { user as userTable } from './db/schema.ts';
import { env } from './env.ts';
import { clientLabel } from './lib/client-label.ts';

function fail(reply: FastifyReply, status: number, code: string) {
  return reply.status(status).send({ error: { code, message: code } });
}
function appendCookies(reply: FastifyReply, headers: Headers) {
  const cookies = headers.getSetCookie();
  if (cookies.length) {
    const current = reply.getHeader('set-cookie');
    reply.header('set-cookie', [...(Array.isArray(current) ? current.map(String) : current ? [String(current)] : []), ...cookies]);
  }
}
function authHeaders(request: FastifyRequest) {
  const headers = fromNodeHeaders(request.headers);
  for (const key of [...headers.keys()]) {
    if (key === 'forwarded' || key.startsWith('x-forwarded-') || key === 'x-real-ip' || key === 'cf-connecting-ip') headers.delete(key);
  }
  // Fastify does not trust arbitrary proxy headers. This is the socket peer,
  // not a client-provided header. A shared proxy currently shares this quota.
  headers.delete('content-length');
  headers.delete('host');
  headers.set('x-forwarded-for', request.ip);
  return headers;
}
async function requireSession(request: FastifyRequest, reply: FastifyReply, fresh = false) {
  const result = await auth().api.getSession({
    headers: authHeaders(request), query: { disableCookieCache: true }, returnHeaders: true,
  });
  appendCookies(reply, result.headers);
  const session = result.response;
  if (!session) { fail(reply, 401, 'unauthenticated'); return null; }
  if (!session.user.emailVerified) { fail(reply, 403, 'email_not_verified'); return null; }
  if (fresh && !isFreshSession(session.session.createdAt)) {
    fail(reply, 403, 'reauthentication_required'); return null;
  }
  return session;
}
type VerifiedSession = NonNullable<Awaited<ReturnType<typeof requireSession>>>;
function publicAccount(session: VerifiedSession) {
  const u = session.user;
  return meSchema.parse({
    id: u.id, email: u.email, name: u.name, emailVerified: u.emailVerified,
    twoFactorEnabled: Boolean(u.twoFactorEnabled), locale: u.locale ?? 'pl',
    timezone: u.timezone ?? 'Europe/Warsaw', createdAt: new Date(u.createdAt).toISOString(),
  });
}

export async function buildApp(): Promise<FastifyInstance> {
  const cfg = env();
  const app = Fastify({
    bodyLimit: MAX_API_BODY_BYTES, trustProxy: false, disableRequestLogging: true,
    logger: { level: cfg.NODE_ENV === 'test' ? 'silent' : 'info' },
  });
  app.addHook('onRequest', async (request, reply) => {
    reply.header('cache-control', 'private, no-store');
    reply.header('referrer-policy', 'no-referrer');
    reply.header('x-content-type-options', 'nosniff');
    const problem = mutationProblem(request.method, request.headers.origin, request.headers['content-type'], cfg.TRUSTED_ORIGINS);
    if (problem) return fail(reply, problem === 'unsupported_content_type' ? 415 : 403, problem);
    if (request.headers.origin && !isTrustedOrigin(request.headers.origin, cfg.TRUSTED_ORIGINS)) {
      return fail(reply, 403, 'origin_not_allowed');
    }
  });
  app.addHook('onResponse', async (request, reply) => {
    request.log.info({ method: request.method, route: request.routeOptions.url ?? 'unmatched',
      status: reply.statusCode, ms: Math.round(reply.elapsedTime) }, 'request');
  });
  await app.register(cors, { origin: cfg.TRUSTED_ORIGINS, credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] });
  await app.register(rateLimit, { global: true, max: 300, timeWindow: '1 minute' });
  app.get('/api/status', async () => ({ api: 'up' as const, configured: true, version: '0.1.0-dev',
    features: { emailVerification: true, twoFactor: true } }));
  app.get('/api/health', async () => ({ ok: true }));

  app.route({ method: ['GET', 'POST'], url: `${AUTH_BASE_PATH}/*`, handler: async (request, reply) => {
    const path = request.url.split('?')[0].slice(AUTH_BASE_PATH.length);
    const policy = authRoutePolicy(request.method, path);
    if (!policy) return fail(reply, 404, 'not_found');
    if (policy === 'fresh' && !await requireSession(request, reply, true)) return;
    let body = request.body;
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const data = body as Record<string, unknown>;
      if (data.trustDevice === true) return fail(reply, 400, 'trusted_device_disabled');
      if (path === '/change-password') body = { ...data, revokeOtherSessions: true };
    }
    const response = await auth().handler(new Request(new URL(request.url, cfg.AUTH_URL), {
      method: request.method, headers: authHeaders(request),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }));
    reply.status(response.status);
    for (const key of ['content-type', 'location', 'retry-after']) {
      const value = response.headers.get(key); if (value !== null) reply.header(key, value);
    }
    appendCookies(reply, response.headers);
    return reply.send(response.body ? await response.text() : null);
  } });

  app.get('/api/me', async (request, reply) => {
    const session = await requireSession(request, reply); if (!session) return;
    return publicAccount(session);
  });
  app.put('/api/me/profile', async (request, reply) => {
    const session = await requireSession(request, reply); if (!session) return;
    const parsed = profileSchema.safeParse(request.body);
    if (!parsed.success) return fail(reply, 422, 'invalid_profile');
    await db().update(userTable).set({ name: parsed.data.name, updatedAt: new Date() }).where(eq(userTable.id, session.user.id));
    return parsed.data;
  });
  app.put('/api/me/preferences', async (request, reply) => {
    const session = await requireSession(request, reply); if (!session) return;
    const parsed = preferencesSchema.safeParse(request.body);
    if (!parsed.success) return fail(reply, 422, 'invalid_preferences');
    await db().update(userTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(userTable.id, session.user.id));
    return parsed.data;
  });
  app.post('/api/me/export', async (request, reply) => {
    const session = await requireSession(request, reply, true); if (!session) return;
    // Only account data exists in this increment. Never include auth secrets,
    // password hashes, backup codes, tokens, or other users' rows.
    return { schemaVersion: 1, generatedAt: new Date().toISOString(), account: publicAccount(session) };
  });
  app.get('/api/me/sessions', async (request, reply) => {
    const session = await requireSession(request, reply); if (!session) return;
    const list = await auth().api.listSessions({ headers: authHeaders(request) });
    return { sessions: list.map((entry) => ({ id: entry.id, current: entry.id === session.session.id,
      createdAt: new Date(entry.createdAt).toISOString(), expiresAt: new Date(entry.expiresAt).toISOString(),
      client: clientLabel(entry.userAgent) })) };
  });
  app.post('/api/me/sessions/revoke-others', async (request, reply) => {
    const session = await requireSession(request, reply, true); if (!session) return;
    await auth().api.revokeOtherSessions({ headers: authHeaders(request) });
    return { ok: true };
  });
  app.delete<{ Params: { id: string } }>('/api/me/sessions/:id', async (request, reply) => {
    const session = await requireSession(request, reply, true); if (!session) return;
    if (request.params.id === session.session.id) return fail(reply, 409, 'use_sign_out');
    const list = await auth().api.listSessions({ headers: authHeaders(request) });
    const target = list.find((item) => item.id === request.params.id);
    if (!target) return fail(reply, 404, 'not_found');
    // The raw token is resolved only server-side, within the caller's sessions.
    await auth().api.revokeSession({ headers: authHeaders(request), body: { token: target.token } });
    return { ok: true };
  });
  app.setErrorHandler((error, _request, reply) => {
    const candidate = error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : 500;
    const status = typeof candidate === 'number' && candidate >= 400 && candidate < 500 ? candidate : 500;
    return fail(reply, status, status === 429 ? 'rate_limited' : status === 413 ? 'payload_too_large' : 'request_failed');
  });
  app.setNotFoundHandler((_request, reply) => fail(reply, 404, 'not_found'));
  return app;
}
