# Healthcare Practice Management SaaS

## Specification 10 --- Visual Identity & Graphic Charter

**Product:** Moroccan bilingual FR/AR Healthcare Practice Management
SaaS\
**Purpose:** Freeze the visual identity applied through the design
tokens established in Specification #8.

# 1. Brand positioning

The identity communicates medical professionalism, trust, calm,
precision, modern SaaS quality, accessibility and operational
efficiency. It must suit private dentists, physicians, psychologists,
kinés, nutritionists and dermatologists without resembling a hospital
ERP, government portal or accounting application.

Brand personality: **Calm · Professional · Clear · Human · Reliable ·
Modern · Precise**.

Avoid flashy, gamified, luxury-fashion, fintech-dark, cartoon-medical
and institutional-hospital aesthetics.

# 2. Core visual direction

The primary family is **deep healthcare teal**. It combines medical
cleanliness, trust, calm and modern digital-product character while
differentiating the product from generic hospital-blue software.

Semantic states retain independent colors.

# 3. Primary palette

  Token         HEX         Use
  ------------- ----------- ----------------------------------
  Primary 900   `#134E4A`   Rare deep brand emphasis
  Primary 800   `#115E59`   Primary hover/strong interaction
  Primary 700   `#0F766E`   Main brand and primary action
  Primary 600   `#0D9488`   Supporting primary/data series
  Primary 100   `#CCFBF1`   Selected/supporting soft surface
  Primary 50    `#F0FDFA`   Very soft brand surface

Primary buttons use `#0F766E` with white foreground and `#115E59` hover.

# 4. Neutral palette

  Role                     HEX
  ------------------------ -----------
  Application background   `#F8FAFC`
  Main surface             `#FFFFFF`
  Secondary surface        `#F1F5F9`
  Border                   `#E2E8F0`
  Strong border            `#CBD5E1`
  Primary text             `#0F172A`
  Secondary text           `#475569`
  Muted text               `#64748B`
  Disabled/subtle text     `#94A3B8`

Use semantic roles rather than arbitrary gray values.

# 5. Semantic colors

## Success

Primary `#15803D` · Soft `#F0FDF4` · Support `#BBF7D0`

Use for paid, completed, successful payment and genuine success states.

## Warning

Primary `#B45309` · Soft `#FFFBEB` · Support `#FDE68A`

Use for to-confirm, partially paid, low stock and subscription grace.

## Danger

Primary `#B91C1C` · Soft `#FEF2F2` · Support `#FECACA`

Use for overdue, failed, no-show, expired, blackout and destructive
confirmation.

## Information

Primary `#1D4ED8` · Soft `#EFF6FF` · Support `#BFDBFE`

Use for confirmed/informational operational states.

Brand teal must not replace semantic meaning.

# 6. Status mapping

Every status uses **icon + localized text + semantic tone**, never color
alone.

Appointment: - Requested → Info/Neutral - To confirm → Warning -
Confirmed → Info - Arrived → Info - Waiting → Warning - In consultation
→ Primary teal - Completed → Success - Rescheduled → Info/Neutral -
Cancelled → Neutral with restrained danger - No-show → Danger

Invoice: - Draft → Neutral - Issued → Info - Partially paid → Warning -
Paid → Success - Overdue → Danger - Cancelled → Neutral/Danger-subtle

Subscription: - Trial → Info - Active → Success - Expired → Danger -
Grace → Warning - Blackout → Danger - Cancelled → Neutral

# 7. Latin/French typography

Preferred typeface: **Inter**.

Fallback:

`Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`

Use variable/web-font strategy when appropriate. Inter is selected for
readability, numerical clarity, compact operational tables and mature
SaaS usability.

# 8. Arabic typography

Preferred typeface: **Noto Sans Arabic**.

Fallback:

`"Noto Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif`

Arabic is first-class. Use appropriate line height and weight, correct
RTL, no forced letter spacing, and test mixed Arabic/Latin values, phone
numbers and MAD amounts.

# 9. Type hierarchy

-   Onboarding/hero: 32--36px / 600--700
-   Page title: 28--32px / 600
-   Section title: 20--24px / 600
-   Card title: 16--18px / 600
-   Body: 14--16px / 400
-   Control label: 14px / 500
-   Table body: 14px / 400
-   Secondary/meta: 12--13px / 400--500

Avoid 10--11px operational text. Use tabular numerals for financial
values where supported.

# 10. SaaS logo principles

The future SaaS logo should have full-color, dark monochrome,
reversed-white and compact-mark variants. It must remain legible at
small sizes.

The final logo is **not** to be invented by Claude during
implementation. Until brand naming/logo is approved, use a clearly
temporary neutral wordmark/mark. Do not automatically adopt a generic
medical cross.

# 11. SaaS versus cabinet branding

The internal application always uses the SaaS identity.

A tenant may customize: - Cabinet logo - Cabinet/practitioner name -
Contact information - Generated-document header/footer - Public-booking
identity

A tenant may not in V1: - Recolor the SaaS application - Replace
semantic colors - Change application typography - Inject custom CSS -
Restyle buttons/sidebar

This protects consistency and accessibility.

# 12. Public booking branding

Hierarchy: 1. Cabinet logo 2. Cabinet/practitioner name 3. Specialty 4.
Booking form 5. Subtle SaaS attribution where commercially appropriate

Use white/light surfaces, strong whitespace and teal primary action.
Cabinet branding does not recolor the interface.

# 13. Generated documents

Invoices, receipts, prescriptions, certificates and reports should be
clean, printable, low-ink and professional, with good grayscale
legibility.

Use brand accent sparingly in header lines/section headings. Cabinet
identity has priority on patient-facing documents. Avoid large colored
backgrounds.

# 14. Surface hierarchy

-   App background: `#F8FAFC`
-   Primary surface: `#FFFFFF`
-   Secondary surface: `#F1F5F9`
-   Selected soft surface: Primary 50

Avoid unnecessary nested cards.

# 15. Borders, radii and shadows

Default border: `1px #E2E8F0`\
Strong border: `1px #CBD5E1`

Radii: - Small 6px - Medium 8px - Large 12px - XL 16px - Pill only for
badges/avatars

Buttons/inputs generally 8px; cards generally 12px.

Prefer borders over shadows. Use subtle elevation for popovers and
clearer restrained elevation for drawers/modals. Avoid large
marketing-style shadows.

# 16. Buttons

Primary: teal `#0F766E`, white text, hover `#115E59`.\
Secondary: neutral/subtle surface.\
Outline: white/transparent + border.\
Ghost: no permanent surface.\
Danger: danger semantic style.

Never use teal for destructive confirmation merely because teal is the
brand color.

# 17. Inputs

White surface, strong-neutral border, dark text, muted placeholder.
Focus uses a clearly visible primary ring/border. Error uses danger
border plus textual explanation; never border alone.

# 18. Cards

Standard: - Background `#FFFFFF` - Border `#E2E8F0` - Radius 12px -
No/subtle shadow - Padding 16--24px

Metric cards emphasize values through typography, not giant colored
blocks/icons.

# 19. Sidebar and top bar

Sidebar: white/very-light surface, subtle separator, slate text.
Selected item uses Primary 50 background with Primary 700 text/icon and
optional small indicator.

Do **not** use a fully teal sidebar by default.

Top bar remains white/light with subtle bottom border and visually
recedes behind content.

# 20. Tables

Use white surfaces, subtle header background where useful, readable
headers, soft row separators and restrained hover state. Avoid dense
spreadsheet aesthetics and unnecessary zebra striping.

Status is communicated through the shared StatusBadge system.

# 21. Clinical surfaces

Clinical screens use more whitespace and chronological/section-based
presentation than finance/admin screens. Use subtle teal highlights and
limited dense tables. Do not render every medical fact as a danger
alert.

# 22. Finance and caisse

Finance remains neutral and operational. Do not color all revenue green
or all expenses red. Use semantic colors for actual status only.

Caisse expected balance is prominent but neutral. Discrepancy uses
warning/danger according to policy.

# 23. Inventory

Low stock → Warning.\
Expired → Danger.\
Normal → Neutral or restrained success where useful.

Do not make every healthy stock row green.

# 24. Charts

Base series: - Primary teal `#0F766E` - Blue `#2563EB` - Slate
`#64748B` - Supporting teal `#0D9488` - Optional purple `#7C3AED`

Semantic red/amber/green are reserved for semantic meaning. Avoid
rainbow charts, 3D charts and decorative gauges. Use soft grid lines and
accessible labels/tooltips.

# 25. Iconography

Approved icon family: **Lucide React**, already selected during
TASK-003.

Use consistent stroke style and sizing. Directional icons mirror in RTL.
Important actions retain text labels. Do not mix icon libraries.

# 26. Illustration and photography

Illustrations are optional and restrained, suitable mainly for
onboarding/empty/marketing surfaces.

Avoid cartoon doctors/patients, excessive medical clip art and
decorative anatomy imagery.

No stock medical photography is required inside the operational
application.

# 27. Interaction states

Focus: visible primary-toned focus ring with adequate contrast.\
Disabled: reduced but readable contrast with semantic disabled
behavior.\
Hover: subtle surface/border changes; no scale/bounce animations.\
Loading: neutral skeletons; action buttons preserve dimensions and
prevent duplicate submission.

# 28. Empty states

Use neutral/primary-soft icon, dark heading, secondary explanation and
one clear primary action. Avoid oversized colorful illustrations.

# 29. Alerts

-   Info → blue-soft
-   Success → green-soft
-   Warning → amber-soft
-   Danger → red-soft

Subscription warnings are amber before blackout and danger during
blackout.

# 30. Modal and drawer styling

White surface with controlled dark-neutral overlay. Separate
header/body/footer using spacing or subtle borders.

Dangerous-action modals should concentrate red in the warning
icon/text/action rather than use a full red background.

# 31. Onboarding

Onboarding may use Primary 50/100 more generously than operational
screens. Progress uses teal. Keep one decision per step and avoid full
application navigation during onboarding.

# 32. SaaS Admin

Use the same visual system in a distinct platform-admin shell. Do not
create a dark developer/admin theme.

# 33. FR/AR visual parity

Arabic receives equal design QA. Test heading lengths, buttons, tables,
sidebar, mixed phone/numeric content, MAD values and directional icons.

Do not design in French first and merely translate at the end.

# 34. Numerals and currency

Default: `1 500 MAD`.

Keep amount and currency together where practical. Test bidirectional
rendering in Arabic UI.

# 35. Accessibility

Production color combinations must satisfy appropriate WCAG contrast
targets. Pay special attention to muted text, status badges, primary
buttons, warning text and disabled controls.

Accessibility takes priority if an exact token fails contrast.

# 36. Prohibited visual patterns

Do not use: - Neon gradients - Glassmorphism-heavy UI - Excessive blur -
3D charts - Giant gradient operational cards - Rainbow statuses -
Full-color tenant-custom sidebars - Excessive pill controls - Emoji
navigation - Cartoon medical characters - Dark mode in V1 - Tenant
custom CSS - Arbitrary feature-level HEX colors

# 37. Approved token mapping

``` text
primary             #0F766E
primary-hover       #115E59
primary-strong      #134E4A
primary-support     #0D9488
primary-soft        #F0FDFA

background          #F8FAFC
surface             #FFFFFF
surface-subtle      #F1F5F9

text                #0F172A
text-secondary      #475569
text-muted          #64748B
text-disabled       #94A3B8

border              #E2E8F0
border-strong       #CBD5E1

success             #15803D
success-soft        #F0FDF4
warning             #B45309
warning-soft        #FFFBEB
danger              #B91C1C
danger-soft         #FEF2F2
info                #1D4ED8
info-soft           #EFF6FF
```

Feature components must use semantic tokens, not own brand colors.

# 38. TASK-003 visual follow-up

TASK-003 remains technically complete. Before visually approving the
frontend foundation:

1.  Add this specification to the repository.
2.  Map TASK-003 tokens to this charter.
3.  Ensure foundational components use semantic tokens.
4.  Do not redesign component architecture.
5.  Run tests, typecheck, lint and production build.
6.  Perform rendered visual review in Desktop FR, Desktop AR/RTL, Mobile
    FR and Mobile AR/RTL.
7.  Review shell, sidebar, topbar, Button, Input, Card, StatusBadge,
    EmptyState, Skeleton, auth/onboarding/public/admin placeholders.
8.  Correct inconsistencies.
9.  Commit as a dedicated graphic-charter alignment task.

# 39. Relationship to frontend specifications

-   Spec #7 defines UX behavior and product feel.
-   Spec #8 defines design-system architecture and components.
-   Spec #9 defines screen composition/wireframes.
-   **Spec #10 defines the approved visual identity applied through Spec
    #8 tokens.**

# 40. Final visual baseline

> **Light, calm healthcare SaaS with deep teal branding, slate neutrals,
> restrained semantic colors, Inter for Latin, Noto Sans Arabic for
> Arabic, subtle borders, modest radii, minimal shadows and high
> operational clarity.**

The interface must look credible in a modern private medical practice
today and remain visually durable as the SaaS expands.
