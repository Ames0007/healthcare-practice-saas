#!/usr/bin/env bash
# DESTRUCTIVE: deletes all local development infrastructure data
# (PostgreSQL database, MinIO objects, Redis dump). Never run automatically.
#
# Equivalent to `docker compose down -v` in a Docker-based setup.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/dev-env.sh"

if [ "${1:-}" != "--yes" ]; then
  cat <<EOF
This DELETES all local development data:
  $DATA_DIR/postgres-data
  $DATA_DIR/minio-data

This is irreversible. Re-run as:
  scripts/dev-reset.sh --yes
EOF
  exit 1
fi

"$ROOT_DIR/scripts/dev-down.sh" || true
rm -rf "$DATA_DIR/postgres-data" "$DATA_DIR/minio-data"
echo "Local development data deleted. Run scripts/dev-up.sh to recreate."
