import test from "node:test";
import assert from "node:assert/strict";
import {
  authRoutePolicy,
  mutationProblem,
  isFreshSession,
  canonicalOrigin,
  MAX_API_BODY_BYTES,
} from "../shared/security-policy.ts";
import { proxyApi } from "../src/lib/api-proxy.server.ts";

const origin = "https://app.example.test";
const backend = "http://127.0.0.1:3001";
const request = (body = "{}", extra = {}) =>
  new Request(`${origin}/api/me/profile`, {
    method: "PUT",
    headers: { origin, "content-type": "application/json" },
    body,
    ...extra,
  });
test("exact route allowlist rejects encoded, slash and case aliases", () => {
  for (const path of [
    "/get-session",
    "/list-sessions",
    "/list-sessions/",
    "/revoke-session",
    "/update-user",
    "/two-factor/enable/",
    "/two-factor/%65nable",
    "/two-factor/ENABLE",
  ]) {
    assert.equal(authRoutePolicy("POST", path), null);
    assert.equal(authRoutePolicy("GET", path), null);
  }
  assert.equal(authRoutePolicy("POST", "/two-factor/enable"), "fresh");
  assert.equal(authRoutePolicy("POST", "/change-password"), "fresh");
});
test("freshness and origins fail closed", () => {
  const now = Date.parse("2026-09-09T10:00:00Z");
  assert.equal(isFreshSession(new Date(now - 299999), now), true);
  for (const time of [new Date(now - 300000), new Date(now + 1), "invalid"])
    assert.equal(isFreshSession(time, now), false);
  for (const value of [
    "null",
    "https://*.example.test",
    "https://u:p@app.example.test",
    "https://app.example.test/x",
  ])
    assert.equal(canonicalOrigin(value), null);
  assert.equal(
    mutationProblem("POST", undefined, "application/json", [origin]),
    "origin_not_allowed",
  );
  assert.equal(mutationProblem("POST", origin, "text/plain", [origin]), "unsupported_content_type");
});
test("proxy preserves cookies and safe headers but never forwards caller-selected IPs", async () => {
  const input = request("{}", {
    headers: {
      origin,
      "content-type": "application/json",
      cookie: "session=test",
      "x-app-client-ip": "evil",
      "x-forwarded-for": "evil",
      "x-real-ip": "evil",
      forwarded: "evil",
    },
  });
  const response = await proxyApi(input, backend, async (url, init) => {
    assert.equal(url, `${backend}/api/me/profile`);
    for (const header of ["x-app-client-ip", "x-forwarded-for", "x-real-ip", "forwarded"])
      assert.equal(init.headers.get(header), null);
    assert.equal(init.headers.get("cookie"), "session=test");
    assert.equal(init.headers.get("origin"), origin);
    const headers = new Headers({
      "cache-control": "public, max-age=999",
      "content-type": "application/json",
    });
    headers.append("set-cookie", "a=1; HttpOnly");
    headers.append("set-cookie", "b=2; HttpOnly");
    return new Response("{}", { headers });
  });
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
});
test("oversized streaming request is cancelled before upstream fetch", async () => {
  let cancelled = false,
    called = false;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(MAX_API_BODY_BYTES));
      controller.enqueue(new Uint8Array(1));
    },
    cancel() {
      cancelled = true;
    },
  });
  const response = await proxyApi(request(stream, { duplex: "half" }), backend, async () => {
    called = true;
    return new Response("{}");
  });
  assert.equal(response.status, 413);
  assert.equal(called, false);
  assert.equal(cancelled, true);
});
test("abort while reading a stalled body cancels it instead of waiting forever", async () => {
  const controller = new AbortController();
  let cancelled = false;
  const stream = new ReadableStream({
    cancel() {
      cancelled = true;
    },
  });
  const promise = proxyApi(
    request(stream, { duplex: "half", signal: controller.signal }),
    backend,
    async () => {
      throw Error("must not call upstream");
    },
  );
  controller.abort();
  const response = await promise;
  assert.equal(response.status, 504);
  assert.equal(cancelled, true);
});
test("missing backend, foreign origin and failed transport cannot return false success", async () => {
  let calls = 0;
  const fetcher = async () => {
    calls++;
    throw Error("secret SQL token reset URL");
  };
  assert.equal((await proxyApi(request(), undefined, fetcher)).status, 503);
  assert.equal(
    (
      await proxyApi(
        request("{}", { headers: { origin: "https://evil.example.test" } }),
        backend,
        fetcher,
      )
    ).status,
    403,
  );
  assert.equal(calls, 0);
  const failed = await proxyApi(request(), backend, fetcher);
  assert.equal(failed.status, 502);
  assert.equal((await failed.text()).includes("secret"), false);
});
