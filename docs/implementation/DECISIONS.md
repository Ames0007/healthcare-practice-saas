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

---

## ADR-005 — UI-007CDEF Attendance (check-in/check-out): frontend prototype ahead of the approved backend scope

### Status

Accepted

### Decision

Implement a local, non-persisted, frontend-only check-in/check-out
prototype for UI-007CDEF's Gate 1 (Attendance), exactly as this task's
own explicit instructions (§16-18) require — while recording here that
this deliberately runs ahead of two independent statements in the
approved specifications that clock-in/out is *not* part of the V1
product design:

- Spec #4 §20 (`domain-data-architecture.md`), directly under
  `employee_work_schedules`: *"No clock-in/out entity is required in
  V1."*
- Spec #3 §39 (`business-workflows.md`, WF-36 — Configure staff
  schedule/shifts), its own explicit closing line: *"No clock-in/out
  tracking."*

Both statements are about the *approved backend/workflow scope*, not
about whether a frontend prototype screen may exist. Nothing this task
adds creates a backend entity, an API endpoint, or persisted data of
any kind — `AttendanceRecord` exists only as in-memory React state,
reset on navigation/refresh (CLAUDE.md §1 priority order also places
the current task's own explicit instructions above the specifications
for exactly this kind of situation).

### Context

CLAUDE.md §1 requires recording, not silently resolving, a material
contradiction between current task instructions and the approved
specifications when it could affect correctness, security, data
integrity or product behavior. This one does not touch any of those —
it is a non-persisted UI affordance with no backend counterpart
anywhere in this repository (consistent with every other UI-00X task
in this session, all of which are frontend-only prototypes) — but the
scope disagreement is real and worth a durable record for whoever
scopes the eventual backend Team/Attendance module, so this decision
is not silently lost once the frontend code itself no longer states it
inline.

### Alternatives

1.  Stop the entire UI-007CDEF task and request clarification before
    implementing Gate 1 — rejected: the task's own instructions are
    extremely detailed and explicit about this exact feature (89
    numbered sections, four acceptance-criteria checklists), strongly
    suggesting deliberate intent to prototype ahead of the backend
    spec, not an oversight; and the deviation carries no
    correctness/security/data-integrity risk since nothing is
    persisted or transmitted.
2.  Silently implement it without recording the tension — rejected:
    CLAUDE.md §1 explicitly forbids silently resolving a material
    specification contradiction.
3.  **Chosen:** implement as instructed, record this ADR, and label the
    feature clearly in code/docs as a frontend-only prototype with no
    backend counterpart yet.

### Consequences

- A future backend HR/Attendance module must independently decide
  whether to introduce a real `attendance_records`-style entity (or
  continue relying on schedule-only planning, as the specs currently
  describe) — this ADR does not itself approve that backend entity.
- `AttendanceRecord` (`components/domain/team/types.ts`) carries an
  explicit doc-comment cross-reference to this ADR.
- If the specifications are later updated to formally exclude
  clock-in/out from the product entirely, this frontend prototype
  screen would need to be removed or re-scoped — tracked here rather
  than only in a code comment that could be lost in a future refactor.

### Date

2026-08-26
