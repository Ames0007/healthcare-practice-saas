# Implementation Status

Authoritative implementation progress tracker for the Healthcare Practice Management SaaS.

Statuses:

```text
NOT_STARTED
IN_PROGRESS
IMPLEMENTED_NOT_VERIFIED
BLOCKED
COMPLETE
```

A task cannot be marked COMPLETE without acceptance-criteria evidence.

| Task | Phase | Status | Commit | Notes |
|------|-------|--------|--------|-------|
| TASK-001 | Phase 0 | COMPLETE | 8d381b6 | Repository bootstrap |
| TASK-002 | Phase 0 | COMPLETE | a227f3b | Backend bootstrap (Laravel 13.26.1 / PHP 8.5.9) |
| TASK-003 | Phase 0 | COMPLETE | c6e656e | Frontend bootstrap (Next.js 16.3.2 / React 19.2.8) |
| TASK-003A | Phase 0 | COMPLETE | 287666b | Graphic charter alignment & visual QA (Spec #10) |
| TASK-004 | Phase 0 | COMPLETE | 59d478a | Local development environment (PostgreSQL 18.6/Redis 8.10.1/MinIO, native/portable) |
| TASK-005 | Phase 0 | COMPLETE | 6a76a05 | PostgreSQL foundation (UUIDv7, test DB, empty migration baseline) |
| TASK-006 | Phase 0 | NOT_STARTED | — | Redis and queue foundation |
| TASK-007 | Phase 0 | NOT_STARTED | — | Testing foundation |
| TASK-008 | Phase 0 | NOT_STARTED | — | Static analysis and linting |
| TASK-009 | Phase 0 | NOT_STARTED | — | CI pipeline |
| TASK-010 | Phase 0 | NOT_STARTED | — | FR/AR localization foundation |
| TASK-011 | Phase 0 | NOT_STARTED | — | Application error contract |
| TASK-012 | Phase 0 | NOT_STARTED | — | Request/correlation IDs |

Foundation Validation Gate must pass before Phase 1 (Identity, Tenancy & Security) begins.

## UI Prototype Sequence

Frontend-only prototype screens built against synthetic mock data, ahead of
backend integration. Separate numbering from TASK-001–TASK-255; does not
imply Phase 0/1 sequencing or backend readiness.

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| UI-001 | COMPLETE | bb1dec8 | Aujourd'hui dashboard prototype (mock data only, no backend integration) |
| UI-002 | COMPLETE | a655aac | Agenda & appointment prototype: day/week views, drawer, create/edit/reschedule/cancel/no-show, waiting room (mock data only, no backend integration) |
| UI-003A | COMPLETE | ce18978 | Patient list prototype: search, practitioner/next-RDV filters, pagination, Patient 360° route placeholder (mock data only, no creation/editing, no Patient 360°, no backend integration) |
| UI-003B | COMPLETE | 8b679f3 | Create/edit patient prototype: primary+complementary form, responsible practitioner, duplicate detection (phone/name) with Open Existing/Create Anyway, prototype patient-number generation (mock data only, no Patient 360°, no backend integration) |
| UI-004A | COMPLETE | cb34df9 | Patient 360° header + overview: persistent header, 6 real tab routes, Aperçu (4 summary cards + activity timeline), not-found/loading/error states (mock data only, no Dossier Santé/Treatments/Finance detail, no backend integration) |
| UI-004B | COMPLETE | 36d8658 | Patient Rendez-vous tab: upcoming/history appointments derived from Agenda's mock fixtures by patientId, status-group filters, reused AppointmentCard/AppointmentDrawer (extended, not duplicated), + Nouveau RDV/Ouvrir dans l'agenda navigation (mock data only, no Treatments/Finance/Dossier Santé, no backend integration) |
| UI-004C | COMPLETE | 544001f | Patient Traitements/Séances tab: centralized treatment-plan/session fixtures, active/completed treatment presentation, SessionProgress + session tracker, treatment/session detail drawer, Aperçu overview now derives its active-treatment summary from the same fixtures (no contradictory source of truth) (mock data only, no clinical notes/finance/Dossier Santé, no backend integration) |
| UI-004D | COMPLETE | 7becc73 | Patient Factures/Installments tab: centralized invoice/installment fixtures (whole-MAD money, no floats), invoice status registry + installment status registry, financial summary, invoice detail drawer with staged-payment schedule and down-payment representation, PatientHeader balance and Aperçu next-installment now derive from the same fixtures (mock data only, no payment execution/receipts/caisse/accounting, no backend integration) |
| UI-004E | COMPLETE | ed64510 | Patient Paiements/Reçus tab: centralized payment/allocation/receipt fixtures reconciling exactly with UI-004D's own invoice paidAmount/paid-installment history (including one deliberately reversed payment), payment status registry, payment history + summary, Encaisser cash-payment capture prototype (invoice/installment allocation, overpayment/invalid-amount validation, local-session-only state), read-only payment/receipt detail drawer (mock data only, no real payment execution beyond local component state, no caisse/accounting/online-payment, no backend integration) |
| UI-005A | COMPLETE | c26c908 | Dossier Santé — important medical information: centralized MedicalProfile fixtures (kept separate from the administrative Patient type), bounded FR/AR clinical master-data catalog (allergies/history/medications) with case/accent-insensitive search, allergy/history/medication/notes summary cards with a restrained "Important" allergy badge, edit drawer reusing Combobox as a multi-select picker (predefined selection + controlled custom-entry, duplicate prevention), local-session-only edits (mock data only, no consultation history/active consultation/prescriptions/documents, no backend integration) |
| UI-005B | COMPLETE | ebe960d | Dossier Santé — clinical history & consultation timeline: centralized ClinicalEncounter fixtures (consultation/session, cross-referenced with UI-004C's own treatment-session fixture rather than duplicated), purpose-built ClinicalTimeline domain component (distinct from UI-004A's PatientActivityTimeline), newest-first date-grouped history below UI-005A's medical profile, lightweight Tous/Consultations/Séances filter with a filtered-empty state, read-only consultation detail drawer (Motif/Observations/Évaluation/Plan, patient/practitioner/date context, optional associated-appointment link), session cards link to the Traitements/Séances tab instead of a second detail surface (mock data only, no consultation creation/editing, no prescriptions/documents, no backend integration) |
| UI-005C | COMPLETE | 10411c8 | Active Consultation Workspace: dedicated `/app/patients/{id}/consultations/{consultationId}` route (independently addressable, not a Patient 360° tab), centralized ActiveConsultation fixtures (draft + completed) with a pure `toClinicalEncounter` transformation proving completion compatibility with UI-005B's historical shape, structured Motif/Observations/Évaluation/Plan draft form (required-reason validation, local dirty-state tracking) reusing the shared `ConsultationStructuredDetail`/`RelatedAppointmentNote` domain pieces (also refactored into UI-005B's own drawer) for the completed read-only view, ConfirmDialog-gated completion, read-only important-medical-context panel reusing UI-005A's ClinicalSummarySection unmodified (mock data only, no prescriptions/documents/invoice generation/appointment backend transitions, no cross-route Agenda or Clinical History persistence, no backend integration) |
| UI-005D | COMPLETE | 6d554ff | Dossier Santé — Documents & Ordonnances: centralized ClinicalDocument fixtures (bounded analysis/imaging/report/prescription/other category registry with a Lucide icon each, cross-referenced with UI-005B's own ClinicalEncounter fixtures rather than duplicated), lightweight category filter + metadata-only document list, read-only document detail drawer with a prototype-only Télécharger notice, prototype "Ajouter un document" upload (native file input, metadata-only — name/type/MIME/size never file contents — MIME allowlist validation), centralized structured Prescription/PrescriptionItem fixtures with a prototype ORD-2026-#### reference generator, prescription history + read-only detail drawer (shared structured-detail presentation with UI-005C) with an optional "Consultation associée" resolved from UI-005B's fixtures, structured "Nouvelle ordonnance" creation form (multiple medications, add/remove, form-completeness-only validation — no drug/dosage/interaction intelligence anywhere), no document/prescription delete or edit (mock data only, no real file upload/storage, no real PDF generation, no backend integration) |
