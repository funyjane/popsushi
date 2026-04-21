#!/usr/bin/env bash
# Poll until GoTrue (auth service) is healthy. GoTrue runs its own schema
# migrations against auth schema on first boot, so its health implies
# auth.users exists — required before we apply our app migrations that
# reference auth.users.id.
#
# /auth/v1/health goes through kong's key-auth gate, so we pass the anon key.
set -euo pipefail

cd "$(dirname "$0")/.."

KONG_URL="${KONG_URL:-http://localhost:54321}"
TIMEOUT="${TIMEOUT:-120}"

if [[ ! -f .env ]]; then
  echo ".env not found — run ./scripts/gen-keys.sh first." >&2
  exit 1
fi
ANON_KEY=$(grep '^ANON_KEY=' .env | cut -d= -f2-)
if [[ -z "$ANON_KEY" ]]; then
  echo "ANON_KEY missing in .env — run ./scripts/gen-keys.sh." >&2
  exit 1
fi

echo "Waiting for auth service at ${KONG_URL}/auth/v1/health ..."
start=$(date +%s)
while :; do
  if curl -fsS -o /dev/null -H "apikey: $ANON_KEY" "${KONG_URL}/auth/v1/health"; then
    echo "Auth service is healthy."
    exit 0
  fi
  now=$(date +%s)
  if (( now - start > TIMEOUT )); then
    echo "Timed out after ${TIMEOUT}s waiting for auth service." >&2
    echo "Run 'docker compose ps' and 'docker compose logs auth' to debug." >&2
    exit 1
  fi
  sleep 1
done
