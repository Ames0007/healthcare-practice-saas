#!/usr/bin/env bash
# Report local development infrastructure health (PostgreSQL, Redis, MinIO).
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/dev-env.sh"

echo "PostgreSQL (127.0.0.1:$POSTGRES_PORT):"
"$PG_BIN/pg_isready.exe" -h 127.0.0.1 -p "$POSTGRES_PORT" -U "$POSTGRES_USER" || true
echo ""

echo "Redis (127.0.0.1:$REDIS_PORT):"
"$REDIS_DIR/redis-cli.exe" -p "$REDIS_PORT" ping 2>/dev/null || echo "DOWN"
echo ""

echo "MinIO (http://127.0.0.1:$MINIO_API_PORT):"
if curl -sf "http://127.0.0.1:$MINIO_API_PORT/minio/health/live" >/dev/null 2>&1; then
  echo "OK (live)"
else
  echo "DOWN"
fi
