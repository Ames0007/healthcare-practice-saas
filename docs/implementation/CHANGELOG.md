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
- Patient list prototype (UI-003A) at `/app/patients`, replacing the
  placeholder — the first real Patients workspace. New
  `frontend/src/features/patients/` composition against a centralized
  mock dataset (`mock-data.ts`, 16 synthetic Moroccan-context patients:
  patient number, name, phone, responsible practitioner, last visit, next
  appointment, outstanding balance — administrative/operational fields
  only, no clinical data per CLAUDE.md §13). Desktop table (Patient/
  Téléphone/Praticien/Dernière visite/Prochain RDV/Solde, "Dernière
  visite" hidden below `lg`) and a separate mobile card presentation
  (`PatientTable`/`PatientCardList`, the same dual-render pattern as
  Agenda's Waiting Room) share one `filterPatients()` pure function
  (`filter-patients.ts`) for local, case-insensitive search across name/
  phone/patient number plus practitioner and next-appointment (Today/
  Upcoming/None) filters — result count and a "Effacer les filtres"
  action give active-filter feedback. Compact prev/next pagination
  (`components/ui/pagination.tsx`, 10/page) and an initials-fallback
  `components/ui/avatar.tsx` are new generic primitives (Spec #8 §47/§58).
  Each row links to a new `/app/patients/[id]` route that previews the
  selected patient's synthetic name and reference while explicitly
  deferring the real Patient 360° overview to UI-004; "+ Nouveau patient"
  shows a future-feature toast rather than a creation form (UI-003B
  scope). Three list states beyond loading/loaded: the global empty state
  ("Aucun patient pour le moment"), a distinct filtered/search-empty state
  ("Aucun patient ne correspond à vos critères") that never suggests
  adding a first patient when patients merely happen to be filtered out,
  and an error state with retry. Full FR/AR under a new `patients.*`/
  `patientDetail.*` dictionary namespace; RTL verified (logical
  properties throughout, phone/patient-number isolated `dir="ltr"` inside
  RTL layout). `toIntlLocale` in `features/today/format.ts` was exported
  (previously module-private) so `features/patients/format.ts` can reuse
  it for locale-aware date formatting instead of duplicating it — no
  behavioral change, confirmed by the unchanged UI-001 suite. Added
  `frontend/src/features/patients/patients-page.test.tsx` (18 tests:
  route render, rows, patient number, search by name/phone/patient
  number, practitioner filter, next-appointment filter, clear filters,
  filtered-empty, global empty, loading, error, FR/AR/RTL, the desktop/
  mobile dual-render, the future-feature notice, and the Patient 360°
  placeholder link). All 51 frontend tests (13 UI-001 + 20 UI-002 + 18
  UI-003A), typecheck, lint and build pass; backend regression (10 tests)
  unaffected — no backend files touched.
- Create/edit patient prototype (UI-003B) — "+ Nouveau patient" on
  `/app/patients` now opens a real right-side drawer form instead of the
  UI-003A future-feature toast (removed, along with its now-dead
  `patients.newPatientNotice` key); each row gained a compact "Modifier"
  action alongside "Ouvrir". `/app/patients` now owns a mutable
  `Patient[]` in React state (was recomputed from mock data every render)
  so created/edited patients flow straight through the existing search/
  filter/pagination pipeline with no extra wiring — the same centralized-
  state pattern as Agenda's appointment array (UI-002). New
  `PatientFormDialog` (`components/patient-form-dialog.tsx`) is shared
  by create and edit: primary fields (Prénom/Nom/Téléphone/Praticien
  responsable, all required) plus a collapsible "Informations
  complémentaires" section (birth date/email/city/address/emergency
  contact, all optional, collapsed by default and auto-expanded when
  editing a patient that already has any of these set) — still no
  clinical fields. `Patient` gained the matching optional administrative
  fields; the list/table columns are unchanged. Duplicate detection
  (`duplicate-detection.ts` + `normalize.ts`, Spec #4 §8) flags a
  probable match on normalized phone (`+212`/`00212`/spaced-format
  aware) or same normalized first+last name (accent- and case-
  insensitive); a match never blocks or merges — the form shows each
  candidate's name/number/phone/practitioner with an "Ouvrir ce patient"
  link and one "Créer quand même" override, mirroring Agenda's conflict-
  suggestion UX (UI-002). Edit's duplicate check excludes the patient
  being edited. A new prototype-only sequential generator
  (`patient-number.ts`) continues the existing `PAT-00281`... series.
  Validation (`patient-form-validation.ts`) is inline-rendered per field
  (required first/last/phone/practitioner; optional email format, DOB-
  not-in-future, and a loose Moroccan phone digit-count check reused for
  the emergency contact number) — the form now sets `noValidate` so this
  custom validation actually runs instead of being preempted by
  unlocalized native browser constraint-validation popups, a real gap
  found while writing the required-field test (agenda's own equivalent
  form was never exercised against this exact case). Successful create/
  edit shows a toast ("Patient créé."/"Patient modifié.") and closes the
  drawer; Annuler/Escape discard the draft without submitting. Shared
  locale-utility cleanup: `toIntlLocale` (added to `features/today/
  format.ts` in UI-003A) moved to `frontend/src/i18n/intl-locale.ts` —
  while moving it, found that `features/agenda/format.ts` had
  independently defined the exact same two-line function during UI-002;
  both Today and Agenda now import the one shared copy instead of
  defining/duplicating it. Pure move, no behavioral change, confirmed by
  the unchanged UI-001/UI-002 suites. Full FR/AR for every new form/
  duplicate-warning string; RTL verified. Extended
  `frontend/src/features/patients/patients-page.test.tsx` to 30 tests
  (the 17 surviving UI-003A tests + 1 replacing the retired future-
  feature-toast test + 12 new: required validation, optional/
  complementary fields, no leaked appointment fields, create integrating
  with list/search/practitioner-filter/number-generation in one flow,
  phone duplicate + Open Existing, name duplicate, Create Anyway without
  mutating the original record, edit prefill with a read-only patient
  number, edit updating the list, edit self-exclusion, edit collision
  with a different patient, cancel discarding the draft, and Arabic/RTL
  for the form). All 63 frontend tests (13 UI-001 + 20 UI-002 + 30
  UI-003A/B), typecheck, lint and build pass; backend regression
  (10 tests) unaffected — no backend files touched.
- Patient 360° header + overview (UI-004A), replacing `/app/patients/[id]`'s
  UI-003A placeholder with 6 real routes: `/app/patients/{id}` (Aperçu,
  the only tab with real content this task) plus `/health`, `/appointments`,
  `/treatments`, `/invoices`, `/payments` — each a thin page rendering the
  shared `features/patients/patient-detail-page.tsx` composition root with
  a fixed `activeTab`, chosen over a Next.js `layout.tsx`+children-slot
  approach so the composition root stays one directly-testable component
  (mirrors `AgendaPage`/`PatientsPage`) without Next.js App Router test
  friction; the header/tab lookup re-runs on every tab click, which is
  imperceptible since it is synchronous local mock data. Documented
  prototype limitation: UI-003B's create/edit changes live only in
  `/app/patients`'s own component state, so a patient created there is not
  yet visible here — this route always reads the centralized seed dataset
  (`mock-data.ts`); real cross-page consistency arrives with backend
  integration. New domain layer `components/domain/patients/`: `types.ts`
  (`PatientOverview`/`PatientActiveTreatment`/`PatientNextInstallment`/
  `PatientActivityItem`/`PatientTabKey` — kept separate from the
  administrative `Patient` type per CLAUDE.md §12, so future domain
  concepts don't get folded into it), `patient-header.tsx` (persistent
  identity/context header — pure presentation, every value pre-resolved by
  the caller, no mock-data coupling), `patient-activity-timeline.tsx`
  (the unified activity list — also takes only pre-resolved display
  strings, so the domain layer has no dependency on `features/*`
  formatting code either). New generic `components/ui/tabs.tsx`: real
  `<nav>`/`aria-current="page"` navigation (not the ARIA `tablist`
  pattern, which is for JS-only panel switching with no URL change, as
  Agenda's Day/Week toggle already uses) since these tabs are genuine
  URL-addressable routes; horizontally scrollable so six tabs stay usable
  on mobile. New `features/patients/` pieces: `mock-overview-data.ts`
  (treatment/installment/activity fixtures for a couple of representative
  patients, falling back to an explicit empty overview for the rest),
  `patient-detail-page.tsx` (the composition root: loading/error states,
  not-found derived from a real lookup miss rather than a simulated state,
  header/tabs/Aperçu wiring), `components/patient-overview-content.tsx`
  (the four summary cards — Prochain RDV, Traitement actif, Solde,
  Prochaine échéance — plus the timeline section), `patient-summary-card.tsx`
  (a restrained empty-state rendering, not `MetricCard`'s bold big-number
  treatment, for sentences like "Aucun traitement actif"),
  `patient-tab-placeholder.tsx` (keeps the header/tabs visible on the five
  future tabs; cites the owning future task where UI-004A's own scope
  sections name one — UI-005 for Dossier Santé, UI-006 for Traitements,
  UI-007 for Factures/Paiements — and a generic message for Rendez-vous,
  which wasn't given a number), `patient-detail-skeleton.tsx`. Small,
  justified extensions to existing UI-003A/B code: `PatientNextAppointment`
  gained an optional `service` field (display-only prototype enrichment,
  documented as not a real Agenda/Patients cross-module join, which
  doesn't exist yet); `mock-data.ts` gained a `birthDate` on two seed
  patients so the header's age display ("34 ans") is actually
  demonstrable — every other seed patient still has no birth date, so the
  "age unknown → don't show one" path is exercised too; `format.ts` gained
  `computeAge` (plain integer arithmetic on the ISO string parts, avoiding
  any `Date`-object timezone parsing entirely — no UTC/local mismatch
  possible, unlike the bug class fixed in UI-002's `addDaysIso`) and
  `formatDayMonth`/`formatDayMonthTime` (Patient 360°'s "27 août" date
  style, distinct from the list's numeric "27/08/2026"). Full FR/AR under
  an expanded `patientDetail.*` namespace (header actions, tabs, overview
  labels, activity-item translation keys — activity titles are always a
  dot-path key, never a raw stored string, so they translate correctly);
  RTL verified, including forcing `dir="ltr"` only around genuine
  formatted dates/money/reference values and never around a translated
  fallback sentence like "Aucun rendez-vous prévu" — the header/overview
  data shape carries an explicit `null` for "no appointment"/"no balance"
  rather than a single pre-resolved label string, specifically so the
  component (not the data) decides when to apply `dir="ltr"`, avoiding
  forcing Arabic prose into LTR reading direction for patients with no
  next appointment or no balance. Added
  `frontend/src/features/patients/patient-detail-page.test.tsx` (17
  tests: identity/reference/phone/practitioner, next-appointment and
  balance summaries in both header and overview, active-treatment with
  session progress, the no-treatment/no-balance empty states,
  next-installment, all six tabs with Aperçu active by default, a future
  tab keeping the header/tabs visible, the activity timeline with an
  explicit check that no clinical-sounding text leaks in, not-found for
  an unknown id, loading, error, French, Arabic/RTL, header actions
  including the Facturer/Encaisser/Plus future-feature toast, and
  LTR isolation of the patient number/phone). All 80 frontend tests
  (13 UI-001 + 20 UI-002 + 30 UI-003A/B + 17 UI-004A), typecheck, lint
  and build pass; backend regression (10 tests) unaffected — no backend
  files touched.
- Patient Rendez-vous tab (UI-004B), replacing `/app/patients/[id]/appointments`'s
  UI-004A placeholder with real content: upcoming appointments (grouped by
  date, chronological) and appointment history (grouped by date, newest
  first). No second appointment dataset — `features/patients/patient-appointments.ts`
  derives everything by filtering Agenda's own centralized mock fixtures
  (`getAgendaMockAppointments()`, UI-002) by `patientId`, since both feature
  areas already share the same `pat-N` ids. Classification is status-aware,
  not date-only: a terminal-outcome appointment (completed/cancelled/no-show/
  rescheduled) is always history, even with a future date, so a future
  cancellation never reads as a normal upcoming visit — the opposite (a
  stale non-terminal appointment before the fixed prototype business date)
  also falls back to history. Documented prototype limitation: Agenda owns
  the one mutable appointment array; this tab only reads the seed fixtures,
  so a mutation made in Agenda during a session is not reflected here and
  vice versa, until real API integration replaces both mock sources.
  Reused rather than duplicated UI-002's appointment architecture per this
  task's explicit instruction: extended `AppointmentCard` with an optional
  `showPatientName` prop (defaults `true`, so all five existing call sites
  are unaffected) so patient-context lists can suppress the redundant
  identity line and show the practitioner/service instead — `variant="prominent"`
  for upcoming (with per-card "Voir le rendez-vous"/"Ouvrir dans l'agenda"
  actions) and the denser `variant="row"` for history (directly clickable,
  matching Agenda's own day-view rows). Extended `AppointmentDrawer` rather
  than forking a second detail drawer: `onPrimaryAction`/`onEdit`/
  `onReschedule`/`onCancel`/`onNoShow` are now optional, and the
  corresponding controls simply don't render when omitted — Patient 360°
  passes none of them (read-focused detail per this task's explicit
  guidance, since enabling lifecycle mutation here would mean duplicating
  Agenda's state management), and adds a `patientLinkHref`/`patientLinkLabel`
  override so the drawer's bottom link points at Agenda instead of Patients
  (the patient page is already the current page). Agenda's own usage is
  unchanged (still passes every callback), so its 20 existing tests were
  unaffected. Lightweight status-group filtering (Tous/À venir/Terminés/
  Annulés/Absents, the last grouping both `cancelled_by_patient` and
  `cancelled_by_practice`) with a live result count, reusing the same
  segmented-toggle visual pattern as Agenda's Day/Week switch. "+ Nouveau
  RDV" and the per-card "Ouvrir dans l'agenda" action both navigate to
  `/app/agenda` as a plain link — no query-param prefill wiring was added
  to Agenda's `AppointmentFormDialog`, since this task marked that
  optional and explicitly capped scope ("do not significantly expand
  scope"); there remains exactly one appointment-creation UX
  (`AppointmentFormDialog`, UI-002). Loading (shape-matched skeleton: new
  RDV button, filter row, two card placeholders — no spinner), error
  (component-level test seam, mirroring every other feature page), fully
  empty (`EmptyState` + "Planifiez son premier rendez-vous"), empty
  upcoming (restrained inline text + a "Planifier un rendez-vous" link)
  and empty history (a single restrained sentence, no action) states all
  implemented; patient not-found is unaffected, since `PatientDetailPage`
  resolves that before any tab renders. Full FR/AR under a new
  `patientDetail.appointments.*` namespace; status/arrival-window labels
  are reused from the existing `appointment.*` namespace rather than
  duplicated. RTL verified, with dates isolated `dir="ltr"` the same way
  UI-004A already established. Added
  `frontend/src/features/patients/components/patient-appointments-content.test.tsx`
  (22 tests: upcoming/history ordering, exact vs arrival-window
  presentation, the status registry, the future-cancelled classification
  rule, all five filters including the cancelled-status grouping, the
  live result count, opening the shared drawer and its Agenda link, the
  three empty states, loading, error, French, Arabic/RTL, and that the
  patient name never leaks into a card) plus two integration assertions
  in `patient-detail-page.test.tsx` (header/tabs preserved with Rendez-vous
  active, and not-found still wins for an invalid patient id on this tab).
  All 104 frontend tests (13 UI-001 + 20 UI-002 + 30 UI-003A/B + 19
  UI-004A + 22 UI-004B on the dedicated appointments-content suite, with
  the remaining 2 new assertions folded into UI-004A's file), typecheck,
  lint and build pass; backend regression (10 tests) unaffected — no
  backend files touched.
- Patient Traitements/Séances tab (UI-004C), replacing
  `/app/patients/[id]/treatments`'s UI-004A placeholder with a treatment-
  plan and session-management prototype, aimed at kiné-style multi-session
  care plans. New domain layer `components/domain/treatments/`: `types.ts`
  (`TreatmentPlan`/`TreatmentSession`, deliberately simplified from Spec #4
  §14's backend ENUMs per this task's own explicit status lists — e.g.
  `no_show`/`unscheduled` instead of the backend's `missed`/`planned`),
  `treatment-status.ts`/`session-status.ts` (two separate small registries,
  not a reuse of `APPOINTMENT_STATUS_MAP` — a session's lifecycle has
  different semantics from an appointment's), `session-progress.tsx` (the
  `SessionProgress` component named in Spec #8 §97 — completed/scheduled/
  remaining always spelled out as text, never color-only, with a real
  `role="progressbar"`), `session-tracker.tsx` (the compact accessible
  session grid from Spec #9 Screen 22 — each cell a labeled button, e.g.
  "Séance 13 — Planifiée", opening that session's detail; chosen over
  duplicating a full 20-row list underneath it, since clicking a cell
  already surfaces the same date/status/action detail Screen 23's session
  list would show), `treatment-plan-card.tsx` (`TreatmentPlanCard` — an
  "active" rich variant with an `actions` slot and a "completed" dense
  clickable row, mirroring `AppointmentCard`'s own `variant`/`actions`/
  `onSelect` API exactly for consistency). New `features/patients/`
  pieces: `mock-treatments-data.ts` (centralized synthetic treatment-plan
  fixtures — pat-1/Ahmed gets the active 20-session "Rééducation genou"
  plan from Screen 22's own wireframe numbers, 12 completed/1 scheduled
  Aug 26 15:00/7 unscheduled; pat-3/Fatima gets a fully completed 10-
  session plan; pat-2/Sara deliberately has none at all — covering the
  active, no-active-but-history, and fully-empty states from one seed
  set), `treatments.ts` (pure derivation: filter-by-patientId, the active/
  completed split, session-status counts, "prochaine séance" lookup, and
  `getActiveTreatmentSummary`), `components/patient-treatments-content.tsx`
  (the tab composition), `components/treatment-detail-drawer.tsx` (reuses
  the shared `Dialog` drawer unmodified — one Dialog instance with two
  internal views, treatment and a selected session, rather than a second
  nested drawer; a `key` prop the parent increments on every open resets
  the internal session-selection state, mirroring UI-002's
  `formDialogKey` pattern, instead of a reset effect that
  `react-hooks/set-state-in-effect` correctly flagged during lint).
  **Overview consistency (§33):** `mock-overview-data.ts`'s
  `getPatientOverview` no longer hand-types an `activeTreatment` number —
  it now derives it from these same treatment fixtures via
  `getActiveTreatmentSummary`, so the Aperçu card and the Treatments tab
  can never disagree; verified by keeping every existing UI-004A overview
  assertion green plus a new explicit consistency test. "+ Nouveau
  traitement" shows a future-feature toast rather than a creation form
  (§13, out of scope); "Voir la facturation" is a real link to the still-
  placeholder `/invoices` tab with no finance figures anywhere in the
  drawer (§32); completed-session detail shows a disabled future "Voir la
  consultation" link and no clinical content; scheduled/unscheduled
  session detail and "Planifier prochaine séance" all navigate to
  `/app/agenda` as plain links — no second appointment-creation UX.
  Documented prototype limitation (§34): treatment/session data is local
  seed fixtures, same reasoning as UI-004B's Agenda-sync limitation. Full
  FR/AR under a new `patientDetail.treatments.*` namespace, reusing
  `patientDetail.overview.sessionsProgress` and
  `patientDetail.appointments.openInAgenda` rather than duplicating them.
  RTL verified, dates/session numbers isolated `dir="ltr"` per the
  established pattern. Added
  `frontend/src/features/patients/components/patient-treatments-content.test.tsx`
  (17 tests: active treatment/practitioner/date, session counts, the
  accessible progress bar, next session, the dense completed-treatment
  section, the no-active-but-history and fully-empty states, opening/
  closing the drawer with the session tracker, completed/scheduled/
  unscheduled session detail — including an explicit no-clinical-content
  check — the billing link with no finance figures, loading, error,
  French, Arabic/RTL, and the new-treatment future notice) plus 3
  integration assertions in `patient-detail-page.test.tsx` (header/tabs
  preserved with Traitements/Séances active, the overview/tab session-
  count consistency check, and not-found still wins for an invalid
  patient id on this tab). All 124 frontend tests (13 UI-001 + 20 UI-002 +
  30 UI-003A/B + 22 in the shared `patient-detail-page.test.tsx` file —
  17 original UI-004A + 2 UI-004B + 3 UI-004C integration assertions —
  + 22 UI-004B on the dedicated appointments-content suite + 17 UI-004C
  on the dedicated treatments-content suite), typecheck, lint and build
  pass; backend regression (10 tests) unaffected — no backend files
  touched.
- Patient Factures/Installments tab (UI-004D), replacing
  `/app/patients/[id]/invoices`'s UI-004A placeholder with an invoice and
  staged-payment workspace. **Money representation (§8-9):** whole MAD
  units (never fractional/floating-point), deliberately matching
  `Patient.outstandingBalance`/`formatMad`'s pre-existing convention
  rather than introducing a separate minor-units (×100) model — this
  task's own instructions explicitly allow "another safe deterministic
  money representation consistent with existing frontend architecture,"
  and every amount in every wireframe across this whole product is a
  whole MAD number, so ordinary integer arithmetic is already float-free.
  Reuses `formatMad` as the one shared formatter rather than adding a
  second one. New domain layer `components/domain/finance/`: `types.ts`
  (`Invoice`/`InvoiceLine`/`Installment`, Spec #4 §15-16's backend model
  simplified to this task's own status lists), `invoice-status.ts` and
  `installment-status.ts` (two separate small registries — an
  installment can legitimately be "overdue" inside a still-
  "partially_paid" invoice), `invoice-card.tsx` (`InvoiceCard`) and
  `installment-row.tsx` (`InstallmentRow`, icon + text + tone, never
  color alone). New `features/patients/` pieces: `mock-invoices-data.ts`
  (centralized synthetic fixtures — pat-1/Ahmed carries three invoices:
  the partial one with the full six-installment schedule using Spec #9
  Screen 29's own numbers exactly, a second fully paid one, and a
  cancelled one, whose non-cancelled totals aggregate to precisely this
  task's own §17 wireframe summary, 4 500/3 000/1 500 MAD; pat-4/Youssef
  is fully paid; pat-9/Mehdi has one overdue invoice/installment;
  pat-2/Sara has none at all), `finance.ts` (filter-by-patientId, the
  four-group filter, `getFinancialSummary` — deliberately excluding
  cancelled invoices from the aggregate, since a voided invoice was never
  really "facturé" — `findNextInstallment`, and
  `getPatientFinancialSummary`), `components/patient-invoices-content.tsx`
  (the tab composition — neutral typography-led `MetricCard`s for the
  summary, per §19's explicit "no giant green/red cards" instruction),
  `components/invoice-detail-drawer.tsx` (reuses the shared `Dialog`
  drawer unmodified; looks its linked treatment plan up by
  `treatmentPlanId` from UI-004C's own fixtures rather than duplicating
  a title, CLAUDE.md §12). **Overview/header consistency (§15-16):**
  `getPatientFinancialSummary` returns `null` for any patient with no
  invoice fixtures here, so `PatientDetailPage`'s header balance and
  `mock-overview-data.ts`'s next-installment fall back to the existing
  per-patient values unchanged for the other 12 seed patients — only the
  4 patients this task actually gave invoices to have their balance
  derived, avoiding the wide refactor the task explicitly warned against;
  verified by keeping every existing UI-004A overview/header assertion
  green plus two new explicit consistency tests. A genuine fixture-design
  finding surfaced by a failing integrity test: a cancelled invoice's
  `remainingAmount` is legitimately 0 regardless of its `totalAmount` (a
  voided invoice owes nothing) — documented in both the fixture and the
  dedicated integrity-test file as the one deliberate exception to the
  `paidAmount + remainingAmount === totalAmount` invariant. "+ Nouvelle
  facture" and "Télécharger PDF"/"Imprimer" all show a future-feature
  Toast; "Encaisser" only navigates to `/app/patients/{id}/payments`
  and never renders for a paid or cancelled invoice; cancelled invoices stay
  visible under the "Toutes" filter. Full FR/AR under a new
  `patientDetail.invoices.*` namespace, reusing
  `patientDetail.header.collectPayment` and
  `patientDetail.treatments.viewTreatment` rather than duplicating them.
  RTL verified, invoice numbers/dates/amounts isolated `dir="ltr"` per
  the established pattern. Added
  `frontend/src/features/patients/mock-invoices-data.test.ts` (11 fixture-
  integrity tests — installment-sum/paid-sum/total invariants, the
  cancelled-invoice exception, and the exact 4 500/3 000/1 500 aggregate)
  and
  `frontend/src/features/patients/components/patient-invoices-content.test.tsx`
  (24 tests: the financial summary, newest-first ordering, partial/paid/
  overdue/cancelled presentation, all four filters, opening the drawer
  with lines/totals/the installment schedule and its paid/due/future/
  overdue statuses, the down-payment caption, no-Encaisser-on-a-paid-
  invoice, Encaisser navigating rather than collecting, the PDF/print
  future notice, the treatment link, both empty states, loading, error,
  French, Arabic/RTL, and the new-invoice future notice) plus 4
  integration assertions in `patient-detail-page.test.tsx` (header/tabs
  preserved with Factures active, the header-balance consistency check,
  the overview-next-installment consistency check, and not-found still
  wins for an invalid patient id on this tab). All 163 frontend tests
  (13 UI-001 + 20 UI-002 + 30 UI-003A/B + 26 in the shared
  `patient-detail-page.test.tsx` file + 22 UI-004B on the dedicated
  appointments-content suite + 17 UI-004C on the dedicated treatments-
  content suite + 24 UI-004D on the dedicated invoices-content suite +
  11 UI-004D fixture-integrity tests), typecheck, lint and build pass;
  backend regression (10 tests) unaffected — no backend files touched.
- Patient Paiements/Reçus tab (UI-004E), replacing
  `/app/patients/[id]/payments`'s UI-004A placeholder with a payment
  history, summary and cash-collection prototype. Framed explicitly as
  patient payment UX, not cabinet-wide Caisse accounting (UI-006's scope).
  **Financial Source-of-Truth Rule (§7):** every posted payment's
  allocations reconcile exactly with UI-004D's own invoice `paidAmount`
  and paid-installment fixtures — verified by dedicated integrity tests,
  not merely rendered text. `mock-payments-data.ts` carries one
  deliberately reversed payment (Mehdi/pat-9, §14): it never reduced
  `inv-3`'s balance, which is *why* that invoice still shows the full
  2 200 MAD overdue in UI-004D's own fixtures rather than an oversight —
  reversed payments are excluded from every collected-total/count figure
  (`getEffectivePaidAmount`/`getPaymentSummary`) but remain visible in the
  history list itself (CLAUDE.md §24: a posted payment is financially
  historical, never silently edited). New domain types on the existing
  `components/domain/finance/types.ts` (no second finance model):
  `Payment`/`PaymentAllocation`/`Receipt`, `PaymentStatus` kept to
  exactly `posted`/`reversed` per this task's own §10, `PaymentMethod`
  kept to `cash` only (CLAUDE.md §23 — V1 patient payments are cash-only,
  no card/online method anywhere in the UI). `payment-status.ts` (its own
  small tone/label registry) and `payment-row.tsx` (`PaymentRow`, a dense
  clickable history row mirroring `TreatmentPlanCard`'s "completed"
  variant, not a full `Card`, per this task's own "keep it operational
  and restrained" instruction). New `features/patients/` pieces:
  `mock-payments-data.ts` (6 fixtures — 3 payments reconciling exactly
  with pat-1/Ahmed's 1 500 MAD partial-invoice history down to each
  individual 500 MAD installment, 1 payment reconciling pat-1's second
  fully paid invoice, 1 payment reconciling pat-4/Youssef's fully paid
  invoice, and pat-9/Mehdi's one reversed payment; pat-2/Sara
  deliberately has none), `payments.ts` (`getPaymentSummary`,
  `computeEffectiveRemaining`/`getAllocatableInvoices`/
  `getPayableInstallments` — pure functions computing an effective
  allocatable balance for the capture dialog *without* ever mutating an
  invoice fixture, reference-number generators explicitly documented as
  illustrative-only, not concurrency-safe production numbering, §32),
  `payment-form-validation.ts` (whole positive-integer amount check, no
  floating-point parsing), `components/patient-payments-content.tsx` (the
  tab composition: neutral summary `MetricCard`s, no filter — history
  stays short enough to scan without one, a deliberate scope-reduction
  per this task's own §41 "not mandatory... do not create unnecessary
  complexity"), `components/patient-payment-capture-dialog.tsx` (the
  Encaisser prototype, reusing the shared `Dialog` drawer unmodified —
  "do not create another modal system," §23: selecting an invoice with an
  installment schedule locks the payment amount to that installment's
  exact value, the simpler bounded UX this task's own §29 explicitly
  allows instead of inventing a partial-installment lifecycle; only an
  invoice with no installment schedule of its own accepts a free amount,
  validated against zero/negative/non-numeric input and against
  overpayment; includes the required informational Caisse-boundary note,
  §46, without simulating any Caisse concept), `components/payment-
  detail-drawer.tsx` (read-only — no edit/delete action anywhere, §37;
  "Voir la facture" only navigates to the Factures tab, no duplicated
  invoice drawer, §40; "Télécharger le reçu"/"Imprimer" show a
  future-feature Toast, never generating a document, §38). **Local-
  session state, not a global store (§33-34):** a captured payment is
  appended only to `PatientPaymentsContent`'s own component state — the
  UI-004D invoice fixtures are never mutated, so the Factures tab and
  Aperçu overview remain unaffected and correct; navigating away from
  Paiements and back resets to the seed state, the same accepted
  prototype limitation already documented for UI-004A §7/UI-004B §9,
  applied here to a same-route local mutation instead of a cross-route
  read. On a successful capture the payment/receipt reference is
  generated, the capture dialog closes, and the new payment's own detail
  drawer opens immediately as the success/receipt surface (Spec #9 Screen
  28's content — amount, date, allocation, receipt actions — reached this
  way instead of inventing a third dialog type). Full FR/AR under a new
  `patientDetail.payments.*` namespace, reusing
  `patientDetail.invoices.installmentLabel`/`viewInvoice`/`print` and
  `patients.form.cancel`/`close` rather than duplicating them. RTL
  verified (SSR `dir="rtl"`/`lang="ar"` on the route), payment/receipt
  references and amounts isolated `dir="ltr"`. Added
  `frontend/src/features/patients/payments.test.ts` (20 pure-function
  tests for every derivation/validation helper — chosen over only
  DOM-testing generated numbers indirectly, since §57 explicitly asks for
  tests proving the calculation, not merely rendered text),
  `frontend/src/features/patients/mock-payments-data.test.ts` (12
  fixture-integrity tests: allocation-sums-to-payment-amount, reference/
  receipt uniqueness, allocation validity, the core payment-to-invoice
  reconciliation, paid-installment evidence, the reversed-payment
  exclusion, and a cross-file check against UI-004D's own
  `getFinancialSummary`) and
  `frontend/src/features/patients/components/patient-payments-content.test.tsx`
  (28 tests: summary/history/method rendering, payment detail with
  receipt/allocation/patient/invoice-link, the future-feature receipt
  notice, no edit/delete anywhere, Encaisser opening the capture form,
  the derived outstanding balance, payable-invoice-only allocation, the
  default next-unpaid-installment with a locked amount, the no-
  allocatable-invoice state, zero/negative/non-numeric/overpayment
  rejection, a valid free-amount capture, a full successful capture with
  the receipt opening and history/summary/balance updating locally, the
  reversed-payment presentation, empty/loading/error states, French,
  Arabic/RTL, and the absence of any Caisse UI or online payment method)
  plus 2 integration assertions in `patient-detail-page.test.tsx`
  (header/tabs preserved with Paiements active and real content, and
  not-found still wins for an invalid patient id on this tab). All 225
  frontend tests (163 carried over from UI-001 through UI-004D + 20
  UI-004E `payments.ts` unit tests + 12 UI-004E fixture-integrity tests +
  28 UI-004E payments-content tests + 2 UI-004E integration assertions),
  typecheck, lint and build pass; backend regression (10 tests)
  unaffected — no backend files touched.
- Dossier Santé: important medical information (UI-005A), replacing
  `/app/patients/[id]/health`'s UI-004A placeholder with the first real
  clinical prototype — the patient's persistent allergies/medical
  history/current medications/important notes only. Explicitly not
  consultation history, active consultation, prescriptions or clinical
  documents (UI-005B/C/D's scope). **Administrative/clinical separation
  (§8):** a new `MedicalProfile`/`MedicalProfileEntry` model in
  `components/domain/clinical/types.ts`, deliberately never added onto
  the existing administrative `Patient` interface (CLAUDE.md §8/§12) —
  verified by a dedicated diff grep, not just by convention. **Master-
  data architecture (§11-14):** `features/clinical/master-data.ts`
  provides a small synthetic bounded FR/AR catalog (6 allergies, 6
  history items, 5 medications) with case- and accent-insensitive search
  (NFD Unicode normalization, no fuzzy/AI matching) — practitioners
  search and select rather than typing every term from scratch, with a
  controlled custom-entry escape hatch that never writes back into the
  shared catalog. **Reusing `Combobox` for multi-select (§27):** rather
  than building a second autocomplete system, each of the edit drawer's
  three category pickers is a `Combobox` whose own committed `value` is
  always kept `null` — a selection is immediately appended to a local
  chip list and the field clears for the next search. The only change to
  the shared primitive itself is that `onCreate` now receives the
  current query text (small and backward-compatible: the sole existing
  caller, Agenda's quick-create-patient action, already ignores extra
  arguments). Already-selected items are filtered out of the next
  search's suggestions, which is what prevents a duplicate predefined
  selection (§50) without extra bookkeeping; typing an exact match of an
  existing master-data label resolves to that predefined item instead of
  creating a shadow custom duplicate. New domain layer
  `components/domain/clinical/`: `types.ts`, `clinical-summary-
  section.tsx` (`ClinicalSummarySection` — one restrained card per
  category, an inline empty sentence rather than a per-category
  `EmptyState`, and a small "Important" `StatusBadge` on one allergy
  entry at a time, never coloring the whole card, §18-19) and
  `entry-chip.tsx` (`EntryChip`, the removable selected-value pill).
  Added `components/ui/textarea.tsx` (mirrors `Input`'s label/error
  pattern — the design system's own component vocabulary already names
  `Textarea`, and Dossier Santé's important-notes field is its first
  real use). New `features/patients/` pieces: `mock-medical-profiles-
  data.ts` (pat-1/Ahmed fully populated including one "important"
  Pénicilline allergy; pat-3/Fatima partially populated — some history,
  no allergies/medications; pat-2/Sara has no fixture at all — the same
  "empty by omission" convention as UI-004D/E), `medical-profile.ts`
  (`getMedicalProfileForPatient`, `isMedicalProfileEmpty` — `null` and
  "every section empty" treated identically), `components/patient-
  health-content.tsx` (the tab composition) and `components/medical-
  profile-edit-drawer.tsx` (reuses the shared `Dialog` drawer
  unmodified). **Local-session state (§7/UI-004E's same convention):** a
  saved edit is kept only in `PatientHealthContent`'s own component
  state — no LocalStorage/IndexedDB/cookie anywhere holds this clinical
  data, and the centralized fixtures are never mutated. Also added
  `formatDayMonthYear` to `features/patients/format.ts` ("23 août 2026"
  — the one existing date formatter, `formatDayMonth`, deliberately omits
  the year). Since Dossier Santé was the last remaining placeholder tab,
  the now-permanently-unreachable "future-placeholder" integration test
  for it was replaced with a real-content assertion, matching every
  other tab's own precedent; `PatientTabPlaceholder`'s fallback branch
  and its `FUTURE_TASK_BY_TAB` map are left in place (now empty) as
  harmless, precedent-consistent scaffolding for any future tab, not
  deleted. Full FR/AR under a new `patientDetail.health.*` namespace, all
  Arabic clinical terminology reviewed for register (e.g. "الحساسيات" for
  allergies, not a literal transliteration). RTL verified (SSR
  `dir="rtl"`/`lang="ar"` on the route). Added
  `frontend/src/features/clinical/master-data.test.ts` (18 tests:
  predefined search per category, case/accent-insensitivity, an
  abbreviation search term, category scoping, catalog stability across
  calls, and locale-resolved labels),
  `frontend/src/features/patients/medical-profile.test.ts` (6 tests),
  `frontend/src/features/patients/mock-medical-profiles-data.test.ts` (7
  fixture-integrity tests — Patient A/B/C shape, no duplicate labels
  within a category, and every `masterDataId` resolving to a real
  catalog item of the matching category) and
  `frontend/src/features/patients/components/patient-health-content.test.tsx`
  (25 tests: all four summary sections, the important-allergy badge, an
  individual empty section, the fully-empty state, opening the edit
  drawer with entries prefilled as removable chips, searching each
  category, adding a predefined entry, adding a custom entry, removing
  an entry, duplicate-selection prevention, save updating the local
  profile with a success toast, cancel discarding a draft, the absence
  of any finance/consultation-history/prescription/document content,
  loading, error, French, and Arabic/RTL) plus 2 integration assertions
  in `patient-detail-page.test.tsx` (header/tabs preserved with Dossier
  Santé active and real content, and not-found still wins for an invalid
  patient id on this tab). All 277 frontend tests (225 carried over from
  UI-001 through UI-004E + 18 UI-005A master-data tests + 6 UI-005A
  medical-profile tests + 7 UI-005A fixture-integrity tests + 25 UI-005A
  health-content tests + 2 UI-005A integration assertions), typecheck,
  lint and build pass; backend regression (10 tests) unaffected — no
  backend files touched.
- UI-005B — Dossier Santé: clinical history & consultation timeline
  (`/app/patients/[id]/health`, below UI-005A's important-information
  cards, same tab and route — no new top-level nav item). New
  `ClinicalEncounter` on `components/domain/clinical/types.ts` (Spec #4
  §9.1 `clinical_encounters` simplified to `consultation`/`session`; all
  historical encounters are `completed`, no larger status registry, §16).
  **A purpose-built `ClinicalTimeline` rather than reusing UI-004A's
  `PatientActivityTimeline`:** that component only renders one-line
  translated activity strings and explicitly excludes clinical note/
  diagnosis text, so it cannot represent structured motif/session detail
  or the "Voir la consultation"/"Voir le traitement" interactions this
  tab needs — the two timelines now deliberately coexist, Aperçu keeping
  its concise cross-domain feed and Dossier Santé getting its own richer,
  clinical-only chronology (documented in `frontend/ARCHITECTURE.md`).
  New `features/patients/clinical-history.ts`
  (`getEncountersForPatient`/`sortEncountersDesc`/
  `matchesClinicalHistoryFilter`/`groupEncountersByDate`, mirroring
  `patient-appointments.ts`'s own shape — newest-first sorting and date
  grouping are explicit derivations, never fixture insertion order).
  Lightweight Tous/Consultations/Séances filter (§17 — deliberately no
  practitioner/date-range/diagnosis filtering) with a distinct
  filtered-empty message, never the global empty-history state. New
  `features/patients/components/consultation-detail-drawer.tsx`
  (`ConsultationDetailDrawer`) — read-only: no Modifier/Supprimer/
  Réouvrir anywhere, since a completed clinical record is not ordinary
  CRUD (CLAUDE.md §24); structured Motif/Observations/Évaluation/Plan
  sections (Spec #7 §11's own "Motif"/"Observations" wording, extended
  with Évaluation/Plan per this task's own explicit instruction — Spec
  #1 Table 16 already names "diagnosis/assessment" for general medicine,
  so this is a documented current-task-instruction/specification
  reconciliation, not an invented category), plus an optional "Rendez-
  vous associé" section with a safe link to the Rendez-vous tab. A
  session encounter never opens a second detail drawer — its timeline
  card links directly to `/app/patients/{id}/treatments` ("Voir le
  traitement", reusing the existing i18n key), reusing UI-004C's own
  session-detail interaction instead of duplicating a second treatment-
  session workspace (§25-26). New
  `features/patients/mock-clinical-encounters-data.ts`: pat-1/Ahmed has
  two completed consultations (23/18 August) plus one completed session
  that intentionally reuses the exact date/practitioner/appointment
  reference of the "Rééducation genou" plan's 6th completed session
  (`mock-treatments-data.ts`) rather than inventing a contradicting
  duplicate; pat-3/Fatima has a populated `MedicalProfile` (UI-005A) but
  no clinical-history fixture at all, demonstrating "profile without
  history"; pat-2/Sara has neither, demonstrating the fully empty
  Dossier Santé (§31 — the two independent empty states are allowed to
  coexist rather than being collapsed into one giant generic screen).
  `PatientHealthContent`'s own "MedicalProfile empty" branch was
  restructured from an early return into an inline conditional so the
  clinical-history section always renders below it in both the empty and
  populated cases; its loading skeleton was extended with a clinical-
  history heading and two row placeholders, and loading/error remain one
  unified state for the whole tab (§33 — no real network boundary exists
  between the two fixture reads in this frontend-only prototype). One
  UI-005A-era boundary test in `patient-health-content.test.tsx` was
  updated, not weakened: it used to assert this tab never rendered
  "Historique clinique"/"Motif" text at all, which UI-005B's own explicit
  scope now legitimately supersedes — the assertion was narrowed to what
  is still genuinely out of scope (no consultation-creation affordance,
  §37), and the now-real content is covered by dedicated new tests
  instead. Full FR/AR under a new `patientDetail.health.history.*`
  namespace, reusing `patientDetail.treatments.viewTreatment`/
  `sessionHeading` where the phrase is already identical rather than
  duplicating it; new Arabic clinical terminology reviewed for register
  (e.g. "السجل السريري" for "Historique clinique", distinct from the
  existing "التاريخ المرضي" used for medical history/antécédents, to
  avoid conflating the two concepts). RTL verified (SSR `dir="rtl"`/
  `lang="ar"` on the route). Added
  `frontend/src/features/patients/clinical-history.test.ts` (9 tests:
  patient filtering, newest-first sorting including a same-date time
  tie-break, non-mutation of the input array, the three-way filter, and
  date grouping), `frontend/src/features/patients/mock-clinical-
  encounters-data.test.ts` (9 fixture-integrity tests: every encounter
  references a real patient/practitioner, unique ids, consultation-only
  vs session-only fields never cross-populate, and the session
  encounter's treatment/appointment references resolve exactly against
  `mock-treatments-data.ts` rather than merely existing) and
  `frontend/src/features/patients/components/clinical-history-
  section.test.tsx` (25 tests: heading/consultation/session rendering,
  newest-first ordering and date grouping from an out-of-order prop,
  each filter and the filtered-empty state, the result count, opening/
  closing the read-only drawer, each of the four structured sections,
  patient/practitioner/date context, the associated-appointment link
  appearing only when present, the treatment link, the absence of
  edit/delete/reopen/prescription/document/finance content and of any
  consultation-creation affordance, the empty-history state, French, and
  Arabic/RTL). All 320 frontend tests (277 carried over from UI-001
  through UI-005A + 43 new UI-005B tests), typecheck, lint and build
  pass on the first run; backend regression (10 tests) unaffected — no
  backend files touched.
