# Healthcare Practice Management SaaS

## Specification 07 --- Frontend UX/UI Product Specification

**Market:** Morocco\
**Languages:** French and Arabic\
**Primary device:** Desktop/laptop web, with responsive tablet/mobile
support\
**Primary users:** Solo practitioners and small practices, generally
1--5 users\
**Product principle:** Solo-first, cabinet-capable

# 1. UX vision

The application contains substantial operational functionality but must
never feel like a hospital ERP. It should feel simple, fast,
professional, calm, trustworthy, operational and modern.

Core rule: **the sophistication belongs in the architecture; the
simplicity belongs in the interface.**

# 2. Core UX principles

-   Action before analytics: answer "what needs my attention now?"
-   Progressive complexity: show functions according to specialty, team,
    permissions and subscription.
-   Patient-centric navigation: Patient 360° is the central patient
    workspace.
-   Contextual actions: drawers for quick context, modals for bounded
    actions, full pages for deep workflows.
-   Minimal data re-entry: prefill known patient, practitioner, service,
    price and references.
-   Safe by default: sensitive actions require explicit confirmation.
-   Visible state: confirmed, waiting, paid, overdue, failed, etc. must
    be immediately understandable.
-   Moderate information density: neither giant consumer cards nor
    cramped ERP tables.

# 3. Application shell

Desktop navigation:

``` text
Aujourd'hui
Agenda
Patients

Finance
Équipe
Stock

Communication
Rapports

Paramètres
Abonnement
```

Do not permanently expose every submodule. Finance, Équipe and Stock use
internal tabs.

The top bar contains global search, quick-create, notifications, FR/AR
switch and user menu.

# 4. Adaptive navigation

Solo practitioner: Aujourd'hui, Agenda, Patients, Finance,
Communication, Rapports, Paramètres, Abonnement. Stock appears when
relevant; Équipe stays minimal until staff exists.

Small cabinet adds Équipe and operational team functionality.

Kiné emphasizes treatments/sessions inside patient and daily workflows
without becoming a separate product.

# 5. Global quick-create and search

Quick-create may offer Nouveau patient, Nouveau RDV, Nouvelle facture,
Nouvel encaissement and Nouveau décaissement, subject to permissions.

Global search supports patient name, phone, patient number, invoice and
receipt/payment references. Results are grouped by entity and keyboard
navigable.

# 6. Aujourd'hui --- command center

Default authenticated landing page. Priority:

1.  Current operational state.
2.  Today's schedule.
3.  Next actions.
4.  Financial snapshot.
5.  Alerts.

Example:

``` text
Bonjour Dr. Benali                         Samedi 23 août

8 RDV        6 confirmés       1 à confirmer       1 absent

PROCHAIN
10:30   Ahmed El Mansouri
        Consultation
                         [Ouvrir] [Patient arrivé]

AGENDA DU JOUR
09:00   Fatima Zahra       Terminé
10:00   Sara Alaoui        En consultation
10:30   Ahmed El Mansouri  Confirmé

À FAIRE
3 rendez-vous à confirmer
2 échéances en retard
1 patient à rappeler
2 articles en stock faible

FINANCES AUJOURD'HUI
Encaissements      2 400 MAD
À encaisser          800 MAD
Décaissements        350 MAD
Caisse             3 050 MAD
```

Practitioner emphasizes next/waiting patients. Reception emphasizes
confirmation, arrivals, payments, booking requests and caisse. Owner may
additionally see financial, staff, stock and subscription alerts.

# 7. Agenda UX

Primary controls: Today, previous/next, Day/Week, practitioner filter,
New RDV.

V1 supports exact appointments and arrival windows. They must display
differently:

``` text
10:00 — Ahmed — Consultation — Confirmé
10:00–10:30 — Sara — Arrivée entre — Confirmé
```

Status uses icon + label + semantic color, never color alone.

Clicking an appointment opens a right-side drawer showing patient,
phone, date/time/window, practitioner, service, status and the primary
next action.

State-sensitive primary actions:

``` text
CONFIRMED -> Patient arrivé
ARRIVED -> Mettre en attente
WAITING -> Commencer
IN_CONSULTATION -> Ouvrir consultation
```

Secondary actions: open patient, edit, reschedule, cancel.

Appointment creation sequence: Patient → Practitioner → Service/Motif →
Date → Exact/Plage → Time → Confirmation. Quick-create patient must
preserve appointment context.

Conflict UX says the slot is unavailable and proposes nearby
alternatives; it does not expose technical errors.

# 8. Waiting room

Operational list showing patient, appointment, arrival time, waiting
duration and status. Primary actions remain directly accessible. Avoid
unnecessary Kanban complexity in V1.

# 9. Patients

Default list columns: Patient, Téléphone, Praticien, Dernière visite,
Prochain RDV, Solde.

Patient creation starts lightweight: Prénom, Nom, Téléphone, Praticien
responsable. Secondary identity/contact fields are expandable. Do not
force medical data during reception creation.

Duplicate warning shows probable existing patient with Open Existing /
Create Anyway. Never auto-merge.

# 10. Patient 360°

Persistent header:

``` text
Ahmed El Mansouri                         PAT-00281
06 XX XX XX XX    34 ans    Dr. Benali

Prochain RDV: 27 août · 10:30
Solde: 1 500 MAD

[+ RDV] [Facturer] [Encaisser] [Plus]
```

Tabs:

``` text
Aperçu
Dossier Santé
Rendez-vous
Traitements / Séances
Factures
Paiements
```

Documents stay inside Dossier Santé.

Overview contains next RDV, active treatment, remaining sessions,
outstanding amount, next installment and a unified timeline. Clinical
visibility remains permission-controlled.

# 11. Dossier Santé

Clinical UX should not look like finance tables.

Structure:

``` text
Informations importantes
- Allergies
- Antécédents / conditions
- Traitements actuels

Historique clinique
23 août 2026
Consultation
Motif
Observations
Prescription
Documents
```

Master-data-backed additions use searchable suggestions plus "Ajouter
une valeur personnalisée". Search supports FR/AR. Tenant custom values
never modify global master data.

# 12. Consultation workspace

Header retains patient context. Main area contains reason, specialty
form, notes, health flags, documents and prescriptions. Persistent
actions: Enregistrer brouillon and Terminer consultation.

Protect against accidental loss of unsaved work.

# 13. Documents

Documents live inside Dossier Santé and show type, title, date,
practitioner and view/download actions. Upload supports desktop
drag/drop and normal file selection. Never expose raw storage URLs.

# 14. Treatments and sessions

Treatment header shows status, practitioner, dates, planned sessions and
progress. Clinical progress and financial progress remain visually
separate.

Kiné tracker:

``` text
12 / 20 séances terminées

01 ✓  02 ✓  03 ✓  04 ✓
05 ✓  06 ✓  07 ✓  08 ✓
09 ✓  10 ✓  11 ✓  12 ✓
13 ○  14 ○  15 ○  16 ○
17 ○  18 ○  19 ○  20 ○

Prochaine séance
26 août · 15:00

[Planifier prochaine séance]
```

# 15. Finance

Finance is operational, not accounting.

Use terms: Facturé, Encaissé, À encaisser, En retard, Décaissements,
Caisse.

Internal tabs: Aperçu, Factures, Échéances, Encaissements, Caisse,
Décaissements.

Do not introduce general ledger/debit/credit language.

# 16. Invoice UX

List: Facture, Patient, Date, Montant, Payé, Reste, Statut.

Invoice detail prominently shows total, paid, remaining and status.
Primary action is Encaisser when balance exists. Secondary: download,
print, installments and authorized cancellation.

# 17. Payment UX

Payment must feel almost like a POS operation:

``` text
Encaisser

Ahmed El Mansouri
FAC-2026-00182

Reste à payer
2 000 MAD

Montant reçu
[ 500 ] MAD

Mode
Espèces

[ENCAISSER 500 MAD]
```

Success immediately shows amount paid, remaining balance and receipt
actions. Pending state prevents double submission.

# 18. Installments

Simple schedule with sequence, date, expected amount and status. Overdue
items are prominent and actionable.

# 19. Caisse

Daily view shows opening balance, cash inflows, cash outflows and
expected balance plus movement history.

Closing:

``` text
Solde attendu
3 850 MAD

Espèces comptées
[3 820] MAD

Écart
-30 MAD

Motif de l'écart
[________________]

[CONFIRMER LA FERMETURE]
```

Reason appears only when needed. Closing is a sensitive confirmation
action.

# 20. Décaissements

Simple form: category, beneficiary/prestataire, description, amount,
payment method and supporting document. If cash is selected, clearly
state that caisse will be affected.

# 21. Équipe

Use "Équipe", not HR, in primary navigation.

Solo empty state explains the practitioner is currently working alone
and offers Ajouter un membre.

Employee profile sections: Profil, Planning, Congés, Paie, Commissions,
Documents, Permissions. Only relevant sections appear.

# 22. Permissions

Do not expose technical RBAC language. Use understandable checkboxes
grouped by Patients, Rendez-vous, Factures, Encaissements, Caisse,
Dossier Santé, Paie, etc.

Clinical access is clearly separate from administrative patient access.

# 23. Leave, payroll and commissions

Leave request and approval should be lightweight.

Commission screen must visibly state whether the basis is collected or
invoiced and show eligible amount, rate and calculated commission.

Payroll remains operational rather than statutory-accounting UX.

# 24. Inventory

List: Article, Stock, Minimum, Lot, Expiration, Statut.

Primary actions: Entrée stock, Sortie stock, Ajustement.

Alerts: Stock faible, Expire bientôt, Expiré.

Do not introduce purchasing/procurement vocabulary.

# 25. Communication

Communication center shows patient, type, channel, date and delivery
status rather than mimicking a generic email client.

Templates organized by purpose: appointment
confirmation/reminder/change, payment, installment, follow-up.

Template editor supports variables and preview.

# 26. Reports

Reports answer operational management questions using concise KPI cards,
charts and tables. Avoid decorative dashboards and excessive charting.

# 27. Settings

Section navigation:

``` text
Cabinet
Praticiens
Services & tarifs
Horaires
Utilisateurs & permissions
Master Data
Documents & numérotation
Communication
Intégrations
Langue & préférences
```

Avoid one giant settings form.

# 28. Onboarding

Target: reach useful product state quickly.

``` text
1. Votre activité
2. Votre cabinet
3. Vos horaires
4. Vos services et tarifs
5. Votre espace est prêt
```

Optional staff/integrations do not block first use.

Specialty selection seeds relevant master data. Service setup uses
search/select and asks price, duration and appointment mode.

Completion presents actions: create first patient, create first RDV,
share booking link.

# 29. Subscription

Keep commercially simple: plan, billing period, renewal date, status,
trial remaining, limits and renewal action.

Before expiration use progressively stronger banners. During grace use
persistent warning. Blackout uses a dedicated renewal screen, not broken
modules.

# 30. Referral

Simple customer-facing experience: referral code/link, share action,
referral history and free-month reward. Fraud controls remain internal.

# 31. Public booking

Public booking is mobile-first, simple, practice-branded and
accountless.

Fields: Prénom, Nom, Téléphone, Motif/Service, Date souhaitée, Créneau,
optional Commentaire.

Submission result must state that the request still requires practice
confirmation and that confirmation will arrive by WhatsApp/SMS.

QR settings show canonical link plus copy/download/print actions.

# 32. SaaS Super Admin

Separate product surface with Dashboard, Cabinets, Abonnements, Plans,
Master Data, Parrainages, Support/Operations and Audit.

Do not expose clinical content by default.

# 33. Interaction patterns

Use **drawers** for appointment, invoice and quick contextual
inspection.

Use **modals** for bounded actions such as payment, close caisse,
approve leave and small additions.

Use **full pages** for Patient 360°, Dossier Santé, treatment, reports
and settings.

Use **confirmation dialogs** for sensitive actions such as reverse
payment, cancel invoice, close/adjust caisse, change responsible
practitioner and deactivate staff.

Use **toasts** for brief success feedback, not critical errors.

# 34. Forms and validation

Group related fields. Do not request derivable information. Show
field-level validation. Preserve unsaved work where practical.

Date/time UX clearly distinguishes exact time from `De / À` arrival
windows.

Money displays consistently as `1 500 MAD`.

Phone entry is Morocco-friendly while backend performs normalization.

# 35. Tables and filters

Tables have clear headers, pagination, compact actions and responsive
behavior. Avoid excessive columns.

Secondary filters belong behind a filter control. High-frequency filters
such as date/practitioner/status may remain visible.

# 36. Loading, empty and error states

Use skeletons for routine page loading rather than full-page spinners.

Empty states teach the next action.

Differentiate network, permission, subscription, conflict, provider,
validation and system errors. Provide recovery actions when possible.

# 37. Visual tone

Healthcare-professional and modern:

-   Light neutral surfaces.
-   Clear typography.
-   Subtle borders.
-   Controlled shadows.
-   Calm accent treatment.
-   Strong spacing hierarchy.

Avoid excessive gradients, neon colors, gamification, cartoon visuals
and overly dark fintech styling.

Exact visual tokens are defined in Specification #8.

# 38. Accessibility

Required: keyboard access, visible focus, semantic labels, accessible
errors, sufficient contrast, status not communicated by color alone,
logical tab order, RTL compatibility and suitable touch targets.

# 39. Responsive strategy

Desktop: full navigation and tables.

Tablet: collapsible sidebar.

Mobile: do not merely shrink desktop. Prioritize Aujourd'hui, Agenda,
Patients and Plus. `Plus` exposes Finance, Équipe, Stock, Communication,
Rapports and Paramètres.

Critical mobile workflows: Aujourd'hui, Agenda, patient lookup,
appointment state changes, clinical notes and public booking.

# 40. FR/AR

French uses LTR; Arabic uses RTL. RTL is built from the beginning, not
added at launch.

User-entered patient data remains Unicode as entered. Generated document
language is independent of current UI language.

# 41. Specialty adaptation

Specialty affects suggested services, clinical forms, treatment
prominence and dashboard actions. It does not create a different
navigation grammar or separate application.

# 42. Frontend privacy

Do not send clinical notes, document content or sensitive health values
to third-party analytics. Use safe event names/IDs.

Frontend never enforces tenant isolation, practitioner governance,
financial integrity or subscription blackout by itself; backend remains
authoritative.

# 43. Claude Code frontend rules

Claude must:

-   Reuse components.
-   Use design-system tokens.
-   Avoid one-off visual patterns.
-   Handle loading, empty, error and success states.
-   Implement FR/AR simultaneously.
-   Test RTL.
-   Implement responsive behavior.
-   Follow Specification #9 wireframes once available.

Claude must not invent a different visual style per module, hardcode
French strings, create random status colors, expose raw API errors or
use frontend-only authorization.

# 44. Frontend Definition of Done

A frontend feature is complete only when it:

-   Matches information architecture.
-   Matches this UX specification.
-   Uses approved design-system components.
-   Handles permissions.
-   Handles loading/empty/error/success.
-   Works in FR.
-   Works in AR/RTL.
-   Works at defined responsive sizes.
-   Has reasonable keyboard accessibility.
-   Includes appropriate automated tests.
-   Does not expose/log sensitive data unnecessarily.

# 45. Highest-priority UX journeys

1.  Onboarding.
2.  Aujourd'hui.
3.  Create patient.
4.  Create appointment.
5.  Agenda.
6.  Arrival/waiting.
7.  Consultation.
8.  Patient 360°.
9.  Treatment/session tracking.
10. Invoice.
11. Payment.
12. Receipt.
13. Caisse.
14. Public booking.
15. WhatsApp/SMS reminders.

# 46. Relationship to other specifications

This specification defines experience and interaction principles. It
does not replace:

-   Spec #2 screen inventory.
-   Spec #3 workflows.
-   Spec #4 domain/data rules.
-   Spec #5 technical/security architecture.
-   Spec #6 implementation sequence.

Frontend implementation must combine all relevant specifications.

# 47. Next specification

**Specification #8 --- Design System & Component Architecture** will
lock typography, Arabic typography, colors, semantic status tokens,
spacing, radius, shadows, layout widths, breakpoints, navigation
dimensions, buttons, forms, combobox/search, date/time, money/phone
inputs, cards, tables, drawers, modals, tabs, badges, alerts, toasts,
empty states, skeletons, pagination, calendar, uploader, charts, icons,
RTL and accessibility rules.

Specification #9 will then define detailed screen
compositions/wireframes using those components.
