import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { fromNodeHeaders } from "better-auth/node";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { meSchema, preferencesSchema, profileSchema } from "@shared/contracts.ts";
import { authRoutePolicy, isFreshSession, MAX_API_BODY_BYTES, CLIENT_IP_HEADER, mutationProblem } from "../../shared/security-policy.ts";
import { AUTH_BASE_PATH, auth } from "./auth.ts";
import { db, getPool } from "./db/client.ts";
import { user as userTable } from "./db/schema.ts";
import { env, usesHttps } from "./env.ts";
import { clientLabel } from "./lib/client-label.ts";

const resolvedIps = new WeakMap<FastifyRequest, string>();
function fail(reply: FastifyReply, status: number, code: string) {
  return reply.status(status).send({ error: { code, message: code } });
}
function appendCookies(reply: FastifyReply, headers: Headers) {
  const cookies = headers.getSetCookie();
  if (!cookies.length) return;
  const existing = reply.getHeader("set-cookie");
  const previous = Array.isArray(existing) ? existing.map(String) : existing ? [String(existing)] : [];
  reply.header("set-cookie", [...previous, ...cookies]);
}
function authHeaders(request: FastifyRequest): Headers {
  const input = fromNodeHeaders(request.headers);
  const headers = new Headers();
  for (const key of ["cookie", "origin", "content-type", "user-agent", "accept", "sec-fetch-site"]) {
    const value = input.get(key);
    if (value !== null) headers.set(key, value);
  }
  // Set after the allowlist: neither the browser nor an untrusted proxy chooses this value.
  headers.set(CLIENT_IP_HEADER, resolvedIps.get(request) ?? request.ip);
  return headers;
}
async function requireSession(request: FastifyRequest, reply: FastifyReply, fresh = false) {
  const result = await auth().api.getSession({
    headers: authHeaders(request), query: { disableCookieCache: true }, returnHeaders: true,
  });
  appendCookies(reply, result.headers);
  const session = result.response;
  if (!session) { fail(reply, 401, "unauthenticated"); return null; }
  if (!session.user.emailVerified) { fail(reply, 403, "email_not_verified"); return null; }
  if (fresh && !isFreshSession(session.session.createdAt)) {
    fail(reply, 403, "reauthentication_required"); return null;
  }
  return session;
}
type VerifiedSession = NonNullable<Awaited<ReturnType<typeof requireSession>>>;
function publicAccount(session: VerifiedSession) {
  const user = session.user;
  return meSchema.parse({
    id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified,
    twoFactorEnabled: Boolean(user.twoFactorEnabled), locale: user.locale ?? "pl",
    timezone: user.timezone ?? "Europe/Warsaw", createdAt: new Date(user.createdAt).toISOString(),
  });
}
export async function buildApp(): Promise<FastifyInstance> {
  const cfg = env();
  const app = Fastify({
    bodyLimit: MAX_API_BODY_BYTES,
    trustProxy: cfg.TRUSTED_PROXIES.length ? cfg.TRUSTED_PROXIES : false,
    disableRequestLogging: true,
    logger: { level: cfg.NODE_ENV === "test" ? "silent" : "info" },
  });
  app.addHook("onRequest", async (request) => {
    // Resolve with Fastify's configured peer trust BEFORE stripping forwarding headers.
    resolvedIps.set(request, request.ip);
    for (const name of Object.keys(request.headers)) {
      if (name === "forwarded" || name.startsWith("x-forwarded-") ||
          ["x-real-ip", "x-client-ip", "x-cluster-client-ip", "cf-connecting-ip", "true-client-ip", "fastly-client-ip", CLIENT_IP_HEADER].includes(name)) {
        delete request.headers[name];
      }
    }
  });
  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("cache-control", "private, no-store");
    reply.header("pragma", "no-cache");
    reply.header("referrer-policy", "no-referrer");
    reply.header("x-content-type-options", "nosniff");
    if (usesHttps(cfg)) reply.header("strict-transport-security", "max-age=31536000");
    return payload;
  });
  app.addHook("onResponse", async (request, reply) => {
    request.log.info({ method: request.method, route: request.routeOptions.url ?? "unmatched",
      status: reply.statusCode, ms: Math.round(reply.elapsedTime) }, "request");
  });
  await app.register(cors, { origin: cfg.TRUSTED_ORIGINS, credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] });
  await app.register(rateLimit, { global: true, max: 300, timeWindow: "1 minute",
    keyGenerator: (request) => resolvedIps.get(request) ?? request.ip });
  app.addHook("preHandler", async (request, reply) => {
    const problem = mutationProblem(request.method, request.headers.origin, request.headers["content-type"], cfg.TRUSTED_ORIGINS);
    if (problem) return fail(reply, problem === "unsupported_content_type" ? 415 : 403,
      problem === "origin_not_allowed" ? "invalid_origin" : problem);
    return;
  });
  app.get("/api/status", async (_request, reply) => {
    let up = false;
    try { await getPool().query("select 1"); up = true; } catch { /* no dependency details in responses */ }
    return reply.status(up ? 200 : 503).send({ api: up ? "up" : "down", configured: true,
      version: "0.1.0-dev", features: { emailVerification: true, twoFactor: true } });
  });
  app.get("/api/health", async () => ({ ok: true }));
  app.route({ method: ["GET", "POST"], url: `${AUTH_BASE_PATH}/*`, handler: async (request, reply) => {
    const path = request.url.split("?")[0]!.slice(AUTH_BASE_PATH.length);
    const policy = authRoutePolicy(request.method, path);
    if (!policy) return fail(reply, 404, "not_found");
    if (policy === "fresh" && !await requireSession(request, reply, true)) return;
    let body = request.body;
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const data = body as Record<string, unknown>;
      if (data.trustDevice) return fail(reply, 400, "trust_device_disabled");
      if (path === "/two-factor/enable" && data.method && data.method !== "totp") return fail(reply, 400, "unsupported_second_factor");
      if (path === "/change-password") body = { ...data, revokeOtherSessions: true };
    }
    const response = await auth().handler(new Request(new URL(request.url, cfg.AUTH_URL), {
      method: request.method, headers: authHeaders(request),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }));
    if (response.status >= 500) return fail(reply, 503, "auth_unavailable");
    reply.status(response.status);
    for (const key of ["content-type", "location", "retry-after"]) {
      const value = response.headers.get(key); if (value !== null) reply.header(key, value);
    }
    appendCookies(reply, response.headers);
    return reply.send(response.body ? await response.text() : null);
  } });
  app.get("/api/me", async (request, reply) => {
    const session = await requireSession(request, reply); if (!session) return;
    return publicAccount(session);
  });
  app.put("/api/me/profile", async (request, reply) => {
    const session = await requireSession(request, reply); if (!session) return;
    const parsed = profileSchema.safeParse(request.body);
    if (!parsed.success) return fail(reply, 422, "invalid_profile");
    await db().update(userTable).set({ name: parsed.data.name, updatedAt: new Date() }).where(eq(userTable.id, session.user.id));
    return parsed.data;
  });
  app.put("/api/me/preferences", async (request, reply) => {
    const session = await requireSession(request, reply); if (!session) return;
    const parsed = preferencesSchema.safeParse(request.body);
    if (!parsed.success) return fail(reply, 422, "invalid_preferences");
    await db().update(userTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(userTable.id, session.user.id));
    return parsed.data;
  });
  app.post("/api/me/export", async (request, reply) => {
    const session = await requireSession(request, reply, true); if (!session) return;
    return { schemaVersion: 1, generatedAt: new Date().toISOString(), account: publicAccount(session) };
  });
  app.get("/api/me/sessions", async (request, reply) => {
    const session = await requireSession(request, reply); if (!session) return;
    const list = await auth().api.listSessions({ headers: authHeaders(request) });
    return { sessions: list.map((entry) => ({ id: entry.id, current: entry.id === session.session.id,
      createdAt: new Date(entry.createdAt).toISOString(), expiresAt: new Date(entry.expiresAt).toISOString(),
      client: clientLabel(entry.userAgent) })) };
  });
  app.post("/api/me/sessions/revoke-others", async (request, reply) => {
    const session = await requireSession(request, reply, true); if (!session) return;
    await auth().api.revokeOtherSessions({ headers: authHeaders(request) });
    return { ok: true };
  });
  app.delete<{ Params: { id: string } }>("/api/me/sessions/:id", async (request, reply) => {
    const session = await requireSession(request, reply, true); if (!session) return;
    if (request.params.id === session.session.id) return fail(reply, 409, "use_sign_out");
    const list = await auth().api.listSessions({ headers: authHeaders(request) });
    const target = list.find((entry) => entry.id === request.params.id);
    if (!target) return fail(reply, 404, "not_found");
    await auth().api.revokeSession({ headers: authHeaders(request), body: { token: target.token } });
    return { ok: true };
  });
  app.setErrorHandler((error: unknown, request, reply) => {
    const candidate = error && typeof error === "object" && "statusCode" in error ? error.statusCode : 500;
    const status = typeof candidate === "number" && candidate >= 400 && candidate < 500 ? candidate : 500;
    if (status >= 500) request.log.error({ code: "internal_error" }, "request_failed");
    return fail(reply, status, status === 429 ? "rate_limited" : status === 413 ? "payload_too_large" : "request_failed");
  });
  app.setNotFoundHandler((_request, reply) => fail(reply, 404, "not_found"));
  return app;
}
