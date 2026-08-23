#!/usr/bin/env bash
# Start local development infrastructure (PostgreSQL, Redis, MinIO).
#
# Native/portable processes, not Docker — see ADR-002 in
# docs/implementation/DECISIONS.md and docs/development/LOCAL_DEVELOPMENT.md
# for why, and for the manual-install steps this script assumes already
# happened (binaries under ~/.local/opt, see that guide).
#
# Safe to re-run: every step is idempotent.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/dev-env.sh"

for exe in "$PG_BIN/pg_ctl.exe" "$PG_BIN/pg_isready.exe" "$PG_BIN/psql.exe" "$PG_BIN/createdb.exe" \
           "$REDIS_DIR/redis-server.exe" "$REDIS_DIR/redis-cli.exe" "$MINIO_BIN" "$MC_BIN"; do
  if [ ! -f "$exe" ]; then
    echo "Missing: $exe" >&2
    echo "Local infrastructure binaries are not installed. See docs/development/LOCAL_DEVELOPMENT.md." >&2
    exit 1
  fi
done

mkdir -p "$DATA_DIR/postgres-data" "$DATA_DIR/minio-data" "$RUN_DIR" "$LOG_DIR"

# --- PostgreSQL ---------------------------------------------------------

if [ ! -f "$DATA_DIR/postgres-data/PG_VERSION" ]; then
  echo "==> Initializing PostgreSQL data directory (first run)..."
  pwfile="$(mktemp)"
  printf '%s' "$POSTGRES_PASSWORD" > "$pwfile"
  "$PG_BIN/initdb.exe" -D "$DATA_DIR/postgres-data" -U "$POSTGRES_USER" \
    --pwfile="$pwfile" -E UTF8 --locale=C --auth=scram-sha-256 \
    > "$LOG_DIR/postgres-initdb.log" 2>&1
  rm -f "$pwfile"
fi

if "$PG_BIN/pg_ctl.exe" status -D "$DATA_DIR/postgres-data" >/dev/null 2>&1; then
  echo "==> PostgreSQL already running."
else
  echo "==> Starting PostgreSQL on 127.0.0.1:$POSTGRES_PORT..."
  "$PG_BIN/pg_ctl.exe" start -D "$DATA_DIR/postgres-data" -l "$LOG_DIR/postgres.log" \
    -o "-p $POSTGRES_PORT -c listen_addresses=127.0.0.1"
fi

for _ in $(seq 1 30); do
  "$PG_BIN/pg_isready.exe" -h 127.0.0.1 -p "$POSTGRES_PORT" -U "$POSTGRES_USER" >/dev/null 2>&1 && break
  sleep 1
done
"$PG_BIN/pg_isready.exe" -h 127.0.0.1 -p "$POSTGRES_PORT" -U "$POSTGRES_USER"

exists="$(PGPASSWORD="$POSTGRES_PASSWORD" "$PG_BIN/psql.exe" -h 127.0.0.1 -p "$POSTGRES_PORT" \
  -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'")"
if [ "$exists" != "1" ]; then
  echo "==> Creating development database '$POSTGRES_DB'..."
  PGPASSWORD="$POSTGRES_PASSWORD" "$PG_BIN/createdb.exe" -h 127.0.0.1 -p "$POSTGRES_PORT" \
    -U "$POSTGRES_USER" "$POSTGRES_DB"
fi

# Dedicated test database (TASK-005) — kept structurally separate from
# $POSTGRES_DB so `php artisan test` (phpunit.xml) cannot ever target the
# normal development database, by name alone.
test_exists="$(PGPASSWORD="$POSTGRES_PASSWORD" "$PG_BIN/psql.exe" -h 127.0.0.1 -p "$POSTGRES_PORT" \
  -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_TEST_DB'")"
if [ "$test_exists" != "1" ]; then
  echo "==> Creating test database '$POSTGRES_TEST_DB'..."
  PGPASSWORD="$POSTGRES_PASSWORD" "$PG_BIN/createdb.exe" -h 127.0.0.1 -p "$POSTGRES_PORT" \
    -U "$POSTGRES_USER" "$POSTGRES_TEST_DB"
fi

# --- Redis ---------------------------------------------------------------

if "$REDIS_DIR/redis-cli.exe" -p "$REDIS_PORT" ping >/dev/null 2>&1; then
  echo "==> Redis already running."
else
  echo "==> Starting Redis on 127.0.0.1:$REDIS_PORT..."
  nohup "$REDIS_DIR/redis-server.exe" --port "$REDIS_PORT" --bind 127.0.0.1 --save "" \
    > "$LOG_DIR/redis.log" 2>&1 &
  disown
fi

for _ in $(seq 1 20); do
  "$REDIS_DIR/redis-cli.exe" -p "$REDIS_PORT" ping >/dev/null 2>&1 && break
  sleep 1
done
"$REDIS_DIR/redis-cli.exe" -p "$REDIS_PORT" ping
pid_on_port "$REDIS_PORT" > "$RUN_DIR/redis.pid"

# --- MinIO -----------------------------------------------------------------

if curl -sf "http://127.0.0.1:$MINIO_API_PORT/minio/health/live" >/dev/null 2>&1; then
  echo "==> MinIO already running."
else
  echo "==> Starting MinIO on 127.0.0.1:$MINIO_API_PORT (console $MINIO_CONSOLE_PORT)..."
  MINIO_ROOT_USER="$MINIO_ROOT_USER" MINIO_ROOT_PASSWORD="$MINIO_ROOT_PASSWORD" \
    nohup "$MINIO_BIN" server "$DATA_DIR/minio-data" \
    --address ":$MINIO_API_PORT" --console-address ":$MINIO_CONSOLE_PORT" \
    > "$LOG_DIR/minio.log" 2>&1 &
  disown
fi

for _ in $(seq 1 30); do
  curl -sf "http://127.0.0.1:$MINIO_API_PORT/minio/health/live" >/dev/null 2>&1 && break
  sleep 1
done
curl -sf "http://127.0.0.1:$MINIO_API_PORT/minio/health/live" >/dev/null
echo "MinIO live."
pid_on_port "$MINIO_API_PORT" > "$RUN_DIR/minio.pid"

echo "==> Ensuring development bucket '$MINIO_BUCKET' exists..."
export MC_HOST_healthcaredev="http://$MINIO_ROOT_USER:$MINIO_ROOT_PASSWORD@127.0.0.1:$MINIO_API_PORT"
"$MC_BIN" mb --ignore-existing "healthcaredev/$MINIO_BUCKET" >/dev/null

cat <<EOF

Local infrastructure is up:
  PostgreSQL  127.0.0.1:$POSTGRES_PORT   (db=$POSTGRES_DB, test db=$POSTGRES_TEST_DB, user=$POSTGRES_USER)
  Redis       127.0.0.1:$REDIS_PORT
  MinIO API   http://127.0.0.1:$MINIO_API_PORT   (bucket=$MINIO_BUCKET)
  MinIO UI    http://127.0.0.1:$MINIO_CONSOLE_PORT

Next: cd backend && php artisan serve   /   cd frontend && npm run dev
Status:  scripts/dev-status.sh
Stop:    scripts/dev-down.sh
EOF
