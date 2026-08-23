# Healthcare Practice Management SaaS

## Specification 08 --- Design System & Component Architecture

**Product:** Moroccan bilingual FR/AR Healthcare Practice Management
SaaS\
**Frontend:** Next.js + React + TypeScript\
**Purpose:** Lock the reusable visual language, component architecture,
responsive rules and interaction primitives before detailed wireframes
and frontend implementation.

# 1. Design system objectives

The design system must make the product feel:

-   Professional
-   Calm
-   Trustworthy
-   Fast
-   Modern
-   Healthcare-appropriate
-   Operational rather than bureaucratic

The system must prevent Claude Code from inventing a new visual language
for each module.

The same primitives must serve Agenda, Patients, Dossier Santé, Finance,
Caisse, Équipe, Inventory, Communication, Settings and SaaS
Administration.

# 2. Design principles

1.  Clarity over decoration.
2.  Consistency over novelty.
3.  Actions over decorative analytics.
4.  Moderate information density.
5.  Strong hierarchy through spacing and typography.
6.  Semantic state must never rely on color alone.
7.  Desktop efficiency with genuine responsive behavior.
8.  FR/LTR and AR/RTL are equal first-class layouts.
9.  Accessibility is part of component design.
10. Reuse primitives before creating one-off components.

# 3. Recommended component foundation

Use a headless/accessible component approach compatible with React and
Next.js.

A utility-first styling system such as Tailwind CSS is appropriate.

A component foundation inspired by shadcn/ui/Radix-style accessible
primitives is appropriate, provided:

-   Components are owned in the repository.
-   Visual tokens come from this specification.
-   Default library styling is adapted to the product.
-   Accessibility behavior is preserved.
-   No uncontrolled proliferation of third-party component libraries
    occurs.

Do not mix several competing UI frameworks.

# 4. Token architecture

All styling must use semantic design tokens.

Conceptual token groups:

``` text
color.*
text.*
surface.*
border.*
status.*
spacing.*
radius.*
shadow.*
font.*
size.*
breakpoint.*
z.*
motion.*
```

Feature components should not contain arbitrary hex values or one-off
spacing values unless justified.

# 5. Color philosophy

Default interface uses light neutral surfaces with one calm primary
accent.

Do not hardcode a final brand color into business components.

Use semantic tokens:

``` text
--color-primary
--color-primary-hover
--color-primary-foreground

--color-background
--color-surface
--color-surface-subtle
--color-surface-raised

--color-text
--color-text-secondary
--color-text-muted
--color-text-inverse

--color-border
--color-border-strong

--color-success
--color-success-subtle

--color-warning
--color-warning-subtle

--color-danger
--color-danger-subtle

--color-info
--color-info-subtle
```

A restrained teal/blue-green or similarly calm healthcare accent is
suitable as an initial brand direction, but the exact brand palette
should remain tokenized and changeable.

# 6. Neutral palette

Use a neutral gray/slate family for:

-   Page background.
-   Surfaces.
-   Borders.
-   Secondary text.
-   Disabled controls.

Avoid pure black for most body text and pure white-on-white visual
flattening.

# 7. Semantic statuses

Statuses use a centralized semantic mapping.

## Success-like

Examples:

-   Appointment completed.
-   Invoice paid.
-   Payment successful.
-   Active subscription.

Use success token + icon + text.

## Warning-like

Examples:

-   To confirm.
-   Partially paid.
-   Stock low.
-   Subscription grace.

## Danger-like

Examples:

-   Overdue.
-   Failed.
-   Expired.
-   Blackout.
-   Stock expired.

## Neutral

Examples:

-   Draft.
-   Upcoming.
-   Inactive.

## Information/active process

Examples:

-   In consultation.
-   Waiting.
-   Processing.

Never define module-local colors such as `appointmentGreen` or
`invoiceOrange`.

# 8. Appointment status mapping

Recommended semantic presentation:

``` text
Requested             Neutral/Info
To confirm            Warning
Confirmed             Info
Arrived                Info
Waiting               Warning/Info
In consultation       Primary/Info
Completed             Success
Rescheduled           Neutral/Info
Cancelled             Neutral/Danger-subtle
No-show               Danger
```

Always display the localized label.

# 9. Financial status mapping

``` text
Draft                  Neutral
Issued                 Info
Partially paid         Warning
Paid                   Success
Overdue                Danger
Cancelled              Neutral/Danger-subtle
```

Installments follow the same semantic grammar.

# 10. Typography

Typography must support Latin and Arabic cleanly.

Recommended strategy:

-   Use a modern sans-serif variable font for Latin.
-   Use a high-quality Arabic sans-serif companion with compatible
    visual weight.
-   Prefer system/web-safe loading strategy with performance in mind.
-   Define fonts through tokens, never per component.

Potential families can be evaluated during implementation, but the
design system should support:

``` text
font-sans-latin
font-sans-arabic
```

Arabic must not appear visually smaller or denser than French at
equivalent hierarchy.

# 11. Type scale

Recommended hierarchy:

``` text
Display / onboarding hero       32–36 px
Page title                      28–32 px
Section title                   20–24 px
Card title                      16–18 px
Body                            14–16 px
Compact table/body              14 px
Secondary/meta                  12–13 px
```

Do not use tiny 10--11 px text for core operational information.

# 12. Font weights

Prefer:

``` text
400 Regular
500 Medium
600 Semibold
700 Bold — sparingly
```

Avoid making entire interfaces bold.

# 13. Line height

Body text should remain comfortable.

Clinical notes and longer content require more generous line height than
dense tables.

# 14. Spacing scale

Use a consistent 4px-based scale:

``` text
1 = 4px
2 = 8px
3 = 12px
4 = 16px
5 = 20px
6 = 24px
8 = 32px
10 = 40px
12 = 48px
16 = 64px
```

Do not invent `17px`, `23px`, etc. throughout components.

# 15. Page spacing

Recommended desktop:

-   Main content horizontal padding: 24--32px.
-   Mobile: 16px.
-   Section separation: 24--32px.
-   Card internal padding: 16--24px depending density.

# 16. Border radius

Use restrained modern radii.

Conceptual:

``` text
sm    6px
md    8px
lg    12px
xl    16px
full  pills/avatars only
```

Do not make every container heavily rounded.

# 17. Borders

Subtle 1px borders should do more work than shadows.

Use stronger border only for:

-   Focus.
-   Selected states.
-   Important separators.

# 18. Shadows

Keep shadows subtle.

Use primarily for:

-   Drawers.
-   Modals.
-   Popovers.
-   Raised dropdowns.

Normal cards should generally rely on surface + border rather than heavy
shadows.

# 19. Motion

Motion should be fast and functional.

Use for:

-   Drawer entry.
-   Modal appearance.
-   Dropdown/popover.
-   Toast.

Avoid decorative page animations.

Respect reduced-motion preferences.

# 20. Layout widths

Use a flexible application layout rather than narrow marketing-site
containers.

Recommended:

-   Full operational canvas inside shell.
-   Sensible max width for forms/settings where excessive width hurts
    readability.
-   Clinical note forms should not stretch text fields across huge
    desktop widths.

# 21. Sidebar

Desktop expanded width: approximately 240--264px.

Collapsed variant may be approximately 64--72px if implemented.

Contains:

-   Brand/practice area.
-   Main navigation.
-   Secondary navigation.
-   User area.

Selected navigation item uses background + icon/text emphasis, not a
loud solid block.

# 22. Top bar

Approximate height: 56--64px.

Contains:

-   Context/page title when needed.
-   Search.
-   Quick-create.
-   Notifications.
-   Language.
-   Profile.

Should remain visually lighter than primary content.

# 23. Responsive breakpoints

Recommended conceptual breakpoints:

``` text
sm   640px
md   768px
lg   1024px
xl   1280px
2xl  1536px
```

Actual Tailwind/default-compatible values are acceptable.

Design behaviors, not just CSS widths, must be specified.

# 24. Mobile navigation

Below desktop/tablet threshold, sidebar becomes drawer/compact
navigation.

Primary mobile destinations should favor:

``` text
Aujourd'hui
Agenda
Patients
Plus
```

Do not put ten icons in a bottom bar.

# 25. Icons

Use one consistent icon library.

Icons must:

-   Have consistent stroke style.
-   Support RTL mirroring where direction-sensitive.
-   Be accompanied by text for important actions.
-   Not replace labels in unfamiliar workflows.

Do not mix icon libraries casually.

# 26. Button component

Variants:

``` text
Primary
Secondary
Outline
Ghost
Danger
Link
```

Sizes:

``` text
sm
md
lg
icon
```

States:

-   Default.
-   Hover.
-   Focus.
-   Active.
-   Disabled.
-   Loading.

Only one dominant primary action per bounded context where possible.

# 27. Destructive buttons

Danger style is reserved for genuinely destructive/sensitive actions.

Do not use red for ordinary cancellation/navigation.

Sensitive destructive action normally requires confirmation dialog.

# 28. Input component

Supports:

-   Label.
-   Required marker.
-   Placeholder.
-   Helper text.
-   Error.
-   Disabled.
-   Read-only.
-   Prefix/suffix.
-   RTL.

Minimum comfortable touch height approximately 40--44px.

# 29. Textarea

Clinical notes require:

-   Comfortable default height.
-   Auto-grow or sensible resize.
-   Character limit only when business rule requires it.
-   Unsaved-work protection where appropriate.

# 30. Select

Use for small fixed option lists.

Do not use select for hundreds of patients/services.

# 31. Combobox

Use searchable combobox for:

-   Patient.
-   Service.
-   Practitioner.
-   Master data.
-   Stock item.

Must support keyboard navigation and empty/create-custom action when
business rules permit.

# 32. Search component

Variants:

-   Global search.
-   Table/list search.
-   Combobox search.

Use debounce where server query is involved.

Do not query on every keystroke without control.

# 33. Date picker

Must support:

-   Localized labels.
-   Keyboard access.
-   Clear selected date.
-   Today shortcut where useful.

Arabic layout must render correctly.

# 34. Time picker

Use predictable 24-hour time format for Morocco unless product testing
dictates otherwise.

Appointment window UI uses separate start/end controls.

# 35. Money input

Dedicated component.

Requirements:

-   MAD suffix/prefix presentation.
-   Decimal-safe string handling.
-   No JS floating-point arithmetic for business totals.
-   Validation.
-   Clear formatted/unformatted states.

# 36. Phone input

Initial Morocco-friendly behavior.

Support:

-   Normalized backend representation.
-   Readable display.
-   Mobile numeric keypad hints.
-   Future international expansion without redesign.

# 37. Checkbox

Use for independent boolean permissions/settings.

Do not use checkbox when a single-choice radio group is semantically
correct.

# 38. Switch

Use for immediate binary configuration such as:

-   Automation enabled.
-   Service active.

Avoid switches for actions that require Save unless clearly
communicated.

# 39. Radio group

Use for mutually exclusive small choices:

``` text
Heure fixe
Plage horaire
```

# 40. Form section

Reusable structure:

``` text
Section title
Optional description
Fields
```

Supports vertical grouping and responsive columns.

# 41. Form actions

Long forms should have consistent footer/action area.

Primary:

`Enregistrer`

Secondary:

`Annuler`

Clinical active consultation may use sticky actions:

`Enregistrer brouillon` / `Terminer consultation`.

# 42. Card

Variants:

``` text
Standard
Metric
Action
Alert
Compact
```

Do not wrap every page section in a card.

Cards must represent meaningful grouping.

# 43. Metric card

Contains:

-   Label.
-   Value.
-   Optional contextual delta.
-   Optional action.

Avoid giant decorative icons.

# 44. Table

Reusable data table supports:

-   Headers.
-   Sorting where relevant.
-   Pagination.
-   Loading.
-   Empty state.
-   Row actions.
-   Selection only when genuinely needed.
-   Responsive fallback.

Avoid dense spreadsheet styling.

# 45. Mobile table behavior

Choose per dataset:

-   Horizontal scroll for genuinely tabular finance.
-   Stacked cards for patient/team lists.
-   Reduced columns for agenda-like lists.

Do not blindly horizontal-scroll every table.

# 46. Status badge

Single reusable component:

``` text
<StatusBadge domain="invoice" status="paid" />
```

or equivalent semantic API.

Central mapping controls icon/color/label.

Do not style badges manually in feature modules.

# 47. Avatar

Used for practitioners/staff and optionally patient initials.

Do not require photos.

Fallback to initials.

# 48. Tabs

Use for:

-   Patient 360°.
-   Finance.
-   Employee profile.
-   Settings subsections where appropriate.

Tabs should remain scrollable on mobile.

Do not create more tabs than users can understand.

# 49. Drawer

Primary contextual surface.

Desktop:

-   Right side.
-   Approximately 400--520px depending content.

Mobile:

-   Full-screen or near-full-screen sheet.

Use for quick appointment/invoice/patient inspection.

# 50. Modal

Sizes:

``` text
sm
md
lg
```

Use for bounded actions.

Do not use modal for complex multi-step clinical forms.

# 51. Confirmation dialog

Contains:

-   Clear action title.
-   Consequence explanation.
-   Optional reason field.
-   Cancel.
-   Explicit confirmation.

For high-risk financial actions, confirmation text must name the
object/amount where helpful.

# 52. Popover

Use for:

-   Date picker.
-   Compact filters.
-   Action menus.
-   Small contextual selectors.

Do not hide complex forms inside popovers.

# 53. Dropdown menu

Use for secondary actions.

Example:

``` text
Modifier
Reporter
Annuler
```

Primary next action should not be hidden in a dropdown.

# 54. Toast

Variants:

``` text
Success
Info
Warning
Error
```

Use for transient acknowledgement.

Critical failure requiring user action should also appear inline or in
persistent alert.

# 55. Alert/banner

Use for:

-   Subscription warning.
-   Provider outage.
-   Important patient flag where clinically appropriate.
-   Form-wide error.

Variants correspond to semantic status tokens.

# 56. Empty state

Reusable component includes:

-   Short title.
-   Explanation.
-   One primary next action.
-   Optional secondary action.

Illustration is optional and should remain restrained.

# 57. Skeleton

Use shape-matched skeletons for:

-   Cards.
-   Tables.
-   Patient header.
-   Agenda.

Avoid generic centered spinner for normal page loads.

# 58. Pagination

Default 25 records.

Options:

``` text
25
50
100
```

Use compact pagination.

Do not offer unbounded "show all".

# 59. Filter bar

Reusable structure:

-   Search.
-   Primary persistent filters.
-   `Filtres` button for secondary filters.
-   Active filter chips.
-   Clear all.

# 60. Calendar component

Calendar must support:

-   Day.
-   Week.
-   Practitioner filter.
-   Exact appointments.
-   Arrival windows.
-   Status display.
-   Click to open drawer.
-   Click empty slot to create.
-   Responsive alternative.

Do not implement month view as a core V1 requirement unless needed for
summary.

# 61. Appointment card

Reusable calendar/list component showing:

-   Time/window.
-   Patient.
-   Service.
-   Status.
-   Optional practitioner.
-   Optional payment marker.

Must work in dense calendar and list contexts.

# 62. Patient header component

Reusable Patient 360° context header.

Contains identity, patient number, contact, responsible practitioner,
next RDV, balance and contextual actions.

On mobile, collapse secondary metadata.

# 63. Clinical timeline component

Chronological component supporting:

-   Encounter.
-   Document.
-   Prescription.
-   Clinical update.

Must clearly separate date, author and content.

# 64. Health flag component

Used for allergies/important persistent information.

Should be visible but not visually alarming unless severity requires it.

# 65. Session progress component

For kiné/treatment plans.

Supports:

-   Total.
-   Completed.
-   Scheduled.
-   Remaining.
-   Individual session status.

Responsive grid/list behavior.

# 66. Invoice summary component

Reusable:

``` text
Total
Paid
Remaining
Status
```

Used on invoice detail and payment modal.

# 67. Payment modal component

Optimized for rapid reception use.

Contains:

-   Patient/invoice context.
-   Remaining.
-   Amount.
-   Method.
-   Primary confirm.

Must prevent duplicate submission while pending.

# 68. Receipt success component

After payment:

-   Success confirmation.
-   Amount.
-   Remaining.
-   Print.
-   Download.
-   Communication action.

# 69. Caisse summary component

Contains:

-   Opening.
-   IN.
-   OUT.
-   Expected.
-   Status.

Must distinguish calculated balance from physical count.

# 70. Stock level component

Shows current quantity, minimum threshold and status.

Use semantic warning when low.

# 71. File uploader

Supports:

-   Click/select.
-   Drag/drop desktop.
-   Mobile file picker.
-   Upload progress.
-   File validation.
-   Error.
-   Remove before submit.

Never show permanent storage URLs.

# 72. Document item

Shows:

-   Type.
-   Title.
-   Date.
-   Author/practitioner.
-   File format.
-   View/download.

# 73. Notification item

Contains:

-   Type/icon.
-   Short message.
-   Time.
-   Read/unread.
-   Optional deep link.

Notification center should not become a second task-management system.

# 74. Charts

Use charts sparingly.

Allowed initial types:

-   Line.
-   Bar.
-   Donut only when composition is genuinely useful.

Charts must have accessible labels/tooltips and textual values.

Do not use 3D charts or decorative gauges.

# 75. Chart color rules

Charts use semantic/data-series tokens.

Do not reuse danger red simply because it is visually distinct unless
data is actually negative/dangerous.

# 76. Sidebar component architecture

Recommended components:

``` text
AppSidebar
SidebarHeader
SidebarNavGroup
SidebarNavItem
SidebarFooter
```

Navigation items come from centralized configuration filtered by
permission/entitlement/specialty context.

Do not hardcode sidebar separately for every role.

# 77. Topbar component architecture

``` text
AppTopbar
GlobalSearch
QuickCreate
NotificationMenu
LanguageSwitcher
UserMenu
```

# 78. Page header

Reusable:

``` text
PageHeader
- title
- description optional
- breadcrumbs optional
- primary action
- secondary actions
```

Do not use breadcrumbs where sidebar + title already provides enough
orientation.

# 79. Localization component rules

All user-facing strings come from translation keys.

Do not concatenate translated fragments when grammar may differ between
French and Arabic.

Prefer parameterized translations.

# 80. RTL rules

RTL must affect:

-   Sidebar side/alignment.
-   Drawer direction.
-   Breadcrumb direction.
-   Form alignment.
-   Table alignment where semantic.
-   Directional icons.
-   Calendar controls.
-   Pagination arrows.

Numbers, phone values and codes may retain appropriate LTR segments
inside RTL layout.

# 81. Accessibility component contract

Every reusable component must support:

-   Keyboard interaction.
-   Visible focus.
-   ARIA semantics where needed.
-   Label association.
-   Error association.
-   Disabled state.
-   Screen-reader understandable status.

Do not remove accessible behavior from underlying headless primitives
for visual convenience.

# 82. Focus management

Modal/drawer:

-   Focus trapped while open.
-   Initial focus deliberate.
-   Escape closes when safe.
-   Focus returns to trigger.

Sensitive in-progress operations may disable close appropriately.

# 83. Touch targets

Interactive controls should generally provide at least approximately
40--44px usable touch area on mobile.

Tiny table action icons must not become unusable touch targets.

# 84. Z-index layers

Centralize:

``` text
base
sticky
dropdown
popover
drawer
modal
toast
```

Do not introduce arbitrary `z-index: 999999`.

# 85. Component folder architecture

Recommended conceptual frontend structure:

``` text
src/
  components/
    ui/
      button
      input
      select
      combobox
      modal
      drawer
      table
      badge
      ...

    app/
      app-sidebar
      app-topbar
      page-header
      global-search

    domain/
      appointments/
      patients/
      clinical/
      finance/
      caisse/
      team/
      inventory/

  features/
    ...

  design-system/
    tokens
    status-maps

  i18n/
```

`ui/` contains generic primitives.

`domain/` contains reusable domain-aware components.

Feature pages compose them.

# 86. Component ownership rule

Before creating a new component, Claude must ask:

1.  Is there already a generic UI primitive?
2.  Is there already a domain component?
3.  Can an existing component accept a variant?
4.  Is the new component genuinely reusable?

Do not create `BlueButton`, `PatientButton`, `InvoiceButton` etc.

# 87. Variant discipline

Use typed variants.

Example:

``` text
Button variant="primary|secondary|outline|ghost|danger"
StatusBadge domain=... status=...
Card variant="standard|metric|alert|compact"
```

Avoid boolean-prop explosions.

# 88. Storybook/component preview

A component preview environment such as Storybook is useful but not
mandatory for initial bootstrap.

If introduced, it should document core reusable components and RTL
states.

Do not let Storybook delay core implementation.

# 89. Testing reusable components

Test:

-   Keyboard behavior.
-   Loading/disabled state.
-   Error rendering.
-   RTL where direction-sensitive.
-   Critical variants.

Visual regression testing may be added as frontend maturity grows.

# 90. Dark mode

Dark mode is **not a V1 requirement**.

Do not spend implementation time creating a full dark theme unless scope
changes.

Tokens should nevertheless avoid architectural choices that make future
theming impossible.

# 91. Branding customization

V1 practice customization includes logo and generated-document identity.

Do not allow arbitrary tenant UI color theming in V1 unless later
approved; it can damage consistency/accessibility.

# 92. Status centralization

Create a single status registry or equivalent design-system mapping.

It should map domain statuses to:

-   Translation key.
-   Semantic tone.
-   Icon.

Feature code should pass domain/status rather than manually choose
colors.

# 93. Error centralization

Map stable API error codes to user-friendly localized presentation where
appropriate.

Examples:

``` text
APPOINTMENT_CONFLICT
PERMISSION_DENIED
SUBSCRIPTION_BLACKOUT
PAYMENT_EXCEEDS_BALANCE
CAISSE_CLOSED
STORAGE_LIMIT_REACHED
```

Do not display raw backend exception strings.

# 94. Design-system Definition of Done

A reusable component is complete when:

-   Uses tokens.
-   Works FR/LTR.
-   Works AR/RTL where relevant.
-   Keyboard accessible.
-   Has focus state.
-   Has disabled/loading/error states where relevant.
-   Responsive.
-   Typed API.
-   No business authorization hidden inside generic component.
-   Tested appropriately.
-   Documented enough for reuse.

# 95. Claude Code frontend guardrails

Claude must never:

-   Add arbitrary hex colors in feature components.
-   Add arbitrary spacing values when token exists.
-   Create new button styles per feature.
-   Mix icon libraries.
-   Hardcode translations.
-   Implement frontend-only permission security.
-   Build giant page-specific components when composition is
    appropriate.
-   Duplicate status maps.
-   Use modal for every workflow.
-   introduce dark mode, animations or decorative dashboards outside
    scope.

Claude must always:

-   Search existing components first.
-   Reuse design tokens.
-   Test FR/AR.
-   Test responsive behavior.
-   Include empty/loading/error states.
-   Keep critical actions clear.
-   Preserve accessibility behavior.

# 96. Relationship to Specification #9

Specification #9 will use this component vocabulary to define detailed
screen wireframes.

Example:

``` text
Aujourd'hui
= AppShell
+ PageHeader
+ MetricCards
+ AppointmentList
+ ActionAlertList
+ CaisseSummary
```

Wireframes should refer to approved components instead of inventing new
visual patterns.

# 97. Baseline component inventory

Minimum reusable component inventory before V1 completion:

``` text
AppShell
AppSidebar
AppTopbar
PageHeader

Button
IconButton
Input
Textarea
Select
Combobox
SearchInput
MoneyInput
PhoneInput
DatePicker
TimePicker
Checkbox
Switch
RadioGroup

Card
MetricCard
Alert
StatusBadge
Avatar

Table
FilterBar
Pagination

Tabs
Drawer
Modal
ConfirmDialog
Popover
DropdownMenu
Tooltip
Toast

EmptyState
Skeleton
ErrorState

Calendar
AppointmentCard
AppointmentDrawer

PatientHeader
ClinicalTimeline
HealthFlag
SessionProgress

InvoiceSummary
PaymentModal
ReceiptSuccess
CaisseSummary

FileUploader
DocumentItem

StockLevel
NotificationItem

ChartContainer
```

# 98. Final design-system rule

If two screens perform the same type of interaction, they should
normally look and behave the same.

The design system exists to make the application feel like one coherent
product rather than a collection of independently generated modules.
