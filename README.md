# T13 App Kit

White-label React/TypeScript starter with a separate Fastify + Better Auth + PostgreSQL API.
This is a development increment, not a production-ready release.

The application UI uses the configurable name from `src/app.config.ts`, white backgrounds
and the MIT Untitled UI primitives under `src/components/kit`. It does not require T13 branding.
Upstream provenance and license are in `third-party/untitledui-react/`.

## Current increment

Actual account screen, profile/preferences persistence, password change, TOTP enrollment,
recovery-code display, session management and account-only JSON export. Existing registration,
verification and reset screens use the real backend. Missing configuration is an error,
not a simulated login. See `docs/status.md` for verification limits and unfinished scope.

## Run

Read `docs/start.md`. Web and API run separately; the web build does not require a live database.
No installer or T13 CLI is needed. There are no automatic GitHub Actions workflows.

## Checks

Run checks locally at the end of a change. The small dependency-free boundary suite is:

```sh
node --experimental-strip-types --test tests/core-boundary.test.mjs
```

It checks pure access rules and the proxy with a stub transport, not PostgreSQL or SMTP.
Existing server integration tests remain under `server/tests/integration`; run those with
isolated PostgreSQL/Mailpit before treating the account journey as verified.
