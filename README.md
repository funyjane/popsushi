# PopSushi — local dev

Marketplace MVP for booking private sushi chefs. Solo-dev, local-first, no cloud services.

## Stack
- Next.js 15 (App Router, TS, Tailwind) in `web/`
- Self-hosted Supabase (Postgres 15 + PostGIS, GoTrue auth, PostgREST, Realtime, Storage, Studio)
- MapLibre GL JS + OpenStreetMap tiles
- Self-hosted Nominatim geocoder (opt-in via `--profile geo`)
- Inbucket mail catcher

## First run

```bash
# 1. Generate secrets and write .env
cp .env.example .env
./scripts/gen-keys.sh

# 2. Bring up the Supabase stack + web app (excludes Nominatim)
docker compose up -d

# 3. Wait for services, apply app migrations
./scripts/wait-for-db.sh
./scripts/reset.sh  # applies migrations, will later run TS seed

# 4. Open
#   http://localhost:3000        - web app
#   http://localhost:54323       - Supabase Studio
#   http://localhost:54324       - Inbucket (captured emails)
```

## With geocoder

```bash
docker compose --profile geo up -d
# First boot imports the PBF at NOMINATIM_PBF_URL (10–30 min depending on bbox)
```

## Reset to clean state

```bash
./scripts/reset.sh  # docker compose down -v && up -d && migrations
```

## Ports

| Service | Host port |
|---|---|
| web (Next.js) | 3000 |
| kong API gateway | 54321 |
| Postgres | 54322 |
| Supabase Studio | 54323 |
| Inbucket web UI | 54324 |
| Nominatim | 54325 |

## Structure

- `docker/` — Dockerfiles and service configs (postgres init scripts, kong config, web Dockerfile)
- `supabase/migrations/` — app schema migrations applied post-boot by `./scripts/reset.sh`
- `web/` — Next.js app
- `scripts/` — bootstrap scripts (gen-keys, wait-for-db, reset)
- `volumes/` — persistent container state (gitignored)
