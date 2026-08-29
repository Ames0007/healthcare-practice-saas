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

---

### RISK-014

**Topic:** No Docker/Docker Compose on the primary development machine
**Status:** MITIGATED (TASK-004 native/portable infrastructure, ADR-002)
**Affected Tasks:** TASK-004, any future task that assumes a `compose.yml`
**Description:** Docker and Docker Compose are not installed, and WSL2 is
not confirmed working (checking the underlying Windows feature requires
admin rights unavailable in this environment). TASK-004 therefore runs
PostgreSQL/Redis/MinIO as native/portable processes under the user's
local profile instead of containers (see ADR-002 in DECISIONS.md). No
`compose.yml` exists in the repository. If a developer machine with
working Docker joins the project, a compose file equivalent to
`scripts/dev-*.sh` should be authored and validated then — not before it
can actually be run.
**Decision Required Before:** Any task that assumes Docker Compose is the
local infrastructure mechanism (e.g. authoring CI service containers that
mirror local dev, or onboarding a Docker-equipped developer).

---

### RISK-015

**Topic:** Arabic-language PDF generation produces corrupted glyphs
**Status:** OPEN (mitigated in UI — feature gated off, not shipped broken; ADR-016)
**Affected Tasks:** UI-DOCS-X, any future task that generates PDF/printable
documents
**Description:** `@react-pdf/renderer` 4.9.0's Arabic text-shaping/layout
pipeline intermittently drops or corrupts individual glyphs in real,
visually-inspected generated PDFs (e.g. a leading hamza-bearing letter
rendering as a disconnected floating mark; an internal "ف" vanishing
entirely) — confirmed via an independent renderer (poppler `pdftoppm`),
reproduced identically across two different embedded fonts (Noto Naskh
Arabic, Noto Sans Arabic), and still present after pre-shaping the text
into Arabic Presentation Forms via `arabic-reshaper` to bypass the
library's own shaper. This rules out "wrong font" and "buggy contextual-
substitution table" as the fixable cause and points at the library's
lower-level glyph-positioning/bidi pipeline itself — outside what this
task can fix from application code. UI-DOCS-X therefore ships French PDF
generation only; `Télécharger`/`Imprimer` show a real translated notice
instead of generating a corrupted file whenever
`DocumentSettings.documentLanguage === "ar"` (`isDocumentLanguageSupported`,
`frontend/src/features/documents/capabilities.ts`). The document
builders/PDF components for Arabic are kept fully implemented and tested
(`pdf-generation.test.ts`) so re-enabling is a one-line change once fixed.
**Decision Required Before:** Any commitment to ship Arabic-language PDF
documents to a real cabinet. Candidate next steps: (a) re-test against a
future `@react-pdf/renderer` release, (b) evaluate a HarfBuzz-backed
alternative (e.g. `pdf-lib` + a WASM HarfBuzz shaper) if this remains
unfixed, or (c) move authoritative document rendering server-side
(Laravel) with a more mature Arabic-shaping toolchain — consistent with
the task's own documented "future production architecture may move
authoritative document rendering to the backend" boundary.
