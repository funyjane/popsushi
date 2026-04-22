#!/usr/bin/env bash
# Apply pending SQL migrations. Idempotent via a _schema_migrations tracking
# table: each .sql file is applied exactly once across the DB's lifetime.
# Safe to run any number of times; invoked by both start.sh and reset.sh.
set -euo pipefail

cd "$(dirname "$0")/.."

psql_run() {
  docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"
}

psql_run -c "CREATE TABLE IF NOT EXISTS public._schema_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);"

shopt -s nullglob
migrations=(supabase/migrations/*.sql)
if [[ ${#migrations[@]} -eq 0 ]]; then
  echo "No migrations in supabase/migrations/."
  exit 0
fi

applied=0
skipped=0
for f in "${migrations[@]}"; do
  name=$(basename "$f")
  seen=$(docker compose exec -T db psql -U postgres -d postgres -Atc \
    "SELECT 1 FROM public._schema_migrations WHERE name = '$name';" | tr -d '\r\n ')
  if [[ "$seen" == "1" ]]; then
    echo "   ~ $name"
    skipped=$((skipped + 1))
    continue
  fi
  echo "   + $name"
  psql_run < "$f"
  psql_run -c "INSERT INTO public._schema_migrations (name) VALUES ('$name');"
  applied=$((applied + 1))
done

echo "Migrations: $applied applied, $skipped already up-to-date."
