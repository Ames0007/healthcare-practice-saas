# Local Development Environment

Reproducible local setup for the Healthcare Practice Management SaaS:
Next.js frontend, Laravel backend, PostgreSQL, Redis and S3-compatible
object storage (MinIO), established by TASK-004.

**Local infrastructure runs as native/portable processes, not Docker.**
Docker/Docker Compose were not available on the machine this was built on
(no admin rights to verify/enable virtualization), and TASK-004's own
instructions prohibit silently installing system-level virtualization
software. See `docs/implementation/DECISIONS.md` ADR-002 and
`docs/implementation/RISKS_AND_BLOCKERS.md` RISK-014 for the full
reasoning. If your machine has Docker available, you can still follow
this guide (the scripts don't require it) — a `compose.yml` may be added
in a future task once Docker is confirmed usable in this project.

---

## 1. Prerequisites

| Tool | Version used | Notes |
|---|---|---|
| PHP | 8.5.9 (NTS) | Portable install, TASK-002. `php --version` |
| Composer | 2.10.2 | Portable install, TASK-002. |
| Node.js | 24.15.0 | TASK-003. Next.js 16 requires 20.9+. |
| npm | 11.12.1 | Only package manager used (single lockfile). |
| Git | 2.53.0 | |
| PostgreSQL | 18.6 (Windows x64 binaries) | Portable, no installer — this guide. |
| Redis | 8.10.1 (redis-windows msys2 build) | Portable, no installer — this guide. |
| MinIO | RELEASE.2025-09-07T16-13-09Z | Portable single binary — this guide. |

No admin rights are required for anything in this guide. Everything
installs under your user profile (`~/.local/opt`, `~/.local/var`) — never
inside the repository.

## 2. Repository location assumptions

This guide assumes the repository is checked out at a path without
spaces (used here: `~/Downloads/healthcare-practice-saas`) and that you
run all commands from a Git Bash shell (MSYS) on Windows. PowerShell
users can run the same underlying `.exe` tools directly, but
`scripts/dev-*.sh` are Bash scripts and need Git Bash/WSL to run as-is.

## 3. Install local infrastructure binaries (one-time)

Downloads are from official sources: EDB (PostgreSQL), the actively
maintained `redis-windows/redis-windows` GitHub project (native Redis
Windows builds), and `dl.min.io` (official MinIO download server).

```bash
mkdir -p ~/.local/opt

# PostgreSQL 18.6 — https://www.enterprisedb.com/download-postgresql-binaries
curl -L -o /tmp/postgresql.zip \
  "https://get.enterprisedb.com/postgresql/postgresql-18.6-1-windows-x64-binaries.zip"
unzip -q /tmp/postgresql.zip -d ~/.local/opt
mv ~/.local/opt/pgsql ~/.local/opt/postgresql

# Redis 8.10.1 — https://github.com/redis-windows/redis-windows/releases
curl -L -o /tmp/redis.zip \
  "https://github.com/redis-windows/redis-windows/releases/download/8.10.1/Redis-8.10.1-Windows-x64-msys2.zip"
mkdir -p ~/.local/opt/redis
unzip -q /tmp/redis.zip -d ~/.local/opt/redis

# MinIO server + client — https://dl.min.io
mkdir -p ~/.local/opt/minio
curl -L -o ~/.local/opt/minio/minio.exe "https://dl.min.io/server/minio/release/windows-amd64/minio.exe"
curl -L -o ~/.local/opt/minio/mc.exe "https://dl.min.io/client/mc/release/windows-amd64/mc.exe"
chmod +x ~/.local/opt/minio/minio.exe ~/.local/opt/minio/mc.exe
```

You should end up with:

```text
~/.local/opt/postgresql/bin/{pg_ctl,initdb,psql,createdb,pg_isready}.exe
~/.local/opt/redis/{redis-server,redis-cli}.exe
~/.local/opt/minio/{minio,mc}.exe
```

`scripts/dev-up.sh` checks for these exact paths and fails with a clear
message if any are missing.

## 4. Environment setup

```bash
# Root — local infrastructure defaults (optional; scripts already default
# to these same dev-only values, see .env.example)
cp .env.example .env   # only if you want to override a port/credential

# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
cd ..

# Frontend
cd frontend
npm install
cd ..
```

`backend/.env.example` already targets the exact credentials TASK-004's
PostgreSQL/Redis/MinIO setup creates (`healthcare` / `healthcare_dev_only`
/ `healthcare_practice`, `REDIS_CLIENT=predis`, local MinIO `AWS_*`
endpoint) — copying it as-is works with no edits.

## 5. Start infrastructure

```bash
scripts/dev-up.sh
```

Idempotent — safe to re-run. First run initializes the PostgreSQL data
directory and creates the `healthcare_practice` database and development
MinIO bucket; later runs just start the three processes if not already
running. Prints a summary of ports/credentials when done.

## 6. Start the backend

```bash
cd backend
php artisan serve
```

```bash
curl http://127.0.0.1:8000/api/v1/health
# {"status":"ok"}
```

## 7. Start the frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`.

## 8. Queue worker (future — TASK-006 owns the real foundation)

Laravel's queue connection is still `QUEUE_CONNECTION=database` (the
framework default) — TASK-004 does not change this or introduce Redis
queue architecture (see CLAUDE.md §41 boundary). Once TASK-005's
migrations exist (the default `jobs` table), the worker command will be:

```bash
cd backend
php artisan queue:work
```

This is documented, not run/validated by TASK-004 — it depends on
migrations that are out of scope here.

## 9. Health checks

```bash
scripts/dev-status.sh
```

Reports PostgreSQL (`pg_isready`), Redis (`PING` → `PONG`) and MinIO
(`/minio/health/live`) individually.

## 10. Shutdown

```bash
scripts/dev-down.sh
```

Stops all three processes. **Data is preserved** (PostgreSQL data
directory and MinIO bucket contents survive under `~/.local/var/`).
Restart with `scripts/dev-up.sh` — the same database/bucket will still be
there.

## 11. Destructive reset

```bash
scripts/dev-reset.sh --yes
```

**Deletes** the PostgreSQL data directory and all MinIO objects
(equivalent to `docker compose down -v`). Never run this automatically or
without the explicit `--yes` flag — running it without `--yes` only
prints a warning and exits.

## 12. Troubleshooting

**`scripts/dev-up.sh` exits with "Missing: ..."** — a binary isn't where
step 3 expects it. Re-check the install steps; `mv ~/.local/opt/pgsql
~/.local/opt/postgresql` in particular is easy to miss (the PostgreSQL
zip extracts to `pgsql/`, not `postgresql/`).

**PostgreSQL won't start / `pg_ctl: another server might be running`** —
a previous instance is still holding the data directory. Run
`scripts/dev-status.sh`; if PostgreSQL reports ready but you expected it
down, it's already running — just proceed. Otherwise check
`~/.local/var/healthcare-practice-saas/logs/postgres.log`.

**Port already in use** — another process on this machine already uses
5432/6379/9000/9001/8000/3000. Set the relevant `*_PORT` variable in a
root `.env` (copy from `.env.example`) before running `scripts/dev-up.sh`,
and update `backend/.env` to match if you changed `POSTGRES_PORT` or
`REDIS_PORT`.

**`redis-cli`/`minio` "not recognized"** — you're in PowerShell, not Git
Bash. Either switch shells, or call the `.exe` files directly with their
full path.

## 13. Windows / Git Bash notes

- All three services are plain Windows processes, not services — they
  disappear at logout/reboot, exactly like closing any other terminal
  app. Run `scripts/dev-up.sh` again after restarting your machine.
- `scripts/dev-down.sh`/`dev-reset.sh` stop processes with `taskkill //F`
  (PostgreSQL uses its own `pg_ctl stop -m fast` instead, which is
  graceful). Git Bash's POSIX `kill` does not reliably signal native
  Windows console apps, so this is the pragmatic choice here — it is not
  a crash-safety concern for ordinary dev shutdown.
- `nohup ... &` is used to background Redis/MinIO from a Bash script;
  their PIDs are tracked in `~/.local/var/healthcare-practice-saas/run/`.
- No admin rights, Docker Desktop, WSL, or reboot are required by any
  step in this guide.
