import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { fromNodeHeaders } from "better-auth/node";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";

import { preferencesSchema } from "@shared/contracts.ts";
import { AUTH_BASE_PATH, auth } from "./auth.ts";
import { db, getPool } from "./db/client.ts";
import { user as userTable } from "./db/schema.ts";
import { env, usesHttps } from "./env.ts";
import { clientLabel } from "./lib/client-label.ts";
import { eq } from "drizzle-orm";

const MAX_BODY_BYTES = 64 * 1024;

/** Sensitive operations require a session authenticated within this window. */
const FRESH_SESSION_MS = 5 * 60 * 1000;

/**
 * Headers a client must never be able to set: they would let a caller forge
 * its own IP address for rate limiting and auth decisions.
 */
const SPOOFABLE_IP_HEADERS = [
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
];

/** Better Auth paths that must never be reachable from the public API. */
const BLOCKED_AUTH_PATHS = new Set([
  `${AUTH_BASE_PATH}/list-sessions`,
  `${AUTH_BASE_PATH}/token`,
]);

type SessionResult = Awaited<ReturnType<typeof requireVerifiedSession>>;

async function requireVerifiedSession(request: FastifyRequest) {
  const session = await auth().api.getSession({ headers: fromNodeHeaders(request.headers) });
  if (!session) return { session: null, error: { status: 401, code: "unauthenticated" } };
  if (!session.user.emailVerified) {
    return { session: null, error: { status: 403, code: "email_not_verified" } };
  }
  return { session, error: null };
}

function fail(reply: FastifyReply, status: number, code: string) {
  return reply.status(status).send({ error: { code, message: code } });
}

function unauthorized(reply: FastifyReply, result: SessionResult) {
  return fail(reply, result.error!.status, result.error!.code);
}

export async function buildApp(): Promise<FastifyInstance> {
  const cfg = env();
  const secure = usesHttps(cfg);

  const app = Fastify({
    bodyLimit: MAX_BODY_BYTES,
    // Only an explicitly configured proxy list is trusted. `true` would let any
    // caller forge its client address through X-Forwarded-For.
    trustProxy: cfg.TRUSTED_PROXIES.length > 0 ? cfg.TRUSTED_PROXIES : false,
    disableRequestLogging: true,
    logger: {
      level: cfg.NODE_ENV === "test" ? "silent" : "info",
    },
  });

  // Strip forwarding headers unless a trusted proxy is configured, so they can
  // never reach Fastify's IP resolution or Better Auth.
  app.addHook("onRequest", async (request) => {
    if (cfg.TRUSTED_PROXIES.length === 0) {
      for (const header of SPOOFABLE_IP_HEADERS) delete request.headers[header];
    }
  });

  // Never cache account or auth responses anywhere.
  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("cache-control", "no-store");
    reply.header("pragma", "no-cache");
    return payload;
  });

  // Request logging: method, route and status only. No URL with query string,
  // no bodies, no headers, no tokens.
  app.addHook("onResponse", async (request, reply) => {
    request.log.info(
      {
        method: request.method,
        route: request.routeOptions.url ?? "unmatched",
        status: reply.statusCode,
        ms: Math.round(reply.elapsedTime),
      },
      "request",
    );
  });

  // Generic error shape: never leak SQL, secrets, private content or reset URLs.
  app.setErrorHandler((error: unknown, request, reply) => {
    const err = (error ?? {}) as { statusCode?: number; name?: string };
    const status = typeof err.statusCode === "number" ? err.statusCode : 500;
    if (status >= 500) request.log.error({ err: err.name ?? "Error" }, "unhandled_error");

    const code =
      status === 429
        ? "rate_limited"
        : status === 413
          ? "payload_too_large"
          : status >= 500
            ? "internal_error"
            : "request_failed";
    return reply.status(status).send({ error: { code, message: code } });
  });

  await app.register(cors, {
    origin: cfg.TRUSTED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  // Coarse per-IP limit in front of everything; Better Auth adds its own
  // per-endpoint rules on top of this.
  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: "1 minute",
  });

  /**
   * Origin/CSRF protection for our own state-changing endpoints. CORS alone
   * does not stop simple cross-site requests, so unsafe methods must carry an
   * Origin header that is on the trusted list.
   */
  app.addHook("preHandler", async (request, reply) => {
    if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
      return;
    }
    if (!request.url.startsWith("/api/me")) return;
    const origin = request.headers.origin;
    if (!origin || !cfg.TRUSTED_ORIGINS.includes(origin)) {
      return fail(reply, 403, "invalid_origin");
    }
  });

  app.get("/api/status", async (_request, reply) => {
    let database: "up" | "down" = "down";
    try {
      await getPool().query("select 1");
      database = "up";
    } catch {
      database = "down";
    }
    return reply.status(database === "up" ? 200 : 503).send({
      api: database === "up" ? ("up" as const) : ("down" as const),
      configured: true,
      version: "0.1.0-dev",
      features: { emailVerification: true, twoFactor: true },
    });
  });

  app.get("/api/health", async () => ({ ok: true }));

  // Better Auth catch-all (sign-up, sign-in, verification, reset, 2FA, ...).
  app.route({
    method: ["GET", "POST"],
    url: `${AUTH_BASE_PATH}/*`,
    handler: async (request, reply) => {
      const url = new URL(request.url, cfg.AUTH_URL);
      if (BLOCKED_AUTH_PATHS.has(url.pathname)) {
        return fail(reply, 404, "not_found");
      }

      // trustDevice is refused server-side, not just omitted by our UI.
      let body = request.body as Record<string, unknown> | undefined;
      if (body && typeof body === "object" && "trustDevice" in body) {
        if (body["trustDevice"]) return fail(reply, 400, "trust_device_disabled");
        const { trustDevice: _ignored, ...rest } = body;
        body = rest;
      }

      const req = new Request(url.toString(), {
        method: request.method,
        headers: fromNodeHeaders(request.headers),
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const response = await auth().handler(req);
      reply.status(response.status);
      // Set-Cookie must stay as separate headers, never comma-joined.
      const cookies = response.headers.getSetCookie?.() ?? [];
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "set-cookie") reply.header(key, value);
      });
      for (const cookie of cookies) reply.raw.appendHeader("set-cookie", cookie);
      if (secure) reply.header("strict-transport-security", "max-age=31536000");
      return reply.send(response.body ? await response.text() : null);
    },
  });

  app.get("/api/me", async (request, reply) => {
    const result = await requireVerifiedSession(request);
    if (result.error) return unauthorized(reply, result);
    const u = result.session.user as (typeof result.session)["user"] & {
      locale?: string;
      timezone?: string;
      twoFactorEnabled?: boolean | null;
    };
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      emailVerified: u.emailVerified,
      twoFactorEnabled: Boolean(u.twoFactorEnabled),
      locale: u.locale ?? "pl",
      timezone: u.timezone ?? "Europe/Warsaw",
      createdAt: new Date(u.createdAt).toISOString(),
    };
  });

  app.put("/api/me/preferences", async (request, reply) => {
    const result = await requireVerifiedSession(request);
    if (result.error) return unauthorized(reply, result);
    const parsed = preferencesSchema.safeParse(request.body);
    if (!parsed.success) return fail(reply, 422, "invalid_preferences");
    await db()
      .update(userTable)
      .set({ locale: parsed.data.locale, timezone: parsed.data.timezone, updatedAt: new Date() })
      .where(eq(userTable.id, result.session.user.id));
    return parsed.data;
  });

  app.get("/api/me/sessions", async (request, reply) => {
    const result = await requireVerifiedSession(request);
    if (result.error) return unauthorized(reply, result);
    const list = await auth().api.listSessions({ headers: fromNodeHeaders(request.headers) });
    return {
      sessions: list.map((entry) => ({
        id: entry.id,
        current: entry.token === result.session.session.token,
        createdAt: new Date(entry.createdAt).toISOString(),
        expiresAt: new Date(entry.expiresAt).toISOString(),
        client: clientLabel(entry.userAgent),
      })),
    };
  });

  app.post("/api/me/sessions/revoke-others", async (request, reply) => {
    const result = await requireVerifiedSession(request);
    if (result.error) return unauthorized(reply, result);

    // Sensitive operation: require a recently authenticated session.
    const session = result.session.session as { createdAt: Date; updatedAt?: Date };
    const age = Date.now() - new Date(session.createdAt).getTime();
    if (age > FRESH_SESSION_MS) return fail(reply, 403, "reauthentication_required");

    await auth().api.revokeOtherSessions({ headers: fromNodeHeaders(request.headers) });
    return { ok: true };
  });

  app.setNotFoundHandler(async (_request, reply) => fail(reply, 404, "not_found"));

  return app;
}
