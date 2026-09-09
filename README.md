# T13 App Kit

White-label React/TypeScript starter with a separate Fastify, Better Auth, PostgreSQL and Drizzle API.
Current version: `0.1.0-dev`. This is the accounts-core increment, not the complete App Kit 1.0.

The product name comes from `src/app.config.ts`. The interface uses a white background,
neutral grays and real Untitled UI MIT primitives in `src/components/kit`.
The upstream license and source version remain in `third-party/untitledui-react`.

## Included

- Registration, verified email, sign-in/out, password recovery/reset and TOTP with recovery codes.
- `/account`: profile name, regional preferences, password, MFA, individual/other-session revocation and account-only JSON export.
- `/catalog`: component preview without a backend. Missing configuration is a real error, not a simulated account.
- Official Better Auth client, fixed-target same-origin API proxy, server-side owner/origin/freshness checks and no-store responses.
- Preserved migration history, local PostgreSQL/Mailpit setup and guarded integration tests.

Read `docs/start.md` to run web and API separately. `docs/status.md` records the actual verification
of the merged code. Module boundaries are documented in `docs/modules`.

## Development

Code is maintained directly in GitHub and synchronizes to the connected Lovable project.
There is no installer, custom CLI, mandatory T13 cloud service or automatic production deployment.
GitHub Actions on main is manual-only. Keep checks small and run them at the end of a change.

Complete translations, verified email changes, account deletion, full application-data lifecycle,
files, organizations and the native mobile client are later scope; none is implied by this increment.
