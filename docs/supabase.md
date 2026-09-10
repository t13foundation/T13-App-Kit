# Supabase account and private Notes slice

This is the technical contract for WBS-APP1-01. The accepted target is TanStack Start + React + Supabase + Cloudflare. `/notes` contains the new signup, six-digit email confirmation, login, local logout and Notes flow. The existing account routes and `server/` remain the isolated legacy implementation until replacement acceptance. Their existing guides are not instructions for the Supabase path.

## Delivery boundary

The slice's current Issue/PR is authoritative for execution evidence. A source implementation is not acceptance. The versioned migration `supabase/migrations/20260910002051_private_notes.sql` is applied by the local CLI, and `src/lib/supabase/database.types.ts` is generated from that running schema. The pnpm lockfile, generated route tree, installed-dependency checks, direct API evidence and browser evidence are merge blockers. Do not merge it by bypassing frozen-lockfile checks, removing tests or enabling automatic CI.

## Local preparation

Use Node 22.16.0 (`.node-version`) and pnpm 10.34.5 (`packageManager`). Supabase CLI is pinned to 2.113.0 and the browser SDK to 2.111.0. Docker is required for local Supabase. The legacy `server/` is intentionally excluded from the new workspace. No hosted project, production credentials, real email recipient or paid resource is required for local validation.

The reproducible completion sequence below is the accepted local runbook:

```sh
# Resolve dependencies in an environment with package-registry access.
pnpm install --frozen-lockfile
pnpm exec supabase --help
pnpm exec supabase migration new --help
pnpm exec supabase start --help
pnpm exec supabase gen types --help

# Inspect shared Docker/Colima first. Use a disposable profile when the default
# runtime is shared; never prune or reset unrelated containers or volumes.
docker context ls
colima list
colima start --profile t13-apprev1 --cpu 2 --memory 4 --disk 40 --activate=false
export DOCKER_HOST="unix://${HOME}/.colima/t13-apprev1/docker.sock"
```

The migration already exists in this repository and must not be duplicated. Start the **disposable
local** instance, apply the migration, then inspect history and lint the schema:

```sh
pnpm exec supabase start
pnpm exec supabase db reset
pnpm exec supabase migration list --local
pnpm exec supabase db lint --local --schema public --fail-on warning
```

The explicit grants, column privileges, private schema and function permissions are
security-critical. Do not replace the migration with an automatic schema diff, use remote
`link`/`db push`, or point this runbook at a customer database.

Generate types into a temporary file after applying the migration and replace the tracked file only
if the command succeeds:

```sh
pnpm exec supabase gen types typescript --local > /tmp/app-kit-database.types.ts
cmp -s /tmp/app-kit-database.types.ts src/lib/supabase/database.types.ts || \
  cp /tmp/app-kit-database.types.ts src/lib/supabase/database.types.ts
```

Commit the real `pnpm-lock.yaml`, generated migration and generated types. The old Bun lockfile
under `server/` remains the rollback boundary and must not be removed.

Copy `.env.example` to an ignored local environment file only when that file does not already
exist; never overwrite a configured environment. Set `VITE_SUPABASE_URL` to the local API origin
and `VITE_SUPABASE_PUBLISHABLE_KEY` to its public key. The local CLI may provide a legacy `anon`
JWT instead of an `sb_publishable_` key. Never copy a secret/service-role key into any `VITE_*`
variable. Both missing variables leave the introduction/catalog usable; partial or unsafe
configuration fails explicitly. Vite checks this before emitting assets as well as at browser
initialization.

```sh
if [ -e .env ]; then
  echo "Keeping existing .env; review it without overwriting it."
else
  cp .env.example .env
fi
```

Run the web app with `pnpm dev -- --host 127.0.0.1 --port 3000`, then open `/notes`. The Vite/TanStack plugin must generate the actual route tree; do not hand-edit `src/routeTree.gen.ts`. Local email confirmations are enabled, tokens expire after 600 seconds, and the custom template contains a code rather than an authentication URL. Mailpit is configured on port 54324. Hosted email/Resend/Turnstile setup is outside this first slice.

## Data and authorization

Every Notes operation uses the caller's Supabase identity, never a service key. RLS restricts all four CRUD operations to `auth.uid()` ownership and a live, verified, non-banned Auth record. The narrow private definer function reads only whether the current identity satisfies that condition. It accepts no arbitrary user ID, uses a fixed empty search path, and has no PUBLIC execute permission. `app_private` is not an exposed API schema. User metadata is not an authorization source.

Column grants prevent API clients from changing identity, owner or timestamps. Database constraints reject empty/overlong titles and oversized bodies even when the UI is bypassed. Owner/time ordering is indexed. UI edit/delete requests compare the original update timestamp; zero affected rows are conflicts, not success. Failed or interrupted requests may have an unknown outcome, so the UI tells the user to reload before retrying instead of falsely reporting a completed write.

The browser binds each query/mutation to the identity that initiated it. On an account switch it discards the old component's drafts/results, and stale reads are aborted. That extra filter protects in-flight UI behavior but is not the authorization boundary: the direct API test intentionally bypasses the UI and its filters.

## Session and SSR contract

The Supabase client is created only in a browser effect. Its SDK-managed session persists in browser storage; there is no custom token store or authenticated server singleton. `getSession()` supplies display state only. The Data API/PostgreSQL policies perform authorization. No private Notes rows or user identity are serialized into SSR; `/notes` receives private/no-store and no-referrer headers. This is a client-authenticated slice, not a claim that protected SSR with cookie refresh has been implemented.

Browser-readable tokens can be stolen by XSS. This slice does not retain the legacy HttpOnly-only claim. Notes render escaped plain text; tokens, credentials, codes and provider error bodies must never be sent to logs, telemetry or exports. Auth uses explicit code/password calls with automatic URL-session detection disabled. No access-token query parameter or arbitrary redirect input is accepted by the new UI.

`signOut({ scope: "local" })` ends the current refresh session; an already-issued access JWT can remain valid until its expiration. The local configuration targets 600 seconds. Do not claim immediate JWT invalidation or that refresh time proves fresh authentication. MFA, other-session management and live/recent-auth guards for export, deletion and administration belong to their respective blocked WBS tasks.

## Focused verification

```sh
# Pure unit/contract tests; does not prove database RLS.
pnpm test:notes

# Real Auth/Data API checks with two fresh synthetic identities and local mail.
# Set SUPABASE_TEST_PUBLISHABLE_KEY through the environment, never in source.
APP_KIT_TEST_CONFIRM=LOCAL_SYNTHETIC pnpm test:notes:api

# After route generation and a frozen installation:
pnpm typecheck
pnpm build
```

The direct API script refuses remote hosts or unexpected ports, uses only the public key, rejects redirects, and never prints credentials or email codes. It checks required confirmation, OTP replay, login, owned CRUD, anonymous access, both directions of cross-user reads/writes/deletes, foreign-owner insertion, immutable ownership, invalid data and stale edits. It leaves only synthetic Auth identities in the disposable local database. Reset/discard only that explicitly disposable local instance after testing; the script cannot delete identities through a privileged key.

Complete the interactive desktop/mobile flow, keyboard focus/confirmation behavior and simultaneous
account-switch checks against the same disposable database. Use two fresh synthetic accounts and
Mailpit for verification, and record only outcome summaries—not credentials, tokens or email codes.
Obtain an explicitly authorized disposable Cloudflare environment before deployment evidence.
Existing Vite/Nitro Cloudflare wiring is preserved, not a deployment claim. Keep GitHub CI
manual-only and do not confuse syntax checks or mocked repository tests with an installed build, a
live API test or browser acceptance.

## Rollback and acceptance

No legacy users, passwords, sessions or data are automatically migrated. Reverting this additive feature commit restores the baseline UI/source; it does not drop a Supabase database, revoke its accounts or erase its records. Any future data rollback needs an explicit separate plan. Keep legacy code/licenses/history until replacement acceptance, and do not deploy both account systems to real users as if they share an identity.

Marek's first demonstration and GO gate remains in force. Later account, storage, admin, privacy, operational and release tasks stay blocked until their native dependencies and acceptance conditions are satisfied.

## Primary references

- [Supabase declarative schemas and diff limitations](https://supabase.com/docs/guides/local-development/declarative-database-schemas)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase sessions](https://supabase.com/docs/guides/auth/sessions)
