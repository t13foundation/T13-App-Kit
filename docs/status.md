# Status — reconciled accounts increment

Date: 2026-09-09. This records the merged source, not a production release.
Main and `codex/app-kit-core` are reconciled as described in
`reference/merge-2026-09-09.md`. No migration history, original integration
suite, library license or later main-only fixes were discarded.

## Implemented in this increment

- One white-label account/settings screen on `/account`, with the existing
  component catalog on `/catalog` and a small honest start/status screen.
- Real name editing and preferences persisted for the authenticated owner.
- Password change, TOTP setup/confirmation, recovery codes, real sign-out,
  safe session listing and individual/other-session revocation.
- Account-only export: caller profile and preferences, not materials from
  future modules, credentials, sessions or another person's data.
- Official Better Auth client and server, matching existing locked versions.
- Server-enforced freshness, exact auth HTTP allowlist, trusted peer address
  resolution, origin checks and forced other-session revocation on password
  change. PostgreSQL readiness remains real, not a hard-coded healthy status.
- Fixed-target proxy, bounded streaming request body, abort handling, separate
  Set-Cookie values, no-store responses and safe errors.
- Credential forms submit by POST. Missing backend or rejected request cannot
  produce a successful save/sign-out message.
- Existing local PostgreSQL/Mailpit instructions and test guards retained.

## Verification performed on these merged files

Local environment: Node 22.16.0, TypeScript 5.8.3.

| Check | Result | Scope |
| --- | --- | --- |
| `node --experimental-strip-types --test tests/merge-regression.test.mjs` | 6 passed, 0 failed; exit 0 | Real pure policy/proxy code, stub upstream transport; no database or browser |
| Installed `tsc --noEmit` with strict/indexed-access options on `shared/security-policy.ts`, `src/lib/api-proxy.server.ts`, `src/lib/api.ts` | exit 0 | Three dependency-free modules, not the complete application |
| TypeScript `transpileModule` on 17 authored TS/TSX files | 0 syntax diagnostics | Syntax/transpilation only, not dependency-resolved type checking |

The current container cannot resolve package hosts and has no project
node_modules, PostgreSQL, Docker or Bun. A full web build, full typechecks and
PostgreSQL/SMTP tests were therefore not run locally. A limited remote final
check, if executed, must be recorded separately with its run ID and result.
Never convert a missing result into a pass.

Before this merge, main at `69ce1b7` contained a Lovable-authored report of a
successful web build, typechecks, 8 unit tests, 5 integration tests and selected
browser checks. Those are historical results for that earlier snapshot; they
are NOT a verification of the newly merged code.

## Configuration and remaining boundaries

The hosted preview still requires a running API/PostgreSQL/SMTP and a private
`API_INTERNAL_URL`. Pushing source does not configure or deploy those services.
Without a backend, the catalog remains available and account requests fail
explicitly. Real SMTP deliverability and the actual hosting reverse-proxy
configuration remain unverified here.

Full PL/EN UI, verified email changes, account deletion, consents/full data
lifecycle, files, sharing, organizations, billing, AI, research and native
mobile remain separate scope. Locale currently controls formatting, not a
fully translated account interface. Default shadcn leftovers remain unused by
new screens; no claim of dependency pruning or full accessibility audit is made.

No production deployment, publication or visibility change. Site Kit/Sitecase
were not changed. Main CI remains manual-only, with no push/PR triggers.
