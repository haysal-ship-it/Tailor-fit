# Retire the legacy client intake flow

Status: implemented, with uniform dropdowns and Settings button visibility corrections.

## Finding

The dashboard's intake-resume link is unconditional. It opens LegacyIntakeScreen through the new-measurement screen state with capture=intake. This screen can still create a client, fitting and order through the old combined form. It was retained during migration to preserve drafts and onboarding, but it should not remain a customer-facing creation flow.

Other entry points also depend on this component: Clients Take Measurements, Settings tour replay/resume, accepted new-measurement/edit-measurement URL states and old store navigation helpers. Navbar classifies these states as Overview. Some Clients empty-state copy still refers to taking measurements on Overview. Hiding the dashboard link alone would leave these inconsistencies.

## Approved destination model

| Entry | Destination | Result |
| --- | --- | --- |
| Overview | Analytics, chart, calendar and recent orders | Dashboard only |
| Add client on Overview or Clients | Shared contact form; desktop dialog/mobile sheet | Client profile only |
| New order on Overview or Clients | Approved full-page New order | Saved order details |
| Client profile measurement actions | Existing client-profile mannequin and measurement controls | Client-linked fitting only |
| Analytics or recent order | Filtered order list or exact existing order details | Return to originating context |

Generic New order remains a clean entry. Explicit reuse of a selected fitting can remain a contextual Clients action, but should use the approved order workspace rather than a separate old order form.

## Implementation sequence

1. Remove the Overview resume/capture link and its callback. Overview remains the dashboard at every breakpoint.
2. Route Take Measurements to the selected client's measurement section and existing 3D mannequin. Ensure the first-fitting empty state exposes a working template/point action without leaving the profile. Verify persistence before reporting success.
3. Remove LegacyIntakeScreen from the mounted workspace. Retire its combined intake route and mode flags, and remove obsolete fallback order-entry paths after checking their callers. Keep shared fitting/order save services that are still used.
4. Replace old direct links safely: old generic intake links return to Overview; old client-specific measurement links resolve to that client's measurement section. Preserve ordinary order details, browser Back, refresh and unsaved-change safeguards.
5. Inspect old drafts before migration. Retain recoverable contact, garment, measurement, reference, price, date and note data in the appropriate supported form. Offer recovery only when a real draft exists, inside that form. Do not add a permanent dashboard shortcut, silently replace a newer draft, create records during migration or delete draft data without explicit discard/completed save.
6. Rebind Settings Help and tour steps to the current dashboard, Add client/New order and Clients measurement controls. Tour playback must not reopen the retired page or save records automatically.
7. Correct references to measurement capture on Overview, obsolete navigation helpers, selected navigation states and tests/docs that describe the retired workflow.

## Acceptance checks

- Overview has no Resume client intake or generic measurement-capture link.
- Both Add client buttons open the same form and create only a client.
- Both generic New order buttons open the approved clean order page.
- Measurement capture stays within the selected client and creates no order.
- Explicit fitting reuse does not open an obsolete inline order form.
- Tour replay, old links, Back and refresh cannot revive the retired intake page.
- Draft recovery preserves real data and never overwrites another active draft silently.
- Mobile sheets, full-width stacked actions and bottom navigation continue to work.

## Additional fixes

All choice and action dropdowns in workspace components now share ChoiceMenu, including the older form screens. Menus retain the approved Saved Measurements styling, open below their trigger, use bounded scrolling and respect native dialog layering. Settings primary and secondary button styles no longer combine conflicting backgrounds. Old intake drafts can be explicitly recovered inside New order while the current form is empty; the source draft is removed only after a successful save.
