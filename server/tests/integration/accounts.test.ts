/**
 * Real vertical integration test: PostgreSQL + SMTP (Mailpit) + Fastify +
 * Better Auth. No mocks, no in-memory database, no stubbed mailer.
 *
 * Requires (see docs/start.md):
 *   PostgreSQL on DATABASE_URL, Mailpit SMTP on SMTP_HOST/SMTP_PORT and its
 *   HTTP API on MAILPIT_API.
 */
import { afterAll, beforeAll, expect, test } from "vitest";
import * as OTPAuth from "otpauth";
import type { FastifyInstance } from "fastify";

import { buildApp } from "../../src/app.ts";
import { closeDatabase, getPool } from "../../src/db/client.ts";
import { assertLocalMailpit, assertResettableTestDatabase } from "../setup/test-database.ts";

// Refuses to run (and to delete anything) unless this is an explicitly enabled,
// local, dedicated appkit_test database and a local Mailpit.
assertResettableTestDatabase();
const MAILPIT_API = assertLocalMailpit(process.env.MAILPIT_API ?? "http://127.0.0.1:8025");
const EMAIL = `user-${Date.now()}@example.test`;
const OTHER_EMAIL = `other-${Date.now()}@example.test`;
const PASSWORD = "Bardzo-Dlugie-Haslo-123";
const NEW_PASSWORD = "Inne-Bardzo-Dlugie-Haslo-456";
const ORIGIN = "http://localhost:8080";

let app: FastifyInstance;
let backupCodes: string[] = [];

function cookiesOf(res: { headers: Record<string, unknown> }): string {
  const raw = res.headers["set-cookie"];
  const list = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
  return list.map((c) => c.split(";")[0]).join("; ");
}

function mergeCookies(current: string, res: { headers: Record<string, unknown> }): string {
  const jar = new Map<string, string>();
  for (const part of [current, cookiesOf(res)].join("; ").split("; ").filter(Boolean)) {
    const idx = part.indexOf("=");
    jar.set(part.slice(0, idx), part.slice(idx + 1));
  }
  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function lastMailLinkTo(to: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const list = (await (await fetch(`${MAILPIT_API}/api/v1/messages?limit=50`)).json()) as {
      messages: { ID: string; To: { Address: string }[] }[];
    };
    const hit = list.messages.find((m) => m.To.some((t) => t.Address === to));
    if (hit) {
      const body = (await (await fetch(`${MAILPIT_API}/api/v1/message/${hit.ID}`)).json()) as {
        Text: string;
        HTML: string;
      };
      const match = `${body.HTML}\n${body.Text}`.match(
        /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?[^\s"'<>)\]]+/,
      );
      if (match) {
        await fetch(`${MAILPIT_API}/api/v1/messages`, {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ IDs: [hit.ID] }),
        });
        return match[0].replace(/&amp;/g, "&");
      }
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("no_mail_received");
}

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
  await fetch(`${MAILPIT_API}/api/v1/messages`, { method: "DELETE" });
  // Rate limiting is enabled (and asserted separately); reset the counters so
  // repeated local runs from the same IP do not trip the sign-in rule.
  await getPool().query("truncate table rate_limit");
});

afterAll(async () => {
  await app.close();
  await closeDatabase();
});

test("full account vertical: sign-up -> verify -> login -> preferences -> MFA -> sessions", async () => {
  // --- sign-up -------------------------------------------------------------
  const signUp = await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    headers: { origin: ORIGIN },
    payload: { email: EMAIL, password: PASSWORD, name: "Test User" },
  });
  expect(signUp.statusCode).toBe(200);

  // --- unverified sign-in is rejected --------------------------------------
  const earlyLogin = await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    headers: { origin: ORIGIN },
    payload: { email: EMAIL, password: PASSWORD },
  });
  expect(earlyLogin.statusCode).toBe(403);

  // --- protected endpoint without a session --------------------------------
  const anonMe = await app.inject({ method: "GET", url: "/api/me", headers: { origin: ORIGIN } });
  expect(anonMe.statusCode).toBe(401);

  // --- verification mail ---------------------------------------------------
  const verifyUrl = await lastMailLinkTo(EMAIL);
  const verify = await app.inject({
    method: "GET",
    url: verifyUrl.replace(/^https?:\/\/[^/]+/, ""),
    headers: { origin: ORIGIN },
  });
  expect([200, 302]).toContain(verify.statusCode);

  // --- login ---------------------------------------------------------------
  const login = await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    headers: { origin: ORIGIN },
    payload: { email: EMAIL, password: PASSWORD },
  });
  expect(login.statusCode).toBe(200);
  let jar = mergeCookies("", login);
  expect(jar).toContain("session_token");
  const setCookies = login.headers["set-cookie"];
  expect(String(setCookies)).toContain("HttpOnly");

  // --- /me -----------------------------------------------------------------
  const me = await app.inject({
    method: "GET",
    url: "/api/me",
    headers: { origin: ORIGIN, cookie: jar },
  });
  expect(me.statusCode).toBe(200);
  expect(me.json()).toMatchObject({ email: EMAIL, emailVerified: true, locale: "pl" });

  // --- preferences persisted in the database -------------------------------
  const prefs = await app.inject({
    method: "PUT",
    url: "/api/me/preferences",
    headers: { origin: ORIGIN, cookie: jar },
    payload: { locale: "en", timezone: "Europe/Berlin" },
  });
  expect(prefs.statusCode).toBe(200);
  const meAfter = await app.inject({
    method: "GET",
    url: "/api/me",
    headers: { origin: ORIGIN, cookie: jar },
  });
  expect(meAfter.json()).toMatchObject({ locale: "en", timezone: "Europe/Berlin" });

  const badPrefs = await app.inject({
    method: "PUT",
    url: "/api/me/preferences",
    headers: { origin: ORIGIN, cookie: jar },
    payload: { locale: "de", timezone: "../etc" },
  });
  expect(badPrefs.statusCode).toBe(422);

  // --- MFA (TOTP) with explicit confirmation --------------------------------
  const enable = await app.inject({
    method: "POST",
    url: "/api/auth/two-factor/enable",
    headers: { origin: ORIGIN, cookie: jar },
    payload: { password: PASSWORD, issuer: "Aplikacja" },
  });
  expect(enable.statusCode).toBe(200);
  const enableBody = enable.json() as { totpURI: string; backupCodes: string[] };
  expect(enableBody.backupCodes.length).toBeGreaterThan(0);
  backupCodes = enableBody.backupCodes;
  const totp = OTPAuth.URI.parse(enableBody.totpURI) as OTPAuth.TOTP;

  const confirm = await app.inject({
    method: "POST",
    url: "/api/auth/two-factor/verify-totp",
    headers: { origin: ORIGIN, cookie: jar },
    payload: { code: totp.generate() },
  });
  expect(confirm.statusCode).toBe(200);
  jar = mergeCookies(jar, confirm);

  // --- logout --------------------------------------------------------------
  const logout = await app.inject({
    method: "POST",
    url: "/api/auth/sign-out",
    headers: { origin: ORIGIN, cookie: jar },
  });
  expect(logout.statusCode).toBe(200);
  const afterLogout = await app.inject({
    method: "GET",
    url: "/api/me",
    headers: { origin: ORIGIN, cookie: jar },
  });
  expect(afterLogout.statusCode).toBe(401);

  // --- login now requires the second factor --------------------------------
  const login2 = await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    headers: { origin: ORIGIN },
    payload: { email: EMAIL, password: PASSWORD },
  });
  expect(login2.statusCode).toBe(200);
  expect(login2.json()).toMatchObject({ twoFactorRedirect: true });
  let jarA = mergeCookies("", login2);
  const noSessionYet = await app.inject({
    method: "GET",
    url: "/api/me",
    headers: { origin: ORIGIN, cookie: jarA },
  });
  expect(noSessionYet.statusCode).toBe(401);

  const second = await app.inject({
    method: "POST",
    url: "/api/auth/two-factor/verify-totp",
    headers: { origin: ORIGIN, cookie: jarA },
    // trustDevice is never enabled by this kit.
    payload: { code: totp.generate() },
  });
  expect(second.statusCode).toBe(200);
  jarA = mergeCookies(jarA, second);
  expect(
    (await app.inject({ method: "GET", url: "/api/me", headers: { origin: ORIGIN, cookie: jarA } }))
      .statusCode,
  ).toBe(200);

  // --- a second, independent session ---------------------------------------
  const login3 = await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    headers: { origin: ORIGIN, "user-agent": "Mozilla/5.0 (Macintosh) Chrome/120 Safari/537" },
    payload: { email: EMAIL, password: PASSWORD },
  });
  let jarB = mergeCookies("", login3);
  const second2 = await app.inject({
    method: "POST",
    url: "/api/auth/two-factor/verify-totp",
    headers: { origin: ORIGIN, cookie: jarB },
    payload: { code: totp.generate() },
  });
  jarB = mergeCookies(jarB, second2);
  expect(
    (await app.inject({ method: "GET", url: "/api/me", headers: { origin: ORIGIN, cookie: jarB } }))
      .statusCode,
  ).toBe(200);

  // --- session list contains no private data -------------------------------
  const sessions = await app.inject({
    method: "GET",
    url: "/api/me/sessions",
    headers: { origin: ORIGIN, cookie: jarB },
  });
  expect(sessions.statusCode).toBe(200);
  const body = sessions.json() as { sessions: { current: boolean; client: string }[] };
  expect(body.sessions.length).toBeGreaterThanOrEqual(2);
  expect(body.sessions.filter((s) => s.current)).toHaveLength(1);
  const raw = sessions.body;
  expect(raw).not.toContain("token");
  expect(raw).not.toContain("ipAddress");
  expect(raw).not.toContain("Mozilla");
  expect(raw).not.toContain(EMAIL);

  // --- revoking other sessions kills them immediately (no cache) -----------
  const revoke = await app.inject({
    method: "POST",
    url: "/api/me/sessions/revoke-others",
    headers: { origin: ORIGIN, cookie: jarB },
  });
  expect(revoke.statusCode).toBe(200);
  expect(
    (await app.inject({ method: "GET", url: "/api/me", headers: { origin: ORIGIN, cookie: jarA } }))
      .statusCode,
  ).toBe(401);
  expect(
    (await app.inject({ method: "GET", url: "/api/me", headers: { origin: ORIGIN, cookie: jarB } }))
      .statusCode,
  ).toBe(200);
}, 120_000);

test("password reset goes through email and still requires the second factor", async () => {
  const forget = await app.inject({
    method: "POST",
    url: "/api/auth/request-password-reset",
    headers: { origin: ORIGIN },
    payload: { email: EMAIL, redirectTo: "http://localhost:8080/reset-password" },
  });
  expect(forget.statusCode).toBe(200);

  const link = await lastMailLinkTo(EMAIL);
  const parsed = new URL(link);
  // Better Auth links carry the token either as ?token= or as the last path segment.
  const token = parsed.searchParams.get("token") ?? parsed.pathname.split("/").pop() ?? "";
  expect(token.length).toBeGreaterThan(10);

  const reset = await app.inject({
    method: "POST",
    url: "/api/auth/reset-password",
    headers: { origin: ORIGIN },
    payload: { newPassword: NEW_PASSWORD, token },
  });
  expect(reset.statusCode).toBe(200);

  const login = await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    headers: { origin: ORIGIN },
    payload: { email: EMAIL, password: NEW_PASSWORD },
  });
  expect(login.statusCode).toBe(200);
  // MFA is never skipped after a reset.
  expect(login.json()).toMatchObject({ twoFactorRedirect: true });
}, 120_000);

test("foreign origin is rejected and disabled library paths stay unreachable", async () => {
  const foreign = await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    headers: { origin: "http://evil.example.com" },
    payload: { email: EMAIL, password: NEW_PASSWORD },
  });
  expect(foreign.statusCode).toBe(403);

  // Our own mutations enforce Origin as well; CORS alone would not.
  const noOrigin = await app.inject({
    method: "PUT",
    url: "/api/me/preferences",
    payload: { locale: "en", timezone: "Europe/Berlin" },
  });
  expect(noOrigin.statusCode).toBe(403);
  expect(noOrigin.json()).toMatchObject({ error: { code: "invalid_origin" } });

  const evilOrigin = await app.inject({
    method: "PUT",
    url: "/api/me/preferences",
    headers: { origin: "http://evil.example.com" },
    payload: { locale: "en", timezone: "Europe/Berlin" },
  });
  expect(evilOrigin.statusCode).toBe(403);

  // The raw library session list would expose tokens: it must not exist,
  // including with a trailing slash.
  for (const path of ["/api/auth/list-sessions", "/api/auth/list-sessions/", "/api/auth/token"]) {
    const res = await app.inject({ method: "GET", url: path, headers: { origin: ORIGIN } });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ error: { code: "not_found" } });
  }

  // Direct revoke endpoints would bypass the freshness requirement.
  for (const path of ["/api/auth/revoke-sessions", "/api/auth/revoke-other-sessions/"]) {
    const res = await app.inject({
      method: "POST",
      url: path,
      headers: { origin: ORIGIN },
      payload: {},
    });
    expect(res.statusCode).toBe(404);
  }

  for (const path of ["/api/auth/delete-user", "/api/auth/two-factor/view-backup-codes"]) {
    const res = await app.inject({
      method: "POST",
      url: path,
      headers: { origin: ORIGIN },
      payload: {},
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  }

  // Anonymous access to every private endpoint is exactly 401.
  for (const url of ["/api/me", "/api/me/sessions"]) {
    expect((await app.inject({ method: "GET", url, headers: { origin: ORIGIN } })).statusCode).toBe(
      401,
    );
  }
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/api/me/sessions/revoke-others",
        headers: { origin: ORIGIN },
      })
    ).statusCode,
  ).toBe(401);
});

test("a backup code works exactly once", async () => {
  const login = await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    headers: { origin: ORIGIN },
    payload: { email: EMAIL, password: NEW_PASSWORD },
  });
  expect(login.statusCode).toBe(200);
  const jar = mergeCookies("", login);

  const code = backupCodes[0]!;
  const first = await app.inject({
    method: "POST",
    url: "/api/auth/two-factor/verify-backup-code",
    headers: { origin: ORIGIN, cookie: jar },
    payload: { code },
  });
  expect(first.statusCode).toBe(200);

  // Second sign-in, same code: must be refused.
  const login2 = await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    headers: { origin: ORIGIN },
    payload: { email: EMAIL, password: NEW_PASSWORD },
  });
  const jar2 = mergeCookies("", login2);
  const reuse = await app.inject({
    method: "POST",
    url: "/api/auth/two-factor/verify-backup-code",
    headers: { origin: ORIGIN, cookie: jar2 },
    payload: { code },
  });
  expect(reuse.statusCode).toBeGreaterThanOrEqual(400);
  expect(reuse.statusCode).toBeLessThan(500);
}, 120_000);

test("another account never sees the first account's data", async () => {
  const signUp = await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    headers: { origin: ORIGIN },
    payload: { email: OTHER_EMAIL, password: PASSWORD, name: "Other User" },
  });
  expect(signUp.statusCode).toBe(200);

  const verifyUrl = await lastMailLinkTo(OTHER_EMAIL);
  await app.inject({
    method: "GET",
    url: verifyUrl.replace(/^https?:\/\/[^/]+/, ""),
    headers: { origin: ORIGIN },
  });

  const login = await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    headers: { origin: ORIGIN },
    payload: { email: OTHER_EMAIL, password: PASSWORD },
  });
  expect(login.statusCode).toBe(200);
  const jar = mergeCookies("", login);

  const me = await app.inject({
    method: "GET",
    url: "/api/me",
    headers: { origin: ORIGIN, cookie: jar },
  });
  expect(me.statusCode).toBe(200);
  expect(me.json()).toMatchObject({ email: OTHER_EMAIL });
  expect(me.body).not.toContain(EMAIL);

  const sessions = await app.inject({
    method: "GET",
    url: "/api/me/sessions",
    headers: { origin: ORIGIN, cookie: jar },
  });
  expect(sessions.statusCode).toBe(200);
  expect((sessions.json() as { sessions: unknown[] }).sessions).toHaveLength(1);
  expect(sessions.body).not.toContain(EMAIL);
}, 120_000);
