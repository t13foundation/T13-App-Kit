import { expect, test } from "vitest";

import { loadEnv } from "../../src/env.ts";
import { clientLabel } from "../../src/lib/client-label.ts";
import { assertResettableTestDatabase } from "../setup/test-database.ts";

/** A realistic, non-placeholder secret (32+ chars, no change-me/xxxx pattern). */
const SECRET = "8f3b1d7ac05e42968b7fd1c4a09e3b57d2610fae";

const base = {
  APP_URL: "http://localhost:8080",
  // The auth URL is the PUBLIC proxy origin, never the internal backend port.
  AUTH_URL: "http://localhost:8080",
  TRUSTED_ORIGINS: "http://localhost:8080",
  DATABASE_URL: "postgres://postgres@127.0.0.1:5433/appkit",
  BETTER_AUTH_SECRET: SECRET,
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "1025",
  MAIL_FROM: "no-reply@example.test",
};

test("valid configuration loads", () => {
  const cfg = loadEnv(base as never);
  expect(cfg.PORT).toBe(3001);
  expect(cfg.AUTH_URL).toBe("http://localhost:8080");
  expect(cfg.TRUSTED_PROXIES).toEqual([]);
});

test("missing secret refuses startup", () => {
  const { BETTER_AUTH_SECRET: _omit, ...rest } = base;
  expect(() => loadEnv(rest as never)).toThrow(/BETTER_AUTH_SECRET/);
});

test("short secret refuses startup", () => {
  expect(() => loadEnv({ ...base, BETTER_AUTH_SECRET: "short" } as never)).toThrow(/secret_too_short/);
});

test("placeholder secret refuses startup", () => {
  expect(() =>
    loadEnv({ ...base, BETTER_AUTH_SECRET: `change-me-${"0".repeat(32)}` } as never),
  ).toThrow(/placeholder_secret_not_allowed/);
});

test("malformed origin refuses startup", () => {
  expect(() => loadEnv({ ...base, TRUSTED_ORIGINS: "localhost:8080" } as never)).toThrow(/TRUSTED_ORIGINS/);
  expect(() => loadEnv({ ...base, TRUSTED_ORIGINS: "https://*.example.com" } as never)).toThrow(/TRUSTED_ORIGINS/);
  expect(() => loadEnv({ ...base, APP_URL: "https://user:pw@example.com" } as never)).toThrow(/APP_URL/);
  expect(() => loadEnv({ ...base, APP_URL: "https://example.com/app?x=1" } as never)).toThrow(/APP_URL/);
});

test("production requires https auth url", () => {
  expect(() => loadEnv({ ...base, NODE_ENV: "production" } as never)).toThrow(/https_required/);
});

test("client label never leaks the raw user agent", () => {
  expect(clientLabel("Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120 Safari/537")).toBe("Chrome / macOS");
  expect(clientLabel(null)).toBe("Nieznane urządzenie");
});

test("destructive test guard refuses anything but a local appkit_test database", () => {
  const ok = {
    NODE_ENV: "test",
    ALLOW_TEST_DATABASE_RESET: "true",
    DATABASE_URL: "postgres://postgres@127.0.0.1:5433/appkit_test",
  };
  expect(assertResettableTestDatabase(ok as never).pathname).toBe("/appkit_test");

  expect(() => assertResettableTestDatabase({ ...ok, NODE_ENV: "development" } as never)).toThrow(/NODE_ENV/);
  expect(() => assertResettableTestDatabase({ ...ok, ALLOW_TEST_DATABASE_RESET: "" } as never)).toThrow(
    /ALLOW_TEST_DATABASE_RESET/,
  );
  // The development database must never be truncated.
  expect(() =>
    assertResettableTestDatabase({ ...ok, DATABASE_URL: "postgres://postgres@127.0.0.1:5433/appkit" } as never),
  ).toThrow(/refusing database 'appkit'/);
  expect(() =>
    assertResettableTestDatabase({ ...ok, DATABASE_URL: "postgres://postgres@db.example.com/appkit_test" } as never),
  ).toThrow(/non-local/);
});
