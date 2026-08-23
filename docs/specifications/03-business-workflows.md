# Healthcare Practice Management SaaS

## Specification 03 --- End-to-End Business Workflows

**Market:** Morocco\
**Product:** Bilingual FR/AR multi-tenant Healthcare Practice Management
SaaS\
**Primary customers:** Solo practitioners and small practices, generally
1--5 users and up to approximately 10\
**Purpose:** Define the operational logic, actors, state transitions,
validations, records, notifications, audit requirements and exceptions
behind the application defined in Product Blueprint v1 and Specification
#2.

------------------------------------------------------------------------

# 1. Workflow specification conventions

Each workflow defines:

-   **Actors** --- users or systems involved.
-   **Trigger** --- what starts the workflow.
-   **Preconditions** --- conditions required before execution.
-   **Main flow** --- normal successful sequence.
-   **Validations** --- rules that must be enforced.
-   **Records affected** --- business entities created or updated.
-   **State transitions** --- explicit domain status changes.
-   **Notifications** --- internal, WhatsApp or SMS events.
-   **Audit events** --- actions that must be traceable.
-   **Exceptions** --- alternative/error paths.
-   **Acceptance criteria** --- minimum expected behavior.

The backend, not only the UI, must enforce tenant isolation,
permissions, subscription state and practitioner-governed access.

------------------------------------------------------------------------

# 2. Cross-workflow invariants

## 2.1 Tenant isolation

Every operational record belongs to one tenant/cabinet.

A user may act only if:

1.  Authenticated.
2.  Active member of the tenant.
3.  Tenant subscription permits access.
4.  User has required permission.
5.  Resource belongs to the tenant.
6.  Practitioner/patient governance permits access where applicable.

## 2.2 Patient governance

Each patient has one responsible practitioner.

In multi-practitioner practices, another practitioner does not
automatically receive access to that patient's governed clinical data.

Administrative access for reception is separately permissioned.

## 2.3 Financial separation

Appointment, treatment, invoice, installment and payment statuses are
separate.

Example:

``` text
Appointment = COMPLETED
Treatment = ACTIVE
Invoice = PARTIALLY_PAID
Installment = OVERDUE
```

One status must not overwrite another.

## 2.4 Financial immutability

Issued financial documents and posted cash movements should not be
silently edited.

Corrections must use controlled adjustment, cancellation, reversal or
replacement mechanisms with audit trails.

## 2.5 Master-data behavior

Users can:

-   Search global master data.
-   Select predefined values.
-   Customize local configuration.
-   Add tenant-specific values.

Tenant customization never changes global master data.

## 2.6 Communication

Patient-facing automated communications use configured templates and
primarily WhatsApp/SMS.

No patient mobile app or full portal is required for V1.

------------------------------------------------------------------------

# 3. Core status models

## 3.1 Appointment

``` text
REQUESTED
    |
TO_CONFIRM
    |
CONFIRMED
    |
ARRIVED
    |
WAITING
    |
IN_CONSULTATION
    |
COMPLETED
```

Alternative terminal/intermediate paths:

``` text
RESCHEDULED
CANCELLED_BY_PATIENT
CANCELLED_BY_PRACTICE
NO_SHOW
```

## 3.2 Treatment

``` text
DRAFT -> PLANNED -> ACTIVE -> COMPLETED
                     |
                   PAUSED
                     |
                  CANCELLED
```

## 3.3 Session

``` text
PLANNED -> SCHEDULED -> COMPLETED
                         |
                  MISSED / CANCELLED
```

## 3.4 Invoice

``` text
DRAFT -> ISSUED -> PARTIALLY_PAID -> PAID
              |
           CANCELLED
```

Overdue is derived/managed where due dates exist.

## 3.5 Installment

``` text
UPCOMING -> DUE -> PARTIALLY_PAID -> PAID
              |
           OVERDUE
```

## 3.6 Subscription

``` text
TRIALING -> ACTIVE -> EXPIRED -> GRACE -> BLACKOUT
              |                               |
          CANCELLED <-------------------------+
```

Renewal can restore ACTIVE according to commercial rules.

------------------------------------------------------------------------

# 4. Workflow WF-01 --- Create a new patient at reception

**Actors:** Receptionist/Staff, Owner/Admin\
**Trigger:** New patient contacts or arrives at the practice.

## Preconditions

-   User has patient-create permission.
-   Tenant is operational.
-   Responsible practitioner can be selected.

## Main flow

1.  User selects **Nouveau patient**.
2.  Enters minimum administrative identity:
    -   First name.
    -   Last name.
    -   Phone.
    -   Responsible practitioner.
3.  Adds optional information:
    -   Secondary phone.
    -   Email.
    -   Date of birth.
    -   Address/city.
    -   Emergency contact.
4.  System runs duplicate detection.
5.  If no probable duplicate, system generates patient number.
6.  Patient record is created.
7.  User is redirected to Patient 360°.
8.  User may immediately:
    -   Create appointment.
    -   Add health information.
    -   Add document.
    -   Create treatment.

## Validations

-   Required fields present.
-   Valid phone format according to configured rules.
-   Responsible practitioner belongs to tenant.
-   Duplicate detection executed before final save.

## Records affected

-   Patient.
-   Patient-practitioner governance.
-   Audit event.

## Exceptions

Probable duplicate: - Show candidate existing records. - Allow open
existing record. - Authorized user may explicitly confirm creation of a
distinct patient.

## Acceptance criteria

-   Unique patient reference generated.
-   Patient visible only within tenant/governed scope.
-   Duplicate warning cannot be bypassed silently.

------------------------------------------------------------------------

# 5. WF-02 --- Create appointment for existing patient

**Actors:** Practitioner, Receptionist\
**Trigger:** Patient requests an appointment.

## Preconditions

-   Patient exists.
-   User can access patient's administrative record.
-   Practitioner has configured availability.

## Main flow

1.  Open patient or Agenda.
2.  Select **Nouveau RDV**.
3.  Select/search patient.
4.  Select responsible/authorized practitioner.
5.  Select service or reason.
6.  Choose scheduling mode:
    -   Exact time.
    -   Arrival window.
7.  Choose date and time/window.
8.  System checks obvious scheduling conflicts.
9.  Add optional note.
10. Save as:
    -   To confirm, or
    -   Confirmed.
11. If confirmed and automation enabled, queue confirmation message.
12. Appointment appears in:
    -   Agenda.
    -   Appointment list.
    -   Patient appointments.
    -   Today's Operations when relevant.

## Validations

-   Practitioner belongs to tenant.
-   Time is valid.
-   Window end \> window start.
-   Required service/reason present if configured.
-   Conflict rules enforced.

## Records affected

-   Appointment.
-   Appointment status history.
-   Notification job.
-   Audit event.

## Acceptance criteria

Exact and window appointments are distinguishable and correctly
communicated.

------------------------------------------------------------------------

# 6. WF-03 --- Quick-create patient during appointment creation

**Actors:** Receptionist, Practitioner

## Main flow

1.  User starts appointment.
2.  Searches patient.
3.  No matching patient found.
4.  Selects **Créer nouveau patient**.
5.  Lightweight patient form opens without losing appointment context.
6.  Duplicate check executes.
7.  Patient is created.
8.  New patient is automatically selected in appointment form.
9.  User completes appointment.

## Acceptance criteria

No need to leave/restart the appointment workflow.

------------------------------------------------------------------------

# 7. WF-04 --- Public booking request

**Actors:** External patient, System\
**Trigger:** Patient opens `app.ma/book/{cabinet-slug}` from link/QR.

## Preconditions

-   Booking page active.
-   Practice has valid public slug.
-   Available services/slots configured.

## Main flow

1.  Patient opens public booking page.
2.  Sees practice identity.
3.  Completes lightweight form:
    -   First name.
    -   Last name.
    -   Phone.
    -   Reason/service.
    -   Desired date.
    -   Desired time/window.
    -   Optional comment.
4.  System validates input.
5.  Request is created as `REQUESTED`.
6.  Patient sees:
    -   Request received.
    -   Appointment is not yet confirmed.
    -   Confirmation will arrive via WhatsApp/SMS.
7.  Reception/Admin receives internal notification.
8.  Request enters **Demandes en ligne** inbox.

## Security/abuse

-   Rate limiting.
-   Bot/spam controls appropriate to public endpoint.
-   No exposure of internal patient data.
-   Do not reveal whether a phone belongs to an existing patient.

## Acceptance criteria

Submission never automatically represents itself as a confirmed
appointment in V1.

------------------------------------------------------------------------

# 8. WF-05 --- Validate public booking request

**Actors:** Receptionist, Owner/Admin

## Main flow

1.  User opens booking request.
2.  System searches probable existing patient matches.
3.  User:
    -   Links request to existing patient, or
    -   Creates new patient.
4.  User reviews requested slot.
5.  Chooses:
    -   Confirm.
    -   Propose alternative.
    -   Reject.
6.  On confirmation:
    -   Appointment created/updated.
    -   Status becomes `CONFIRMED`.
    -   Patient receives confirmation message.
7.  Request is removed from pending-action queue.

## Alternative proposal

1.  Reception chooses new date/time/window.
2.  Request becomes `ALTERNATIVE_PROPOSED`.
3.  Patient is informed through configured communication.
4.  Final confirmation follows configured acceptance mechanism.

## Acceptance criteria

No duplicate patient should be created without duplicate check.

------------------------------------------------------------------------

# 9. WF-06 --- Appointment confirmation

**Actors:** Receptionist, Practitioner, System

## Main flow

1.  Appointment is `TO_CONFIRM`.
2.  Authorized user selects **Confirmer**.
3.  System rechecks availability/conflict.
4.  Status becomes `CONFIRMED`.
5.  Confirmation timestamp and actor recorded.
6.  WhatsApp/SMS confirmation queued if enabled.
7.  Appointment appears as confirmed across all views.

## Audit

-   Previous status.
-   New status.
-   Actor.
-   Timestamp.

------------------------------------------------------------------------

# 10. WF-07 --- Automated appointment reminder

**Actors:** System, Patient

## Preconditions

-   Appointment confirmed.
-   Reminder automation enabled.
-   Patient has valid contact/channel.
-   Appointment not cancelled/completed.

## Main flow

1.  Scheduler finds appointments meeting reminder timing.
2.  Selects correct FR/AR template.
3.  Resolves variables.
4.  Queues provider message.
5.  Stores communication record.
6.  Provider result updates delivery status.

## Exceptions

-   Invalid phone.
-   Provider unavailable.
-   Message rejected.
-   Appointment changed after job was scheduled.

System must prevent obsolete reminders where possible.

------------------------------------------------------------------------

# 11. WF-08 --- Reschedule appointment internally

**Actors:** Receptionist, Practitioner

## Main flow

1.  Open appointment.
2.  Select **Reporter / Replanifier**.
3.  Choose new date/time/window.
4.  Check conflict.
5.  Save.
6.  Preserve original schedule in history.
7.  Appointment receives reschedule history/event.
8.  Patient receives change notification if enabled.
9.  Reminder jobs are recalculated.

## Acceptance criteria

Old scheduled reminder must not fire with obsolete time.

------------------------------------------------------------------------

# 12. WF-09 --- Patient requests rescheduling

**Actors:** Patient, Receptionist

## Main flow

1.  Patient communicates/request via supported public mechanism.
2.  Request is logged.
3.  Existing confirmed appointment remains authoritative until staff
    validates change.
4.  Reception reviews.
5.  Reception chooses new slot.
6.  Appointment updated.
7.  Patient receives final confirmation.

V1 does not require a patient account.

------------------------------------------------------------------------

# 13. WF-10 --- Cancel appointment

**Actors:** Receptionist, Practitioner

## Main flow

1.  Open appointment.
2.  Select cancel.
3.  Choose:
    -   Cancelled by patient.
    -   Cancelled by practice.
4.  Capture reason optionally/when configured.
5.  Status changes to terminal cancellation state.
6.  Future reminder jobs cancelled.
7.  Patient receives cancellation notice when appropriate.
8.  Slot becomes available.

## Audit

Cancellation actor, source, reason and timestamp retained.

------------------------------------------------------------------------

# 14. WF-11 --- Mark no-show

**Actors:** Receptionist, Practitioner

## Preconditions

Appointment date/time passed or practice determines patient did not
attend.

## Main flow

1.  Select appointment.
2.  Mark `NO_SHOW`.
3.  Optional reason/note.
4.  Appointment remains in historical patient record.
5.  No invoice is automatically created merely because of no-show unless
    a future explicit policy exists.
6.  No-show KPI updates.

------------------------------------------------------------------------

# 15. WF-12 --- Patient arrival and waiting room

**Actors:** Receptionist

## Main flow

1.  Patient arrives.
2.  Reception finds appointment.
3.  Select **Arrivé**.
4.  Arrival timestamp recorded.
5.  Status `ARRIVED`.
6.  When patient enters waiting queue, status `WAITING`.
7.  Waiting duration calculated from configured reference timestamp.
8.  Practitioner sees patient waiting.

## Acceptance criteria

Status updates appear in Aujourd'hui and File d'attente without
duplicate appointment records.

------------------------------------------------------------------------

# 16. WF-13 --- Start consultation/session

**Actors:** Practitioner

## Preconditions

-   Practitioner authorized for patient.
-   Appointment is appropriate to start.

## Main flow

1.  Practitioner opens patient/appointment.
2.  Selects **Commencer**.
3.  Appointment becomes `IN_CONSULTATION`.
4.  Consultation/session entry is opened.
5.  Practitioner records clinical information.
6.  Documents may be attached.
7.  If linked to treatment, corresponding session is identified.

## Security

Receptionist cannot gain clinical access merely because receptionist
manages appointment.

------------------------------------------------------------------------

# 17. WF-14 --- Complete consultation

**Actors:** Practitioner

## Main flow

1.  Practitioner completes required clinical entry.
2.  May add:
    -   Notes.
    -   Structured health information.
    -   Prescription.
    -   Certificate/report.
    -   Documents.
    -   Follow-up recommendation.
3.  Marks consultation complete.
4.  Appointment becomes `COMPLETED`.
5.  Treatment session becomes `COMPLETED` if applicable.
6.  Reception can now see administrative completion and billing action
    without exposing restricted clinical content.
7.  User may create next appointment.

## Acceptance criteria

Clinical completion does not automatically mean invoice paid.

------------------------------------------------------------------------

# 18. WF-15 --- Add/update Dossier Santé information

**Actors:** Practitioner

## Main flow

1.  Open Patient \> Dossier Santé.
2.  Search master-data-backed field/value.
3.  Select predefined value or create authorized custom value.
4.  Add specialty-specific details.
5.  Save clinical entry.
6.  Entry records practitioner/date.
7.  Changes are audited.

## Master data rule

Tenant-specific custom value remains tenant-specific.

------------------------------------------------------------------------

# 19. WF-16 --- Upload patient document

**Actors:** Practitioner; authorized staff only where explicitly allowed

## Main flow

1.  Open Dossier Santé.
2.  Select add document.
3.  Choose category.
4.  Enter title/date/description.
5.  Upload file.
6.  System validates type/size/security.
7.  File stored in tenant-isolated object storage.
8.  Metadata linked to patient.
9.  Audit event created.

## Exceptions

-   Unsupported file.
-   Oversized file.
-   Upload failure.
-   Malware/security validation failure if scanning is implemented.

------------------------------------------------------------------------

# 20. WF-17 --- Generate prescription/certificate/report

**Actors:** Practitioner

## Main flow

1.  Open patient.
2.  Choose document type.
3.  System loads practice template.
4.  Auto-populates:
    -   Practice.
    -   Practitioner.
    -   Patient.
    -   Date.
    -   Document number if required.
5.  Practitioner completes clinical/document-specific fields.
6.  Preview.
7.  Generate printable/downloadable document.
8.  Save generated document/reference to Dossier Santé.
9.  Audit creation.

------------------------------------------------------------------------

# 21. WF-18 --- Create treatment/session plan

**Actors:** Practitioner

## Main flow

1.  Open patient.
2.  Select **Nouveau traitement / plan de séances**.
3.  Choose master/custom treatment type.
4.  Define:
    -   Name.
    -   Start date.
    -   Expected sessions.
    -   Practitioner.
    -   Services.
    -   Optional expected end.
    -   Optional planned financial value.
5.  Save `DRAFT` or `PLANNED`.
6.  Activate when care begins.
7.  Sessions can be scheduled.

## Acceptance criteria

Treatment is clinically separate from invoice/payment even when linked.

------------------------------------------------------------------------

# 22. WF-19 --- Kiné multi-session journey

**Actors:** Practitioner, Receptionist

## Example

20-session rehabilitation plan.

## Main flow

1.  Practitioner creates 20-session plan.
2.  Plan becomes `ACTIVE`.
3.  Reception schedules first or multiple sessions.
4.  Each scheduled session links to appointment.
5.  On arrival, normal waiting workflow occurs.
6.  Practitioner completes session.
7.  Session counter updates:
    -   Completed.
    -   Remaining.
8.  Notes/progress are added to Dossier Santé.
9.  Next session can be scheduled.
10. Financial plan can remain:
    -   One invoice,
    -   Multiple invoices,
    -   Installments.
11. After final completed session, practitioner can mark treatment
    `COMPLETED`.

## Acceptance criteria

Cancelling one session does not cancel the whole treatment.

------------------------------------------------------------------------

# 23. WF-20 --- Create invoice from completed appointment

**Actors:** Receptionist, Owner/Admin; Practitioner if permissioned

## Preconditions

-   Patient exists.
-   Appointment/service exists.
-   User has invoice-create permission.

## Main flow

1.  From completed appointment select **Facturer**.
2.  System pre-populates:
    -   Patient.
    -   Practitioner.
    -   Appointment reference.
    -   Service.
    -   Configured price.
3.  User reviews authorized fields.
4.  Adds/removes lines if permitted.
5.  System calculates total.
6.  Invoice saved as draft.
7.  User issues invoice.
8.  Unique invoice number assigned according to numbering rules.
9.  Invoice becomes `ISSUED`.
10. Printable/downloadable invoice generated.

## Acceptance criteria

Invoice preserves source appointment reference.

------------------------------------------------------------------------

# 24. WF-21 --- Create manual invoice

Used for authorized cases not directly created from appointment.

## Main flow

1.  Finance \> Nouvelle facture.
2.  Select patient.
3.  Select practitioner.
4.  Add service lines.
5.  Optional treatment reference.
6.  Review.
7.  Issue.
8.  Audit source as manual.

Manual invoice creation permission should be explicit.

------------------------------------------------------------------------

# 25. WF-22 --- Create installment schedule

**Actors:** Receptionist, Owner/Admin

## Preconditions

Invoice issued and has unpaid balance.

## Main flow

1.  Open invoice.
2.  Select **Créer échéancier**.
3.  Enter installments:
    -   Due dates.
    -   Expected amounts.
4.  System validates total planned installments against outstanding
    amount according to rule.
5.  Save.
6.  Future installments become `UPCOMING`.
7.  On due date, become `DUE`.
8.  After due date unpaid balance becomes `OVERDUE`.

## Acceptance criteria

Installment schedule cannot accidentally exceed invoice outstanding
amount.

------------------------------------------------------------------------

# 26. WF-23 --- Record full cash payment

**Actors:** Receptionist, Owner/Admin

## Preconditions

-   Invoice has outstanding amount.
-   Caisse open where open-caisse policy applies.
-   User has payment permission.

## Main flow

1.  Open invoice.
2.  Select **Encaisser**.
3.  Amount defaults to remaining balance.
4.  Select cash.
5.  Confirm.
6.  System executes one atomic business transaction:
    -   Create Payment.
    -   Update invoice paid amount.
    -   Invoice -\> `PAID`.
    -   Update linked installment(s) if applicable.
    -   Create receipt.
    -   Create cash inflow movement.
    -   Update caisse expected balance.
7.  Receipt becomes printable/downloadable.
8.  Optional payment confirmation message sent.

## Acceptance criteria

If cash movement fails, payment posting must not appear partially
completed.

------------------------------------------------------------------------

# 27. WF-24 --- Record partial cash payment

## Main flow

1.  Open invoice.
2.  Enter amount less than outstanding.
3.  Confirm cash.
4.  Create payment.
5.  Invoice becomes/remains `PARTIALLY_PAID`.
6.  Remaining balance recalculated.
7.  Linked installment updated if selected.
8.  Receipt generated for amount actually paid.
9.  Caisse updated.

## Validation

Payment cannot exceed outstanding amount without a defined overpayment
policy.

------------------------------------------------------------------------

# 28. WF-25 --- Collect an installment

## Main flow

1.  Open due installment or patient.
2.  Select collect.
3.  Enter amount.
4.  If amount equals remaining installment:
    -   Installment -\> `PAID`.
5.  If lower:
    -   `PARTIALLY_PAID`.
6.  Invoice total paid/remaining updates.
7.  Receipt generated.
8.  Cash movement created.
9.  Invoice may become `PAID` when total outstanding reaches zero.

------------------------------------------------------------------------

# 29. WF-26 --- Overdue installment reminder

**Actors:** System, Reception/Finance, Patient

## Main flow

1.  Scheduler identifies overdue installments.
2.  Dashboard/action list shows overdue item.
3.  If automation enabled, queue reminder.
4.  Message includes configured variables:
    -   Patient.
    -   Amount.
    -   Due date.
    -   Practice.
5.  Communication status stored.

Repeated reminders require configurable anti-spam cadence.

------------------------------------------------------------------------

# 30. WF-27 --- Payment correction/reversal

Detailed legal/accounting treatment requires later validation, but V1
must not allow silent deletion.

## Principle

If a posted payment is erroneous:

1.  Authorized user selects correction/reversal.
2.  Reason mandatory.
3.  Original payment retained.
4.  Reversal/adjustment record created.
5.  Invoice balance recalculated.
6.  Caisse correction movement created when cash.
7.  Receipt status/relationship reflects correction.
8.  Audit event records actor/reason.

Hard deletion of posted payment is prohibited.

------------------------------------------------------------------------

# 31. WF-28 --- Open daily caisse

**Actors:** Receptionist, Owner/Admin

## Main flow

1.  Open Caisse.
2.  Select **Ouvrir la caisse**.
3.  Enter opening cash balance.
4.  Confirm.
5.  Daily caisse session becomes `OPEN`.
6.  Opening timestamp/user recorded.

## Validation

Only one applicable open caisse session per configured scope unless
multi-caisse support is deliberately added later.

------------------------------------------------------------------------

# 32. WF-29 --- Automatic cash inflow

Triggered by WF-23/24/25.

## Main flow

1.  Cash payment posts.
2.  System creates linked `CASH_IN` movement.
3.  Movement includes:
    -   Payment reference.
    -   Patient.
    -   Invoice.
    -   Amount.
    -   User.
4.  Expected caisse balance increases.

User should not manually re-enter the same cash receipt.

------------------------------------------------------------------------

# 33. WF-30 --- Record cash decaissement

**Actors:** Receptionist/Staff if authorized, Owner/Admin

## Main flow

1.  Finance/Caisse \> Nouveau décaissement.
2.  Enter:
    -   Category.
    -   Beneficiary/prestataire.
    -   Description.
    -   Amount.
    -   Date.
    -   Payment method = cash.
    -   Supporting document optional.
3.  Confirm.
4.  Expense/decaissement record created.
5.  Linked `CASH_OUT` movement created.
6.  Expected caisse decreases.
7.  Dashboards update.

## Validation

-   Positive amount.
-   Caisse open if required.
-   User permission.
-   Mandatory reason/category.

------------------------------------------------------------------------

# 34. WF-31 --- Record non-cash operational expense

Even though V1 emphasizes cash, operational finance can record other
configured methods for completeness.

1.  Create decaissement.
2.  Select non-cash method.
3.  Expense is recorded.
4.  No cash-register movement is created.
5.  Operational expense KPIs update.

No online patient payment capability is implied.

------------------------------------------------------------------------

# 35. WF-32 --- Close daily caisse

**Actors:** Receptionist, Owner/Admin

## Main flow

1.  User opens current caisse.
2.  System shows:
    -   Opening.
    -   Cash inflows.
    -   Cash outflows.
    -   Expected cash.
3.  User counts physical cash.
4.  Enters physical closing balance.
5.  System calculates difference.
6.  If difference != 0, reason is mandatory.
7.  User confirms closure.
8.  Caisse becomes `CLOSED`.
9.  Closing timestamp/user stored.
10. Owner can review discrepancy.

## Acceptance criteria

Closed caisse cannot be silently modified.

------------------------------------------------------------------------

# 36. WF-33 --- Caisse discrepancy correction

## Main flow

1.  Owner/Admin reviews closed session.
2.  Detects genuine recording error.
3.  Uses controlled adjustment/correction.
4.  Reason mandatory.
5.  Adjustment movement created.
6.  Original movements retained.
7.  Audit trail records correction.

------------------------------------------------------------------------

# 37. WF-34 --- Create employee/staff user

**Actors:** Owner/Admin

## Main flow

1.  Équipe \> Ajouter.
2.  Enter:
    -   Name.
    -   Contact.
    -   Profile: practitioner or receptionist/staff.
    -   Employment information.
3.  Configure permissions.
4.  For practitioner:
    -   Configure specialty.
    -   Working hours.
    -   Services.
    -   Commission if applicable.
5.  Send invitation/set access.
6.  Employee/user becomes active after account setup.

## Validation

Plan/user limits enforced.

------------------------------------------------------------------------

# 38. WF-35 --- Configure receptionist permissions

**Actors:** Owner/Admin

## Main flow

1.  Open staff profile.
2.  Open permissions.
3.  Toggle authorized areas/actions.
4.  Save.
5.  Permission change effective immediately or on next authorization
    check.
6.  Audit change.

## Rule

UI hiding is insufficient; API must enforce permission.

------------------------------------------------------------------------

# 39. WF-36 --- Configure staff schedule/shifts

**Actors:** Owner/Admin

## Main flow

1.  Open team planning.
2.  Select employee.
3.  Define weekly schedule or shift.
4.  Add exceptions if required.
5.  Save.
6.  Schedule feeds planning/availability where applicable.

No clock-in/out tracking.

------------------------------------------------------------------------

# 40. WF-37 --- Leave request

**Actors:** Staff/Practitioner

## Main flow

1.  Employee opens leave.
2.  Select type.
3.  Enter dates.
4.  Add reason/attachment if needed.
5.  Submit.
6.  Status `SUBMITTED`.
7.  Owner receives notification.

------------------------------------------------------------------------

# 41. WF-38 --- Approve/reject leave

**Actors:** Owner/Admin

## Main flow

1.  Owner reviews request.
2.  Checks team schedule.
3.  Approves or rejects.
4.  Status updated.
5.  Employee notified internally.
6.  Approved leave affects availability/planning.
7.  Audit event created.

------------------------------------------------------------------------

# 42. WF-39 --- Prepare payroll period

**Actors:** Owner/Admin

## Main flow

1.  Select payroll month.
2.  System loads active employees.
3.  For each employee, load configured:
    -   Base salary.
    -   Bonuses.
    -   Overtime entered/validated.
    -   Commission.
    -   Deductions/adjustments if configured.
4.  Owner reviews.
5.  Payroll calculation stored.
6.  Mark operational payment status when paid.

## Boundary

This is cabinet operational payroll management. Statutory Moroccan
payroll/tax/social compliance is not claimed without separate
specification.

------------------------------------------------------------------------

# 43. WF-40 --- Calculate practitioner commission on collections

**Actors:** System, Owner/Admin

## Preconditions

Commission rule configured.

## Main flow

1.  Payment is recorded for eligible service.
2.  System identifies:
    -   Practitioner.
    -   Service.
    -   Collected amount attributable.
    -   Commission rule.
3.  Calculates commission.
4.  Creates commission earning entry.
5.  Period commission screen aggregates entries.
6.  Owner reviews adjustments.
7.  Commission can flow into payroll.

## Example

``` text
Collected amount: 4,000 MAD
Commission rate: 30%
Commission earned: 1,200 MAD
```

## Acceptance criteria

Commission does not double-count multiple payments.

------------------------------------------------------------------------

# 44. WF-41 --- Commission based on invoiced amount

When configured:

1.  Eligible invoice is issued.
2.  Commission base is eligible invoiced amount.
3.  Commission earning calculated according to service/practitioner
    rule.
4.  Later collection does not create duplicate commission.

The system must explicitly store commission basis type.

------------------------------------------------------------------------

# 45. WF-42 --- Manual commission adjustment

**Actors:** Owner/Admin

1.  Open commission period.
2.  Add positive/negative adjustment.
3.  Reason mandatory.
4.  Save.
5.  Adjustment appears separately from system-calculated earnings.
6.  Audit event.

------------------------------------------------------------------------

# 46. WF-43 --- Create stock item

**Actors:** Owner/Admin, authorized staff

## Main flow

1.  Stock \> Nouvel article.
2.  Search master data.
3.  Select predefined item or create custom.
4.  Configure:
    -   Name.
    -   Category.
    -   Unit.
    -   Minimum stock.
    -   Lot tracking.
    -   Expiration tracking.
5.  Save.

------------------------------------------------------------------------

# 47. WF-44 --- Stock IN

## Main flow

1.  Select item.
2.  New movement -\> IN.
3.  Enter:
    -   Quantity.
    -   Date.
    -   Lot if tracked.
    -   Expiration if tracked.
    -   Reason.
4.  Confirm.
5.  Movement stored.
6.  Balance increases.
7.  Lot balance created/updated.
8.  Audit event.

No purchase order/procurement workflow.

------------------------------------------------------------------------

# 48. WF-45 --- Stock OUT

## Main flow

1.  Select item.
2.  New movement -\> OUT.
3.  Enter quantity/reason/lot if applicable.
4.  Validate available balance according to negative-stock policy.
5.  Confirm.
6.  Movement stored.
7.  Balance decreases.
8.  Alerts recalculated.

------------------------------------------------------------------------

# 49. WF-46 --- Stock adjustment

For inventory correction:

1.  Authorized user selects adjustment.
2.  Enter adjustment quantity/direction.
3.  Reason mandatory.
4.  Balance changes through adjustment movement.
5.  No direct silent overwrite of current quantity.
6.  Audit event.

------------------------------------------------------------------------

# 50. WF-47 --- Low-stock alert

1.  After every stock movement or scheduled check, compare balance to
    minimum.
2.  If at/below threshold, create/update alert.
3.  Show on:
    -   Stock alerts.
    -   Aujourd'hui when configured.
4.  Alert resolves when balance exceeds threshold.

------------------------------------------------------------------------

# 51. WF-48 --- Expiration alert

1.  Scheduled job checks tracked lots.
2.  Lots within configured warning horizon are flagged.
3.  Expired lots flagged separately.
4.  Owner/authorized staff notified.
5.  No automatic stock destruction; user records appropriate
    OUT/adjustment.

------------------------------------------------------------------------

# 52. WF-49 --- Create/edit message template

**Actors:** Owner/Admin

1.  Communication \> Modèles.
2.  Start from platform template or custom.
3.  Choose:
    -   Channel.
    -   Language.
    -   Category.
4.  Edit content.
5.  Insert supported variables.
6.  Preview.
7.  Save/activate.

Validation prevents unsupported variables.

------------------------------------------------------------------------

# 53. WF-50 --- Send manual patient message

**Actors:** Authorized practitioner/receptionist

1.  Open patient.
2.  Select contact/send message.
3.  Choose channel/template.
4.  Review resolved message.
5.  Send.
6.  Communication record created.
7.  Delivery status updated asynchronously.

Clinical/sensitive content policies must be considered before template
use.

------------------------------------------------------------------------

# 54. WF-51 --- Communication delivery failure

1.  Provider reports failure.
2.  Message becomes `FAILED`.
3.  Failure reason stored where available.
4.  Relevant user sees alert/status.
5.  User may retry according to provider/rate rules.
6.  Retry creates traceable attempt, not false delivered status.

------------------------------------------------------------------------

# 55. WF-52 --- Connect Google Calendar

**Actors:** Owner/Practitioner

1.  Settings \> Integrations.
2.  Select Google Calendar.
3.  Complete authorization.
4.  Choose calendar.
5.  Configure synchronization.
6.  Store provider connection securely.
7.  Appointment synchronization begins according to integration rules.

Exact one-way/two-way conflict policy remains a later integration
specification.

------------------------------------------------------------------------

# 56. WF-53 --- Subscription trial creation

**Actors:** New Owner, System

1.  Owner registers.
2.  Tenant created.
3.  Trial subscription created.
4.  `TRIALING`.
5.  Trial end date stored.
6.  Full/defined trial entitlements activated.
7.  Owner sees trial countdown.
8.  Pre-expiration reminders scheduled.

------------------------------------------------------------------------

# 57. WF-54 --- Convert trial to paid subscription

**Actors:** Owner, System, payment process

1.  Owner chooses plan/period.
2.  Subscription payment process completes according to selected
    provider/manual mechanism.
3.  Successful payment recorded.
4.  Subscription becomes `ACTIVE`.
5.  Current period dates set.
6.  SaaS invoice/receipt handled separately from patient billing.
7.  Tenant operational access continues.

## Important

SaaS subscription billing and patient/practice billing are separate
domains.

------------------------------------------------------------------------

# 58. WF-55 --- Subscription expiration and grace

## Main flow

1.  Before expiration:
    -   D-15 reminder.
    -   D-7.
    -   D-3.
    -   D-1.
2.  At expiry:
    -   Status `EXPIRED`.
3.  Grace begins.
4.  D+1/D+2/D+3 warnings.
5.  Operational access continues according to grace policy.
6.  If still unpaid after three-day grace:
    -   Status `BLACKOUT`.
7.  Data remains stored.

Exact reminder cadence is configurable but this represents the agreed
policy.

------------------------------------------------------------------------

# 59. WF-56 --- Blackout behavior

**Actors:** Owner/Staff, System

When tenant is in blackout:

Allowed:

-   Login.
-   View subscription-expired screen.
-   Renewal/payment action.
-   Contact support.
-   Logout.

Blocked:

-   Patient access.
-   Agenda operations.
-   Clinical actions.
-   Finance operations.
-   HR.
-   Inventory.
-   Reports.
-   Other operational actions.

Backend must block APIs, not only frontend navigation.

------------------------------------------------------------------------

# 60. WF-57 --- Restore after subscription renewal

1.  Tenant in `EXPIRED`, `GRACE` or `BLACKOUT`.
2.  Successful qualifying renewal recorded.
3.  Subscription becomes `ACTIVE`.
4.  Entitlements restored.
5.  Operational access restored.
6.  No patient/business data recreation is necessary.
7.  Renewal audit event stored.

------------------------------------------------------------------------

# 61. WF-58 --- Referral attribution

**Actors:** Referrer, New customer, System

1.  Existing customer shares referral link/code.
2.  New customer opens link or enters code.
3.  Attribution stored during registration.
4.  Referral state = registered/trial.
5.  No reward yet.

------------------------------------------------------------------------

# 62. WF-59 --- Referral qualification and reward

1.  Referred tenant completes trial.
2.  Referred tenant makes first successful paid subscription.
3.  System checks:
    -   Genuine new customer.
    -   Not previously subscribed.
    -   Not obvious self-referral.
    -   Payment successful.
4.  Referral enters validation period.
5.  If valid after configured period:
    -   Referral `QUALIFIED`.
    -   Referrer receives +1 free subscription month.
6.  Reward history stored.
7.  Owner notified.

## Controls

-   One referred practice = one reward.
-   Reward is time, not cash.
-   Configurable annual cap.
-   Admin can reject/void.
-   Reversed/refunded qualifying payment can invalidate pending reward
    according to policy.

------------------------------------------------------------------------

# 63. WF-60 --- SaaS Admin referral review

1.  Admin opens flagged/pending referral.
2.  Reviews:
    -   Referrer.
    -   Referred tenant.
    -   Registration.
    -   Payment qualification.
    -   Identity/contact/payment similarity signals where
        legally/technically appropriate.
3.  Approve/reject/void.
4.  Reason required for manual decision.
5.  Audit event stored.

------------------------------------------------------------------------

# 64. WF-61 --- Add global master-data item

**Actors:** SaaS Super Admin

1.  Open Master Data.
2.  Choose category.
3.  Create item.
4.  Add:
    -   FR label.
    -   AR label.
    -   FR keywords.
    -   AR keywords.
    -   Specialty tags.
5.  Activate.
6.  Item becomes searchable by tenants.

Existing tenant customizations remain unaffected.

------------------------------------------------------------------------

# 65. WF-62 --- Practice adopts master-data item

1.  Owner searches service/form dictionary.
2.  Selects global item.
3.  Creates tenant configuration/reference.
4.  Customizes allowed properties:
    -   Price.
    -   Duration.
    -   Local label where permitted.
    -   Active status.
5.  Global master remains unchanged.

------------------------------------------------------------------------

# 66. WF-63 --- Practitioner-governed patient access

**Actors:** Practitioner A, Practitioner B, Owner/Admin

## Example

Patient belongs to Practitioner A.

## Main rule

1.  Practitioner A can access governed patient according to permissions.
2.  Practitioner B requests/accesses patient.
3.  Backend checks governance.
4.  If no authorized relationship/access:
    -   Deny clinical access.
5.  Reception may retain permitted administrative access.

## Future transfer/share

A controlled transfer/share workflow can be added, but implicit
cross-practitioner sharing is prohibited.

------------------------------------------------------------------------

# 67. WF-64 --- Change responsible practitioner

This is sensitive and must be controlled.

1.  Authorized Owner/Admin opens patient governance.
2.  Selects new responsible practitioner.
3.  System warns about impact.
4.  Reason may be required.
5.  Confirm.
6.  Responsible practitioner changes.
7.  Historical authorship of clinical records remains unchanged.
8.  Audit event records old/new practitioner and actor.

Exact clinical visibility after transfer requires final governance
policy.

------------------------------------------------------------------------

# 68. WF-65 --- Deactivate staff user

**Actors:** Owner/Admin

1.  Open staff user.
2.  Select deactivate.
3.  System checks future appointments/ownership responsibilities.
4.  Warn owner.
5.  Deactivate login.
6.  Historical records remain attributed to user.
7.  Future responsibilities must be reassigned where required.
8.  Audit event.

No historical data deletion.

------------------------------------------------------------------------

# 69. WF-66 --- Change user permissions

1.  Owner opens permissions.
2.  Changes access.
3.  Save.
4.  Authorization cache/session updated appropriately.
5.  User loses/gains access immediately or at defined secure refresh.
6.  Audit event stores permission changes.

------------------------------------------------------------------------

# 70. WF-67 --- Generate booking QR code

1.  Owner opens booking settings.
2.  Public booking link exists.
3.  Select generate QR.
4.  QR encodes canonical booking URL.
5.  User can:
    -   Display.
    -   Download.
    -   Print.
6.  Regeneration does not need to change URL unless slug changes.

------------------------------------------------------------------------

# 71. WF-68 --- Change public booking slug

1.  Owner requests slug change.
2.  System validates uniqueness/reserved words.
3.  Confirm.
4.  New canonical URL activated.
5.  Old URL behavior should be defined:
    -   Prefer controlled redirect for a retention period.
6.  Audit change.

This avoids breaking already printed QR codes where possible.

------------------------------------------------------------------------

# 72. WF-69 --- Appointment conflict handling

## Exact-time

Conflict occurs when appointment overlaps another appointment for the
same practitioner according to configured overlap rules.

## Window

Conflict evaluation uses reserved window/service logic defined by
scheduling configuration.

## Main flow

1.  User selects conflicting slot.
2.  System warns/blocks according to policy.
3.  Show nearby available alternatives.
4.  Authorized override, if ever supported, requires explicit policy and
    audit.

V1 default should avoid double booking.

------------------------------------------------------------------------

# 73. WF-70 --- Today's Operations action resolution

Aujourd'hui is an aggregation surface, not a separate data source.

Example:

1.  Dashboard shows "3 RDV à confirmer".
2.  User opens action.
3.  Underlying appointment records appear.
4.  User confirms one.
5.  Appointment changes status.
6.  Dashboard count recalculates to 2.

Same principle for:

-   Overdue installments.
-   Low stock.
-   Booking requests.
-   Leave requests.

------------------------------------------------------------------------

# 74. WF-71 --- Operational financial dashboard calculation

For selected period:

1.  Query issued invoices.
2.  Query posted payments.
3.  Query outstanding balances.
4.  Query overdue installments.
5.  Query decaissements.
6.  Query caisse discrepancies.
7.  Apply tenant/practitioner filters.
8.  Display metrics.

Metrics must state whether they represent:

-   Invoiced revenue.
-   Collected cash/collections.
-   Expenses.
-   Operational balance.

Do not label operational balance as statutory accounting profit.

------------------------------------------------------------------------

# 75. WF-72 --- Practitioner performance view

Where owner has access:

Metrics can include:

-   Appointments.
-   Completed consultations/sessions.
-   No-shows.
-   Amount invoiced.
-   Amount collected.
-   Commission.
-   Active patients/treatments.

Patient clinical content is not required to calculate operational
metrics.

------------------------------------------------------------------------

# 76. WF-73 --- Export/download generated document

For invoice, receipt, prescription or other generated document:

1.  Authorized user opens record.
2.  Selects download/print.
3.  System renders configured template.
4.  Generated document reflects immutable/current valid record state.
5.  Download event may be audited for sensitive clinical documents.
6.  Unauthorized users receive denial.

------------------------------------------------------------------------

# 77. WF-74 --- Subscription feature/plan limit reached

Examples:

-   User limit.
-   Practitioner limit.
-   Storage limit.
-   Feature unavailable.

## Main flow

1.  User attempts action.
2.  Backend checks entitlement.
3.  Action blocked safely.
4.  UI explains limit.
5.  Owner receives upgrade/management path.
6.  Existing data remains accessible according to plan policy.

Staff should not be able to upgrade subscription unless authorized.

------------------------------------------------------------------------

# 78. WF-75 --- File/storage limit reached

1.  User attempts upload.
2.  System calculates tenant storage entitlement.
3.  If insufficient:
    -   Block upload before committing.
    -   Preserve existing data.
    -   Show storage message.
4.  Owner can manage/upgrade when commercial model supports it.

------------------------------------------------------------------------

# 79. WF-76 --- Language switch FR/AR

1.  User selects language.
2.  Preference saved.
3.  UI rerenders:
    -   FR -\> LTR.
    -   AR -\> RTL.
4.  Business data remains unchanged.
5.  Master data displays localized label when available.
6.  Generated documents use configured document language, not
    necessarily current UI language.

------------------------------------------------------------------------

# 80. WF-77 --- Audit investigation

**Actors:** Owner/Admin for tenant-visible audit; SaaS Admin under
strict policy

1.  Open audit view.
2.  Filter:
    -   Date.
    -   User.
    -   Resource.
    -   Action.
3.  Open event.
4.  Show:
    -   Actor.
    -   Timestamp.
    -   Resource.
    -   Change summary.
    -   Reason where required.
5.  Audit events cannot be edited by tenant users.

------------------------------------------------------------------------

# 81. WF-78 --- Tenant cancellation

Commercial/legal details require final policy.

Baseline:

1.  Owner requests cancellation.
2.  System records request.
3.  Subscription configured to stop renewal/end according to policy.
4.  Tenant informed of access/end date.
5.  Data is not immediately deleted.
6.  Retention/export/deletion follows formal data policy.

------------------------------------------------------------------------

# 82. WF-79 --- Tenant data export request

This should be supported conceptually because patient/business data
belongs to the practice under applicable governance.

1.  Owner requests export.
2.  Identity/authorization verified.
3.  Export job created.
4.  Relevant tenant data prepared in defined formats.
5.  Secure delivery mechanism used.
6.  Export event audited.

Exact legal scope/formats remain to be specified.

------------------------------------------------------------------------

# 83. WF-80 --- Tenant support intervention

Support must not imply unrestricted access to medical data.

1.  Customer requests support.
2.  SaaS support identifies tenant.
3.  Use metadata/technical diagnostics first.
4.  Any elevated access requires defined authorization/security policy.
5.  Sensitive access is minimized and audited.
6.  Support action recorded.

------------------------------------------------------------------------

# 84. Cross-module transactional requirements

The following operations should be atomic where technically feasible.

## 84.1 Cash payment

``` text
Payment
+ Invoice balance update
+ Installment update
+ Receipt
+ Caisse movement
```

Either all succeed or the transaction is safely rolled back/reconciled.

## 84.2 Cash decaissement

``` text
Expense/Decaissement
+ Caisse CASH_OUT movement
```

## 84.3 Appointment confirmation

``` text
Status change
+ Status history
+ Reminder scheduling
+ Communication event/job
```

Message provider failure must not roll back valid appointment
confirmation, but communication failure must be visible.

## 84.4 Treatment session completion

``` text
Session completion
+ Appointment completion where linked
+ Treatment progress
+ Clinical entry
```

Rules should prevent double completion.

------------------------------------------------------------------------

# 85. Notification triggers summary

  Trigger                       Internal            Patient WhatsApp/SMS
  ----------------------------- ------------------- ----------------------
  Public booking submitted      Reception/Admin     Acknowledgment
  Booking confirmed             Relevant staff      Confirmation
  Appointment upcoming          Optional            Reminder
  Appointment changed           Relevant staff      Update
  Appointment cancelled         Relevant staff      Notice
  Patient arrived               Practitioner        No
  Installment due               Reception/Finance   Reminder
  Installment overdue           Reception/Finance   Reminder
  Payment posted                Optional            Confirmation
  Low stock                     Authorized staff    No
  Lot expiring                  Authorized staff    No
  Leave submitted               Owner               No
  Leave decided                 Employee            No
  Trial/subscription expiring   Owner               Owner notification
  Referral qualified            Owner               Owner notification

------------------------------------------------------------------------

# 86. Permission-sensitive actions

Always require explicit authorization:

-   View/edit clinical record.
-   Generate clinical documents.
-   Change responsible practitioner.
-   Issue/cancel invoice.
-   Record/reverse payment.
-   Open/close/adjust caisse.
-   Create expense.
-   View payroll.
-   Adjust commission.
-   Change permissions.
-   Manage subscription.
-   Export tenant data.
-   Perform sensitive support/admin actions.

------------------------------------------------------------------------

# 87. Idempotency and duplicate prevention

Critical operations should protect against double submission.

Examples:

-   Double-click payment.
-   Duplicate webhook.
-   Duplicate message job.
-   Duplicate invoice issue.
-   Duplicate referral reward.
-   Duplicate stock movement submission.

Use unique operation identifiers/idempotency keys where appropriate.

------------------------------------------------------------------------

# 88. Time and scheduling rules

All timestamps should be stored consistently with timezone awareness.

Practice display uses Morocco-appropriate timezone configuration.

Scheduling must distinguish:

-   Exact appointment start.
-   Arrival-window start/end.
-   Service duration.
-   Actual arrival.
-   Consultation start.
-   Completion.

This enables future waiting-time analytics.

------------------------------------------------------------------------

# 89. Numbering rules

Separate sequences/configurations should exist for:

-   Patient number.
-   Appointment reference if exposed.
-   Treatment plan.
-   Invoice.
-   Receipt.
-   Other generated documents.

Rules:

-   Unique within intended scope.
-   Issued financial number not silently reused.
-   Formatting configurable within safe constraints.
-   Audit changes to numbering configuration.

------------------------------------------------------------------------

# 90. Data retention principles

Until formal legal policy is completed:

-   No hard deletion of important financial/audit records through
    ordinary UI.
-   Deactivation preferred for users/master data.
-   Patient deletion/anonymization/export requires dedicated governance.
-   Subscription blackout never deletes tenant data.
-   Cancellation does not mean immediate deletion.

------------------------------------------------------------------------

# 91. V1 end-to-end golden paths

The following paths must be exceptionally reliable before launch.

## Golden Path A --- Solo practitioner

``` text
Login
-> Aujourd'hui
-> New patient
-> New appointment
-> Patient arrives
-> Consultation
-> Dossier Santé
-> Complete
-> Invoice
-> Cash payment
-> Receipt
-> Caisse
-> Next appointment
```

## Golden Path B --- Reception + practitioner

``` text
Reception creates RDV
-> Confirmation sent
-> Patient arrives
-> Reception marks waiting
-> Practitioner starts consultation
-> Practitioner completes
-> Reception invoices
-> Reception collects cash
-> Receipt
-> Caisse updated
```

## Golden Path C --- Public booking

``` text
QR/link
-> Patient submits request
-> Reception validates
-> Confirmation
-> Reminder
-> Arrival
-> Consultation
```

## Golden Path D --- Kiné

``` text
Patient
-> Treatment plan
-> 20 sessions
-> Schedule session
-> Complete session
-> Progress update
-> Partial/installment payments
-> Remaining sessions
-> Treatment completion
```

## Golden Path E --- Subscription

``` text
Register
-> Trial
-> Use platform
-> Subscribe
-> Active
-> Renewal reminders
-> Grace if unpaid
-> Blackout
-> Renew
-> Immediate restoration
```

------------------------------------------------------------------------

# 92. Workflow acceptance test catalog

Development should ultimately automate tests for at least:

1.  Tenant A cannot access Tenant B patient.
2.  Practitioner B cannot access Practitioner A governed clinical record
    without permission.
3.  Reception can create RDV without clinical access.
4.  Public booking is pending until validated.
5.  Exact appointment stores exact time.
6.  Window appointment stores start/end.
7.  Conflict rules block invalid booking.
8.  Confirmation queues correct template.
9.  Reschedule cancels obsolete reminder.
10. Cancelled appointment does not receive reminder.
11. Arrival/waiting timestamps persist.
12. Consultation completion updates correct appointment.
13. Treatment session updates progress once.
14. Issued invoice gets unique number.
15. Partial payment updates balance.
16. Full payment marks invoice paid.
17. Cash payment creates exactly one cash movement.
18. Payment retry/double click does not duplicate payment.
19. Installment becomes overdue correctly.
20. Reversal preserves original payment.
21. Caisse expected balance reconciles.
22. Closing discrepancy requires reason.
23. Closed caisse cannot be silently edited.
24. Commission calculation uses configured basis.
25. Commission does not double count.
26. Stock IN/OUT updates balance.
27. Adjustment is movement-based.
28. Low-stock alert resolves correctly.
29. Expiration alert uses lot date.
30. Reception permissions are enforced backend-side.
31. Deactivated user cannot log in.
32. Leave approval affects schedule.
33. Trial expires correctly.
34. Grace lasts configured three days.
35. Blackout blocks operational APIs.
36. Renewal restores access without data loss.
37. Referral reward occurs only after qualification.
38. Referral cannot reward twice.
39. Master-data customization does not alter global record.
40. FR/AR switch preserves data and direction.
41. Generated invoice/receipt belongs to correct tenant.
42. Audit event exists for sensitive adjustment.

------------------------------------------------------------------------

# 93. Open decisions to resolve before database/API freeze

The workflows reveal several items requiring dedicated decisions:

1.  Morocco-specific invoice/tax/legal requirements.
2.  Morocco health-data/privacy obligations and hosting implications.
3.  Exact patient identifiers and duplicate matching.
4.  Exact clinical fields by specialty.
5.  Whether owner of a multi-practitioner cabinet can access all
    clinical records.
6.  Formal patient transfer/share mechanism between practitioners.
7.  WhatsApp/SMS provider selection.
8.  Reminder timing defaults.
9.  Public alternative-slot acceptance mechanism.
10. Payment reversal/refund terminology and legal behavior.
11. Whether caisse must always be opened before cash collection.
12. Whether one or multiple caisse sessions/users can operate
    simultaneously.
13. Payroll legal boundary and payslip scope.
14. Commission recognition timing and cancellation behavior.
15. Negative-stock policy.
16. Expiration warning horizon.
17. Google Calendar sync direction.
18. Subscription payment provider/manual renewal model.
19. Trial length.
20. Referral validation delay and annual cap.
21. Storage limits.
22. Data export format.
23. Data retention/deletion policy.
24. Support-access policy.
25. Final plan pricing.

These are not omissions; they are decisions that should be deliberately
resolved before implementation of the affected components.

------------------------------------------------------------------------

# 94. Next specification

With Product Blueprint, Screen Map and Business Workflows defined, the
next logical artifact is:

## Specification 04 --- Domain Model, Data Architecture & Entity Relationship Design

It should define:

-   Bounded domains/modules.
-   Entity catalog.
-   Entity attributes.
-   IDs and references.
-   Tenant ownership.
-   Practitioner governance.
-   Relationships/cardinality.
-   Status fields.
-   Financial ledgers/movements.
-   Audit entities.
-   Master-data inheritance/customization.
-   Subscription/referral entities.
-   File/document metadata.
-   Communication entities.
-   Index/search requirements.
-   Uniqueness constraints.
-   Soft-delete/deactivation strategy.
-   Transaction boundaries.
-   Data retention classifications.
-   ER diagrams.
-   Database-ready schema recommendations.

Only after this should API contracts and detailed technical architecture
be frozen.

------------------------------------------------------------------------

# 95. Baseline conclusion

The product's operational core is now defined as a connected set of
auditable workflows rather than independent features.

The central business loop is:

``` text
Patient
-> Appointment
-> Confirmation
-> Arrival / Waiting
-> Consultation / Session
-> Dossier Santé
-> Treatment / Follow-up
-> Invoice
-> Installment / Cash Payment
-> Receipt
-> Caisse
-> Next RDV
-> WhatsApp/SMS
```

Supporting workflows cover:

``` text
Team / Permissions
Payroll / Commissions
Inventory
Master Data
Reports
Subscription
Referral
SaaS Administration
Audit / Governance
```

The implementation must preserve a simple user experience while
enforcing strong data isolation, controlled practitioner ownership,
financial integrity, auditable corrections, bilingual operation and
reliable subscription enforcement.
