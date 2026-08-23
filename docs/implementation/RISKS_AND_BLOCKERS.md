# Risks and Blockers

Unresolved decisions and open risks tracked across the project. These are not resolved during TASK-001.

Format:

```text
ID
Topic
Status
Affected Tasks
Description
Decision Required Before
```

---

### RISK-001

**Topic:** Morocco-specific health-data/privacy requirements
**Status:** OPEN
**Affected Tasks:** TASK-097–TASK-101, TASK-248
**Description:** Applicable Moroccan legal requirements for storage, retention and handling of patient health data (Loi 09-08 and any sector-specific rules) have not been confirmed.
**Decision Required Before:** Production launch (Phase 18 legal/privacy review).

---

### RISK-002

**Topic:** Morocco-specific invoice/document legal requirements
**Status:** OPEN
**Affected Tasks:** TASK-118, TASK-119
**Description:** Legal/fiscal requirements for invoice numbering, content and format in Morocco have not been confirmed.
**Decision Required Before:** TASK-118/119 production finalization.

---

### RISK-003

**Topic:** Final Owner/Admin access policy to another practitioner's clinical data
**Status:** OPEN
**Affected Tasks:** TASK-056, TASK-096, TASK-220
**Description:** Whether Owner/Admin has any access to clinical data governed by another practitioner is an explicit unresolved product decision. Must not be guessed.
**Decision Required Before:** TASK-096 (clinical permissions).

---

### RISK-004

**Topic:** WhatsApp provider
**Status:** OPEN
**Affected Tasks:** TASK-174, TASK-176–TASK-181
**Description:** No commercial WhatsApp Business API provider has been selected. Provider interface/test adapter to be used until resolved.
**Decision Required Before:** Production communication adapters.

---

### RISK-005

**Topic:** SMS provider
**Status:** OPEN
**Affected Tasks:** TASK-174, TASK-176–TASK-181
**Description:** No SMS provider has been selected for Morocco. Provider interface/test adapter to be used until resolved.
**Decision Required Before:** Production communication adapters.

---

### RISK-006

**Topic:** SaaS subscription payment provider
**Status:** OPEN
**Affected Tasks:** TASK-035, TASK-036
**Description:** No payment provider has been selected for SaaS subscription billing. Provider-neutral abstraction to be used until resolved.
**Decision Required Before:** Real subscription billing.

---

### RISK-007

**Topic:** PostgreSQL Row-Level Security (RLS) decision
**Status:** OPEN
**Affected Tasks:** TASK-020, TASK-021
**Description:** Whether tenant isolation relies on RLS in addition to application-level tenant scoping has not been decided.
**Decision Required Before:** TASK-020 (tenant-scoped persistence).

---

### RISK-008

**Topic:** Caisse concurrency model
**Status:** OPEN
**Affected Tasks:** TASK-133–TASK-145
**Description:** Final locking/concurrency strategy for caisse session open/close and movement posting has not been finalized.
**Decision Required Before:** Final cash hardening.

---

### RISK-009

**Topic:** Negative-stock policy
**Status:** OPEN
**Affected Tasks:** TASK-165
**Description:** Whether stock OUT movements may drive balance negative, and under what authorization, is undecided.
**Decision Required Before:** TASK-165 (Stock OUT).

---

### RISK-010

**Topic:** Trial duration
**Status:** OPEN
**Affected Tasks:** TASK-031, TASK-252
**Description:** Exact trial length in days has not been commercially finalized.
**Decision Required Before:** Commercial subscription configuration.

---

### RISK-011

**Topic:** Final pricing
**Status:** OPEN
**Affected Tasks:** TASK-027, TASK-252
**Description:** Final plan pricing has not been commercially finalized.
**Decision Required Before:** Commercial subscription configuration.

---

### RISK-012

**Topic:** Production hosting/provider/region
**Status:** OPEN
**Affected Tasks:** TASK-237–TASK-239
**Description:** Production infrastructure provider and region have not been selected.
**Decision Required Before:** TASK-237 (production infrastructure).

---

### RISK-013

**Topic:** Backup RPO/RTO
**Status:** OPEN
**Affected Tasks:** TASK-234, TASK-235, TASK-250
**Description:** Target recovery point/time objectives for backup and restore have not been defined.
**Decision Required Before:** TASK-234 (backup procedure).
