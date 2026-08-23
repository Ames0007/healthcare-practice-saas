HEALTHCARE PRACTICE MANAGEMENT SaaS Complete Product & Functional
Blueprint Morocco \| Web Application \| French + Arabic \| MAD

Blueprint version 1.0 \| 22 August 2026

# 1. Executive Product Definition

The product is a multi-tenant Healthcare Practice Management SaaS
designed first for Morocco. It is intentionally solo-first and
cabinet-capable: the experience must remain simple for one practitioner
while scaling naturally to practices with a receptionist, assistants,
additional practitioners and up to roughly ten people. Initial
specialties: solo doctors, dental practices,
physiotherapy/kinesitherapy, psychology, nutrition,
dermatology/aesthetic medicine and small multi-doctor practices. The
same core application serves all specialties; specialty-specific
configuration and workflows are activated where needed rather than
creating separate products.

# 2. Product Principles & Scope Guardrails

-   Simplicity first: a solo practitioner must be able to operate the
    product without feeling they are using an ERP.
-   Progressive complexity: team, HR and advanced controls appear when
    relevant, rather than cluttering solo accounts.
-   One source of truth: patient-level and global views reference the
    same appointments, invoices, payments and records; data is never
    duplicated by module.
-   Tenant isolation: one subscriber/cabinet cannot access another
    subscriber/cabinet's data.
-   Practitioner governance: in multi-practitioner practices, patient
    ownership/access can be restricted by responsible practitioner and
    explicit permissions.
-   Operational finance, not statutory accounting: focus on invoices,
    cash collection, staged payments, caisse, expenses, provider
    payments and management KPIs.
-   Configurable master data: useful defaults are preloaded globally,
    while each cabinet can select, customize and extend them.
-   Bilingual by architecture: French/Arabic strings, searchable
    bilingual master data, RTL layouts and bilingual document options.
-   Web-first: responsive desktop/tablet/mobile browser use; no native
    mobile application in initial roadmap.
-   Integrations over reinvention: WhatsApp, SMS and Google Calendar are
    planned integrations; payment processing is not needed initially for
    patient payments. \# 3. Actors, Roles & Access Model \## 3.1
    Functional profiles

For a solo account, the Owner is simultaneously Admin and Practitioner.
The product must not require artificial role separation. \## 3.2
Lightweight permissions The Owner/Admin has complete control.
Receptionist/Staff permissions are simple toggles rather than a complex
role builder. Permissions should support module access and sensitive
actions such as viewing clinical information, recording payments,
accessing caisse, managing HR, viewing payroll, inventory and reports. -
View/create/edit patients and administrative data - Manage appointments
and booking requests - Create/view invoices - Record payments and
print/download receipts - Access caisse and record decaissements -
Access Team/HR functions if explicitly allowed - Access inventory if
allowed - Clinical/health-record access disabled by default for
receptionist unless Admin grants it - Payroll, commissions and
management reports restricted unless granted \## 3.3 Auditability
Sensitive operations must be auditable: who created, edited, cancelled
or deleted a record; before/after values where appropriate; timestamp;
tenant; user; affected entity; and reason where the workflow requires
one. Examples include invoice amount changes, payment cancellation,
caisse adjustments, patient record edits, permission changes and
subscription administration. \# 4. SaaS, Tenant & Data Governance Model
A Tenant represents the subscribing independent practitioner or cabinet.
Each tenant owns its workspace, configuration, users, patients and
operational data. Physical database-per-practitioner is not required for
V1; strict logical tenant isolation should be enforced server-side on
every tenant-owned record.

## 4.1 Multi-practitioner patient governance

A patient has one responsible practitioner under the current agreed
model. In a multi-practitioner tenant, the responsible practitioner owns
the clinical relationship. Additional practitioners should not
automatically see that patient unless the cabinet governance/permissions
permit it. Reception can access the administrative data necessary to
operate appointments and billing according to permissions. \## 4.2 Core
hierarchy - Platform -\> Tenant/Cabinet -\> Users/Memberships - Tenant
-\> Owner/Admin + optional practitioners + receptionist/staff - Tenant
-\> Patients, Services, Agenda, Finance, Team, Inventory, Communication,
Reports, Settings - Patient -\> Responsible practitioner -\> Health
Record/Documents -\> Appointments -\> Treatments/Sessions -\> Invoices
-\> Payments \# 5. Registration, Onboarding & Cabinet Configuration 1.
Create account 1. Choose specialty 1. Enter practitioner/cabinet
identity and contact details 1. Start trial / select plan as
applicable 1. Configure working hours 1. Select or add services and
prices from master data 1. Configure appointment scheduling mode and
durations 1. Customize documents: logo, invoice/prescription templates,
numbering and taxes 1. Optionally add receptionist/staff or additional
practitioner 1. Optionally import existing patients 1. Generate public
booking link and QR code 1. Enter the Today workspace and begin
operations The onboarding must be short enough for a solo practitioner.
Advanced HR, inventory, templates and integrations can be completed
later through setup checklists/settings. \# 6. Proposed Application
Navigation

# 7. Today / Daily Operations Workspace

This is the operational home screen and should minimize navigation
during the working day. It is especially important for solo
practitioners and receptionists. - Today's appointments grouped by
time/status - Appointments awaiting confirmation -
Arrived/waiting/in-consultation patients - Quick actions: new patient,
new RDV, collect payment, create invoice, record expense - Today's
collected amount and amount still expected - Current caisse
balance/status - Overdue installments/payments - Patients requiring
follow-up or next session - Low-stock and near-expiry alerts -
Subscription or integration alerts when relevant \# 8. Patient
Management \## 8.1 Patient profile as central 360-degree view The
patient is a central business entity. Opening a patient must expose
identity/contact, responsible practitioner, last/next appointment and
all operational history without forcing navigation to separate modules.

## 8.2 Identity & contact data

-   Internal patient number with configurable numbering
-   First name and family name
-   Phone number as a key operational contact field
-   Optional email
-   Date of birth/age and sex where clinically relevant
-   Address and optional identification fields as configured
-   Emergency contact where needed
-   Responsible practitioner
-   Patient status: active/inactive/archived
-   Creation source and timestamps
-   Notes/administrative flags \## 8.3 Duplicate prevention & search
    Patient creation should warn about likely duplicates using phone,
    name and other available identifiers. Search must support name,
    phone, patient number and configured identifiers. Arabic/French
    names and transliteration differences should be handled
    pragmatically through normalized search indexes where possible.
    \# 9. Dossier Sante & Documents (Merged) Medical Records and
    Documents are one patient area. The exact fields can vary by
    specialty, but the shared engine must support structured health
    information plus chronological clinical entries and attachments.
-   General health profile and health alerts
-   Allergies
-   Medical/surgical history
-   Current treatments/medications where relevant
-   Consultation/session entries with practitioner, date and linked
    appointment
-   Clinical notes and observations
-   Diagnosis/assessment fields where relevant
-   Measurements and specialty-specific observations
-   Prescriptions generated from the system
-   Medical certificates/reports/referrals where configured
-   Documents: PDF, images, X-rays, laboratory results, scans, reports,
    certificates and other attachments
-   Document category, date, author/uploader and description
-   Controlled clinical access according to practitioner ownership and
    permissions

# 10. Master Data, Forms & Search

The platform will ship with centrally maintained general reference data
and reusable form definitions. A cabinet can search, select, customize
and add its own entries without altering the global library.

Master data should support French and Arabic names plus search keywords.
Forms should use prefilled general information where possible, allow
additional custom fields, and provide keyword search so practitioners do
not repeatedly type common values. \# 11. Services, Prices & Treatment
Catalog - Service name in FR/AR where available - Specialty/category -
Default duration - Cabinet-specific price in MAD - Active/inactive
state - Appointment scheduling mode - Optional default practitioner -
Optional treatment/session applicability - Optional commission rule -
Searchable master-data origin plus cabinet override - Historical
integrity: price changes must not rewrite old invoices/appointments \#
12. Agenda & Appointment Engine \## 12.1 Appointment creation channels -
Receptionist creates appointment - Practitioner creates appointment -
External patient submits a booking request through public link/QR code;
receptionist validates before final confirmation \## 12.2 Scheduling
modes

Room/equipment availability is explicitly placed on the development
roadmap. Future appointments may require practitioner + room + equipment
availability. \## 12.3 Appointment data - Patient or prospective
patient - Responsible practitioner - Service/motif - Date - Exact time
or start/end window - Expected duration - Source: internal/public
booking - Status - Notes - Confirmation status - Linked
treatment/session when relevant - Linked invoice after service -
Created/modified by and timestamps \## 12.4 Appointment status model
Requested -\> To Confirm -\> Confirmed -\> Arrived -\> Waiting -\> In
Consultation -\> Completed. Alternative outcomes: Cancelled by Patient,
Cancelled by Cabinet, Rescheduled, No-show. Status changes should feed
operational KPIs and communication triggers. \## 12.5 Patient change
requests Patients may request cancellation/rescheduling through the
available communication/booking mechanism, but the change is not final
until validated by reception/practitioner. The patient is then notified
of the accepted or proposed change. \# 13. Public Booking Link & QR Code
Each cabinet/practitioner can generate a simple public URL using the
initial agreed pattern app.ma/book/{cabinet-slug}. The same destination
has a generated QR code that can be shared on social media, WhatsApp,
business cards, prescriptions, invoices or displayed at reception. - No
patient account required - Lightweight form only: full name, phone,
reason/service, preferred date/slot, optional comment - Submission
creates a booking request, not an automatically final appointment -
Reception/practitioner confirms, rejects or proposes another time -
Patient receives WhatsApp/SMS update - Anti-spam/rate-limiting and
consent/privacy notice should be included - QR code can be
downloaded/shared from cabinet settings \# 14. Waiting Room &
Operational Status The agenda should support the live patient flow:
confirmed, arrived, waiting, in consultation and completed. Reception
can see who is expected and waiting, while the practitioner can
start/finish the consultation. Waiting time and no-show/cancellation
metrics can be calculated from timestamps. \# 15. Treatment Plans, Care
Plans & Sessions This module is essential because several target
specialties operate over multiple visits. A treatment plan can represent
a dental treatment, kine course, aesthetic protocol or other multi-step
care path. - Plan name/type and responsible practitioner - Start/end
dates or open-ended plan - Linked patient and services - Planned number
of sessions/steps - Session sequence and status - Session notes/progress
linked to health record - Next recommended session/date - Overall
treatment status: planned, active, paused, completed, cancelled -
Financial total where applicable - Linked invoice(s), installments and
payments - Remaining sessions and remaining financial balance visible
together Example: 20 kine sessions can be created as a plan; each
completed appointment/session advances progress while the financial side
can be paid in staged cash payments. \# 16. Patient Billing: Invoice -\>
Installment -\> Payment -\> Receipt The current paper-invoice workflow
is digitized. After consultation/session, reception can generate an
invoice linked to the patient, appointment, practitioner and
service/treatment references. Patient payments are cash-focused in V1;
online patient payments are out of scope. \## 16.1 Invoice - Unique
configurable invoice number - Patient identification -
Cabinet/practitioner identification - Linked
appointment/treatment/service references - Issue date - Line items,
quantities and prices - Taxes if configured - Discount if authorized -
Total amount - Paid amount - Remaining balance - Status -
Printable/downloadable invoice template in FR/AR/bilingual configuration
\## 16.2 Financial status models

Appointment, treatment and financial statuses remain separate. A
completed appointment can have a partially paid invoice and an overdue
installment. \## 16.3 Staged payments Invoices/treatments may be paid
over multiple agreed stages. Each installment stores amount, due date,
status, amount paid and remaining amount. The patient profile and
Finance module show the schedule, overdue amounts and next due date.
Down payment before treatment is not a required workflow, but the model
should allow an initial partial payment after invoicing when needed. \##
16.4 Payments & receipts - Record cash payment against
invoice/installment - Generate unique receipt number - Show amount,
date, patient, invoice, operator and remaining balance - Download/print
receipt - Payment automatically feeds caisse when it is a cash receipt -
Cancellation/reversal is permission-controlled and audited; never
silently delete financial history \# 17. Caisse, Decaissements &
Operational Finance Caisse is a first-class operational control. The
product should track cash inflows from patients and cash outflows for
utilities, service providers, supplies and other cabinet expenses. -
Cash opening balance/session where the cabinet uses opening/closing
control - Automatic cash inflow from posted cash patient payments -
Manual/structured decaissements with category, amount, date, description
and supporting document if desired - Expenses such as rent, utilities,
service providers, supplies and other costs - Expected cash balance -
Optional physical closing balance and discrepancy explanation -
Daily/monthly cash movement history - Who recorded/modified/cancelled
each movement - No full accounting ledger or statutory accounting in V1
\## 17.1 Management financial KPIs - Amount invoiced - Amount
collected - Outstanding receivables - Overdue receivables/installments -
Collection rate - Collections today/week/month/YTD - Revenue/collections
by practitioner and service - Cash inflows/outflows and current
operational cash balance - Expenses by category - Payroll/commission
outflows - Operational balance = collections minus selected operating
outflows; clearly not presented as statutory accounting profit \# 18.
Team / HR Management The user-facing section should be called Equipe
rather than HR to keep the product approachable. No employee
clock-in/check-out is required. - Employee profile and contact
information - Employment/engagement details and contract documents -
Work schedules/shifts/rotations - Leave requests, approval, balances and
calendar - Absences - Overtime entered/validated where used - Payroll
records - Bonuses/deductions where configured - Practitioner
commissions - Employee documents - Employee self-service view for
schedule, leave requests, payroll/payslip documents where appropriate -
Receptionist may manage HR only if Owner/Admin explicitly grants
permission \# 19. Practitioner Commissions Commission functionality is
included for practices that compensate practitioners based on activity.
It should support fixed salary + commission, commission-only and
service-specific rates. - Commission rate at practitioner level and
optional service override - Basis selectable by cabinet/rule: invoiced
amount or collected amount - Collected amount should be the recommended
default for cash-realization alignment where appropriate - Commission
period - Gross eligible base - Calculated commission -
Adjustments/bonuses if authorized - Approved/payable/paid status -
Payment history and audit trail - Practitioner statement/report \# 20.
Inventory Management V1 inventory deliberately excludes
purchasing/procurement workflows. It manages stock in, stock out and
balances. - Item/product master - Category and unit - Current quantity -
Minimum stock threshold - Stock IN movement - Stock OUT movement -
Adjustment movement with reason and permission - Lot/batch number -
Expiration date - Near-expiry alert - Low-stock alert - Movement history
with user/date/reference - Optional location support later - No purchase
request/order/reception/supplier-invoice workflow in current scope \#
21. WhatsApp, SMS & Communication Patient communication is primarily
WhatsApp and SMS. Email is not a core requirement. The system includes a
reusable template module and automated triggers. - Appointment request
received - Appointment confirmation - Appointment reminder - Appointment
modification - Cancellation/rejection/proposed new slot -
Follow-up/next-session reminder - Payment receipt notification where
desired - Outstanding/overdue installment reminder - General
cabinet-defined templates - Template variables: patient, practitioner,
date, time/window, service, amount, balance, link, cabinet details -
Communication history attached to patient where technically available -
Delivery status/error tracking when supported by provider -
Opt-out/consent handling as required by applicable rules and provider
policies Integration targets: WhatsApp, SMS and Google Calendar.
Provider selection, exact API limits and Moroccan delivery costs remain
implementation decisions. \# 22. Google Calendar Integration - Optional
per-practitioner connection - Sync confirmed appointments to
practitioner calendar - Store external calendar event ID for
reconciliation - Handle update/cancellation propagation according to
chosen sync policy - Avoid duplicate event creation through
idempotency - Define source-of-truth policy before implementation; the
practice application should remain authoritative for cabinet
workflow/status \# 23. Dashboards, Reports & KPIs

# 24. Cabinet Customization & Document Templates

-   Cabinet/practitioner name and contact information
-   Logo upload
-   French/Arabic display preference
-   Invoice template
-   Receipt template
-   Prescription template
-   Other clinical document templates later
-   Working hours
-   Services and prices
-   Tax settings
-   Document numbering sequences
-   Public booking slug
-   Message templates
-   Permissions
-   Integration settings Templates should preserve historical documents:
    changing a template or cabinet address should not silently rewrite
    already-issued financial/clinical documents if immutable snapshots
    are required. \# 25. Subscription SaaS Engine The
    cabinet/practitioner is the subscriber. SaaS billing is separate
    from patient billing. Subscription data includes plan, billing
    period, trial, current period, status, renewal date,
    limits/entitlements, referral credits and payment/renewal history.
    \## 25.1 Lifecycle Trialing -\> Active -\> Expiring/renewal
    reminders -\> Expired grace period -\> Locked. Before expiration,
    multiple in-app reminders are shown. Agreed policy: three days of
    grace after expiration, then blackout on the following day if still
    unpaid.

Blackout does not delete data. The locked user can access
renewal/subscription information, support and logout. Data-retention and
eventual deletion policies must be formally defined before launch. \##
25.2 Pricing philosophy Pricing must remain reasonable and simple. The
agreed direction is a small number of packages rather than a complex
module-by-module menu. A likely structure is Solo -\> Cabinet -\>
Cabinet+, with usage-based communication and possibly a small number of
premium add-ons later. Actual MAD prices are intentionally not fixed
until Moroccan competitor and willingness-to-pay research is
completed. - Monthly and annual subscription options - Free trial -
Solo-friendly entry price - Differentiate primarily by number of
practitioners/staff and advanced capabilities, not by removing essential
patient management - WhatsApp/SMS can be usage-based because provider
costs vary - Architecture may support module sales later even if launch
pricing is packaged simply \# 26. Referral / Parrainage Program Customer
proposition: refer a new practitioner/cabinet who becomes a paying
subscriber and receive one free subscription month. The reward is
subscription time, not cash. 1. Existing customer shares unique referral
code/link 1. New customer registers through code/link 1. Referred
customer completes trial 1. Referred customer pays first eligible
subscription 1. Payment clears and validation/anti-fraud period
passes 1. Referral becomes validated 1. Referrer receives one free
subscription month/credit - New customers only - No reward for trial
registration alone - One referred cabinet/customer = one reward -
Self-referral controls using identity/contact/payment signals where
legally and technically appropriate - Validation delay to protect
against refunds/cancellations - Admin can inspect, approve/reject/revoke
fraudulent referrals - Referral ledger/history visible to customer -
Initial annual reward cap can be configured (exact cap to decide before
launch) - Terms and conditions must clearly define eligibility and abuse
rules \# 27. SaaS Super Admin The platform operator needs a separate
administrative area, distinct from cabinet operations. -
Tenants/customers - Owners and account status - Plans and plan
configuration - Trials - Subscriptions and renewal status - Manual
renewal/payment recording if applicable - Grace/blackout controls -
Referral program and fraud review - Feature/entitlement configuration -
Usage and communication consumption - Support/account assistance -
Audit/security events - System master data and global templates - SaaS
KPIs: active subscribers, trial conversion, MRR/ARR, churn, expirations,
referrals - Safe impersonation/support access only if later implemented
with explicit audit and strong controls \# 28. Core Status & State
Catalogue

# 29. Core Domain Entities

# 30. Critical Business Rules

1.  Every tenant-owned record is scoped to one tenant and cannot be
    accessed cross-tenant.
2.  Every patient has one responsible practitioner under the current
    model.
3.  Receptionist clinical/health-record access is not assumed; it is
    controlled by Admin permission.
4.  Public booking creates a request requiring validation, not a
    guaranteed appointment.
5.  Appointment time can be exact or a time window; capacity-based
    scheduling is roadmap.
6.  Room/equipment scheduling is roadmap, not launch-critical.
7.  Completing an appointment does not imply that its invoice is paid.
8.  Invoice, installment, payment, appointment and treatment statuses
    are independent.
9.  Cash payments create/affect cash movements; financial cancellations
    are reversed/audited rather than silently deleted.
10. Historical financial documents preserve issued values even if
    service prices change later.
11. No online patient payment is required in V1.
12. Inventory V1 is movement-based and does not include procurement.
13. No employee clock-in/out in current scope.
14. Commission rules can use invoiced or collected base; cabinet
    configuration controls the rule.
15. Subscription expiry allows three grace days, then blackout; data is
    retained.
16. Referral reward occurs only after an eligible referred customer pays
    and passes validation.
17. French and Arabic are first-class locales; master data and templates
    should be localization-aware.
18. Global master data can be selected/customized locally but tenants
    cannot modify the global source for other customers. \# 31.
    Non-Functional Requirements \## 31.1 Security & privacy

-   Strong authentication and secure password handling
-   Tenant isolation in backend/data access layer
-   Least-privilege permissions
-   Audit logs for sensitive actions
-   Encryption in transit; encryption-at-rest strategy for
    databases/files
-   Secure object storage with non-public patient files and expiring
    authorized access
-   Session management and account lock/recovery controls
-   Backups and tested restoration procedures
-   Data export/retention/deletion policies
-   Logging that avoids leaking sensitive health data
-   Security review before production
-   Compliance/legal review for Moroccan personal/health-data
    obligations before go-live \## 31.2 Reliability & operations
-   Automated database backups
-   File-storage redundancy appropriate to hosting
-   Monitoring/alerting
-   Background job retries for SMS/WhatsApp and reminders
-   Idempotent integrations/webhooks where used
-   Database migrations and rollback strategy
-   Staging environment
-   CI/CD
-   Error tracking
-   Disaster-recovery objectives defined before production \## 31.3
    Performance & usability
-   Fast Today/Agenda/Patient screens on ordinary cabinet internet
    connections
-   Pagination and indexed search for patients, invoices and
    appointments
-   Responsive web layout
-   Keyboard-efficient reception workflows
-   RTL Arabic support
-   Accessible forms and readable status colors/text
-   No unnecessary steps for common actions \# 32. Automation &
    Notification Rules
-   Appointment confirmation after validation
-   Appointment reminders at cabinet-configurable lead times
-   Booking-request notification to cabinet
-   Reschedule/cancellation confirmation
-   Next-session/follow-up reminder
-   Installment due/overdue reminder
-   Low-stock/near-expiry alert
-   Leave request/approval notification
-   Subscription expiration reminders
-   Referral status/reward notification A background job/queue mechanism
    should execute scheduled reminders and retries so web requests
    remain fast and communication is resilient. \# 33. Specialty
    Adaptation Framework

# 34. Integrations & External Dependencies

# 35. Future AI Opportunities (Not V1)

-   Management copilot: answer questions about collections, overdue
    payments, appointments and stock
-   Document extraction/classification for uploaded
    patient/administrative documents
-   Draft patient communication and follow-up templates
-   No-show risk prediction and scheduling suggestions
-   Operational anomaly detection: unusual cash differences, collection
    decline, stock consumption anomalies
-   Management narrative: explain changes in
    revenue/appointments/collections
-   Stock forecasting
-   Clinical documentation assistance only with strong practitioner
    review, privacy safeguards and appropriate regulatory/clinical
    controls \# 36. Recommended Delivery Roadmap

# 37. Commercial V1 Acceptance Definition

V1 is commercially credible when a real solo practitioner or small
cabinet can complete the following end-to-end without external
spreadsheets or paper except where they deliberately choose to print
documents: 1. Create/configure the cabinet and start a
trial/subscription 1. Create/import a patient and find the patient
quickly 1. Create or receive a booking request and confirm the
appointment 1. Run the patient through
arrival/waiting/consultation/completion 1. Update the Dossier Sante and
attach documents 1. Create a multi-session treatment/care plan when
needed 1. Generate an invoice linked to the
patient/appointment/treatment 1. Record one or several cash
payments/installments and issue receipts 1. See cash inflow in caisse
and record cabinet decaissements 1. Manage basic staff, schedules, leave
and compensation/commission where applicable 1. Track inventory in/out,
lot/expiry and alerts 1. Send/trigger WhatsApp/SMS
confirmations/reminders 1. See useful daily and management dashboards 1.
Operate correctly in French and Arabic 1. Maintain strict tenant/patient
access boundaries and audit sensitive changes 1. Handle trial, renewal,
grace, blackout and validated referral credit from the SaaS admin layer
\# 38. Decisions Still Open Before Technical Design

# 39. Explicitly Out of Scope / Deferred

-   Full statutory accounting/general ledger
-   Procurement/purchase-order workflow
-   Native mobile application
-   Online patient payment in V1
-   Employee clock-in/check-out attendance system
-   Hospital information system features
-   Complex enterprise RBAC/custom role designer
-   Rooms/equipment scheduling in initial launch
-   Capacity-based group slots unless field validation promotes it
-   Patient login portal in initial launch
-   AI features in V1
-   Deep laboratory/insurance/medical-device integrations in initial
    launch \# 40. Technical Architecture Principles for the Next Stage
    The technology stack has not yet been selected. The functional
    blueprint implies the following architecture requirements regardless
    of framework choice:
-   Multi-tenant application with tenant-aware data access
-   Relational transactional database suitable for
    appointments/finance/HR
-   Object storage for patient documents/images
-   Background queue/workers for reminders and integrations
-   Search/index strategy for patient and bilingual master-data lookup
-   Permission/authorization layer distinct from subscription
    entitlements
-   SaaS subscription domain separate from patient billing domain
-   Immutable/auditable financial event handling
-   Localization layer for FR/AR and RTL
-   API/integration layer for WhatsApp/SMS/Google Calendar
-   Secure secrets/configuration management
-   Observability, backups and deployment automation \# 41. Consolidated
    Functional Architecture The agreed product can be understood as five
    connected engines operating inside one SaaS platform:

# 42. Next Project Stage

This blueprint should now be converted into implementation-level
specifications. The recommended next deliverables are: 1. Detailed
screen map and UX flows for every module 1. Entity-relationship/data
model with tenant and practitioner access rules 1. Field-level
specifications for Patient, Dossier Sante, Appointment, Treatment,
Invoice, Payment, Caisse, Team and Inventory 1. Permission matrix 1.
State-machine definitions and transition rules 1. API/domain
boundaries 1. Technical stack and deployment architecture 1. MVP backlog
with epics, user stories and acceptance criteria 1. Development sprint
plan 1. Moroccan pricing/competitor study in parallel with
development 1. Security/privacy/compliance launch checklist

## Tables

### Table 1

  -----------------------------------------------------------------------
  Product thesis`<br>`{=html}A subscription-based, multi-tenant web
  platform built for solo healthcare practitioners and small practices,
  combining patient management, scheduling, clinical follow-up, billing,
  cash management, team administration, inventory, communication and
  operational reporting in one simple system.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

### Table 2

  -----------------------------------------------------------------------
  Positioning`<br>`{=html}Built for one practitioner. Powerful enough for
  a cabinet. The platform is a complete Practice Management System, not a
  hospital information system and not full accounting software.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

### Table 3

  -----------------------------------------------------------------------
  Dimension                           Agreed direction
  ----------------------------------- -----------------------------------
  Market                              Morocco first

  Delivery                            Responsive web application; no
                                      mobile app planned for V1

  Languages                           French and Arabic; RTL/LTR
                                      supported from the start

  Currency                            MAD

  Customer size                       Primarily 1 person; common 2-3;
                                      mostly under 5; support up to \~10

  Commercial model                    Recurring subscription SaaS with
                                      monthly/annual plans, free trial
                                      and referral program

  Clinical depth                      Intermediate to advanced patient
                                      record, but not hospital-grade EHR

  Accounting                          Operational finance and balances;
                                      no general ledger/full accounting

  Patient interface                   No patient account/portal required
                                      initially; public booking +
                                      WhatsApp/SMS communication

  AI                                  Not V1; architecture should permit
                                      future AI use cases
  -----------------------------------------------------------------------

### Table 4

  -----------------------------------------------------------------------
  Profile                 Purpose                 Default scope
  ----------------------- ----------------------- -----------------------
  Owner / Admin /         Subscriber and primary  Full access to all
  Practitioner            practitioner            cabinet data,
                                                  configuration,
                                                  subscription, finance,
                                                  HR and permissions

  Additional Practitioner Optional in             Own agenda, assigned
                          multi-practitioner      patients, clinical work
                          practice                and authorized
                                                  financial information

  Receptionist / Staff    Administrative operator Appointments and
                                                  administrative
                                                  functions by default;
                                                  HR, finance, stock or
                                                  other areas only when
                                                  enabled by Owner/Admin
  -----------------------------------------------------------------------

### Table 5

  -----------------------------------------------------------------------
  Core isolation rule`<br>`{=html}Every tenant-owned request is resolved
  in the authenticated tenant context. Front-end hiding is never
  considered a security control; the API/database access layer must
  enforce tenant ownership.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

### Table 6

  -----------------------------------------------------------------------
  Primary area                        Subareas
  ----------------------------------- -----------------------------------
  Aujourd'hui / Today                 Daily appointments, confirmations,
                                      waiting, collections, caisse,
                                      alerts, follow-ups

  Agenda                              Calendar, appointments, online
                                      booking requests, waiting-room
                                      workflow

  Patients                            Patient list, profile, health
                                      record + documents, appointments,
                                      treatments/sessions, invoices,
                                      payments

  Finances                            Invoices, installments, payments,
                                      receipts, caisse,
                                      decaissements/expenses

  Equipe                              Personnel, contracts,
                                      schedules/shifts, leaves/absences,
                                      overtime, payroll, bonuses,
                                      commissions, HR documents

  Stock                               Items, lots/expiry, stock in/out,
                                      balances, alerts

  Communication                       Messages, WhatsApp/SMS templates,
                                      reminders and communication history

  Rapports                            Operational, appointment,
                                      financial, practitioner, HR and
                                      inventory KPIs

  Parametres                          Cabinet, services/prices, master
                                      data extensions, users/permissions,
                                      documents, numbering, integrations,
                                      subscription/referral
  -----------------------------------------------------------------------

### Table 7

  -----------------------------------------------------------------------
  Patient tab                         Content
  ----------------------------------- -----------------------------------
  Apercu                              Identity, contacts, responsible
                                      practitioner, key health alerts,
                                      last/next visit, active treatment,
                                      outstanding balance

  Dossier Sante                       General health information,
                                      history, allergies, notes,
                                      consultation/session history,
                                      prescriptions,
                                      measurements/observations and all
                                      documents

  Rendez-vous                         Past, current and future
                                      appointments with status and source

  Traitements / Seances               Care/treatment plans, number of
                                      sessions, progress, linked services
                                      and financial plan

  Factures                            All patient invoices and balances

  Paiements                           Payment/receipt history and
                                      allocations
  -----------------------------------------------------------------------

### Table 8

  -----------------------------------------------------------------------
  Specialty model`<br>`{=html}The platform uses a common health-record
  engine with configurable specialty fields/forms. Dentistry, kine,
  psychology, nutrition and dermatology/aesthetic medicine should not
  require separate applications.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

### Table 9

  -----------------------------------------------------------------------
  Global master data examples         Cabinet customization
  ----------------------------------- -----------------------------------
  Specialties                         Select active
                                      specialty/configuration

  Services/treatment types            Activate, rename locally, set
                                      price/duration, add custom service

  Expense categories                  Select/add local categories

  Stock categories and units          Select/add local items/units

  Payment methods                     Enable relevant methods

  Appointment statuses/reasons        Use controlled statuses; add reason
                                      values where permitted

  Leave/contract/commission types     Select and configure

  Message templates                   Use/edit cabinet copy

  Health information/form fields      Use searchable predefined fields;
                                      add specialty/local fields
  -----------------------------------------------------------------------

### Table 10

  -----------------------------------------------------------------------
  Mode                    Meaning                 Example
  ----------------------- ----------------------- -----------------------
  Exact time              Patient is expected at  RDV at 10:00
                          a precise time          

  Time window / plage     Patient is instructed   Arrive between 10:00
  horaire                 to arrive within a      and 10:30
                          range                   

  Capacity-based slot     Several patients may be 10:00-11:00, max 3
  (roadmap)               accepted in a block     patients
                          where operationally     
                          appropriate             
  -----------------------------------------------------------------------

### Table 11

  -----------------------------------------------------------------------
  Object                              Statuses
  ----------------------------------- -----------------------------------
  Invoice                             Draft, Issued, Partially Paid,
                                      Paid, Overdue, Cancelled

  Installment                         Upcoming, Due, Partially Paid,
                                      Paid, Overdue

  Payment                             Recorded, Confirmed/posted,
                                      Cancelled/reversed as controlled
                                      action

  Treatment                           Planned, Active, Paused, Completed,
                                      Cancelled
  -----------------------------------------------------------------------

### Table 12

  -----------------------------------------------------------------------
  Area                                KPIs / reports
  ----------------------------------- -----------------------------------
  Appointments                        Today/week/month volume,
                                      confirmation rate, cancellations,
                                      no-shows, completed appointments,
                                      waiting time, utilization

  Patients                            New/active patients, repeat
                                      patients, upcoming follow-ups,
                                      treatment progress

  Finance                             Invoiced, collected, outstanding,
                                      overdue, collection rate,
                                      installments due, receipts,
                                      decaissements, operational balance

  Practitioners                       Appointments, completed services,
                                      collections, commission base/amount

  Team                                Headcount, leave/absence overview,
                                      payroll/bonuses/commissions

  Inventory                           Stock balance, low stock, near
                                      expiry, movement history

  SaaS owner admin                    Trials, subscribers, renewals,
                                      expirations, MRR/ARR, churn,
                                      referral conversions, plan
                                      distribution
  -----------------------------------------------------------------------

### Table 13

  -----------------------------------------------------------------------
  Timing                              Behavior
  ----------------------------------- -----------------------------------
  D-15 / D-7 / D-3 / D-1              Increasing in-app renewal
                                      reminders; optional communication
                                      reminders

  D0                                  Subscription expired; grace begins

  D+1 to D+3                          Grace period with strong persistent
                                      warnings

  D+4                                 Blackout: operational actions
                                      inaccessible until renewal

  After renewal                       Immediate restoration after
                                      subscription payment is validated
  -----------------------------------------------------------------------

### Table 14

  -----------------------------------------------------------------------
  Domain                              Core statuses
  ----------------------------------- -----------------------------------
  Appointment                         Requested, To Confirm, Confirmed,
                                      Arrived, Waiting, In Consultation,
                                      Completed, Rescheduled, Cancelled
                                      by Patient, Cancelled by Cabinet,
                                      No-show

  Treatment                           Planned, Active, Paused, Completed,
                                      Cancelled

  Invoice                             Draft, Issued, Partially Paid,
                                      Paid, Overdue, Cancelled

  Installment                         Upcoming, Due, Partially Paid,
                                      Paid, Overdue

  Payment                             Recorded/posted, Cancelled/Reversed

  Leave                               Requested, Approved, Rejected,
                                      Cancelled

  Subscription                        Trialing, Active, Expired/Grace,
                                      Locked, Cancelled

  Referral                            Registered, Trial, First Payment
                                      Pending Validation, Validated,
                                      Rewarded, Rejected
  -----------------------------------------------------------------------

### Table 15

  -----------------------------------------------------------------------
  Domain                              Key entities
  ----------------------------------- -----------------------------------
  SaaS                                Tenant, Subscription, Plan,
                                      Entitlement, Trial, Referral,
                                      SubscriptionCredit,
                                      SaaSPaymentRecord

  Identity                            User, Membership, Permission,
                                      PractitionerProfile, StaffProfile

  Cabinet                             CabinetProfile, WorkingHours,
                                      SpecialtyConfig, DocumentSequence,
                                      Template

  Patient                             Patient, ResponsiblePractitioner,
                                      HealthProfile, ClinicalEntry,
                                      Document

  Scheduling                          Service, Appointment,
                                      BookingRequest,
                                      AppointmentStatusHistory,
                                      CalendarConnection

  Care                                TreatmentPlan,
                                      TreatmentStep/Session,
                                      SessionProgress

  Finance                             Invoice, InvoiceLine, Installment,
                                      Payment, PaymentAllocation,
                                      Receipt, CashSession, CashMovement,
                                      Expense

  Team                                Employee, Contract, Shift/Schedule,
                                      Leave, Absence, Overtime,
                                      PayrollPeriod/Record, Bonus,
                                      CommissionRule, CommissionStatement

  Inventory                           StockItem, Lot, StockMovement,
                                      StockAlert

  Communication                       MessageTemplate, Message,
                                      DeliveryAttempt, NotificationRule

  Governance                          AuditEvent, FileObject,
                                      MasterDataDefinition,
                                      CabinetMasterDataOverride
  -----------------------------------------------------------------------

### Table 16

  -----------------------------------------------------------------------
  Specialty                           Examples of
                                      configuration/extensions
  ----------------------------------- -----------------------------------
  General medicine / multi-doctor     Consultation, diagnosis/assessment,
                                      prescription, certificates,
                                      follow-up

  Dentistry                           Dental services, multi-step
                                      treatment, imaging/documents;
                                      odontogram is a later specialty
                                      enhancement unless prioritized

  Physiotherapy / kine                Multi-session care plans, session
                                      progress,
                                      measurements/observations,
                                      next-session planning

  Psychology                          Recurring sessions, confidential
                                      clinical notes, strong practitioner
                                      access boundaries

  Nutrition                           Measurements, follow-up sessions,
                                      plans/documents

  Dermatology / aesthetic medicine    Photos/documents, procedures,
                                      multi-session protocols, follow-up
  -----------------------------------------------------------------------

### Table 17

  -----------------------------------------------------------------------
  Integration             Purpose                 Phase
  ----------------------- ----------------------- -----------------------
  WhatsApp                Confirmations,          V1 / early
                          reminders, follow-up    
                          and payment messages    

  SMS                     Same core communication V1 / early
                          use cases;              
                          fallback/alternative    

  Google Calendar         Practitioner calendar   V1.x / early roadmap
                          synchronization         

  Payment gateway for     Automate platform       Implementation decision
  SaaS subscription       subscription collection 
                          where provider/business 
                          setup supports it       

  Patient online payments Not required            Later / optional

  Rooms/equipment         Resource-aware          Roadmap
  scheduling              appointment booking     

  Custom domain/subdomain Premium public booking  Later
                          identity                
  -----------------------------------------------------------------------

### Table 18

  -----------------------------------------------------------------------
  Phase                               Scope
  ----------------------------------- -----------------------------------
  Foundation                          Multi-tenancy, authentication,
                                      Owner/Admin, staff membership,
                                      permissions, audit foundation,
                                      FR/AR framework, cabinet settings

  Core Operations                     Patients, Dossier Sante/Documents,
                                      services/master data, Agenda,
                                      exact/time-window appointments,
                                      statuses, Today screen

  Patient Journey                     Public booking link/QR, waiting
                                      room, treatment/session plans,
                                      prescriptions/documents

  Finance                             Invoices, staged payments, cash
                                      payments, receipts, caisse,
                                      expenses/decaissements, financial
                                      KPIs

  Team                                Employee profiles, contracts,
                                      schedules, leaves, overtime
                                      records, payroll, bonuses,
                                      commissions

  Inventory                           Items, lots/expiry, stock in/out,
                                      balances, alerts

  Communication                       WhatsApp/SMS integration,
                                      templates, scheduled reminders,
                                      delivery tracking

  SaaS Commercial                     Plans, free trial, monthly/annual
                                      subscription,
                                      expiry/grace/blackout, referral
                                      program, Super Admin

  Launch Hardening                    Security/privacy review,
                                      backup/restore test, monitoring,
                                      performance, import/export, support
                                      tools, onboarding polish

  Roadmap                             Rooms/equipment, capacity slots,
                                      advanced specialty modules, custom
                                      domains, Google Calendar
                                      refinement, optional patient
                                      portal/AI
  -----------------------------------------------------------------------

### Table 19

  -----------------------------------------------------------------------
  Important`<br>`{=html}These are not missing product concepts; they are
  implementation/commercial decisions that should be resolved before or
  during technical design.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

### Table 20

  -----------------------------------------------------------------------
  Decision                            What remains to decide
  ----------------------------------- -----------------------------------
  Exact pricing                       Moroccan competitor research,
                                      willingness-to-pay and final
                                      Solo/Cabinet/Cabinet+ MAD prices

  Free-trial length                   14 vs 30 days or other

  Annual discount                     Exact annual pricing/discount

  Referral cap                        Maximum rewarded months/year and
                                      validation delay

  SaaS payment collection             Provider/manual renewal process for
                                      Morocco

  Health data compliance              Formal Moroccan legal/privacy
                                      assessment, consent and retention
                                      requirements

  Patient identifiers                 Which optional
                                      national/administrative identifiers
                                      are needed by specialty

  Clinical forms                      Exact shared fields and
                                      specialty-specific field libraries

  Prescription/document rules         Exact template/legal requirements
                                      and signature/stamp workflow

  Commission default                  Collected vs invoiced default and
                                      treatment of refunds/cancellations

  Caisse operating model              Whether every cabinet must
                                      explicitly open/close a cash
                                      session or can use simplified
                                      continuous balance

  Data import                         Supported CSV/Excel patient import
                                      format and migration service

  WhatsApp/SMS provider               Provider, pricing, templates,
                                      sender requirements and delivery
                                      constraints

  Google Calendar sync                One-way vs two-way and conflict
                                      policy

  Capacity slots                      Whether needed in V1 or V1.x after
                                      field validation

  Multi-location                      Not a primary target; decide
                                      whether data model supports it
                                      silently from V1

  Retention after cancellation        How long data is retained and how
                                      export/deletion works

  Support/admin access                Whether platform support may access
                                      tenant data and under what audited
                                      consent mechanism
  -----------------------------------------------------------------------

### Table 21

  -----------------------------------------------------------------------
  Engine                              Responsibilities
  ----------------------------------- -----------------------------------
  SaaS Engine                         Tenants, subscriptions, plans,
                                      trials, referrals, entitlements,
                                      expiry/blackout, Super Admin

  Practice Operations                 Today, patients, agenda, booking,
                                      waiting room, services,
                                      communication

  Clinical/Care                       Dossier Sante + documents,
                                      consultations, prescriptions,
                                      treatment plans, sessions

  Financial Operations                Invoices, installments, cash
                                      payments, receipts, caisse,
                                      expenses, balances, KPIs

  Team & Resources                    Staff, contracts, schedules, leave,
                                      payroll, commissions, inventory
  -----------------------------------------------------------------------

### Table 22

  -----------------------------------------------------------------------
  Cross-cutting foundation`<br>`{=html}Identity, tenant isolation,
  practitioner patient governance, permissions, audit, bilingual FR/AR,
  master data, search, files, notifications and integrations apply across
  all engines.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
