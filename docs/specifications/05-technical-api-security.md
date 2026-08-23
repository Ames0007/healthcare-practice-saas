# Healthcare Practice Management SaaS

## Specification 05 --- Technical Architecture, API Architecture & Security Design

**Market:** Morocco\
**Product:** Multi-tenant bilingual FR/AR Healthcare Practice Management
SaaS\
**Target:** Solo practitioners and small practices, generally 1--5 users
and up to approximately 10\
**Architecture style:** Modular monolith, API-driven responsive web
application\
**Primary goals:** Fast market launch, maintainability, strong tenant
isolation, secure health-data handling, reliable financial operations,
simple scaling.

------------------------------------------------------------------------

# 1. Purpose

This specification converts the approved functional and data
architecture into an engineering architecture.

It defines:

-   Recommended technology stack.
-   Frontend architecture.
-   Backend architecture.
-   Modular-monolith boundaries.
-   API conventions.
-   Authentication.
-   Authorization.
-   Tenant context and patient governance.
-   PostgreSQL implementation.
-   Redis, queues and caching.
-   File/object storage.
-   Background jobs and outbox processing.
-   WhatsApp/SMS integration.
-   Google Calendar integration.
-   SaaS subscription architecture.
-   Security controls.
-   Public booking protection.
-   Logging and audit.
-   Deployment topology.
-   Environments.
-   CI/CD.
-   Backups and disaster recovery.
-   Monitoring.
-   Testing architecture.
-   Scaling path.

------------------------------------------------------------------------

# 2. Recommended stack

A pragmatic stack for this project:

``` text
Frontend
Next.js + React + TypeScript

Backend
Laravel (PHP) OR NestJS (TypeScript)

Database
PostgreSQL

Cache / Queue
Redis

Object Storage
S3-compatible private object storage

Background Jobs
Queue workers

Reverse Proxy / Edge
Managed hosting / CDN / WAF as appropriate

Messaging
WhatsApp Business provider
SMS provider

Calendar
Google Calendar API

SaaS Billing
Payment provider selected for Moroccan commercial availability

Monitoring
Application error tracking + infrastructure monitoring

Source Control / CI
GitHub + GitHub Actions
```

## 2.1 Backend recommendation

For this project, **Laravel** is a strong default if the development
team is comfortable with PHP because it provides mature support for:

-   Authentication.
-   Authorization policies.
-   Queues.
-   Scheduled jobs.
-   Database transactions.
-   Validation.
-   Notifications.
-   File storage.
-   Testing.
-   Migrations.
-   Mail.
-   Rate limiting.

NestJS is equally viable if the team strongly prefers TypeScript
end-to-end.

The product architecture should not depend on framework-specific
shortcuts that compromise domain boundaries.

------------------------------------------------------------------------

# 3. High-level topology

``` text
                        INTERNET
                           |
                           v
                    CDN / WAF / TLS
                           |
             +-------------+-------------+
             |                           |
             v                           v
       Next.js Web App              Public Booking
             |                           |
             +-------------+-------------+
                           |
                           v
                       Backend API
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
      PostgreSQL         Redis         Object Storage
          |                |
          |                +---- Queue Workers
          |                         |
          |              +----------+----------+
          |              |          |          |
          |          WhatsApp      SMS      Google Calendar
          |
          +---- Audit / Outbox / Business Data
```

------------------------------------------------------------------------

# 4. Application deployment style

Use a **modular monolith**, not microservices.

One backend deployment contains isolated modules:

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

Benefits:

-   Easier development.
-   Easier transactions.
-   Easier deployment.
-   Lower infrastructure cost.
-   Faster debugging.
-   Still permits later extraction of high-load modules.

------------------------------------------------------------------------

# 5. Frontend architecture

## 5.1 Technology

Recommended:

``` text
Next.js
React
TypeScript
```

Use a professional component system/design system.

## 5.2 Application areas

Frontend route groups should conceptually separate:

``` text
/auth/*
/onboarding/*
/app/*
/book/*
/admin/*
```

Where:

-   `/auth` = authentication.
-   `/onboarding` = tenant setup.
-   `/app` = customer practice application.
-   `/book` = public patient booking.
-   `/admin` = SaaS Super Admin.

## 5.3 Responsive behavior

Desktop/tablet is primary for administrative workflows.

Mobile web must strongly support:

-   Aujourd'hui.
-   Agenda.
-   Patient lookup.
-   Appointment updates.
-   Clinical notes.
-   Contact shortcuts.
-   Public booking.

## 5.4 Localization

Use centralized translation dictionaries.

Example:

``` text
/locales/fr
/locales/ar
```

Arabic must trigger RTL layout.

Never hardcode French UI strings throughout components.

------------------------------------------------------------------------

# 6. Frontend state strategy

Separate:

## Server state

Examples:

-   Patients.
-   Appointments.
-   Invoices.
-   Stock.

Use API/query caching library or framework-supported server-state
strategy.

## Local UI state

Examples:

-   Modal open.
-   Selected tab.
-   Temporary form state.

Avoid duplicating server business state in global frontend stores
unnecessarily.

Backend remains authoritative.

------------------------------------------------------------------------

# 7. Backend module structure

Example:

``` text
app/
  Modules/
    Identity/
      Domain/
      Application/
      Infrastructure/
      Presentation/

    Patients/
      Domain/
      Application/
      Infrastructure/
      Presentation/

    Scheduling/
    Clinical/
    Treatments/
    Billing/
    CashManagement/
    Team/
    Commissions/
    Inventory/
    Communication/
    MasterData/
    Subscriptions/
    Referrals/
    Reporting/
    Audit/
```

Each module owns its business rules.

------------------------------------------------------------------------

# 8. Layer responsibilities

## Domain

Contains:

-   Entities.
-   Value objects.
-   Domain rules.
-   State transitions.
-   Domain events.

## Application

Contains:

-   Use cases.
-   Commands.
-   Queries.
-   Transaction orchestration.
-   Permission checks where use-case specific.

## Infrastructure

Contains:

-   Database repositories.
-   Redis.
-   External providers.
-   Object storage.
-   Provider adapters.

## Presentation

Contains:

-   HTTP controllers.
-   Request validation.
-   API response transformation.

Controllers should remain thin.

------------------------------------------------------------------------

# 9. API style

Recommended V1:

**REST JSON API**

Example:

``` text
/api/v1/patients
/api/v1/appointments
/api/v1/invoices
/api/v1/payments
```

Avoid GraphQL initially unless the team has a strong reason.

REST is simpler for:

-   Authorization.
-   Auditing.
-   Testing.
-   Documentation.
-   External integrations.

------------------------------------------------------------------------

# 10. API versioning

Use:

``` text
/api/v1/
```

Breaking future changes can use:

``` text
/api/v2/
```

Do not version every internal implementation change.

------------------------------------------------------------------------

# 11. API response conventions

Successful collection:

``` json
{
  "data": [],
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 100
  }
}
```

Successful resource:

``` json
{
  "data": {}
}
```

Error:

``` json
{
  "error": {
    "code": "APPOINTMENT_CONFLICT",
    "message": "The selected slot is unavailable.",
    "details": {}
  }
}
```

User-facing translation occurs using stable error codes.

------------------------------------------------------------------------

# 12. Authentication

For a first-party web SaaS, prefer secure cookie-based
authentication/session architecture where frontend/backend deployment
permits it.

Requirements:

-   HTTP-only cookies.
-   Secure flag.
-   SameSite policy.
-   CSRF protection.
-   Session rotation.
-   Password hashing using modern algorithm.
-   Login throttling.
-   Password reset tokens with expiration.

If architecture requires token authentication, use short-lived access
tokens plus secure refresh strategy; do not store long-lived sensitive
tokens in browser localStorage.

------------------------------------------------------------------------

# 13. Authentication lifecycle

``` text
Login
  |
Validate credentials
  |
Resolve user
  |
Create/rotate secure session
  |
Resolve memberships
  |
Select/current tenant
  |
Load subscription state
  |
Return authorized application context
```

------------------------------------------------------------------------

# 14. Tenant context

Tenant must not come from a trusted browser-supplied `tenant_id`.

Recommended resolution:

1.  Authenticated session identifies user.
2.  User selects/has active membership.
3.  Backend resolves current tenant from membership/session.
4.  TenantContext is injected into application layer.
5.  Repositories automatically scope queries.

Example conceptual object:

``` text
TenantContext
- tenant_id
- membership_id
- user_id
- profile_type
- practitioner_id optional
- subscription_status
- permissions
```

------------------------------------------------------------------------

# 15. Authorization pipeline

Every protected request conceptually checks:

``` text
Authenticated?
    |
Active membership?
    |
Correct tenant?
    |
Subscription operational?
    |
Feature entitlement?
    |
Permission?
    |
Resource ownership/governance?
    |
ALLOW
```

Failure at any stage stops execution.

------------------------------------------------------------------------

# 16. Owner/Admin authorization

Owner/Admin has full tenant administrative rights.

However, clinical access across other practitioners must follow the
final governance decision and should not be assumed merely because the
user is financially the tenant owner.

This remains a policy decision before clinical module implementation.

------------------------------------------------------------------------

# 17. Practitioner authorization

Typical rules:

-   Own agenda.
-   Governed patients.
-   Own clinical encounters.
-   Own treatment plans.
-   Other authorized administrative information.

Additional access can be granted by explicit policy.

------------------------------------------------------------------------

# 18. Receptionist authorization

Default:

-   Patient administrative identity.
-   Appointment management.
-   Booking requests.
-   Waiting room.

Optional:

-   Invoice.
-   Payment.
-   Caisse.
-   Expenses.
-   HR.
-   Inventory.
-   Reports.

Clinical access is separate and should normally remain denied.

------------------------------------------------------------------------

# 19. Database

Recommended:

**PostgreSQL**

Reasons:

-   Strong transactions.
-   Constraints.
-   JSONB when appropriate.
-   Excellent indexing.
-   Full-text/trigram search.
-   Row-level security option.
-   Mature backup ecosystem.
-   Reliable financial workloads.

------------------------------------------------------------------------

# 20. Database tenant isolation

Minimum:

-   `tenant_id` on tenant-owned tables.
-   Central tenant-scoped repositories.
-   Authorization policies.
-   Foreign-key validation.
-   Automated cross-tenant tests.

Recommended defense-in-depth:

Evaluate PostgreSQL Row Level Security after application-level tenancy
is stable.

RLS should not be introduced casually because misconfigured policies can
also create operational complexity.

------------------------------------------------------------------------

# 21. Database connection security

Production:

-   Private network where possible.
-   TLS.
-   Dedicated application DB user.
-   No public unrestricted database endpoint.
-   Least-privilege credentials.
-   Separate migration/admin credentials if practical.
-   Secrets managed outside source code.

------------------------------------------------------------------------

# 22. Transactions

Use database transactions for critical operations.

Mandatory examples:

-   Invoice issuance.
-   Payment posting.
-   Payment reversal.
-   Caisse closure.
-   Stock movement.
-   Commission earning.
-   Referral reward.
-   Number allocation.

Never depend on frontend sequence to preserve integrity.

------------------------------------------------------------------------

# 23. Redis

Use Redis for:

-   Queue backend.
-   Rate limiting.
-   Short-lived cache.
-   Session storage if selected.
-   Distributed locks where justified.

Do not use Redis as source of truth for:

-   Payments.
-   Appointments.
-   Patient records.
-   Stock.
-   Subscription.

------------------------------------------------------------------------

# 24. Queue workers

Background workers handle:

-   WhatsApp.
-   SMS.
-   Reminder scheduling.
-   Google Calendar sync.
-   Document generation where heavy.
-   Data exports.
-   Reconciliation jobs.
-   Subscription reminders.
-   Referral validation jobs.

Worker failure must not corrupt business transactions.

------------------------------------------------------------------------

# 25. Outbox architecture

Use transactional outbox.

Example:

``` text
BEGIN TRANSACTION

Appointment -> CONFIRMED
Insert appointment status history
Insert outbox event AppointmentConfirmed

COMMIT

Worker reads outbox
-> WhatsApp/SMS
-> Google Calendar
```

This avoids losing events between database commit and external provider
calls.

------------------------------------------------------------------------

# 26. Scheduled jobs

Scheduler should run jobs such as:

-   Appointment reminders.
-   Installment due checks.
-   Overdue checks.
-   Stock expiration alerts.
-   Subscription expiration transitions.
-   Grace/blackout transitions.
-   Referral validation.
-   Reconciliation.
-   Cleanup of temporary artifacts.

Jobs must be idempotent.

------------------------------------------------------------------------

# 27. Object storage

Use S3-compatible private object storage.

Store:

-   Patient documents.
-   X-rays/images.
-   Generated prescriptions.
-   Invoices.
-   Receipts.
-   Employee documents.
-   Expense attachments.
-   Practice logos.

Do not store binary files directly in PostgreSQL.

------------------------------------------------------------------------

# 28. Secure file access

Flow:

``` text
User requests document
    |
Authentication
    |
Tenant authorization
    |
Patient/clinical permission
    |
Backend authorizes
    |
Temporary signed URL / secure stream
```

Signed URLs should expire quickly.

Never create permanent public patient-document URLs.

------------------------------------------------------------------------

# 29. File upload security

Validate:

-   File size.
-   MIME type.
-   Extension.
-   Tenant storage quota.
-   Filename sanitization.
-   Optional malware scanning.
-   Image/document processing safety.

Generate random storage keys rather than trusting uploaded filenames.

------------------------------------------------------------------------

# 30. WhatsApp architecture

Use provider abstraction:

``` text
CommunicationService
       |
WhatsAppProviderInterface
       |
ProviderAdapter
```

This allows switching providers without rewriting appointment logic.

Domain modules emit communication requests; they do not call provider
APIs directly.

------------------------------------------------------------------------

# 31. SMS architecture

Same abstraction:

``` text
SmsProviderInterface
```

Provider configuration should support Morocco and target customer
economics.

Provider selection remains open.

------------------------------------------------------------------------

# 32. Communication processing

``` text
Business Event
     |
Outbox
     |
Communication Worker
     |
Resolve Template
     |
Resolve Variables
     |
Provider
     |
Callback/Webhook
     |
Update delivery status
```

------------------------------------------------------------------------

# 33. Messaging webhooks

Provider webhook endpoints must:

-   Verify provider signature where available.
-   Rate limit.
-   Validate event.
-   Use provider event ID for idempotency.
-   Never trust arbitrary status updates.
-   Log safe metadata.
-   Update message state.

------------------------------------------------------------------------

# 34. Google Calendar integration

Use OAuth authorization.

Store:

-   External connection metadata.
-   Encrypted token/reference.
-   Selected calendar.
-   Event mappings.

Application remains authoritative for appointment workflow statuses.

Do not let a Google Calendar event silently mark a patient consultation
completed.

------------------------------------------------------------------------

# 35. Calendar synchronization

Recommended initial direction:

**Application -\> Google Calendar**

This is substantially safer for V1 than full bidirectional
synchronization.

Later bidirectional sync can be evaluated with explicit conflict rules.

------------------------------------------------------------------------

# 36. SaaS subscription architecture

Keep separate:

``` text
Patient Billing
vs
SaaS Subscription Billing
```

Subscription service manages:

-   Trial.
-   Plan.
-   Period.
-   Renewal.
-   Grace.
-   Blackout.
-   Referral credits.
-   Entitlements.

------------------------------------------------------------------------

# 37. Subscription payment integration

Use provider adapter:

``` text
SubscriptionPaymentProvider
```

The final provider must be selected based on Moroccan availability,
recurring payment capabilities, fees and compliance.

Backend stores provider references, not raw card details.

------------------------------------------------------------------------

# 38. Subscription webhooks

Typical flow:

``` text
Payment provider
     |
Signed webhook
     |
Idempotency check
     |
Subscription service
     |
Update subscription
     |
Audit
     |
Outbox notifications
```

Never activate subscription solely from a frontend "payment successful"
page.

------------------------------------------------------------------------

# 39. Entitlement service

Centralize plan checks.

Example:

``` text
EntitlementService.can(tenant, "inventory")
EntitlementService.limit(tenant, "max_practitioners")
```

Do not scatter plan-name conditions:

``` text
if plan == "PRO"
```

throughout application code.

This allows pricing plans to change without rewriting business modules.

------------------------------------------------------------------------

# 40. Subscription blackout middleware

For tenant operational routes:

``` text
ACTIVE -> allow
TRIALING -> allow
GRACE -> allow + warning
BLACKOUT -> deny operational action
```

Allowed blackout endpoints:

-   Subscription.
-   Renewal.
-   Support.
-   Logout.

------------------------------------------------------------------------

# 41. Referral security

Referral engine should protect against:

-   Duplicate reward.
-   Existing-customer referral.
-   Self-referral.
-   Trial-only reward.
-   Reversed qualifying payment.
-   Manual abuse.

Use:

-   Unique constraints.
-   Validation period.
-   Admin review.
-   Audit.
-   Idempotent reward application.

------------------------------------------------------------------------

# 42. Public booking architecture

Public booking is unauthenticated and therefore a separate threat
surface.

Endpoint examples:

``` text
GET  /api/v1/public/practices/{slug}
GET  /api/v1/public/practices/{slug}/availability
POST /api/v1/public/practices/{slug}/booking-requests
```

Never expose internal tenant configuration unnecessarily.

------------------------------------------------------------------------

# 43. Public booking protections

Implement:

-   IP/device rate limiting.
-   Request throttling.
-   CAPTCHA/bot challenge when abuse detected.
-   Input validation.
-   Maximum text lengths.
-   Phone normalization.
-   CSRF strategy appropriate to public form.
-   Spam detection.
-   No patient existence disclosure.
-   No unrestricted appointment enumeration.

------------------------------------------------------------------------

# 44. Availability API privacy

Do not expose:

``` text
"Dr X has Patient Ahmed at 10:00"
```

Expose only:

``` text
10:00 unavailable
10:30 available
```

or available slots.

------------------------------------------------------------------------

# 45. Security headers

Production should use:

-   HTTPS only.
-   HSTS.
-   Content-Security-Policy.
-   X-Content-Type-Options.
-   Frame restrictions.
-   Referrer policy.
-   Secure cookie attributes.

CSP should be tuned for required third-party providers.

------------------------------------------------------------------------

# 46. CSRF

If cookie authentication is used:

-   CSRF tokens.
-   SameSite cookies.
-   Origin/referer validation where appropriate.

Public booking POSTs should have separate anti-abuse protections.

------------------------------------------------------------------------

# 47. XSS

Prevent:

-   Rendering unsanitized patient notes as HTML.
-   Unsafe template content.
-   Unsafe filenames.
-   Script injection in custom master data.

Default to text escaping.

Only permit rich text where necessary and sanitize it.

------------------------------------------------------------------------

# 48. SQL injection

Use ORM/query builder parameterization.

Never concatenate user search strings into SQL.

Search filters must use parameterized queries.

------------------------------------------------------------------------

# 49. IDOR prevention

UUIDs alone do not solve authorization.

Every resource lookup requires tenant and permission checks.

Test:

``` text
Tenant A user changes URL UUID to Tenant B invoice
-> 404/403
```

No data leakage in error response.

------------------------------------------------------------------------

# 50. Brute-force protection

Login:

-   Rate limit by account/IP.
-   Progressive delay.
-   Security logging.
-   Optional temporary lock.
-   Future MFA for Owner/Admin.

Password reset:

-   Rate limited.
-   Generic response to prevent account enumeration.

------------------------------------------------------------------------

# 51. Password policy

Use reasonable modern policy:

-   Minimum length.
-   Allow password managers.
-   Do not force unnecessary periodic rotation.
-   Block known-compromised passwords if service available.
-   Strong password hashing.

------------------------------------------------------------------------

# 52. Audit logging

Application audit is separate from infrastructure logs.

Audit sensitive business actions:

-   Clinical changes.
-   Appointment cancellation/reschedule.
-   Invoice issue/cancel.
-   Payment/reversal.
-   Caisse close/adjust.
-   Permission change.
-   Responsible practitioner change.
-   Commission adjustment.
-   Subscription manual changes.

Audit is append-oriented.

------------------------------------------------------------------------

# 53. Application logging

Structured logs should include safe context:

``` text
request_id
user_id
tenant_id
route
status
duration
error_code
```

Avoid:

-   Clinical note content.
-   Password.
-   OAuth token.
-   Full document content.
-   Raw payment credentials.

------------------------------------------------------------------------

# 54. Request IDs

Every incoming request gets a unique request/correlation ID.

Propagate to:

-   API logs.
-   Queue jobs.
-   Outbox processing.
-   Provider calls where possible.

This greatly improves production debugging.

------------------------------------------------------------------------

# 55. Error handling

Production errors return safe messages.

Never return:

-   SQL.
-   Stack traces.
-   Secrets.
-   Filesystem paths.
-   Internal tokens.

Detailed error goes to secure monitoring.

------------------------------------------------------------------------

# 56. Rate limiting

Different policies:

## Authentication

Strict.

## Public booking

Strict/moderate with abuse detection.

## Internal authenticated API

Reasonable per-user limits.

## Webhooks

Provider-aware.

## Export/report generation

Job-based throttling.

------------------------------------------------------------------------

# 57. Data encryption

Minimum:

-   TLS in transit.
-   Managed encryption at rest.
-   Encrypted backups.
-   Encrypted sensitive provider credentials.

Evaluate application-level encryption for particularly sensitive fields
after legal/security assessment.

------------------------------------------------------------------------

# 58. Health-data security

Because the system stores patient health information:

-   Least privilege.
-   Strong tenant isolation.
-   Clinical permission separation.
-   Audit.
-   Private storage.
-   Backup controls.
-   Secure support processes.
-   Data export/deletion governance.
-   Production access restrictions.

Moroccan legal/privacy requirements must be formally reviewed before
launch.

------------------------------------------------------------------------

# 59. Administrative production access

Developers/support should not casually browse production patient data.

Recommended:

-   Named admin accounts.
-   MFA for infrastructure/admin.
-   Least privilege.
-   Time-limited elevated access.
-   Access logging.
-   Break-glass procedure for emergencies.
-   No shared production passwords.

------------------------------------------------------------------------

# 60. Secrets management

Never commit:

-   DB passwords.
-   API tokens.
-   WhatsApp credentials.
-   SMS credentials.
-   OAuth secrets.
-   encryption keys.

Use deployment platform secret/environment management.

Rotate secrets periodically and after suspected compromise.

------------------------------------------------------------------------

# 61. Environment architecture

Minimum:

``` text
Local
Development
Staging
Production
```

Staging should resemble production topology.

Never use real patient data in development/staging unless formally
anonymized and authorized.

------------------------------------------------------------------------

# 62. Local development

Use reproducible local environment.

Example:

``` text
Docker Compose
- frontend
- backend
- postgres
- redis
- local S3-compatible storage
- worker
```

This reduces developer-machine differences.

------------------------------------------------------------------------

# 63. CI pipeline

Every pull request should run:

1.  Dependency installation.
2.  Static analysis.
3.  Lint.
4.  Unit tests.
5.  Application tests.
6.  Database migration test.
7.  Security/dependency scan.
8.  Frontend build.
9.  Backend build/package.

Merge blocked on failure.

------------------------------------------------------------------------

# 64. CD pipeline

Recommended:

``` text
main branch
   |
CI passes
   |
Deploy staging
   |
Smoke tests
   |
Manual/controlled production promotion
   |
Run safe migrations
   |
Deploy application
   |
Health checks
```

Early-stage product does not require overly complex deployment
orchestration.

------------------------------------------------------------------------

# 65. Database migrations in deployment

Rules:

-   Migrations version controlled.
-   Backup before high-risk changes.
-   Avoid destructive migration bundled with code that still needs old
    schema.
-   Prefer expand/migrate/contract.
-   Migration failures stop deployment safely.

------------------------------------------------------------------------

# 66. Production topology --- initial

A reasonable initial production architecture:

``` text
Managed Edge/CDN
      |
Frontend
      |
Backend App
      |
+-----+---------+----------+
|               |          |
PostgreSQL     Redis      Object Storage
                |
              Workers
```

Use managed infrastructure where economically reasonable.

Avoid operating complex Kubernetes clusters at launch.

------------------------------------------------------------------------

# 67. Horizontal scaling

When traffic grows:

-   Multiple backend instances.
-   Multiple frontend instances.
-   Shared PostgreSQL.
-   Shared Redis.
-   Shared object storage.
-   Multiple workers.
-   Load balancer.

Application instances must be stateless aside from external
session/cache storage.

------------------------------------------------------------------------

# 68. Database scaling

Order of operations:

1.  Correct indexes.
2.  Query optimization.
3.  Connection pooling.
4.  Increase managed DB resources.
5.  Read replicas for reporting if needed.
6.  Partition/warehouse only when justified.

Do not shard by tenant prematurely.

------------------------------------------------------------------------

# 69. Queue scaling

Separate queues by workload:

``` text
critical
notifications
calendar
documents
reports
maintenance
```

Payments/subscription-critical jobs receive higher priority than bulk
reports.

------------------------------------------------------------------------

# 70. Monitoring

Monitor:

## Application

-   Error rate.
-   Response latency.
-   Request volume.
-   Failed jobs.
-   Queue depth.

## Database

-   CPU.
-   Connections.
-   Slow queries.
-   Storage.
-   Replication/backup status.

## Redis

-   Memory.
-   Queue health.

## Integrations

-   WhatsApp failures.
-   SMS failures.
-   Google Calendar failures.
-   Subscription webhook failures.

------------------------------------------------------------------------

# 71. Health endpoints

Provide internal/secured health checks:

``` text
/health/live
/health/ready
```

Readiness verifies critical dependencies appropriately without exposing
sensitive information.

------------------------------------------------------------------------

# 72. Alerting

Alert on:

-   Elevated 5xx.
-   Database unavailable.
-   Queue stalled.
-   Backup failure.
-   Disk/storage pressure.
-   Subscription webhook repeated failure.
-   Messaging provider outage.
-   Security anomaly.
-   Reconciliation discrepancy.

Avoid alert fatigue.

------------------------------------------------------------------------

# 73. Backup architecture

PostgreSQL:

-   Automated daily backups minimum.
-   Point-in-time recovery preferred.
-   Retention policy.
-   Encrypted backups.

Object storage:

-   Durability.
-   Versioning/retention where appropriate.

Redis:

Not treated as authoritative business backup.

------------------------------------------------------------------------

# 74. Restore testing

A backup is not trustworthy until restored.

Schedule restore exercises:

-   Database restore.
-   Object/document availability.
-   Application boot.
-   Key workflow validation.

Document recovery procedure.

------------------------------------------------------------------------

# 75. RPO / RTO

Before launch define:

**RPO** --- maximum acceptable data loss.

**RTO** --- maximum acceptable outage duration.

For medical-practice operations, targets should be conservative but
economically realistic for an early SaaS.

Final values remain an operational decision.

------------------------------------------------------------------------

# 76. Business continuity

If WhatsApp/SMS fails:

-   Core application continues.
-   Message remains queued/failed.
-   Staff sees status.
-   Retry later.

If Google Calendar fails:

-   Internal agenda remains authoritative.

If reporting fails:

-   Core patient/payment workflows continue.

External integrations should not bring down the core practice system.

------------------------------------------------------------------------

# 77. Testing architecture

Use layered testing.

## Unit

Domain rules:

-   Status transitions.
-   Commission calculations.
-   Invoice totals.
-   Entitlements.
-   Appointment validation.

## Application

Use-case orchestration.

## Integration

-   PostgreSQL repositories.
-   Redis.
-   Object storage adapter.
-   Provider adapters with test doubles.

## Feature/API

Real HTTP requests against test DB.

## End-to-end

Critical browser journeys.

------------------------------------------------------------------------

# 78. Mandatory security tests

Automate:

-   Cross-tenant IDOR.
-   Practitioner governance.
-   Reception clinical denial.
-   Subscription blackout.
-   Permission denial.
-   Public booking abuse limits.
-   File authorization.
-   Webhook signature/idempotency.
-   Payment duplicate prevention.

------------------------------------------------------------------------

# 79. Golden-path E2E tests

At minimum:

## Solo

Patient -\> RDV -\> consultation -\> invoice -\> cash -\> receipt -\>
caisse.

## Reception/practitioner

Reception schedules -\> practitioner consults -\> reception bills.

## Public booking

Request -\> validation -\> confirmation -\> reminder.

## Kiné

Treatment -\> sessions -\> partial payment -\> progress.

## Subscription

Trial -\> active -\> expiry -\> grace -\> blackout -\> renewal.

------------------------------------------------------------------------

# 80. API documentation

Generate/maintain OpenAPI documentation.

Each endpoint defines:

-   Method.
-   Path.
-   Authentication.
-   Permission.
-   Request schema.
-   Response schema.
-   Errors.
-   Idempotency requirements.

OpenAPI should be CI-validated.

------------------------------------------------------------------------

# 81. Example patient APIs

``` text
GET    /api/v1/patients
POST   /api/v1/patients
GET    /api/v1/patients/{patient}
PATCH  /api/v1/patients/{patient}

GET    /api/v1/patients/{patient}/appointments
GET    /api/v1/patients/{patient}/clinical
GET    /api/v1/patients/{patient}/treatments
GET    /api/v1/patients/{patient}/invoices
GET    /api/v1/patients/{patient}/payments
```

Patient deletion is intentionally not a generic DELETE endpoint until
governance is defined.

------------------------------------------------------------------------

# 82. Example appointment APIs

``` text
GET    /api/v1/appointments
POST   /api/v1/appointments
GET    /api/v1/appointments/{appointment}
PATCH  /api/v1/appointments/{appointment}

POST /api/v1/appointments/{appointment}/confirm
POST /api/v1/appointments/{appointment}/arrive
POST /api/v1/appointments/{appointment}/waiting
POST /api/v1/appointments/{appointment}/start
POST /api/v1/appointments/{appointment}/complete
POST /api/v1/appointments/{appointment}/reschedule
POST /api/v1/appointments/{appointment}/cancel
POST /api/v1/appointments/{appointment}/no-show
```

Explicit action endpoints are preferable for state transitions over
arbitrary status PATCHing.

------------------------------------------------------------------------

# 83. Example finance APIs

``` text
POST /api/v1/invoices
POST /api/v1/invoices/{invoice}/issue
POST /api/v1/invoices/{invoice}/cancel

POST /api/v1/invoices/{invoice}/installments

POST /api/v1/payments
POST /api/v1/payments/{payment}/reverse

GET  /api/v1/receipts/{receipt}

POST /api/v1/caisse/open
POST /api/v1/caisse/{session}/close
POST /api/v1/caisse/{session}/adjustments

POST /api/v1/expenses
```

Payment creation should support idempotency key.

------------------------------------------------------------------------

# 84. Example inventory APIs

``` text
GET  /api/v1/stock/items
POST /api/v1/stock/items

POST /api/v1/stock/movements/in
POST /api/v1/stock/movements/out
POST /api/v1/stock/movements/adjust

GET /api/v1/stock/alerts
```

------------------------------------------------------------------------

# 85. API pagination

Use cursor pagination for very large/high-change feeds where needed;
conventional page pagination is sufficient for most V1 admin tables.

Default:

``` text
25 rows
```

Allow controlled options such as:

``` text
25 / 50 / 100
```

Never allow unbounded list endpoints.

------------------------------------------------------------------------

# 86. API filtering

Standardize query parameters:

``` text
?search=
?status=
?practitioner_id=
?date_from=
?date_to=
?page=
?per_page=
```

Whitelist sortable/filterable fields.

Do not accept arbitrary SQL-like filters.

------------------------------------------------------------------------

# 87. API idempotency

For sensitive POST:

``` text
Idempotency-Key: <uuid>
```

Recommended for:

-   Payments.
-   Stock movements.
-   Subscription callbacks/actions.
-   Potentially expense posting.

Store result/fingerprint for safe retries.

------------------------------------------------------------------------

# 88. Optimistic locking

For frequently edited resources, consider version column:

``` text
version INTEGER
```

Client submits expected version.

Useful for:

-   Appointment reschedule.
-   Patient administrative profile.
-   Treatment plan.
-   Settings.

Financial posting uses stronger transaction locking.

------------------------------------------------------------------------

# 89. Caching

Safe candidates:

-   Global master data.
-   Tenant settings.
-   Entitlements.
-   Static reference lists.

Avoid stale caching for:

-   Invoice balances.
-   Caisse.
-   Stock where correctness matters.
-   Appointment conflicts.

Cache invalidation must be explicit.

------------------------------------------------------------------------

# 90. Performance targets

Initial targets should aim for:

-   Common API operations responsive under normal Moroccan
    broadband/mobile conditions.
-   Patient search near-instant for small/medium tenants.
-   Agenda load optimized by date/practitioner.
-   Heavy reports asynchronous if needed.

Exact SLOs can be defined before production.

------------------------------------------------------------------------

# 91. Accessibility

Web application should follow practical accessibility standards:

-   Keyboard navigation.
-   Visible focus.
-   Semantic labels.
-   Sufficient contrast.
-   Form error association.
-   RTL support.
-   Screen-reader-friendly controls.

------------------------------------------------------------------------

# 92. Browser support

Support current major browsers:

-   Chrome.
-   Edge.
-   Firefox.
-   Safari where practical.

Responsive web should support modern mobile browsers.

------------------------------------------------------------------------

# 93. Feature flags

Use feature flags for:

-   Controlled rollout.
-   Specialty experiments.
-   Beta integrations.
-   New billing features.

Do not confuse feature flags with subscription entitlements.

Feature flag = deployment/product rollout.

Entitlement = customer commercial access.

------------------------------------------------------------------------

# 94. Privacy by design

Engineering principles:

-   Collect only needed data.
-   Separate clinical/admin permissions.
-   Minimize support access.
-   Private files.
-   Avoid sensitive logs.
-   Export/retention mechanisms.
-   Explicit audit.
-   Secure defaults.

Formal Moroccan privacy/legal assessment remains required.

------------------------------------------------------------------------

# 95. Security review before launch

Required review areas:

1.  Authentication.
2.  Authorization.
3.  Tenant isolation.
4.  Practitioner governance.
5.  File access.
6.  Public booking.
7.  Injection/XSS.
8.  CSRF.
9.  Secrets.
10. Logging.
11. Backup.
12. Provider webhooks.
13. Subscription blackout.
14. Financial idempotency.
15. Admin/support access.
16. Dependency vulnerabilities.

A penetration test is strongly recommended before significant production
scale.

------------------------------------------------------------------------

# 96. Initial engineering environments

Recommended:

## Development

Synthetic data only.

## Staging

Production-like infrastructure with synthetic/anonymized data.

## Production

Real customers.

Access strictly controlled.

Separate credentials and databases.

------------------------------------------------------------------------

# 97. Initial infrastructure philosophy

Prefer managed services.

Do not initially build:

-   Kubernetes.
-   Service mesh.
-   Custom database cluster.
-   Custom object storage.
-   Complex event streaming platform.

Focus engineering effort on the product.

------------------------------------------------------------------------

# 98. Future extraction candidates

Only when scale justifies it:

-   Communication service.
-   Document generation.
-   Reporting/analytics.
-   Search.
-   Subscription billing.

Core patient/billing transactions can remain together longer because
they benefit from strong transactional consistency.

------------------------------------------------------------------------

# 99. Recommended implementation sequence

Technical foundation should be built in this order:

``` text
1. Repository / CI
2. Environment / Docker
3. Backend skeleton
4. Frontend skeleton
5. PostgreSQL / migrations
6. Authentication
7. Tenancy
8. Permissions
9. Subscription middleware
10. Audit/outbox
11. Master data
12. Patients
13. Scheduling
14. Clinical
15. Treatments
16. Billing
17. Payments/Caisse
18. Team/HR
19. Commissions
20. Inventory
21. Communication
22. Integrations
23. Reporting
24. SaaS Admin
25. Hardening
```

------------------------------------------------------------------------

# 100. Definition of technical readiness

Before feature development accelerates, foundation must prove:

-   User can authenticate.
-   Tenant context cannot be spoofed.
-   Cross-tenant access test fails safely.
-   Permission policy works.
-   Subscription state middleware works.
-   Audit event can be written.
-   Outbox event can be processed.
-   Queue works.
-   Object storage works.
-   FR/AR shell works.
-   CI runs tests.
-   Staging deploy works.
-   Backup procedure exists.

------------------------------------------------------------------------

# 101. Open technical decisions

Before starting implementation, decide:

1.  Laravel vs NestJS.
2.  Hosting provider/region.
3.  PostgreSQL managed provider.
4.  Redis provider.
5.  Object storage provider.
6.  WhatsApp provider.
7.  SMS provider.
8.  Subscription payment provider.
9.  Session/cookie deployment topology.
10. PostgreSQL RLS yes/no for V1.
11. Trial duration.
12. Production RPO/RTO.
13. Monitoring/error-tracking provider.
14. Email provider for account/system email.
15. Final Moroccan legal/privacy hosting requirements.

These should be resolved in the engineering kickoff, but most do not
block backlog preparation.

------------------------------------------------------------------------

# 102. Next project artifact

With Specifications #1--#5 established, the project should now move from
architecture into execution planning.

## Specification 06 --- MVP Scope, Epics, Development Backlog & Sprint Plan

It should define:

-   V1 scope freeze.
-   Must/Should/Could/Later.
-   Epics.
-   User stories.
-   Acceptance criteria.
-   Dependencies.
-   Engineering tasks.
-   Test requirements.
-   Sprint order.
-   Definition of Done.
-   Release gates.
-   Beta/pilot plan.
-   Production launch checklist.
-   Post-launch roadmap.

This will be the bridge from product architecture to actual coding.

------------------------------------------------------------------------

# 103. Technical architecture summary

``` text
                          USERS
                            |
                    HTTPS / CDN / WAF
                            |
              +-------------+-------------+
              |                           |
          NEXT.JS                      PUBLIC BOOKING
              |                           |
              +-------------+-------------+
                            |
                         REST API
                            |
                     MODULAR MONOLITH
                            |
     +----------+-----------+-----------+-----------+
     |          |           |           |           |
 Patients   Scheduling   Clinical    Billing      Team
     |          |           |           |           |
     +----------+-----------+-----------+-----------+
                            |
                      APPLICATION CORE
                            |
         +------------------+------------------+
         |                  |                  |
     PostgreSQL           Redis          Object Storage
         |                  |
         |             Queue Workers
         |                  |
         |        +---------+---------+---------+
         |        |                   |         |
         |     WhatsApp              SMS     Google Calendar
         |
      Audit + Outbox
         |
   Subscription / Referral

CROSS-CUTTING:
Authentication
Tenant Isolation
Practitioner Governance
Permissions
Entitlements
Audit
Encryption
Observability
Backups
FR/AR Localization
```

The architecture intentionally prioritizes correctness, simplicity and
rapid product delivery while preserving a clear scaling path.
