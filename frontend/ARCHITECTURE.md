# Frontend Architecture

Backend-local companion to `CLAUDE.md` and Specifications #5, #7, #8, #9.
Records the structural conventions established by TASK-003 (frontend
bootstrap). **No business functionality is implemented yet.**

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

Only `/app` has real foundation content (`src/app/app/page.tsx`) —
explicitly marked as demo content via `<FoundationBadge />`, not a real
Aujourd'hui dashboard.

No authentication, route guards, or permission checks exist. Do not add
them here — that is a later task (see `CLAUDE.md` §9-10).

## Component layers

```text
src/components/
  ui/       Generic primitives: Button, Input, Card, StatusBadge, Skeleton,
            EmptyState. No business knowledge.
  app/      Shell/domain-agnostic app components: AppShell, AppSidebar,
            AppTopbar, MobileNav, PageHeader, LanguageSwitcher,
            FoundationBadge, AreaPlaceholder.

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

Only the components TASK-003 needs exist. The other ~50 components listed
in Specification #8 §97 (Drawer, Modal, Tabs, Table, Calendar,
PatientHeader, ...) are created by the tasks that first need them.

## Design tokens

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

Latin: Inter. Arabic: Noto Sans Arabic. Both loaded via `next/font/google`
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
indicators). Not an ADR-worthy decision (Spec #6 §40 examples an icon
library is not among them) but recorded here for traceability.

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
