#!/usr/bin/env bash
# Generate JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY for local Supabase.
# Writes a copy of .env.example populated with freshly-generated values.
# Safe to re-run — overwrites .env if it already exists (with a prompt).
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  read -r -p ".env already exists. Overwrite? [y/N] " ans
  if [[ "${ans,,}" != "y" ]]; then
    echo "Aborted."
    exit 0
  fi
fi

if [[ ! -f .env.example ]]; then
  echo "Error: .env.example not found." >&2
  exit 1
fi

b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }

sign_jwt() {
  local role="$1"
  local secret="$2"
  local header payload now exp signature
  header=$(printf '%s' '{"alg":"HS256","typ":"JWT"}' | b64url)
  now=$(date +%s)
  exp=$((now + 157680000)) # 5 years
  payload=$(printf '{"role":"%s","iss":"supabase-local","iat":%d,"exp":%d}' "$role" "$now" "$exp" | b64url)
  signature=$(printf '%s' "${header}.${payload}" | openssl dgst -sha256 -hmac "$secret" -binary | b64url)
  printf '%s.%s.%s' "$header" "$payload" "$signature"
}

rand_hex_32() { openssl rand -hex 32; }
rand_b64_32() { openssl rand -base64 32 | tr -d '\n'; }

JWT_SECRET=$(rand_hex_32)
ANON_KEY=$(sign_jwt "anon" "$JWT_SECRET")
SERVICE_ROLE_KEY=$(sign_jwt "service_role" "$JWT_SECRET")
POSTGRES_PASSWORD=$(rand_hex_32)
SECRET_KEY_BASE=$(rand_b64_32)
VAULT_ENC_KEY=$(rand_hex_32 | head -c 32)
PG_META_CRYPTO_KEY=$(rand_hex_32 | head -c 32)
DASHBOARD_PASSWORD=$(rand_hex_32 | head -c 16)
NOMINATIM_PASSWORD=$(rand_hex_32 | head -c 16)

cp .env.example .env

# macOS/BSD vs GNU sed: use a portable inline replace helper.
sed_inplace() {
  if sed --version >/dev/null 2>&1; then
    sed -i -e "$1" "$2"  # GNU
  else
    sed -i '' -e "$1" "$2" # BSD/macOS
  fi
}

set_var() {
  local key="$1" val="$2"
  # Escape slashes and ampersands for sed replacement
  local esc=${val//\\/\\\\}; esc=${esc//\//\\/}; esc=${esc//&/\\&}
  sed_inplace "s|^${key}=.*|${key}=${esc}|" .env
}

set_var POSTGRES_PASSWORD "$POSTGRES_PASSWORD"
set_var JWT_SECRET "$JWT_SECRET"
set_var ANON_KEY "$ANON_KEY"
set_var SERVICE_ROLE_KEY "$SERVICE_ROLE_KEY"
set_var NEXT_PUBLIC_SUPABASE_ANON_KEY "$ANON_KEY"
set_var SECRET_KEY_BASE "$SECRET_KEY_BASE"
set_var VAULT_ENC_KEY "$VAULT_ENC_KEY"
set_var PG_META_CRYPTO_KEY "$PG_META_CRYPTO_KEY"
set_var DASHBOARD_PASSWORD "$DASHBOARD_PASSWORD"
set_var NOMINATIM_PASSWORD "$NOMINATIM_PASSWORD"

echo "Wrote .env with fresh secrets."
echo "  Studio basic-auth: supabase / ${DASHBOARD_PASSWORD}"
