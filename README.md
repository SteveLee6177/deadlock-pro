# Deadlock Pro

Deadlock Pro is a Next.js platform for the Deadlock competitive scene. It gives players and team captains one place to:

- Sign in with Steam
- Sync a Deadlock rank from a Steam-linked profile
- Discover teams and apply to join them
- Create teams and manage recruiting needs
- Post scrim requests
- Push live schedule updates with Redis-backed SSE
- Surface tournaments from FACEIT or community organizers
- Embed Twitch broadcasts for current events

## Stack

- Next.js 16 App Router
- TypeScript
- Prisma + PostgreSQL
- Redis pub/sub for live schedule events
- Steam OpenID sign-in
- Deadlock rank adapter tied to Steam ID

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Start the local infrastructure:

```bash
npm run infra:up
```

4. Fill in your Steam and Deadlock API settings if you want those integrations active immediately.

5. Generate the Prisma client and push the schema:

```bash
npm run db:generate
npm run db:push
```

6. Run the seed command if your deployment workflow expects it. It does not create demo teams:

```bash
npm run db:seed
```

7. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

See [.env.example](/Users/splee/Documents/New project/.env.example) for the full list.

- `APP_URL`: Base app URL, usually `http://localhost:3000`
- `DATABASE_URL`: PostgreSQL connection string for Prisma
- `REDIS_URL`: Redis connection string for live schedule updates
- `REDIS_PASSWORD`: Optional Redis password
- `SESSION_PASSWORD`: 32+ character cookie encryption secret
- `STEAM_REALM`: Steam OpenID realm, usually the same as `APP_URL`
- `STEAM_API_KEY`: Steam Web API key for profile summaries
- `DEADLOCK_API_BASE_URL`: Base URL for your Deadlock player API
- `DEADLOCK_API_PROFILE_URL_TEMPLATE`: Optional full template like `https://example.com/players/{steamId}`
- `DEADLOCK_API_KEY`: Optional bearer token for the Deadlock API

## Project Structure

- [src/app](/Users/splee/Documents/New project/src/app): pages and route handlers
- [src/components](/Users/splee/Documents/New project/src/components): UI building blocks and client widgets
- [src/lib](/Users/splee/Documents/New project/src/lib): auth, data access, Redis, Prisma, and Deadlock utilities
- [prisma/schema.prisma](/Users/splee/Documents/New project/prisma/schema.prisma): database schema
- [prisma/seed.ts](/Users/splee/Documents/New project/prisma/seed.ts): production-safe no-op seed

## Notes

- Steam login is implemented with OpenID because Steam does not expose standard OAuth for web sign-in.
- The Deadlock rank sync is intentionally adapter-based because different community APIs expose slightly different response shapes.
- Read paths return empty production-safe states when `DATABASE_URL` is missing.
- Mutations require Postgres so forms return a helpful message until the database is configured.
- Local Postgres and Redis are defined in [docker-compose.yml](/Users/splee/Documents/New project/docker-compose.yml) and can be stopped with `npm run infra:down`.
- Scrim posting and schedule writes are limited to teams the signed-in user actually belongs to.
