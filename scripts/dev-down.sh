#!/usr/bin/env bash
# Stop local development infrastructure (PostgreSQL, Redis, MinIO).
#
# Safe/normal shutdown — data under ~/.local/var/healthcare-practice-saas
# is preserved. For a destructive data reset, use scripts/dev-reset.sh.
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/dev-env.sh"

echo "==> Stopping MinIO..."
stop_port "$MINIO_API_PORT"
rm -f "$RUN_DIR/minio.pid"

echo "==> Stopping Redis..."
"$REDIS_DIR/redis-cli.exe" -p "$REDIS_PORT" shutdown nosave >/dev/null 2>&1 || true
stop_port "$REDIS_PORT"
rm -f "$RUN_DIR/redis.pid"

echo "==> Stopping PostgreSQL..."
if [ -f "$DATA_DIR/postgres-data/PG_VERSION" ]; then
  "$PG_BIN/pg_ctl.exe" stop -D "$DATA_DIR/postgres-data" -m fast >/dev/null 2>&1 || true
fi

echo "Local infrastructure stopped. Data preserved under $DATA_DIR."
