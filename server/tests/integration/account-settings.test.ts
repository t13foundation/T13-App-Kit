import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../src/app.ts";
import { closeDatabase, getPool } from "../../src/db/client.ts";
import { assertLocalMailpit, assertResettableTestDatabase } from "../setup/test-database.ts";

assertResettableTestDatabase();
const MAILPIT = assertLocalMailpit(process.env.MAILPIT_API ?? "http://127.0.0.1:8025");
const ORIGIN = "http://localhost:8080";
const PASSWORD = "Account-Settings-Test-12345";
let app: FastifyInstance;
function cookies(headers: Record<string, unknown>): string {
  const value = headers["set-cookie"];
  return (Array.isArray(value) ? value : value ? [String(value)] : [])
    .map((item) => String(item).split(";")[0])
    .join("; ");
}
async function login(email: string) {
  const result = await app.inject({
    method: "POST",
    url: "/api/auth/sign-in/email",
    headers: { origin: ORIGIN },
    payload: { email, password: PASSWORD },
  });
  expect(result.statusCode).toBe(200);
  return cookies(result.headers);
}
async function account() {
  const email = `settings-${randomUUID()}@example.test`;
  const signup = await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    headers: { origin: ORIGIN },
    payload: { email, name: "Settings user", password: PASSWORD },
  });
  expect(signup.statusCode).toBe(200);
  for (let attempt = 0; attempt < 30; attempt++) {
    const inbox = (await (await fetch(`${MAILPIT}/api/v1/messages?limit=100`)).json()) as {
      messages: { ID: string; To: { Address: string }[] }[];
    };
    const message = inbox.messages.find((item) => item.To.some((to) => to.Address === email));
    if (message) {
      const body = (await (await fetch(`${MAILPIT}/api/v1/message/${message.ID}`)).json()) as {
        Text: string;
        HTML: string;
      };
      const link = `${body.Text}\n${body.HTML}`
        .match(
          /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/api\/auth\/verify-email[^\s"'<>]+/,
        )?.[0]
        ?.replace(/&amp;/g, "&");
      expect(link).toBeTruthy();
      const url = new URL(link!);
      const verified = await app.inject({ method: "GET", url: url.pathname + url.search });
      expect([200, 302]).toContain(verified.statusCode);
      return { email, jar: await login(email) };
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("verification_mail_not_received");
}
beforeAll(async () => {
  app = await buildApp();
  await app.ready();
  assertResettableTestDatabase();
  await getPool().query("truncate table rate_limit");
});
afterAll(async () => {
  if (app) await app.close();
  await closeDatabase();
});

test("merged account settings persist, isolate owners, revoke sessions and enforce fresh authentication", async () => {
  const owner = await account();
  const other = await account();
  const headers = { origin: ORIGIN, cookie: owner.jar };
  const readMe = await app.inject({ method: "GET", url: "/api/me", headers });
  expect(readMe.statusCode).toBe(200);
  const changed = await app.inject({
    method: "PUT",
    url: "/api/me/profile",
    headers,
    payload: { name: "New profile name" },
  });
  expect(changed.statusCode).toBe(200);
  expect((await app.inject({ method: "GET", url: "/api/me", headers })).json().name).toBe(
    "New profile name",
  );
  expect(
    (await app.inject({ method: "GET", url: "/api/me", headers: { cookie: other.jar } })).json()
      .name,
  ).toBe("Settings user");
  expect(
    (
      await app.inject({
        method: "PUT",
        url: "/api/me/profile",
        headers,
        payload: { name: "No", id: "other-user" },
      })
    ).statusCode,
  ).toBe(422);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: "/api/me/profile",
        headers: { cookie: owner.jar },
        payload: { name: "No origin" },
      })
    ).statusCode,
  ).toBe(403);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: "/api/me/preferences",
        headers,
        payload: { locale: "pl", timezone: "Pretend/Nowhere" },
      })
    ).statusCode,
  ).toBe(422);
  const exported = await app.inject({ method: "POST", url: "/api/me/export", headers });
  expect(exported.statusCode).toBe(200);
  expect(exported.json()).toMatchObject({
    schemaVersion: 1,
    account: { email: owner.email, name: "New profile name" },
  });
  expect(exported.body).not.toContain(other.email);
  for (const secretField of ["token", "password", "backupCodes", "secret"])
    expect(exported.body).not.toContain(secretField);
  const secondJar = await login(owner.email);
  const sessions = (await app.inject({ method: "GET", url: "/api/me/sessions", headers })).json()
    .sessions as { id: string; current: boolean }[];
  const target = sessions.find((item) => !item.current)!;
  const current = sessions.find((item) => item.current)!;
  expect(target).toBeTruthy();
  const foreignSessions = (
    await app.inject({ method: "GET", url: "/api/me/sessions", headers: { cookie: other.jar } })
  ).json().sessions as { id: string }[];
  expect(
    (
      await app.inject({
        method: "DELETE",
        url: `/api/me/sessions/${foreignSessions[0]!.id}`,
        headers,
      })
    ).statusCode,
  ).toBe(404);
  expect(
    (await app.inject({ method: "DELETE", url: `/api/me/sessions/${current.id}`, headers }))
      .statusCode,
  ).toBe(409);
  expect(
    (await app.inject({ method: "DELETE", url: `/api/me/sessions/${target.id}`, headers }))
      .statusCode,
  ).toBe(200);
  expect(
    (await app.inject({ method: "GET", url: "/api/me", headers: { cookie: secondJar } }))
      .statusCode,
  ).toBe(401);
  assertResettableTestDatabase();
  await getPool().query(
    "update session set created_at = now() - interval '6 minutes' where id = $1",
    [current.id],
  );
  for (const url of [
    "/api/me/export",
    "/api/me/sessions/revoke-others",
    "/api/auth/change-password",
    "/api/auth/two-factor/enable",
  ]) {
    const stale = await app.inject({ method: "POST", url, headers, payload: {} });
    expect(stale.statusCode).toBe(403);
    expect(stale.json().error.code).toBe("reauthentication_required");
  }
  for (const url of [
    "/api/auth/update-user",
    "/api/auth/get-session",
    "/api/auth/list-sessions/",
    "/api/auth/revoke-session/",
  ]) {
    expect((await app.inject({ method: "GET", url, headers })).statusCode).toBe(404);
  }
}, 60_000);
