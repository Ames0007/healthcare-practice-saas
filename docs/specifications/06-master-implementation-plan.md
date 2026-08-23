# Healthcare Practice Management SaaS

## Specification 06 --- Claude Code Master Implementation Plan

**Purpose:** Convert Specifications #1--#5 into a controlled,
dependency-ordered implementation program for Claude Code.

**Execution model:** One bounded task at a time: inspect → implement →
test → validate → report → commit.

------------------------------------------------------------------------

# 1. Governing implementation principles

Claude Code must treat Specifications #1--#5 as the product and
architecture source of truth.

Implementation must be:

-   Modular-monolith.
-   Multi-tenant.
-   Tenant-isolated server-side.
-   Practitioner-governed for clinical patient data.
-   FR/AR-ready from the beginning.
-   Financially auditable.
-   Transaction-safe.
-   Test-driven at critical boundaries.
-   Responsive web.
-   API-driven.
-   Designed for solo practitioners first and small cabinets second.

Claude Code must never invent material product behavior where the
specifications are silent. Ambiguities must be recorded as
decisions/blockers.

------------------------------------------------------------------------

# 2. Mandatory execution protocol

For every task:

1.  Read the task and referenced specifications.
2.  Inspect the current repository before changing anything.
3.  Identify existing code that must be reused.
4.  Confirm dependencies from prior tasks exist.
5.  Implement only the defined scope.
6.  Add/update migrations where required.
7.  Add domain/application/API/UI tests required by the task.
8.  Run relevant test suites.
9.  Run static analysis/lint/build checks.
10. Inspect the final diff.
11. Verify no unrelated functionality changed.
12. Update implementation status.
13. Record architectural decisions/deviations.
14. Commit with task ID.
15. Produce a completion report.

Never mark a task complete if required validation cannot be executed.
Report it as implemented-but-unverified or blocked.

------------------------------------------------------------------------

# 3. Non-negotiable engineering guardrails

## Never

-   Trust `tenant_id` supplied by the browser.
-   Query tenant-owned resources without tenant context.
-   Use frontend visibility as authorization.
-   Automatically share practitioner clinical data.
-   Use floating point for money.
-   Hard-delete posted payments, issued invoices, cash movements or
    audit events.
-   Mix patient payments with SaaS subscription payments.
-   Directly overwrite stock balance without a movement.
-   Directly overwrite caisse balance without movements.
-   Hardcode French UI text inside feature components.
-   Hardcode plan names to control features.
-   Store patient documents on publicly accessible URLs.
-   Store provider secrets in source control.
-   Call WhatsApp/SMS synchronously inside critical business
    transactions.
-   Implement future-scope functionality simply because architecture
    supports it.
-   Change established architecture without recording the decision.
-   Duplicate business rules across controllers/components.
-   Skip tests for financial, tenancy, permission or governance
    behavior.

## Always

-   Scope tenant data server-side.
-   Validate resource ownership.
-   Use transactions for financial posting.
-   Use explicit state-transition application services.
-   Add audit events for sensitive operations.
-   Use outbox/queues for external side effects.
-   Use idempotency for sensitive retryable operations.
-   Keep domain logic outside controllers.
-   Maintain FR/AR and RTL compatibility.
-   Preserve historical authorship.
-   Use private object storage.
-   Keep SaaS billing isolated from cabinet billing.
-   Inspect and reuse existing code before creating abstractions.

------------------------------------------------------------------------

# 4. Project documentation structure

Recommended repository structure:

``` text
docs/
  specifications/
    01-product-blueprint.md
    02-information-architecture.md
    03-business-workflows.md
    04-domain-data-architecture.md
    05-technical-api-security.md
    06-master-implementation-plan.md

  implementation/
    IMPLEMENTATION_STATUS.md
    DECISIONS.md
    RISKS_AND_BLOCKERS.md
    CHANGELOG.md

  tasks/
    TASK-001.md
    TASK-002.md
    ...

CLAUDE.md
```

------------------------------------------------------------------------

# 5. Implementation status format

``` text
TASK-001 | COMPLETE | <commit> | <date>
TASK-002 | COMPLETE | <commit> | <date>
TASK-003 | IN_PROGRESS
TASK-004 | BLOCKED | reason
TASK-005 | NOT_STARTED
```

A task cannot be COMPLETE without acceptance-criteria evidence.

------------------------------------------------------------------------

# 6. Phase structure

``` text
PHASE 0  Engineering Foundation
PHASE 1  Identity, Tenancy & Security
PHASE 2  SaaS Subscription Foundation
PHASE 3  Cabinet Setup & Master Data
PHASE 4  Patients & Governance
PHASE 5  Services, Availability & Scheduling
PHASE 6  Public Booking & Waiting Room
PHASE 7  Clinical / Dossier Santé
PHASE 8  Treatments & Sessions
PHASE 9  Billing, Installments & Payments
PHASE 10 Caisse & Operational Finance
PHASE 11 Team, HR & Commissions
PHASE 12 Inventory
PHASE 13 Communication & Integrations
PHASE 14 Dashboards & Reporting
PHASE 15 Referral & SaaS Administration
PHASE 16 FR/AR, UX & Responsive Hardening
PHASE 17 Security, Performance & Reliability
PHASE 18 Pilot & Production Launch
```

------------------------------------------------------------------------

# 7. PHASE 0 --- Engineering Foundation

## TASK-001 --- Repository bootstrap

Implement:

-   Repository structure.
-   README.
-   docs directories.
-   environment example.
-   Git ignore rules.
-   formatting conventions.
-   initial status/decision files.

Acceptance:

-   Clean clone can be initialized from documented steps.
-   No secrets committed.

## TASK-002 --- Backend bootstrap

Implement chosen backend framework skeleton.

Required:

-   `/api/v1`.
-   module directory convention.
-   health endpoint.
-   environment configuration.
-   error-handling foundation.

Do not implement business modules.

## TASK-003 --- Frontend bootstrap

Implement:

-   Next.js + TypeScript.
-   application route groups.
-   base layout.
-   authenticated/public shells.
-   design tokens foundation.

## TASK-004 --- Local development environment

Implement reproducible local environment for:

-   Frontend.
-   Backend.
-   PostgreSQL.
-   Redis.
-   S3-compatible local object storage.
-   Worker.

## TASK-005 --- PostgreSQL foundation

Implement:

-   Connection.
-   migration infrastructure.
-   UUID strategy.
-   timezone conventions.
-   base DB test infrastructure.

## TASK-006 --- Redis and queue foundation

Implement:

-   Redis.
-   queue connection.
-   worker.
-   retry/dead-letter conventions.

## TASK-007 --- Testing foundation

Implement:

-   Unit testing.
-   application/integration testing.
-   API testing.
-   frontend testing.
-   E2E test harness.

## TASK-008 --- Static analysis and linting

Implement backend/frontend:

-   Lint.
-   formatter.
-   type/static analysis.
-   build validation.

## TASK-009 --- CI pipeline

On every PR:

-   install.
-   lint.
-   static analysis.
-   tests.
-   migration test.
-   frontend build.
-   backend validation.

## TASK-010 --- FR/AR localization foundation

Implement:

-   translation architecture.
-   FR.
-   AR.
-   RTL switch.
-   persistent user preference.

No feature should subsequently hardcode user-facing strings.

## TASK-011 --- Application error contract

Implement standardized API errors:

``` text
code
message
details
request_id
```

Safe production errors only.

## TASK-012 --- Request/correlation IDs

Propagate through:

-   API.
-   logs.
-   queue jobs.
-   outbox processing.

------------------------------------------------------------------------

# 8. PHASE 1 --- Identity, Tenancy & Security

## TASK-013 --- User model

Implement user identity persistence and lifecycle statuses.

## TASK-014 --- Authentication

Implement:

-   login.
-   logout.
-   secure session/cookie architecture.
-   password hashing.
-   session rotation.

## TASK-015 --- Password reset

Secure expiring reset workflow with enumeration-safe responses.

## TASK-016 --- Login security

Implement:

-   throttling.
-   temporary protection.
-   security events/logging.

## TASK-017 --- Tenant model

Implement tenant entity, slug, language, currency, timezone and status.

## TASK-018 --- Tenant membership

Implement membership:

-   owner_admin.
-   practitioner.
-   staff.

## TASK-019 --- TenantContext

Central backend mechanism resolving tenant from authenticated
membership/session.

Client cannot set trusted tenant identity.

## TASK-020 --- Tenant-scoped persistence

Implement repository/query conventions that automatically require
TenantContext.

## TASK-021 --- Cross-tenant security test suite

Prove Tenant A cannot access Tenant B:

-   patient.
-   appointment.
-   invoice placeholder resources/test fixtures.
-   files when available.

This suite becomes permanent regression protection.

## TASK-022 --- Lightweight permission engine

Implement permission codes and Owner/Admin bypass rules.

## TASK-023 --- Authorization middleware/policies

Centralize:

-   authentication.
-   membership.
-   permission.
-   tenant ownership.

## TASK-024 --- Practitioner profile

Implement practitioner linked to membership.

Owner may also be practitioner.

## TASK-025 --- Audit infrastructure

Implement append-oriented audit event service.

## TASK-026 --- Transactional outbox

Implement:

-   outbox table.
-   dispatcher.
-   retry.
-   idempotent processing.
-   failed-event visibility.

------------------------------------------------------------------------

# 9. PHASE 2 --- SaaS Subscription Foundation

## TASK-027 --- Subscription plan model

Implement:

-   plans.
-   plan prices.
-   billing period.
-   active versions.

Actual final prices remain configuration.

## TASK-028 --- Entitlement model

Implement plan entitlements and limits.

## TASK-029 --- Entitlement service

Central API:

``` text
can(feature)
limit(feature)
usage(feature)
```

No feature checks based on hardcoded plan names.

## TASK-030 --- Subscription entity/state machine

Implement:

-   TRIALING.
-   ACTIVE.
-   EXPIRED.
-   GRACE.
-   BLACKOUT.
-   CANCELLED.

## TASK-031 --- Trial lifecycle

Create trial on onboarding and store expiration.

## TASK-032 --- Subscription access middleware

Operational API rules:

-   trialing allow.
-   active allow.
-   grace allow with warning.
-   blackout deny.

## TASK-033 --- Blackout UX

Allow only:

-   subscription.
-   renewal.
-   support.
-   logout.

## TASK-034 --- Subscription reminder scheduler

Implement pre-expiration and grace reminders according to configured
policy.

## TASK-035 --- Subscription payment provider interface

Provider-neutral abstraction.

Do not select implementation-specific assumptions until provider is
chosen.

## TASK-036 --- Subscription webhook foundation

Implement signature/idempotency architecture and test doubles.

------------------------------------------------------------------------

# 10. PHASE 3 --- Cabinet Setup & Master Data

## TASK-037 --- Cabinet onboarding flow

Implement owner onboarding:

-   identity.
-   cabinet.
-   specialty.
-   city/contact.
-   language.

## TASK-038 --- Practice settings

Implement logo, contact, address, timezone and preferences.

## TASK-039 --- Global master-data categories

Implement categories and platform-owned records.

## TASK-040 --- Global master-data items

FR/AR labels, keywords, specialty tags.

## TASK-041 --- Tenant master-data customization

Adopt global item, customize local configuration, create custom tenant
item.

## TASK-042 --- Master-data search

Search:

-   FR labels.
-   AR labels.
-   keywords.
-   specialty.

## TASK-043 --- Services and pricing

Implement tenant services:

-   name.
-   duration.
-   MAD price.
-   active.
-   appointment mode.

## TASK-044 --- Practitioner services

Configure which practitioner performs which services.

## TASK-045 --- Working hours

Practice/practitioner working schedule.

## TASK-046 --- Breaks and availability exceptions

Implement breaks, days off and exceptional availability.

## TASK-047 --- Numbering sequences

Concurrency-safe:

-   Patient.
-   Invoice.
-   Receipt.
-   Treatment.

## TASK-048 --- Document template foundation

Template/version architecture for later invoices, receipts and clinical
documents.

------------------------------------------------------------------------

# 11. PHASE 4 --- Patients & Governance

## TASK-049 --- Patient aggregate

Implement core patient entity and tenant ownership.

## TASK-050 --- Patient numbering

Generate unique tenant-local patient number.

## TASK-051 --- Responsible practitioner relationship

Every patient receives one responsible practitioner.

## TASK-052 --- Patient CRUD --- administrative

Implement create/view/edit/archive according to permissions.

No generic hard delete.

## TASK-053 --- Patient duplicate detection

Normalize and compare:

-   phone.
-   names.
-   date of birth.

Warn; never auto-merge.

## TASK-054 --- Patient search/list

Search and filters from Spec #2.

## TASK-055 --- Patient 360° shell

Implement tabs:

-   Aperçu.
-   Dossier Santé.
-   RDV.
-   Traitements.
-   Factures.
-   Paiements.

Initially tabs may contain placeholders until modules arrive.

## TASK-056 --- Practitioner governance enforcement

Practitioner can access governed patient according to policy.

Add negative security tests.

## TASK-057 --- Reception administrative access

Reception can manage administrative identity without clinical
permission.

## TASK-058 --- Responsible practitioner change

Controlled action with audit and governance history.

------------------------------------------------------------------------

# 12. PHASE 5 --- Services, Availability & Scheduling

## TASK-059 --- Appointment aggregate

Implement appointment model and state machine.

## TASK-060 --- Exact-time appointments

Create/edit exact-time RDV.

## TASK-061 --- Time-window appointments

Create/edit arrival-window RDV with start/end validation.

## TASK-062 --- Appointment conflict engine

Prevent invalid practitioner overlaps according to V1 rules.

## TASK-063 --- Appointment status history

Persist every state transition.

## TASK-064 --- Confirm appointment

Explicit transition and audit/outbox event.

## TASK-065 --- Reschedule appointment

Preserve old schedule; recalculate reminders.

## TASK-066 --- Cancel appointment

Separate patient/practice cancellation.

## TASK-067 --- No-show

Implement terminal no-show behavior.

## TASK-068 --- Arrival

Record actual arrival timestamp.

## TASK-069 --- Waiting

Record waiting timestamp and duration.

## TASK-070 --- Start consultation

Transition and practitioner authorization.

## TASK-071 --- Complete appointment

Complete without assuming payment.

## TASK-072 --- Agenda day view

Responsive operational calendar.

## TASK-073 --- Agenda week view

Practitioner filtering.

## TASK-074 --- Appointment list

Search/filter administrative list.

## TASK-075 --- Today's Operations appointment widget

Use appointment source of truth; no duplicate dashboard data.

------------------------------------------------------------------------

# 13. PHASE 6 --- Public Booking & Waiting Room

## TASK-076 --- Public practice profile endpoint

Expose safe booking-page information only.

## TASK-077 --- Public availability endpoint

Expose availability, never patient information.

## TASK-078 --- Public booking request entity

Separate from appointment/patient.

## TASK-079 --- Public booking form

Fields agreed in specification.

## TASK-080 --- Public booking anti-abuse

Rate limit, validation, spam/bot protection architecture.

## TASK-081 --- Booking request inbox

Reception/Admin operational queue.

## TASK-082 --- Existing-patient matching

Match request to probable patient without exposing identity publicly.

## TASK-083 --- Confirm booking request

Create/link patient and appointment.

## TASK-084 --- Alternative slot workflow

Implement alternative proposal state.

## TASK-085 --- Reject booking request

Controlled rejection.

## TASK-086 --- Public booking QR

Generate/download QR for canonical booking URL.

## TASK-087 --- Booking slug management

Unique slug + safe redirect policy.

## TASK-088 --- Waiting-room board

Expected / Arrived / Waiting / In Consultation / Completed.

------------------------------------------------------------------------

# 14. PHASE 7 --- Clinical / Dossier Santé

## TASK-089 --- Clinical encounter aggregate

Implement practitioner-owned encounter.

## TASK-090 --- Clinical entry model

Structured typed entries.

## TASK-091 --- Persistent health flags

Allergies/conditions/current treatments master-data-backed structure.

## TASK-092 --- Clinical form definitions

Platform/tenant specialty form architecture.

## TASK-093 --- Clinical form fields

Typed field definitions with FR/AR labels.

## TASK-094 --- Clinical form instances/values

Store patient encounter responses.

## TASK-095 --- Dossier Santé UI

Unified health-record experience.

## TASK-096 --- Clinical permissions

Reception denied by default; practitioner governance enforced.

## TASK-097 --- File metadata/storage adapter

Private object-storage abstraction.

## TASK-098 --- Secure file upload

Validate type, size, quota and authorization.

## TASK-099 --- Patient documents

Upload/view metadata inside Dossier Santé.

## TASK-100 --- Secure file download

Short-lived signed URL or secure streaming after authorization.

## TASK-101 --- Clinical amendment audit

Track sensitive modifications.

## TASK-102 --- Prescription template

Generate practitioner/patient-based prescription.

## TASK-103 --- Certificate/report generation

Reusable generated-document engine.

------------------------------------------------------------------------

# 15. PHASE 8 --- Treatments & Sessions

## TASK-104 --- Treatment plan aggregate

Implement lifecycle.

## TASK-105 --- Treatment numbering

Unique tenant treatment reference.

## TASK-106 --- Treatment creation UI/API

Create from patient.

## TASK-107 --- Treatment sessions

Sequence and session statuses.

## TASK-108 --- Session scheduling

Link treatment session to appointment.

## TASK-109 --- Session completion

Link:

-   appointment.
-   encounter.
-   session.
-   treatment progress.

Prevent double completion.

## TASK-110 --- Kiné multi-session UI

Show:

-   planned.
-   completed.
-   remaining.
-   scheduled.

## TASK-111 --- Treatment financial references

Allow treatment to reference invoices without coupling statuses.

## TASK-112 --- Treatment completion

Complete independently from payment status.

------------------------------------------------------------------------

# 16. PHASE 9 --- Billing, Installments & Payments

## TASK-113 --- Invoice aggregate

Implement invoice and state machine.

## TASK-114 --- Invoice lines

Services, quantity, price, discounts/tax-ready structure.

## TASK-115 --- Invoice totals engine

Decimal-safe calculations and tests.

## TASK-116 --- Invoice from appointment

Prepopulate patient/practitioner/service/reference.

## TASK-117 --- Manual authorized invoice

Permissioned manual creation.

## TASK-118 --- Invoice issuance

Concurrency-safe numbering and immutable issue event.

## TASK-119 --- Invoice document generation

FR/AR-ready printable/downloadable invoice.

## TASK-120 --- Installment aggregate

Implement sequence, due date, expected/paid/remaining.

## TASK-121 --- Installment schedule creation

Validate against invoice outstanding.

## TASK-122 --- Installment status scheduler

Upcoming -\> Due -\> Overdue.

## TASK-123 --- Payment aggregate

Separate from SaaS subscription payment.

## TASK-124 --- Payment allocation

Invoice/installment allocation structure.

## TASK-125 --- Full cash payment

Atomic posting.

## TASK-126 --- Partial cash payment

Correct remaining balance.

## TASK-127 --- Installment payment

Update installment + invoice.

## TASK-128 --- Payment idempotency

Prevent double posting.

## TASK-129 --- Receipt aggregate/numbering

Unique receipt.

## TASK-130 --- Receipt generation

Download/print.

## TASK-131 --- Payment reversal

Append/reversal model; no deletion.

## TASK-132 --- Patient invoice/payment tabs

Use same underlying global financial records.

------------------------------------------------------------------------

# 17. PHASE 10 --- Caisse & Operational Finance

## TASK-133 --- Cash register session

Open/close lifecycle.

## TASK-134 --- Open caisse

Opening balance and actor.

## TASK-135 --- Cash movement ledger

IN/OUT/adjustment.

## TASK-136 --- Payment-to-caisse integration

Cash payment creates exactly one linked IN.

## TASK-137 --- Expense aggregate

Operational decaissement.

## TASK-138 --- Cash expense

Expense + linked OUT atomically.

## TASK-139 --- Non-cash expense

No caisse movement.

## TASK-140 --- Close caisse

Expected vs physical.

## TASK-141 --- Caisse discrepancy

Mandatory reason.

## TASK-142 --- Caisse correction

Adjustment/reversal; preserve history.

## TASK-143 --- Finance overview

Invoiced, collected, outstanding, overdue, expenses.

## TASK-144 --- Operational balance

Collections - operational expenses, clearly not accounting profit.

## TASK-145 --- Financial reconciliation tests/jobs

Invoice/payment/caisse integrity.

------------------------------------------------------------------------

# 18. PHASE 11 --- Team, HR & Commissions

## TASK-146 --- Employee aggregate

HR profile linked optionally to membership.

## TASK-147 --- Add staff/practitioner

Invitation and profile setup.

## TASK-148 --- Employee documents

Private file handling.

## TASK-149 --- Team schedule/shifts

No clock-in/out.

## TASK-150 --- Leave aggregate

Draft/submitted/approved/rejected/cancelled.

## TASK-151 --- Leave request UI

Employee workflow.

## TASK-152 --- Leave approval

Owner workflow + availability impact.

## TASK-153 --- Payroll period

Monthly operational payroll.

## TASK-154 --- Payroll entry

Base, bonus, overtime, commission, deduction, net operational amount.

## TASK-155 --- Commission rules

Collected/invoiced/fixed per service.

## TASK-156 --- Collection-based commission

Generate from eligible payment allocation.

## TASK-157 --- Invoice-based commission

Generate from eligible invoice line.

## TASK-158 --- Commission uniqueness

Prevent double earning.

## TASK-159 --- Commission adjustment

Manual reason + audit.

## TASK-160 --- Commission/payroll integration

Include earnings in payroll period.

------------------------------------------------------------------------

# 19. PHASE 12 --- Inventory

## TASK-161 --- Stock item aggregate

Master/custom item.

## TASK-162 --- Stock lot

Lot and expiration.

## TASK-163 --- Stock movement ledger

IN / OUT / adjustment.

## TASK-164 --- Stock IN

Update/reconcile balance.

## TASK-165 --- Stock OUT

Validate negative-stock policy.

## TASK-166 --- Stock adjustment

Movement-based correction.

## TASK-167 --- Low-stock alerts

Threshold-based.

## TASK-168 --- Expiration alerts

Configurable warning horizon.

## TASK-169 --- Inventory search

FR/AR keywords.

## TASK-170 --- Inventory reconciliation

Movement source-of-truth validation.

No procurement/purchase-order workflow.

------------------------------------------------------------------------

# 20. PHASE 13 --- Communication & Integrations

## TASK-171 --- Communication template aggregate

Platform + tenant templates.

## TASK-172 --- Template variables

Safe supported-variable engine.

## TASK-173 --- Communication message aggregate

Queued/sent/delivered/failed.

## TASK-174 --- Communication provider interfaces

WhatsApp + SMS abstraction.

## TASK-175 --- Test/fake communication provider

Development/staging safe adapter.

## TASK-176 --- Appointment confirmation automation

Outbox -\> communication.

## TASK-177 --- Appointment reminder automation

Scheduled and cancellation-safe.

## TASK-178 --- Appointment change/cancel communication

## TASK-179 --- Payment confirmation communication

## TASK-180 --- Installment reminder automation

## TASK-181 --- Overdue reminder automation

Anti-spam cadence.

## TASK-182 --- Provider webhook handler

Signature/idempotency.

## TASK-183 --- Communication history UI

## TASK-184 --- Google OAuth connection

## TASK-185 --- App-to-Google Calendar sync

One-way V1 recommended.

## TASK-186 --- Calendar failure/retry

Internal agenda remains authoritative.

------------------------------------------------------------------------

# 21. PHASE 14 --- Dashboards & Reporting

## TASK-187 --- Today's financial widget

Collections, outstanding, caisse.

## TASK-188 --- Appointment KPI service

## TASK-189 --- Financial KPI service

## TASK-190 --- Patient KPI service

## TASK-191 --- Practitioner KPI service

## TASK-192 --- HR KPI service

## TASK-193 --- Inventory KPI service

## TASK-194 --- Reports UI

Date/practitioner/service filters.

## TASK-195 --- Report semantics tests

Ensure collected != invoiced and operational balance != accounting
profit.

------------------------------------------------------------------------

# 22. PHASE 15 --- Referral & SaaS Administration

## TASK-196 --- Referral code

Unique tenant referral code/link.

## TASK-197 --- Referral attribution

Persist registration attribution.

## TASK-198 --- Referral qualification

Only after first successful paid subscription + validation period.

## TASK-199 --- Referral anti-abuse

New customer, one reward, self-referral checks.

## TASK-200 --- Referral reward

Apply +1 free month idempotently.

## TASK-201 --- Referral customer UI

Status/history/reward.

## TASK-202 --- SaaS Admin authentication/authorization

Separate platform-admin security.

## TASK-203 --- SaaS Admin dashboard

Tenants/subscriptions/trials/status.

## TASK-204 --- SaaS tenant management

Controlled operational actions.

## TASK-205 --- SaaS subscription management

Manual adjustments audited.

## TASK-206 --- SaaS master-data administration

## TASK-207 --- SaaS referral review

Approve/reject/void with reason.

------------------------------------------------------------------------

# 23. PHASE 16 --- FR/AR, UX & Responsive Hardening

## TASK-208 --- Translation completeness audit

No missing keys/hardcoded strings.

## TASK-209 --- Arabic RTL audit

All major screens.

## TASK-210 --- Generated document language

Invoice/receipt/clinical documents.

## TASK-211 --- Responsive Aujourd'hui

## TASK-212 --- Responsive Agenda

## TASK-213 --- Responsive Patient 360°

## TASK-214 --- Responsive clinical workflow

## TASK-215 --- Responsive public booking

## TASK-216 --- Empty states

Patients, agenda, team, inventory, communication.

## TASK-217 --- Error-state UX

Permissions, blackout, conflict, payment, storage, provider failures.

## TASK-218 --- Accessibility pass

Keyboard/focus/labels/contrast/RTL.

------------------------------------------------------------------------

# 24. PHASE 17 --- Security, Performance & Reliability

## TASK-219 --- Cross-tenant full regression suite

Every tenant-owned major entity.

## TASK-220 --- Practitioner-governance regression suite

## TASK-221 --- IDOR test suite

## TASK-222 --- Public booking security tests

## TASK-223 --- File-access security tests

## TASK-224 --- Financial concurrency tests

Payment/invoice/caisse.

## TASK-225 --- Numbering concurrency tests

Invoice/receipt.

## TASK-226 --- Stock concurrency tests

## TASK-227 --- Subscription blackout API tests

## TASK-228 --- Webhook security tests

## TASK-229 --- Logging/PII audit

## TASK-230 --- Dependency/security scan

## TASK-231 --- Query/index performance audit

## TASK-232 --- Queue failure/retry audit

## TASK-233 --- Reconciliation jobs

## TASK-234 --- Backup procedure

## TASK-235 --- Restore test

## TASK-236 --- Production observability

Metrics, errors, alerts, health checks.

------------------------------------------------------------------------

# 25. PHASE 18 --- Pilot & Production Launch

## TASK-237 --- Production infrastructure

Provision secure production environment.

## TASK-238 --- Staging production-parity review

## TASK-239 --- Production configuration/secrets

## TASK-240 --- Data migration/import utility --- minimum viable

At least safe patient import if pilot practices require it.

## TASK-241 --- Pilot tenant setup

Create first real pilot practice.

## TASK-242 --- Pilot acceptance script

Test complete golden paths.

## TASK-243 --- Solo practitioner pilot

## TASK-244 --- Reception + practitioner pilot

## TASK-245 --- Kiné/session pilot

If available.

## TASK-246 --- Pilot issue triage

Classify blocker/high/medium/low.

## TASK-247 --- Pilot blocker fixes

## TASK-248 --- Legal/privacy launch review

Morocco-specific.

## TASK-249 --- Security launch review

## TASK-250 --- Backup/restore launch gate

## TASK-251 --- Monitoring launch gate

## TASK-252 --- Subscription/referral commercial configuration

## TASK-253 --- Production smoke tests

## TASK-254 --- Commercial launch

## TASK-255 --- Post-launch incident/feedback process

------------------------------------------------------------------------

# 26. Explicitly deferred features

Claude Code must not implement these during V1 unless scope is formally
changed:

-   Room scheduling.
-   Equipment scheduling.
-   Capacity-based multi-patient slots.
-   Patient mobile app.
-   Full patient portal.
-   Patient online payments.
-   Procurement/purchasing.
-   Full accounting.
-   Clock-in/out.
-   Advanced statutory payroll.
-   Insurance/AMO workflows.
-   Odontogram.
-   Advanced specialty modules.
-   AI.
-   Custom tenant domains/subdomains.
-   Advanced BI/data warehouse.
-   Medical-device integration.

------------------------------------------------------------------------

# 27. Task dependency rules

Examples:

``` text
Patients requires:
Identity + Tenancy + Permissions + Master Data

Appointments requires:
Patients + Practitioners + Services + Availability

Clinical requires:
Patients + Practitioner Governance + Files

Treatments requires:
Patients + Clinical + Services

Invoices requires:
Patients + Services + Numbering

Payments requires:
Invoices + Caisse foundation

Commissions requires:
Practitioners + Invoice/Payment sources

Communication requires:
Outbox + Appointments/Payments

Referral requires:
Subscription lifecycle
```

Claude must not bypass missing dependencies by creating temporary
duplicate architecture.

------------------------------------------------------------------------

# 28. Standard Claude Code task template

Every `TASK-XXX.md` should use:

``` text
# TASK-XXX — Title

## Objective

## Required reading
- Specification sections
- Existing modules/files

## Preconditions

## In scope

## Explicitly out of scope

## Domain rules

## Data model requirements

## API requirements

## UI requirements

## Authorization / tenancy requirements

## Audit requirements

## Events / outbox requirements

## Tests required

## Acceptance criteria

## Regression checks

## Documentation updates

## Completion procedure
1. Run tests
2. Run lint/static analysis
3. Run build
4. Inspect diff
5. Update IMPLEMENTATION_STATUS.md
6. Update DECISIONS.md if needed
7. Commit

## Completion report
- Summary
- Files changed
- Migrations
- APIs
- Tests
- Commands executed
- Results
- Deviations
- Risks/blockers
- Commit hash
```

------------------------------------------------------------------------

# 29. Definition of Done --- individual task

A task is DONE only when:

-   Scope implemented.
-   No explicit non-scope implemented.
-   Relevant migrations exist.
-   Server-side authorization exists.
-   Tenant isolation tested where relevant.
-   Domain rules tested.
-   UI states handled where relevant.
-   FR/AR strings added.
-   Audit/outbox implemented where required.
-   Relevant automated tests pass.
-   Static analysis passes.
-   Build passes.
-   No unexplained regression.
-   Documentation/status updated.
-   Commit created.
-   Completion report produced.

------------------------------------------------------------------------

# 30. Definition of Done --- module

A module is complete when:

-   All required tasks complete.
-   API documented.
-   Happy path tested.
-   Negative path tested.
-   Permission tests complete.
-   Cross-tenant tests complete.
-   Error states implemented.
-   Responsive behavior checked.
-   FR/AR checked.
-   Audit requirements complete.
-   Performance acceptable.
-   No high-severity unresolved defect.

------------------------------------------------------------------------

# 31. Release gates

V1 cannot launch unless:

1.  Cross-tenant isolation passes.
2.  Practitioner governance passes.
3.  Payment/caisse reconciliation passes.
4.  No duplicate payment under retry/double-click.
5.  Backup and restore tested.
6.  Production monitoring active.
7.  Public booking abuse controls active.
8.  Private patient files verified.
9.  Subscription blackout/renewal tested.
10. FR/AR critical flows tested.
11. Pilot golden paths pass.
12. Morocco-specific privacy/legal review completed.
13. No unresolved critical/high security issue.

------------------------------------------------------------------------

# 32. Pilot golden paths

## GP-01 Solo

``` text
Register
-> Trial
-> Configure cabinet
-> Add service
-> Add patient
-> Create exact RDV
-> Arrival
-> Consultation
-> Dossier Santé
-> Complete
-> Invoice
-> Cash payment
-> Receipt
-> Caisse
-> Next RDV
```

## GP-02 Reception

``` text
Reception login
-> Create patient/RDV
-> Confirm
-> Arrival/waiting
-> Practitioner consults
-> Reception invoices
-> Cash payment
-> Receipt
```

## GP-03 Public booking

``` text
QR
-> Booking form
-> Request
-> Reception validates
-> Confirmation
-> Reminder
-> Arrival
```

## GP-04 Kiné

``` text
Patient
-> 20-session treatment
-> Schedule sessions
-> Complete sessions
-> Progress
-> Installments
-> Remaining balance
```

## GP-05 Subscription

``` text
Trial
-> Active
-> Expiry reminders
-> Grace
-> Blackout
-> Renewal
-> Access restored
```

------------------------------------------------------------------------

# 33. Development sequencing policy

Do not execute all 255 tasks blindly if repository evolution makes some
tasks merge naturally.

However:

-   Task IDs preserve traceability.
-   Any merge/split must be recorded.
-   Dependencies must remain respected.
-   Acceptance criteria must not disappear.
-   Claude must never jump from foundation directly to broad feature
    generation.

Recommended working batch:

**One task per Claude Code execution**, or a very small group of tightly
coupled tasks when explicitly approved.

------------------------------------------------------------------------

# 34. Git discipline

Recommended:

``` text
main
development or short-lived feature branches
```

Commit convention:

``` text
TASK-059: implement appointment aggregate
TASK-125: post full cash payment atomically
```

Avoid giant commits spanning unrelated phases.

Claude must inspect `git diff` before commit.

------------------------------------------------------------------------

# 35. Architectural decision records

`DECISIONS.md` should capture decisions such as:

``` text
ADR-001 Backend framework selected
ADR-002 Authentication/session strategy
ADR-003 PostgreSQL RLS decision
ADR-004 WhatsApp provider
ADR-005 SMS provider
ADR-006 Subscription payment provider
ADR-007 Owner clinical-access policy
ADR-008 Caisse concurrency model
ADR-009 Negative-stock policy
```

Each record:

-   Context.
-   Decision.
-   Alternatives.
-   Consequences.
-   Date.

------------------------------------------------------------------------

# 36. Open blockers before affected tasks

Not all must be resolved before TASK-001.

Resolve before relevant implementation:

-   Backend framework before TASK-002.
-   Owner clinical governance before TASK-096.
-   Morocco invoice requirements before TASK-118/119 production
    finalization.
-   WhatsApp/SMS providers before production adapters.
-   Subscription provider before real billing.
-   Caisse concurrency policy before final cash hardening.
-   Negative-stock policy before TASK-165.
-   Trial length before commercial configuration.
-   Privacy/legal retention before production launch.

Claude should use provider interfaces/test adapters while commercial
provider decisions remain open.

------------------------------------------------------------------------

# 37. Recommended immediate execution

The next concrete implementation sequence after placing Specifications
#1--#6 into the repository is:

``` text
TASK-001 Repository bootstrap
TASK-002 Backend bootstrap
TASK-003 Frontend bootstrap
TASK-004 Local development environment
TASK-005 PostgreSQL foundation
TASK-006 Redis/queue foundation
TASK-007 Testing foundation
TASK-008 Static analysis/lint
TASK-009 CI
TASK-010 FR/AR foundation
TASK-011 Error contract
TASK-012 Request IDs
```

Then stop and perform a **Foundation Validation Gate** before beginning
Identity/Tenancy.

------------------------------------------------------------------------

# 38. Foundation Validation Gate

Claude Code must prove:

-   Clean setup works.
-   Frontend boots.
-   Backend boots.
-   PostgreSQL connects.
-   Redis connects.
-   Worker executes a test job.
-   Object-storage local adapter works or is scaffolded according to
    task.
-   Tests execute.
-   CI executes.
-   FR/AR shell switches direction.
-   Health endpoint works.
-   No secrets in repository.
-   Documentation matches setup.

Only then begin Phase 1.

------------------------------------------------------------------------

# 39. Final execution model

``` text
Specifications #1–#5
          |
Specification #6
          |
       CLAUDE.md
          |
       TASK-001
          |
Implement -> Test -> Validate -> Commit
          |
       TASK-002
          |
Implement -> Test -> Validate -> Commit
          |
          ...
          |
      Pilot Gates
          |
    Production Launch
```

The objective is not to make Claude Code generate the maximum amount of
code per prompt. The objective is to make it produce a coherent, secure
and testable system without architectural drift.

A slower controlled task sequence at the beginning is expected to
produce a substantially faster and safer path to a commercial product
than repeatedly repairing a monolithic AI-generated implementation.
