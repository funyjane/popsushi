#!/usr/bin/env bash
# One-command bootstrap + start for PopSushi.
#
#   ./start.sh        first run: generate secrets, build+start everything,
#                     apply migrations, seed. ~2 minutes on first run.
#                     subsequent runs: just bring the stack back up.
#
# Everything runs in Docker. The only host requirement is Docker Desktop
# (or Docker Engine + compose plugin). No Node.js, Postgres, or pnpm on
# the host.
set -euo pipefail

cd "$(dirname "$0")"

# ---- Preflight ----------------------------------------------------------
die() { printf '\033[31mError:\033[0m %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null 2>&1 \
  || die "Docker is required. Install Docker Desktop: https://www.docker.com/products/docker-desktop/"

docker compose version >/dev/null 2>&1 \
  || die "Docker Compose v2 plugin is required (ships with recent Docker Desktop)."

docker info >/dev/null 2>&1 \
  || die "Docker daemon isn't running. Start Docker Desktop and re-run."

# ---- First-run detection ------------------------------------------------
first_run=false
if [[ ! -f .env ]]; then
  echo "==> First run — generating .env with fresh secrets"
  ./scripts/gen-keys.sh
  first_run=true
fi

# ---- Stack --------------------------------------------------------------
echo "==> Starting containers (first build may take a few minutes)"
docker compose up -d

# ---- Wait for auth (implies DB is ready) --------------------------------
./scripts/wait-for-db.sh

# ---- Migrations ---------------------------------------------------------
echo "==> Applying database migrations"
./scripts/migrate.sh

# ---- Seed (first run only) ---------------------------------------------
if $first_run; then
  echo "==> Seeding users, chef profiles, and menus"
  # web container may still be booting Turbopack on first run; the seed
  # script only needs the env + supabase-js so it runs fine either way.
  if ! docker compose exec -T web pnpm run seed; then
    echo "(seed failed — retry later with: docker compose exec web pnpm run seed)"
  fi
fi

# ---- Summary ------------------------------------------------------------
cat <<'EOF'

✓ PopSushi is up.

  Web app:     http://localhost:3000
  Studio:      http://localhost:54323   (DB browser)
  Inbucket:    http://localhost:54324   (auth emails catcher)

  Seed logins (password: password123):
    Customers:  hana@popsushi.local   taro@popsushi.local
    Chefs:      tanaka@popsushi.local yamada@popsushi.local sato@popsushi.local

  Stop:          docker compose down
  Tail logs:     docker compose logs -f web
  Wipe + redo:   ./scripts/reset.sh

EOF
