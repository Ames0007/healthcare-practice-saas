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
