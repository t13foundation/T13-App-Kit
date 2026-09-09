# Local development

Use Node 22.16+ and Bun with the committed lockfiles. Web and API are separate processes.

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
bun install --frozen-lockfile
API_INTERNAL_URL=http://127.0.0.1:3001 bun run dev -- --port 8080
```

Open `http://localhost:8080`. Without API_INTERNAL_URL the catalog still works;
account operations report that the backend is not configured. The variable is server-only,
never VITE-prefixed. The API proxy strips all caller-selected forwarding/IP headers.
Until a trusted ingress is configured and tested, users behind the web proxy share its peer-IP quota.
Do not fix that by enabling `trustProxy: true` or disabling origin checks.

## Minimum end-of-change checks

```sh
node --experimental-strip-types --test tests/*.test.mjs
node scripts/check-source-integrity.mjs
bun run build
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
