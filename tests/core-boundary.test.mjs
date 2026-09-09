// Small LOCAL unit suite. No dependency installation, PostgreSQL, SMTP or Actions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalOrigin, isTrustedOrigin, isFreshSession, FRESH_SESSION_MS,
  mutationProblem, authRoutePolicy, MAX_API_BODY_BYTES } from '../shared/security-policy.ts';
import { proxyApi } from '../src/lib/api-proxy.server.ts';

const publicOrigin = 'https://app.example.test';
const backend = 'http://127.0.0.1:3001';
const blockedFetch = async () => { throw new Error('upstream_must_not_be_called'); };
const request = (path = '/api/me/preferences', extra = {}) => new Request(`${publicOrigin}${path}`, {
  method: 'PUT', headers: { origin: publicOrigin, 'content-type': 'application/json' }, body: '{}', ...extra,
});

test('origins are exact and reject credentials, wildcard, null and paths', () => {
  assert.equal(canonicalOrigin('https://APP.example.test/'), publicOrigin);
  for (const origin of ['null', 'https://*.example.test', 'https://user:secret@app.example.test', 'https://app.example.test/x', 'file:///etc/passwd']) {
    assert.equal(canonicalOrigin(origin), null);
  }
  assert.equal(isTrustedOrigin('https://app.example.test.evil.test', [publicOrigin]), false);
});

test('mutations require a trusted origin and reject simple form submissions', () => {
  assert.equal(mutationProblem('PUT', undefined, 'application/json', [publicOrigin]), 'origin_not_allowed');
  assert.equal(mutationProblem('POST', publicOrigin, 'text/plain', [publicOrigin]), 'unsupported_content_type');
  assert.equal(mutationProblem('POST', publicOrigin, 'application/json; charset=utf-8', [publicOrigin]), null);
});

test('freshness expires after five minutes and never accepts a future timestamp', () => {
  const now = Date.parse('2026-09-09T10:00:00Z');
  assert.equal(isFreshSession(new Date(now - FRESH_SESSION_MS + 1), now), true);
  assert.equal(isFreshSession(new Date(now - FRESH_SESSION_MS), now), false);
  assert.equal(isFreshSession(new Date(now + 1), now), false);
  assert.equal(isFreshSession('invalid', now), false);
});

test('raw library session endpoints are not exposed through the HTTP allowlist', () => {
  for (const path of ['/list-sessions', '/get-session', '/revoke-session', '/delete-user', '/update-user']) {
    assert.equal(authRoutePolicy('GET', path), null);
    assert.equal(authRoutePolicy('POST', path), null);
  }
  assert.equal(authRoutePolicy('POST', '/two-factor/enable'), 'fresh');
  assert.equal(authRoutePolicy('POST', '/sign-in/email'), 'public');
  assert.equal(authRoutePolicy('GET', '/verify-email'), 'public');
});

test('an unconfigured proxy does not simulate successful API access', async () => {
  const result = await proxyApi(request(), undefined, blockedFetch);
  assert.equal(result.status, 503);
  assert.equal((await result.json()).error.code, 'api_not_configured');
});

test('proxy preserves separate cookies, fixes target and strips spoofed forwarding headers', async () => {
  let called = false;
  const input = request('/api/me/preferences?target=https://evil.test', {
    headers: { origin: publicOrigin, 'content-type': 'application/json', cookie: 'session=test',
      'x-forwarded-for': '1.2.3.4', 'x-forwarded-host': 'evil.test', forwarded: 'host=evil.test' },
  });
  const result = await proxyApi(input, backend, async (target, init) => {
    called = true;
    assert.equal(target, `${backend}/api/me/preferences?target=https://evil.test`);
    assert.equal(init.headers.get('x-forwarded-for'), null);
    assert.equal(init.headers.get('forwarded'), null);
    assert.equal(init.headers.get('x-forwarded-host'), null);
    assert.equal(init.headers.get('origin'), publicOrigin);
    assert.equal(init.headers.get('cookie'), 'session=test');
    assert.equal(init.redirect, 'manual');
    const headers = new Headers({ 'content-type': 'application/json' });
    headers.append('set-cookie', 'session=one; HttpOnly; Path=/');
    headers.append('set-cookie', 'mfa=two; HttpOnly; Path=/');
    return new Response('{}', { headers });
  });
  assert.equal(called, true);
  assert.equal(result.headers.getSetCookie().length, 2);
  assert.equal(result.headers.get('cache-control'), 'private, no-store');
});

test('cross-origin writes and oversized bodies are rejected before upstream access', async () => {
  let calls = 0;
  const fetcher = async () => { calls++; return new Response('{}'); };
  const foreign = await proxyApi(request('/api/me/preferences', { headers: { origin: 'https://evil.test', 'content-type': 'application/json' } }), backend, fetcher);
  assert.equal(foreign.status, 403);
  const oversized = await proxyApi(request('/api/me/preferences', { body: 'x'.repeat(MAX_API_BODY_BYTES + 1) }), backend, fetcher);
  assert.equal(oversized.status, 413);
  assert.equal(calls, 0);
});

test('network failures return a safe error without the upstream exception contents', async () => {
  const result = await proxyApi(request(), backend, async () => { throw new Error('secret-and-private-url'); });
  assert.equal(result.status, 502);
  assert.equal((await result.json()).error.code, 'api_unreachable');
});
