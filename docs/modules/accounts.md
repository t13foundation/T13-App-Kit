# Module card: accounts (core)

Status: enabled. Complete web + API account path built on Better Auth 1.7.3.

## What works

- Sign-up with email verification (verification mail is sent on sign-up).
- Unverified accounts cannot sign in and cannot reach any private endpoint.
- Sign-in, sign-out, resend verification.
- Forgotten password and reset from the emailed link. All sessions are revoked
  on reset, so MFA can never be skipped through a reset.
- TOTP MFA with explicit confirmation and single-use backup codes.
- Second-factor screen during sign-in; `trustDevice` is refused server-side.
- Session list (device label only) and "revoke other sessions", which requires a
  session authenticated within the last 5 minutes.
- Language (pl/en) and time zone stored in the database, not in the browser.

## Pending (not implemented, no fake UI)

- Editing profile name/email, account deletion, data export, consents, mobile
  client. The library shortcuts (`/delete-user`, `/change-email`) are disabled
  because there is no data lifecycle behind them yet.

## Files

- `server/src/auth.ts` — Better Auth configuration (2FA, rate limits, cookies)
- `server/src/app.ts` — Fastify app, `/api/me*`, origin checks, auth catch-all
- `server/src/db/schema.ts`, `server/drizzle/*` — schema and migrations
- `server/src/mail/*` — React Email templates and SMTP transport
- `shared/contracts.ts` — request/response contracts (no secrets, no Node deps)
- `src/routes/sign-in|sign-up|verify-email|forgot-password|reset-password|two-factor|account.tsx`
- `src/lib/auth-client.ts`, `src/lib/account.ts`, `src/lib/api.ts`
- `src/routes/api.$.ts` — narrow same-origin proxy to one fixed backend

## Dependencies

`better-auth`, `@better-auth/drizzle-adapter`, `drizzle-orm`, `pg`, `fastify`,
`@fastify/cors`, `@fastify/rate-limit`, `nodemailer`, `@react-email/*`, `zod`.

## Configuration

`server/.env` (see `server/.env.example`) and `API_INTERNAL_URL` for the web app.

## Tests

`server/tests/unit/env.test.ts`, `server/tests/integration/accounts.test.ts`.

## Removing / restoring

Delete the route files above and the `/api/me*` handlers; keep the database and
applied migrations untouched. Restore by checking the files back out of a
previous version — no data has to be dropped in either direction.
