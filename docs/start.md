# Local development

Use Node 22.16.0, pnpm 10.34.5 and Docker for the accepted Supabase web path. The legacy
`server/` remains a separate Bun rollback target.

## Supabase (WBS-APP1-01)

From the repository root, install the pinned web dependencies and start the disposable local
stack:

```sh
pnpm install --frozen-lockfile
pnpm exec supabase start
pnpm exec supabase db reset
pnpm exec supabase status
```

Copy `.env.example` to the ignored `.env`. Set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` from the local status output. Only a public/anon key may be
exposed to the browser; never put a secret or service-role key in a `VITE_*` variable.

```sh
cp .env.example .env
pnpm dev -- --host 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000/notes`. Use the local Mailpit inbox shown by `supabase status` to
retrieve the six-digit confirmation code. `/catalog` works without a backend. The local
`supabase db lint --local` and `supabase gen types typescript --local` commands require the
stack to be running; hosted links, deployments and provider credentials are outside this slice.

## Legacy services and API

This path preserves the pre-Supabase Better Auth implementation for rollback and comparison. It
is not the `/notes` backend and does not share identities with Supabase.

```sh
docker compose -f compose.yaml up -d
cd server
bun install --frozen-lockfile
cp .env.example .env
openssl rand -hex 32
```

Put the generated value in the ignored `server/.env` as `BETTER_AUTH_SECRET`. Set
`APP_URL`, `AUTH_URL` and `TRUSTED_ORIGINS` to `http://localhost:8080`, then run:

```sh
bun --env-file=.env run db:migrate
bun --env-file=.env run dev
```

From another terminal at the repository root, run the legacy proxy only when needed:

```sh
bun install --frozen-lockfile
API_INTERNAL_URL=http://127.0.0.1:3001 bun run dev -- --port 8080
```

The local legacy PostgreSQL is `127.0.0.1:5433/appkit`; Mailpit SMTP is `127.0.0.1:1025` and
its inbox is `http://127.0.0.1:8025`. These services bind to localhost and use development-only
credentials.

## Minimum checks

```sh
git status --short --branch
git diff --check
node scripts/check-source-integrity.mjs
node --experimental-strip-types --test tests/*.test.mjs
pnpm test:notes
pnpm typecheck
pnpm build
```

The unit and boundary suites do not prove database RLS. The real two-account test requires a
disposable local Supabase and a public key supplied only through the environment:

```sh
APP_KIT_TEST_CONFIRM=LOCAL_SYNTHETIC pnpm test:notes:api
```

It checks confirmation/replay/login, owned CRUD, anonymous access, cross-user API denials,
foreign-owner insertion, immutable ownership, validation, stale edits and logout. It leaves
synthetic Auth identities in the local database; discard only that disposable instance after
testing.

## Legacy integration checks

The legacy API uses a dedicated local database and test mailbox. Never point it at a shared or
production service:

```sh
docker compose exec postgres createdb -U postgres appkit_test
cd server
cp .env.example .env.test
```

Set `NODE_ENV=test`, `ALLOW_TEST_DATABASE_RESET=true`, a generated
`BETTER_AUTH_SECRET`, `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/appkit_test`,
the local web origin and Mailpit values in the ignored file. Only after confirming the database
name and local services:

```sh
bun --env-file=.env.test run db:migrate
bun --env-file=.env.test run test:integration
```

The test guard requires the exact `appkit_test` database and explicit reset permission.
