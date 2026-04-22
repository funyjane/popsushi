#!/usr/bin/env bash
# Wipe all container state, rebuild schema from scratch, reseed. Destructive.
# Use this when migrations change mid-development or state gets weird.
set -euo pipefail

cd "$(dirname "$0")/.."

echo ">> docker compose down -v (wiping volumes)"
docker compose down -v

echo ">> docker compose up -d"
docker compose up -d

./scripts/wait-for-db.sh
./scripts/migrate.sh

echo ">> running TS seed"
docker compose exec -T web pnpm run seed \
  || echo "(seed failed — retry with: docker compose exec web pnpm run seed)"

echo "Reset complete."
