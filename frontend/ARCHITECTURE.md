# Frontend Architecture

Backend-local companion to `CLAUDE.md` and Specifications #5, #7, #8, #9,
#10. Records the structural conventions established by TASK-003 (frontend
bootstrap) and the graphic-charter alignment applied by TASK-003A.
**No business functionality is implemented yet.**

## Stack

Next.js 16 (App Router, Turbopack by default), React 19.2, TypeScript
(strict), Tailwind CSS v4 (CSS-first `@theme` config, no
`tailwind.config.js`). See `AGENTS.md`/`CLAUDE.md` in this directory —
Next.js auto-generates these to point future agent work at the
version-matched docs bundled in `node_modules/next/dist/docs/`; conventions
here may differ from older Next.js knowledge.

## Route architecture

Five top-level route areas (Spec #5 §5.2), each a real URL prefix (not a
parenthesized Next.js route group, since these must appear in the browser
URL — `/book/{slug}` is referenced directly by `CLAUDE.md` §17):

```text
src/app/
  auth/          /auth        — centered, minimal layout. No real auth yet.
  onboarding/    /onboarding  — centered wizard-shaped layout.
  app/           /app         — the tenant practice application (AppShell).
  book/          /book        — mobile-first public booking layout.
  admin/         /admin       — separate SaaS Super Admin shell.
  page.tsx       /            — route-architecture index (not a marketing page).
```

`src/app/app/[...slug]/page.tsx` is a catch-all: every real nav destination
under `/app` (Agenda, Patients, Finance, ...) resolves to a shared "not
implemented yet" placeholder until its task lands, instead of a bare 404.

`/app` (`src/app/app/page.tsx`) is the real Aujourd'hui dashboard (UI-001),
composed from `src/features/today/`. It replaces the TASK-003 foundation/
demo page — the `<FoundationBadge />` component and `foundation.*`
dictionary keys still exist (unused by any route) as a record of the
original component/token proof, but no longer back a page.

`src/app/app/patients/[id]/` (UI-004A) has 6 real routes — `page.tsx`
(Aperçu) plus `health/`, `appointments/`, `treatments/`, `invoices/`,
`payments/` — each a thin client page that reads the `id` param, runs the
same simulated-loading transition as every other feature page, and
renders `features/patients/patient-detail-page.tsx` with a fixed
`activeTab`. Chosen over a shared `layout.tsx` wrapping `{children}` so
the composition root stays a single, directly-testable component (see
`features/patients/` below) rather than splitting testable logic across
Next.js layout/page boundaries that are awkward to unit-test outside a
real App Router runtime.

No authentication, route guards, or permission checks exist. Do not add
them here — that is a later task (see `CLAUDE.md` §9-10).

## Component layers

```text
src/components/
  ui/       Generic primitives: Button, Input, Textarea (mirrors Input's
            label/error/describedby pattern, added UI-005A for Dossier
            Santé's notes field), Select, Combobox, Card, StatusBadge,
            Skeleton, EmptyState, MetricCard, AttentionItem, Dialog (one
            focus-trapped, portal-rendered implementation backing drawer/
            modal/alert variants — see UI-002), ConfirmDialog, Toast
            (single-slot, not a global provider), Avatar (initials-
            fallback, no photo support), Pagination (compact prev/next, no
            numbered list — see UI-003A), Tabs (real
            `<nav>`/`aria-current="page"` navigation for URL-addressable
            sections — not the ARIA `tablist` pattern, which is reserved
            for JS-only panel switching with no URL change, see UI-004A).
            No business knowledge.
  app/      Shell/domain-agnostic app components: AppShell, AppSidebar,
            AppTopbar, MobileNav, PageHeader, LanguageSwitcher,
            FoundationBadge, AreaPlaceholder.
  domain/   Reusable components that know about one business concept but
            not about a specific screen (Spec #8 §85), e.g.
            `domain/appointments/` — `types.ts` (the full 11-state
            AppointmentStatus/AppointmentSchedulingType machine, Spec #2
            §57.1/#3 §3.1), `appointment-status.ts` (the central status →
            tone/label registry), `appointment-card.tsx` (row/prominent/
            calendar variants; `showPatientName` — default `true` — lets a
            patient-context caller suppress the redundant identity line and
            show the practitioner instead, see Patient Rendez-vous below,
            UI-004B). Both Aujourd'hui (UI-001) and Agenda (UI-002) depend
            on this layer, not the other way around.
            `domain/patients/` (UI-004A) — `types.ts` (`PatientOverview`/
            `PatientActiveTreatment`/`PatientNextInstallment`/
            `PatientActivityItem`/`PatientTabKey`, kept separate from
            `features/patients/types.ts`'s administrative `Patient` type
            per CLAUDE.md §12), `patient-header.tsx` (persistent identity/
            context header) and `patient-activity-timeline.tsx` (the
            unified activity list). Both take only pre-resolved display
            strings/typed data from their caller — no dependency on
            `features/*` mock-data or formatting code, keeping the domain
            layer's isolation intact the same way `appointment-card.tsx`
            does. `domain/treatments/` (UI-004C) — `types.ts`
            (`TreatmentPlan`/`TreatmentSession`, simplified from Spec #4
            §14's backend ENUMs to this task's own status lists),
            `treatment-status.ts`/`session-status.ts` (two separate small
            registries — a session's lifecycle has different semantics
            from an appointment's, so this does not reuse
            `appointment-status.ts`), `session-progress.tsx` (Spec #8 §97
            `SessionProgress` — completed/scheduled/remaining always
            spelled out as text, a real `role="progressbar"`),
            `session-tracker.tsx` (the compact accessible session grid,
            Spec #9 Screen 22 — each cell a labeled button opening that
            session's detail), `treatment-plan-card.tsx`
            (`TreatmentPlanCard`, an "active"/"completed" `variant` plus
            `actions`/`onSelect` — deliberately mirrors
            `appointment-card.tsx`'s own API for consistency).
            `domain/finance/` (UI-004D) — `types.ts` (`Invoice`/
            `InvoiceLine`/`Installment`; money is a plain whole-MAD
            `number` — never a separate minor-units/×100 representation —
            matching `Patient.outstandingBalance`/`formatMad`'s existing
            convention exactly, since no wireframe in this product ever
            shows centimes; introducing a second money model would force
            a wide refactor this task's own instructions explicitly warn
            against), `invoice-status.ts`/`installment-status.ts` (two
            separate small registries, same reasoning as
            `treatment-status.ts`/`session-status.ts`), `invoice-card.tsx`
            (`InvoiceCard`) and `installment-row.tsx` (`InstallmentRow` —
            icon + text + tone, never color alone). No separate money
            formatter was added — `formatMad` (already re-exported by
            `features/patients/format.ts`) remains the one shared
            formatter. UI-004E adds `Payment`/`PaymentAllocation`/`Receipt`
            to the same `types.ts` (still the one whole-MAD `MoneyAmount`,
            no second representation), `payment-status.ts` (its own small
            posted/reversed registry — a payment's lifecycle is not an
            invoice's or an installment's) and `payment-row.tsx`
            (`PaymentRow`, a dense clickable history row mirroring
            `TreatmentPlanCard`'s "completed" variant rather than a full
            `Card`).
            `features/patients/components/invoice-detail-drawer.tsx`'s
            `InvoiceDetailDrawer` (UI-004D) became a genuinely shared
            component in UI-006B — reused unmodified by both Patient
            360°'s Factures tab and Global Finance
            (`/app/finance/invoices`) — because it only ever took
            pre-resolved props to begin with, never assuming Patient
            360° page composition. The one change was a small additive
            `showPatientNavigation` prop (default `false`, so the
            existing Patient 360° caller's behavior is byte-for-byte
            unchanged) that renders two extra quick-navigation links for
            the global context. This is the pattern future cabinet-level
            screens reusing a Patient-360°-owned detail component should
            follow: inspect first, add one additive opt-in prop, never
            fork a second implementation.
            `CashSession`/`CashMovementDirection`/`CashMovementType`/
            `CashMovement` (UI-006C) — simplified from Spec #4 §18's
            `cash_register_sessions`/`cash_movements`, deliberately
            omitting every closing/reconciliation field
            (`expected_closing_balance`/`physical_closing_balance`/
            `difference_*`/`closed_by`/`closed_at`) rather than
            half-modeling UI-006E's own future scope. `cash-session-
            status.ts` (`CASH_SESSION_STATUS_MAP` — closed/open) mirrors
            `invoice-status.ts`'s registry pattern exactly. A
            `CashMovement` is always derived from an existing `Payment`
            or `CabinetExpense` record (`features/caisse/
            calculations.ts`) — never independently authored, the same
            "read model, not a second source of truth" discipline as
            `features/finance/aggregations.ts`'s own receivables/
            activity builders.
            `CabinetExpense` (UI-006A) gained three optional fields in
            UI-006D — `time`, `createdBy`, `supportingDocument` (a new
            `ExpenseSupportingDocument` metadata-only type: `fileName`/
            `mimeType`/`sizeBytes`, mirroring `ClinicalDocument`'s own
            shape, never `File`/`Blob`/base64/an `ObjectURL`) — rather
            than a second expense-entry type, so UI-006A's original
            fixtures stay untouched (all three are optional; a fixture
            without them renders exactly as before).
            `domain/clinical/` (UI-005A) — the first real clinical
            prototype, deliberately separate from `domain/patients/`'s
            administrative `PatientOverview` and from
            `features/patients/types.ts`'s administrative `Patient`
            (CLAUDE.md §8/§12): `types.ts` (`MedicalProfile`/
            `MedicalProfileEntry`, Spec #4 §9.3 `patient_health_flags`
            simplified to this task's own bounded shape),
            `clinical-summary-section.tsx` (`ClinicalSummarySection`, one
            restrained card per category — allergies/history/medications/
            notes all reuse it — with an inline empty sentence rather than
            a full `EmptyState` per category, and a small "Important"
            `StatusBadge` on one entry at a time, never coloring the whole
            card) and `entry-chip.tsx` (`EntryChip`, the removable
            selected-value pill used inside the edit drawer).
            UI-005B adds `ClinicalEncounter` to the same `types.ts` (Spec
            #4 §9.1 `clinical_encounters` simplified — bounded to
            `consultation`/`session`, no amendment entity) and
            `clinical-timeline.tsx` (`ClinicalTimeline`) — a purpose-built
            chronology component rather than a reuse of
            `domain/patients/patient-activity-timeline.tsx`
            (`PatientActivityTimeline`, UI-004A): that component only
            renders one-line translated activity strings and explicitly
            excludes clinical note/diagnosis text, so it cannot represent
            structured motif/session detail or the "Voir la
            consultation"/"Voir le traitement" interactions the Historique
            clinique section needs. Both timelines coexist deliberately —
            Aperçu keeps its concise cross-domain activity feed
            (appointment/payment/document/treatment/consultation, one line
            each), while Dossier Santé gets its own richer, clinical-only
            chronology.
            UI-005C adds `ActiveConsultation`/`ConsultationStatus` to the
            same `types.ts` (Spec #4 §9.1's `status` column narrowed
            further still to `draft`/`completed` only — not the domain
            spec's full draft/active/completed/amended set), deliberately
            shaped so a completed consultation is a near-direct match for
            `ClinicalEncounter`'s own consultation fields (see
            `features/patients/active-consultation.ts`'s
            `toClinicalEncounter`), `consultation-status.ts`
            (`CONSULTATION_STATUS_MAP` — `draft` → `neutral`, mirroring
            `invoice-status.ts`'s own restrained `draft` tone; `completed`
            → `success`, matching every other domain's "completed" tone),
            and two small pieces extracted specifically to avoid
            duplicating UI-005B's own read-only presentation a second time
            (§30 of the task): `consultation-structured-detail.tsx`
            (`ConsultationStructuredDetail`, the four labeled Motif/
            Observations/Évaluation/Plan blocks) and `related-appointment-
            note.tsx` (`RelatedAppointmentNote`, the "Rendez-vous associé"
            block). Both are now shared by UI-005B's
            `ConsultationDetailDrawer` (refactored to consume them instead
            of its own inline copies — its existing tests pass unchanged,
            confirming the refactor is behavior-preserving) and UI-005C's
            completed-consultation view.
            UI-005D adds `ClinicalDocument`/`ClinicalDocumentCategory` and
            `Prescription`/`PrescriptionItem`/`PrescriptionStatus` to the
            same `types.ts` — the last clinical models in the Patient
            360° prototype sequence, completing Dossier Santé alongside
            `MedicalProfile`/`ClinicalEncounter`/`ActiveConsultation`
            above. `document-category.ts` (`DOCUMENT_CATEGORY_MAP` —
            analysis/imaging/report/prescription/other, each with its own
            Lucide icon, never hardcoded per card, never emoji, never a
            per-category color treatment — a document's category is
            informational, not a status). `PrescriptionStatus` keeps
            `"cancelled"` for shape-fidelity with a real future backend
            (matching the task's own two-value model sketch) without any
            UI ever reaching it — every fixture and every prototype
            creation only ever produces `"issued"` (the task's own §31
            explicitly forbids building a cancellation workflow here).
            `Prescription`'s structured `items[]` is a deliberate,
            documented extension of Spec #4 §10.3's generic
            `generated_documents` shape (which treats a prescription as
            just one more `document_kind` with no item-level structure) —
            required by this task's own explicit model, not a
            contradiction of the domain spec; a future generated PDF
            would still be recorded as one `generated_documents` row
            referencing this record (§42, not implemented).

src/features/
  today/    Aujourd'hui screen composition (UI-001): `types.ts` (mock
            data shape — re-exports `AppointmentStatus` from the domain
            layer), `mock-data.ts` (synthetic data — the seam a future
            `TodayDashboardQuery`/API call replaces), `today-dashboard.tsx`
            (loading/loaded/empty/error states), `components/` (page-local
            presentational panels: KpiRow, NextAppointmentSection,
            AgendaPanel, AttentionPanel, FinancePanel,
            TodayDashboardSkeleton).
  agenda/   Agenda & appointment screen composition (UI-002):
            `types.ts`/`mock-data.ts` (practitioners/patients/services/
            appointments — the same mock "today" anchor date as
            `today/mock-data.ts`), `format.ts` (UTC-consistent date-only
            arithmetic — see note below, plus time-slot generation/
            bucketing), `conflict.ts` (frontend-only overlap check +
            nearby-slot suggestions — UX demonstration, not real
            enforcement), `status-actions.ts` (the state-aware primary-
            action registry shared by the drawer and Waiting Room),
            `agenda-page.tsx` (owns the single appointment array all
            views/dialogs read and write), `components/` (AgendaHeader,
            DayView, WeekView, AppointmentDrawer, AppointmentFormDialog,
            RescheduleDialog, CancelConfirmDialog, NoShowConfirmDialog,
            WaitingRoom, AgendaSkeleton, SchedulingFields — the exact-time/
            arrival-window fields shared by create and reschedule).
            `AppointmentDrawer`'s lifecycle callbacks (`onPrimaryAction`/
            `onEdit`/`onReschedule`/`onCancel`/`onNoShow`) are optional —
            a caller that doesn't own Agenda's mutable state (Patient
            Rendez-vous, UI-004B) omits them and the corresponding controls
            simply don't render, instead of a second detail drawer; a
            `patientLinkHref`/`patientLinkLabel` pair overrides the bottom
            identity link for that same caller. Agenda's own usage is
            unchanged (still passes every callback).
            A `features/<name>/` folder is the convention for screen-
            specific composition that isn't a reusable `components/ui` or
            `components/domain` piece.
  patients/ Patients list (UI-003A) plus create/edit (UI-003B):
            `types.ts`/`mock-data.ts` (16 synthetic patients — optional
            administrative fields only, no clinical data, see CLAUDE.md
            §13), `format.ts` (date/money formatting via `toIntlLocale`
            from `@/i18n/intl-locale`), `filter-patients.ts` (pure local
            search + practitioner + next-appointment filtering, no
            backend query), `normalize.ts` (phone/name normalization for
            comparison only — the visible field keeps what the user
            typed), `duplicate-detection.ts` (probable-duplicate check,
            Spec #4 §8 — never merges, never blocks), `patient-number.ts`
            (prototype-only sequential `PAT-000NN` generator, no real
            concurrency), `patient-form-validation.ts`,
            `patients-page.tsx` (owns the single mutable `Patient[]` that
            search/filter/pagination and create/edit all read from and
            write to — the same centralized-state pattern as Agenda's
            appointment array, UI-002), `components/` (PatientsFilters,
            PatientTable, PatientCardList — the same desktop-table/
            mobile-card dual-render pattern as Agenda's Waiting Room —
            PatientsSkeleton, PatientFormDialog: the shared create/edit
            drawer with its own inline duplicate-warning UX). Row actions
            are "Ouvrir" and "Modifier" (opens PatientFormDialog in edit
            mode, prefilled). Patient 360° (UI-004A):
            `mock-overview-data.ts` (treatment/installment/activity
            fixtures per patient id, falling back to an explicit empty
            overview), `patient-detail-page.tsx` (the composition root —
            not-found is derived from a real seed-dataset lookup miss,
            not a simulated `state` value), `components/`
            (PatientOverviewContent, PatientSummaryCard — a restrained
            empty-state rendering distinct from MetricCard's bold
            treatment — PatientTabPlaceholder, PatientDetailSkeleton).
            **Prototype limitation (UI-004A §7):** UI-003B's create/edit
            changes live only in `/app/patients`'s own component state;
            `patient-detail-page.tsx` always looks the patient up in the
            centralized seed dataset (`mock-data.ts`), so a patient
            created in the list is not yet visible at its own `/{id}`
            route. Real cross-page consistency is a backend-integration
            concern, not a frontend state-management one — no Redux/
            Zustand/global store was introduced to paper over it.
            Rendez-vous tab (UI-004B): `patient-appointments.ts` (pure
            derivation — filter Agenda's own `getAgendaMockAppointments()`
            by `patientId`, no second appointment dataset; the upcoming/
            history split and the five status-group filters share one
            status-aware classification rule: a terminal-outcome
            appointment, completed/cancelled/no-show/rescheduled, is
            always history even with a future date, so a future
            cancellation never reads as an upcoming visit),
            `components/patient-appointments-content.tsx` (the tab's
            composition — reuses `AppointmentCard` with
            `showPatientName={false}`, `variant="prominent"` for upcoming
            with per-card "Voir le rendez-vous"/"Ouvrir dans l'agenda"
            actions, the denser `variant="row"` for history; opens the
            shared `AppointmentDrawer` read-only, no lifecycle mutation),
            `components/patient-appointment-filters.tsx` (Tous/À venir/
            Terminés/Annulés/Absents, the same segmented-toggle visual as
            Agenda's Day/Week switch, plus a live result count).
            **Prototype limitation (UI-004B §9):** Agenda owns the one
            mutable appointment array (UI-002); this tab only reads the
            seed fixtures, so a status change made in Agenda during a
            session does not appear here and vice versa — real
            synchronization is a backend-integration concern, same
            reasoning as the create/edit limitation above. "+ Nouveau RDV"
            and "Ouvrir dans l'agenda" are plain links to `/app/agenda`, no
            query-param prefill — UI-002's `AppointmentFormDialog` remains
            the only appointment-creation UX. Traitements/Séances tab
            (UI-004C): `mock-treatments-data.ts` (centralized synthetic
            treatment-plan fixtures — pat-1's active 20-session plan,
            pat-3's completed plan, pat-2 has none), `treatments.ts`
            (filter-by-patientId, active/completed split, session-status
            counts, "prochaine séance" lookup, `getActiveTreatmentSummary`),
            `components/patient-treatments-content.tsx` (the tab
            composition), `components/treatment-detail-drawer.tsx` (one
            `Dialog` instance with two internal views — treatment and a
            selected session — rather than a second nested drawer; the
            parent increments a `key` on every open to reset the internal
            session-selection state, mirroring Agenda's `formDialogKey`
            pattern, instead of a reset effect). **Overview consistency
            (UI-004C §33):** `mock-overview-data.ts`'s
            `getPatientOverview` derives `activeTreatment` from these same
            treatment fixtures (`getActiveTreatmentSummary`) instead of a
            hand-typed number, so the Aperçu card and the Treatments tab
            can never disagree. "+ Nouveau traitement" and a completed
            session's "Voir la consultation" both show a future-feature
            notice rather than a real workflow; "Voir la facturation" is a
            real link to the `/invoices` tab, with no finance figures
            anywhere in the treatment drawer. Factures/Installments tab
            (UI-004D): `mock-invoices-data.ts` (centralized synthetic
            invoice fixtures — pat-1's partial invoice carries the full
            six-installment staged-payment schedule plus a paid and a
            cancelled invoice, pat-4 is fully paid, pat-9 has one overdue
            invoice, pat-2 has none), `finance.ts` (filter-by-patientId,
            the four-group filter, `getFinancialSummary` — excludes
            cancelled invoices from the aggregate — `findNextInstallment`,
            `getPatientFinancialSummary`), `components/patient-invoices-content.tsx`
            (the tab composition), `components/invoice-detail-drawer.tsx`
            (one `Dialog` instance, unmodified drawer width; looks its
            linked `TreatmentPlan` up by id from UI-004C's own fixtures
            rather than duplicating a title). **Overview/header
            consistency (UI-004D §15-16):** `getPatientFinancialSummary`
            returns `null` for any patient with no invoice fixtures, so
            `PatientDetailPage`'s header balance and
            `mock-overview-data.ts`'s next-installment fall back to the
            existing per-patient values unchanged for every seed patient
            this task didn't add invoices for — only the 4 patients that
            actually have invoice fixtures get a derived balance, avoiding
            a wide refactor of the other 12. "+ Nouvelle facture" and
            "Télécharger PDF"/"Imprimer" show a future-feature notice;
            "Encaisser" only navigates to the `/payments` tab and never
            renders for a paid or cancelled invoice. Paiements tab
            (UI-004E): `mock-payments-data.ts` (centralized synthetic
            payment/allocation/receipt fixtures — every posted payment's
            allocations reconcile exactly with UI-004D's own invoice
            `paidAmount`/paid-installment fixtures; pat-9 carries one
            deliberately reversed payment, which is why its invoice still
            shows the full amount overdue rather than an oversight),
            `payments.ts` (filter-by-patientId, `getPaymentSummary` and
            `getEffectivePaidAmount` — both exclude reversed payments,
            `computeEffectiveRemaining`/`getAllocatableInvoices`/
            `getPayableInstallments` — pure functions the capture dialog
            uses to compute an allocatable balance without mutating any
            invoice), `components/patient-payments-content.tsx` (the tab
            composition), `components/patient-payment-capture-dialog.tsx`
            (the Encaisser prototype — an installment target locks the
            amount to its exact value, no partial-installment lifecycle;
            only an invoice with no installment schedule of its own allows
            a free amount up to its remaining balance),
            `components/payment-detail-drawer.tsx` (read-only — no
            edit/delete anywhere, a posted payment is financially
            historical per CLAUDE.md §24). **Local-session payment state
            (UI-004E §33-34):** a captured payment is appended only to
            `PatientPaymentsContent`'s own `localPayments` state, never
            written back into the UI-004D invoice fixtures — invoices stay
            the authoritative prototype balance schedule, payments are
            historical evidence explaining them. This is the same
            "no global store to paper over a prototype seam" principle as
            UI-004A §7/UI-004B §9 above, applied to a same-route local
            mutation instead of a cross-route read: navigating away from
            Paiements and back resets to the seed state. Dossier Santé tab
            (UI-005A): `mock-medical-profiles-data.ts` (centralized
            synthetic profile fixtures — pat-1/Ahmed fully populated
            including one "important" allergy, pat-3/Fatima partially
            populated — some history, no allergies/medications, pat-2/Sara
            has no fixture at all), `medical-profile.ts`
            (`getMedicalProfileForPatient`, `isMedicalProfileEmpty` — `null`
            and "every section empty" are treated identically),
            `components/patient-health-content.tsx` (the tab composition —
            important information only, no active consultation/
            prescriptions/documents, those are UI-005C/D),
            `components/medical-profile-edit-drawer.tsx` (the edit surface
            — see the `clinical/master-data.ts` note below for how its
            three category pickers reuse `Combobox`). Edits are kept only
            in `PatientHealthContent`'s own local state — the same
            local-session-state convention as UI-004E's payment capture
            immediately above, and for the same reason: no LocalStorage/
            IndexedDB/cookie ever holds this clinical data (CLAUDE.md §7).
            **Clinical history (UI-005B):** below the important-information
            cards, the same tab renders `components/clinical-history-
            section.tsx` (`ClinicalHistorySection`) — `mock-clinical-
            encounters-data.ts` (centralized synthetic `ClinicalEncounter`
            fixtures: pat-1/Ahmed has two completed consultations plus one
            completed treatment session that intentionally reuses the exact
            date/practitioner/appointment reference of the "Rééducation
            genou" plan's 6th completed session rather than inventing a
            contradicting duplicate, Spec §12; pat-3/Fatima has a populated
            `MedicalProfile` but no clinical-history fixture at all,
            demonstrating "profile without history"; pat-2/Sara has neither,
            demonstrating the fully empty Dossier Santé), `clinical-
            history.ts` (`getEncountersForPatient`/`sortEncountersDesc`/
            `matchesClinicalHistoryFilter`/`groupEncountersByDate` — pure
            derivation, mirrors `patient-appointments.ts`'s own shape),
            `components/consultation-detail-drawer.tsx` (read-only — no
            edit/delete/reopen anywhere; a completed clinical record is not
            ordinary CRUD, CLAUDE.md §24). A session encounter never opens
            a second detail drawer — it links to `/app/patients/{id}/
            treatments` instead ("Voir le traitement"), reusing UI-004C's
            own treatment/session detail rather than duplicating it (§25-26
            of the task). Loading/error stay a single unified state for the
            whole Dossier Santé tab (both the medical profile and the
            clinical history are the same frontend-only prototype fixture
            read, so there is no real network boundary to split them on).
            **Active consultation workspace (UI-005C):** a dedicated
            route, `app/app/patients/[id]/consultations/[consultationId]/
            page.tsx`, composed from `consultation-workspace-page.tsx`
            (`ConsultationWorkspacePage`) — independently addressable
            rather than a sixth Patient 360° tab, since it is a focused
            clinical task surface, not a browsing view. It deliberately
            does not reuse `PatientHeader`/`Tabs` (that shell shows the
            patient's financial balance, forbidden here by CLAUDE.md §40)
            or UI-005A's `MedicalProfileEditDrawer` (context here is
            strictly read-only — the existing Dossier Santé editor remains
            the sole place to edit a MedicalProfile). New
            `mock-active-consultations-data.ts` (cons-1/pat-1 draft,
            cons-2/pat-4 completed — kept on a different patient than the
            draft to avoid narrative overlap) and `active-
            consultation.ts` (`isConsultationCompletionValid`,
            `isConsultationDirty`, `toClinicalEncounter` — see the
            `domain/clinical/` note above for the shared read-only
            pieces this reuses). **Prototype lifecycle boundary,
            deliberately not engineered around:** completing a
            consultation only changes this component's own local state —
            it is never written back into UI-005B's
            `mock-clinical-encounters-data.ts`, no `/health` navigation or
            Agenda appointment status is touched, and no global store
            (Redux/Zustand/localStorage) was introduced purely to fake any
            of that cross-route effect; `toClinicalEncounter` and its
            tests are the proof the transformation itself is correct, real
            cross-route persistence waits for the backend. **Unsaved-
            changes warning, kept intentionally minimal:** the back link
            to Dossier Santé is a plain, unguarded `Link` — no
            `beforeunload`/router-interception was added (no precedent for
            programmatic `useRouter` navigation exists anywhere else in
            this codebase); a persistent "Modifications non enregistrées"
            indicator is the chosen bounded warning instead, visible
            before the practitioner navigates away.
            **Documents & Ordonnances (UI-005D):** the last two Dossier
            Santé sections, both below Historique clinique — never a
            seventh Patient 360° tab (§6). `mock-clinical-documents-
            data.ts` (pat-1/Ahmed has four documents, three cross-
            referencing UI-005B's own `enc-1`/`enc-2`/`enc-3`
            `ClinicalEncounter` fixtures rather than inventing
            contradicting consultation references, plus one externally-
            scanned `"prescription"`-category document with no
            consultation reference — demonstrating that document
            category exists independently of the structured
            `Prescription` records below; the two are never auto-
            synchronized, §42) and `clinical-documents.ts` (pure
            filter/sort derivation, mirrors `clinical-history.ts`'s own
            shape). `components/documents-section.tsx`
            (`DocumentsSection`): the exact same filter-tab architecture
            as `ClinicalHistorySection` (Tous/Analyses/Imagerie/Comptes-
            rendus/Ordonnances/Autres, its own filtered-empty state and
            result count), `document-upload-dialog.tsx`
            (`DocumentUploadDialog` — a native `<input type="file">`, no
            new FileUpload infrastructure, §18) whose `onChange` reads
            only `file.name`/`file.type`/`file.size`; the file's contents
            are never accessed anywhere (no `FileReader`, no Base64, no
            `ObjectURL`, §19 — verified by a dedicated test asserting
            every stored fixture field is a string/number/undefined,
            never a `Blob`/`File`). No numeric file-size limit was
            invented: Spec #5 §29 names file size as a validation concern
            only in the abstract, with no concrete number anywhere in the
            specifications, and this task's own §21 explicitly forbids
            inventing production security policy without a documented
            basis — so only the MIME allowlist
            (`application/pdf`/`image/jpeg`/`image/png`) is enforced.
            `document-detail-drawer.tsx` (`DocumentDetailDrawer`) is
            read-only — "Télécharger" only ever shows a future-feature
            Toast, never a real file access (§15); no delete anywhere
            (§24). `mock-prescriptions-data.ts`/`prescriptions.ts`
            (`generatePrescriptionNumber` mirrors `generatePaymentNumber`'s
            own illustrative sequential-numbering convention, `ORD-2026-
            ####`) and `components/prescriptions-section.tsx`
            (`PrescriptionsSection`): newest-first history,
            `prescription-form-dialog.tsx` (`PrescriptionFormDialog`) — a
            dynamic medication-item list (add/remove any row, including
            down to zero — removal is never restricted; a clear "at least
            one medication required" error appears on submit instead,
            §34), each item validated for medication/dosage/frequency
            only, duration/instructions staying optional (§35). **No drug
            database, no autocomplete, no dosage/interaction/
            contraindication checking anywhere in this diff** — the
            task's own mandatory §27 constraint, and the most important
            boundary in this task. `prescription-detail-drawer.tsx`
            (`PrescriptionDetailDrawer`) is read-only — no Modifier/
            Supprimer anywhere; "Télécharger PDF"/"Imprimer" are
            prototype affordances only (§40); an optional "Consultation
            associée" section resolves the prescription's
            `consultationId` against UI-005B's own `ClinicalEncounter`
            fixtures, read-only, never mutating that historical record
            (§38). A newly uploaded document and a newly created
            prescription both live only in their own section's local
            component state — the same "local session state, not a
            global store" convention as every prior Dossier Santé
            prototype interaction. This completes the Patient 360°
            clinical frontend prototype sequence (UI-005A/B/C/D).

  clinical/ Bounded prototype clinical master-data catalog (UI-005A §12-14,
            Spec #2 §17.2's "search by keyword / select predefined / add
            custom" form philosophy) — not a database-backed master-data
            management module. `master-data.ts`: `getClinicalMasterData()`
            (6 allergies / 6 history items / 5 medications, FR+AR labels),
            `searchClinicalMasterData` (case- and accent-insensitive via
            NFD normalization — no fuzzy/AI matching), `getMasterDataLabel`
            (locale-resolved display label). **Multi-select via a
            single-select primitive:** each of the edit drawer's three
            category pickers is a `Combobox` (`components/ui/combobox.tsx`)
            whose own committed `value` is always kept `null` by the
            caller — a selection is immediately appended to a local chip
            list and the field clears for the next search, instead of the
            combobox holding one committed value. This reuses `Combobox`
            entirely unmodified for the search/select/keyboard-navigation
            mechanics; the only change to the shared primitive itself is
            that `onCreate` now receives the current query text (a small,
            backward-compatible extension — the one pre-existing caller,
            Agenda's quick-create-patient action, ignores the argument),
            which is what lets a caller create a custom entry from
            whatever the practitioner actually typed (§15) without a
            second, separate multi-select autocomplete system (§27).
            Already-selected master-data items are filtered out of the
            next search's suggestion list by the caller, which is also
            what prevents a duplicate predefined selection (§50) — no
            extra bookkeeping inside `Combobox` itself.

  finance/  Cabinet Finance dashboard composition (UI-006A) — deliberately
            separate from `features/patients/`'s own Factures/Paiements
            tab code, even though both read the same underlying
            `Invoice`/`Payment` fixtures (CLAUDE.md §12/§19: cabinet
            Finance and Patient 360° are different views of shared
            records, never a duplicated dataset). `aggregations.ts` is
            the reuse boundary and the convention future UI-006B/C/D/E
            tasks should follow: `computeReceivableAndOverdue` calls
            `getFinancialSummary` (`features/patients/finance.ts`,
            UI-004D) unmodified, and `computeCollected` calls
            `getEffectivePaidAmount` (`features/patients/payments.ts`,
            UI-004E) unmodified after period-filtering — cabinet KPIs can
            never independently drift from Patient 360°'s own numbers.
            À encaisser/En retard are deliberately not period-scoped
            (current balances, not a period activity flow) while
            Encaissé/Décaissements/Position caisse do recompute per
            period — documented directly in `aggregations.ts`, not left
            implicit. `getPeriodRange` resolves Aujourd'hui/Cette
            semaine/Ce mois against the same fixed `MOCK_BUSINESS_DATE`
            convention as Aujourd'hui/Agenda, reusing Agenda's own
            `getWeekStart` (`features/agenda/format.ts`) for the week
            boundary rather than a second week rule. `mock-expenses-
            data.ts` is a small, read-only, cabinet-only synthetic
            `CabinetExpense` fixture set (type added to `components/
            domain/finance/types.ts`, alongside the existing Invoice/
            Payment) — it exists solely to give the Décaissements KPI/
            activity something real to aggregate; no expense-entry UI
            reads or writes it (UI-006D's own scope). Cash position is a
            documented prototype-only formula (opening 500 MAD, matching
            Spec #9 Screen 30's own illustrative "Solde initial" — +
            period collected − period disbursed), never a real Caisse
            session result (UI-006C/E own that). `finance-dashboard.tsx`
            (loading/loaded/error states, mirroring every other
            top-level screen's own `state` prop convention) composes
            `components/` (PeriodSelector, KpiSummary,
            ReceivablesSection, RecentActivitySection,
            FinanceDashboardSkeleton). Receivables navigate to the
            existing `/app/patients/{id}/invoices` route instead of a
            duplicate detail drawer (§24); "Voir toutes les factures" now
            navigates to `/app/finance/invoices` (UI-006B — it was a
            future-feature Toast notice until that screen existed).
            UI-006B adds `global-invoices.ts` and
            `global-invoices-page.tsx` alongside the dashboard code
            above, for `/app/finance/invoices` — the cabinet-wide
            operational invoice workspace, distinct from both the
            dashboard's compact Receivables list and Patient 360°'s own
            Factures tab. `buildGlobalInvoiceRows` resolves every cabinet
            invoice (not just one patient's) into a `GlobalInvoiceRow`
            that keeps the full `Invoice` embedded rather than
            flattening total/paid/remaining onto the row — the same
            "derive, never duplicate" discipline as `aggregations.ts`
            above. Its own five-value status filter
            (`GlobalInvoiceFilterGroup`) is a second, deliberately
            distinct taxonomy from `features/patients/finance.ts`'s own
            patient-scoped `InvoiceFilterGroup` (documented in both
            files) — the task's own instructions required splitting
            issued/partially_paid into two separate filters here, so
            reusing the patient-scoped one outright was not an option;
            reproducing its underlying `InvoiceStatus` switch instead of
            a same-shaped copy was.
            `GlobalInvoiceTable`/`GlobalInvoiceCardList` mirror
            `features/patients/components/patient-table.tsx`'s/
            `patient-card-list.tsx`'s exact `hidden overflow-x-auto
            md:block` / `divide-y ... md:hidden` dual-render convention
            — the established responsive pattern for any tabular data in
            this codebase, not reinvented here.
            UI-006D adds `expenses.ts` and `expenses-page.tsx` for
            `/app/finance/expenses` — the cabinet cash-expense capture
            workspace, scoped to `MOCK_BUSINESS_DATE` only (like
            `caisse/` itself below) rather than a broader filterable
            ledger, since a décaissement is a cash-register operation
            tied to the currently open session, not an accounting
            history browser (documented deviation from Spec #9 Screen
            32's own Période/Catégorie filters). `createExpenseAndMovement`
            is the reuse-and-integrity boundary: a pure function
            returning a matching `CabinetExpense` + `CashMovement` OUT
            pair whose direction/type/`expenseId`/amount are consistent
            by construction, applied to local state together in the
            page's one create handler (never an intermediate render
            where one exists without the other). It never renders
            Caisse's own theoretical-balance summary (`caisse/`'s own
            scope) — the balance-decrease relationship is instead proven
            directly against `features/caisse/calculations.ts`'s
            exported functions in `expenses.test.ts`, and a persistent
            "Voir la caisse" link is the only cross-page connection
            (cross-route prototype state is not expected to survive
            navigation, same as UI-006C's own documented boundary). The
            supporting-document file input reuses the exact PDF/JPEG/PNG
            allowlist and metadata-only discipline UI-005D's clinical-
            document upload already established, rather than a second
            policy.

  caisse/   Today's cash register (UI-006C), at `/app/finance/caisse`
            (Spec #2's own IA sitemap nests Caisse under Finance — not a
            standalone top-level route). `calculations.ts`'s
            `buildCashMovements` is the reuse boundary: it derives every
            movement from the *existing* posted/cash-method Payment
            fixtures (UI-004E) and posted CabinetExpense fixtures
            (UI-006A) matching the session's own business date —
            reversed payments and cancelled expenses excluded by the
            same filters those modules already established, never a
            second movement-authoring path. Since neither source fixture
            tracks a real time-of-day, a small deterministic
            synthetic-time generator (stable sort key → index → `HH:MM`)
            gives each derived movement a reproducible display time
            without hand-mapping specific fixture ids. Theoretical
            balance reuses `computeCashBalance`
            (`features/finance/aggregations.ts`) — extracted from
            UI-006A's own Position Caisse formula via the smallest safe
            refactor rather than a second copy of `opening + in − out`;
            see that function's own doc comment for the documented
            semantic difference between Finance's period-constant
            "opening" and Caisse's own real entered opening balance.
            `caisse-page.tsx` takes an `initialSession: CashSession |
            null` prop — omitted for the live default (already open, so
            movement history is inspectable immediately), or `null` to
            exercise the closed/opening-workflow path — mirroring every
            other top-level screen's own `state`/data prop-seam
            convention. `components/` (ClosedCaissePanel, CaisseSummary
            — Spec #8 §69's own named component, CaisseMovementList,
            CaisseSkeleton).

Date-only arithmetic (`addDaysIso` in `features/agenda/format.ts`) must
stay entirely UTC-based end to end (`Date.UTC()` construction,
`setUTCDate`/`getUTCDate`, `toISOString()`) — mixing local-time `Date`
parsing with UTC serialization silently shifts the result by a day on any
machine whose timezone is ahead of UTC. Discovered via a real test failure
(a "tomorrow" mock appointment collapsing onto "today"), not by inspection.

src/design-system/
  tokens.css   Semantic CSS custom properties (--ds-color-*, --ds-space-*,
               --ds-radius-*, --ds-shadow-*, breakpoints) mapped into
               Tailwind's `@theme` block, so components use ordinary
               Tailwind utilities (`bg-primary`, `text-text-muted`,
               `rounded-lg`, ...) that resolve to the tokens. Feature code
               must not hardcode hex colors or arbitrary spacing.

src/lib/
  cn.ts           Minimal conditional className joiner (no dependency).
  nav-config.ts   Single source of truth for sidebar/mobile-nav items —
                  future permission/entitlement/specialty filtering wraps
                  this array; do not fork the sidebar per role (Spec #8 §76).
```

Only the components a landed task needs exist. The remaining components
listed in Specification #8 §97 (Calendar, ClinicalTimeline, HealthFlag,
SessionProgress, InvoiceSummary, PaymentModal, ...) are created by the
tasks that first need them.

## Design tokens

`src/design-system/tokens.css` is the single authoritative token source —
feature code must consume the semantic Tailwind utilities it generates
(`bg-primary`, `text-text-muted`, `bg-success-soft`, ...) and must not
hardcode hex colors. Values are frozen by **Specification #10 (Visual
Identity & Graphic Charter)**, applied by TASK-003A:

```text
primary          #0F766E   primary-hover     #115E59
primary-strong   #134E4A   primary-support   #0D9488
primary-soft     #F0FDFA   primary-foreground #FFFFFF

background       #F8FAFC   surface           #FFFFFF
surface-subtle   #F1F5F9

text             #0F172A   text-secondary    #475569
text-muted       #64748B   text-disabled     #94A3B8

border           #E2E8F0   border-strong     #CBD5E1

success  #15803D / success-soft #F0FDF4
warning  #B45309 / warning-soft #FFFBEB
danger   #B91C1C / danger-soft  #FEF2F2
info     #1D4ED8 / info-soft    #EFF6FF
```

Radii (small 6px / medium 8px / large 12px / xl 16px — buttons/inputs
~8px, cards ~12px) were already Spec #10-compliant since TASK-003 and were
not changed. StatusBadge additionally exposes a `primary` tone (restrained
teal, Spec #10 §6 — e.g. appointment "In consultation") alongside
success/warning/danger/info/neutral.

Dark mode is explicitly not a V1 requirement (Spec #8 §90) — light tokens
only, no `prefers-color-scheme` branching.

## Internationalization (FR/AR)

```text
src/i18n/
  config.ts            Locale list, default locale, dir-per-locale map,
                        bootstrap cookie name.
  intl-locale.ts        `toIntlLocale()` — maps our two locales to full ICU
                        tags (`ar-MA`/`fr-FR`) for `Intl.*` APIs. Shared by
                        every feature that formats dates/money (Today,
                        Agenda, Patients); moved here in UI-003B once a
                        third feature needed it — Agenda had independently
                        redefined the same two-line function during UI-002,
                        so the move also removed a real duplicate, not just
                        a Today-specific export.
  locales/fr.json       Dictionaries. Nested keys, dot-path lookup.
  locales/ar.json
  dictionary.ts         translate(messages, key, params) — dot-path
                        lookup + {{param}} interpolation. Missing keys warn
                        in development and fall back to the key itself.
  get-locale.ts (server) Reads the locale cookie via next/headers cookies()
                        (async in Next.js 16) so the root layout renders
                        the correct <html lang/dir> on the very first
                        response — no language/direction flash.
  locale-provider.tsx (client) React context: current locale, t(), and
                        setLocale() (updates state, the cookie, and
                        document.documentElement.lang/dir immediately).
```

This is a genuine, extensible foundation, not a throwaway shim — TASK-010
("FR/AR localization foundation") builds on it rather than replacing it,
adding whatever this bootstrap intentionally defers: persistence tied to
an authenticated user's account (this cookie is bootstrap-only, per
TASK-003 §25), and a full audit of every future feature string. No
hardcoded user-facing strings exist in components; everything routes
through `t()`.

A full i18n library (next-intl, react-i18next, ...) was deliberately not
adopted for this bootstrap-sized dictionary — hand-rolled dot-path lookup
is sufficient today and avoids a library decision that Specification #6
§40 flags as ADR-worthy before it's actually needed. Revisit if/when
TASK-010 needs pluralization, ICU message format, or per-namespace
splitting that outgrows this.

## RTL

`dir="rtl"`/`dir="ltr"` is set on `<html>` from the resolved locale — real
browser bidi layout, not a cosmetic `text-align`. Components consistently
use Tailwind's logical-property utilities (`ps-*`/`pe-*`, `ms-*`/`me-*`,
`start-*`/`end-*`, `border-e`) instead of physical `left`/`right`
utilities, so spacing/alignment/borders flip automatically under RTL with
no `rtl:` variant needed. Flex-row layouts (e.g. AppShell's
sidebar/content split) rely on the browser's native bidi reversal of row
direction under `dir="rtl"`. The few genuinely directional icons (e.g. the
"back to home" arrow in `AreaPlaceholder`) explicitly mirror via
`rtl:rotate-180` rather than being assumed symmetric.

## Typography

Latin: **Inter** (Spec #10 §7). Arabic: **Noto Sans Arabic** (Spec #10
§8). Both loaded via `next/font/google`
(self-hosted at build time, no runtime request to Google, no font files
committed to the repo) as CSS variables (`--font-latin`, `--font-arabic`)
consumed by `globals.css`; `:lang(ar)` swaps the font stack order so
Arabic text always renders in the Arabic-appropriate face regardless of
which locale's layout wraps it (Spec #7 §40: generated/embedded content
language is independent of current UI language).

## Responsive shell

```text
< md   (mobile)   Bottom nav (Aujourd'hui/Agenda/Patients/Plus). No sidebar.
md–lg  (tablet)   Icon-only collapsed sidebar rail.
>= lg  (desktop)  Full expanded sidebar with labels.
```

## Icons

`lucide-react` — one consistent stroke-based icon library, used
everywhere an icon appears (nav, topbar, StatusBadge tones, directional
indicators). Confirmed as the approved family by Spec #10 §25. Not an
ADR-worthy decision (Spec #6 §40 examples an icon library is not among
them) but recorded here for traceability.

## Server-state strategy (future)

No API integration exists yet (TASK-003 is backend-independent by
design). When backend integration begins, follow Specification #5 §6:
server state (patients, appointments, invoices, ...) through a
query/cache library at the boundary; local UI state (open modal, selected
tab, in-progress form) stays local. Do not duplicate server business
state into ad hoc global stores.

## Testing

`vitest` + `@testing-library/react` (jsdom environment) — a minimal,
justified addition for TASK-003's required component-level checks (shell
renders, language switch FR→AR, dir LTR→RTL, Button behavior, mobile nav
structure). This is not the full testing architecture: no Playwright/E2E,
no CI wiring — that remains TASK-007's scope. Real viewport/visual
responsive behavior is validated manually against the dev server, not in
jsdom (jsdom has no real CSS layout engine).
