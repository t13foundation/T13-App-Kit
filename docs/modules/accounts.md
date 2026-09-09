# Module card: accounts (core)

Implementation: web + API on Better Auth 1.7.3. Verification is recorded separately in `docs/status.md`.

## Included

Registration with verified email; sign-in/out; resend verification; emailed password reset;
TOTP enrollment/confirmation and single-use recovery codes; profile-name and preference persistence;
password change with other-session revocation; safe session listing, individual and other-session revocation;
account-only export of the caller's profile and preferences.

The official client remains in `src/lib/auth-client.ts`. `src/lib/account.ts` wraps it and the
custom endpoints; authentication is not a hand-written protocol. Sensitive endpoints require a
session created within five minutes. The backend refuses trustDevice and blocks unlisted raw
Better Auth endpoints, including raw session lists and account-lifecycle shortcuts.

## Files and dependencies

- `src/routes/account.tsx`, `src/components/kit/blocks/account-settings.tsx` and the existing authentication screens.
- `src/lib/{account,api,auth-client}.ts`, `src/lib/api-proxy.server.ts`, `src/routes/api.$.ts`.
- `shared/contracts.ts`, `shared/security-policy.ts` (browser-safe contracts/pure rules).
- `server/src/{app,auth,env,main}.ts`, database schema and unchanged `server/drizzle` history, SMTP/templates.
- Existing Better Auth/Drizzle/Fastify/PostgreSQL/React Email/Zod dependencies; no added package required for the merge.

## Configuration and tests

Use ignored `server/.env` plus the server-only web variable API_INTERNAL_URL; see `docs/start.md`.
Tests: `tests/core-boundary.test.mjs`, `tests/merge-regression.test.mjs`, existing server unit/account
integration tests and `server/tests/integration/account-settings.test.ts`.

## Boundaries

Name editing is implemented; email-change verification, account deletion, consents and full
application-data export are not. Locale currently controls regional formats; the account screens
are Polish, not fully translated. Mobile, organizations, files and other modules are separate scope.

## Remove / restore

Detach account screens, helpers and API handlers together, including links from the shell and
catalog. Do not delete the database or applied migrations. Restore compatible versions from the
repository, reconcile local changes, regenerate routes and perform the relevant end-of-change checks.
