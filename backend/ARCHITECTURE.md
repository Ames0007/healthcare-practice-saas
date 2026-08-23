# Backend Architecture

This document is the backend-local companion to `CLAUDE.md` and
Specifications #4-#6. It records the structural conventions established
by TASK-002 (backend bootstrap). It is not a source of product/business
requirements — see `docs/specifications/` for those.

**No business functionality is implemented yet.** This is the framework
and structural foundation only.

## Modular-monolith philosophy

One Laravel application, deployed as a single unit, internally organized
into isolated business modules under `app/Modules/` (see
`app/Modules/README.md`). Microservices are explicitly out of scope
(ADR-001; `CLAUDE.md` §4).

Rationale (Specification #4 §63 / #5 §63): one team, heavily
transactional cross-domain workflows, fast market launch, modest initial
scale. A well-structured modular monolith can be extracted into services
later if justified; a premature microservice split would add operational
cost without a corresponding benefit today.

## Module ownership

Each module owns its own business rules and data. Cross-module
interaction happens through explicit application services or domain
events — never by one module directly querying or writing another
module's tables. See `app/Modules/README.md` for the planned module list
and current (empty) state.

## Layering

Every module follows:

```text
Domain/           Entities, value objects, domain rules, state
                   transitions, domain events. No framework/HTTP
                   dependency.
Application/       Use cases, commands, queries, transaction
                   orchestration, use-case-specific authorization.
Infrastructure/     Database repositories, Redis, object storage,
                   external provider adapters.
Presentation/       HTTP controllers, request validation, response
                   transformation.
```

Controllers are thin: request validation and response shaping only.
Business logic belongs in Application/Domain, not in controllers.

## API

REST JSON under `/api/v1`. Route loading convention:

```text
routes/api.php        registers the /api/v1 group, currently loading:
routes/api/v1.php     all v1 routes; module route files will be
                       required from here as modules are implemented
```

`/api/v1/health` (TASK-002) is a liveness check only — it proves the
application booted and can serve JSON. It intentionally does not check
PostgreSQL/Redis/object-storage readiness; that is deferred to a later
foundation task, consistent with TASK-002's scope boundary (TASK-005
owns PostgreSQL, TASK-006 owns Redis/queues).

Unknown API routes and other errors render as safe JSON (no stack
trace/file paths) whenever the request is under `api/*` or expects JSON
— configured in `bootstrap/app.php` via `shouldRenderJsonWhen`. The
standardized `{code, message, details, request_id}` error contract is
TASK-011's scope, not TASK-002's.

## Tenant-context principle

Not implemented yet (Identity/Tenancy is Phase 1). When implemented, no
request may trust a client-supplied `tenant_id`. Tenant is resolved
server-side from the authenticated session's active membership and
injected into the application layer as `TenantContext`; repositories
scope every tenant-owned query from it. See `CLAUDE.md` §6-7 and
Specification #5 §14.

## Database

`DB_CONNECTION` is set to `pgsql` (matching ADR-001) with local
placeholder credentials in `.env`/`.env.example` — no real credentials,
and no PostgreSQL server is provisioned yet. Actual connectivity,
migrations and schema design are TASK-005's scope; TASK-002
intentionally does not implement domain migrations or run `migrate`
against a real database. The framework's own default migrations (users,
cache, jobs tables) are present as installer scaffolding only and are
not yet run.

Session/cache/queue remain on Laravel's installer default (`database`
driver) for now; they move to Redis in TASK-006 per ADR-001. Because no
database is provisioned, routes that depend on the `web` middleware
group's session handling (e.g. the framework's default `/` and `/up`
routes) will not function until TASK-005 provisions PostgreSQL — this is
expected. `/api/v1/health` uses the stateless `api` middleware group and
is unaffected.

## Testing

`phpunit.xml` uses Laravel's zero-infrastructure testing defaults
(in-memory SQLite, array cache/session, sync queue, `APP_DEBUG=false`).
This is independent of the `pgsql` target above and requires no external
service. A dedicated test-database strategy is TASK-007's scope.
