# Architectural Decision Records

Format:

```text
ADR-XXX
Context
Decision
Alternatives
Consequences
Date
```

---

## ADR-001 — Core Technology Stack

### Status

Accepted

### Decision

Use:

```text
Frontend:
Next.js + React + TypeScript

Backend:
Laravel

Database:
PostgreSQL

Cache / Queue:
Redis

File Storage:
S3-compatible private object storage

Architecture:
Modular Monolith

API:
REST JSON under /api/v1
```

### Context

The application is workflow-heavy and transaction-heavy, including:

- Patients
- Appointments
- Clinical records
- Treatments
- Invoices
- Payments
- Caisse
- HR
- Commissions
- Inventory
- Communications
- Subscriptions

The architecture prioritizes rapid commercial development, transactional correctness, maintainability and future extensibility.

### Alternatives

Not formally recorded prior to this decision. This stack was pre-approved before TASK-001 execution began.

### Consequences

- Laravel becomes the backend framework for subsequent tasks.
- Next.js/TypeScript becomes the frontend.
- Do not introduce NestJS or another backend framework without a new approved ADR.
- Do not introduce microservices without an approved architectural change.

### Date

2026-08-23

---

## ADR-002 — Local development infrastructure: native/portable services instead of Docker Compose

### Status

Accepted

### Decision

Local PostgreSQL, Redis and MinIO run as native, user-local portable
processes — not Docker containers — started/stopped via `scripts/dev-*.sh`:

```text
PostgreSQL 18.6   EDB Windows x64 binaries zip   ~/.local/opt/postgresql
Redis 8.10.1      redis-windows (msys2 build)    ~/.local/opt/redis
MinIO             dl.min.io windows-amd64        ~/.local/opt/minio (+ mc)
```

Frontend (Next.js) and backend (Laravel) continue to run natively, exactly
as established in TASK-002/TASK-003 — unaffected by this decision.

### Context

TASK-004 targets Docker Compose-based local infrastructure (PostgreSQL,
Redis, MinIO) per Specification #5 §62. On this development machine,
Docker/Docker Compose are not installed, and WSL2 is not confirmed
working (inspecting the underlying Windows optional feature requires
admin rights unavailable in this environment). TASK-004's own instructions
explicitly prohibit silently installing Docker Desktop or system-level
virtualization software, and require asking for approval before any such
system-level change (CLAUDE.md §63 stop condition: required dependency
missing).

The user was asked and chose the native/portable path over installing
Docker Desktop themselves or leaving TASK-004 blocked — see RISK-014.

### Alternatives

1.  User installs Docker Desktop (admin rights, likely a reboot) —
    available later; not chosen for this task.
2.  Report BLOCKED and stop without infrastructure — rejected; a real,
    validated local environment was achievable without any system-level
    installation.
3.  **Chosen:** native/portable binaries under the user's local profile
    (`~/.local/opt`, `~/.local/var`), matching the precedent already
    established by TASK-002 for PHP/Composer.

### Consequences

-   No `compose.yml`/`docker-compose.yml` exists in this repository yet.
    `docs/development/LOCAL_DEVELOPMENT.md` is the source of truth for
    reproducing the environment; a compose file can be authored and
    validated in a future task once Docker is confirmed available here
    (see RISK-014).
-   The portable Windows PHP build (TASK-002) has no native `phpredis`
    extension, so Laravel is configured with `REDIS_CLIENT=predis`
    (pure-PHP client, added via Composer) for this environment instead of
    the default `phpredis`.
-   Local infrastructure is per-developer-machine rather than
    declaratively shared via a compose file; another Windows developer
    without Docker follows the same manual install steps.
-   Production/staging topology (Specification #5 §66 — managed
    PostgreSQL/Redis/S3) is entirely unaffected; this decision is
    local-development-only.

### Date

2026-08-23

---

## ADR-003 — PostgreSQL schema strategy: single `public` schema for V1

### Status

Accepted

### Decision

All application tables live in the default PostgreSQL `public` schema.
No per-domain PostgreSQL schemas (`identity.*`, `clinical.*`,
`billing.*`, ...) are created. Module ownership is enforced at the
application level (modular monolith directory/namespace boundaries — see
CLAUDE.md §4-5), not via database schema boundaries.

### Context

Specification #4 §56 lists per-domain PostgreSQL schemas as an
*optional* organizational device, explicitly noting "a modular
application with consistent table prefixes can also work" and warning
against overengineering "if framework conventions make schema separation
cumbersome." Laravel's migration/model/query-builder conventions assume
the `public` schema by default; using multiple schemas would require
non-default configuration (per-connection `search_path`, or namespacing
every table reference) throughout the codebase for no functional benefit
at this project's current scale (modular monolith, one Postgres
instance, tenant isolation already carried by `tenant_id` + application
scoping rather than schema boundaries).

### Alternatives

1.  Per-domain PostgreSQL schemas as listed in Spec #4 §56 — rejected for
    V1: adds friction (non-default Laravel configuration, cross-schema
    foreign keys) without a concrete requirement driving it yet.
2.  **Chosen:** single `public` schema; module ownership stays a
    code-organization concern (`app/Modules/<Name>/...`).

### Consequences

- Every migration targets `public` implicitly — no schema-qualified
  table names needed anywhere in application code.
- If a genuine driver for schema separation emerges later (e.g.
  per-tenant physical isolation, which Spec #4 §2.3 already says is not
  required at the initial target scale), this decision would need to be
  revisited with its own ADR — it is not a permanent architectural wall,
  just the correct default for now.
- Tenant isolation continues to rely on `tenant_id` + application-level
  scoping (see `backend/database/README.md`), not schema boundaries.

### Date

2026-08-23

---

## ADR-004 — UUID strategy: application-generated UUIDv7, native `uuid` storage

### Status

Accepted

### Decision

Primary keys are application-generated **UUIDv7** (RFC 9562), stored as
native PostgreSQL `uuid` columns (never `varchar`), via Laravel's
built-in `HasUuids` trait — wrapped in a thin project trait,
`App\Models\Concerns\HasUuidPrimaryKey`, so future domain models depend
on one project-owned name rather than composing `HasUuids` directly.

### Context

Specification #4 §2.4 requires UUID/UUIDv7-style primary identifiers.
Inspecting the installed framework (Laravel 13.26.1) found that its
`HasUuids` trait already generates UUIDv7 by default
(`Illuminate\Support\Str::uuid7()`, backed by `ramsey/uuid` ^4.7 —
confirmed via `vendor/laravel/framework/src/.../HasUuids.php`) and
already configures the model as non-incrementing with a string key type
via the underlying `HasUniqueStringIds` trait. No custom UUID generation
code was needed — only a thin project-namespaced wrapper for a single
point of future change, per Spec 06 TASK-005 §9's explicit guidance to
avoid reinventing UUID handling per model.

### Alternatives

1.  Laravel's `HasVersion4Uuids` (random UUIDv4) — rejected: worse index
    locality than time-ordered UUIDv7, no benefit given UUIDv7 is
    natively available.
2.  Database-generated UUIDs (e.g. `gen_random_uuid()` as a column
    default) — rejected: mixes generation ownership between the
    application and the database, and Spec 06 TASK-005 §8 explicitly
    prefers one clear owner (the application, before persistence).
3.  A bespoke UUIDv7 implementation — unnecessary; the framework already
    provides a correct, tested one.
4.  **Chosen:** application-generated UUIDv7 via `HasUuids`, wrapped in
    `HasUuidPrimaryKey`.

### Consequences

- All future domain models use `use HasUuidPrimaryKey;` instead of
  composing `HasUuids` directly.
- Migrations must use `$table->uuid('id')->primary()` — never
  `$table->id()` (auto-increment integer) or a `varchar` UUID column.
- Human-facing references (`PAT-000281`, `FAC-2026-00142`, ...) remain a
  separate, later concern — never the primary key.

### Date

2026-08-23
