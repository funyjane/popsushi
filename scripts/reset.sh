#!/usr/bin/env bash
# Nuke volumes, bring the stack up, wait for auth, apply app migrations.
# Use this whenever the schema changes — solo-dev equivalent of a migration runner.
set -euo pipefail

cd "$(dirname "$0")/.."

echo ">> docker compose down -v"
docker compose down -v

echo ">> docker compose up -d"
docker compose up -d

echo ">> waiting for auth..."
./scripts/wait-for-db.sh

echo ">> applying app migrations from supabase/migrations/"
for f in supabase/migrations/*.sql; do
  echo "   - $(basename "$f")"
  docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q < "$f"
done

# TS seed runs later once web/scripts/seed.ts exists (Phase 1+).
if [[ -f web/scripts/seed.ts ]]; then
  echo ">> running TS seed"
  (cd web && pnpm run seed) || echo "(seed failed — inspect web/scripts/seed.ts)"
fi

echo "Reset complete."
