# T13 App Kit

Starter kit: a white-label React web shell (TanStack Start) plus a separate
Node/Fastify API with PostgreSQL, Drizzle and Better Auth.

"T13 App Kit" is the name of the kit and appears in documentation only. The
product name shown in the interface is configured in `src/app.config.ts`
(default: `App`). The interface is white (#FFFFFF) with a strictly neutral gray
ramp — no brand colors, no logo, no marketing pages.

## Layout

```
src/          web app (TanStack Start), UI catalog in src/components/kit
shared/       contracts and pure validation shared by web and API
server/       Node + Fastify + Drizzle + Better Auth (own package.json)
third-party/  vendored MIT sources and their license/provenance
docs/         start guide, status, module cards
```

Web and API are started separately. The root `dev`/`build` scripts only ever
run the web app; it builds without a database, mail server or running API.

## Web

```sh
bun install
bun run dev          # http://localhost:8080
bun run build
```

Without `API_INTERNAL_URL` the web app shows an explicit "backend not
configured" state. Nothing is faked: sign-in forms report the real error
instead of a fake success. The component catalog at `/catalog` works without a
backend and without an account.

## API

```sh
cd server
bun install
cp .env.example .env        # fill in locally generated values
bun run db:migrate
bun run dev                 # http://127.0.0.1:3001
```

Local PostgreSQL and Mailpit:

```sh
docker compose -f compose.yaml up -d
```

Connect the two by setting `API_INTERNAL_URL=http://127.0.0.1:3001` for the web
process. The web app proxies `/api/*` to that single fixed address; no address
is ever accepted from the client.

See `docs/start.md` for the full local walkthrough and `docs/status.md` for what
is implemented, what is verified and what is still pending.
