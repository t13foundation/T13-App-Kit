import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { fromNodeHeaders } from "better-auth/node";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";

import { preferencesSchema } from "@shared/contracts.ts";
import { AUTH_BASE_PATH, auth } from "./auth.ts";
import { db } from "./db/client.ts";
import { user as userTable } from "./db/schema.ts";
import { env } from "./env.ts";
import { clientLabel } from "./lib/client-label.ts";
import { eq } from "drizzle-orm";

const MAX_BODY_BYTES = 64 * 1024;

async function requireVerifiedSession(request: FastifyRequest) {
  const session = await auth().api.getSession({ headers: fromNodeHeaders(request.headers) });
  if (!session) return { session: null, error: { status: 401, code: "unauthenticated" } };
  if (!session.user.emailVerified) {
    return { session: null, error: { status: 403, code: "email_not_verified" } };
  }
  return { session, error: null };
}

export async function buildApp(): Promise<FastifyInstance> {
  const cfg = env();

  const app = Fastify({
    bodyLimit: MAX_BODY_BYTES,
    trustProxy: true,
    disableRequestLogging: true,
    logger: {
      level: cfg.NODE_ENV === "test" ? "silent" : "info",
    },
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

  app.get("/api/status", async () => ({
    api: "up" as const,
    configured: true,
    version: "0.1.0-dev",
    features: { emailVerification: true, twoFactor: true },
  }));

  app.get("/api/health", async () => ({ ok: true }));

  // Better Auth catch-all (sign-up, sign-in, verification, reset, 2FA, ...).
  app.route({
    method: ["GET", "POST"],
    url: `${AUTH_BASE_PATH}/*`,
    handler: async (request, reply) => {
      const url = new URL(request.url, cfg.AUTH_URL);
      const req = new Request(url.toString(), {
        method: request.method,
        headers: fromNodeHeaders(request.headers),
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });
      const response = await auth().handler(req);
      reply.status(response.status);
      // Set-Cookie must stay as separate headers, never comma-joined.
      const cookies = response.headers.getSetCookie?.() ?? [];
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "set-cookie") reply.header(key, value);
      });
      for (const cookie of cookies) reply.raw.appendHeader("set-cookie", cookie);
      return reply.send(response.body ? await response.text() : null);
    },
  });

  app.get("/api/me", async (request, reply) => {
    const result = await requireVerifiedSession(request);
    if (result.error) {
      return reply.status(result.error.status).send({ error: { code: result.error.code, message: result.error.code } });
    }
    const u = result.session.user as typeof result.session!.user & {
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
    if (result.error) {
      return reply.status(result.error.status).send({ error: { code: result.error.code, message: result.error.code } });
    }
    const parsed = preferencesSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: { code: "invalid_preferences", message: "invalid_preferences" } });
    }
    await db()
      .update(userTable)
      .set({ locale: parsed.data.locale, timezone: parsed.data.timezone, updatedAt: new Date() })
      .where(eq(userTable.id, result.session!.user.id));
    return parsed.data;
  });

  app.get("/api/me/sessions", async (request, reply) => {
    const result = await requireVerifiedSession(request);
    if (result.error) {
      return reply.status(result.error.status).send({ error: { code: result.error.code, message: result.error.code } });
    }
    const list = await auth().api.listSessions({ headers: fromNodeHeaders(request.headers) });
    return {
      sessions: list.map((entry) => ({
        id: entry.id,
        current: entry.token === result.session!.session.token,
        createdAt: new Date(entry.createdAt).toISOString(),
        expiresAt: new Date(entry.expiresAt).toISOString(),
        client: clientLabel(entry.userAgent),
      })),
    };
  });

  app.post("/api/me/sessions/revoke-others", async (request, reply) => {
    const result = await requireVerifiedSession(request);
    if (result.error) {
      return reply.status(result.error.status).send({ error: { code: result.error.code, message: result.error.code } });
    }
    await auth().api.revokeOtherSessions({ headers: fromNodeHeaders(request.headers) });
    return { ok: true };
  });

  app.setNotFoundHandler(async (_request, reply) =>
    reply.status(404).send({ error: { code: "not_found", message: "not_found" } }),
  );

  return app;
}
