# Healthcare Practice Management SaaS

## Project

Healthcare Practice Management SaaS.

## Product description

A bilingual French/Arabic multi-tenant SaaS for Moroccan healthcare practitioners and small cabinets.

Initial specialties include:

- General medicine
- Dentistry
- Physiotherapy / kinesitherapy
- Psychology
- Nutrition
- Dermatology / aesthetic medicine
- Small multi-practitioner practices

## Architecture status

The project is being implemented according to the specifications under `docs/specifications/`, following the task-by-task execution model defined in `CLAUDE.md` and `docs/specifications/06-master-implementation-plan.md`.

## Documentation map

```text
docs/specifications/   Product and technical specifications
docs/tasks/             Claude Code implementation tasks
docs/implementation/   Execution status, decisions, risks and changelog
CLAUDE.md               Permanent engineering instructions
```

## Development status

Implementation is beginning with **Phase 0 — Engineering Foundation**.

```text
backend/    Laravel backend (TASK-002) — structural foundation only.
frontend/   Next.js frontend (TASK-003) — structural foundation only.
```

Neither implements business functionality yet. Remaining infrastructure
setup (local dev environment, PostgreSQL, Redis, CI, ...) follows
starting with TASK-004. See `backend/README.md` and `frontend/README.md`
for validated local setup/run commands for each.
