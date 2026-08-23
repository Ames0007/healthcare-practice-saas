# CLAUDE.md --- Healthcare Practice Management SaaS Engineering Constitution

This file contains permanent engineering instructions for Claude Code
while developing this repository.

The application is a **Moroccan, bilingual French/Arabic, multi-tenant
Healthcare Practice Management SaaS** for solo practitioners and small
medical/paramedical cabinets.

Primary initial specialties:

-   General medicine
-   Dentistry
-   Physiotherapy / kinesitherapy
-   Psychology
-   Nutrition
-   Dermatology / aesthetic medicine
-   Small multi-practitioner cabinets

Primary customer size: generally 1--5 users, with support for practices
up to approximately 10 users in the initial product.

The product is **solo-first, cabinet-capable**.

------------------------------------------------------------------------

# 1. SOURCE OF TRUTH

Before implementing a task, read the relevant project specifications.

Expected documentation:

``` text
docs/specifications/
  01-product-blueprint.md
  02-information-architecture.md
  03-business-workflows.md
  04-domain-data-architecture.md
  05-technical-api-security.md
  06-master-implementation-plan.md
  07-frontend-ux-ui-specification.md
  08-design-system-component-architecture.md
  09-detailed-screens-wireframes.md
```

Priority when instructions conflict:

``` text
1. Explicit current task instructions
2. Approved architectural decisions in docs/implementation/DECISIONS.md
3. CLAUDE.md
4. Specifications #1–#9
5. Existing implementation patterns
```

Do not silently resolve material contradictions. Record them and stop if
they affect correctness, security, data integrity or product behavior.

Any task that touches frontend UI (screens, components, layout,
navigation, styling, forms, wireframe composition) must additionally be
read against:

``` text
07-frontend-ux-ui-specification.md      (UX behavior/interaction rules)
08-design-system-component-architecture.md  (tokens/component vocabulary)
09-detailed-screens-wireframes.md       (screen composition/wireframes)
```

Do not implement or modify frontend UI without consulting Specifications
#7–#9. Do not invent visual patterns, components or copy that these
specifications already define.

------------------------------------------------------------------------

# 2. EXECUTION MODEL

Work on **one bounded task at a time** unless explicitly instructed
otherwise.

For every task:

``` text
READ
  ↓
INSPECT REPOSITORY
  ↓
IDENTIFY EXISTING COMPONENTS
  ↓
VERIFY DEPENDENCIES
  ↓
IMPLEMENT ONLY TASK SCOPE
  ↓
TEST
  ↓
STATIC ANALYSIS / LINT / BUILD
  ↓
INSPECT DIFF
  ↓
UPDATE PROJECT STATUS
  ↓
COMMIT
  ↓
REPORT
```

Never begin implementation by assuming the repository still matches an
earlier specification. Inspect the actual code first.

------------------------------------------------------------------------

# 3. DO NOT INVENT REQUIREMENTS

If a requirement is unspecified:

-   Prefer existing specification behavior.
-   Prefer existing architectural patterns.
-   Do not invent a large new subsystem.
-   Do not implement future roadmap features.
-   Record meaningful ambiguity in
    `docs/implementation/RISKS_AND_BLOCKERS.md`.
-   Record approved architectural decisions in
    `docs/implementation/DECISIONS.md`.

Do not expand scope merely because implementation makes an additional
feature convenient.

------------------------------------------------------------------------

# 4. ARCHITECTURAL STYLE

The backend is a **modular monolith**.

Conceptual modules:

``` text
Identity
Tenancy
Patients
Clinical
Scheduling
Treatments
Billing
CashManagement
Team
Commissions
Inventory
Communication
MasterData
Subscriptions
Referrals
Reporting
Audit
```

Each module owns its business rules.

Do not create microservices unless explicitly instructed.

Do not allow one module to modify another module's persistence
arbitrarily.

Use:

-   Application services
-   Domain services
-   Explicit interfaces
-   Domain/application events

where cross-module interaction is required.

------------------------------------------------------------------------

# 5. LAYERING

Preferred backend structure:

``` text
Module/
  Domain/
  Application/
  Infrastructure/
  Presentation/
```

## Domain

Contains:

-   Entities
-   Value objects
-   Domain rules
-   State machines
-   Domain events

Domain must not depend on HTTP controllers or frontend concepts.

## Application

Contains:

-   Use cases
-   Commands
-   Queries
-   Transaction orchestration
-   Authorization relevant to use case
-   Cross-module coordination

## Infrastructure

Contains:

-   Database persistence
-   Redis
-   Queues
-   Object storage
-   Provider adapters
-   External APIs

## Presentation

Contains:

-   HTTP controllers
-   Request validation
-   Response transformation

Controllers must remain thin.

------------------------------------------------------------------------

# 6. MULTI-TENANCY IS NON-NEGOTIABLE

A tenant represents one subscribing practice/cabinet.

Every tenant-owned business record must be tenant-scoped.

Never trust:

``` text
tenant_id
```

provided by the frontend as authorization context.

Resolve tenant through authenticated membership/session.

Conceptually:

``` text
Authenticated User
       ↓
Active Membership
       ↓
TenantContext
       ↓
Application Service
       ↓
Tenant-Scoped Repository
```

Every sensitive repository/query must operate with tenant context.

------------------------------------------------------------------------

# 7. CROSS-TENANT ACCESS

The following must never occur:

``` text
Tenant A user
        ↓
Tenant B patient
Tenant B invoice
Tenant B payment
Tenant B document
Tenant B appointment
Tenant B employee
Tenant B stock
```

Cross-tenant access must be denied server-side even if a valid resource
UUID is supplied.

UUIDs are not authorization.

Every new tenant-owned module requires negative cross-tenant tests.

------------------------------------------------------------------------

# 8. PRACTITIONER-GOVERNED PATIENT DATA

Each patient has one responsible practitioner.

Tenant membership alone does not automatically grant unrestricted
clinical access.

Conceptually:

``` text
Tenant
├── Practitioner A
│   └── Governed Patients A
├── Practitioner B
│   └── Governed Patients B
└── Reception
    └── Administrative access only as authorized
```

Receptionist access to appointments does **not** imply access to
clinical notes.

Clinical access must be checked separately.

Do not implement implicit cross-practitioner clinical sharing.

The final policy for Owner/Admin access to another practitioner's
clinical data is an explicit project decision and must not be guessed.

------------------------------------------------------------------------

# 9. ROLES ARE INTENTIONALLY LIGHTWEIGHT

Primary profiles:

``` text
OWNER / ADMIN
PRACTITIONER
RECEPTIONIST / STAFF
```

Owner/Admin controls staff permissions.

Do not build a complex customer-facing RBAC designer unless explicitly
requested.

Use granular permission codes behind a simple UI.

Examples:

``` text
patients.view_admin
patients.edit_admin
appointments.manage
clinical.view
clinical.edit
invoices.view
invoices.create
payments.record
caisse.manage
expenses.manage
hr.manage
payroll.view
commissions.manage
inventory.manage
reports.view
settings.manage
```

Frontend visibility is never sufficient authorization.

------------------------------------------------------------------------

# 10. SUBSCRIPTION ACCESS AND USER PERMISSIONS ARE DIFFERENT

Subscription determines:

> What functionality the tenant purchased.

Permissions determine:

> What this user may do.

Both checks may be required.

Never implement:

``` text
if plan == "PRO"
```

inside business modules.

Use a centralized entitlement service.

Conceptually:

``` text
EntitlementService.can("inventory")
EntitlementService.limit("max_practitioners")
```

------------------------------------------------------------------------

# 11. SUBSCRIPTION STATES

Supported lifecycle:

``` text
TRIALING
ACTIVE
EXPIRED
GRACE
BLACKOUT
CANCELLED
```

Agreed policy:

-   Multiple reminders before expiration.
-   Three-day grace period after expiration.
-   Blackout after grace if unpaid.
-   Blackout never deletes tenant data.

During blackout, only controlled subscription/support/logout
functionality remains accessible.

Backend APIs must enforce blackout.

------------------------------------------------------------------------

# 12. PATIENT IS A CENTRAL ENTITY

Patient 360° contains:

``` text
Overview
Dossier Santé + Documents
Appointments
Treatments / Sessions
Invoices
Payments
```

These are views of shared underlying records.

Do not duplicate invoice/payment/appointment data merely to display it
inside the patient page.

------------------------------------------------------------------------

# 13. DOSSIER SANTÉ + DOCUMENTS

Medical records and documents are merged in UX but remain structured
underneath.

Clinical information may include:

-   Allergies
-   Medical history
-   Current treatments
-   Conditions
-   Measurements
-   Consultation/session history
-   Clinical notes
-   Prescriptions
-   Reports
-   Certificates
-   Images
-   X-rays
-   Laboratory documents
-   Other files

Prefer structured clinical forms/entries rather than one giant free-form
JSON blob.

------------------------------------------------------------------------

# 14. MASTER DATA

The platform contains global master data.

Tenants may:

``` text
SEARCH
  ↓
SELECT
  ↓
CUSTOMIZE LOCALLY
```

or add tenant-specific values.

Examples:

-   Specialties
-   Services
-   Treatment types
-   Clinical information
-   Document types
-   Expense categories
-   Stock categories
-   Units
-   Leave types
-   Payment methods
-   Communication templates

Tenant customization must never modify global records.

Master data must support:

``` text
name_fr
name_ar
keywords_fr
keywords_ar
```

where applicable.

------------------------------------------------------------------------

# 15. APPOINTMENTS

V1 supports two scheduling modes.

## Exact

``` text
Appointment at 10:00
```

## Arrival window

``` text
Arrive between 10:00 and 10:30
```

Store these distinctly.

Do not reduce a window appointment to a single timestamp.

Future, not V1:

-   Capacity-based scheduling
-   Room scheduling
-   Equipment scheduling

------------------------------------------------------------------------

# 16. APPOINTMENT STATES

Use explicit state transitions.

``` text
REQUESTED
TO_CONFIRM
CONFIRMED
ARRIVED
WAITING
IN_CONSULTATION
COMPLETED
```

Alternative states:

``` text
RESCHEDULED
CANCELLED_BY_PATIENT
CANCELLED_BY_PRACTICE
NO_SHOW
```

Do not allow arbitrary status PATCH operations that bypass domain rules.

Prefer explicit application actions.

------------------------------------------------------------------------

# 17. PUBLIC BOOKING

Public booking URL:

``` text
/book/{cabinet-slug}
```

QR code points to this URL.

Patient completes a lightweight form:

-   First name
-   Last name
-   Phone
-   Reason/service
-   Desired date
-   Desired time/window
-   Optional comment

A public request is **not automatically confirmed**.

Workflow:

``` text
REQUEST
  ↓
Reception review
  ↓
Confirm / Alternative / Reject
  ↓
WhatsApp/SMS
```

Do not expose whether the submitted patient already exists.

------------------------------------------------------------------------

# 18. TREATMENTS AND SESSIONS

Treatment and session are separate entities.

Example kiné:

``` text
Treatment
20 sessions
├── Session 01 completed
├── Session 02 completed
├── Session 03 scheduled
└── ...
```

Cancelling one session must not cancel the entire treatment.

Treatment clinical status is independent from financial status.

------------------------------------------------------------------------

# 19. FINANCIAL DOMAINS MUST REMAIN SEPARATE

Do not confuse:

## Practice billing

``` text
Patient
  ↓
Invoice
  ↓
Installment
  ↓
Payment
  ↓
Receipt
```

with:

## SaaS billing

``` text
Tenant
  ↓
Subscription
  ↓
Subscription Payment
```

They require separate entities, services and reports.

------------------------------------------------------------------------

# 20. MONEY

Never use binary floating-point for money.

Use decimal/fixed precision.

Recommended database:

``` text
NUMERIC(14,2)
```

Currency initially:

``` text
MAD
```

All financial calculations require tests.

------------------------------------------------------------------------

# 21. INVOICES

Invoice may originate from:

-   Appointment
-   Treatment
-   Session/service
-   Authorized manual creation

States:

``` text
DRAFT
ISSUED
PARTIALLY_PAID
PAID
OVERDUE
CANCELLED
```

Issued invoice numbers must be concurrency-safe and unique within
tenant.

Do not hard-delete issued invoices.

------------------------------------------------------------------------

# 22. INSTALLMENTS

Installments are separate records.

States:

``` text
UPCOMING
DUE
PARTIALLY_PAID
PAID
OVERDUE
```

Installment schedule must not exceed relevant invoice obligation
according to defined policy.

------------------------------------------------------------------------

# 23. PAYMENTS

V1 patient payments are primarily cash.

Online patient payments are not part of V1.

A posted cash payment must atomically coordinate:

``` text
Payment
Payment Allocation
Invoice balance
Installment balance if applicable
Receipt
Cash movement
Commission earning if collection-based
Audit
```

Use a database transaction.

Sensitive payment creation must be idempotent.

------------------------------------------------------------------------

# 24. FINANCIAL RECORDS ARE NOT ORDINARY CRUD

Never silently edit/delete posted financial records.

Corrections use:

-   Reversal
-   Adjustment
-   Cancellation
-   Replacement where appropriate

Always preserve history and reason.

------------------------------------------------------------------------

# 25. RECEIPTS

Every valid patient payment can generate a receipt.

Receipt:

-   Unique tenant-local number
-   Patient
-   Invoice
-   Amount
-   Date
-   Payment method
-   Remaining balance where relevant

Receipts are printable/downloadable.

------------------------------------------------------------------------

# 26. CAISSE

Caisse is a movement ledger.

Expected balance:

``` text
Opening balance
+ Cash IN
- Cash OUT
= Expected cash
```

Never directly set a current balance as the source of truth.

Cash patient payment creates exactly one linked IN movement.

Cash expense creates exactly one linked OUT movement.

Closing requires physical cash count.

Difference requires reason.

Closed caisse cannot be silently edited.

------------------------------------------------------------------------

# 27. EXPENSES / DÉCAISSEMENTS

This is operational financial management, not full accounting.

Examples:

-   Rent
-   Utilities
-   Prestataires
-   Supplies
-   Maintenance
-   Salaries
-   Other expenses

Cash expense affects caisse.

Non-cash expense does not.

Do not describe operational balance as accounting profit.

------------------------------------------------------------------------

# 28. COMMISSIONS

Support:

``` text
Percentage of collected amount
Percentage of invoiced amount
Fixed amount per service
Different rule per service
Fixed salary + commission
Commission only
```

Store the basis explicitly.

Never calculate the same commission twice from the same source.

Manual adjustment requires reason and audit.

------------------------------------------------------------------------

# 29. HR

V1 HR includes:

-   Employee profile
-   Contracts/info
-   Working schedules/shifts
-   Leave
-   Absence
-   Overtime entered/validated
-   Payroll
-   Bonuses
-   Commissions
-   Documents

V1 does **not** include clock-in/clock-out.

Do not add biometric/QR attendance unless scope changes.

------------------------------------------------------------------------

# 30. INVENTORY

V1 inventory is intentionally simple.

``` text
Stock Item
  ↓
Stock IN
Stock OUT
Adjustment
  ↓
Balance
```

Support:

-   Lot
-   Expiration
-   Minimum stock
-   Alerts

No procurement/purchase-order module in V1.

Stock changes must always be represented by movements.

------------------------------------------------------------------------

# 31. COMMUNICATION

Primary patient channels:

-   WhatsApp
-   SMS

Use provider interfaces/adapters.

Business modules do not directly call provider APIs.

Flow:

``` text
Business event
  ↓
Outbox
  ↓
Queue
  ↓
Communication worker
  ↓
Provider
```

Store message status:

``` text
QUEUED
SENT
DELIVERED
FAILED
```

------------------------------------------------------------------------

# 32. GOOGLE CALENDAR

V1 recommended synchronization:

``` text
Application -> Google Calendar
```

Internal agenda remains authoritative.

Google Calendar must never directly mark:

-   Arrived
-   Waiting
-   In consultation
-   Completed
-   Paid

without explicit application workflow.

------------------------------------------------------------------------

# 33. OUTBOX

External side effects must not execute inside critical database
transactions.

Use transactional outbox for:

-   WhatsApp
-   SMS
-   Google Calendar
-   Subscription events
-   Other asynchronous integrations

Business transaction commits first.

Worker processes external event after commit.

------------------------------------------------------------------------

# 34. IDEMPOTENCY

Required for retry-sensitive operations:

-   Patient payment
-   Subscription payment webhook
-   Referral reward
-   Provider webhook
-   Stock movement where retry can occur
-   Other financially sensitive POST operations

Double-click/retry must not duplicate financial effects.

------------------------------------------------------------------------

# 35. FILE STORAGE

Patient/employee/expense/generated files use private object storage.

Never expose permanent public URLs.

Access:

``` text
Request
  ↓
Authentication
  ↓
Tenant check
  ↓
Permission/governance check
  ↓
Short-lived signed URL / secure stream
```

Validate file size/type and storage quota.

------------------------------------------------------------------------

# 36. SECURITY

Security is part of every task, not a final phase.

Always consider:

-   Authentication
-   Authorization
-   Tenant isolation
-   Practitioner governance
-   IDOR
-   CSRF
-   XSS
-   SQL injection
-   Rate limiting
-   Secrets
-   File access
-   Webhook verification
-   Sensitive logging
-   Financial idempotency

------------------------------------------------------------------------

# 37. PUBLIC ENDPOINT SECURITY

Public booking is untrusted.

Implement:

-   Rate limiting
-   Input validation
-   Length limits
-   Bot/spam controls
-   Phone normalization
-   No patient existence disclosure
-   No sensitive appointment enumeration

Only expose safe availability.

Never expose:

``` text
"Patient X occupies 10:00"
```

------------------------------------------------------------------------

# 38. LOGGING

Structured logs may include:

-   request_id
-   user_id
-   tenant_id
-   route
-   status
-   duration
-   safe error code

Never log:

-   Passwords
-   Tokens
-   Full clinical notes
-   Patient documents
-   Raw payment credentials
-   OAuth secrets

------------------------------------------------------------------------

# 39. AUDIT

Audit is separate from technical logs.

Audit sensitive actions such as:

-   Patient governance change
-   Clinical amendment
-   Appointment cancellation/reschedule
-   Invoice issuance/cancellation
-   Payment/reversal
-   Caisse close/adjustment
-   Permission change
-   Commission adjustment
-   Subscription manual change

Audit events are append-only from normal application behavior.

------------------------------------------------------------------------

# 40. FR / AR

Every feature must support localization.

French:

``` text
LTR
```

Arabic:

``` text
RTL
```

Do not postpone RTL until the end.

Generated documents may have a language independent of current UI
language.

User-entered patient names/notes remain Unicode exactly as entered.

------------------------------------------------------------------------

# 41. RESPONSIVE WEB

There is no mobile app in V1.

Responsive web must support critical workflows:

-   Aujourd'hui
-   Agenda
-   Patient lookup
-   Appointment state changes
-   Clinical notes
-   Payment lookup
-   Public booking

Do not create a native/mobile app unless scope changes.

------------------------------------------------------------------------

# 42. TESTING REQUIREMENTS

Every task must add appropriate tests.

## Unit

Domain rules and calculations.

## Application

Use-case orchestration.

## Integration

Database, Redis, storage and adapters.

## Feature/API

HTTP behavior and authorization.

## E2E

Critical user journeys.

------------------------------------------------------------------------

# 43. SECURITY REGRESSION TESTS

Permanent tests must prove:

-   Tenant A cannot access Tenant B.
-   Practitioner B cannot access governed Patient A without
    authorization.
-   Reception cannot access clinical data by default.
-   Blackout blocks operational APIs.
-   File authorization works.
-   Payment retry does not duplicate.
-   Webhook replay does not duplicate.
-   Public booking cannot enumerate patients.

Never remove these tests merely to make a build pass.

------------------------------------------------------------------------

# 44. DATABASE MIGRATIONS

Rules:

-   Version controlled.
-   No manual production schema changes.
-   No destructive migration without explicit plan.
-   Use expand/migrate/contract when required.
-   Test migrations.
-   Preserve historical financial/clinical references.

Do not rewrite already-deployed migration history casually.

------------------------------------------------------------------------

# 45. DATABASE CONCURRENCY

Pay particular attention to:

-   Invoice numbering
-   Receipt numbering
-   Payment posting
-   Invoice balance
-   Caisse closing
-   Stock movement
-   Referral reward
-   Commission earning

Use transactions, locking and unique constraints where appropriate.

------------------------------------------------------------------------

# 46. SEARCH

Core search should support:

-   Patient name
-   Phone
-   Patient number
-   Invoice number
-   Receipt/payment reference
-   Service
-   Stock item

Master data should support FR/AR keywords.

Do not load entire datasets into frontend to search client-side.

------------------------------------------------------------------------

# 47. PERFORMANCE

Optimize correctness first, then measured bottlenecks.

Use:

-   Appropriate indexes
-   Pagination
-   Bounded queries
-   Query profiling
-   Background jobs for heavy work

Do not prematurely introduce:

-   Microservices
-   Sharding
-   Kafka
-   Kubernetes
-   Data warehouse

------------------------------------------------------------------------

# 48. CACHING

Safe candidates:

-   Master data
-   Entitlements
-   Tenant configuration
-   Static references

Be cautious caching:

-   Invoice balances
-   Caisse
-   Stock
-   Appointment conflict data

Source of truth remains PostgreSQL.

------------------------------------------------------------------------

# 49. FEATURE FLAGS VS ENTITLEMENTS

Do not confuse:

**Feature flag** - Engineering rollout.

**Entitlement** - Commercial access.

Keep them separate.

------------------------------------------------------------------------

# 50. EXPLICIT V1 NON-SCOPE

Do not implement unless formally approved:

-   Room scheduling
-   Equipment scheduling
-   Capacity-based multi-patient scheduling
-   Patient mobile app
-   Full patient portal
-   Patient online payments
-   Purchasing/procurement
-   Full accounting
-   Clock-in/out
-   Advanced statutory payroll
-   Insurance/AMO workflows
-   Odontogram
-   Advanced specialty clinical modules
-   AI
-   Custom domains/subdomains
-   Advanced BI warehouse
-   Medical-device integrations

------------------------------------------------------------------------

# 51. CODE QUALITY

Prefer:

-   Clear names
-   Small cohesive classes/functions
-   Explicit domain language
-   Dependency injection
-   Reusable domain/application services
-   Typed DTOs/contracts
-   Centralized validation where appropriate

Avoid:

-   God services
-   Massive controllers
-   duplicated business rules
-   hidden side effects
-   magic strings
-   magic numbers
-   deeply coupled modules
-   premature abstraction

------------------------------------------------------------------------

# 52. COMMENTS

Comments explain **why**, not obvious syntax.

Do not generate excessive AI-style commentary.

Prefer self-explanatory code.

------------------------------------------------------------------------

# 53. API DESIGN

Base:

``` text
/api/v1
```

Use explicit action endpoints for state transitions.

Good:

``` text
POST /appointments/{id}/confirm
POST /appointments/{id}/reschedule
POST /payments/{id}/reverse
POST /invoices/{id}/issue
```

Avoid arbitrary state mutation:

``` text
PATCH status = "paid"
```

when domain action is required.

------------------------------------------------------------------------

# 54. API ERRORS

Use stable machine-readable error codes.

Example:

``` json
{
  "error": {
    "code": "APPOINTMENT_CONFLICT",
    "message": "...",
    "details": {},
    "request_id": "..."
  }
}
```

Do not expose stack traces or SQL.

------------------------------------------------------------------------

# 55. OPENAPI

When API behavior changes:

-   Update OpenAPI.
-   Validate schema.
-   Keep request/response definitions aligned with implementation.

API documentation is part of Definition of Done.

------------------------------------------------------------------------

# 56. EXTERNAL PROVIDERS

Always wrap provider-specific behavior behind interfaces.

Examples:

``` text
WhatsAppProvider
SmsProvider
SubscriptionPaymentProvider
ObjectStorageProvider
CalendarProvider
```

Business logic must not depend directly on one vendor SDK.

------------------------------------------------------------------------

# 57. PROVIDER FAILURE

Core application must continue when external providers fail.

If WhatsApp fails:

-   Appointment remains confirmed.
-   Message becomes failed/retryable.

If Google Calendar fails:

-   Internal appointment remains valid.

If reporting fails:

-   Patient/payment workflow continues.

------------------------------------------------------------------------

# 58. PROJECT STATE FILES

Maintain:

``` text
docs/implementation/IMPLEMENTATION_STATUS.md
docs/implementation/DECISIONS.md
docs/implementation/RISKS_AND_BLOCKERS.md
docs/implementation/CHANGELOG.md
```

Update them as part of tasks when relevant.

Do not rely on chat/session memory as project state.

------------------------------------------------------------------------

# 59. DECISIONS

For material architecture decisions use ADR-style entries:

``` text
ADR-XXX
Context
Decision
Alternatives
Consequences
Date
```

Examples:

-   Backend framework
-   RLS
-   WhatsApp provider
-   Subscription provider
-   Owner clinical-access policy
-   Caisse concurrency
-   Negative stock

------------------------------------------------------------------------

# 60. GIT

Before modifying:

``` text
git status
```

Before commit:

``` text
git diff
git status
```

Do not overwrite unrelated uncommitted user changes.

Commit one coherent task.

Recommended commit:

``` text
TASK-059: implement appointment aggregate
```

Never use destructive Git operations unless explicitly instructed.

------------------------------------------------------------------------

# 61. COMPLETION REPORT

At the end of every implementation task report:

``` text
Task
Status

Summary

Files changed

Migrations

API changes

UI changes

Tests added/updated

Commands executed

Test results

Static analysis/build results

Security/tenant validation

Specification deviations

Open risks/blockers

Documentation updated

Commit hash
```

Do not report "complete" when tests were not run.

Use:

``` text
IMPLEMENTED — NOT VERIFIED
```

when tooling prevents verification.

------------------------------------------------------------------------

# 62. DEFINITION OF DONE

A task is complete only when applicable requirements are satisfied:

-   Correct scope implemented.
-   Non-scope untouched.
-   Domain rules implemented.
-   Server authorization implemented.
-   Tenant isolation implemented/tested.
-   Practitioner governance implemented/tested.
-   Financial transaction safety implemented.
-   Audit/outbox added where required.
-   FR/AR translations added.
-   UI states handled.
-   Tests pass.
-   Static analysis passes.
-   Build passes.
-   OpenAPI updated.
-   Documentation/status updated.
-   Diff reviewed.
-   Commit created.

------------------------------------------------------------------------

# 63. STOP CONDITIONS

Stop and report instead of guessing when:

-   Specification conflict affects security/data integrity.
-   Required dependency is missing.
-   Migration would destroy production data.
-   Owner clinical-governance policy is required but unresolved.
-   Morocco legal requirement must be determined before implementation.
-   External provider contract/API is unknown and cannot safely be
    abstracted.
-   Existing code contradicts architecture in a way requiring broad
    refactor.
-   Tests reveal a pre-existing critical defect outside task scope.

Provide:

-   Exact blocker.
-   Evidence.
-   Impact.
-   Recommended options.

------------------------------------------------------------------------

# 64. FOUNDATION VALIDATION GATE

Before moving from Phase 0 to Identity/Tenancy, prove:

-   Frontend boots.
-   Backend boots.
-   PostgreSQL works.
-   Redis works.
-   Queue worker works.
-   Tests run.
-   CI runs.
-   FR/AR shell works.
-   RTL works.
-   Health endpoint works.
-   Error contract works.
-   Request IDs work.
-   No committed secrets.

Do not skip this gate.

------------------------------------------------------------------------

# 65. PRE-LAUNCH RELEASE GATES

Production launch requires:

-   Full cross-tenant regression pass.
-   Practitioner-governance pass.
-   Financial reconciliation pass.
-   Payment idempotency pass.
-   Caisse reconciliation pass.
-   File privacy pass.
-   Public booking security pass.
-   Subscription blackout/renewal pass.
-   Backup/restore tested.
-   Monitoring active.
-   Critical FR/AR journeys tested.
-   Pilot acceptance completed.
-   Morocco-specific privacy/legal review completed.
-   No unresolved critical/high security defect.

------------------------------------------------------------------------

# 66. FINAL ENGINEERING PRINCIPLE

The goal is not to maximize code generation speed.

The goal is to produce a commercial healthcare SaaS that remains:

``` text
Simple for practitioners
Secure for patients
Auditable for money
Isolated between tenants
Maintainable for developers
Extensible for future specialties
Reliable enough to sell
```

When choosing between a shortcut and preserving these properties,
preserve the properties.
