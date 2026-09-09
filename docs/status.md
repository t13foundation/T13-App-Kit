# Implementation status — 2026-09-09

Development increment authored directly through the GitHub workflow, based on
`ccd6ac2d706327e348f34ad0bb9041d0fbb4d2a1`. Existing Lovable code was reviewed and extended,
not discarded. This is not the full App Kit release and has not been deployed to production.

## Code delivered in this increment

- Replaced the branded landing page with real account/settings states on `/`.
- Fixed sign-in and MFA redirects that previously pointed to absent `/account`.
- Profile and preference forms call actual owner-scoped backend updates. Corrected PUT/POST
  and response-type mismatches and added verification/reset callbacks to the client helpers.
- Password change revokes other sessions. Added TOTP enrollment/confirmation and one-time
  recovery-code display in component memory, sanitized session listing and individual revocation.
- Added an account-only JSON export; it is explicitly not a full application-data export.
- Sensitive operations require a session created less than five minutes ago. Re-sign-in
  performs a real password/MFA flow; no client-controlled freshness timestamp exists.
- Added origin/JSON checks to custom writes, an HTTP allowlist over Better Auth, no raw
  library session-list route, and rejection of `trustDevice: true`.
- Proxy has a fixed operator target, incremental body limit, separate Set-Cookie forwarding,
  safe errors and no-store responses. Untrusted forwarding/IP headers are removed.
- Removed mandatory T13 branding, social metadata and the old theme collision. Delivered
  screens use the existing MIT Untitled primitives with white/neutral product overrides.
- Improved form errors, sign-out cache disposal and safe server shutdown. No new dependencies,
  migration rewrites, installations on remote services or GitHub Actions workflows.

## Verification actually performed locally

Node 22.16.0, TypeScript 5.8.3.

1. `node --experimental-strip-types --test tests/core-boundary.test.mjs`: **8 passed, 0 failed**.
   Scope: pure origin/freshness/route rules and proxy behavior with a stub HTTP transport.
   No database, email server, real Better Auth handler or browser was involved.
2. TypeScript `transpileModule` on **17 changed TS/TSX files**: **0 syntax diagnostics**.
   The final DATABASE_URL refinement was also checked separately: 0 syntax diagnostics.
   This is syntax/transpilation, NOT dependency-resolved type checking or an application build.

No GitHub Actions run was started. Existing integration tests were retained and not run.
GitHub Minutes were not used by these local checks.

## Not verified here

The container could not resolve github.com, had no installed project dependencies or cached
packages, and had no PostgreSQL/Docker. A full web build, server typecheck, database/SMTP
journey, cookie behavior in the Lovable preview and visual/browser accessibility checks
therefore remain **not executed**, not passed. They must run in an environment with those
prerequisites before this branch is treated as an accepted release.

There are no automatic Actions triggers. Keep checks local or manually scheduled at the end
of a coherent increment; do not remove the existing security tests to save minutes.

## Remaining implementation scope

Full account deletion, verified change-email flow, complete data lifecycle/consents,
transactional jobs, files, sharing, administration, provenance, full PL/EN translations,
mobile, and later organizations/AI/research remain unfinished.
The language preference currently affects date formatting; account UI remains Polish.
The stock shadcn catalog/dependencies still need a dependency-aware removal; new screens
use only the canonical `kit` catalog. Existing Lovable diagnostics require a separate
review before claiming a completely telemetry-free production bundle.

The proxy intentionally does not trust arbitrary client IP forwarding. Until an authenticated
trusted-ingress configuration is verified, users behind one proxy share its rate-limit bucket.
Do not solve this limitation by accepting arbitrary X-Forwarded-For or disabling CSRF checks.

Upstream MIT provenance remains recorded in `third-party/untitledui-react/SOURCE.md`.
This increment changes kit-authored blocks and the neutral override, not the vendored controls.
