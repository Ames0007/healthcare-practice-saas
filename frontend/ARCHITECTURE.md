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
  ui/       Generic primitives: Button, Input, Select, Combobox, Card,
            StatusBadge, Skeleton, EmptyState, MetricCard, AttentionItem,
            Dialog (one focus-trapped, portal-rendered implementation
            backing drawer/modal/alert variants — see UI-002), ConfirmDialog,
            Toast (single-slot, not a global provider), Avatar
            (initials-fallback, no photo support), Pagination (compact
            prev/next, no numbered list — see UI-003A), Tabs (real
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
            formatter.

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
            "Encaisser" only navigates to the still-placeholder
            `/payments` tab (UI-004E owns real collection) and never
            renders for a paid or cancelled invoice.

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
