# Local start

## 1. Services

```sh
docker compose -f compose.yaml up -d
```

- PostgreSQL: `127.0.0.1:5433`, database `appkit`
- Mailpit: SMTP `127.0.0.1:1025`, web UI `http://127.0.0.1:8025`

Both bind to localhost only. No external or paid service is used.

## 2. API

```sh
cd server
bun install
cp .env.example .env
openssl rand -hex 32          # paste into BETTER_AUTH_SECRET
bun run db:migrate
bun run dev
```

The API refuses to start when a secret is missing, still holds a placeholder,
or when a public origin is malformed. In production all public origins must be
HTTPS. `AUTH_URL` is the public web origin (the proxy), never the internal
backend port.

## 3. Web

```sh
bun install
API_INTERNAL_URL=http://127.0.0.1:3001 bun run dev
```

Open `http://localhost:8080`. Without `API_INTERNAL_URL` the app runs and the
catalog at `/catalog` works, but account screens report that the backend is not
configured.

## 4. Tests

Unit tests (no services needed):

```sh
cd server && bunx vitest run tests/unit
```

Integration tests run against a **separate** local database. They refuse to
delete anything unless all of the following hold: `NODE_ENV=test`,
`ALLOW_TEST_DATABASE_RESET=true`, a local host and exactly the database
`appkit_test`. The development database `appkit` is never truncated.

```sh
createdb -h 127.0.0.1 -p 5433 -U postgres appkit_test
cd server
cp .env.example .env.test     # then set the values below
# NODE_ENV=test
# ALLOW_TEST_DATABASE_RESET=true
# DATABASE_URL=postgres://postgres@127.0.0.1:5433/appkit_test
# BETTER_AUTH_SECRET=<openssl rand -hex 32>
# MAILPIT_API=http://127.0.0.1:8025
DATABASE_URL=postgres://postgres@127.0.0.1:5433/appkit_test bunx drizzle-kit migrate
bunx vitest run tests/integration
```

`.env.test` is git-ignored and holds locally generated values only.

## 5. Web checks

```sh
node scripts/check-source-integrity.mjs
bun run build
bunx tsgo --noEmit -p tsconfig.json
cd server && bun run typecheck
```
