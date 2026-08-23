# Healthcare Practice Management SaaS

## Specification 04 --- Domain Model, Data Architecture & Entity Relationship Design

**Market:** Morocco\
**Product:** Multi-tenant, bilingual FR/AR Healthcare Practice
Management SaaS\
**Architecture goal:** Solo-first, cabinet-capable, secure by tenant and
practitioner governance, financially auditable, modular and extensible.

------------------------------------------------------------------------

# 1. Purpose

This specification converts the approved product blueprint, screen map
and end-to-end workflows into an implementation-ready domain and data
model.

It defines:

-   Domain boundaries.
-   Core entities.
-   Ownership and tenancy.
-   Practitioner-governed patient access.
-   Entity relationships.
-   Key attributes.
-   Status/state fields.
-   Financial transaction structure.
-   Cash-register structure.
-   Treatment/session structure.
-   HR and commission structures.
-   Inventory movement model.
-   Communication model.
-   SaaS subscription/referral model.
-   Master-data model.
-   Audit architecture.
-   File/document storage metadata.
-   Search/indexing requirements.
-   Uniqueness constraints.
-   Soft deletion/deactivation.
-   Transaction boundaries.
-   ER diagrams.
-   Database implementation recommendations.

------------------------------------------------------------------------

# 2. Architectural principles

## 2.1 Tenant is the primary isolation boundary

A tenant represents one subscribing practice/cabinet.

``` text
Platform
|
|-- Tenant A — Solo dentist
|-- Tenant B — Kiné cabinet
|-- Tenant C — Psychology practice
`-- Tenant D — Multi-practitioner cabinet
```

Operational records must never cross tenants.

## 2.2 Practitioner governance is a second boundary

Inside a tenant, a patient has a responsible practitioner.

``` text
Tenant
|
|-- Practitioner A
|   `-- Governed Patients A
|
|-- Practitioner B
|   `-- Governed Patients B
|
`-- Reception
    `-- Administrative access according to permission
```

Tenant membership alone does not automatically grant unrestricted
clinical access.

## 2.3 One database model, logical isolation

Recommended V1 architecture:

-   PostgreSQL.
-   Shared application database.
-   `tenant_id` on tenant-owned tables.
-   Server-side tenant scoping.
-   Strong authorization layer.
-   Database constraints.
-   Optional PostgreSQL Row Level Security as defense-in-depth after
    careful implementation/testing.

Separate physical databases per practitioner are not required for the
initial target scale.

## 2.4 UUID identifiers

Use UUID/UUIDv7-style primary identifiers where supported.

Benefits:

-   Harder to enumerate.
-   Distributed-safe.
-   Suitable for public/API identifiers.
-   Avoid tenant-local integer leakage.

Human-facing references remain separate.

Example:

``` text
Internal ID: 019c...
Patient Number: PAT-000281
Invoice Number: FAC-2026-00142
Receipt Number: REC-2026-00382
```

## 2.5 Money

Never use floating-point values for money.

Recommended:

``` text
NUMERIC(14,2)
```

Currency initially fixed to MAD but store currency code where financial
records may later require extensibility.

## 2.6 Time

Store timestamps timezone-aware.

Recommended database type:

``` text
TIMESTAMPTZ
```

Practice timezone is configurable, initially Morocco-oriented.

## 2.7 Financial records are append/correction oriented

Posted financial activity should not be hard-edited or deleted.

Use:

-   Reversal.
-   Cancellation.
-   Adjustment.
-   Status history.
-   Audit log.

------------------------------------------------------------------------

# 3. Domain map

``` text
PLATFORM / SaaS
|
|-- Identity & Access
|-- Tenant / Practice
|-- Subscription & Referral
|-- Global Master Data
|-- SaaS Administration
|
`-- TENANT BUSINESS DOMAIN
    |
    |-- Patients
    |-- Clinical / Dossier Santé
    |-- Scheduling / Appointments
    |-- Treatments / Sessions
    |-- Billing / Invoices
    |-- Payments / Installments
    |-- Caisse / Expenses
    |-- Team / HR
    |-- Commissions
    |-- Inventory
    |-- Communication
    |-- Documents
    |-- Reporting
    `-- Audit
```

------------------------------------------------------------------------

# 4. Identity & access domain

## 4.1 users

Represents a human login identity.

### Key fields

``` text
id UUID PK
email VARCHAR UNIQUE
phone VARCHAR NULL
password_hash
first_name
last_name
preferred_language ENUM(fr, ar)
status ENUM(invited, active, disabled, locked)
last_login_at TIMESTAMPTZ NULL
created_at
updated_at
```

A user may theoretically belong to more than one tenant in the future,
so tenant membership is separate.

## 4.2 tenant_memberships

Connects users to tenants.

``` text
id UUID PK
tenant_id UUID FK
user_id UUID FK
profile_type ENUM(owner_admin, practitioner, staff)
status ENUM(invited, active, disabled)
is_owner BOOLEAN
joined_at
created_at
updated_at
```

Constraint:

``` text
UNIQUE(tenant_id, user_id)
```

## 4.3 membership_permissions

Stores explicit lightweight permission grants.

``` text
id UUID PK
tenant_membership_id UUID FK
permission_code VARCHAR
allowed BOOLEAN
created_at
updated_at
```

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

Owner/Admin can be resolved as full access rather than requiring every
permission row.

------------------------------------------------------------------------

# 5. Tenant / Practice domain

## 5.1 tenants

``` text
id UUID PK
name
slug
specialty_id UUID NULL
phone
email NULL
address NULL
city NULL
logo_file_id UUID NULL
preferred_language ENUM(fr, ar)
currency_code CHAR(3) DEFAULT 'MAD'
timezone
status ENUM(active, suspended, closed)
created_at
updated_at
```

`slug` supports:

``` text
app.ma/book/{slug}
```

Constraint:

``` text
UNIQUE(slug)
```

## 5.2 tenant_settings

Key/value or structured settings for:

-   Appointment behavior.
-   Reminder configuration.
-   Financial preferences.
-   Language.
-   Document preferences.
-   Stock thresholds.
-   Other non-core settings.

Prefer typed columns/configuration tables for critical business rules
rather than putting everything in JSON.

## 5.3 practice_locations

V1 may use one location, but model location explicitly for future
growth.

``` text
id UUID PK
tenant_id
name
address
city
phone
is_primary
active
```

This prevents future migration when multi-location support is
introduced.

------------------------------------------------------------------------

# 6. Practitioner and staff domain

## 6.1 practitioners

A practitioner is a professional profile linked to a tenant
membership/user.

``` text
id UUID PK
tenant_id
tenant_membership_id UUID FK
display_name
specialty_id
professional_identifier NULL
active BOOLEAN
created_at
updated_at
```

Owner/Admin may simultaneously have a practitioner profile.

## 6.2 employees

Represents HR/employment information.

``` text
id UUID PK
tenant_id
tenant_membership_id UUID NULL
employee_number
employment_type
start_date
end_date NULL
status ENUM(active, inactive, terminated)
base_salary NUMERIC(14,2) NULL
notes NULL
created_at
updated_at
```

Practitioners and reception staff can both have employee records where
HR management applies.

## 6.3 employee_documents

``` text
id
tenant_id
employee_id
document_type_id
file_id
title
document_date
expires_at NULL
created_at
```

------------------------------------------------------------------------

# 7. Patient domain

## 7.1 patients

Central patient entity.

``` text
id UUID PK
tenant_id UUID FK
patient_number VARCHAR
responsible_practitioner_id UUID FK
first_name
last_name
phone
secondary_phone NULL
email NULL
date_of_birth NULL
sex NULL
address NULL
city NULL
emergency_contact_name NULL
emergency_contact_phone NULL
status ENUM(active, inactive, archived)
created_at
updated_at
```

Constraints:

``` text
UNIQUE(tenant_id, patient_number)
```

Phone is not globally unique because:

-   Families may share phones.
-   Data quality may vary.
-   Duplicate detection should be probabilistic/business-rule based, not
    simply database uniqueness.

## 7.2 patient_governance_history

Tracks responsible practitioner changes.

``` text
id
tenant_id
patient_id
old_practitioner_id NULL
new_practitioner_id
changed_by_membership_id
reason NULL
changed_at
```

## 7.3 patient_access_grants --- future-ready

For controlled sharing without changing responsible practitioner.

``` text
id
tenant_id
patient_id
practitioner_id
access_scope
granted_by
starts_at
ends_at NULL
status
```

Can remain dormant until sharing workflow is formally approved.

------------------------------------------------------------------------

# 8. Patient duplicate detection

Do not merge automatically.

Potential normalized comparison fields:

``` text
normalized_first_name
normalized_last_name
normalized_phone
date_of_birth
```

Possible matching signals:

-   Same phone + similar name.
-   Same full name + date of birth.
-   Same phone + date of birth.

System returns probable matches; authorized user decides.

Store duplicate decisions if useful to prevent repeated warnings.

------------------------------------------------------------------------

# 9. Clinical / Dossier Santé domain

Clinical information and documents are presented as one UX area but
should use structured entities underneath.

## 9.1 clinical_encounters

Represents consultation/session clinical activity.

``` text
id UUID PK
tenant_id
patient_id
practitioner_id
appointment_id NULL
treatment_session_id NULL
encounter_type_id
started_at NULL
completed_at NULL
status ENUM(draft, active, completed, amended)
summary NULL
created_by
created_at
updated_at
```

## 9.2 clinical_entries

Flexible structured clinical observations.

``` text
id
tenant_id
patient_id
clinical_encounter_id NULL
practitioner_id
entry_type_id
value_text NULL
value_numeric NULL
value_date NULL
value_json NULL
notes NULL
recorded_at
created_at
updated_at
```

Use typed columns for common value types; JSON may hold
specialty-specific structured content but should not replace the entire
relational model.

## 9.3 patient_health_flags

Useful for prominent persistent information:

``` text
id
tenant_id
patient_id
flag_type
master_data_item_id NULL
custom_label NULL
details NULL
active
recorded_by_practitioner_id
```

Examples:

-   Allergy.
-   Relevant condition.
-   Current medication.

## 9.4 clinical_amendments

For sensitive completed clinical records, amendments should be
traceable.

``` text
id
tenant_id
clinical_entry_id
amended_by
reason
previous_value_snapshot
new_value_snapshot
created_at
```

Exact medical-record immutability policy requires Moroccan legal review.

------------------------------------------------------------------------

# 10. File and document architecture

## 10.1 files

Central metadata for object storage.

``` text
id UUID PK
tenant_id UUID NULL
storage_provider
storage_key
original_filename
mime_type
size_bytes
checksum
uploaded_by_user_id
created_at
```

The actual binary is stored in object storage, not PostgreSQL.

## 10.2 patient_documents

``` text
id
tenant_id
patient_id
clinical_encounter_id NULL
document_type_id
file_id
title
description NULL
document_date NULL
practitioner_id NULL
visibility_scope
created_at
updated_at
```

## 10.3 generated_documents

For invoices, receipts, prescriptions, certificates, reports.

``` text
id
tenant_id
document_kind
business_entity_type
business_entity_id
file_id
document_number NULL
template_version_id NULL
generated_by
generated_at
```

Generated financial documents should remain reproducible/auditable.

------------------------------------------------------------------------

# 11. Scheduling domain

## 11.1 appointments

``` text
id UUID PK
tenant_id
appointment_reference
patient_id
practitioner_id
location_id NULL
service_id NULL
reason_text NULL
source ENUM(reception, practitioner, public_booking)
scheduling_mode ENUM(exact, window)
scheduled_start TIMESTAMPTZ
window_end TIMESTAMPTZ NULL
duration_minutes INTEGER
status
internal_notes NULL
confirmed_at NULL
arrived_at NULL
waiting_at NULL
consultation_started_at NULL
completed_at NULL
cancelled_at NULL
cancellation_reason NULL
created_by_membership_id NULL
created_at
updated_at
```

Rules:

-   `exact`: `window_end` null.
-   `window`: `window_end > scheduled_start`.
-   `duration_minutes > 0`.

## 11.2 appointment_status_history

``` text
id
tenant_id
appointment_id
from_status NULL
to_status
changed_by_membership_id NULL
source
reason NULL
changed_at
```

## 11.3 appointment_reschedules

``` text
id
tenant_id
appointment_id
old_start
old_window_end NULL
new_start
new_window_end NULL
changed_by
reason NULL
created_at
```

## 11.4 public_booking_requests

Keep request separate from confirmed appointment.

``` text
id
tenant_id
public_reference
first_name
last_name
phone
service_id NULL
reason_text NULL
requested_start
requested_window_end NULL
comment NULL
status ENUM(requested, to_confirm, alternative_proposed, confirmed, rejected, cancelled)
matched_patient_id NULL
appointment_id NULL
created_at
updated_at
```

This avoids creating full patient/appointment records for spam or
rejected requests.

------------------------------------------------------------------------

# 12. Availability domain

## 12.1 practitioner_working_hours

``` text
id
tenant_id
practitioner_id
weekday
start_time
end_time
active
```

## 12.2 practitioner_breaks

``` text
id
tenant_id
practitioner_id
weekday
start_time
end_time
```

## 12.3 availability_exceptions

``` text
id
tenant_id
practitioner_id
date
start_time NULL
end_time NULL
type ENUM(unavailable, custom_available)
reason NULL
```

Approved leave can generate/participate in availability exclusions.

Future:

-   Room resource.
-   Equipment resource.
-   Capacity slot.

------------------------------------------------------------------------

# 13. Services and pricing

## 13.1 tenant_services

``` text
id
tenant_id
global_master_item_id NULL
name_fr
name_ar NULL
specialty_id NULL
default_duration_minutes
price NUMERIC(14,2)
currency_code DEFAULT 'MAD'
scheduling_mode ENUM(exact, window)
active
created_at
updated_at
```

## 13.2 practitioner_services

Optional many-to-many if not every practitioner offers every service.

``` text
practitioner_id
tenant_service_id
custom_duration_minutes NULL
custom_price NULL
active
```

------------------------------------------------------------------------

# 14. Treatment domain

## 14.1 treatment_plans

``` text
id UUID PK
tenant_id
treatment_reference
patient_id
responsible_practitioner_id
treatment_type_id NULL
name
description NULL
start_date
expected_end_date NULL
planned_session_count NULL
status ENUM(draft, planned, active, paused, completed, cancelled)
planned_value NUMERIC(14,2) NULL
created_at
updated_at
```

## 14.2 treatment_sessions

``` text
id
tenant_id
treatment_plan_id
sequence_number
service_id NULL
practitioner_id
appointment_id NULL
clinical_encounter_id NULL
planned_date NULL
actual_date NULL
status ENUM(planned, scheduled, completed, missed, cancelled)
notes NULL
created_at
updated_at
```

Constraint:

``` text
UNIQUE(treatment_plan_id, sequence_number)
```

A cancelled session does not cancel treatment plan.

------------------------------------------------------------------------

# 15. Billing domain

## 15.1 invoices

``` text
id UUID PK
tenant_id
invoice_number
patient_id
practitioner_id
appointment_id NULL
treatment_plan_id NULL
issue_date
due_date NULL
currency_code DEFAULT 'MAD'
subtotal NUMERIC(14,2)
discount_total NUMERIC(14,2)
tax_total NUMERIC(14,2)
total_amount NUMERIC(14,2)
paid_amount NUMERIC(14,2)
remaining_amount NUMERIC(14,2)
status ENUM(draft, issued, partially_paid, paid, overdue, cancelled)
notes NULL
issued_at NULL
cancelled_at NULL
created_by
created_at
updated_at
```

Constraints:

``` text
UNIQUE(tenant_id, invoice_number)
total_amount >= 0
paid_amount >= 0
remaining_amount >= 0
```

Prefer deriving/checking:

``` text
remaining_amount = total_amount - valid posted payments
```

Stored totals can be used for performance but must be transactionally
reconciled.

## 15.2 invoice_lines

``` text
id
tenant_id
invoice_id
service_id NULL
description
quantity NUMERIC
unit_price NUMERIC(14,2)
discount_amount NUMERIC(14,2)
tax_rate NUMERIC NULL
tax_amount NUMERIC(14,2)
line_total NUMERIC(14,2)
practitioner_id NULL
created_at
```

Line-level practitioner supports commission attribution.

## 15.3 invoice_status_history

Track issue/cancel/payment-related transitions.

------------------------------------------------------------------------

# 16. Installments

## 16.1 installments

``` text
id
tenant_id
invoice_id
sequence_number
due_date
expected_amount NUMERIC(14,2)
paid_amount NUMERIC(14,2)
remaining_amount NUMERIC(14,2)
status ENUM(upcoming, due, partially_paid, paid, overdue)
created_at
updated_at
```

Constraint:

``` text
UNIQUE(invoice_id, sequence_number)
```

The sum of active installment expected amounts should not exceed
relevant invoice outstanding/planned amount under defined policy.

------------------------------------------------------------------------

# 17. Payments

## 17.1 payments

``` text
id UUID PK
tenant_id
payment_reference
patient_id
invoice_id
installment_id NULL
amount NUMERIC(14,2)
currency_code DEFAULT 'MAD'
payment_method_id
payment_date TIMESTAMPTZ
status ENUM(posted, reversed)
cash_register_session_id NULL
recorded_by_membership_id
reversal_of_payment_id NULL
reversal_reason NULL
idempotency_key NULL
created_at
```

Constraints:

``` text
UNIQUE(tenant_id, payment_reference)
UNIQUE(tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL
amount > 0
```

Do not delete posted payments.

## 17.2 payment_allocations --- recommended

For future flexibility, separate payment from allocation.

``` text
id
tenant_id
payment_id
invoice_id
installment_id NULL
amount
created_at
```

Even if V1 UI pays one invoice at a time, this avoids redesign if one
payment later covers multiple obligations.

## 17.3 receipts

``` text
id
tenant_id
receipt_number
payment_id
patient_id
issued_at
status ENUM(valid, voided)
generated_document_id NULL
created_at
```

Constraint:

``` text
UNIQUE(tenant_id, receipt_number)
```

------------------------------------------------------------------------

# 18. Caisse domain

## 18.1 cash_register_sessions

``` text
id UUID PK
tenant_id
location_id NULL
business_date DATE
opened_by
opened_at
opening_balance NUMERIC(14,2)
expected_closing_balance NUMERIC(14,2) NULL
physical_closing_balance NUMERIC(14,2) NULL
difference_amount NUMERIC(14,2) NULL
difference_reason NULL
closed_by NULL
closed_at NULL
status ENUM(open, closed)
created_at
```

## 18.2 cash_movements

All caisse changes are movement-based.

``` text
id UUID PK
tenant_id
cash_register_session_id
movement_type ENUM(cash_in, cash_out, adjustment)
source_type ENUM(patient_payment, expense, correction, manual_authorized)
source_id UUID NULL
amount NUMERIC(14,2)
direction ENUM(in, out)
description
recorded_by
reversal_of_movement_id NULL
created_at
```

Expected cash:

``` text
opening_balance
+ SUM(valid IN)
- SUM(valid OUT)
```

Do not manually overwrite balance.

------------------------------------------------------------------------

# 19. Expenses / Décaissements

## 19.1 expenses

``` text
id
tenant_id
expense_reference
expense_date
category_id
beneficiary_name
description
amount NUMERIC(14,2)
currency_code DEFAULT 'MAD'
payment_method_id
cash_register_session_id NULL
supporting_file_id NULL
status ENUM(posted, reversed)
recorded_by
created_at
```

If cash:

``` text
Expense -> Cash Movement OUT
```

If non-cash:

No cash movement.

------------------------------------------------------------------------

# 20. HR scheduling and leave

## 20.1 employee_work_schedules

``` text
id
tenant_id
employee_id
weekday
start_time
end_time
active
```

## 20.2 leave_requests

``` text
id
tenant_id
employee_id
leave_type_id
start_date
end_date
partial_day_data NULL
reason NULL
attachment_file_id NULL
status ENUM(draft, submitted, approved, rejected, cancelled)
submitted_at NULL
decided_by NULL
decided_at NULL
decision_note NULL
created_at
updated_at
```

No clock-in/out entity is required in V1.

------------------------------------------------------------------------

# 21. Payroll domain

## 21.1 payroll_periods

``` text
id
tenant_id
period_year
period_month
status ENUM(draft, reviewed, finalized)
created_at
```

Constraint:

``` text
UNIQUE(tenant_id, period_year, period_month)
```

## 21.2 payroll_entries

``` text
id
tenant_id
payroll_period_id
employee_id
base_salary
bonus_amount
overtime_amount
commission_amount
deduction_amount
other_adjustment_amount
net_operational_amount
payment_status ENUM(unpaid, paid)
paid_at NULL
notes NULL
```

This is operational payroll, not a claim of statutory Moroccan payroll
compliance.

------------------------------------------------------------------------

# 22. Commission domain

## 22.1 commission_rules

``` text
id
tenant_id
practitioner_id
service_id NULL
basis_type ENUM(collected_amount, invoiced_amount, fixed_per_service)
rate_percent NULL
fixed_amount NULL
effective_from
effective_to NULL
active
```

## 22.2 commission_earnings

``` text
id
tenant_id
practitioner_id
commission_rule_id
source_type ENUM(payment_allocation, invoice_line, service_completion)
source_id
eligible_base_amount
commission_amount
earned_at
payroll_period_id NULL
status ENUM(earned, included_in_payroll, paid, reversed)
created_at
```

Critical uniqueness should prevent double earning from same source/rule.

## 22.3 commission_adjustments

``` text
id
tenant_id
practitioner_id
period_reference
amount
reason
created_by
created_at
```

Manual adjustment is separate from calculated earning.

------------------------------------------------------------------------

# 23. Inventory domain

## 23.1 stock_items

``` text
id
tenant_id
item_code
global_master_item_id NULL
name_fr
name_ar NULL
category_id
unit_id
minimum_stock NUMERIC
lot_tracking BOOLEAN
expiration_tracking BOOLEAN
active
created_at
updated_at
```

Constraint:

``` text
UNIQUE(tenant_id, item_code)
```

## 23.2 stock_lots

``` text
id
tenant_id
stock_item_id
lot_number
expiration_date NULL
received_at NULL
current_quantity NUMERIC
created_at
```

## 23.3 stock_movements

Source of truth for stock changes.

``` text
id
tenant_id
stock_item_id
stock_lot_id NULL
movement_type ENUM(in, out, adjustment)
quantity NUMERIC
direction ENUM(in, out)
reason
recorded_by
idempotency_key NULL
created_at
```

Stock balance should be derived/reconciled from movements.

Negative stock policy remains a business decision.

No purchase-order entities in V1.

------------------------------------------------------------------------

# 24. Communication domain

## 24.1 communication_templates

``` text
id
tenant_id NULL
template_scope ENUM(platform, tenant)
category
channel ENUM(whatsapp, sms)
language ENUM(fr, ar)
name
body
active
created_at
updated_at
```

Platform templates have `tenant_id = NULL`.

Tenant custom templates belong to tenant.

## 24.2 communication_messages

``` text
id
tenant_id
patient_id NULL
appointment_id NULL
invoice_id NULL
installment_id NULL
channel
template_id NULL
recipient
resolved_body
status ENUM(queued, sent, delivered, failed)
provider_message_id NULL
failure_code NULL
failure_reason NULL
scheduled_at NULL
sent_at NULL
delivered_at NULL
created_by NULL
created_at
```

## 24.3 communication_automations

``` text
id
tenant_id
event_type
channel
template_id
timing_offset_minutes NULL
active
created_at
updated_at
```

Examples:

-   appointment_confirmed.
-   appointment_reminder.
-   installment_due.
-   installment_overdue.

------------------------------------------------------------------------

# 25. Google Calendar integration

## 25.1 external_integrations

``` text
id
tenant_id
integration_type ENUM(google_calendar, whatsapp_provider, sms_provider)
owner_user_id NULL
status
encrypted_credentials_reference
configuration_json
connected_at
updated_at
```

Credentials/tokens must be encrypted or stored in an appropriate secrets
mechanism.

## 25.2 calendar_sync_mappings

``` text
id
tenant_id
appointment_id
integration_id
external_event_id
last_synced_at
sync_status
```

Do not store OAuth secrets in plain text.

------------------------------------------------------------------------

# 26. Master Data domain

## 26.1 master_data_categories

Examples:

-   specialty.
-   service.
-   treatment_type.
-   clinical_entry_type.
-   document_type.
-   expense_category.
-   stock_category.
-   unit.
-   leave_type.
-   payment_method.

## 26.2 global_master_items

``` text
id
category_id
code
name_fr
name_ar
keywords_fr
keywords_ar
specialty_tags
active
created_at
updated_at
```

## 26.3 tenant_master_items

``` text
id
tenant_id
category_id
global_master_item_id NULL
code NULL
name_fr
name_ar NULL
keywords_fr NULL
keywords_ar NULL
configuration_json NULL
active
created_at
updated_at
```

This implements:

``` text
Global Master
    |
Tenant adopts/customizes
    |
Tenant configuration
```

No tenant can edit the global source record.

------------------------------------------------------------------------

# 27. Document templates and numbering

## 27.1 document_templates

``` text
id
tenant_id NULL
document_type
language
name
template_definition
version
active
created_at
```

Tenant-specific templates can derive from platform defaults.

## 27.2 numbering_sequences

``` text
id
tenant_id
sequence_type
prefix
year_reset BOOLEAN
current_value
format_pattern
updated_at
```

Examples:

``` text
PAT
FAC
REC
TRT
```

Sequence allocation must be concurrency-safe.

Financial number allocation should occur at issuance/posting, not while
draft is being edited.

------------------------------------------------------------------------

# 28. Subscription domain

SaaS billing is completely separate from patient billing.

## 28.1 subscription_plans

``` text
id
code
name
billing_period_options
active
created_at
```

## 28.2 plan_prices

``` text
id
plan_id
billing_period ENUM(monthly, annual)
currency_code
amount
effective_from
effective_to NULL
```

## 28.3 plan_entitlements

``` text
id
plan_id
entitlement_code
limit_value NULL
enabled BOOLEAN
```

Examples:

``` text
max_practitioners
max_staff
storage_bytes
inventory_enabled
hr_enabled
commission_enabled
```

Pricing remains commercially simple even if entitlements are technically
expressive.

## 28.4 subscriptions

``` text
id
tenant_id
plan_id
billing_period
status ENUM(trialing, active, expired, grace, blackout, cancelled)
trial_started_at NULL
trial_ends_at NULL
current_period_start NULL
current_period_end NULL
grace_ends_at NULL
cancelled_at NULL
created_at
updated_at
```

## 28.5 subscription_payments

Separate from patient `payments`.

``` text
id
tenant_id
subscription_id
provider
provider_reference
amount
currency_code
status
paid_at NULL
created_at
```

Never mix these with practice invoices/payments.

------------------------------------------------------------------------

# 29. Referral domain

## 29.1 referral_codes

``` text
id
tenant_id
code UNIQUE
active
created_at
```

## 29.2 referrals

``` text
id
referrer_tenant_id
referred_tenant_id NULL
referral_code_id
status ENUM(attributed, trial, paid_pending_validation, qualified, rejected, voided)
attributed_at
first_paid_at NULL
validation_ends_at NULL
qualified_at NULL
rejection_reason NULL
reviewed_by_admin_id NULL
created_at
updated_at
```

## 29.3 referral_rewards

``` text
id
referral_id
beneficiary_tenant_id
reward_type ENUM(free_subscription_time)
reward_months INTEGER
status ENUM(pending, applied, voided)
applied_at NULL
created_at
```

Constraint:

One qualifying reward per referral.

------------------------------------------------------------------------

# 30. Audit domain

## 30.1 audit_events

``` text
id UUID PK
tenant_id UUID NULL
actor_user_id UUID NULL
actor_membership_id UUID NULL
action_code
resource_type
resource_id UUID NULL
before_data JSONB NULL
after_data JSONB NULL
reason NULL
ip_metadata NULL
created_at TIMESTAMPTZ
```

Do not indiscriminately store full sensitive clinical records in audit
snapshots. Audit only the minimum appropriate information.

Examples:

``` text
appointment.rescheduled
patient.responsible_practitioner_changed
invoice.issued
payment.posted
payment.reversed
caisse.closed
permission.changed
commission.adjusted
subscription.manually_changed
```

Audit events are append-only from normal application perspective.

------------------------------------------------------------------------

# 31. Notification domain

## 31.1 internal_notifications

``` text
id
tenant_id
recipient_user_id
type
title
body
resource_type NULL
resource_id NULL
read_at NULL
created_at
```

Notifications are presentation/action helpers; they are not the
authoritative business record.

------------------------------------------------------------------------

# 32. Core ER diagram

``` text
USER
  |
  +----< TENANT_MEMBERSHIP >---- TENANT
                                  |
                                  +----< PRACTITIONER
                                  |
                                  +----< EMPLOYEE
                                  |
                                  +----< PATIENT >---- RESPONSIBLE PRACTITIONER
                                  |        |
                                  |        +----< APPOINTMENT
                                  |        |
                                  |        +----< CLINICAL_ENCOUNTER
                                  |        |        |
                                  |        |        +----< CLINICAL_ENTRY
                                  |        |        `----< PATIENT_DOCUMENT
                                  |        |
                                  |        +----< TREATMENT_PLAN
                                  |        |        `----< TREATMENT_SESSION
                                  |        |
                                  |        +----< INVOICE
                                  |                 |
                                  |                 +----< INVOICE_LINE
                                  |                 +----< INSTALLMENT
                                  |                 `----< PAYMENT_ALLOCATION
                                  |
                                  +----< PAYMENT
                                  |        `---- RECEIPT
                                  |
                                  +----< CASH_REGISTER_SESSION
                                  |        `----< CASH_MOVEMENT
                                  |
                                  +----< EXPENSE
                                  |
                                  +----< STOCK_ITEM
                                  |        +----< STOCK_LOT
                                  |        `----< STOCK_MOVEMENT
                                  |
                                  +----< COMMUNICATION_MESSAGE
                                  |
                                  +----< SUBSCRIPTION
                                  |
                                  `----< AUDIT_EVENT
```

------------------------------------------------------------------------

# 33. Patient journey ER view

``` text
PATIENT
|
+-- responsible_practitioner_id --> PRACTITIONER
|
+-- APPOINTMENTS
|      |
|      `-- SERVICE
|
+-- CLINICAL_ENCOUNTERS
|      |
|      +-- CLINICAL_ENTRIES
|      `-- PATIENT_DOCUMENTS
|
+-- TREATMENT_PLANS
|      |
|      `-- TREATMENT_SESSIONS
|             |
|             +-- APPOINTMENT
|             `-- CLINICAL_ENCOUNTER
|
+-- INVOICES
|      |
|      +-- INVOICE_LINES
|      +-- INSTALLMENTS
|      `-- PAYMENT_ALLOCATIONS
|
`-- PAYMENTS
       |
       `-- RECEIPTS
```

------------------------------------------------------------------------

# 34. Finance ER view

``` text
APPOINTMENT / TREATMENT
          |
          v
       INVOICE
          |
          +---- INVOICE_LINES
          |
          +---- INSTALLMENTS
          |
          v
  PAYMENT_ALLOCATION
          ^
          |
       PAYMENT
          |
          +---- RECEIPT
          |
          `---- CASH_MOVEMENT (when cash)
                       |
                       v
             CASH_REGISTER_SESSION

EXPENSE ----------------> CASH_MOVEMENT (when cash)
```

------------------------------------------------------------------------

# 35. Commission ER view

``` text
PRACTITIONER
     |
     +---- COMMISSION_RULE
     |          |
     |          +-- Service-specific optional
     |          `-- Basis: collected / invoiced / fixed
     |
INVOICE_LINE / PAYMENT_ALLOCATION / SERVICE COMPLETION
     |
     v
COMMISSION_EARNING
     |
     +---- PAYROLL_PERIOD optional
     |
     `---- status: earned / included / paid / reversed

COMMISSION_ADJUSTMENT
     |
     `---- separate manual adjustment with reason
```

------------------------------------------------------------------------

# 36. Tenant-scoping rule

All tenant-owned repository queries must conceptually require:

``` text
WHERE tenant_id = :current_tenant
```

But this must be implemented centrally, not manually remembered in every
controller.

Recommended layers:

1.  Request resolves current membership/tenant.
2.  Application service receives TenantContext.
3.  Repository/query layer enforces tenant scope.
4.  Authorization checks practitioner/resource governance.
5.  Optional RLS provides defense-in-depth.

Never trust `tenant_id` supplied directly by browser/client.

------------------------------------------------------------------------

# 37. Practitioner access rule

For clinical patient resource:

``` text
ALLOW if:
- Owner policy explicitly grants appropriate access, OR
- current practitioner == patient.responsible_practitioner, OR
- active patient_access_grant exists, OR
- specifically authorized workflow permits it.
```

Reception administrative access is separate from clinical access.

The final owner-vs-other-practitioner clinical visibility policy remains
an explicit governance decision before implementation freeze.

------------------------------------------------------------------------

# 38. Search indexes

Recommended PostgreSQL indexes include:

## Patients

``` text
(tenant_id, patient_number)
(tenant_id, responsible_practitioner_id)
(tenant_id, normalized_phone)
(tenant_id, normalized_last_name)
```

Potential trigram/full-text indexes for name search.

## Appointments

``` text
(tenant_id, practitioner_id, scheduled_start)
(tenant_id, status, scheduled_start)
(tenant_id, patient_id, scheduled_start DESC)
```

## Invoices

``` text
(tenant_id, invoice_number)
(tenant_id, patient_id, issue_date DESC)
(tenant_id, status, due_date)
```

## Payments

``` text
(tenant_id, payment_reference)
(tenant_id, invoice_id, payment_date)
```

## Installments

``` text
(tenant_id, status, due_date)
```

## Stock

``` text
(tenant_id, item_code)
(tenant_id, stock_item_id)
```

## Communication

``` text
(tenant_id, patient_id, created_at DESC)
(status, scheduled_at)
```

------------------------------------------------------------------------

# 39. Uniqueness strategy

Tenant-scoped human references:

``` text
UNIQUE(tenant_id, patient_number)
UNIQUE(tenant_id, invoice_number)
UNIQUE(tenant_id, receipt_number)
UNIQUE(tenant_id, treatment_reference)
UNIQUE(tenant_id, item_code)
```

Platform-global:

``` text
users.email
tenants.slug
referral_codes.code
```

Case-insensitive uniqueness should be used where appropriate.

------------------------------------------------------------------------

# 40. Soft delete and deactivation

Do not use one generic `deleted_at` policy blindly.

## Deactivate

Appropriate for:

-   Users.
-   Employees.
-   Practitioners.
-   Services.
-   Master data.
-   Stock items.
-   Templates.

## Archive

Appropriate for:

-   Patient where permitted.
-   Old treatment plans.

## Never ordinary hard-delete

-   Issued invoice.
-   Posted payment.
-   Receipt.
-   Cash movement.
-   Closed caisse.
-   Commission earning.
-   Audit event.

## Clinical data

Deletion/amendment must follow formal medical/privacy policy rather than
generic CRUD behavior.

------------------------------------------------------------------------

# 41. Transaction boundaries

## 41.1 Cash patient payment

Single database transaction:

``` text
Create payment
Create allocation
Update/reconcile invoice
Update installment
Create receipt
Create cash movement
Update/reconcile caisse projection
Create commission earning if collection-based
Create audit event
```

External WhatsApp/SMS sending happens after commit through queue/outbox.

## 41.2 Invoice issue

Transaction:

``` text
Lock numbering sequence
Allocate invoice number
Finalize totals
Set ISSUED
Create audit
Commit
```

## 41.3 Stock movement

Transaction:

``` text
Validate balance/lot
Create movement
Update cached balance if used
Update lot
Create audit
Commit
```

## 41.4 Caisse close

Transaction:

``` text
Lock session
Recalculate expected cash
Store physical cash
Calculate difference
Require reason if needed
Close
Audit
```

------------------------------------------------------------------------

# 42. Outbox/event pattern recommendation

For reliable notifications/integrations, business transaction should not
depend directly on external provider availability.

Example:

``` text
Appointment confirmed
        |
Database transaction
        |
Appointment status + Outbox Event
        |
COMMIT
        |
Background worker
        |
WhatsApp/SMS provider
```

Recommended `outbox_events` entity:

``` text
id
tenant_id
event_type
aggregate_type
aggregate_id
payload
status
available_at
processed_at NULL
attempt_count
last_error NULL
created_at
```

This is especially useful for:

-   WhatsApp/SMS.
-   Google Calendar sync.
-   Subscription events.
-   Report/background jobs.

------------------------------------------------------------------------

# 43. Idempotency

Use idempotency protections for:

-   Payment creation.
-   Subscription payment webhooks.
-   Referral rewards.
-   Stock movements submitted from unstable connection.
-   External message callbacks.
-   Calendar synchronization.

Provider webhook events should have unique provider event IDs.

------------------------------------------------------------------------

# 44. Reporting model

V1 can query transactional tables with indexed aggregate queries.

Avoid premature data warehouse architecture.

As usage grows, introduce:

-   Materialized views.
-   Daily aggregate tables.
-   Analytics warehouse.

Potential aggregate entities later:

``` text
daily_practice_metrics
daily_practitioner_metrics
daily_financial_metrics
daily_appointment_metrics
```

Transactional database remains source of truth.

------------------------------------------------------------------------

# 45. Dashboard metric definitions

Metrics must have precise semantics.

## Invoiced

Sum of valid issued invoice amounts in selected period.

## Collected

Sum of valid posted payment allocations/payments in selected period.

## Outstanding

Valid invoice total minus valid allocated payments.

## Overdue

Outstanding amount whose invoice/installment due date is past due
according to policy.

## Operational balance

``` text
Collections - Operational expenses
```

Do not call this accounting profit.

## No-show rate

``` text
No-show appointments /
eligible scheduled appointments
```

Exact denominator should be documented before analytics implementation.

------------------------------------------------------------------------

# 46. Storage architecture

Use private object storage.

Never expose permanent public URLs for patient files.

Access pattern:

``` text
Authenticated request
-> tenant/permission check
-> temporary signed URL or streamed response
-> expiry
```

File metadata in PostgreSQL; binary in object storage.

Potential storage categories:

-   Patient documents.
-   Clinical images.
-   Employee documents.
-   Expense attachments.
-   Practice logo.
-   Generated documents.

------------------------------------------------------------------------

# 47. Encryption and secrets

At minimum:

-   TLS in transit.
-   Database/storage encryption at rest from infrastructure provider.
-   Password hashing using modern password algorithm.
-   OAuth/API secrets encrypted.
-   No raw card details stored.
-   No provider secret exposed to frontend.

Sensitive fields requiring application-level encryption can be
identified during security/legal design.

------------------------------------------------------------------------

# 48. Backup and recovery

Architecture must support:

-   Automated database backups.
-   Point-in-time recovery where hosting supports it.
-   Object-storage durability/versioning strategy.
-   Restore testing.
-   Tenant data export.

Final RPO/RTO must be selected before production launch.

------------------------------------------------------------------------

# 49. Data retention classes

Suggested classification:

## Class A --- Critical regulated/sensitive

-   Patient identity.
-   Clinical records.
-   Clinical documents.

## Class B --- Critical financial/audit

-   Invoices.
-   Payments.
-   Receipts.
-   Caisse.
-   Expenses.
-   Audit events.

## Class C --- Operational

-   Appointments.
-   Treatment scheduling.
-   Communications.
-   Inventory.

## Class D --- Configuration

-   Services.
-   Templates.
-   Permissions.
-   Master data.

Retention durations require Moroccan legal/privacy validation.

------------------------------------------------------------------------

# 50. Bilingual data strategy

Do not duplicate every transactional value into FR and AR.

Use localized fields where content is master/configuration data:

``` text
name_fr
name_ar
keywords_fr
keywords_ar
```

User-entered patient names/notes remain Unicode text as entered.

Generated document language is selected independently.

------------------------------------------------------------------------

# 51. Specialty extensibility

Avoid separate patient tables for dentist, kiné, psychologist, etc.

Use common core:

``` text
Patient
Clinical Encounter
Clinical Entry
Treatment Plan
Treatment Session
Document
```

Then specialty configuration/schema extensions.

Possible future extension:

``` text
clinical_form_definitions
clinical_form_fields
clinical_form_responses
```

This allows specialty forms without changing core patient identity.

Advanced dentistry odontogram can later become its own bounded module
linked to patient/encounter.

------------------------------------------------------------------------

# 52. Recommended clinical form model

To support the agreed master-data-filled searchable forms:

## clinical_form_definitions

``` text
id
scope ENUM(platform, tenant)
tenant_id NULL
specialty_id
name_fr
name_ar
version
active
```

## clinical_form_fields

``` text
id
form_definition_id
field_code
label_fr
label_ar
field_type
master_data_category_id NULL
required
display_order
configuration_json
```

## clinical_form_instances

``` text
id
tenant_id
patient_id
clinical_encounter_id
form_definition_id
form_version
completed_by_practitioner_id
created_at
```

## clinical_form_values

``` text
id
form_instance_id
form_field_id
master_item_id NULL
value_text NULL
value_numeric NULL
value_date NULL
value_boolean NULL
value_json NULL
```

This is preferable to one giant JSON medical record.

------------------------------------------------------------------------

# 53. Future rooms/equipment model

Deferred but architecture-ready.

``` text
resources
- id
- tenant_id
- type ENUM(room, equipment)
- name
- active

resource_availability
appointment_resource_reservations
```

Appointment can later reserve:

``` text
Practitioner
+ Room
+ Equipment
```

without redesigning patient/billing domains.

------------------------------------------------------------------------

# 54. Future capacity-based scheduling

Deferred entity concept:

``` text
capacity_slots
- practitioner/service
- start/end
- max_capacity

appointment consumes one or configurable capacity unit
```

Exact/window scheduling remains V1.

------------------------------------------------------------------------

# 55. SaaS Super Admin separation

Super Admin is platform-level.

Recommended platform admin entities:

``` text
platform_admin_users
platform_admin_roles
platform_admin_audit_events
```

Do not automatically reuse tenant Owner permissions as platform
permissions.

Platform admin access to sensitive tenant clinical data should be
minimized and separately governed.

------------------------------------------------------------------------

# 56. Suggested database schemas

PostgreSQL schemas can provide organizational clarity:

``` text
identity.*
platform.*
tenant.*
clinical.*
scheduling.*
billing.*
cash.*
hr.*
inventory.*
communication.*
audit.*
```

This is optional; a modular application with consistent table prefixes
can also work.

Avoid overengineering if framework conventions make schema separation
cumbersome.

------------------------------------------------------------------------

# 57. Core foreign-key principles

All child entities should have real FK constraints where practical.

Examples:

``` text
appointments.patient_id -> patients.id
appointments.practitioner_id -> practitioners.id
invoices.patient_id -> patients.id
payments.invoice_id -> invoices.id
treatment_sessions.treatment_plan_id -> treatment_plans.id
```

Tenant consistency must also be protected.

Application should never allow:

``` text
Invoice tenant A
-> Patient tenant B
```

For high-assurance tables, consider composite tenant-aware constraints
or validation triggers where appropriate.

------------------------------------------------------------------------

# 58. Tenant-aware referential integrity

Simple FK by UUID prevents missing references but not cross-tenant
references if IDs are globally valid.

Options:

1.  Application/service validation.
2.  Composite unique keys `(tenant_id, id)` and composite FKs.
3.  Database triggers.
4.  RLS policies.

For sensitive domains such as patients/clinical/billing,
defense-in-depth is recommended.

------------------------------------------------------------------------

# 59. Concurrency controls

Critical concurrency areas:

## Invoice numbering

Lock sequence row during allocation.

## Receipt numbering

Same.

## Payment posting

Lock/reconcile invoice outstanding balance.

## Caisse close

Prevent payment being posted into a session simultaneously being closed
without deterministic locking.

## Stock

Prevent race causing invalid negative quantity if negative stock
prohibited.

## Referral reward

Unique constraint/idempotency.

------------------------------------------------------------------------

# 60. Event catalog

Recommended domain events:

``` text
PatientCreated
ResponsiblePractitionerChanged
AppointmentRequested
AppointmentConfirmed
AppointmentRescheduled
AppointmentCancelled
PatientArrived
ConsultationStarted
ConsultationCompleted
TreatmentCreated
TreatmentSessionCompleted
InvoiceIssued
InstallmentDue
InstallmentOverdue
PaymentPosted
PaymentReversed
ReceiptIssued
CashRegisterOpened
CashMovementPosted
CashRegisterClosed
ExpensePosted
LeaveSubmitted
LeaveApproved
CommissionEarned
StockMoved
StockLow
LotExpiring
SubscriptionTrialStarted
SubscriptionActivated
SubscriptionExpired
SubscriptionBlackoutStarted
SubscriptionRenewed
ReferralQualified
PermissionChanged
```

Events should represent facts already committed.

------------------------------------------------------------------------

# 61. Minimum database modules for V1

Implementation should include migrations/models for:

1.  Identity.
2.  Tenant.
3.  Membership/permissions.
4.  Practitioner.
5.  Employee.
6.  Patient.
7.  Patient governance.
8.  Master data.
9.  Services.
10. Working hours.
11. Appointments.
12. Booking requests.
13. Appointment history.
14. Clinical encounters.
15. Clinical forms/entries.
16. Files/documents.
17. Treatments.
18. Sessions.
19. Invoices.
20. Invoice lines.
21. Installments.
22. Payments/allocations.
23. Receipts.
24. Caisse.
25. Cash movements.
26. Expenses.
27. Leave.
28. Payroll.
29. Commissions.
30. Stock items/lots/movements.
31. Communication templates/messages/automations.
32. Integrations.
33. Subscription/plans/entitlements.
34. Referral.
35. Audit.
36. Outbox events.
37. Internal notifications.

------------------------------------------------------------------------

# 62. Recommended modular application boundaries

Even if initially deployed as one application, structure code as a
modular monolith.

``` text
Modules/
|
|-- Identity
|-- Tenancy
|-- Patients
|-- Clinical
|-- Scheduling
|-- Treatments
|-- Billing
|-- CashManagement
|-- Team
|-- Commissions
|-- Inventory
|-- Communication
|-- MasterData
|-- Subscriptions
|-- Referrals
|-- Reporting
`-- Audit
```

This is preferable to premature microservices for a new SaaS.

Modules communicate through explicit application services/domain events
rather than directly modifying each other's tables arbitrarily.

------------------------------------------------------------------------

# 63. Why modular monolith for this project

For the initial market:

-   One development team.
-   Strong transactional relationships.
-   Many cross-domain workflows.
-   Need for fast market launch.
-   Customer base initially modest.
-   Microservices would add operational complexity.

A well-designed modular monolith can scale far beyond initial needs and
can later extract services where justified.

------------------------------------------------------------------------

# 64. Data migration/import readiness

Patient import should eventually support:

-   CSV/XLSX import.
-   Mapping columns.
-   Duplicate preview.
-   Validation report.
-   Dry-run.
-   Import batch record.
-   Rollback strategy before finalization.

Potential entity:

``` text
import_batches
import_rows
```

Not required for first development sprint but should be planned because
existing practices may already have patient lists.

------------------------------------------------------------------------

# 65. Security-sensitive queries

Never implement patterns such as:

``` text
GET /patients/{id}
SELECT * FROM patients WHERE id = :id
```

without tenant/governance context.

Conceptually:

``` text
SELECT ...
FROM patients
WHERE id = :id
AND tenant_id = :current_tenant
AND access_policy_allows(...)
```

Likewise for documents, invoices, payments and clinical entries.

------------------------------------------------------------------------

# 66. Public identifiers

Public booking should expose slug/public references, not internal
sensitive IDs.

Example:

``` text
/book/cabinet-atlas
```

Public booking request can use random opaque reference for follow-up.

Never expose predictable patient IDs publicly.

------------------------------------------------------------------------

# 67. PII logging policy

Application logs should not casually include:

-   Clinical notes.
-   Full documents.
-   Passwords.
-   Tokens.
-   Sensitive health information.

Use IDs and safe metadata.

Production error tracking should sanitize request bodies.

------------------------------------------------------------------------

# 68. Data-quality constraints

Examples:

-   Appointment window end after start.
-   Payment \> 0.
-   Invoice totals nonnegative.
-   Installment amount \> 0.
-   Stock movement quantity \> 0.
-   Leave end \>= start.
-   Commission rate between permitted bounds.
-   Unique numbering.
-   Required tenant ownership.
-   Valid status transitions.

State transition validation belongs in domain/application logic, not
only database ENUMs.

------------------------------------------------------------------------

# 69. Derived values versus stored values

## Derive when practical

-   Current outstanding balance.
-   Current stock.
-   Expected caisse balance.
-   Treatment completed-session count.

## Cache/store when performance requires

If stored:

-   Update transactionally.
-   Add reconciliation jobs/checks.
-   Source ledger/movements remain authoritative.

For example:

``` text
stock_movements = source of truth
stock_items.cached_quantity = optional optimization
```

------------------------------------------------------------------------

# 70. Reconciliation jobs

Recommended background integrity checks:

-   Invoice totals vs payment allocations.
-   Caisse expected balance vs movements.
-   Stock cached balance vs movements.
-   Commission earnings vs eligible source.
-   Subscription state vs period dates.
-   Orphaned file metadata.
-   Failed outbox events.

Admin should receive actionable alerts for discrepancies.

------------------------------------------------------------------------

# 71. Data export structure

Future tenant export should be able to package:

``` text
patients.csv
appointments.csv
treatments.csv
invoices.csv
payments.csv
expenses.csv
inventory.csv
documents/
clinical/
audit_summary/
```

Actual export content must follow legal/privacy rules.

------------------------------------------------------------------------

# 72. Migration strategy

Every schema change should use versioned migrations.

Rules:

-   Never manually patch production schema.
-   Backward-compatible deployment where possible.
-   Data migrations separated from destructive schema changes.
-   Backups before high-risk migrations.
-   Test migrations against production-like data.

------------------------------------------------------------------------

# 73. Database QA checks

Automated tests should prove:

1.  Cross-tenant patient reference impossible/blocked.
2.  Cross-tenant invoice-patient relationship blocked.
3.  Duplicate invoice number within tenant rejected.
4.  Same invoice number across tenants permitted if numbering is
    tenant-local.
5.  Payment idempotency works.
6.  Receipt uniqueness works.
7.  Treatment session sequence unique.
8.  Public booking does not require patient creation.
9.  Posted payment cannot be hard deleted through domain.
10. Cash movement reconciles.
11. Stock movement reconciles.
12. Commission uniqueness prevents double count.
13. Referral reward cannot duplicate.
14. Deactivated user historical references remain.
15. Audit events persist.
16. Arabic Unicode fields round-trip correctly.
17. Timezone conversion behaves correctly.
18. Object storage access requires authorization.

------------------------------------------------------------------------

# 74. Data model decisions now locked

The following should be treated as baseline decisions:

-   Tenant is the primary customer/data boundary.
-   Shared relational database is acceptable for V1 with strict tenant
    isolation.
-   Patient has one responsible practitioner.
-   Reception access and clinical access are separate.
-   Medical record and documents are one UX area but structured
    relationally.
-   Public booking request exists before confirmed appointment/patient
    creation.
-   Exact and window appointments share one appointment model.
-   Treatment and session are distinct.
-   Invoice, installment and payment are distinct.
-   Patient payment and SaaS subscription payment are separate domains.
-   Cash is movement-ledger based.
-   Expenses link to cash only when actually paid in cash.
-   Commissions are source-based and auditable.
-   Inventory is movement-based; no purchasing module.
-   HR has no clock-in/out.
-   Master data supports global source + tenant customization.
-   Files live in private object storage.
-   Important corrections are append/reversal based.
-   Modular monolith is recommended for V1.

------------------------------------------------------------------------

# 75. Decisions still open before schema freeze

1.  Final owner access to other practitioners' clinical data.
2.  Patient sharing/transfer policy.
3.  Moroccan health-data legal requirements.
4.  Moroccan invoice/document legal requirements.
5.  Patient mandatory fields.
6.  Clinical form dictionaries per specialty.
7.  Caisse single-session versus multi-user/multi-caisse rules.
8.  Payment reversal/refund exact behavior.
9.  Negative stock policy.
10. Payroll compliance scope.
11. Subscription payment provider.
12. WhatsApp/SMS provider.
13. Google Calendar sync direction.
14. Trial duration.
15. Final pricing.
16. Storage entitlements.
17. Retention periods.
18. RPO/RTO.
19. Whether PostgreSQL RLS is used in addition to application isolation.
20. Initial import/migration capability at launch.

------------------------------------------------------------------------

# 76. Next specification

After this domain/data model, the project should proceed to:

## Specification 05 --- Technical Architecture, API Architecture & Security Design

It should define:

-   Recommended technology stack.
-   Frontend architecture.
-   Backend framework.
-   Modular-monolith package structure.
-   REST/API conventions.
-   Authentication/session strategy.
-   Authorization middleware/policies.
-   Tenant-context resolution.
-   Database implementation.
-   PostgreSQL isolation strategy.
-   Redis/queues.
-   Object storage.
-   Background jobs.
-   Outbox processing.
-   WhatsApp/SMS integration architecture.
-   Google Calendar integration.
-   Subscription payment integration.
-   Deployment environments.
-   CI/CD.
-   Logging.
-   Monitoring.
-   Backups.
-   Secrets.
-   Security controls.
-   Rate limiting.
-   Public booking protection.
-   Testing architecture.
-   Production topology.
-   Scaling strategy.

After Specification #5, the product will be ready to turn into a
development backlog and sprint-level engineering tasks.

------------------------------------------------------------------------

# 77. Final architecture summary

``` text
                           SaaS PLATFORM
                                |
             +------------------+------------------+
             |                                     |
       Platform Domain                         Tenant Domain
             |                                     |
      Plans / Subscription                    Practice
      Referral / Master Data                      |
      SaaS Administration                         |
                                                   v
                                            Memberships
                                                   |
                         +-------------------------+----------------------+
                         |                                                |
                    Practitioner                                      Staff
                         |
                         v
                      Patient
                         |
        +----------------+----------------+----------------+
        |                |                |                |
   Appointments      Dossier Santé    Treatments        Finance
        |                |                |                |
   Waiting flow      Encounters        Sessions          Invoice
   Public booking    Documents            |              |
                                          |          Installments
                                          |              |
                                          +---------- Payments
                                                         |
                                                       Receipt
                                                         |
                                                       Caisse

        Team / Payroll / Commissions
        Inventory / Lots / Movements
        Communication / WhatsApp / SMS
        Reports / Audit / Integrations

Across every tenant domain:
TENANT ISOLATION + PRACTITIONER GOVERNANCE + PERMISSIONS + AUDIT
```

This model supports the current Moroccan solo/small-cabinet product
while leaving clean extension points for multi-location practices,
rooms/equipment, capacity scheduling, advanced specialty modules,
patient portals and future AI without requiring a redesign of the core.
