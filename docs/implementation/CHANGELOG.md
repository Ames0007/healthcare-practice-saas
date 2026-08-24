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
- Agenda & appointment prototype (UI-002) at `/app/agenda`, replacing the
  placeholder. Extended the appointment domain layer for reuse across both
  prototype screens: moved `AppointmentStatus` into
  `components/domain/appointments/types.ts` (11-state machine — the
  original UI-001 6-status subset keeps identical tones, so Aujourd'hui is
  unaffected) and extended `AppointmentCard` with a `calendar` variant,
  explicit `schedulingType`, and an `onSelect` handler. Added four new
  generic `components/ui/` primitives shared across every dialog surface:
  `Dialog` (one focus-trapped, portal-rendered implementation backing
  drawer/modal/alert variants — Escape closes, focus returns to the
  trigger), `ConfirmDialog`, `Toast` (single-slot, not a global provider),
  `Combobox` (keyboard-navigable patient search with a "+ Créer un nouveau
  patient" future-feature notice), and `Select`. New
  `frontend/src/features/agenda/` composition: Day view (30-minute slots,
  click-to-create empty slots) and Week view (desktop grid, mobile day-
  selector + reused Day view list — seven columns are not usable on
  mobile); exact-time vs arrival-window appointments render distinctly
  everywhere (`AppointmentCard`'s "Arrivée entre" wording, not just a
  dash-joined range). `AppointmentDrawer` exposes the state-aware primary
  action from a new central `status-actions.ts` registry (Confirmer →
  Patient arrivé → Mettre en attente → Commencer; Ouvrir consultation is a
  disabled future-route placeholder per UI-005 scope) plus Ouvrir
  patient/Modifier/Reporter/Annuler/Absent. Create/edit
  (`AppointmentFormDialog`), reschedule (`RescheduleDialog`), cancellation
  with a by-patient/by-practice reason (`CancelConfirmDialog`) and no-show
  (`NoShowConfirmDialog`) are all local prototype state transitions on one
  centralized appointment array — a status change from any surface (drawer,
  Waiting Room) is immediately visible on every other surface, with no
  cross-page sync needed since Waiting Room is an in-page toggle, not a
  separate route. A lightweight frontend-only conflict check
  (`features/agenda/conflict.ts`) blocks obviously overlapping exact/
  window bookings per practitioner/date and suggests up to 3 nearby free
  slots — explicitly UX demonstration only, not real server-side
  enforcement. Full FR/AR translations under new `agenda.*` and
  `appointment.*` dictionary namespaces (the latter replacing UI-001's now-
  dead `aujourdhui.status.*` keys); RTL verified, including drawer/
  dialog placement via logical CSS properties (no `rtl:` overrides
  needed). Fixed two genuine bugs surfaced while testing this feature:
  `addDaysIso` mixed local-time `Date` parsing with UTC `toISOString()`
  serialization, silently shifting mock week-view dates by a day on any
  machine ahead of UTC; and Day View matched appointments to time slots by
  exact string equality, so any appointment not starting on an exact
  30-minute boundary (e.g. a 08:55 arrival, or any time a user might type
  into the create form's native time input) silently never rendered — both
  fixed at the root (UTC-consistent date arithmetic; slot-containment
  bucketing) rather than only adjusting mock data to avoid them. Added
  `frontend/src/features/agenda/agenda-page.test.tsx` (20 tests covering
  day/week rendering, exact/window distinction, practitioner filtering,
  drawer open/close, every lifecycle transition, create/conflict/edit/
  reschedule/cancel/no-show, Waiting Room + shared-state propagation,
  empty/loading/error states, and FR/AR/RTL). All 33 frontend tests
  (13 UI-001 + 20 UI-002), typecheck, lint and build pass; backend
  regression (10 tests) unaffected — no backend files touched.
