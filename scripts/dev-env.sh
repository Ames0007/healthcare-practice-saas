# Shared local-infrastructure defaults. Sourced (not executed) by
# scripts/dev-*.sh. See docs/development/LOCAL_DEVELOPMENT.md.
#
# These are dev-only placeholder values (TASK-004) — never used in
# staging/production. Override any of them via a root .env file
# (gitignored; see .env.example) if you need different local ports.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

: "${POSTGRES_DB:=healthcare_practice}"
: "${POSTGRES_TEST_DB:=healthcare_practice_test}"
: "${POSTGRES_USER:=healthcare}"
: "${POSTGRES_PASSWORD:=healthcare_dev_only}"
: "${POSTGRES_PORT:=5432}"

: "${REDIS_PORT:=6379}"

: "${MINIO_ROOT_USER:=healthcare_dev}"
: "${MINIO_ROOT_PASSWORD:=healthcare_dev_only_password}"
: "${MINIO_API_PORT:=9000}"
: "${MINIO_CONSOLE_PORT:=9001}"
: "${MINIO_BUCKET:=healthcare-practice-dev}"

TOOLS_DIR="$HOME/.local/opt"
DATA_DIR="$HOME/.local/var/healthcare-practice-saas"
RUN_DIR="$DATA_DIR/run"
LOG_DIR="$DATA_DIR/logs"

PG_BIN="$TOOLS_DIR/postgresql/bin"
REDIS_DIR="$TOOLS_DIR/redis"
MINIO_BIN="$TOOLS_DIR/minio/minio.exe"
MC_BIN="$TOOLS_DIR/minio/mc.exe"

# Git Bash's `$!` for a backgrounded native (non-MSYS) .exe is an
# MSYS-internal PID, not the real Windows PID — it will not match
# anything `tasklist`/`taskkill` can find. Resolve the real PID from the
# port the process is actually listening on instead; this also makes
# "is it already running" a direct, always-fresh check instead of trusting
# a possibly-stale pid file.
pid_on_port() {
  local port="$1"
  netstat -ano 2>/dev/null | grep "LISTENING" | grep ":$port[[:space:]]" | awk '{print $NF}' | sort -u | head -1
}

stop_port() {
  local port="$1"
  local pid
  pid="$(pid_on_port "$port")"
  if [ -n "$pid" ]; then
    taskkill //F //PID "$pid" >/dev/null 2>&1 || true
  fi
}
