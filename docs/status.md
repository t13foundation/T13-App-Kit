# Status — increment 1 (accounts core)

Date: 2026-09-09. Scope of this increment: white-label web shell, MIT UI
catalog, and the full core account path with a real Fastify/PostgreSQL/
Drizzle/Better Auth backend. This is not a 1.0 release.

## Done and verified in this sandbox

Commands were run without pipes that hide exit codes.

| Check | Command | Result |
| --- | --- | --- |
| Source integrity | `node scripts/check-source-integrity.mjs` | exit 0 |
| Web build | `bun run build` | exit 0 |
| Web typecheck | `bunx tsgo --noEmit -p tsconfig.json` | exit 0 |
| Server typecheck | `cd server && bun run typecheck` | exit 0 |
| Unit tests | `cd server && bunx vitest run tests/unit` | 8/8 passed, exit 0 |
| Integration tests | `cd server && bunx vitest run tests/integration` | 5/5 passed, exit 0 |

The integration run used a real PostgreSQL 17 (`127.0.0.1:5433`, database
`appkit_test`) and a real Mailpit SMTP server (`127.0.0.1:1025`) started
locally in the sandbox. No mock replaced either service. Covered:

- sign-up, private access refused before verification, verification mail read
  from Mailpit, confirmation, login, `/me`, preferences persisted in the
  database, TOTP MFA enrolment and confirmation, logout, login with the second
  factor, session list, revoking other sessions and the revoked session losing
  access;
- password reset by email, which still requires the second factor;
- a backup code working exactly once;
- another account never seeing the first account's data;
- exact negative statuses: 401 anonymous, 403 foreign origin, 403 mutation
  without `Origin`, 404 on `/api/auth/list-sessions`, `/token`, the revoke
  paths and their trailing-slash variants;
- session list responses contain no token, IP address or raw user agent.

### Browser check (Chromium, desktop 1280 and mobile 390)

- `/`, `/catalog`, `/sign-in` render, titles are set, no console errors on
  desktop.
- With no backend configured, signing in shows a readable error ("Backend nie
  jest skonfigurowany…") after a real 503 from the proxy. There is no fake
  success anywhere.
- Auth forms use `method="post"`, so a submit before hydration can never put
  the password into the URL. (This was found and fixed during the check.)
- Known cosmetic issue: React Aria inputs log a hydration attribute mismatch
  (`caret-color`) on first paint. No functional impact; not yet fixed.

## Requires configuration (works, but needs local/production values)

- `server/.env` — `BETTER_AUTH_SECRET`, `DATABASE_URL`, SMTP and origins. The
  API refuses to start with a placeholder, malformed origin, or non-HTTPS
  public origin in production.
- `API_INTERNAL_URL` for the web process; without it the app honestly reports
  that the backend is unavailable.
- `server/.env.test` (git-ignored) plus `ALLOW_TEST_DATABASE_RESET=true` and a
  local `appkit_test` database for the integration suite.
- `compose.yaml` provides local PostgreSQL and Mailpit; it was not executed in
  this sandbox (Docker is unavailable) — the equivalent services were started
  as plain local processes instead.

## Pending (not implemented, deliberately no placeholder UI)

- Editing profile name and email address; account deletion; data export and
  consents. The corresponding library shortcuts are blocked server-side.
- Full PL/EN interface: screens are Polish only today. Locale is stored per
  user, but no translation layer exists yet, so this is **not** PL/EN.
- Files, sharing, admin, provenance, organizations, billing, AI, research, and
  the Expo/React Native client.
- No RLS, no multi-tenant model, no production deployment, nothing published.

## Not verified

- Behaviour behind a real reverse proxy with `TRUSTED_PROXIES` set.
- Deliverability with a real SMTP provider (only Mailpit was used).
- Production build of the API on a real host; only typecheck and tests ran.
