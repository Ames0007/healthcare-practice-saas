# Frontend — Healthcare Practice Management SaaS

Next.js frontend for the Moroccan bilingual FR/AR Healthcare Practice
Management SaaS. See `/CLAUDE.md` and `/docs/specifications/` at the
repository root for product/UX/design-system requirements, and
`ARCHITECTURE.md` in this directory for the frontend structural
convention established by TASK-003.

No business functionality is implemented yet (Phase 0 — Engineering
Foundation). This is backend-independent: it builds and runs without the
Laravel backend.

## Requirements (as validated in TASK-003)

- Node.js 24.15.0 (Next.js 16 requires 20.9+).
- npm 11.12.1 (only package manager used — single lockfile).

## Setup

```bash
cd frontend
npm install
```

## Running locally

```bash
npm run dev
```

Then open `http://localhost:3000`. `/` is a route-architecture index
linking to the five top-level areas (`/auth`, `/onboarding`, `/app`,
`/book`, `/admin`). `/app` hosts the foundation/demo page proving the
component system — it is explicitly marked "Fondation / Démo", not a
real dashboard. Every other destination under `/app` (Agenda, Patients,
Finance, ...) resolves to a shared "not implemented yet" placeholder
until its task lands.

The language switch in the topbar toggles French/Arabic and LTR/RTL
immediately, with no flash on reload (the root layout resolves the
locale server-side from the `locale` cookie).

## Build

```bash
npm run build
```

## Validation

```bash
npm run typecheck
npm run lint
npm run test
```

Tests use Vitest + React Testing Library (jsdom) — component/structural
checks only. Real viewport/visual responsive behavior and Playwright/E2E
remain TASK-007's scope.
