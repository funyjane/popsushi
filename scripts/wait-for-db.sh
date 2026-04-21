#!/usr/bin/env bash
# Poll until GoTrue (auth service) is healthy. GoTrue runs its own schema
# migrations against auth schema on first boot, so its health implies
# auth.users exists — required before we apply our app migrations that
# reference auth.users.id.
set -euo pipefail

KONG_URL="${KONG_URL:-http://localhost:54321}"
TIMEOUT="${TIMEOUT:-120}"

echo "Waiting for auth service at ${KONG_URL}/auth/v1/health ..."
start=$(date +%s)
while :; do
  if curl -fsS -o /dev/null "${KONG_URL}/auth/v1/health"; then
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
