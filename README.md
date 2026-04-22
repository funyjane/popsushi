# PopSushi

Marketplace MVP for booking private sushi chefs. Solo-dev, local-first, no cloud services.

## Quick start

One command — Docker is the only host requirement.

```bash
./start.sh
```

First run takes ~2 minutes (pulls images, builds the web container, applies
migrations, seeds fake users and chefs). Subsequent runs take ~5 seconds.

Then open:

- **http://localhost:3000** — web app
- **http://localhost:54323** — Supabase Studio (DB browser)
- **http://localhost:54324** — Inbucket (catches auth emails in dev)

### Seed logins

Password is `password123` for all seeded users.

| Email | Role |
|---|---|
| `hana@popsushi.local`, `taro@popsushi.local` | customer |
| `tanaka@popsushi.local`, `yamada@popsushi.local`, `sato@popsushi.local` | chef |

Chef profiles are pre-populated with SF Bay Area coordinates and one published menu each.

## Common operations

```bash
./start.sh              # idempotent — bring everything up
docker compose down     # stop everything, keep data
docker compose logs -f web   # tail app logs
./scripts/reset.sh      # destructive: wipe volumes, re-apply all migrations, reseed
```

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind 4) in `web/`
- **Self-hosted Supabase**: Postgres 15 + PostGIS + btree_gist, GoTrue auth, PostgREST, Realtime, Storage, Studio
- **MapLibre GL JS** + OpenStreetMap tiles for maps
- **Inbucket** as the dev mail catcher
- **Nominatim** geocoder — opt-in via `docker compose --profile geo up -d`; first boot imports the PBF, 10–30 min

## Ports

| Service | Host port |
|---|---|
| web (Next.js) | 3000 |
| kong API gateway | 54321 |
| Postgres | 54322 |
| Supabase Studio | 54323 |
| Inbucket web UI | 54324 |
| Nominatim (opt-in) | 54325 |

## Project layout

- `start.sh` — one-command bootstrap + start
- `docker/` — Dockerfiles and service configs (postgres init, kong config, web Dockerfile)
- `supabase/migrations/` — numbered SQL migrations applied via `scripts/migrate.sh`
- `web/` — Next.js app (bind-mounted into `popsushi-web`, Turbopack HMR works)
- `scripts/` — `gen-keys.sh`, `wait-for-db.sh`, `migrate.sh`, `reset.sh`
- `volumes/` — persistent container state (gitignored)

## Troubleshooting

- **`./start.sh` says Docker daemon isn't running** — start Docker Desktop and retry.
- **Port conflict on 3000 / 54321-54324** — something else is bound to those ports. `docker compose down`, stop the conflicting process, retry.
- **Stale schema after pulling new commits** — `./scripts/reset.sh` to nuke volumes and reapply all migrations cleanly.
- **Seed said something failed** — wait for `popsushi-web` to finish compiling (Turbopack takes a few seconds on first request), then `docker compose exec web pnpm run seed`.
