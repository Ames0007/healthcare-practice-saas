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
- UI-005C — Active Consultation Workspace, independently addressable at
  `/app/patients/{id}/consultations/{consultationId}` rather than a
  Patient 360° tab (§6) — it deliberately does not reuse the full
  `PatientHeader`/`Tabs` shell, since that shell shows the patient's
  financial balance and this workspace must show none (CLAUDE.md §40).
  New `ActiveConsultation`/`ConsultationStatus` on
  `components/domain/clinical/types.ts` (Spec #4 §9.1's `status` column
  narrowed further still to just `draft`/`completed` — not the domain
  spec's full draft/active/completed/amended set, §7), deliberately
  shaped so a completed consultation is a near-direct match for UI-005B's
  `ClinicalEncounter`. New `features/patients/active-consultation.ts`:
  `isConsultationCompletionValid` (a non-empty reason, required before
  completion but never before a draft save), `isConsultationDirty`
  (compares only the four editable fields, never `status`/`completedAt`)
  and `toClinicalEncounter` — a pure transformation proving a completed
  consultation is representable as history without a second, incompatible
  clinical model (§9), covered by dedicated tests rather than only
  rendered-text assertions (§50). **Deliberate terminology
  reconciliation, same reasoning as UI-005B:** the task's own wireframe
  and translation checklist require Motif/Observations/Évaluation/Plan;
  reused UI-005B's exact same four labels rather than inventing new ones.
  **Two new shared `components/domain/clinical/` pieces**, extracted so
  UI-005C's completed-consultation view does not duplicate UI-005B's own
  read-only presentation (§30): `consultation-structured-detail.tsx`
  (`ConsultationStructuredDetail`, the four labeled Motif/Observations/
  Évaluation/Plan blocks) and `related-appointment-note.tsx`
  (`RelatedAppointmentNote`, the "Rendez-vous associé" block) —
  `features/patients/components/consultation-detail-drawer.tsx`
  (UI-005B) was refactored to consume both instead of its own inline
  copies; all of UI-005B's existing tests pass unchanged, confirming the
  refactor is behavior-preserving. New `consultation-status.ts` (draft →
  `neutral` tone, same restrained choice as `invoice-status.ts`'s own
  `draft`; completed → `success`, matching every other domain's own
  "completed" tone). New centralized
  `features/patients/mock-active-consultations-data.ts`: cons-1/pat-1
  (Ahmed) is an in-progress draft dated on the fixed prototype "today"
  (an active consultation is inherently a today event; the task's own
  wireframe illustrative date was not treated as a strict requirement),
  continuing the same "Rééducation genou" narrative thread as UI-005B's
  own historical fixtures for this patient at a distinct time so the two
  do not read as contradicting duplicates; cons-2/pat-4 (Youssef) is
  already `completed`, kept on a different patient to avoid narrative
  overlap and dedicated to exercising the read-only completed state. New
  `features/patients/consultation-workspace-page.tsx`: important medical
  context (allergies/history/medications) reuses UI-005A's
  `ClinicalSummarySection` completely unmodified and strictly read-only —
  no MedicalProfile edit affordance is duplicated here (§13/§42), the
  existing Dossier Santé editor remains the sole source for profile
  edits. Desktop uses a two-column layout (main form | narrow context
  column), matching Spec #9 Screen 20's own note ("Desktop may use narrow
  right context column for patient flags. Mobile stacks it") — the
  context column moves above the form on mobile via source order, not
  just CSS, so screen-reader/keyboard users encounter allergies before
  the form exactly like sighted mobile users. **Draft behavior (§21-23):**
  "Enregistrer le brouillon" requires nothing and never blocks; a
  restrained "Modifications non enregistrées" indicator (warning tone,
  never alarming) appears whenever the live form differs from the last
  saved snapshot. **Completion (§25-29):** "Terminer la consultation"
  first validates the reason (showing a field error, never silently
  failing) then opens `consultation-complete-dialog.tsx`
  (`ConsultationCompleteDialog`, a thin `ConfirmDialog` wrapper mirroring
  `CancelConfirmDialog`/`NoShowConfirmDialog`'s own pattern, `tone=
  "primary"` since completing is the intended outcome, not destructive);
  confirming uses the live in-progress form values directly — a
  completion is not required to have been draft-saved first — and stamps
  a fixed prototype `completedAt` (the consultation's own date, never
  `Date.now()`). Once completed, the editable form is replaced by the
  same `ConsultationStructuredDetail` read-only view UI-005B's drawer
  uses, the draft/complete actions disappear entirely, and no Modifier/
  Supprimer/Réouvrir affordance exists anywhere (CLAUDE.md §24 — a
  completed clinical record is not ordinary CRUD). **Unsaved-changes
  navigation boundary, documented rather than engineered further (§24):**
  the back link to Dossier Santé is a plain, unguarded `Link` — no
  `beforeunload`/route-interceptor was added (no precedent for
  programmatic `useRouter` navigation exists anywhere else in this
  codebase, and the task explicitly asks not to build "a complex global
  route blocker"); the persistent dirty-state indicator is the chosen
  bounded "do not silently discard changes" mechanism, visible before the
  practitioner clicks away. **Cross-route boundaries, explicitly not
  faked (§31/§33):** completing a consultation never writes into
  UI-005B's `mock-clinical-encounters-data.ts`, never navigates to
  `/health`, and never touches Agenda's appointment status — introducing
  a global store purely to fake any of that was out of scope; the
  `toClinicalEncounter` transformation and its tests are the proof that a
  real backend integration could do this correctly. Patient-not-found
  (reusing the exact `patientDetail.notFoundTitle`/`backToPatients` keys
  and pattern from `patient-detail-page.tsx`) takes precedence over
  consultation-not-found, including when a `consultationId` resolves but
  belongs to a different patient. Full FR/AR under a new
  `patientDetail.consultation.*` namespace, reusing UI-005B's
  `patientDetail.health.history.*` labels/keys everywhere the phrase is
  identical (Motif/Observations/Évaluation/Plan/Rendez-vous associé/Voir
  le rendez-vous) rather than duplicating them; new Arabic terminology
  reviewed for register and consistency with UI-005A/B (e.g. "مسودة" for
  Brouillon, "السجل السريري" from UI-005B left untouched — no competing
  translation introduced). RTL verified (SSR `dir="rtl"`/`lang="ar"` on
  the route). Added `frontend/src/features/patients/active-
  consultation.test.ts` (12 tests: lookup, completion validity including
  a whitespace-only reason, dirty-state comparison including the
  unset-vs-empty-string equivalence and the status/completedAt exclusion,
  and the `toClinicalEncounter` transformation field-by-field plus its
  appointmentId-absent case), `frontend/src/features/patients/mock-
  active-consultations-data.test.ts` (8 fixture-integrity tests: every
  consultation references a real patient/practitioner, unique ids, at
  least one draft and one completed fixture exist, and every completed
  fixture transforms into a structurally valid ClinicalEncounter) and
  `frontend/src/features/patients/consultation-workspace-page.test.tsx`
  (24 tests: patient/consultation context, the read-only important-
  context panel including the important-allergy badge, the draft status
  badge, all four form fields, draft save with success feedback and
  continued editability, the dirty-state indicator appearing/
  disappearing, completion blocked without a reason, the confirmation
  dialog opening/cancelling/confirming — the last of these also proving
  completion uses live unsaved values — the completed read-only state
  with draft/complete actions and edit/delete/reopen all absent, the
  associated-appointment note appearing only when present, absence of
  prescription/document/finance content, consultation-not-found for a
  missing id and for a consultation belonging to a different patient,
  patient-not-found precedence, loading, error, French, and Arabic/RTL).
  All 364 frontend tests (320 carried over from UI-001 through UI-005B +
  44 new UI-005C tests) pass on the full-suite run; typecheck, lint and
  build all pass cleanly. One instance of the previously-documented
  vitest-pool worker-startup flakiness occurred while running the new
  workspace-page test file standalone during development, resolved by a
  clean retry before the full suite was run. Backend regression (10
  tests) unaffected — no backend files touched.
- UI-005D — Dossier Santé: Clinical Documents & Prescriptions, the last
  screen in the Patient 360° clinical prototype sequence. Both sections
  sit inside Dossier Santé, below Historique clinique — deliberately
  **not** a seventh Patient 360° tab (§6), preserving the existing six
  (Aperçu/Dossier Santé/Rendez-vous/Traitements/Factures/Paiements).
  New `ClinicalDocument`/`ClinicalDocumentCategory` and `Prescription`/
  `PrescriptionItem`/`PrescriptionStatus` on `components/domain/clinical/
  types.ts` (Spec #4 §10.2 `patient_documents` simplified — no
  object-storage row, since no real file is ever stored; §10.3's
  `generated_documents` treats a prescription as one more document kind
  with no item structure, so `Prescription`'s own structured
  medication-item model is a deliberate, documented extension of that
  generic shape for this bounded prototype, matching the task's own
  explicit model — both reconciliations are recorded directly in the
  type definitions' own doc comments). `PrescriptionStatus` keeps
  `"cancelled"` for shape-fidelity with a real future backend (the
  task's own two-value sketch) without inventing any UI to reach it —
  every fixture and every prototype creation only ever produces
  `"issued"` (§31's own "do not implement a cancellation workflow"
  instruction). New `components/domain/clinical/document-category.ts`
  (`DOCUMENT_CATEGORY_MAP` — analysis/imaging/report/prescription/other,
  each with its own Lucide icon, no emoji, no per-category color
  treatment) and two new shared structured-detail pieces reused from
  UI-005C's own consultation work: none needed to be added here since
  Documents/Prescriptions have their own distinct presentation, but the
  prescription detail view intentionally mirrors UI-005B/C's own
  labeled-section pattern for visual consistency. New
  `features/patients/clinical-documents.ts`/`mock-clinical-documents-
  data.ts` (pat-1/Ahmed has four documents — three cross-referencing
  UI-005B's own `enc-1`/`enc-2`/`enc-3` `ClinicalEncounter` fixtures
  rather than inventing contradicting consultation references, plus one
  externally-scanned `"prescription"`-category document with no
  consultation reference, demonstrating that document category exists
  independently of the structured `Prescription` records below — the two
  are never auto-synchronized, §42; pat-2/Sara has none, "empty by
  omission") and `features/patients/prescriptions.ts`/`mock-
  prescriptions-data.ts` (pat-1's `ORD-2026-0018`, matching the task's
  own §7 example exactly, cross-referenced to `enc-1`; two harmless
  generic medications — Paracétamol/Ibuprofène — never a detailed
  realistic regimen, §28). New `formatFileSize` in
  `features/patients/format.ts` ("1,2 MB", `Intl.NumberFormat`-based,
  matching `formatMad`'s own locale-aware convention). New
  `components/documents-section.tsx` (`DocumentsSection`): lightweight
  Tous/Analyses/Imagerie/Comptes-rendus/Ordonnances/Autres filter with
  its own filtered-empty state and result count (mirrors
  `ClinicalHistorySection`'s exact filter architecture), `+ Ajouter un
  document` opens `document-upload-dialog.tsx`
  (`DocumentUploadDialog`) — a native `<input type="file">` (§18, no new
  FileUpload infrastructure) whose `onChange` reads only `file.name`/
  `file.type`/`file.size`; the file's contents are never accessed, no
  `FileReader`, no Base64, no `ObjectURL` (§19, verified by a dedicated
  fixture-shape test asserting every stored field is a string/number/
  undefined, never a Blob/File). Validates a selected file, an allowed
  MIME type (`application/pdf`/`image/jpeg`/`image/png` — Spec #5 §29
  names file-size/MIME/extension as validation concerns generally but
  gives no concrete numeric limit, so no file-size boundary was invented
  without basis, per this task's own explicit §21 instruction — a
  documented, deliberate omission, not an oversight), a category and a
  title. `document-detail-drawer.tsx` (`DocumentDetailDrawer`) is
  read-only — "Télécharger" only ever shows a future-feature Toast
  notice, never a real file access (§15); no "Supprimer" anywhere, a
  historical clinical document requires governed lifecycle/audit
  behavior (§24). New `components/prescriptions-section.tsx`
  (`PrescriptionsSection`): history newest-first, `+ Nouvelle ordonnance`
  opens `prescription-form-dialog.tsx` (`PrescriptionFormDialog`) — a
  dynamic medication-item list (add/remove any row, including down to
  zero, with a clear "at least one medication is required" error on
  submit rather than disabling removal, §34), each item validated for
  medication/dosage/frequency only (duration/instructions stay optional,
  §35) — **no drug database, no autocomplete, no dosage/interaction/
  contraindication checking anywhere in this diff (§27, the task's own
  mandatory constraint)**. `generatePrescriptionNumber` mirrors
  `generatePaymentNumber`'s own illustrative sequential-numbering
  pattern (`ORD-2026-####`, real numbering is concurrency-safe and
  server-controlled later, §37). `prescription-detail-drawer.tsx`
  (`PrescriptionDetailDrawer`) is read-only — no Modifier/Supprimer
  anywhere; "Télécharger PDF"/"Imprimer" are prototype affordances only,
  never real document generation (§40); an optional "Consultation
  associée" section resolves the prescription's `consultationId` against
  UI-005B's own `ClinicalEncounter` fixtures without ever mutating that
  record (§38). A newly uploaded document and a newly created
  prescription both live only in `DocumentsSection`'s/
  `PrescriptionsSection`'s own local state — the same "local session
  state, not a global store" convention as every prior Dossier Santé
  prototype interaction; the centralized fixtures are never mutated, and
  no LocalStorage/IndexedDB/cookie is used anywhere. `PatientHealthContent`'s
  loading skeleton was extended with two more shape-matched placeholder
  blocks; loading/error remain the tab's one unified state (same §33
  reasoning as UI-005B/C — no real network boundary exists between these
  fixture reads). One UI-005B/C-era boundary test in `patient-health-
  content.test.tsx` was updated, not weakened: it used to assert this
  tab never rendered "Prescription"/"Document" text at all, which
  UI-005D's own explicit scope now legitimately supersedes — replaced
  with a positive integration check that both new section headings
  render, with their own full dedicated coverage living in
  `documents-section.test.tsx`/`prescriptions-section.test.tsx`. Full
  FR/AR under new `patientDetail.health.documents.*`/`patientDetail.
  health.prescriptions.*` namespaces (initially misnested as siblings of
  `patientDetail.health` rather than nested inside it — the same
  structural slip UI-005C's own `consultation` namespace made and left
  in place; caught here via a failing test run showing raw untranslated
  `patientDetail.health.documents.*` dot-path strings, and fixed by
  programmatically moving both blocks inside `patientDetail.health` in
  both locale files rather than by hand-editing raw JSON text). New
  Arabic clinical/document terminology reviewed for register and
  consistency with UI-005A/B/C (e.g. "المستندات" for Documents, "الوصفات
  الطبية" for Ordonnances — no competing translation introduced for any
  term already established). RTL verified (SSR `dir="rtl"`/`lang="ar"`
  on the route). Added `frontend/src/features/patients/clinical-
  documents.test.ts` (5 tests), `mock-clinical-documents-data.test.ts` (8
  fixture-integrity tests — including that no fixture field is ever a
  non-primitive value, proving no raw file contents are stored),
  `prescriptions.test.ts` (10 tests — including the numbering generator
  and both item-level and form-level validation), `mock-prescriptions-
  data.test.ts` (7 fixture-integrity tests), `components/documents-
  section.test.tsx` (15 tests: heading/list/metadata, category
  filtering with a filtered-empty state, the detail drawer's full
  metadata, the download future-feature notice, the upload form opening,
  file-required/MIME-rejected/valid-upload-succeeds, the new document
  appearing immediately, absence of any delete action, the empty state,
  absence of finance content, French, Arabic/RTL) and
  `components/prescriptions-section.test.tsx` (15 tests: heading/
  history, the detail drawer's structured items, the associated-
  consultation date, absence of edit/delete, the PDF/print future-feature
  notices, the creation form opening, per-field required validation,
  adding/removing a medication, the zero-items block, a full successful
  creation immediately opening the new read-only prescription, the empty
  state, absence of any drug-recommendation/interaction-checking UI,
  French, Arabic/RTL). All 424 frontend tests (364 carried over from
  UI-001 through UI-005C + 60 new UI-005D tests), typecheck, lint and
  build pass on the first full-suite run; backend regression (10 tests,
  clean on the first run) unaffected — no backend files touched. This
  completes the Patient 360° clinical frontend prototype sequence
  (UI-005A/B/C/D).
- UI-006A — Cabinet Finance Dashboard: `/app/finance` replaces the
  generic "not implemented" placeholder with the first real cabinet-wide
  financial command center (Spec #9 Screen 24), explicitly distinct from
  Patient 360°'s own Factures/Paiements tabs (CLAUDE.md §12/§19) — no
  patient-scoped screen is duplicated here. New `features/finance/`
  introduces a bounded aggregation/read-model layer: `aggregations.ts`
  derives every KPI from the *existing* UI-004D/E invoice/payment
  fixtures rather than a second, possibly-diverging calculation —
  `getFinancialSummary` (UI-004D) is reused unmodified across the full
  cabinet-wide invoice set for À encaisser/En retard, and
  `getEffectivePaidAmount` (UI-004E) is reused unmodified after
  period-filtering for Encaissé, so cabinet totals can never
  independently contradict Patient 360°'s own figures. A new
  `CabinetExpense`/`ExpenseCategory`/`ExpenseStatus` sibling finance-
  domain model was added to `components/domain/finance/types.ts`
  (alongside the existing Invoice/Payment types), with its own read-only
  synthetic fixture set (`features/finance/mock-expenses-data.ts`) —
  supports the Décaissements KPI/activity aggregation only, no
  expense-entry UI anywhere (UI-006D's own scope). KPIs: Encaissé, À
  encaisser, En retard, Décaissements, Position caisse — deliberately
  reconciling with the task's own §17/§18 five-metric set rather than
  Spec #9 Screen 24's four-metric illustration (Facturé/Encaissé/À
  encaisser/En retard), per CLAUDE.md §1's priority order (explicit task
  instructions over specification). À encaisser/En retard are
  deliberately NOT period-scoped (§18 never mentions a period for
  them — they are current balances, not activity that occurred during a
  window) while Encaissé/Décaissements/Position caisse do recompute on
  every period switch; this asymmetry is documented directly in
  `aggregations.ts`, not left implicit. Period switching (Aujourd'hui/
  Cette semaine/Ce mois, defaulting to "Ce mois" per Screen 24's own
  illustration) is resolved against the fixed `MOCK_BUSINESS_DATE`
  ("2026-08-23") prototype convention already used by Aujourd'hui/Agenda
  — "week" reuses Agenda's own Monday-start `getWeekStart` (UI-002)
  rather than a second week-boundary rule. Cash position is an
  explicitly documented prototype-only formula — opening position
  (500 MAD, matching Spec #9 Screen 30's own illustrative "Solde
  initial" rather than an invented number) + period collected − period
  disbursed — with a supporting-text disclaimer on its own MetricCard
  that this is a dashboard projection, not a real Caisse closing/
  reconciliation result (§41); UI-006C/E own actual Caisse session UX.
  The Receivables ("À encaisser") section resolves cabinet-wide
  outstanding (non-cancelled, positive-remaining) invoices to
  display-ready patient names, ordered overdue-first then currently-due
  (`RECEIVABLE_RANK`, never fixture insertion order); each row is a real
  `next/link` to the existing `/app/patients/{id}/invoices` workspace —
  no duplicate InvoiceDetailDrawer under cabinet Finance (§24). "Voir
  toutes les factures" shows a future-feature Toast notice rather than a
  real screen — the global invoice list is UI-006B's scope, not
  implemented early (§25/§51). "Activité récente" merges posted
  payments and posted expenses for the selected period into one
  newest-first list (`buildRecentActivity`), each row pairing a textual
  type label ("Encaissement"/"Décaissement") with its amount — never
  color/sign alone (§32) — and neither KPIs nor activity rows use
  giant green/red financial color coding anywhere (§19/Spec #10 §22),
  only MetricCard's existing restrained typography-emphasis convention
  (danger only for a genuinely nonzero En retard). No accounting
  terminology (Profit/Marge/EBITDA/Débit/Crédit/Grand livre) anywhere,
  no Caisse open/close controls, no expense-entry controls, no
  cabinet-level Encaisser/payment-capture workflow, no global invoice
  screen — all verified by dedicated absence tests. Added
  `frontend/src/features/finance/aggregations.test.ts` (16 tests:
  period-boundary resolution, collected/receivable/overdue/disbursed/
  cash-position math against the real fixtures, reversed-payment and
  cancelled-expense/cancelled-invoice exclusion, receivable ordering,
  activity merging/sorting), `mock-expenses-data.test.ts` (5
  fixture-integrity tests), `components/app/app-sidebar.test.tsx` (1
  test — the sidebar's generic `pathname.startsWith` active-state logic
  was already correct and unmodified, but had no prior regression test
  for any nav item; this is the first, and incidentally proves Finance
  now resolves against real content rather than the catch-all), and
  `finance-dashboard.test.tsx` (15 tests: header/default period,
  all five KPIs against the real fixtures, period switching recomputing
  the right three KPIs while leaving the other two unchanged,
  receivables ordering/exclusion/navigation, the future-feature "Voir
  toutes les factures" notice, recent activity rendering/ordering/
  exclusion, empty receivables, empty-period activity with an
  opening-only cash position, loading, error, French, Arabic/RTL, and
  absence of every forbidden accounting/Caisse/expense-entry/payment-
  capture control). All 461 frontend tests (424 carried over through
  UI-005D + 37 new UI-006A tests), typecheck, lint and build pass on the
  first full-suite run; backend regression (10 tests, clean) unaffected
  — no backend files touched. `frontend/ARCHITECTURE.md` gained a new
  "Cabinet Finance aggregation" convention paragraph documenting the
  reuse-over-reimplementation rule for future UI-006B/C/D/E tasks to
  follow.
- UI-006B — Global Invoices & Receivables: `/app/finance/invoices`, the
  cabinet-wide operational invoice workspace UI-006A's own "Voir toutes
  les factures" button now navigates to (a real `next/link`, replacing
  the future-feature Toast notice UI-006A originally showed before this
  screen existed — `finance.receivables.viewAllNotice` removed from both
  locale files as dead i18n). Reuse-first per the task's own explicit
  instruction: `InvoiceDetailDrawer` (UI-004D,
  `features/patients/components/invoice-detail-drawer.tsx`) is shared
  unmodified between Patient 360°'s Factures tab and this new screen —
  inspecting it first confirmed it never actually assumed Patient 360°
  page composition (it already took only pre-resolved props), so the
  only change needed was one small additive `showPatientNavigation`
  prop (default `false`) rendering "Ouvrir le patient"/"Voir les
  factures du patient" links only when explicitly requested; Patient
  360°'s own existing usage passes nothing and is behaviorally
  unchanged (its full test suite re-run confirms this). "Encaisser"
  still navigates unchanged to the existing `/app/patients/{id}/payments`
  workflow (UI-004E) — there remains exactly one implemented
  payment-capture prototype in the whole product, never a second one
  here (§24/§44). New `features/finance/global-invoices.ts` builds a
  `GlobalInvoiceRow` read model — cabinet-wide, every patient's
  invoices, not just one — from the *existing*
  `getInvoicesMockData()`/`getPatientsMockData()` fixtures (UI-004D/
  UI-003A), keeping the full `Invoice` embedded on each row rather than
  flattening total/paid/remaining onto it, so a table cell reads
  `row.invoice.totalAmount` directly instead of risking a second, stale
  copy. The next payable installment per invoice is derived via
  `getPayableInstallments` (UI-004E) called with no local payments —
  reused unmodified for a read-only cabinet view, never a payment
  session. Operational ordering (§18) is one explicit rank per
  `InvoiceStatus` value — overdue → issued → partially_paid → draft →
  paid → cancelled — with earliest-relevant-due-date-first as the
  secondary sort key (falling back to most-recently-issued-first for the
  tiers with no meaningful due date), verified against the real fixture
  set's exact order: inv-3, inv-1, inv-1b, inv-2, inv-1c. The five-value
  status filter (Toutes/À payer/Partiellement payées/Payées/En retard)
  is a second, deliberately distinct taxonomy from
  `features/patients/finance.ts`'s own patient-scoped `InvoiceFilterGroup`
  (which merges issued+partially_paid into one "due" bucket) — this
  screen's own task instructions require splitting them, so this is a
  documented, explicitly-scoped second mapping over the same
  `InvoiceStatus`, not duplicated status logic. Search is local,
  case-insensitive, across patient full name/patient number/invoice
  number. The financial summary card row (Total facturé/Payé/Reste à
  encaisser/En retard) reuses `getFinancialSummary` (UI-004D) completely
  unmodified — called over the *filtered* result set specifically, per
  this task's own explicit §5/§30 requirement, so cabinet totals can
  never independently drift from the same source invoices Patient 360°
  and the Finance dashboard already show. Desktop table
  (`global-invoice-table.tsx`) + mobile card list
  (`global-invoice-card-list.tsx`) mirror `PatientTable`/
  `PatientCardList`'s exact `hidden overflow-x-auto md:block` /
  `divide-y ... md:hidden` dual-render convention, including the same
  `lg:table-cell` secondary-column-hiding pattern at tablet width
  (Date/Total/Payé hidden below `lg`, since Patient/Invoice/Remaining/
  Next installment/Status are the columns the task calls more
  important). Search-empty ("Aucune facture ne correspond à votre
  recherche.") and filtered-empty ("Aucune facture ne correspond à ce
  filtre.") are two intentionally distinct states, each with its own
  targeted clear action — the real fixture set's own "À payer" filter
  (no invoice is ever plain "issued" with a positive balance in the
  current data) conveniently doubles as a live demonstration of the
  filtered-empty state without any synthetic data needed at the page
  level. No invoice creation/editing/cancellation, no payment capture,
  no Caisse, no expenses, no accounting terminology anywhere — verified
  by dedicated absence tests. Added
  `frontend/src/features/finance/global-invoices.test.ts` (14 tests:
  operational ordering/priority against the real fixtures, patient-name/
  number resolution, next-installment derivation including the
  no-schedule case, search by name/number/invoice-number, all five
  filter predicates against synthetic rows, and a direct equality check
  against `getFinancialSummary`'s own output), `global-invoices-page.test.tsx`
  (24 tests: header, summary integrity, table ordering/patient identity/
  invoice reference, mobile-card dual-render proof, next-installment
  display, search by name/number/invoice-number, each filter, the
  À-payer/filtered-empty combination, search+filter composition, result
  count, invoice detail opening with lines/installment schedule, the two
  new patient-navigation links, Encaisser navigation plus absence of any
  duplicate payment form, paid/cancelled invoices having no Encaisser,
  search-empty with working clear action, fully-empty with no filter
  chrome, loading, error, Arabic/RTL, and absence of invoice-creation/
  accounting/Caisse/expense controls), and two more cases in
  `components/app/app-sidebar.test.tsx` (Finance remains the active
  main-sidebar section for both `/app/finance` and the new nested
  `/app/finance/invoices`). All 500 frontend tests (461 carried over
  through UI-006A + 39 new UI-006B tests), typecheck, lint and build
  pass on the first full-suite run; backend regression (10 tests, clean)
  unaffected — no backend files touched.
- UI-006C — Caisse: Opening & Cash Movements: `/app/finance/caisse` —
  Spec #2's own IA sitemap nests Caisse under Finance (alongside
  Factures/Échéances/Encaissements/Décaissements), not a standalone
  `/app/caisse`, so the task's own tentative route guess was reconciled
  against the specification per CLAUDE.md §1's priority order and
  documented as a deliberate choice, not an oversight. Today's cash
  register: closed → opening-balance workflow → open, with a derived
  movement history — deliberately distinct from the Finance dashboard
  (UI-006A, "how much did the cabinet collect this period") and from
  Patient 360°'s own Paiements tab (CLAUDE.md §12/§19). New
  `CashSession`/`CashMovementDirection`/`CashMovementType`/
  `CashMovement` types added to `components/domain/finance/types.ts`
  (Spec #4 §18's `cash_register_sessions`/`cash_movements`, simplified —
  every closing/reconciliation field
  (`expected_closing_balance`/`physical_closing_balance`/`difference_*`/
  `closed_by`/`closed_at`) deliberately omitted rather than modeled
  early, since UI-006E owns them and they are not harmless to leave
  half-defined) plus `cash-session-status.ts` (closed/open → tone/label,
  mirroring `invoice-status.ts`'s own registry pattern). New
  `features/caisse/` — `calculations.ts`'s `buildCashMovements` derives
  every movement from the *existing* fixtures, never a second movement
  universe: posted, cash-method patient payments matching the session's
  business date (UI-004E, reversed excluded) and posted expenses
  matching that date (UI-006A, cancelled excluded — proven against the
  real `exp-5` fixture). Since neither `Payment` nor `CabinetExpense`
  tracks a real time-of-day, a small deterministic synthetic-time
  generator assigns each movement an `HH:MM` value from a stable sort
  key (type then id) rather than inventing per-fixture times by hand —
  general and reproducible for any input set, not coupled to specific
  real IDs. Movements are then re-sorted newest-first for display.
  Theoretical balance (opening + incoming − outgoing) reuses a new
  `computeCashBalance` primitive extracted from UI-006A's own Position
  Caisse formula (`features/finance/aggregations.ts`) — the smallest
  safe refactor the task asked for (§43): `computeCashPosition` now
  calls this shared one-liner internally with zero change to its own
  public signature/behavior, verified by UI-006A's entire pre-existing
  test suite passing unmodified. The two "opening" values keep
  deliberately distinct semantics, documented directly in the shared
  function's own doc comment: UI-006A's is the constant
  `OPENING_CASH_POSITION` reused across all three period views (a
  projection), while Caisse's is the real amount entered when today's
  specific session was opened. `mock-data.ts` provides the deterministic
  "Open Caisse" prototype defaults required by §21-22 (never
  `Date.now()`) — `SESSION_OPENED_AT = "08:15"` and a new synthetic
  receptionist name, `OPENED_BY_NAME = "Meryem Bakkali"`, deliberately
  NOT "Sara Alaoui" (already the canonical empty-fixture patient across
  UI-004D/E/UI-005*, pat-2) to avoid a staff/patient name collision that
  Spec #9 Screen 33's own wireframe would have introduced if copied
  verbatim. The live route defaults to an already-open synthetic session
  (§17 — a reviewer can inspect movement history immediately) while
  `CaissePage`'s own `initialSession` prop fully supports starting
  `null` (closed) so the opening workflow itself is demonstrable and
  tested; opening a second session is structurally impossible once open
  — the opening form simply stops rendering, no separate guard needed.
  A patient-payment movement row navigates to the existing
  `/app/patients/{id}/payments` surface, never a duplicate payment
  detail/capture. "Fermer la caisse" is shown (Spec #9 Screen 30's own
  wireframe includes it) but is deliberately non-functional — it shows
  only "La clôture de caisse sera implémentée dans UI-006E." and never
  mutates session state, verified by a dedicated test. No expense entry,
  no physical cash count, no discrepancy calculation, no real closing,
  no accounting terminology anywhere. Added
  `frontend/src/features/caisse/calculations.test.ts` (17 tests:
  movement derivation from real payment/expense fixtures, reversed-
  payment and cancelled-expense exclusion — the latter against the real
  `exp-5` fixture, cross-day isolation, deterministic multi-movement
  ordering, payment/expense reconciliation against
  `getEffectivePaidAmount`'s own output, movement reference integrity,
  the theoretical-balance formula, and the direct UI-006A/UI-006C
  formula-consistency proof), `caisse-page.test.tsx` (14 tests: header,
  closed state with the opening-balance input, negative-balance
  rejection, zero-balance acceptance with success feedback, custom
  opening balance represented in the summary, second-session
  prevention, a combined payment+expense day exercising opened-at/
  opened-by/summary/movement rendering/ordering/patient navigation,
  reversed-payment exclusion, cancelled-expense exclusion doubling as
  the open/no-movement state, the non-functional close notice, loading,
  error, Arabic/RTL, and absence of every forbidden manual-creation/
  payment-capture/expense-entry/cash-count/reconciliation/accounting
  control), and one more case in `components/app/app-sidebar.test.tsx`
  (Finance remains active for the new nested `/app/finance/caisse`
  route too). All 532 frontend tests (500 carried over through UI-006B +
  32 new UI-006C tests), typecheck, lint and build pass on the first
  full-suite run; backend regression (10 tests, clean) unaffected — no
  backend files touched.
- UI-006D — Décaissements & Expenses: `/app/finance/expenses` — the
  cabinet cash-expense capture workspace, completing the
  Caisse-open → new décaissement → Expense + CashMovement OUT →
  theoretical balance decrease workflow whose opening/movement-history
  half UI-006C already implemented. Scoped to `MOCK_BUSINESS_DATE` only,
  like `/app/finance/caisse` itself, rather than Spec #9 Screen 32's own
  broader Période/Catégorie-filterable ledger: a décaissement is
  conceptually a cash-register operation tied to the *currently open*
  session, not an accounting history browser, so a period selector was
  deliberately not added (documented decision, §15's own explicit
  "otherwise do not expand scope" instruction) — the task's own §13
  mockup (today-only, "TOTAL AUJOURD'HUI" + a flat list) was treated as
  authoritative over the wireframe under CLAUDE.md §1. For the same
  reason, the "+ Nouveau décaissement" form's field list follows the
  task's own explicit §19 enumeration (category/amount/description/
  optional supporting document) rather than Screen 32's beneficiary/
  payment-method fields — every décaissement recorded here is implicitly
  a cash expense (`CabinetExpense` has no payment-method field to begin
  with, an UI-006A-era simplification carried forward unchanged).
  `CabinetExpense` (UI-006A) is extended, not replaced: three new
  optional fields (`time`, `createdBy`, `supportingDocument`, plus a new
  `ExpenseSupportingDocument` metadata-only type — `fileName`/
  `mimeType`/`sizeBytes`, mirroring `ClinicalDocument`'s own shape, never
  `File`/`Blob`/base64/an `ObjectURL`) so UI-006A's five original
  fixtures are completely unaffected. New `features/finance/expenses.ts`
  holds every pure, directly-tested calculation: `filterTodayPostedExpenses`/
  `sortExpensesNewestFirst` (a missing `time` — UI-006A's date-only
  fixtures — sorts as if "00:00", never a fabricated time),
  `computeExpensesTotal`, a strictly-positive `isValidExpenseAmount`
  (deliberately a separate function from Caisse's own
  `isValidOpeningBalance`, which allows 0 — a different validation rule,
  not the same one duplicated), a deterministic `nextSyntheticTimeForSequence`
  (never `Date.now()`, independent from but stylistically consistent
  with UI-006C's own synthetic-time generator — that one assigns times
  to *derived* movements, this one to a *newly created* expense), and
  `createExpenseAndMovement` — a pure builder returning a matching
  `CabinetExpense` + `CashMovement` OUT pair whose direction/type/
  `expenseId`/amount are consistent by construction, not by a separate
  reconciliation check. The page's create handler calls this once and
  applies both results to local state in the same function (§30's own
  "one orchestrated handler" requirement) — never an intermediate render
  where the expense exists but the movement does not, or vice versa. A
  dedicated cross-module test (`expenses.test.ts`) proves the resulting
  `CashMovement`, once folded into `features/caisse/calculations.ts`'s
  own `computeTheoreticalBalance`, decreases the theoretical balance by
  exactly the new expense's amount — the balance itself is deliberately
  never re-rendered on this page (§45: "do not duplicate the entire
  Caisse page"), only proven by calculation; a persistent "Voir la
  caisse" link (header + closed-state guidance) is the only cross-page
  connection, consistent with §32-33's explicit allowance that
  cross-route prototype state does not need to survive navigation.
  `EXPENSE_CATEGORY_MAP` (UI-006A) is reused unmodified for both the
  form's category `Select` and every rendered category label — no second
  taxonomy. The optional supporting-document file input reuses the exact
  same conservative PDF/JPEG/PNG MIME allowlist and metadata-only
  discipline already established by UI-005D's clinical-document upload,
  and the read-only detail drawer's "Télécharger le justificatif" reuses
  that same feature's exact future-feature Toast message rather than
  inventing a second one. Caisse-open is enforced structurally: while
  closed, both "+ Nouveau décaissement" affordances (header and the
  empty-state's own action) are simply not rendered, replaced with an
  alert-styled guidance card linking to `/app/finance/caisse` — never a
  silent auto-open. Expense detail is read-only — no "Modifier"/
  "Supprimer" anywhere, matching CLAUDE.md §24 (financial records are not
  ordinary CRUD). Added `frontend/src/features/finance/expenses.test.ts`
  (21 tests: MIME allowlist, amount validation including zero/negative/
  non-integer/NaN, today+posted filtering including the real cancelled
  `exp-5`-style case, newest-first ordering including the missing-time
  tiebreak, the total, the deterministic time generator, the atomic
  builder's structural reference/amount integrity, supporting-document
  metadata pass-through and its metadata-only field shape, and the
  cross-module Caisse-balance-decrease proof),
  `expenses-page.test.tsx` (21 tests: header/summary, existing today's
  history rendering, cancelled-expense exclusion from the total,
  newest-first ordering, the create dialog opening only while Caisse is
  open, closed-state guidance and its link, required-field validation,
  zero/negative amount rejection, disallowed MIME rejection, optional
  document success, immediate list/total update on valid submit,
  `createdBy` sourced from the open session, detail-drawer rendering
  including supporting-document metadata and the future-only download
  notice, no-document detail state, empty state with/without the create
  action depending on Caisse status, loading, error, Arabic/RTL, and
  absence of every forbidden supplier/accounting/Caisse-closing
  control), and one more case in `components/app/app-sidebar.test.tsx`
  (Finance remains active for the new nested `/app/finance/expenses`
  route too). All 575 frontend tests (532 carried over through UI-006C +
  43 new UI-006D tests), typecheck, lint and build pass on the first
  full-suite run; backend regression (10 tests, clean) unaffected — no
  backend files touched.
- UI-006X — Finance Workspace Alignment & Navigation: a corrective UX/IA
  task — no new business functionality — bringing `/app/finance` and its
  three siblings into one coherent workspace now that UI-006B/C/D all
  exist. New `features/finance/components/finance-nav.tsx` (`FinanceNav`)
  reuses the existing generic `Tabs` primitive (Spec #8 §48 — the same
  real-navigation component already backing Patient 360°'s own tab bar)
  rather than inventing a new nav pattern: real `<Link>`s, `aria-current`,
  horizontal-scroll-on-mobile and logical-property (RTL-safe) spacing all
  came for free. Four items — Vue d'ensemble/Factures/Caisse/
  Décaissements — deliberately fewer than Spec #9 Screen 24's own
  six-tab wireframe (Aperçu/Factures/Échéances/Encaissements/Caisse/
  Décaissements): Échéances and Encaissements have no real route yet, so
  including them would link to nothing; the task's own explicit
  four-item list (§8) takes priority per CLAUDE.md §1. Active-state
  matching is exact/path-aware (`resolveActiveSection`, keyed off
  `usePathname()`): `/app/finance` matches only the literal route, never
  every nested Finance path via a naive `startsWith` (the exact bug this
  task's own §9 warns against — `AppSidebar`'s own main-nav matching
  already gets this right for the whole Finance module, this fixes the
  equivalent problem one level down, inside it). Integrated identically
  into all four Finance pages, positioned right after `PageHeader` in
  every one. The main sidebar (`lib/nav-config.ts`, `AppSidebar`) is
  completely untouched — Finance remains exactly one sidebar module, its
  children living only inside `FinanceNav`.
  Dashboard recomposition: `KpiSummary` drops the "Position caisse" card
  — that whole prototype-projection concept is gone, not just hidden.
  `computeCashPosition`/`OPENING_CASH_POSITION` are removed from
  `features/finance/aggregations.ts` and `cashPosition` from the
  `FinanceKpis` type; `computeCashBalance` (the actually-shared
  arithmetic primitive) stays untouched, now with exactly one caller
  left — Caisse's own `computeTheoreticalBalance`
  (`features/caisse/calculations.ts`). New `DashboardCaisseSection`
  replaces the removed card with Caisse's real operational state,
  reusing `getDefaultOpenSessionMockData`/`buildCashMovements`/
  `computeIncomingTotal`/`computeOutgoingTotal`/
  `computeTheoreticalBalance`/`CaisseSummary` verbatim from
  `features/caisse/` (UI-006C) — never a second cash-position formula,
  per the task's own explicit §20/§24 requirement. Open state shows the
  real 4-metric `CaisseSummary` plus "Ouverte à HH:MM par {name}" and a
  "Voir la caisse" link (reusing UI-006D's own exact string, not a
  duplicate); closed state shows "La caisse n'est pas ouverte." (a new,
  deliberately distinct string from Caisse's own
  `closedDescription` — that one is an instruction to open it, this one
  is a status statement) plus the same link. `finance-dashboard.tsx`'s
  own local `BUSINESS_DATE = "2026-08-23"` literal — a pre-existing,
  UI-006A-era duplicate of the canonical business-date constant — is
  replaced with the real `MOCK_BUSINESS_DATE` import from
  `features/caisse/mock-data.ts`, required for correctness now that the
  dashboard's own Caisse section must query movements for the exact same
  business date as the `CashSession` it displays (previously harmless
  since nothing cross-checked the two; now genuinely load-bearing).
  `ReceivablesSection`'s heading changes "À encaisser" → "À traiter"
  with a new overdue-count/total + to-collect-count/total summary line,
  computed by filtering/summing the *already-built* `receivables` array
  in the component itself (`summarizeAttention`) — not a new financial
  total, not a rebuilt priority rule. `RecentActivitySection` rows are
  now real navigation: a payment row links to the existing
  `/app/patients/{id}/payments`, an expense row to
  `/app/finance/expenses` — mirroring `CaisseMovementList`'s own
  navigable-row convention (UI-006C) exactly, including reusing its
  `finance.caisse.movements.viewPaymentAriaLabel` key rather than adding
  a duplicate. Invoices/Caisse/Expenses pages are otherwise untouched —
  each gained exactly one line, `<FinanceNav />` after its own
  `PageHeader`.
  i18n: added `finance.nav.*` (navigationLabel, overview — the other
  three tab labels reuse `finance.invoices/caisse/expenses.pageTitle`
  verbatim, no duplicate strings), `finance.dashboard.*` (caisseTitle,
  caisseClosedNote), `finance.receivables.overdueCount`/`toCollectCount`,
  `finance.activity.viewExpenseAriaLabel`; removed the now-dead
  `finance.kpis.cashPosition`/`finance.cashPositionNote` keys (FR+AR).
  Arabic reuses the exact same "المصروفات" plural already established
  for `finance.kpis.disbursed`/`finance.caisse.summary.outgoing` for
  "Décaissements" tab consistency, and "نظرة عامة" verbatim from
  `patientDetail.tabs.overview` for "Vue d'ensemble" — no competing
  terminology introduced.
  Added `features/finance/components/finance-nav.test.tsx` (6 tests: all
  four items/hrefs, exact-route overview active state, each of the other
  three routes' own active state, Arabic). Rewrote
  `finance-dashboard.test.tsx` around the new composition (still 16
  tests: header+nav+period default, four KPIs with the projection gone,
  period-switch recomputation, real open-Caisse summary matching
  UI-006C's own derivation, closed-Caisse note, À traiter summary line
  and ordering/navigation, recent-activity navigation, empty/loading/
  error, Arabic/RTL, forbidden-controls). Updated
  `aggregations.test.ts` (removed the `computeCashPosition`/
  `OPENING_CASH_POSITION` describe block and `cashPosition` from the
  `computeFinanceKpis` expectation — the underlying concept was removed,
  not just its test) and `features/caisse/calculations.test.ts` (the
  UI-006A/UI-006C formula-consistency proof now compares
  `computeTheoreticalBalance` directly against `computeCashBalance`,
  since `computeCashPosition` no longer exists to compare against — the
  "no duplicate formula" property still holds and is still tested, just
  against the one primitive that's actually still shared). Added one
  FinanceNav-active-state test each to `global-invoices-page.test.tsx`,
  `caisse-page.test.tsx` and `expenses-page.test.tsx` — their own
  existing 59 tests all passed unmodified on the first run after adding
  `<FinanceNav />` (no text-collision fixes were needed there; the
  dashboard's own rewrite needed several, documented inline as `getAllByText`
  scoping, matching this session's established collision-handling
  convention). Total 586 frontend tests (575 carried over through
  UI-006D + 11 net new), typecheck, lint and build pass on the first
  full-suite run; backend regression (10 tests, clean) unaffected — no
  backend files touched. Rendered visual QA: DOM/SSR-level only (curl
  against the running dev server — 200 on all four routes, `dir="rtl"`/
  `lang="ar"` present, obsolete "Position caisse"/"Projection prototype"
  wording confirmed absent) — no browser-automation/screenshot tool was
  available in this environment, so true pixel-level rendered QA was not
  performed; the dev server was left running for manual browser review.
