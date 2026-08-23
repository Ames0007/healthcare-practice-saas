# Healthcare Practice Management SaaS

## Specification 02 --- Application Information Architecture & Complete Screen Map

**Market:** Morocco\
**Product type:** Subscription-based, multi-tenant Healthcare Practice
Management SaaS\
**Primary users:** Solo practitioners and small/medium practices,
generally 1--5 users and up to approximately 10\
**Initial specialties:** General medicine, dentistry,
physiotherapy/kinesitherapy, psychology, nutrition,
dermatology/aesthetic medicine, small multi-practitioner practices\
**Languages:** French and Arabic\
**Currency:** MAD\
**Patient-facing strategy:** Responsive public booking and transactional
WhatsApp/SMS; no patient mobile app or full patient portal in V1\
**Design principle:** Solo-first, cabinet-capable; operationally simple
while preserving extensibility.

------------------------------------------------------------------------

# 1. Purpose of this specification

This document translates the agreed Product Blueprint into the complete
information architecture of the web application.

It defines:

-   Application areas and navigation.
-   Every major screen and sub-screen.
-   What each screen displays.
-   Main actions and forms.
-   Search, filters and statuses.
-   Access and permissions.
-   Connections between modules.
-   Important business rules.
-   Notifications, alerts and exception states.
-   Responsive and bilingual considerations.
-   Public patient-facing surfaces.
-   SaaS Super Admin surfaces.
-   V1 versus planned extensions.

This is the functional UI reference that should precede detailed
workflow specifications, data modeling, API design and development.

------------------------------------------------------------------------

# 2. Product UX principles

## 2.1 Solo-first

A solo practitioner must be able to operate the product without seeing
unnecessary enterprise complexity.

When there is no team, advanced team-management menus can remain
collapsed or show a simple invitation call-to-action.

## 2.2 Cabinet-capable

The same product must expand naturally when the owner adds:

-   A receptionist.
-   An assistant.
-   Additional practitioners.
-   Additional operational permissions.

## 2.3 Patient-centered

The Patient is a central operational object. From a patient profile, an
authorized user can reach:

-   Identity and contact.
-   Dossier Santé including documents.
-   Appointments.
-   Treatments/sessions.
-   Invoices.
-   Payments.

## 2.4 One source of truth

Patient-level tabs and global modules are different views of the same
records.

Example:

-   Patient \> Factures = invoices belonging to one patient.
-   Finance \> Factures = invoices for the entire practice.

No duplicate financial records should be created for different views.

## 2.5 Progressive complexity

Features appear according to:

-   Specialty.
-   Team size.
-   Subscription entitlements.
-   Owner configuration.
-   User permissions.

## 2.6 Bilingual by architecture

The interface supports:

-   French, left-to-right.
-   Arabic, right-to-left.

Navigation, forms, master data, validation messages and generated
documents must be localization-ready.

## 2.7 Operational speed

Frequent actions should require few clicks:

-   Create patient.
-   Create appointment.
-   Confirm appointment.
-   Mark patient arrived.
-   Start consultation.
-   Generate invoice.
-   Record cash payment.
-   Print/download receipt.
-   Create next appointment.

------------------------------------------------------------------------

# 3. Global application structure

## 3.1 Primary application areas

``` text
APPLICATION
|
|-- Aujourd'hui
|
|-- Agenda
|   |-- Calendrier
|   |-- Rendez-vous
|   |-- Demandes en ligne
|   `-- File d'attente
|
|-- Patients
|   |-- Liste des patients
|   `-- Fiche patient
|       |-- Aperçu
|       |-- Dossier Santé + Documents
|       |-- Rendez-vous
|       |-- Traitements / Séances
|       |-- Factures
|       `-- Paiements
|
|-- Finance
|   |-- Factures
|   |-- Échéances
|   |-- Encaissements
|   |-- Caisse
|   `-- Décaissements
|
|-- Équipe
|   |-- Personnel
|   |-- Planning / Shifts
|   |-- Congés & Absences
|   |-- Paie
|   `-- Commissions
|
|-- Stock
|   |-- Articles
|   |-- Mouvements
|   |-- Lots / Expirations
|   `-- Alertes
|
|-- Communication
|   |-- Messages
|   |-- Modèles
|   `-- Automatisations / Rappels
|
|-- Rapports
|
|-- Paramètres
|   |-- Cabinet
|   |-- Praticiens
|   |-- Services & Tarifs
|   |-- Horaires
|   |-- Utilisateurs & Permissions
|   |-- Master Data
|   |-- Documents & Numérotation
|   |-- Communication
|   |-- Intégrations
|   `-- Langue & Préférences
|
`-- Abonnement
    |-- Mon abonnement
    |-- Facturation SaaS
    `-- Parrainage
```

------------------------------------------------------------------------

# 4. Global shell

## 4.1 Sidebar

Desktop sidebar contains the primary modules.

Recommended order:

1.  Aujourd'hui
2.  Agenda
3.  Patients
4.  Finance
5.  Équipe
6.  Stock
7.  Communication
8.  Rapports
9.  Paramètres
10. Abonnement

The navigation adapts to permissions and subscription features.

### Rules

-   Owner/Admin sees all enabled modules.
-   Practitioner sees authorized modules and own governed
    patient/clinical scope.
-   Receptionist/Staff sees only modules authorized by Owner/Admin.
-   Hidden permission means hidden navigation and denied backend access.
-   Feature not included in subscription may show a controlled upgrade
    state rather than functional access.

## 4.2 Top bar

Contains:

-   Current practice/cabinet identity.
-   Global search.
-   Quick-create button.
-   Notification center.
-   Language switch FR/AR.
-   User menu.
-   Subscription warning when relevant.

## 4.3 Global quick-create

Recommended actions:

-   Nouveau patient.
-   Nouveau RDV.
-   Nouvelle facture.
-   Nouvel encaissement.
-   Nouveau décaissement.
-   Nouveau mouvement de stock.

Only permitted actions are shown.

## 4.4 Global search

Search should support at minimum:

-   Patient name.
-   Patient number.
-   Phone.
-   Appointment.
-   Invoice number.
-   Receipt/payment reference.
-   Service.
-   Stock item.

Master data should support French and Arabic keywords.

## 4.5 Notification center

Examples:

-   RDV requiring confirmation.
-   Upcoming appointment.
-   Overdue installment.
-   Low stock.
-   Expiring lot.
-   Leave request requiring decision.
-   Subscription renewal warning.
-   Failed integration/message delivery.
-   Referral validated.

------------------------------------------------------------------------

# 5. Authentication

## 5.1 Login

### Fields

-   Email or configured identifier.
-   Password.
-   Remember me.
-   Forgot password.

### Actions

-   Sign in.
-   Reset password.
-   Switch language.

### States

-   Invalid credentials.
-   Locked/suspended user.
-   Expired subscription.
-   Blackout state.
-   Network/system error.

## 5.2 Password reset

-   Request reset.
-   Secure token/link.
-   New password.
-   Confirmation.
-   Expiration handling.

## 5.3 Session/security

-   Logout.
-   Session expiration.
-   Optional future MFA.
-   Owner can revoke staff access.

------------------------------------------------------------------------

# 6. Registration and onboarding

## 6.1 Registration

Initial owner registration captures:

-   Full name.
-   Email.
-   Mobile phone.
-   Password.
-   Acceptance of applicable terms/privacy.
-   Optional referral code attribution.

## 6.2 Practice creation

Fields:

-   Practice/cabinet name.
-   Practitioner display name.
-   Specialty.
-   City.
-   Phone.
-   Optional address.
-   Logo optional.
-   Preferred language.

## 6.3 Specialty selection

Initial options:

-   Médecine générale.
-   Dentaire.
-   Kinésithérapie.
-   Psychologie.
-   Nutrition.
-   Dermatologie / Médecine esthétique.
-   Other configurable specialty.

Specialty affects suggested master data and forms, not tenant isolation.

## 6.4 Working hours

Configure:

-   Working days.
-   Start/end time.
-   Breaks.
-   Appointment mode defaults.
-   Closed days.

## 6.5 Services and prices

User searches platform master data, selects relevant services and
customizes:

-   Name.
-   Duration.
-   Price.
-   Appointment mode.
-   Active/inactive.

Custom service creation remains possible.

## 6.6 Initial data

Optional:

-   Add receptionist/staff.
-   Import patients later.
-   Configure communication.
-   Generate booking link.

## 6.7 Trial

Onboarding shows:

-   Trial status.
-   Trial end date.
-   Selected/default plan.
-   No forced payment before trial if commercial policy permits.

------------------------------------------------------------------------

# 7. Aujourd'hui --- operational home

This is the central daily screen.

## 7.1 Purpose

Answer immediately:

-   Who is coming today?
-   Who needs confirmation?
-   Who is waiting?
-   What has been collected?
-   What remains to be collected?
-   What is happening with the cash register?
-   What requires action?

## 7.2 Header

-   Date.
-   Practitioner filter when relevant.
-   Quick actions.
-   Practice status.

## 7.3 Today's appointments

Each row/card displays:

-   Time or arrival window.
-   Patient.
-   Service/reason.
-   Practitioner.
-   Appointment status.
-   Payment indicator if applicable.
-   Contact shortcut.
-   Actions.

Actions can include:

-   Confirm.
-   Mark arrived.
-   Mark waiting.
-   Start consultation.
-   Complete.
-   Reschedule.
-   Cancel.
-   No-show.
-   Open patient.

## 7.4 Financial snapshot

Show:

-   Encaissements today.
-   Invoiced today.
-   Outstanding today.
-   Overdue amount.
-   Caisse expected balance.
-   Decaissements today.

## 7.5 Alerts/action list

Examples:

-   RDV to confirm.
-   Booking requests.
-   Overdue installments.
-   Patients to recall.
-   Low stock.
-   Expiring stock.
-   Leave requests.
-   Subscription warning.

## 7.6 Empty state

If no appointments:

-   "Aucun rendez-vous aujourd'hui."
-   Create appointment.
-   Open agenda.

------------------------------------------------------------------------

# 8. Agenda --- calendar

## 8.1 Views

-   Day.
-   Week.
-   Optional month summary.
-   Practitioner filter.

## 8.2 Appointment representations

Calendar items visually distinguish:

-   Requested.
-   Confirmed.
-   Arrived.
-   Waiting.
-   In consultation.
-   Completed.
-   Cancelled.
-   No-show.

Payment status should not replace appointment status.

## 8.3 Exact-time appointment

Example:

-   10:00.
-   Expected at 10:00.
-   Service duration may reserve calendar space.

## 8.4 Arrival-window appointment

Example:

-   10:00--10:30 arrival window.

The patient is informed to present during the interval.

Data must preserve:

-   Window start.
-   Window end.
-   Expected service duration if applicable.

## 8.5 Future scheduling mode

Capacity-based slots are planned for later, especially where several
patients may overlap operationally.

## 8.6 Calendar actions

-   Click empty slot -\> create RDV.
-   Click appointment -\> details drawer/page.
-   Reschedule.
-   Change practitioner if permitted.
-   Cancel.
-   Confirm.
-   Mark operational status.

## 8.7 Conflict rules

V1 must prevent obvious practitioner conflicts unless configuration
explicitly permits overlap.

Future roadmap:

-   Room availability.
-   Equipment availability.
-   Capacity constraints.

------------------------------------------------------------------------

# 9. Rendez-vous list

## 9.1 Purpose

Administrative searchable list independent of calendar layout.

## 9.2 Columns

-   Reference.
-   Date.
-   Time/window.
-   Patient.
-   Phone.
-   Practitioner.
-   Service/motif.
-   Source.
-   Appointment status.
-   Financial indicator.
-   Actions.

## 9.3 Filters

-   Date range.
-   Practitioner.
-   Status.
-   Service.
-   Source.
-   New/existing patient.
-   No-show.
-   Cancelled.

## 9.4 Sources

-   Receptionist.
-   Practitioner.
-   Public booking link.

------------------------------------------------------------------------

# 10. Create/Edit appointment

## 10.1 Patient

Options:

-   Search existing patient.
-   Quick-create new patient.

Duplicate warning based on combinations such as:

-   Phone.
-   Name.
-   Other configured identifiers.

## 10.2 Appointment fields

-   Practitioner.
-   Service/reason.
-   Appointment mode: exact / window.
-   Date.
-   Exact time OR window start/end.
-   Duration.
-   Notes.
-   Communication preference where relevant.
-   Internal note optional.

## 10.3 Confirmation

User can:

-   Save as requested/to confirm.
-   Save and confirm.
-   Trigger configured confirmation message.

## 10.4 Edit history

Important changes should be auditable:

-   Date/time.
-   Practitioner.
-   Status.
-   Cancellation.
-   Reschedule.

------------------------------------------------------------------------

# 11. Public booking requests

## 11.1 Inbox

Shows requests generated from public link/QR.

Columns:

-   Request date.
-   Patient name.
-   Phone.
-   Reason/service.
-   Requested date/time/window.
-   Practitioner.
-   Status.

## 11.2 Request statuses

-   Requested.
-   Under review / To confirm.
-   Confirmed.
-   Alternative proposed.
-   Rejected.
-   Cancelled.

## 11.3 Reception actions

-   Confirm requested slot.
-   Propose another slot.
-   Reject.
-   Contact patient.
-   Match to existing patient.
-   Create patient when accepted.

## 11.4 Rule

Patient self-booking does not automatically guarantee the appointment in
V1. Reception/practice validation is required.

------------------------------------------------------------------------

# 12. File d'attente / Waiting room

## 12.1 Purpose

Operational patient flow.

## 12.2 Main statuses

-   Expected.
-   Arrived.
-   Waiting.
-   In consultation.
-   Completed.

## 12.3 Display

-   Patient.
-   Appointment time/window.
-   Arrival time.
-   Waiting duration.
-   Practitioner.
-   Service.
-   Status.

## 12.4 KPIs enabled later

-   Average waiting time.
-   Late arrival rate.
-   Average consultation start delay.

------------------------------------------------------------------------

# 13. Patients --- list

## 13.1 Columns

-   Patient number.
-   Full name.
-   Phone.
-   Responsible practitioner.
-   Last visit.
-   Next appointment.
-   Outstanding balance.
-   Status if required.

## 13.2 Search

-   Name.
-   Phone.
-   Patient number.
-   Optional identifier.
-   Keywords where relevant.

## 13.3 Filters

-   Responsible practitioner.
-   Has upcoming appointment.
-   Has overdue payment.
-   Active treatment/session plan.
-   Recently created.

## 13.4 Actions

-   New patient.
-   Open.
-   Create RDV.
-   Create invoice if permitted.
-   Contact.

------------------------------------------------------------------------

# 14. Create/Edit patient

## 14.1 Administrative identity

Core fields:

-   First name.
-   Last name.
-   Phone.
-   Optional secondary phone.
-   Email optional.
-   Date of birth.
-   Sex/gender field only if operationally/clinically required and
    legally appropriate.
-   Address optional.
-   City.
-   Patient number automatically generated.
-   Responsible practitioner.
-   Emergency contact optional.

## 14.2 Duplicate detection

Before creation, system checks probable duplicates.

User may:

-   Open existing record.
-   Confirm new patient if genuinely different.

## 14.3 Data governance

Patient belongs to the tenant and is governed by responsible
practitioner/access permissions.

Additional practitioner access is not automatically assumed.

------------------------------------------------------------------------

# 15. Patient 360° profile

## 15.1 Header

Displays:

-   Full name.
-   Patient number.
-   Phone.
-   Age/date of birth where appropriate.
-   Responsible practitioner.
-   Last visit.
-   Next RDV.
-   Outstanding balance.
-   Quick actions.

## 15.2 Tabs

1.  Aperçu.
2.  Dossier Santé + Documents.
3.  Rendez-vous.
4.  Traitements / Séances.
5.  Factures.
6.  Paiements.

## 15.3 Quick actions

-   New RDV.
-   Add clinical entry.
-   Add document.
-   New treatment/session plan.
-   New invoice.
-   Record payment.
-   Send message, subject to permissions.

------------------------------------------------------------------------

# 16. Patient overview

## 16.1 Summary cards

-   Next appointment.
-   Last appointment.
-   Active treatment.
-   Number of remaining sessions.
-   Outstanding amount.
-   Next installment.
-   Recent documents.

## 16.2 Timeline

Unified patient timeline may show:

-   Patient created.
-   Appointment.
-   Consultation/session.
-   Document added.
-   Invoice issued.
-   Payment recorded.
-   Treatment updated.
-   Communication event.

Clinical visibility remains permission-controlled.

------------------------------------------------------------------------

# 17. Dossier Santé + Documents

Medical records and documents are intentionally merged into one patient
area.

## 17.1 General health information

Configurable forms based on specialty/master data.

Possible categories:

-   Allergies.
-   Medical history.
-   Current treatments/medications.
-   Relevant conditions.
-   Observations.
-   Measurements.
-   Clinical notes.
-   Prescriptions.
-   Consultation/session history.

## 17.2 Form philosophy

Platform provides master-data-backed general information.

Practitioner can:

-   Search by keyword.
-   Select predefined values.
-   Add custom values.
-   Add specialty-specific details.
-   Save reusable practice-level configuration where appropriate.

## 17.3 Clinical entries

Each entry records:

-   Date/time.
-   Practitioner.
-   Type.
-   Structured fields.
-   Free notes where appropriate.
-   Attachments.
-   Audit metadata.

## 17.4 Documents

Supported categories can include:

-   PDF.
-   Image.
-   X-ray.
-   Laboratory result.
-   Report.
-   Certificate.
-   Prescription.
-   Other.

Document metadata:

-   Title.
-   Type.
-   Date.
-   Practitioner.
-   Description.
-   File.
-   Visibility/access.

## 17.5 Generated clinical documents

System should support templates for:

-   Prescription.
-   Certificate.
-   Report.
-   Referral/other practice document where configured.

Templates can use:

-   Practice identity.
-   Practitioner identity.
-   Patient identity.
-   Date.
-   Numbering.
-   Logo.

## 17.6 Security

Receptionist clinical access is not assumed. Owner controls access where
appropriate.

Sensitive records must be audited.

------------------------------------------------------------------------

# 18. Patient appointments tab

Displays only appointments for the current patient.

Columns:

-   Date.
-   Time/window.
-   Practitioner.
-   Service.
-   Status.
-   Source.

Actions:

-   Create next RDV.
-   Reschedule.
-   Cancel.
-   Open appointment.

------------------------------------------------------------------------

# 19. Treatments / Sessions

## 19.1 Purpose

Support care delivered over multiple services/sessions and connect
clinical progression with financial progression.

Especially important for:

-   Kinesitherapy.
-   Dentistry.
-   Dermatology/aesthetic treatment plans.
-   Other recurring care.

## 19.2 Treatment plan header

-   Reference.
-   Patient.
-   Practitioner.
-   Name/type.
-   Start date.
-   Expected end date optional.
-   Number of sessions.
-   Status.
-   Total planned value if applicable.
-   Financial summary.

## 19.3 Treatment statuses

Suggested:

-   Draft.
-   Planned.
-   Active.
-   Paused.
-   Completed.
-   Cancelled.

## 19.4 Sessions

Each session can include:

-   Sequence number.
-   Planned date.
-   Actual date.
-   Practitioner.
-   Service.
-   Status.
-   Notes/clinical entry reference.
-   Invoice/billing reference where relevant.

## 19.5 Session statuses

-   Planned.
-   Scheduled.
-   Completed.
-   Missed.
-   Cancelled.

## 19.6 Kiné example

``` text
Plan: Rééducation genou
20 sessions

01 Completed
02 Completed
03 Completed
04 Scheduled
05 Not scheduled
...
20 Not scheduled
```

## 19.7 Financial connection

Treatment can connect to:

-   One invoice.
-   Multiple invoices.
-   Installment plan.
-   Payments.

Clinical completion and payment completion remain separate.

------------------------------------------------------------------------

# 20. Patient invoices tab

Displays:

-   Invoice number.
-   Date.
-   Services.
-   Total.
-   Paid.
-   Remaining.
-   Status.

Actions:

-   Open.
-   Download/print.
-   Record payment.
-   View installments.
-   Download receipt after payment.

------------------------------------------------------------------------

# 21. Patient payments tab

Displays:

-   Payment reference.
-   Date.
-   Invoice.
-   Amount.
-   Payment method.
-   Receipt.
-   User who recorded it.

V1 primary payment mode is cash, while the data model should permit
future methods.

------------------------------------------------------------------------

# 22. Finance overview

## 22.1 Purpose

Cabinet-wide operational financial control, not full accounting.

## 22.2 Core indicators

-   Amount invoiced.
-   Amount collected.
-   Outstanding balance.
-   Overdue balance.
-   Installments due.
-   Collection rate.
-   Decaissements.
-   Operational balance indicators.

Filters:

-   Today.
-   Week.
-   Month.
-   Custom period.
-   Practitioner.
-   Service.

------------------------------------------------------------------------

# 23. Factures --- global

## 23.1 List columns

-   Invoice number.
-   Date.
-   Patient.
-   Practitioner.
-   Appointment/treatment reference.
-   Total.
-   Paid.
-   Remaining.
-   Status.

## 23.2 Invoice statuses

-   Draft.
-   Issued.
-   Partially paid.
-   Paid.
-   Overdue where applicable.
-   Cancelled.

## 23.3 Create invoice

Invoice may originate from:

-   Completed appointment.
-   Treatment plan.
-   Session/service.
-   Manual authorized creation.

Fields:

-   Patient.
-   Practitioner.
-   Reference appointment/treatment.
-   Invoice date.
-   Lines/services.
-   Quantity.
-   Unit price.
-   Discount if allowed.
-   Tax configuration.
-   Total.
-   Notes.
-   Number automatically generated according to configuration.

## 23.4 Paper replacement

The generated invoice should replace the manually numbered paper invoice
workflow where adopted.

It must be:

-   Printable.
-   Downloadable.
-   Numbered.
-   Traceable.
-   Linked to patient and underlying activity.

------------------------------------------------------------------------

# 24. Installments / Échéances

## 24.1 Purpose

Manage staged patient payments.

Example:

``` text
Invoice: 12,000 MAD
Payment 1: 3,000
Payment 2: 3,000
Payment 3: 3,000
Payment 4: 3,000
```

## 24.2 Installment fields

-   Invoice.
-   Sequence.
-   Due date.
-   Expected amount.
-   Paid amount.
-   Remaining.
-   Status.

## 24.3 Statuses

-   Upcoming.
-   Due.
-   Partially paid.
-   Paid.
-   Overdue.

## 24.4 Views

-   All installments.
-   Due today.
-   Due this week.
-   Overdue.
-   By patient.

## 24.5 Reminders

Eligible for automated WhatsApp/SMS reminder templates.

------------------------------------------------------------------------

# 25. Encaissements / Payments

## 25.1 Record payment

Fields:

-   Patient.
-   Invoice.
-   Installment optional.
-   Amount.
-   Payment method.
-   Date/time.
-   Cash register.
-   Note.
-   Reference generated automatically.

## 25.2 V1 payment policy

No patient online payment required.

Primary operational payment is cash.

System may retain extensible payment method master data for future use.

## 25.3 Effects of a payment

Recording a valid cash payment should:

1.  Create payment.
2.  Update invoice paid/remaining amounts.
3.  Update installment where linked.
4.  Generate receipt.
5.  Create corresponding caisse entry.
6.  Update dashboards.

These should be one coherent transaction.

------------------------------------------------------------------------

# 26. Receipts

Receipt contains:

-   Practice identity.
-   Receipt number.
-   Patient.
-   Invoice reference.
-   Amount.
-   Payment date.
-   Payment method.
-   Remaining balance where appropriate.
-   Practitioner/practice information.
-   Configured footer.

Actions:

-   Print.
-   Download.
-   Reprint with audit trace.

------------------------------------------------------------------------

# 27. Caisse

Caisse is a first-class module.

## 27.1 Daily caisse

Displays:

-   Date.
-   Opening status.
-   Opening balance.
-   Cash inflows.
-   Cash outflows.
-   Expected balance.
-   Physical closing balance.
-   Difference.
-   Closing status.

## 27.2 Open caisse

Fields:

-   Opening balance.
-   Date/time.
-   User.

## 27.3 Cash inflows

Primarily created automatically from recorded cash patient payments.

Manual inflow should require explicit permission and reason.

## 27.4 Cash outflows

Examples:

-   Utility.
-   Service provider.
-   Supplies.
-   Miscellaneous authorized expense.

## 27.5 Close caisse

User enters:

-   Physical cash counted.
-   Optional denomination details later.
-   Difference reason if mismatch.

System calculates:

``` text
Opening cash
+ Cash inflows
- Cash outflows
= Expected cash

Physical cash - Expected cash = Difference
```

## 27.6 Controls

-   Closed caisse should not be silently edited.
-   Corrections require controlled adjustment/audit.
-   Owner can review discrepancies.

------------------------------------------------------------------------

# 28. Décaissements / Expenses

## 28.1 Purpose

Operational outgoing payments without implementing full accounting.

## 28.2 Categories

Master data may include:

-   Rent.
-   Utilities.
-   Service providers/prestataires.
-   Salaries.
-   Supplies.
-   Maintenance.
-   Other.

## 28.3 Fields

-   Date.
-   Category.
-   Beneficiary/prestataire.
-   Description.
-   Amount.
-   Payment method.
-   Cash register if cash.
-   Supporting document optional.
-   Entered by.
-   Notes.

## 28.4 Reporting

Support:

-   Expenses by category.
-   Expenses by period.
-   Service-provider payments.
-   Cash vs other payment method.
-   Operational balance.

------------------------------------------------------------------------

# 29. Équipe --- Personnel

## 29.1 Roles kept intentionally light

V1 conceptual roles:

### Owner / Admin

Usually the subscribing practitioner.

-   Full administrative control.
-   Full configuration.
-   Subscription management.
-   Permission management.
-   Own practitioner functionality.

### Practitioner

Used when additional practitioners exist.

-   Governed access to own patients/clinical activity.
-   Agenda.
-   Clinical functionality.
-   Other access as permitted.

### Receptionist / Staff

Administrative user.

-   Appointment functions by default.
-   Additional modules only if Owner/Admin enables them.

## 29.2 Employee profile

Fields may include:

-   Name.
-   Contact.
-   Role/profile.
-   Employment status.
-   Start date.
-   Contract information.
-   Working schedule.
-   Salary configuration.
-   Bonus configuration.
-   Commission configuration where applicable.
-   Documents.
-   Permissions.

------------------------------------------------------------------------

# 30. Permissions

No complex customer-facing RBAC designer in V1.

Owner/Admin sees a simple permission matrix.

Examples:

-   Patients: view/create/edit administrative data.
-   Appointments: view/create/edit/confirm/cancel.
-   Clinical data: access denied/allowed as appropriate.
-   Invoices: view/create.
-   Payments: record/view.
-   Caisse: access/open/close.
-   Expenses: view/create.
-   HR: access.
-   Payroll: access.
-   Inventory: access.
-   Reports: access.
-   Settings: access.

Backend authorization must enforce the same permissions.

------------------------------------------------------------------------

# 31. Planning / Shifts

No clock-in/clock-out functionality in V1.

## 31.1 Functions

-   Define employee working schedule.
-   Define shifts.
-   View weekly/monthly team schedule.
-   Record exceptional schedule changes.
-   Support absence/leave impact.

## 31.2 Future relationship

Practitioner availability can be derived from configured working
schedule and leave.

------------------------------------------------------------------------

# 32. Congés & Absences

## 32.1 Staff view

-   Leave balance where configured.
-   Request leave.
-   View requests.
-   View approved leave.

## 32.2 Owner/Admin

-   Approve.
-   Reject.
-   Modify according to policy.
-   View team calendar.

## 32.3 Fields

-   Employee.
-   Leave type.
-   Start/end.
-   Partial day if supported.
-   Reason.
-   Attachment optional.
-   Status.

## 32.4 Statuses

-   Draft.
-   Submitted.
-   Approved.
-   Rejected.
-   Cancelled.

------------------------------------------------------------------------

# 33. Payroll / Paie

This is operational payroll management, not statutory accounting.

## 33.1 Employee payroll setup

Possible elements:

-   Base salary.
-   Bonuses.
-   Overtime manually entered/validated.
-   Commissions.
-   Deductions if configured.
-   Other adjustments.

## 33.2 Payroll period

-   Month.
-   Employee.
-   Base.
-   Additions.
-   Deductions.
-   Commission.
-   Net operational amount.
-   Payment status.

Legal/statutory payroll requirements should be separately validated
before claiming compliance.

------------------------------------------------------------------------

# 34. Practitioner commissions

## 34.1 Commission methods

System should support configurable methods such as:

-   Percentage of collected amount.
-   Percentage of invoiced amount.
-   Fixed amount per service.
-   Different rate by service.
-   Fixed salary + commission.
-   Commission-only.

## 34.2 Recommended default

Collected amount is a useful default basis because it avoids paying
commission on uncollected revenue, while the system should support the
other agreed methods.

## 34.3 Commission screen

Displays:

-   Practitioner.
-   Period.
-   Eligible services.
-   Invoiced amount.
-   Collected amount.
-   Commission basis.
-   Rate.
-   Commission calculated.
-   Adjustments.
-   Paid/unpaid.

## 34.4 Audit

Manual adjustments require:

-   Reason.
-   User.
-   Timestamp.

------------------------------------------------------------------------

# 35. Inventory --- Articles

No purchasing workflow in V1.

## 35.1 Item fields

-   Item code.
-   Name FR.
-   Name AR optional/master.
-   Category.
-   Unit.
-   Current stock.
-   Minimum stock.
-   Lot tracking yes/no.
-   Expiration tracking yes/no.
-   Active/inactive.

## 35.2 Search

-   Item name.
-   Code.
-   Category.
-   French/Arabic keywords.

------------------------------------------------------------------------

# 36. Stock movements

## 36.1 Types

-   Stock IN.
-   Stock OUT.
-   Adjustment.

## 36.2 Fields

-   Item.
-   Quantity.
-   Unit.
-   Date.
-   Lot.
-   Expiration.
-   Reason.
-   User.
-   Note.

## 36.3 Balance

Every movement updates the item balance.

Historical movements remain auditable.

------------------------------------------------------------------------

# 37. Lots and expiration

For lot-tracked items:

-   Lot number.
-   Quantity.
-   Entry date.
-   Expiration date.
-   Remaining quantity.

Alerts:

-   Expiring soon.
-   Expired.
-   Low stock.

------------------------------------------------------------------------

# 38. Communication center

Primary external channels:

-   WhatsApp.
-   SMS.

Google Calendar is an integration, not a patient messaging channel.

## 38.1 Message history

Display:

-   Patient.
-   Channel.
-   Template/type.
-   Date/time.
-   Delivery status.
-   Related appointment/payment if relevant.

## 38.2 Delivery statuses

Depending on provider capabilities:

-   Queued.
-   Sent.
-   Delivered.
-   Failed.

------------------------------------------------------------------------

# 39. Message templates

## 39.1 Template categories

-   Appointment confirmation.
-   Appointment reminder.
-   Appointment change.
-   Appointment cancellation.
-   Booking request response.
-   Payment confirmation.
-   Installment reminder.
-   Overdue payment reminder.
-   Follow-up.
-   Next session reminder.
-   Custom operational template.

## 39.2 Template fields

-   Name.
-   Channel.
-   Language.
-   Message body.
-   Variables.
-   Active/inactive.

Possible variables:

-   Patient name.
-   Practitioner name.
-   Appointment date.
-   Appointment time/window.
-   Practice name.
-   Amount.
-   Remaining balance.
-   Installment due date.

## 39.3 Master + customization

Platform can provide default templates.

Practice can copy/customize its own versions.

------------------------------------------------------------------------

# 40. Communication automations

V1 rules may include:

-   Send confirmation when appointment confirmed.
-   Send reminder X hours/days before appointment.
-   Send modification notice.
-   Send cancellation notice.
-   Send payment receipt/confirmation message.
-   Send installment reminder.
-   Send overdue reminder.

Owner can configure whether each automation is active.

------------------------------------------------------------------------

# 41. Google Calendar integration

## 41.1 Purpose

Allow practitioner to synchronize relevant appointment schedule with
Google Calendar.

## 41.2 Configuration

-   Connect account.
-   Choose calendar.
-   Enable/disable sync.
-   Define direction according to V1 integration design.

## 41.3 Safety

The application remains the authoritative source for internal
appointment workflow statuses unless a later integration specification
defines otherwise.

------------------------------------------------------------------------

# 42. Reports & dashboards

## 42.1 Appointment KPIs

-   Appointments by day/week/month.
-   Confirmed.
-   Completed.
-   Cancelled.
-   No-show.
-   Confirmation rate.
-   No-show rate.
-   Practitioner activity.
-   Service activity.

## 42.2 Financial KPIs

-   Invoiced.
-   Collected.
-   Outstanding.
-   Overdue.
-   Collection rate.
-   Installments due.
-   Decaissements.
-   Caisse discrepancies.
-   Revenue/collections by practitioner.
-   Revenue/collections by service.

## 42.3 Patient KPIs

-   New patients.
-   Returning patients.
-   Active treatment plans.
-   Sessions completed.
-   Patients with overdue balances.

## 42.4 HR KPIs

When team exists:

-   Headcount.
-   Leave.
-   Payroll.
-   Commission.
-   Practitioner production/collections.

## 42.5 Inventory KPIs

-   Low-stock items.
-   Expiring lots.
-   Stock movement volume.

## 42.6 Filters

-   Date period.
-   Practitioner.
-   Service.
-   Relevant specialty dimensions.

------------------------------------------------------------------------

# 43. Master Data

Master data is a major product capability.

## 43.1 Platform master data

Maintained centrally by SaaS administration.

Examples:

-   Specialties.
-   Services.
-   Treatment types.
-   Health-information categories.
-   Document types.
-   Expense categories.
-   Stock categories.
-   Units.
-   Leave types.
-   Payment methods.
-   Message-template starters.
-   Appointment reasons/status metadata where configurable.

## 43.2 Practice master data

Practice can:

-   Search global master.
-   Select item.
-   Customize local copy/configuration.
-   Add custom item.
-   Activate/deactivate.

Practice cannot modify global data for other tenants.

## 43.3 Search architecture

Master records should support:

-   French label.
-   Arabic label.
-   French keywords.
-   Arabic keywords.
-   Specialty tags.
-   Active status.

------------------------------------------------------------------------

# 44. Settings --- Cabinet

Fields:

-   Practice name.
-   Logo.
-   Specialty.
-   Address.
-   City.
-   Phone.
-   Email.
-   Display information.
-   Language.
-   Currency fixed to MAD initially.
-   Document footer details.

------------------------------------------------------------------------

# 45. Settings --- Services & pricing

For each service:

-   Master/custom source.
-   Name.
-   Specialty.
-   Duration.
-   Price.
-   Appointment mode.
-   Active.
-   Commission configuration optional.
-   Treatment/session applicability.

------------------------------------------------------------------------

# 46. Settings --- Working hours

Configure:

-   Practice hours.
-   Practitioner hours.
-   Breaks.
-   Days off.
-   Appointment durations/defaults.
-   Exact-time/window mode.

Future:

-   Room schedules.
-   Equipment schedules.
-   Capacity slots.

------------------------------------------------------------------------

# 47. Settings --- Documents & numbering

Configure numbering patterns for:

-   Patient numbers.
-   Invoices.
-   Receipts.
-   Treatment plans.
-   Other generated documents.

Configure:

-   Invoice template.
-   Prescription template.
-   Logo.
-   Header/footer.
-   Language.
-   Tax display.

Numbering changes should protect uniqueness and auditability.

------------------------------------------------------------------------

# 48. Settings --- Users & permissions

## 48.1 User list

-   Name.
-   Profile.
-   Practitioner/staff type.
-   Status.
-   Last access if appropriate.
-   Permissions summary.

## 48.2 Actions

-   Invite/add.
-   Activate/deactivate.
-   Reset access.
-   Configure permissions.
-   Associate responsible practitioner scope.

------------------------------------------------------------------------

# 49. Subscription area

## 49.1 Mon abonnement

Displays:

-   Plan.
-   Status.
-   Monthly/annual.
-   Start date.
-   Renewal date.
-   Trial end date.
-   Grace status.
-   Included limits/features.
-   Renewal action.

## 49.2 Subscription statuses

-   Trialing.
-   Active.
-   Expired.
-   Grace.
-   Blackout/suspended for non-payment.
-   Cancelled.

## 49.3 Expiration policy

Agreed operational sequence:

-   Multiple reminders before expiration.
-   Expiration at D0.
-   Three-day grace period after expiration.
-   Blackout after grace.

Blackout does not delete data.

Allowed blackout actions:

-   View subscription state.
-   Renew/pay.
-   Contact support.
-   Logout.

Operational modules are blocked.

------------------------------------------------------------------------

# 50. Pricing UX

Pricing should remain simple.

Product architecture should support a small number of clear plans such
as:

-   Solo.
-   Cabinet.
-   Cabinet+ / Pro if needed.

Potential expansion dimensions can exist technically without exposing
complicated pricing:

-   Additional practitioner.
-   Additional staff.
-   Communication usage.
-   Storage.
-   Future premium features.

Actual MAD prices remain a commercial decision requiring market
validation.

------------------------------------------------------------------------

# 51. Referral / Parrainage

## 51.1 Customer view

Displays:

-   Referral code.
-   Referral link.
-   Share action.
-   Referral history.
-   Referral status.
-   Earned free months.

## 51.2 Reward

Agreed principle:

A practitioner who brings a genuinely new customer that becomes a
qualified paying subscriber receives one free month.

## 51.3 Qualification flow

``` text
Referral attribution
-> New customer registers
-> Trial
-> First successful paid subscription
-> Validation/anti-fraud period
-> Referral qualified
-> +1 free subscription month
```

## 51.4 Anti-abuse

-   New customers only.
-   No reward for trial-only registration.
-   One referred practice = one reward.
-   Reward in subscription time, not cash.
-   Validation delay.
-   Detect obvious self-referral/shared identity/payment patterns.
-   Admin can review/reject.
-   Annual reward cap can be configured.
-   Full referral audit history.

------------------------------------------------------------------------

# 52. Public booking page

Public URL format for V1:

``` text
app.ma/book/{cabinet-slug}
```

No subdomain required in V1.

## 52.1 Header

-   Logo.
-   Practice name.
-   Practitioner name if relevant.
-   Specialty.
-   Contact/basic information.

## 52.2 Lightweight booking form

Required/minimal fields:

-   First name.
-   Last name.
-   Phone.
-   Reason/service.
-   Desired date.
-   Desired slot/window.
-   Optional comment.

Avoid heavy medical forms during booking.

## 52.3 Submission result

Patient sees:

-   Request received.
-   Appointment is pending validation.
-   Practice will confirm by WhatsApp/SMS.

Do not falsely present an unvalidated request as confirmed.

------------------------------------------------------------------------

# 53. QR code

Practice can generate a QR code pointing to its public booking page.

Actions:

-   Display.
-   Download.
-   Print.
-   Copy booking link.

Use cases:

-   Reception.
-   Business card.
-   Social media.
-   Invoice/prescription.
-   Waiting room.

------------------------------------------------------------------------

# 54. Patient self-service change/cancellation

V1 concept:

Patient may submit a cancellation or rescheduling request through a
controlled public mechanism/message link if implemented.

The request requires practice/reception validation before internal
appointment state is finalized where the configured workflow requires
validation.

No full patient account is necessary.

------------------------------------------------------------------------

# 55. SaaS Super Admin

Separate from customer practice administration.

## 55.1 Dashboard

KPIs:

-   Total tenants.
-   Active subscribers.
-   Trials.
-   New subscriptions.
-   Expiring subscriptions.
-   Suspended/blackout.
-   MRR/ARR when implemented.
-   Churn.
-   Referral conversions.
-   Usage indicators.

## 55.2 Tenants

List:

-   Practice.
-   Owner.
-   Specialty.
-   Plan.
-   Status.
-   Created date.
-   Renewal.
-   Users.
-   Usage indicators.

Actions must be controlled and audited.

## 55.3 Subscription management

-   Plans.
-   Prices.
-   Monthly/annual.
-   Trials.
-   Renewal.
-   Grace.
-   Suspension.
-   Manual administrative adjustment.
-   Referral credits.

## 55.4 Master data administration

Manage global:

-   Specialties.
-   Services.
-   Categories.
-   Units.
-   Default templates.
-   Other global dictionaries.

## 55.5 Referral administration

-   Referral.
-   Referrer.
-   Referred tenant.
-   Qualification state.
-   Payment qualification.
-   Fraud flags.
-   Reward.
-   Approve/reject/void.

## 55.6 Support/operations

Future/controlled:

-   Tenant support status.
-   System notices.
-   Integration status.
-   Audit inspection subject to security/privacy policy.

------------------------------------------------------------------------

# 56. Audit logs

Important actions should create audit events.

Examples:

-   Patient administrative data changed.
-   Clinical record created/edited.
-   Document uploaded/deleted.
-   Appointment rescheduled/cancelled.
-   Invoice amount changed.
-   Payment recorded/reversed.
-   Cash adjustment.
-   Expense changed.
-   Payroll/commission adjusted.
-   Permission changed.
-   Subscription manually changed.

Audit fields:

-   Actor.
-   Tenant.
-   Action.
-   Resource.
-   Timestamp.
-   Before/after where appropriate and safe.
-   Reason for sensitive adjustments.

------------------------------------------------------------------------

# 57. Status architecture

Statuses must remain domain-specific.

## 57.1 Appointment

-   Requested.
-   To confirm.
-   Confirmed.
-   Arrived.
-   Waiting.
-   In consultation.
-   Completed.
-   Rescheduled.
-   Cancelled by patient.
-   Cancelled by practice.
-   No-show.

## 57.2 Treatment

-   Draft.
-   Planned.
-   Active.
-   Paused.
-   Completed.
-   Cancelled.

## 57.3 Session

-   Planned.
-   Scheduled.
-   Completed.
-   Missed.
-   Cancelled.

## 57.4 Invoice

-   Draft.
-   Issued.
-   Partially paid.
-   Paid.
-   Overdue where applicable.
-   Cancelled.

## 57.5 Installment

-   Upcoming.
-   Due.
-   Partially paid.
-   Paid.
-   Overdue.

## 57.6 Leave

-   Draft.
-   Submitted.
-   Approved.
-   Rejected.
-   Cancelled.

## 57.7 Subscription

-   Trialing.
-   Active.
-   Expired.
-   Grace.
-   Blackout.
-   Cancelled.

Never infer one domain status solely from another without explicit
business rules.

------------------------------------------------------------------------

# 58. Permission principles

## Owner/Admin

-   Full application access.
-   Full practice configuration.
-   Subscription/referral.
-   Permissions.
-   Financial/HR access.
-   Clinical access according to product governance.

## Practitioner

Default conceptual access:

-   Own agenda.
-   Own governed patients.
-   Own clinical records.
-   Own treatment/session activity.

Other financial/HR access is configurable.

## Receptionist/Staff

Default:

-   Administrative patient information as allowed.
-   Appointments.
-   Booking requests.
-   Waiting room.

Optional permissions granted by Owner:

-   Invoices.
-   Payments.
-   Caisse.
-   Expenses.
-   HR.
-   Inventory.
-   Reports.
-   Other non-clinical areas.

Clinical access should not be casually enabled.

------------------------------------------------------------------------

# 59. Data isolation UX implications

Every internal business record belongs to a tenant.

Patient governance additionally supports responsible practitioner
ownership/access rules.

UI must never rely on hidden buttons as security.

Every API/query must enforce:

1.  Authenticated user.
2.  Active membership.
3.  Correct tenant.
4.  Subscription state.
5.  Feature entitlement.
6.  Permission.
7.  Resource ownership/governance.

------------------------------------------------------------------------

# 60. Empty states

Every major module should have useful empty states.

Examples:

### Patients

"No patients yet." Actions: - Add first patient. - Import later.

### Agenda

"No appointments." - Create RDV. - Share booking link.

### Team

"You are currently working solo." - Add receptionist. - Add
practitioner.

### Inventory

"No stock items." - Add item. - Start from master data.

### Communication

"No messages yet." - Configure WhatsApp/SMS.

Empty states should teach the product rather than appear broken.

------------------------------------------------------------------------

# 61. Error and exception states

Standardize:

-   Validation error.
-   Permission denied.
-   Subscription feature unavailable.
-   Subscription blackout.
-   Duplicate patient warning.
-   Appointment conflict.
-   Payment exceeds remaining amount.
-   Closed caisse modification.
-   Missing communication configuration.
-   Message delivery failure.
-   File upload failure.
-   Stock movement invalid.
-   Network/system error.

User-facing errors should be understandable in FR/AR.

------------------------------------------------------------------------

# 62. Responsive web

No mobile application is planned initially.

The web application must nevertheless be responsive.

Priority mobile-friendly actions:

-   Today's agenda.
-   Open patient.
-   Appointment status update.
-   Clinical note.
-   Contact patient.
-   Payment lookup.
-   Public booking.

Complex administration may remain optimized for desktop/tablet while
still usable responsively.

------------------------------------------------------------------------

# 63. French / Arabic UX

## 63.1 French

Default LTR layout.

## 63.2 Arabic

RTL layout must correctly mirror:

-   Sidebar.
-   Form alignment.
-   Tables where appropriate.
-   Icons with directional meaning.
-   Breadcrumbs.
-   Pagination.
-   Drawers/modals.

## 63.3 Data

Do not assume all patient names or free text use the current UI
language.

Unicode support is mandatory.

------------------------------------------------------------------------

# 64. Notifications and reminders matrix

  Event                    Internal notification   WhatsApp/SMS candidate
  ------------------------ ----------------------- ------------------------
  Public booking request   Reception/Admin         Patient acknowledgment
  Appointment confirmed    Relevant staff          Patient confirmation
  Appointment upcoming     Optional                Patient reminder
  Appointment changed      Relevant staff          Patient update
  Appointment cancelled    Relevant staff          Patient notice
  Installment upcoming     Finance/Reception       Patient reminder
  Installment overdue      Finance/Reception       Patient reminder
  Payment recorded         Optional                Patient confirmation
  Low stock                Owner/authorized        No
  Stock expiring           Owner/authorized        No
  Leave request            Owner                   No
  Subscription expiring    Owner                   Owner contact channels
  Referral qualified       Owner                   Optional owner notice

------------------------------------------------------------------------

# 65. Key cross-module links

## Appointment -\> Patient

Every appointment belongs to or creates/matches a patient.

## Appointment -\> Service

Appointment can reference service/reason.

## Appointment -\> Practitioner

Responsible practitioner is explicit.

## Appointment -\> Invoice

Completed activity may be used to generate invoice.

## Treatment -\> Sessions

Treatment manages longitudinal care.

## Treatment -\> Invoice/Installments

Financial plan may be associated without making clinical state dependent
on payment state.

## Payment -\> Invoice

Payment reduces outstanding balance.

## Cash payment -\> Caisse

Cash payment creates cash inflow.

## Expense paid in cash -\> Caisse

Cash decaissement reduces expected cash.

## Service -\> Commission

Service can define practitioner commission rule.

## Employee -\> Payroll -\> Commission

Commission contributes to operational payroll calculation where
configured.

## Inventory movement -\> Stock balance

All changes must be movement-based/auditable.

------------------------------------------------------------------------

# 66. Navigation behavior by customer type

## 66.1 Solo practitioner

Recommended visible navigation:

-   Aujourd'hui.
-   Agenda.
-   Patients.
-   Finance.
-   Stock if enabled.
-   Communication.
-   Rapports.
-   Paramètres.
-   Abonnement.

Équipe can remain minimal or hidden behind setup.

## 66.2 Practitioner + receptionist

Add:

-   Équipe.
-   Permissions.
-   Shared operational appointment workflow.

## 66.3 Multi-practitioner cabinet

Add:

-   Practitioner filters.
-   Responsible-practitioner governance.
-   Commissions.
-   Team schedule.
-   Consolidated reports subject to owner permissions.

------------------------------------------------------------------------

# 67. Specialty adaptation

One application, not separate products.

## Dentistry

Potential specialty additions later:

-   Odontogram.
-   Tooth-level treatment history.
-   Dental imaging workflow.

## Kinesitherapy

Strong V1 relevance:

-   Treatment/session plan.
-   Session count.
-   Progress notes.
-   Recurring scheduling.

## Psychology

-   Session history.
-   Highly restricted clinical notes.
-   Recurring appointments.

## Nutrition

-   Measurements.
-   Follow-up plans.
-   Recurrent consultation history.

## Dermatology / Aesthetic

-   Treatment plans.
-   Session packages.
-   Images/documents.
-   Follow-up.

## General medicine

-   Consultation.
-   Dossier Santé.
-   Prescription/certificate.
-   Follow-up.

Specialty-specific advanced clinical modules should not fragment the
common platform.

------------------------------------------------------------------------

# 68. V1 screen inventory

The V1 application should account for at least the following screen
families:

1.  Login.
2.  Password reset.
3.  Registration.
4.  Onboarding.
5.  Aujourd'hui.
6.  Agenda calendar.
7.  Appointment list.
8.  Appointment create/edit/details.
9.  Public booking requests.
10. Waiting room.
11. Patient list.
12. Patient create/edit.
13. Patient overview.
14. Dossier Santé + Documents.
15. Patient appointments.
16. Treatments/sessions.
17. Patient invoices.
18. Patient payments.
19. Finance dashboard.
20. Global invoices.
21. Invoice create/details.
22. Installments.
23. Payments.
24. Payment/receipt detail.
25. Caisse.
26. Decaissements.
27. Team list.
28. Employee detail.
29. Planning/shifts.
30. Leave.
31. Payroll.
32. Commissions.
33. Stock items.
34. Stock item detail.
35. Stock movements.
36. Lots/expiration.
37. Stock alerts.
38. Communication history.
39. Message templates.
40. Reminder automation settings.
41. Reports.
42. Cabinet settings.
43. Services/pricing.
44. Working hours.
45. Users/permissions.
46. Master data.
47. Document templates/numbering.
48. Integration settings.
49. Subscription.
50. Referral.
51. Public booking page.
52. Public booking result/change request surfaces.
53. SaaS Admin dashboard.
54. SaaS tenant management.
55. SaaS subscription management.
56. SaaS master data.
57. SaaS referral management.
58. Audit log views where exposed.

This inventory is a functional baseline, not a final count of
routes/components.

------------------------------------------------------------------------

# 69. V1 priorities

## Must be extremely polished

-   Aujourd'hui.
-   Agenda.
-   Appointment creation.
-   Public booking.
-   Patient profile.
-   Dossier Santé.
-   Treatments/sessions.
-   Invoice.
-   Payment.
-   Receipt.
-   Caisse.
-   Communication reminders.
-   Subscription/trial.

These represent the daily value proposition.

## Can be operationally simpler at first

-   Payroll.
-   Advanced reports.
-   Master-data administration.
-   Inventory analytics.
-   SaaS administration.

They still need correct functionality but should not delay core
patient/RDV/payment flows unnecessarily.

------------------------------------------------------------------------

# 70. Explicitly deferred / roadmap

Not required for initial V1 unless scope changes:

-   Room scheduling.
-   Equipment scheduling.
-   Capacity-based multi-patient slots.
-   Patient mobile app.
-   Full patient portal.
-   Patient online payments.
-   Full accounting.
-   Purchasing/procurement workflow.
-   Clock-in/clock-out attendance.
-   Advanced hospital workflows.
-   Full insurance/AMO integration.
-   Advanced specialty clinical systems such as odontogram.
-   AI.
-   Custom practice domains/subdomains.
-   Advanced BI.
-   Medical-device integrations.

The architecture should avoid blocking these later additions.

------------------------------------------------------------------------

# 71. Decisions still requiring detailed specification

The following should be resolved during the next workflow/data-model
phases:

1.  Exact patient duplicate-detection rules.
2.  Exact mandatory patient fields by specialty.
3.  Clinical form schema and specialty master-data taxonomy.
4.  Prescription/certificate template requirements.
5.  Exact appointment overlap rules.
6.  Exact rescheduling/cancellation public mechanism.
7.  Exact WhatsApp/SMS providers and delivery constraints in Morocco.
8.  Google Calendar synchronization direction/conflict policy.
9.  Invoice/tax/legal document requirements for Morocco.
10. Receipt numbering rules.
11. Cash-register correction/reversal rules.
12. Payment reversal/refund rules.
13. Exact payroll scope and Moroccan legal/compliance boundaries.
14. Commission recognition/payment timing.
15. Stock valuation is not required unless later explicitly added.
16. Subscription payment provider and manual/automatic renewal
    mechanics.
17. Final pricing in MAD.
18. Trial length.
19. Referral validation period and annual cap.
20. Data retention/export/deletion policy.
21. Backup/recovery objectives.
22. Health-data privacy/legal compliance requirements applicable in
    Morocco.
23. Whether Owner can access another practitioner's clinical data in a
    multi-practitioner tenant and under what governance.
24. File size/storage limits by subscription.
25. Exact audit-log retention and visibility.

------------------------------------------------------------------------

# 72. Next specification package

After approval of this Information Architecture & Screen Map, the
recommended next artifact is:

## Specification 03 --- End-to-End Business Workflows

It should formally define at least:

1.  New patient at reception.
2.  Existing patient appointment.
3.  Public booking request.
4.  Appointment confirmation.
5.  Reschedule.
6.  Cancellation.
7.  No-show.
8.  Arrival/waiting/consultation completion.
9.  Consultation -\> invoice -\> cash payment -\> receipt.
10. Partial payment.
11. Installment creation and collection.
12. Overdue installment.
13. Treatment/session plan.
14. Kiné multi-session journey.
15. Next appointment/follow-up.
16. Caisse opening.
17. Cash collection.
18. Cash decaissement.
19. Caisse closing/discrepancy.
20. Expense/prestataire payment.
21. Employee creation.
22. Leave request/approval.
23. Payroll calculation.
24. Practitioner commission calculation.
25. Stock IN.
26. Stock OUT.
27. Low-stock/expiration alert.
28. WhatsApp/SMS reminder.
29. Trial -\> paid subscription.
30. Expiration -\> grace -\> blackout -\> renewal.
31. Referral qualification.
32. User permission change.
33. Multi-practitioner patient governance.

Each workflow should specify actor, trigger, preconditions, steps,
validations, state transitions, records created/updated, notifications,
audit events, exceptions and acceptance criteria.

------------------------------------------------------------------------

# 73. Baseline conclusion

The product is a Moroccan bilingual Healthcare Practice Management SaaS
designed around the real operating model of solo practitioners and small
cabinets.

Its core daily loop is:

``` text
Patient
-> Appointment
-> Confirmation
-> Arrival / Waiting
-> Consultation or Session
-> Dossier Santé
-> Treatment / Follow-up
-> Invoice
-> Cash / Installment Payment
-> Receipt
-> Caisse
-> Next Appointment
-> WhatsApp/SMS Reminder
```

Around that loop, the application provides lightweight team/HR
management, practitioner commissions, inventory, operational finance,
master data, dashboards, subscription management and referral growth.

The information architecture must preserve simplicity at the surface
while maintaining strict tenant isolation, practitioner-governed patient
access, auditable financial operations, bilingual operation and
extensibility underneath.
