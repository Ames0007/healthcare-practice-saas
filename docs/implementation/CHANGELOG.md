# Changelog

All notable changes to this project are documented in this file.

## Unreleased

### Added

- Repository governance structure
- Specification organization
- Claude Code implementation tracking
- Architectural decision log
- Risk/blocker register
- Laravel 13.26.1 backend bootstrap under `backend/` (TASK-002): modular-monolith
  structural convention (`backend/app/Modules/`, `backend/ARCHITECTURE.md`),
  `/api/v1` route-loading convention, `/api/v1/health` liveness endpoint,
  environment-driven CORS configuration. No business functionality.
- Next.js 16.3.2 frontend bootstrap under `frontend/` (TASK-003): five
  top-level route areas (`/auth`, `/onboarding`, `/app`, `/book`, `/admin`),
  design-token foundation (`frontend/src/design-system`), foundational
  component set (Button, Input, Card, StatusBadge, Skeleton, EmptyState,
  AppShell/AppSidebar/AppTopbar/PageHeader), genuine FR/AR i18n + RTL
  foundation (cookie-backed, no flash), responsive shell (mobile bottom
  nav / tablet collapsed rail / desktop expanded sidebar). No business
  functionality, no backend integration.
- Specification #10 (Visual Identity & Graphic Charter) approved and added
  to the repository (TASK-003A). Design tokens realigned to the approved
  palette (primary hover, secondary/disabled text, and all four semantic
  "soft" tones corrected to the approved HEX values; `primary-strong`,
  `primary-support`, `primary-soft`, `text-disabled` added). Typography
  confirmed (Inter / Noto Sans Arabic, unchanged from TASK-003). Fixed two
  charter deviations found during audit: the SaaS Admin shell used a dark
  header bar (prohibited by Spec #10 §32) and the sidebar's selected-item
  background used a generic neutral instead of the approved Primary-50
  soft surface (Spec #10 §16/§19). Added a `primary` StatusBadge tone
  (restrained teal, for "in consultation"-style active-process states).
  Aligned the `/book` placeholder with the charter (cabinet-identity area,
  teal primary action — still non-functional). Rendered browser visual QA
  was not possible in this environment (no browser-automation tooling);
  validated instead via compiled-CSS hex inspection and SSR HTML/dir/lang
  inspection across FR and AR for all five route areas. No business
  functionality, no backend integration.
- Local development infrastructure established (TASK-004): PostgreSQL
  18.6, Redis 8.10.1 and MinIO run as native/portable processes — no
  Docker on this development machine, see `DECISIONS.md` ADR-002 and
  `RISKS_AND_BLOCKERS.md` RISK-014 — managed via `scripts/dev-up.sh` /
  `dev-down.sh` / `dev-status.sh` / `dev-reset.sh`. Backend connects to a
  real local PostgreSQL database and, via `predis/predis` (the portable
  PHP build has no native `phpredis` extension), a real local Redis
  instance; MinIO provides local S3-compatible object storage with a
  `healthcare-practice-dev` bucket. Full local stack (frontend + backend
  + all three infrastructure services) validated running simultaneously;
  PostgreSQL and MinIO data confirmed to survive a stop/restart cycle.
  New `docs/development/LOCAL_DEVELOPMENT.md` guide. No migrations, no
  queue architecture, no application file-storage behavior — those remain
  TASK-005/TASK-006 scope.
- PostgreSQL application foundation established (TASK-005). Reviewed
  Laravel's three default migrations (users/password_reset_tokens/
  sessions, cache/cache_locks, jobs/job_batches/failed_jobs) against
  Specification #4 before they were ever applied and removed all three —
  `database/migrations/` is deliberately empty (see
  `database/migrations/README.md`); the `users` schema conflicted with
  Spec #4 §4.1's UUID-based Identity model and auth/cache/queue are later
  tasks' scope (TASK-014/015, TASK-006). Removed `app/Models/User.php`
  and its factory as a consequence; `config/auth.php` no longer
  hardcodes a default Authenticatable model. `SESSION_DRIVER`/
  `CACHE_STORE`/`QUEUE_CONNECTION` moved from `database` to `file`/
  `file`/`sync` accordingly — no behavior silently depended on the
  removed tables. Established the UUID convention: application-generated
  UUIDv7 (RFC 9562) via a new `App\Models\Concerns\HasUuidPrimaryKey`
  trait wrapping Laravel's native `HasUuids` (already UUIDv7-based in
  13.26.1 — no custom generation code needed), stored as native
  PostgreSQL `uuid` columns. `config/database.php`'s `pgsql` connection
  now pins the session to UTC regardless of server locale. Added a
  dedicated `healthcare_practice_test` database (provisioned by
  `scripts/dev-up.sh` alongside the development database) and
  reconfigured `phpunit.xml` to run the full suite against real
  PostgreSQL instead of SQLite, with the test database hardcoded so
  `php artisan test` cannot reach development data by name alone. Added
  `tests/Feature/Database/DatabaseFoundationTest.php` (6 tests) proving
  the PostgreSQL connection, UUIDv7 generation/round-tripping, and
  NUMERIC(14,2) money precision against a test-only fixture table
  (created/dropped per test, never a migration). New
  `backend/database/README.md` documents the UUID/timestamp/money/
  tenant-table/tenant-aware-FK/migration/constraint/index conventions;
  ADR-003 (single `public` schema for V1) and ADR-004 (UUIDv7 strategy)
  record the material decisions. RLS remains an open, deliberately
  deferred decision (RISK-007, unchanged). No business-domain tables,
  no TASK-006 (Redis queue/cache) functionality implemented.
- Aujourd'hui dashboard prototype (UI-001), replacing the TASK-003
  foundation/demo page as the real `/app` landing screen. Built entirely
  against a new centralized mock-data layer
  (`frontend/src/features/today/mock-data.ts`, synthetic Moroccan-context
  names only) — no backend/API integration. Composed from new reusable
  components: `MetricCard` and `AttentionItem`
  (`components/ui/`, domain-neutral) and `AppointmentCard` plus a central
  appointment status → tone/label registry
  (`components/domain/appointments/`, intended for reuse by Agenda/
  UI-002). Implements the header (greeting + locale-aware business date),
  four operational KPI cards, a prominent "Prochain rendez-vous" section
  with a prototype-only local-state "Patient arrivé" interaction
  (Confirmed → Arrived, no persistence), "Agenda du jour", a neutral "À
  faire" attention list, and a typography-led (not green/red-coded)
  "Finances aujourd'hui" snapshot — all reusing the existing AppShell,
  design tokens and graphic charter. Loading (shape-matched skeleton),
  empty-day and error states are implemented and covered by tests; the
  live page only exercises loading→loaded (a fixed prototype delay, no
  real fetch) since there is nothing to error against yet. Full FR/AR
  translations added under a new `aujourdhui.*` dictionary namespace;
  RTL verified. Added `frontend/src/features/today/today-dashboard.test.tsx`
  (7 tests: FR content, AR/RTL, the local status-change interaction, empty/
  loading/error states). Renamed the stale `emptyState.backToFoundation`
  translation key to `emptyState.backToHome` since the catch-all `/app/*`
  placeholder now points back to a real dashboard, not a demo page. All
  13 frontend tests, typecheck, lint and build pass; backend regression
  (10 tests) unaffected — no backend files touched.
