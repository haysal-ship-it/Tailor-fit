# Figma New order alignment and Overview tour plan

Status: implemented. Verification and publishing details are recorded in the delivery notes below.
Reference: https://www.figma.com/design/A48UWm2f2jLr05iXak67wZ/Tailorfit?node-id=768-1672
Reviewed node: 768:1672. Session: 12e083e6-aa7e-4d65-bf72-aa6b7f8d0e82.

## Findings

The Figma frame and the live implementation differ in panel hierarchy and control placement. The frame has a closely joined two-column white/grey composition, grouped order fields, a Mannequin heading and metadata above one white pill toolbar, and an icon-bearing Save action. The current editor has standalone template/measurement dropdowns, viewer controls, a visible point list and an order-status field interspersed through the two columns.

The current tour still targets client/template/mannequin/save/reuse and Settings launches New order for the tour. This must change to the requested Overview-only sequence. Back controls currently mix the New order return icon with plain Unicode arrows and alternate ArrowLeft buttons. Overview and Clients also use different action heights, padding, font sizes and icon treatments.

## Design authority

- The linked frame governs New order's desktop composition, panel colours, toolbar structure, copy placement, mannequin framing and Save icon.
- Keep the current Cancel action, positioned before Save.
- Overview governs the shared Add client/New order action styling.
- The New order Back control governs app navigation Back controls.
- Preserve the current main calendar, recent orders, client directory, bottom navigation, Manrope fonts and approved dropdown panels.
- Preserve draft recovery, explicit fitting reuse, ownership checks, validation, uploads, save idempotency and existing-record editing.

## 1. Align New order with Figma

Use the Figma header hierarchy: Back; New Order; Client details, garment and measurements. One connected workspace.

Use an equal two-column desktop composition with the narrow white seam and nested surfaces shown in Figma. The left grey panel contains a white form card: Client Order and Details; paired Client/Garment fields; paired Phone/Email; Style References; Price/Due date; Notes. Keep actual validation and upload states. Generic creation should not acquire extra historical-client selectors or an additional prominent status control. Existing-order status editing remains supported in its appropriate workflow.

The right grey panel must read, in this order:

1. Mannequin heading.
2. Form/point metadata above the toolbar, reflecting actual state.
3. One white pill toolbar: Choose Template; M/F; diagram/list icons; Add Point.
4. The centred production mannequin or measurement list.

Reuse the current RotatableMannequin and matching mannequin artwork, adjusting its framing to the Figma reference (approximately 400 by 459 at the reference desktop size). Maintain its aspect ratio, touch/keyboard interaction, rotation, point labels and measurement data. Hide duplicate internal controls when the new toolbar owns them. Switching diagram/list or gender must not reset measurements. Gender selection and descriptive copy must agree with the rendered form; the Figma sample's highlighted M with feminine artwork is not a state rule to reproduce.

Choose Template and Add Point must reuse the approved shared menu/picker behaviour, including downward placement. A toolbar trigger variant can adapt the trigger's appearance without creating another menu implementation.

Use the exact Figma FloppyDisk asset at its intended 16px slot beside Save. Keep Cancel as the secondary action immediately before it. Keep loading, disabled, error, unsaved-change and keyboard-submit behaviour. Download/reuse verified matching assets at implementation time; never use the whole Figma screenshot as a UI asset.

On small screens, retain the same field state, reflow the toolbar in its original control order, and allow enough rows for comfortable touch targets. Stack the footer actions at full width. Do not squeeze desktop controls until their labels clip.

## 2. Replace the tour with five Overview steps

| Step | Target | Suggested title | Suggested copy |
| --- | --- | --- | --- |
| 1 | Analytics group | Your studio at a glance | See total orders, active orders and recorded outstanding balances. Select a card to view its related orders. |
| 2 | Chart and period selector | Track your studio activity | Change the period to see orders created over time and compare with the previous period. |
| 3 | Pickup calendar | Keep track of pickups | Browse pickup dates and select a marked day to see its scheduled orders. |
| 4 | Add client button | Add a client | Save contact details first. Add their measurements and orders from the client profile when ready. |
| 5 | New order button | Create a new order | Open the connected order workspace to enter garment details, references, measurements, price and due date. |

Add stable targets to Overview for these exact five steps. Replay/resume from Settings or Help must first return safely to Overview and wait for its targets to mount; it must no longer open New order. Never bypass an unsaved-change guard.

Reuse the existing tour foundation, updating targets, progress controls, examples/copy, entry points, tests and stored step validation. Version the tour so old client/template/mannequin step IDs cannot resume against unrelated dashboard targets. Preserve contextual-tip preferences; offer the updated tour once without forcing an overlay on existing users.

Use compact anchored desktop tips and viewport-aware mobile cards. Keep the target visible, clear the mobile dock, support Back/Next/Skip/Finish and restore focus appropriately. Accommodate empty charts/calendars and unknown payment data without inserting demo records. Advancing the guide must not create records, submit forms, open the Add client dialog or navigate into New order automatically.

## 3. Standardize Back navigation

Create one shared BackButton using /icons/order-details/arrow-u-up-left.svg, the current New order icon/text treatment, and consistent gap, colour, alignment and focus treatment. Apply it to Orders-to-Overview, client/profile navigation, order creation/details/editing, mobile Settings and other actual navigation Back controls found in the audit.

Keep each destination and unsaved-change guard intact. Use contextual accessible labels and a fallback destination for direct links. Calendar previous-month arrows, carousel arrows, dropdown chevrons and Undo actions are different controls and should retain their purpose.

## 4. Standardize action buttons from Overview

Extract/reuse shared action and button components rather than importing a screen into another screen. Adopt Overview's Add client primary action and New order outlined action: matching height, Manrope text, Plus icons, radius, padding and gap. Preserve Add client before New order wherever both actions are present. Apply the variants to directory, empty-state and profile actions without changing their intent or adding unnecessary actions. Reflow full width vertically on phones.

Preserve the recent Settings button correction: a primary button must not inherit a secondary white background.

## 5. Establish a spacing scale

Use a shared 4/8/12/16/24/32 scale with named roles, rather than applying identical padding to every container.

| Role | Standard |
| --- | --- |
| Workspace shell | 1216px maximum; 12px phone and 16px tablet gutters; centred desktop alignment |
| Page header | 24px horizontal / 16px vertical desktop; 16px on phones |
| White surface frame | 2px framing seam |
| Grey inset panel | 12px padding where used in the Figma composition |
| White form/content card | 16px internal padding |
| Related controls | 8px gaps |
| Sections | 16px or 24px according to hierarchy |

Apply these roles across Overview, Clients, New order, order details, Settings and supporting forms/sheets. Preserve component-specific geometry such as calendar cells, mannequin aspect ratio, approved dropdowns and touch targets. Unify shared page headers and shells before adjusting individual screens.

## Delivery order and checks

1. Capture the current affected views and the Figma target; map exact assets to existing files.
2. Establish shared Back/action/spacing primitives.
3. Align New order's form, panel and combined mannequin toolbar, retaining Cancel and adding the Save icon.
4. Replace the tour data/targets and entry routing, including stored-preference migration.
5. Apply shared buttons and spacing throughout the workspace.
6. Verify toolbar actions, both measurement views, generic creation versus explicit fitting reuse, draft retention, saves, Back/refresh and tour interruption/resume.
7. Compare New order against the reference and inspect the workspace at 320/360/390/430/768/1024/1440px and 200% zoom. Check keyboard/focus, open mobile keyboard, long labels and dock clearance. Report any unavailable visual verification explicitly.

## Delivery notes

Implemented the grouped New Order form, combined functional mannequin toolbar, diagram/list switching, exact local Figma toolbar/Save icons, retained Cancel, five-step Overview tour, version-2 preference migration, guarded Overview entry from Help/Settings, shared action buttons, Back control and workspace spacing roles. Mobile controls wrap, form sections preserve state and footer actions stack.

Verification: regression checks cover canonical new orders, exact order details, fitting ownership, Settings button fills, analytics, dropdown placement, legacy draft recovery, account safeguards and the updated tour sequence/migration. Production build and HTTP smoke checks are run before publishing.

Browser visual comparison and touch/zoom verification were unavailable in this environment; pixel-perfect and device-level visual approval remain unverified.
