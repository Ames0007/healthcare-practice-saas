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
