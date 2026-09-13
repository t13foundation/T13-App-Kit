# Local development

## Current Supabase Notes path

Use Node 22.16.0 (`.node-version`) and pnpm 10.34.5 (`packageManager`). Do not use the host’s default runtime when it differs. The root has one active pnpm lockfile; `server/bun.lock` belongs only to the isolated legacy backend. Install pnpm 10.34.5 with your existing package-manager tooling.

```sh
node --version # v22.16.0
pnpm --version # 10.34.5
pnpm install --frozen-lockfile
if [ ! -e .env ]; then cp .env.example .env; fi
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the ignored `.env`. Use only the public publishable/legacy anon key; never a service-role or secret key. Both blank keeps the overview available and Notes shows an explicit configuration state. Partial/unsafe configuration fails before startup/build.

Follow [the Supabase runbook](supabase.md) to inspect Docker, start an isolated local instance, apply the existing migration without a reset, and generate types. The existing test profile is `t13-apprev1`, project ID `t13-app-kit-demo`; API is 55321, database 55322, Mailpit 55324. Preserve existing environments and unrelated workloads.

```sh
export DOCKER_HOST="unix://${HOME}/.colima/t13-apprev1/docker.sock"
pnpm exec supabase start --exclude storage-api,imgproxy,studio,postgres-meta
pnpm exec supabase migration up --local
pnpm dev --host 127.0.0.1 --port 4311 --strictPort
```

Open `http://127.0.0.1:4311/notes`. Create synthetic accounts, read their six-digit confirmation codes in local Mailpit (`http://127.0.0.1:55324`), confirm, then use Notes. Verification signs in the account; subsequent logins use its password. Logout clears the current SDK refresh session and Notes UI. Reload retains the browser SDK session when signed in; issued access JWTs may remain valid for up to 600 seconds after logout. No private user/Notes data is server-rendered. The app needs no Fastify/Better Auth process.

The installation policy enforces a seven-day minimum package age, refuses missing release dates and rejects unreviewed dependency build scripts. `allowBuilds` narrowly permits `esbuild` (Vite tooling) and `supabase` (pinned local CLI installer); no other dependency build is implicitly approved.

## Minimum end-of-change checks for this path

After demonstrating the flow, run the repository source/parity checks, lint, typecheck, existing Node contract suite and build once:

```sh
pnpm verify
APP_KIT_TEST_CONFIRM=LOCAL_SYNTHETIC pnpm test:notes:api
```

The API harness requires `SUPABASE_TEST_PUBLISHABLE_KEY` in the environment and refuses hosted endpoints. It uses synthetic local identities only. Pure Node tests do not prove live RLS. The lead owns real email, browser acceptance and dedicated hosted Cloudflare/Supabase setup.

## Isolated legacy rollback path

The sections below describe the preserved Fastify/Better Auth backend only. Accounts, passwords and sessions are not migrated into Supabase. Do not run both systems as if they share an identity. Legacy rollback of the UI/code uses Git and its unchanged backend dependencies; it does not erase Supabase data.

## Services

```sh
docker compose -f compose.yaml up -d
```

Development PostgreSQL is `127.0.0.1:5433/appkit`; Mailpit SMTP is `127.0.0.1:1025`
and its inbox is `http://127.0.0.1:8025`. These services bind to localhost.
Compose uses development-only credentials, never production defaults.

## API

```sh
cd server
bun install --frozen-lockfile
cp .env.example .env
openssl rand -hex 32
```

Put the generated value in the ignored `.env` as BETTER_AUTH_SECRET.
Set DATABASE_URL for the intended development database. APP_URL, AUTH_URL and TRUSTED_ORIGINS
must refer to the public web origin, locally `http://localhost:8080`, not the internal API port.
Then, still from server/:

```sh
bun --env-file=.env run db:migrate
bun --env-file=.env run dev
```

## Web (another terminal, repository root)

```sh
pnpm install --frozen-lockfile
API_INTERNAL_URL=http://127.0.0.1:3001 pnpm dev --port 8080
```

Open `http://localhost:8080`. Without API_INTERNAL_URL the overview page and its
component presentation still work;
account operations report that the backend is not configured. The variable is server-only,
never VITE-prefixed. The API proxy strips all caller-selected forwarding/IP headers.
Until a trusted ingress is configured and tested, users behind the web proxy share its peer-IP quota.
Do not fix that by enabling `trustProxy: true` or disabling origin checks.

## Minimum end-of-change checks

```sh
node --experimental-strip-types --test tests/*.test.mjs
node scripts/check-source-integrity.mjs
pnpm build
./node_modules/.bin/tsc --noEmit -p tsconfig.json
(cd server && bun run typecheck && ./node_modules/.bin/vitest run tests/unit)
```

The Node suite uses a stub transport and no database. It is not an account integration test.
Use the installed TypeScript executable, not `bunx tsgo` downloading an unrelated package.

## Integration checks (isolated test database only)

```sh
docker compose exec postgres createdb -U postgres appkit_test
cd server
cp .env.example .env.test
```

Set these values in the ignored `.env.test`; generate a separate secret locally:

```dotenv
NODE_ENV=test
ALLOW_TEST_DATABASE_RESET=true
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/appkit_test
APP_URL=http://localhost:8080
AUTH_URL=http://localhost:8080
TRUSTED_ORIGINS=http://localhost:8080
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
MAILPIT_API=http://127.0.0.1:8025
```

Keep MAIL_FROM from the example and replace BETTER_AUTH_SECRET with the generated value.
Only after confirming the target is the dedicated test database:

```sh
bun --env-file=.env.test run db:migrate
bun --env-file=.env.test run test:integration
```

The guards require NODE_ENV=test, explicit reset permission, a local database named exactly
appkit_test and local Mailpit. Tests may clear test messages and rate-limit counters; use an
isolated Mailpit inbox with no real messages. Never point these commands at a shared/production service.
The suite includes both the original account/MFA journey and merged profile/export/session regressions.
