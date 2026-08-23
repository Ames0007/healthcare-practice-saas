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

No authentication, route guards, or permission checks exist. Do not add
them here — that is a later task (see `CLAUDE.md` §9-10).

## Component layers

```text
src/components/
  ui/       Generic primitives: Button, Input, Card, StatusBadge, Skeleton,
            EmptyState, MetricCard, AttentionItem. No business knowledge.
  app/      Shell/domain-agnostic app components: AppShell, AppSidebar,
            AppTopbar, MobileNav, PageHeader, LanguageSwitcher,
            FoundationBadge, AreaPlaceholder.
  domain/   Reusable components that know about one business concept but
            not about a specific screen (Spec #8 §85), e.g.
            `domain/appointments/` (AppointmentCard + the appointment
            status → tone/label registry). Agenda (UI-002) is expected to
            reuse `AppointmentCard` rather than building its own.

src/features/
  today/    Aujourd'hui screen composition (UI-001): `types.ts` (mock
            data shape), `mock-data.ts` (synthetic data — the seam a
            future `TodayDashboardQuery`/API call replaces),
            `today-dashboard.tsx` (loading/loaded/empty/error states),
            `components/` (page-local presentational panels: KpiRow,
            NextAppointmentSection, AgendaPanel, AttentionPanel,
            FinancePanel, TodayDashboardSkeleton). A `features/<name>/`
            folder is the convention for screen-specific composition that
            isn't a reusable `components/ui` or `components/domain` piece.

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
listed in Specification #8 §97 (Drawer, Modal, Tabs, Table, Calendar,
PatientHeader, ...) are created by the tasks that first need them.

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
