# Supabase account and private Notes slice

This is the technical contract for WBS-APP1-01. The accepted target is TanStack Start + React + Supabase + Cloudflare. `/notes` contains the new signup, six-digit email confirmation, login, local logout and Notes flow. The existing account routes and `server/` remain the isolated legacy implementation until replacement acceptance. Their existing guides are not instructions for the Supabase path.

## Delivery boundary

The slice's current Issue/PR is authoritative for execution evidence. A source implementation is not acceptance. This change deliberately supplies a declarative schema and an explicitly hand-authored database type draft; it must not be described as an applied migration or generated types. The pnpm lockfile, actual generated migration/types/route tree, installed-dependency checks and provider/browser evidence are merge blockers. Do not merge it by bypassing frozen-lockfile checks, removing tests or enabling automatic CI.

## Local preparation

Use Node 22.16.0 (`.node-version`) and pnpm 10.12.1 (`packageManager`). Supabase CLI is pinned to 2.113.0 and the browser SDK to 2.111.0. Docker is required for local Supabase. The legacy `server/` is intentionally excluded from the new workspace. No hosted project, production credentials, real email recipient or paid resource is required for local validation.

The one-time completion sequence below is a recipe, not a claim these commands passed for this change:

```sh
# Resolve dependencies in an environment with package-registry access.
corepack pnpm install
corepack pnpm exec supabase --help
corepack pnpm exec supabase migration new --help
corepack pnpm exec supabase start --help
corepack pnpm exec supabase gen types --help

# Generate the initial versioned filename using the real CLI.
corepack pnpm exec supabase migration new private_notes
```

Copy the reviewed contents of `supabase/schema/notes.sql` into the new migration file emitted by that command. The explicit grants, column privileges, private schema and function permissions are security-critical: do not assume an automatic schema diff preserved every grant. Keep both the declaration and the versioned migration consistent. Then start the **disposable local** instance and apply its migrations using the pinned CLI's documented commands; confirm migration history and run database advisors. Do not use remote `link`, `db push` or a customer database for this work.

Replace `src/lib/supabase/database.types.ts` with actual `supabase gen types typescript --local` output after applying the migration. Generate into a temporary file first and replace the tracked file only if the command succeeds. Commit the real `pnpm-lock.yaml`, generated migration and types. Reconcile the manual workflow with pnpm after a verified install; the old Bun lockfiles/workflow still describe the baseline and are not a supported way to install this draft's added dependencies. Do not remove the legacy server lockfile before its rollback boundary is accepted.

Copy `.env.example` to an ignored local environment file. Set `VITE_SUPABASE_URL` to the local API origin and `VITE_SUPABASE_PUBLISHABLE_KEY` to its public key. The local CLI may provide a legacy `anon` JWT instead of an `sb_publishable_` key. Never copy a secret/service-role key into any `VITE_*` variable. Both missing variables leave the introduction/catalog usable; partial or unsafe configuration fails explicitly. Vite checks this before emitting assets as well as at browser initialization.

Run the web app with `corepack pnpm dev -- --host 127.0.0.1 --port 3000`, then open `/notes`. The Vite/TanStack plugin must generate the actual route tree; do not hand-edit `src/routeTree.gen.ts`. Local email confirmations are enabled, tokens expire after 600 seconds, and the custom template contains a code rather than an authentication URL. Mailpit is configured on port 54324. Hosted email/Resend/Turnstile setup is outside this first slice.

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
corepack pnpm test:notes

# Real Auth/Data API checks with two fresh synthetic identities and local mail.
# Set SUPABASE_TEST_PUBLISHABLE_KEY through the environment, never in source.
APP_KIT_TEST_CONFIRM=LOCAL_SYNTHETIC corepack pnpm test:notes:api

# After route generation and a frozen installation:
corepack pnpm typecheck
corepack pnpm build
```

The direct API script refuses remote hosts or unexpected ports, uses only the public key, rejects redirects, and never prints credentials or email codes. It checks required confirmation, OTP replay, login, owned CRUD, anonymous access, both directions of cross-user reads/writes/deletes, foreign-owner insertion, immutable ownership, invalid data and stale edits. It leaves only synthetic Auth identities in the disposable local database. Reset/discard only that explicitly disposable local instance after testing; the script cannot delete identities through a privileged key.

Complete the interactive desktop/mobile flow, keyboard focus/confirmation behavior and simultaneous account-switch checks separately. Obtain an explicitly authorized disposable Cloudflare environment before deployment evidence. Existing Vite/Nitro Cloudflare wiring is preserved, not a deployment claim. Keep GitHub CI manual-only and do not confuse syntax checks or mocked repository tests with an installed build, a live API test or browser acceptance.

## Rollback and acceptance

No legacy users, passwords, sessions or data are automatically migrated. Reverting this additive feature commit restores the baseline UI/source; it does not drop a Supabase database, revoke its accounts or erase its records. Any future data rollback needs an explicit separate plan. Keep legacy code/licenses/history until replacement acceptance, and do not deploy both account systems to real users as if they share an identity.

Marek's first demonstration and GO gate remains in force. Later account, storage, admin, privacy, operational and release tasks stay blocked until their native dependencies and acceptance conditions are satisfied.

## Primary references

- [Supabase declarative schemas and diff limitations](https://supabase.com/docs/guides/local-development/declarative-database-schemas)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase sessions](https://supabase.com/docs/guides/auth/sessions)
