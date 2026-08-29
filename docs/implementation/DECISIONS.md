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

---

## ADR-006 — UI-008ABCD Pharmacie & Stock: planning-metadata enrichment, negative-stock policy, and expiry-horizon default

### Status

Accepted

### Decision

Three related prototype-scoping decisions made while implementing the
healthcare inventory module, each recorded here per CLAUDE.md §1/§59
rather than silently assumed:

1.  **Stock-policy enrichment stays additive and non-persisted.**
    `InventoryItem.stockPolicy` (`components/domain/stock/types.ts`)
    carries `safetyStock`/`reorderPoint`/`maximumStock`/
    `reorderQuantity`/`leadTimeDays` alongside the mandatory
    `minimumStock` — but the approved domain model (Spec #4 §23.1) only
    defines `minimum_stock`. This task's own instructions (§5 preamble)
    explicitly frame the richer parameter set as a deliberate
    product-owner enrichment, and — unlike ADR-005's check-in/out case —
    nothing in the approved specs *prohibits* these fields; they are
    simply absent. `minimumStock` stays mandatory to match the approved
    field exactly; every other threshold is optional, frontend-only
    prototype metadata (never sent anywhere, never implying a
    purchase-order/supplier entity) that degrades gracefully when unset.
2.  **Negative stock is disallowed.** An OUT (or a negative adjustment)
    that would drive an item's or a specific lot's own balance below
    zero is blocked client-side before submit
    (`wouldCauseNegativeItemBalance`/`wouldCauseNegativeLotBalance`,
    `features/stock/movements.ts`) rather than silently allowed or
    clamped. CLAUDE.md §59 lists "Negative stock" explicitly as an
    ADR-worthy topic; Spec #4 (around §41.3) also anticipates "Prevent
    race causing invalid negative quantity" without settling the
    prototype-level policy itself.
3.  **30-day expiry warning horizon is an explicit assumption.**
    Spec #3's own open-questions list names "Expiration warning
    horizon" as unresolved. `EXPIRY_WARNING_HORIZON_DAYS = 30`
    (`features/stock/lots.ts`) is a common pharmacy/medical-stock
    convention used here as a documented placeholder, not a silently
    invented one.

### Context

All three are prototype-scoping calls with no security/data-integrity
risk (nothing persists past the browser session), so none met the
CLAUDE.md §63 bar to stop and ask — but all three shape visible
behavior (which thresholds a form accepts, whether an OUT can be
submitted, which lots a dashboard flags), so silently picking values
without a durable record would leave a future contributor unable to
tell "deliberate default" from "accidental gap."

### Alternatives

1.  Limit `StockPolicy` to `minimumStock` only, matching the approved
    schema exactly — rejected: contradicts the task's own explicit
    enrichment instructions without a genuine specification conflict to
    justify the refusal.
2.  Allow negative stock (or silently clamp to zero) — rejected: would
    let a Stock OUT/adjustment silently misrepresent real physical
    inventory, the opposite of what an inventory module exists to
    prevent; CLAUDE.md §59 flags this exact question as needing a
    recorded decision, not a silent default.
3.  Leave the expiry horizon unresolved/hardcode it inline without
    comment — rejected: the specs mark it explicitly open; a silent
    guess would be indistinguishable from an oversight later.
4.  **Chosen:** implement all three as documented, reversible defaults —
    reviewable and adjustable once real policy/configuration exists.

### Consequences

- A future backend Inventory module can adopt, narrow, or reject the
  optional `StockPolicy` fields independently of this prototype; none
  of them are implied to exist server-side yet.
- If the real negative-stock policy is later decided differently (e.g.
  allowing negative stock with a warning), only
  `wouldCauseNegativeItemBalance`/`wouldCauseNegativeLotBalance` and
  their call sites need to change — the rest of the balance-derivation
  chain is unaffected.
- If a different expiry warning horizon is adopted, only
  `EXPIRY_WARNING_HORIZON_DAYS` changes; every consumer
  (`resolveLotExpiryStatus`, the dashboard KPI, both attention lists)
  already derives from that one constant.

### Date

2026-08-27

------------------------------------------------------------------------

## ADR-007 — UI-009ABC Communication Center: outbound-only messages, retry re-queues rather than fabricating success, and a 7-day volume window

### Status

Accepted

### Decision

Three related prototype-scoping decisions made while implementing the
Communication Center module, recorded here per CLAUDE.md §1/§59:

1.  **`CommunicationMessage` carries no `direction` field.** UI-009ABC's
    own task instructions (§10) hedge direction as "Potential:
    outbound/inbound" and explicitly say not to invent inbound WhatsApp
    conversation management when V1 only requires outbound operational
    communication. Spec #4 §24.2's own `communication_messages` schema
    has no direction column at all — every field (`recipient`,
    `resolved_body`, `template_id`) is inherently outbound-shaped. Every
    message in this domain is therefore outbound by construction; adding
    an always-`"outbound"` field would be a no-op enrichment with no
    behavior behind it.
2.  **Retry re-queues a failed message rather than marking it
    sent/delivered.** `retryMessage` (`features/communication/operations.ts`)
    moves a failed message back to `"queued"` and clears its failure
    metadata — it never fabricates a successful outcome. UI-009ABC §12
    is explicit that message status is prototype metadata only ("No real
    provider acknowledgment exists... Do not claim real delivery"); a
    retry action that jumped straight to "delivered" would violate that
    rule on the one path a user can trigger interactively.
3.  **`MESSAGE_VOLUME_WINDOW_DAYS = 7` is an explicit prototype
    default**, distinct from Stock's own 30-day
    `EXPIRY_WARNING_HORIZON_DAYS` (`features/communication/dashboard.ts`).
    Neither UI-009ABC nor the specs name a volume-KPI window for
    Communication; patient messaging happens at daily/hourly cadence
    (appointment reminders, confirmations), not the weekly-to-monthly
    cadence stock movements follow, so reusing Stock's 30-day constant
    verbatim would make the KPI far less informative. A 7-day rolling
    window is used as a documented placeholder, not a silently invented
    one.

### Context

None of the three carries security/data-integrity risk (nothing persists
past the browser session), so none met the CLAUDE.md §63 bar to stop and
ask — but all three shape visible behavior (whether an inbound-conversation
UI exists at all, what a retry click actually does, which messages count
toward the dashboard's volume KPI), so recording them prevents a future
contributor from mistaking a deliberate default for an oversight.

A fourth, smaller scoping call from the same task — `AutomationRule`'s
"bounded configuration prototype" (§11) exposes only an active/inactive
toggle per canonical event type, with channel/template staying read-only
— is a direct, literal reading of Spec #2 §40's own closing line ("Owner
can configure whether each automation is active") rather than an
independent judgment call, so it is noted here for completeness but not
given its own numbered decision.

### Alternatives

1.  Add a `direction` field defaulting to `"outbound"` everywhere —
    rejected: dead weight with no inbound code path to distinguish it
    from, contradicting the task's own instruction not to invent one.
2.  Have retry immediately mark the message `"delivered"` (the
    optimistic, more visually satisfying outcome) — rejected: directly
    contradicts §12's "do not claim real delivery" rule; a `"sent"`
    outcome was also considered and rejected for the same reason — the
    prototype has no real provider round-trip to justify claiming either
    outcome, so re-queuing is the only honest representation.
3.  Reuse Stock's existing 30-day window constant instead of a second
    one — rejected: the two domains have genuinely different natural
    cadences, and a 30-day communication-volume KPI would read as near-
    constant for a small cabinet, defeating its own purpose as an
    at-a-glance operational signal.
4.  **Chosen:** implement all three as documented, reversible defaults.

### Consequences

- If a future real integration needs inbound messages (patient replies),
  `direction` can be added at that point without touching any existing
  outbound message — nothing in this prototype assumes the field's
  absence beyond simply not reading it.
- If the real retry semantics differ (e.g. an immediate synchronous
  provider call that can genuinely confirm success/failure), only
  `retryMessage` and its call sites change — the rest of the message
  model is unaffected.
- If a different volume window is adopted, only
  `MESSAGE_VOLUME_WINDOW_DAYS` changes; the dashboard KPI is its only
  consumer.

### Date

2026-08-27

---

## ADR-008 — UI-010ABC Reports & Cabinet Configuration: cabinet-level working hours, read-only numbering, and a partitioned Stock KPI grouping

### Status

Accepted

### Decision

Three related prototype-scoping decisions made while implementing Reports
& Cabinet Configuration, recorded here per CLAUDE.md §1/§59:

1.  **Cabinet working hours are modeled cabinet-wide only, never
    per-practitioner.** Spec #4 §12 ("Availability domain") only ever
    defines `practitioner_working_hours`/`practitioner_breaks` — no
    `practice_working_hours` table exists anywhere in the approved domain
    model. Spec #2 §46 ("Settings — Working hours") lists "Practice
    hours" and "Practitioner hours" as two separate configurable things
    in prose, without resolving how a multi-practitioner cabinet would
    reconcile the two. `CabinetWorkingHoursDay`
    (`components/domain/settings/types.ts`) implements the one
    unambiguous case both the onboarding wireframe (Spec #9 Screen 05)
    and CLAUDE.md's own "solo-first, cabinet-capable" framing actually
    show: one weekly schedule for the cabinet as a whole. Team's own
    per-practitioner `WorkInterval` (`components/domain/team/types.ts`,
    UI-007B) is untouched and remains the authoritative per-practitioner
    concept.
2.  **Numbering & Documents (`/app/parametres/numerotation`) is
    read-only**, never an editable configuration form. Spec #4 §59
    ("Concurrency controls") requires invoice/receipt numbering to "lock
    sequence row during allocation" — a real database-transaction
    guarantee this frontend-only prototype cannot provide. Showing an
    editable prefix/format form here would imply a safety property (no
    duplicate/skipped numbers under concurrent access) the prototype
    cannot actually honor. The page instead shows each sequence's own
    live-computed next number (`computeNumberingSummary`,
    `features/parametres/numbering.ts`) — informational, not
    configurable.
3.  **`StockReportKpis` splits Stock's own combined `lowStockItemsCount`
    into `outOfStockCount` (out_of_stock only) and `lowStockCount`
    (critical + low)**, a different grouping of the exact same
    `StockAttentionStatus` rows `computeStockKpis` (UI-008ABCD) already
    reads — never a second balance/attention derivation. This follows
    the task's own Overview wireframe, which asks for "Articles en
    rupture" and "Stock faible" as two separate numbers rather than
    Stock's own single combined figure.

### Context

None of the three carries security/data-integrity risk, so none met the
CLAUDE.md §63 bar to stop and ask — but all three shape visible behavior
(what the Working Hours page actually edits, whether Numbering looks
editable, how the Stock KPI blocks are split), so recording them prevents
a future contributor from mistaking a deliberate boundary for an
oversight.

A fourth, smaller scoping call from the same task — Reports deliberately
does **not** implement an invented "confirmation rate" KPI (Spec #2
§42.1 names the KPI label with no defined formula anywhere in the
approved specifications) or a "revenue by service" breakdown (Spec #2
§42.2; `Invoice` carries no service/service-id field, so any join to
Agenda's `SERVICES` catalog would require an unreliable free-text-
description match) — is a direct application of CLAUDE.md §3's
"do not invent requirements" rule rather than an independent judgment
call, so it is noted here for completeness but not given its own
numbered decision.

### Alternatives

1.  Model working hours per-practitioner from the start (matching Spec
    #4 §12's own schema literally) — rejected for this task: the primary
    persona is solo-first, no UI anywhere yet lets an owner pick "whose"
    hours are being viewed, and building a practitioner-selector purely
    to satisfy schema symmetry would be scope creep with no consuming
    screen. Per-practitioner working-hours *editing* remains a real gap,
    explicitly deferred rather than silently resolved.
2.  Build a fully editable numbering-configuration form (prefix, format
    pattern, manual reset) — rejected: would misrepresent a concurrency
    guarantee this prototype cannot provide, and no approved wireframe
    defines the exact editable fields.
3.  Keep Stock's existing single `lowStockItemsCount` figure and show it
    twice, unpartitioned — rejected: does not satisfy the task's own
    explicit two-number wireframe ask, and would make "Articles en
    rupture" and "Stock faible" show the identical value, which is
    actively misleading.

### Consequences

- If a future task adds real per-practitioner cabinet scheduling,
  `CabinetWorkingHoursDay` can be extended with an optional
  `practitionerId` (or superseded by a per-practitioner list) without
  touching Team's own `WorkInterval` model.
- If a future task adds real backend-controlled numbering sequences,
  `/app/parametres/numerotation` gains an edit affordance at that point;
  `computeNumberingSummary`'s read-only figures remain valid as the
  "current state" display underneath it.
- If Stock's own dashboard KPI shape changes, `computeStockReportKpis`
  must be re-verified against it (already proven live via
  `cross-configuration-integrity.test.ts` and
  `cross-reporting-integrity.test.ts`) rather than assumed to still
  reconcile.

### Date

2026-08-28

------------------------------------------------------------------------

## ADR-009 — UI-010BC Cabinet Settings & Operational Configuration: no invented tenant fields, cash-only Paiements, and a bounded Documents scope

### Status

Accepted

### Decision

Four related prototype-scoping decisions made while completing the
Paramètres module (Rendez-vous, Paiements, Documents; Cabinet Settings
verified against spec), recorded here per CLAUDE.md §1/§59:

1.  **`CabinetProfile` deliberately does not gain `legalName`,
    `addressLine1`/`addressLine2`, `postalCode`, `country`, or a
    structured `logoMetadata` field**, despite the task's own conceptual
    field list naming them. Spec #4 §5.1 (`tenants`) and Spec #2 §44
    ("Settings — Cabinet") both define only a single `address`/`city`
    pair and a `logo_file_id` — no split address, no legal-name column,
    no country column exists anywhere in the approved domain model. The
    task's own text anticipates this: "Use specification fields where
    different... Do not model backend tenant/security settings." Adding
    fields the backend schema does not have would misrepresent what a
    future Laravel integration can actually persist. Gate 1 therefore
    required no code change — `CabinetProfile`/`CabinetSettingsPage`
    (UI-010ABC) already satisfy Spec #4 §5.1 exactly.
2.  **Paiements (`/app/parametres/paiements`) lists exactly one payment
    method, informational only, never an editable multi-method toggle
    list.** Finance's own `Payment.method` (`components/domain/finance/
    types.ts`) is typed as exactly `"cash"`, whose own doc comment
    already states "V1 patient payments are cash-only (CLAUDE.md §23) —
    no card/online method." `PaymentMethodRow` reuses that literal type
    verbatim; offering card/bank-transfer/cheque toggles would advertise
    processing capability Finance cannot provide, and CLAUDE.md §50
    explicitly excludes payment-gateway integration from V1 non-scope.
3.  **Rendez-vous (`/app/parametres/rendez-vous`) is bounded to
    `defaultSchedulingMode`/`defaultDurationMinutes`**, the only two
    concerns Spec #2 §46 actually names ("Appointment durations/
    defaults. Exact-time/window mode."). No public-booking-enabled or
    booking-horizon toggle was added: `/book` (Spec #7 §31) remains a
    documented visual placeholder with no real request-submission flow
    (`frontend/src/app/book/page.tsx`'s own doc comment: "proves the
    charter-approved visual treatment only, not real booking
    functionality"), so a setting that configures it would control a
    feature that does not exist yet.
4.  **Documents (`/app/parametres/documents`) omits "Invoice
    template"/"Prescription template" selection and "Tax display"**,
    both named in Spec #2 §47. No real document-rendering system exists
    in this prototype (the task's own explicit "NO production document
    generation"), so a template picker would have no visible effect and
    would misrepresent capability. `Invoice`
    (`components/domain/finance/types.ts`) carries no tax field at all —
    there is nothing for a tax-display toggle to control. `footerText`/
    `documentLanguage` instead derive by default from the Cabinet
    profile fixture itself (`buildDefaultDocumentFooter`,
    `features/parametres/document-settings.ts`) rather than an
    independently invented example string — the same "derive, never
    duplicate" discipline `features/rapports` applies to KPIs.

### Context

None of the four carries security/data-integrity risk, so none met the
CLAUDE.md §63 bar to stop and ask. All four are direct applications of
CLAUDE.md §3 ("do not invent requirements") to the Settings module: every
omission traces to either a field the approved schema does not have, or
a capability another already-shipped module does not actually provide.
Recording them prevents a future contributor from mistaking a deliberate
boundary for an oversight, and gives the eventual Laravel integration an
accurate map of what the frontend prototype does — and does not — assume.

### Alternatives

1.  Add `legalName`/split-address/`country` fields to `CabinetProfile`
    to match the task's own conceptual list literally — rejected: no
    backing column exists in Spec #4 §5.1, and the fields would have no
    consumer anywhere else in the prototype (no document/invoice
    currently renders a legal name or a formatted multi-line address).
2.  Build an editable Paiements list seeded with common Moroccan payment
    methods (card, virement, chèque) marked "coming soon" — rejected:
    even disabled, a multi-row list visually implies near-term
    capability Finance's own data model does not support, which is more
    misleading than a single, honestly-labeled cash row.
3.  Add a "public booking enabled" toggle to Rendez-vous now, ahead of a
    real public-booking flow — rejected: the toggle would control
    nothing (`/book` never reads any Settings state), which is the same
    "advertises a fake capability" problem as (2).

### Consequences

- If a future task gives `/book` a real request-submission flow, Rendez-
  vous can then gain a `publicBookingEnabled`/booking-horizon field with
  a real consumer, rather than a placeholder wired to nothing.
- If a future task adds tax handling to `Invoice`, Documents' "Tax
  display" can be reconsidered at that point.
- If the eventual Laravel `tenants` migration ever adds `legal_name`/
  split-address columns, `CabinetProfile` gains them then — this ADR
  documents why they are absent now, not a permanent prohibition.

### Date

2026-08-28

------------------------------------------------------------------------

## ADR-010 — UI-011ABC Subscription Lifecycle, Plans/Entitlements & Referral: two-tier plan catalog, deferred pricing, uniform entitlement booleans, and a page-scoped Blackout screen

### Status

Accepted

### Decision

Six related prototype-scoping decisions made while implementing the
Subscription/Plans/Referral module, recorded here per CLAUDE.md §1/§59:

1.  **Only two plans are modeled — `solo` and `cabinet` — never a third
    "Cabinet+ / Pro" tier.** Spec #2 §50 names it only as "if needed,"
    the sole mention anywhere, with zero concrete entitlement or pricing
    data to back it. Inventing numbers for a third tier to fill a
    comparison table would violate the task's own explicit "Do NOT
    invent... usage limits... entitlement matrices" constraint.
    `max_practitioners`/`max_staff` limits for the two real plans are not
    invented either: Cabinet's (3/5) reproduce Spec #9 Screen 47's own
    worked example verbatim; Solo's practitioner cap (1) is the plan's
    own defining characteristic, not a commercial number.
2.  **`PlanPrice.amount` is `undefined` on every row, for both plans and
    both billing periods.** Spec #2 §50's own words: "Actual MAD prices
    remain a commercial decision requiring market validation." The
    Plans page renders "À définir" rather than either inventing a figure
    or omitting the price row entirely — the row exists (matching the
    real schema shape, Spec #4 §28.2) but honestly carries no number.
3.  **Boolean entitlements (`inventory_enabled`/`hr_enabled`/
    `commission_enabled`) are `true` on both plans.** Stock/Pharmacie
    (UI-008), Équipe/HR (UI-007) and Commissions (UI-007CDEF) are already
    fully built and reachable from the sidebar for every tenant
    regardless of any subscription state — no existing screen in this
    prototype actually gates on plan. Presenting a plan-differentiated
    boolean here would contradict the rest of the application rather
    than describe it; only the two wireframe/definition-evidenced
    numeric limits (practitioners/staff) actually differ between Solo
    and Cabinet.
4.  **`storage_bytes` carries no `limitValue` on either plan.** Spec #9
    Screen 47's own wireframe shows "Stockage ..." with a literal
    ellipsis — no figure is given anywhere. `UsageRow`
    (`features/subscription/components/usage-row.tsx`) renders a neutral
    "Non défini dans ce prototype" placeholder instead of a 0%/invented
    bar, which would visually assert a limit that does not exist.
5.  **`SubscriptionHistoryEvent` excludes `subscription_payments`
    entirely** (Spec #4 §28.5) — that table stores real
    provider/amount/reference fields this prototype has no honest way to
    populate, since no payment ever actually occurs here (task's hard
    "NO real billing" constraint). History is bounded to the task's own
    explicit list — trial started/activated/renewed/plan changed — plus
    `referral_reward_applied`, the one cross-domain event Gate 3's own
    reconciliation requires.
6.  **The Blackout screen (Spec #9 Screen 49: "No operational sidebar")
    is a presentational state of `/app/abonnement` itself, not a global
    app-shell gate.** `SubscriptionPage` renders the full takeover layout
    (no `PageHeader`/`SubscriptionNav`/Usage/History) when its own
    `subscription.status === "blackout"`, but the *global* sidebar
    (`AppShell`/`NAV_ITEMS`) is untouched — wiring a site-wide
    subscription check into every route is exactly the "repository-wide
    enforcement" the task explicitly defers to "later
    integration/hardening" (task §31/§9: frontend entitlement UX is
    never authoritative; the future Laravel backend, not this
    prototype's navigation, is what must actually block operational
    routes during blackout, per WF-56's own "Backend must block APIs,
    not only frontend navigation").

### Context

None of the six carries security/data-integrity risk on its own — they
are all product-scope/invention-boundary calls, the same category as
UI-010ABC's "no invented confirmation rate" and UI-010BC's "no invented
tenant fields" (ADR-008 §context, ADR-009). All six shape what a reader
might mistake for a real commercial policy (a price, a limit, a payment
record, a global access gate) if left undocumented, so recording them
here matters more than usual for this particular module.

### Alternatives

1.  Invent plausible MAD prices / a third plan tier to make the
    comparison table feel commercially complete — rejected outright: the
    task's own hard constraint list names "plan names" and "prices"
    explicitly, and Spec #2 §50 explicitly defers pricing to a future
    "market validation" decision.
2.  Differentiate boolean entitlements between Solo and Cabinet (e.g.
    `hr_enabled: false` for Solo) to give the Feature-Lock UX (task §31)
    more to demonstrate — rejected: no other part of this prototype
    actually restricts Stock/HR/Commissions by plan, so doing it only
    here would be a contradiction, not a preview of real behavior. The
    practitioner-limit-exceeded scenario (Solo's real 1-practitioner cap
    against the real fixture's 2 active practitioners) already gives
    `EntitlementLimitNotice` a genuine, non-fabricated case to render.
3.  Suppress the global `AppShell` sidebar when the demo subscription is
    blackout — rejected: no subscription-state context exists anywhere
    else in the app to drive that (every other route renders
    independently), and building one purely to hide a sidebar during a
    single demo state would be exactly the "repository-wide
    refactor"/"retrofit every existing screen" scope creep the task
    explicitly warns against.

### Consequences

- If a future task adds real pricing, `PlanPrice.amount` gains real
  numbers at that point — the field/UI seam already exists and needs no
  shape change, just population.
- If a future task makes any existing module genuinely plan-gated (e.g.
  Commissions becomes Cabinet-only), `getPlanEntitlementsMockData` is the
  one place to flip that boolean — no scattered `if (plan === ...)`
  checks exist anywhere else to hunt down and update (Spec #5 §39).
- If a future task builds a real public-booking submission flow, Gate
  1's own Rendez-vous-style reasoning applies again: only add a setting
  once a real consumer exists for it.
- If backend subscription-blackout middleware ships, the frontend's own
  global route-blocking behavior is a new, separate task — this ADR's
  point 6 is the explicit record that `/app/abonnement`'s own
  presentation was never meant to substitute for it.

### Date

2026-08-28

------------------------------------------------------------------------

## ADR-011 — UI-011X Access Governance: the 16-key CLAUDE/spec permission catalog over the task's own deeper suggestion, Delegation as an explicit task-instructed extension with no spec backing, and a non-delegatable set

### Status

Accepted

### Decision

Four related prototype-scoping decisions made while implementing Access
Governance, Roles, Permissions & Delegation of Authority, recorded here
per CLAUDE.md §1/§59:

1.  **The permission catalog's core 16 keys are copied verbatim from two
    independently-confirming sources — Spec #4 §4.3
    `membership_permissions`'s own "Examples:" list and CLAUDE.md §9's
    identical list — rather than the deeper, more granular scheme the
    task's own §6 sketches** (e.g. `clinical.profile.view`/`clinical.
    history.view`/`clinical.consultation.manage` as three keys instead
    of one `clinical.view`/`clinical.edit` pair; `caisse.view`/`caisse.
    open`/`caisse.close`/`caisse.discrepancy.approve` instead of one
    `caisse.manage`). The task's own text explicitly authorizes this:
    "Do not blindly use this list. Inspect actual implemented
    capabilities and governing specifications first." Spec #9 Screen
    35's own worked example reinforces the coarser grain directly —
    "CAISSE [x] Accéder" is one checkbox, not four. Seven keys extend
    the base list for modules that postdate it (Communication,
    Subscription, Access Governance itself have no representation in
    Spec #4 §4.3/CLAUDE.md §9 at all) — each stays at the same coarse
    grain as its neighbors rather than inventing a deeper scheme just
    for the new modules.
2.  **Delegation of Authority (Gate 3) has zero backing in the approved
    specifications** — grep-confirmed across all 10 spec files, zero
    matches for "delegat" or any close synonym. It is implemented
    anyway because the task's own Gate 3 instructions are explicit
    (CLAUDE.md §1: explicit current task instructions outrank
    specifications), kept deliberately minimal per CLAUDE.md §3 ("do
    not invent a large new subsystem") — bounded to exactly what the
    task's own checklist enumerates (one permission per delegation, a
    4-state lifecycle, a workspace, create, revoke, constraint
    validation), reusing Gate 1's own `PermissionDefinition.delegatable`
    flag as the sole catalog-level gate rather than inventing
    additional business rules (approval workflows, escalation,
    notification systems). The closest approved-spec precedent is Spec
    #4 §7.3 `patient_access_grants` — a dormant, "future-ready"
    time-bounded clinical-access-sharing grant with the identical
    `starts_at`/`ends_at`/`status` shape `Delegation` generalizes to any
    delegatable permission.
3.  **`caisse.manage`, `subscription.manage`, and all three `access.*`
    permissions are `delegatable: false`.** `caisse.manage`: physical
    cash custody is tied to one accountable person (CLAUDE.md §26), and
    temporarily transferring caisse-closing authority creates a real
    physical-custody ambiguity beyond ordinary "cover for an absence"
    delegation. `subscription.manage`: Spec #3 WF-74's own explicit
    rule — "Staff should not be able to upgrade subscription unless
    authorized." The three `access.*` keys: delegating the ability to
    change permissions/roles/delegations is a direct privilege-
    escalation path (a delegate could grant themselves more, or extend
    their own delegation) — this is the one place a "temporary
    coverage" framing does not apply at all.
4.  **A single unified checkbox per permission in the "Gérer les accès"
    drawer (task §12), not separate "grant" and "restrict" controls.**
    Clicking a permission that is not currently effective adds an
    individual grant (or lifts an existing restriction, whichever is
    why it wasn't effective); clicking one that is currently effective
    either removes the individual grant responsible for it, or — if the
    membership's own role is the source — adds a restriction. This
    maintains a real invariant proven by `membership-access.test.ts`
    and `cross-governance-integrity.test.ts`: `individualRestrictions`
    only ever names a permission the membership's own role actually
    grants; `individualGrants` only ever names one the role does not.
    Two independent checkboxes per permission would let an operator
    create contradictory states (e.g. both granting and restricting the
    same key) with no enforced relationship between them.

### Context

None of the four carries security/data-integrity risk on its own — every
governance action here is presentational (task's own explicit "NO real
enforcement across existing modules" boundary) — but all four shape what
a reader might mistake for a settled product decision (the permission
vocabulary, whether delegation is a real approved feature, which
capabilities can ever be delegated) if left undocumented, so recording
them matters more than usual for a module whose entire purpose is
describing *who may do what*.

### Alternatives

1.  Implement the task's own deeper `domain.subarea.action` permission
    scheme literally — rejected: it would silently diverge from the one
    permission vocabulary two independent approved sources (CLAUDE.md
    §9, Spec #4 §4.3) already define identically, and Screen 35's own
    wireframe checkbox count would then no longer match the underlying
    model.
2.  Skip Delegation entirely and report the spec gap as a blocker
    (CLAUDE.md §63) — rejected: the gap is a genuine product-scope
    silence, not a security/data-integrity conflict, and the task's own
    Gate 3 instructions are explicit and detailed enough to implement
    responsibly within a bounded, minimal scope rather than warranting
    a stop.
3.  Make every permission delegatable, including `access.*` — rejected
    outright: this would let a temporary delegate grant themselves
    permanent broader access or indefinitely extend/recreate their own
    delegation, defeating the entire point of "temporary."
4.  Two independent grant/restrict checkboxes per permission — rejected:
    would allow operator-created contradictions with no single source
    of truth for "what does this checkbox state even mean," where the
    unified toggle's one real state transition per click cannot.

### Consequences

- If a future task needs finer-grained permissions within an existing
  coarse key (e.g. splitting `clinical.edit` into consultation-notes vs.
  prescriptions), it extends the catalog additively — no existing role/
  membership/delegation fixture needs to change shape, since they only
  ever reference keys by string.
- If backend Identity/Tenancy work (Spec #6 Phase 1) formalizes a real
  `patient_access_grants` implementation, `Delegation` can be
  reconciled with it directly — the shapes were deliberately kept
  close (ADR-011 §2) specifically to make that reconciliation
  straightforward rather than requiring a rewrite.
- If product later decides `caisse.manage` or any `access.*` permission
  should become delegatable after all, flipping one boolean in
  `permission-catalog.ts` is sufficient — no other file encodes this
  rule redundantly.

### Date

2026-08-28

---

## ADR-012 — UI-FIX Dead Buttons & Interactive Actions Audit: Quick Create's action list, and reusing the established future-feature Toast for shell chrome

### Status

Accepted

### Context

The global topbar's "+ Créer" button (`AppTopbar`) had no `onClick`/`href`
at all — a confirmed dead control. Spec #2 §4.3 and Spec #7 §5 both
describe a quick-create launcher, but their recommended action lists
differ slightly and neither is binding verbatim (the task's own explicit
instruction: "Do NOT blindly implement this exact list. Derive the list
from... already implemented create workflows"). Auditing the rest of the
completed frontend (`app-topbar.tsx`'s notification bell/user-account
button, `MobileNav`'s "Plus", and `SubscriptionPage`'s Blackout support/
logout buttons) surfaced four more controls that were either fully inert
or hard-disabled with no explanation.

### Decision

1.  **Quick Create exposes exactly 5 of the specs' 6 recommended
    actions — Rendez-vous, Patient, Mouvement de stock, Message,
    Décaissement — each a pure navigation `Link` into that action's own
    already-built creation workflow** (`/app/agenda`, `/app/patients`,
    `/app/stock/movements`, `/app/communication`, `/app/finance/
    expenses`). Never a duplicate `PatientForm`/`AppointmentForm`/etc.
2.  **"Nouvelle facture" is omitted.** No manual invoice-creation
    workflow exists anywhere in the completed frontend —
    `GlobalInvoicesPage`'s own doc comment states "no invoice
    creation... anywhere on this screen"; invoices only ever originate
    from an appointment/treatment/session (CLAUDE.md §21). Inventing one
    would be a new subsystem, not wiring an existing control.
3.  **"Nouvel encaissement" is omitted.** `PatientPaymentCaptureDialog`
    is hard-scoped to a specific patient's own `invoices`/
    `localPayments` state, reachable only from Patient 360° → Paiements
    — there is no safe, existing cabinet-wide patient-selection entry
    point to deep-link into (the task's own explicit fallback for this
    exact situation: "omit Payment from Quick Create").
4.  **No query-param/deep-link auto-open plumbing was added anywhere.**
    Zero precedent for `useSearchParams`-driven dialog auto-open exists
    in this codebase; the task's own text explicitly allows "navigate to
    **or** open" — plain navigation satisfies it without adding new
    cross-page state-passing machinery to five already-shipped, already-
    tested page components.
5.  **The notification bell, user-account button, mobile bottom-nav
    "Plus", and Blackout's "Contacter le support"/"Se déconnecter" now
    reuse the exact same established future-feature `Toast` convention**
    already used pervasively for PDF/print/receipt downloads (`t(...)`
    → "Disponible dans une prochaine étape."), rather than staying
    silently inert (bell/user-menu/Plus) or hard-`disabled` with no
    explanation (support/logout — which CLAUDE.md §11 explicitly
    requires to "remain accessible" during blackout). No Notification
    Center, User Menu, secondary-module sheet, support channel or auth
    system was built — only an honest, active acknowledgement.
6.  **`AppShell` now owns the Quick Create dialog's `open` state and the
    shared `Toast` message state**, passed down to `AppTopbar` and
    `MobileNav` as callback props — one shared instance of each, not one
    per surface, mirroring `Dialog`'s own "one focus-trap implementation"
    precedent. `QuickCreateDialog` reuses the existing `Dialog` primitive
    (`variant="modal"`) rather than a new floating-menu component.

### Alternatives considered

- **Auto-opening each target page's own create dialog via a query
  param** (e.g. `/app/patients?create=1`) — rejected: no existing
  precedent, requires new `useSearchParams` effects in five already-
  complete, already-tested page components, and the task's own text
  explicitly permits plain navigation as sufficient.
- **Repurposing `MobileNav`'s "Plus" button as the mobile Quick Create
  trigger** — rejected: "Plus" (`MoreHorizontal` icon, `nav.plus` =
  "Plus"/"More") is a documented, unrelated placeholder for a future
  secondary-module navigation sheet, not a create action; relabeling its
  behavior would misrepresent what the icon/text tells the user.
  Instead, the topbar's Créer button was made responsive (icon-only
  below `sm`, same as `AppSidebar`'s own icon-collapse pattern) so it
  remains reachable on every breakpoint, including mobile.
- **Building a real Notification Center / User Menu** — rejected as
  out of this audit's scope (task's own explicit "this is NOT a new
  product phase"); no data model or spec detail exists for either.

### Consequences

- If a future task builds a real manual invoice-creation flow or a
  cabinet-wide patient-selection step for payment capture, adding
  "Nouvelle facture"/"Nouvel encaissement" to `QUICK_CREATE_ACTIONS` in
  `quick-create-dialog.tsx` is a one-array-entry change, not a rewrite.
- If a future task builds the mobile secondary-module sheet, `MobileNav`
  already exposes the exact `onPlus` seam that sheet would replace the
  Toast call with.

### Date

2026-08-28

---

## ADR-013 — UI-AGENDA-X Dynamic Cabinet Calendar: a task-instructed 5-type exception model with zero spec backing, one-active-exception-per-date, override-not-union precedence, and skipping the optional Agenda banner

### Status

Accepted

### Context

`CabinetCalendarException` (date-specific overrides to
`CabinetWorkingHoursDay`'s own recurring weekly pattern) has **zero
backing in the approved specifications** — grep-confirmed across all 10
spec files: no "holiday"/"jour férié"/"fermeture exceptionnelle"/
"exception" availability concept exists anywhere. The closest real
precedent is Spec #4 §12.3's `availability_exceptions`
(`date`/`start_time NULL`/`end_time NULL`/`type ENUM(unavailable,
custom_available)`/`reason`) — but that row is **practitioner**-scoped,
not cabinet-scoped, and carries only 2 type values against this task's
own explicit 5-type list (`public_holiday`/`exceptional_closure`/
`rest_day`/`modified_hours`/`exceptional_opening`).

### Decision

1.  **Implemented per the task's own explicit instructions** (CLAUDE.md
    §1: task instructions outrank specifications), mirroring exactly the
    reasoning already applied to Delegation (ADR-011 §2) — grounded in
    the closest approved precedent's field shape
    (`date`/`start_time`/`end_time`/`type`/`reason`) even though this
    task's own 5-type registry is intentionally richer than that spec
    row's 2-value ENUM, since the task's own §5 names 5 distinct
    real-world cabinet scenarios explicitly.
2.  **No separate `allDay` field.** "Closed all day" is always exactly
    "`type` is one of the 3 closed types" (`public_holiday`/
    `exceptional_closure`/`rest_day`), derived via
    `CALENDAR_EXCEPTION_TYPE_MAP[type].isClosed` — never a second,
    independently-settable boolean that could contradict `type` or
    `intervals`. The 2 "open" types (`modified_hours`/
    `exceptional_opening`) always carry ≥1 interval; the 3 closed types
    always carry zero.
3.  **A date-specific exception always *replaces* the weekly schedule
    outright, never unions with it** (task §7: "the date exception
    wins"). `resolveEffectiveCabinetAvailability` is the single
    centralized pure resolver every consumer reads (the Add/Edit dialog's
    NORMAL/EXCEPTION preview, the conflict-detection check) — never
    reimplemented inline in a component.
4.  **At most one active exception per date** (task §10) —
    `hasActiveExceptionForDate` enforced by
    `validateCalendarExceptionForm`; editing an existing exception
    replaces it in place (same `id`), it is never possible to stack a
    second active exception on an already-covered date.
5.  **A date strictly before `MOCK_BUSINESS_DATE` is past, read-only
    history** (task §20's own "prefer not to casually delete historical
    past closures") — `MOCK_BUSINESS_DATE` itself remains editable (an
    admin can still record/adjust *today's* own exception same-day). Past
    exceptions render with no Modifier/Supprimer action anywhere.
6.  **Conflict detection (task §22-24) is real, never fabricated** —
    `findConflictingAppointments` filters Agenda's own actual
    `getAgendaMockAppointments()` fixtures by date and non-terminal
    status, checking each against the resolved effective intervals. It
    never mutates, cancels or reschedules a single appointment; creation/
    editing of an exception always remains possible regardless of any
    conflict found (task's own explicit "creation may remain possible").
7.  **The optional Agenda banner (task §26) was deliberately NOT
    implemented.** The task's own text is explicitly conditional: "If
    the specifications support it, Agenda may display a restrained
    banner." The specifications do not support it (same zero-backing
    finding as the core model itself) — the condition is false, so the
    banner is correctly out of scope here, not a gap. This also avoids
    adding new cross-module fixture-loading surface area to Agenda
    (UI-002), an already large, fully-tested, completed module, for a
    feature the task itself frames as optional.
8.  **`/app/parametres/horaires/exceptions` is a second, real,
    URL-addressable route** (not a same-route JS-only tab toggle) —
    matches every other nested-nav precedent in this codebase
    (`AccessGovernanceNav`, `SubscriptionNav`, `CommunicationNav`, all
    genuine `<nav>`+real-`<Link>` navigation, per `Tabs`'s own doc
    comment: "each tab is a genuine URL"). `HorairesNav` renders
    alongside `ParametresNav` on both Horaires routes — applying the
    UI-011X-FIX lesson directly: every nested Paramètres page must
    render **both** navigation levels, never one alone.

### Alternatives considered

- **A same-route, JS-only Habituelles/Exceptions toggle** (no second
  URL) — rejected: every other nested-nav surface in this app uses real
  URLs; a same-route toggle here would be the one inconsistent exception
  with no clear benefit.
- **Reusing Équipe's own `WorkInterval`/fixed 2-slot interval-editor
  pattern verbatim** — rejected: `WorkInterval` carries
  `id`/`teamMemberId`/`weekday`, none of which apply to a one-off
  cabinet date, and the task explicitly asks for free add/remove
  intervals, not a fixed interval1/interval2 pair. Only the pure
  validation helpers (`isValidWorkInterval`/`intervalsAreSequential`/
  `getWeekdayFromIso`) are reused — the domain types stay separate, per
  the task's own explicit instruction.
- **Implementing the Agenda banner anyway, since it's a small addition**
  — rejected per point 7 above; the task's own conditional wording
  already resolves this without guessing.

### Consequences

- If a future task formalizes a real Moroccan public-holiday calendar
  import, only `mock-calendar-exceptions-data.ts`'s own two
  `public_holiday` fixtures need replacing — the resolver/validation/UI
  layer is entirely calendar-source-agnostic.
- If a future task builds Public Booking (UI-012), it consumes
  `resolveEffectiveCabinetAvailability` directly as the cabinet-level
  layer of the documented future availability chain (`frontend/
  ARCHITECTURE.md`) — no rework of this task's own resolver is
  anticipated.
- If a future task decides the Agenda banner should ship after all, it
  can call the same `resolveEffectiveCabinetAvailability` this task
  already built against `selectedDate`, adding only presentation.

### Date

2026-08-28

## ADR-014 — Patient CIN & social coverage: an administrative data field, not the excluded AMO workflow

### Status

Accepted

### Context

A task-supplied wireframe asked for two additions to the existing
patient create/edit form (`PatientFormDialog`, UI-003B): a `CIN`
(national ID card number) field, and a "Couverture sociale" block
(covered yes/no + a régime picker: AMO-CNSS/AMO-CNOPS/AMO-TNS/
AMO-TADAMON/AMO-ACHAMIL/AMO-Étudiants/Autre). Grep across all 10
approved specification files confirms **zero backing** — no
"CIN"/"couverture sociale"/AMO concept exists anywhere in the specs.
CLAUDE.md §50 explicitly excludes "Insurance/AMO workflows" from V1
unless formally approved, which raises a real boundary question: does
storing a patient's declared AMO régime count as an "AMO workflow"?

### Decision

1.  **Implemented as a single administrative identifier field, not a
    workflow.** §50's exclusion targets claims submission,
    reimbursement calculation, eligibility verification and insurer
    billing integration — none of which this task adds. Recording
    which régime a patient has declared is the same category of fact
    as `city`/`address`/`emergencyContactName`, already present on
    `Patient` with zero workflow behind them. No claims, no
    reimbursement math, no insurer API — only a categorical field.
2.  **`cin` and `insuranceRegime` are optional, format-unvalidated
    strings/enum values** — mirrors `city`'s own precedent (a loosely
    formatted string with no validation) rather than inventing an
    unconfirmed Moroccan CIN regex (CLAUDE.md §3: do not invent
    requirements).
3.  **`insuranceRegime` is only meaningful, and only required, when
    `isSociallyCovered` is `true`.** Switching back to "Non" clears any
    already-picked régime in the submitted values, so a stale régime
    can never persist against an uncovered patient — mirrors this
    task's own explicit exception-type "closed types always carry zero
    intervals" discipline (ADR-013 §2): derive, never let two fields
    silently disagree.
4.  **No separate `allDay`-style redundancy** was introduced; the
    wireframe's own "Sexe" field (shown but not marked `← NEW`) was
    **not** added — it does not exist anywhere in the current codebase,
    and only fields explicitly marked new in the source wireframe were
    implemented, per this task's own annotation convention.
5.  Both fields follow the same "edit-form-only, never surfaced
    read-only elsewhere" precedent already established by
    `birthDate`/`email`/`city`/`address` — Patient 360°'s header and
    overview cards remain metric-focused and are unchanged.

### Alternatives considered

- **Treating any AMO-related field as categorically out of scope**
  — rejected: §50 excludes *workflows* (claims/reimbursement/insurer
  integration), not a single demographic data point; refusing to store
  what régime a patient belongs to would block a legitimate,
  bounded, task-instructed request without a textual basis in CLAUDE.md
  itself.
- **A rigid Moroccan CIN format validator** — rejected: no confirmed
  format exists in the specs, and inventing one risks rejecting real,
  valid CIN numbers this prototype has no authority to validate against
  (CLAUDE.md §3).
- **Adding the wireframe's "Sexe" field too, since it appears in the
  same block** — rejected: not marked `← NEW` in the source wireframe,
  unlike `CIN` and `COUVERTURE SOCIALE`; adding it would be scope
  invention rather than the requested addition.

### Consequences

- If a future task formalizes real AMO claims/reimbursement workflows,
  `insuranceRegime` is the natural field to key off of — no rework of
  this task's data shape is anticipated.
- If Moroccan CIN format validation is later confirmed, it plugs into
  the same optional `cin` field without a data-shape change.

### Date

2026-08-29

## ADR-015 — UI-LEAVE-X Cabinet Leave Agenda: a pure calendar projection over the existing LeaveRequest array, extended (never duplicated) fixtures, and a business-date-anchored dashboard

### Status

Accepted

### Context

The task requires a cabinet-wide Leave Agenda that is explicitly a
read-only *projection* of the existing `LeaveRequest[]`/`TeamMember[]`
sources (UI-007CDEF Gate 2/UI-007A) — "Do not create another
`LeaveRequest` model. Do not create another leave fixture universe." Five
genuine interpretive questions arose while implementing this.

### Decision

1.  **"No second fixture universe" means no second *model/array* — it
    does not forbid adding realistic rows to the EXISTING
    `getLeaveRequestsMockData()` array.** The pre-existing 4 fixtures
    (`lr-1`..`lr-4`) never produce two team members simultaneously on
    approved leave, and no fixture spans more than 2 days — insufficient
    to prove the task's own core multi-day-visible-on-every-date (§8) and
    overlap (§22-25) requirements with real data. `lr-5`/`lr-6` (Amal
    Idrissi, team-2, 2026-08-26 to 08-28; Hamza Rifai, team-5,
    2026-08-27) were added to the SAME array/model, chosen to overlap on
    2026-08-27 — proving a real 3-day span and a real 2-person, 1-
    practitioner simultaneous absence, never an invented count. `lr-1`
    through `lr-4` and `team-4`'s empty-state guarantee are byte-for-byte
    unchanged (proven by `mock-leave-data.test.ts`).
2.  **Practitioner-overlap (§24) derives from `TeamRole === "practitioner"`,
    not the narrower Agenda `practitionerId` link.** `practitionerId`
    only exists to connect a TeamMember to Agenda's *schedulable*
    identity for commission eligibility (UI-007CDEF Gate 4) — an
    inactive practitioner, or one not yet linked (Othmane Zouiten), is
    still a practitioner for absence-visibility purposes. Using the
    narrower link here would silently under-count.
3.  **The Status filter's default is a resolvable 5th value,
    `"operational"` (Approuvé + En attente), not `"all"` narrowed
    client-side.** `resolveStatusFilterValues` is the single place this
    mapping lives; every consumer (Month/Week/List, dashboard metrics
    excepted — see point 4) reads through it, so the restrained default
    the task's own §16 asks for can never drift between views.
4.  **Dashboard metrics (§30) are always whole-cabinet and anchored to
    the real business date, never scoped to whichever period the header
    nav has currently browsed to.** This mirrors every other "today"/
    "this month" metric widget already in this product (Aujourd'hui,
    Finance dashboard) — a manager browsing forward to check December
    should not see the "En congé aujourd'hui" metric change.
5.  **Cabinet closure context (§26, the task's own explicitly optional
    integration) was implemented**, reusing
    `resolveEffectiveCabinetAvailability` outright via a new
    `getCabinetClosureForDate` — never reimplemented, never converting a
    closure into a per-employee `LeaveRequest`. It is gated to
    `source === "calendar_exception"` only, so an ordinary non-working
    weekday (the recurring weekly schedule) never renders a "Cabinet
    fermé" badge — only a genuine one-off exception does. Adjacent-month
    overflow cells in Month view never render event/closure content at
    all (only the dimmed day number) — the standard month-calendar
    convention, and the fix for a real ambiguity a leading-week
    `public_holiday` fixture (`cal-exc-1`, 2026-07-30, inside August's
    own leading grid days) would otherwise have caused.
6.  **Navigation shares one "period" position across all three views**,
    exactly mirroring `AgendaHeader`'s own day/week step-size-by-mode
    precedent: Month/List navigate by whole calendar month
    (`shiftMonthIso`), Week navigates by 7 days (`addDaysIso`) — the
    wireframe shows one shared nav row with no per-view position, and
    this is the only reading consistent with that.

### Alternatives considered

- **Treating the task's "no fixture universe" instruction as forbidding
  any new fixture row at all** — rejected: it would leave the task's own
  core multi-day/overlap requirements unprovable with real data, and the
  instruction's own wording targets a second *model*, not additional
  rows in the one that already exists (the same reading already applied
  throughout this session, e.g. UI-AGENDA-X's calendar-exception
  fixtures).
- **Deriving practitioner-overlap from `practitionerId`** — rejected: it
  would silently exclude a real practitioner (Othmane Zouiten) from
  "praticiens absents" purely because of an unrelated commission-linkage
  gap, contradicting §24's own plain "practitioner-linked" framing.
- **Skipping the optional cabinet-closure integration** (§26) — rejected,
  unlike ADR-013 §7's skip of the optional Agenda banner: here the
  reused resolver already exists, the integration is small, and it
  directly prevents a real point of confusion (an approved-leave-free day
  that is nonetheless a cabinet-wide closure).

### Consequences

- If a future task adds a fourth or fifth simultaneously-absent fixture,
  `getApprovedTeamMembersAway`/`countApprovedPractitionersAway` need no
  change — both are already count-agnostic.
- If Public Booking (UI-012) or a future staffing feature needs "who is
  away on date X," it can call `getApprovedTeamMembersAway` directly —
  no rework of this task's resolver is anticipated.

### Date

2026-08-29
