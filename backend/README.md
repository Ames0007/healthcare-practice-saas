# Backend — Healthcare Practice Management SaaS

Laravel backend for the Moroccan bilingual FR/AR Healthcare Practice
Management SaaS. See `/CLAUDE.md` and `/docs/specifications/` at the
repository root for product/architecture requirements, `ARCHITECTURE.md`
in this directory for the backend structural convention established by
TASK-002, and `database/README.md` for the PostgreSQL/UUID/money
conventions established by TASK-005.

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

`DB_CONNECTION` defaults to `pgsql`. A real local PostgreSQL instance is
provisioned by TASK-004 — see
[`../docs/development/LOCAL_DEVELOPMENT.md`](../docs/development/LOCAL_DEVELOPMENT.md)
— and `.env.example`'s credentials already match it.
`database/migrations/` is deliberately empty (TASK-005 reviewed and
removed Laravel's default scaffolding migrations before they were ever
applied — see `database/migrations/README.md` and `database/README.md`).
`php artisan migrate` is safe to run (there is simply nothing to migrate
yet); the first real migrations land with Identity/Tenancy (Phase 1).

## Running locally

```bash
php artisan serve
```

Then:

```bash
curl http://127.0.0.1:8000/api/v1/health
# {"status":"ok"}
```

`/` (the framework's default welcome page) also works — sessions use the
`file` driver, not a database table (TASK-005; see `database/README.md`).

## Tests

```bash
php artisan test
```

Tests run against a real local PostgreSQL database — a **dedicated**
`healthcare_practice_test` database, never the normal development
database (see `database/README.md#testing` and `phpunit.xml`). Requires
the TASK-004 local infrastructure to be running
(`../scripts/dev-up.sh`), which provisions this test database
automatically.

## Code style

```bash
./vendor/bin/pint --test   # check
./vendor/bin/pint          # fix
```
