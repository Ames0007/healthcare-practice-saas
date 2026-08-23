# Backend — Healthcare Practice Management SaaS

Laravel backend for the Moroccan bilingual FR/AR Healthcare Practice
Management SaaS. See `/CLAUDE.md` and `/docs/specifications/` at the
repository root for product/architecture requirements, and
`ARCHITECTURE.md` in this directory for the backend structural
convention established by TASK-002.

No business functionality is implemented yet (Phase 0 — Engineering
Foundation).

## Requirements (as validated in TASK-002)

- PHP 8.5.9 (NTS) — Laravel 13 requires `^8.3`.
- Composer 2.10.2.

## Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

`DB_CONNECTION` defaults to `pgsql` with local placeholder credentials —
no PostgreSQL server is provisioned yet (TASK-005). Do not run
`php artisan migrate` until a real database is configured.

## Running locally

```bash
php artisan serve
```

Then:

```bash
curl http://127.0.0.1:8000/api/v1/health
# {"status":"ok"}
```

Note: the framework's default `/` and `/up` routes use the `web`
middleware group, which needs a working database connection for
sessions. They will not respond correctly until TASK-005 provisions
PostgreSQL — this is expected. `/api/v1/health` uses the stateless `api`
middleware group and works today.

## Tests

```bash
php artisan test
```

Tests run against Laravel's zero-infrastructure testing defaults
(in-memory SQLite, array cache/session) — see `phpunit.xml`. No external
service is required.

## Code style

```bash
./vendor/bin/pint --test   # check
./vendor/bin/pint          # fix
```
