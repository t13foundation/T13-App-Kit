# Status — reconciled accounts increment

Date: 2026-09-09. Source merge: `8d280484d1c1d764a9890aaf17bfee47ed86d28a`.
PR #1 is merged and closed. Main and `codex/app-kit-core` were reconciled as
recorded in `reference/merge-2026-09-09.md`, preserving both histories, the
existing migration history, MIT license and the later main-only fixes.
This is the accounts-core increment, not the complete App Kit 1.0 or a production deployment.

## Implemented

- One white-label account/settings screen on `/account`, the existing component
  catalog on `/catalog`, and a small honest start/status screen.
- Real name editing and regional preferences persisted for the authenticated owner.
- Password change, TOTP setup/confirmation, recovery codes, real sign-out,
  safe session listing, individual and other-session revocation.
- Account-only export: caller profile and preferences, not materials from future
  modules, credentials, session tokens or another person's data.
- Official Better Auth client and server with existing locked versions.
- Server-enforced freshness, exact auth HTTP allowlist, trusted peer-address
  resolution, origin checks and forced other-session revocation on password change.
- Fixed-target proxy, bounded streaming body, abort handling, separate Set-Cookie
  values, no-store responses, safe errors and actual PostgreSQL readiness.
- Credential forms submit by POST; failed requests do not produce fake success.
- Local PostgreSQL/Mailpit setup, guarded original tests and focused merged regressions.

## Final verification — completed successfully

GitHub Actions run: `34341410631`; job: `102432812839`; attempt: 1.
Evidence: https://github.com/t13foundation/T13-App-Kit/actions/runs/34341410631

The check ran on `checks/accounts-merge-20260909`, commit
`4aeaec1fc50816b73cc85d361f72ddc30b744015`. Its application source, server,
shared code and dependency lockfiles are identical to main merge `8d280484`.
The only added file is the isolated validation workflow. That workflow was
NOT installed on main. This subsequent status update changes documentation only.

One Ubuntu job, no matrix and no reruns. Runner log: approximately
10:39:48–10:40:58 UTC (70 seconds including service setup/cleanup),
with an 8-minute timeout. Main CI remains manual-only.

Environment: Node 22.23.2, Bun 1.4.2, locked TypeScript 5.9.3,
PostgreSQL 17.11 and a disposable Mailpit SMTP server. No production credentials
or real customer data were used. Both service containers were removed afterward.

| Check | Actual result |
| --- | --- |
| Source integrity | 25 required files present/tracked; no tracked environment files; exit 0 |
| `node --experimental-strip-types --test tests/*.test.mjs` | 14 passed, 0 failed; exit 0 |
| Web `bun install --frozen-lockfile` | Passed without changing the lockfile |
| `bun run build` | Client, SSR and Nitro build passed; exit 0 |
| `./node_modules/.bin/tsc --noEmit -p tsconfig.json` | Full web typecheck passed; exit 0 |
| API `bun install --frozen-lockfile` | Passed without changing the lockfile |
| API `bun run typecheck` | Full API/test-code typecheck passed; exit 0 |
| `bun run db:migrate` | Existing migrations applied to dedicated appkit_test; exit 0 |
| API `vitest run` | 3 files, 14 tests passed; exit 0: 8 unit + 6 real PostgreSQL/SMTP integration tests |
| Final outcome gate | build=success, web_types=success, api_types=success, tests=success |

The six integration tests include the original five account/MFA processes and
one merged profile/export/session scenario with multiple assertions. They verify
name persistence, owner isolation, account export without secrets, individual
session revocation, stale-session rejection and blocked raw library routes.
These are real API/PostgreSQL/SMTP tests using Fastify injection, not browser E2E.
The 14 boundary tests use a stub upstream transport, not a database.

Non-blocking toolchain warnings were retained: Vite tsconfig-paths migration,
Nitro code-splitting option, Fastify request-logging deprecation and older action
runtime declarations. Tests were not weakened to hide warnings or failures.

## Earlier local checks of the merged code

Node 22.16.0 / TypeScript 5.8.3: six focused policy/proxy regressions passed;
a strict typecheck of three dependency-free modules passed; 17 authored TS/TSX
files had no isolated syntax diagnostics. The full checks above supersede the
local environment's missing dependencies and database. Older Lovable results
are not being substituted for verification of this merge.

## Configuration and remaining scope

The hosted preview still needs a running API/PostgreSQL/SMTP and private
API_INTERNAL_URL. Pushing source does not configure or deploy those services.
Without a backend, account operations fail explicitly; the component catalog
is independent of it. Real external email deliverability, hosted HTTPS/cookies,
the actual ingress configuration and complete browser E2E remain unverified.

Full PL/EN UI, verified email changes, account deletion, consents/full data
lifecycle, files, sharing, organizations, billing, AI, research and native
mobile remain separate scope. Locale controls formatting, not all interface
translations. Stock shadcn leftovers remain unused by the new screens;
no claim of complete dependency pruning or accessibility audit is made.

No production deployment, publication or visibility change. Site Kit/Sitecase
were not changed. Main has no automatic push/PR test trigger.
