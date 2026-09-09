# Module card: security (core)

Status: enabled. Applies to every account endpoint.

## Rules enforced in code

- Email verification is required before any private data is read or written.
- Sessions live in HttpOnly cookies, `Secure` whenever the public origin is
  HTTPS (including previews), `SameSite=Lax`. No token is ever stored in
  `localStorage`.
- No session cookie cache: a revoked session stops working immediately.
- Strict trusted-origin list; unsafe methods on `/api/me*` additionally require
  an `Origin` header from that list — CORS alone does not stop cross-site posts.
- Client-supplied address headers (`Forwarded`, `X-Forwarded-*`, `X-Real-IP`,
  `CF-Connecting-IP`, ...) are deleted both in the web proxy and in the API.
  The API passes Better Auth exactly one header it sets itself from Fastify's
  resolved `request.ip`, so a configured proxy list never means "trust the
  sender".
- Library routes that would bypass these rules return 404, including with a
  trailing slash: `/list-sessions`, `/token`, `/revoke-session(s)`,
  `/revoke-other-sessions`, `/delete-user`, `/change-email`,
  `/two-factor/view-backup-codes`.
- `trustDevice` is refused server-side, not merely omitted from the UI.
- Sensitive operations require a session authenticated within 5 minutes
  (`freshAge: 300`).
- Rate limits: a coarse per-IP limit plus per-endpoint rules for sign-in,
  sign-up, password reset, verification mail and both MFA verifications.
- Logging: method, route, status and duration only. Never bodies, headers,
  cookies, tokens, reset URLs or profile content; the library logger is off.
  Errors return a generic code — no SQL, secrets or internal details.
- All account and proxy responses are `Cache-Control: no-store`.
- Request bodies are limited (64 KB) and the proxy aborts an oversized upload
  while reading, instead of buffering it first.
- No impersonation, no admin bypass, no public delete shortcut.

## Pending

Account deletion, export and consents are deliberately not implemented rather
than added as an unsafe shortcut.

## Tests

Anonymous access (401), foreign origin (403), missing origin on a mutation
(403), direct `list-sessions`/`token`/revoke paths (404), backup code reuse,
another account seeing no foreign data, session list containing no token, IP or
raw user agent.
