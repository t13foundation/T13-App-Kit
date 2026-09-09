import { expect, test } from "vitest";

import { loadEnv } from "../../src/env.ts";
import { clientLabel } from "../../src/lib/client-label.ts";

const base = {
  APP_URL: "http://localhost:8080",
  AUTH_URL: "http://localhost:3001",
  TRUSTED_ORIGINS: "http://localhost:8080",
  DATABASE_URL: "postgres://postgres@127.0.0.1:5433/appkit",
  BETTER_AUTH_SECRET: "x".repeat(32),
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "1025",
  MAIL_FROM: "no-reply@example.test",
};

test("valid configuration loads", () => {
  expect(loadEnv(base as never).PORT).toBe(3001);
});

test("missing secret refuses startup", () => {
  const { BETTER_AUTH_SECRET: _omit, ...rest } = base;
  expect(() => loadEnv(rest as never)).toThrow(/BETTER_AUTH_SECRET/);
});

test("short secret refuses startup", () => {
  expect(() => loadEnv({ ...base, BETTER_AUTH_SECRET: "short" } as never)).toThrow(/secret_too_short/);
});

test("malformed origin refuses startup", () => {
  expect(() => loadEnv({ ...base, TRUSTED_ORIGINS: "localhost:8080" } as never)).toThrow(/TRUSTED_ORIGINS/);
});

test("production requires https auth url", () => {
  expect(() => loadEnv({ ...base, NODE_ENV: "production" } as never)).toThrow(/https_required/);
});

test("client label never leaks the raw user agent", () => {
  expect(clientLabel("Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120 Safari/537")).toBe("Chrome / macOS");
  expect(clientLabel(null)).toBe("Nieznane urządzenie");
});
