# Local development

Use Node 22.16+ and Bun for the existing lockfiles. Do not install or migrate production services.

## Web

```sh
bun install --frozen-lockfile
```

Start the web with the API target in the server environment (not a VITE-prefixed variable):

```sh
API_INTERNAL_URL=http://127.0.0.1:3001 bun run dev -- --port 8080
```

The API target is fixed by the operator. It is not read from a query string or browser storage.
Without it the UI reports that the backend is not configured; no fake account is created.

## API

Provide an isolated PostgreSQL database and test SMTP such as Mailpit. The database can be
at `127.0.0.1:5433`, SMTP at `127.0.0.1:1025`, and Mailpit HTTP at `127.0.0.1:8025`.
These services are prerequisites, not started by the commands below.

```sh
cd server
bun install --frozen-lockfile
cp .env.example .env
```

Set DATABASE_URL and a newly generated BETTER_AUTH_SECRET in `.env`, outside Git.
Set APP_URL and AUTH_URL to the public web origin, locally `http://localhost:8080`;
set TRUSTED_ORIGINS to that exact origin. The browser reaches `/api` through the web proxy.
SMTP fields must refer to the test mail service; do not use real recipients for integration tests.
The backend requires configuration and does not fall back to in-memory storage.

After checking the target is the intended development database:

```sh
bun --env-file=.env run db:migrate
node --env-file=.env --import tsx src/main.ts
```

Alternatively export the same environment and use the existing db:migrate/start scripts.
Existing migration files remain unchanged. Never reset or truncate a production database.

## Minimal end-of-change checks

From root: `bunx tsc --noEmit` and `bun run build`.
From server: `bun run typecheck`, then the targeted unit/integration tests with isolated services.
The integration fixture clears test mail and rate-limit counters: it must not target shared/production services.
Do not call a syntax-only check a successful full build. No GitHub Actions run is required.

## Current deployment boundary

This increment uses the existing TanStack server route as a fixed API proxy. Public origins and
cookies in the actual Lovable preview still require a real integration check. The proxy strips
client-supplied forwarding/IP headers; until a trusted ingress is configured, clients behind it
share the backend's per-peer rate-limit bucket. Do not fix this by enabling `trustProxy: true`.
