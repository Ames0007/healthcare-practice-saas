# Architectural Decision Records

Format:

```text
ADR-XXX
Context
Decision
Alternatives
Consequences
Date
```

---

## ADR-001 — Core Technology Stack

### Status

Accepted

### Decision

Use:

```text
Frontend:
Next.js + React + TypeScript

Backend:
Laravel

Database:
PostgreSQL

Cache / Queue:
Redis

File Storage:
S3-compatible private object storage

Architecture:
Modular Monolith

API:
REST JSON under /api/v1
```

### Context

The application is workflow-heavy and transaction-heavy, including:

- Patients
- Appointments
- Clinical records
- Treatments
- Invoices
- Payments
- Caisse
- HR
- Commissions
- Inventory
- Communications
- Subscriptions

The architecture prioritizes rapid commercial development, transactional correctness, maintainability and future extensibility.

### Alternatives

Not formally recorded prior to this decision. This stack was pre-approved before TASK-001 execution began.

### Consequences

- Laravel becomes the backend framework for subsequent tasks.
- Next.js/TypeScript becomes the frontend.
- Do not introduce NestJS or another backend framework without a new approved ADR.
- Do not introduce microservices without an approved architectural change.

### Date

2026-08-23
