# Tailorfit main workspace integration plan

Status: implemented locally, with browser visual review pending. Updated 18 November 2026.

## Design authority

1. The latest user corrections take precedence.
2. Preserve the main application's calendar, recent-order cards, client directory and mobile bottom dock.
3. Adopt the approved review's Overview composition, analytics/chart, fresh New Order layout and Settings structure.
4. Use the main app's local Manrope, semantic colours, spacing, controls and existing account/data contracts throughout. Do not port the review toolbar, device frame, fictional records or simulated account actions.

## Screen-by-screen scope

| Surface | Retain from main application | Integrate from approved review / correction |
| --- | --- | --- |
| Overview | Pickup calendar, recent-order card design, real store data | Welcome header, three analytics, trend chart, white panels in grey content area |
| Overview actions | Main Clients action hierarchy and styling | Add client first, New order second; stack full width on narrow screens |
| Clients | Directory, search, client/profile layout and existing workflows | Shared action ordering and the new order entry point; no preview directory redesign |
| New Order | Persistence, draft recovery, upload handling, mannequin and save guarantees | Approved two-column form, clean state and dedicated full-page workflow |
| Existing order | OrderWorkspace and its existing detail actions | Navigate here directly from every order row/card; remove preview detail modals |
| Settings | Existing unit/currency/template, backup, auth and onboarding capabilities | Profile/security, Studio, Measurements/templates, Data/privacy and Help layout |
| Mobile navigation | Existing bottom dock and its current responsive breakpoint | Correct active states, safe-area spacing and links to the new routes |

## Overview

- Keep the approved white welcome header over the grey content container.
- Place three white analytics cards above one white trend-chart card on the left.
- Reuse the actual renderCalendarCard and renderRecentOrdersCard implementations from OverviewScreen, extracting them into reusable components without redesigning them.
- Preserve the main calendar's month navigation, selection appearance, order status markers and interactions. Do not replace it with the prototype calendar.
- Preserve the main recent-order row styling, avatars, labels, spacing and empty state. Change its navigation target only.
- Use real order records and the account's display name. Support initial loading, errors, empty/new accounts and partial data.
- Metrics: Total orders, Active orders and Outstanding balance. Use shared status definitions. Unknown paid amounts/currencies stay visibly unknown; do not treat them as zero, invent financial history or add different currencies together.
- Chart: orders created by date, with the approved period selector and line/area treatment. Comparisons must be calculated from a corresponding real prior interval; never copy review fixtures or hard-coded growth.

## Actions and order navigation

Use the same action group on Overview and Clients: **Add client → New order**. Match the main Clients button styling and emphasis rather than copying the prototype's reversed hierarchy.

- Add client opens the existing contact-only form. Save creates only the client and opens their profile.
- New order opens the approved form as a full page from either Overview or Clients, without carrying over a previously selected client's fields or measurements.
- Analytics opens an order-list page; apply a meaningful all/active/outstanding filter corresponding to the selected metric.
- Every order item in that list opens the existing OrderWorkspace with the precise order ID and its client ID.
- Every recent-order row on Overview uses that same destination directly. It must not open a client overview or order-summary dialog first.
- Interpret the user's repeated request for the existing order-details page as authoritative. Overview remains a return destination when the order was opened there.
- Back returns to the originating Overview, filtered order list or client profile and restores the relevant filter/search/scroll context. Refresh and browser Back must also work; missing/deleted orders receive an explanatory state.

### Existing wiring to address

- Workspace.tsx already routes saved order IDs through handleEditOrder and the order/client query parameters.
- OverviewScreen currently accepts onOpenOrder but does not use it in its function arguments; recent-order rows call onOpenClient instead. Wire the actual order callback for both pointer and keyboard activation.
- OrdersScreen exists but is not mounted in the current Workspace screen switch. Integrate a main-app-consistent order listing rather than leaving the prototype's isolated page as the only implementation.
- Current order return handling assumes client history. Extend its origin handling so dashboard and filtered-list entry points return correctly.
- New measurement currently navigates into Overview. Extract its capture workflow before Overview becomes a dashboard, and preserve draft migration and tour entry points.

## New Order

- Integrate the approved Figma-derived details/mannequin composition into the existing production creation workflow, not a second independent save implementation.
- A fresh creation session starts with empty client name, contact, garment, notes, date, reference images and measurements. Price is unset with a zero-value placeholder.
- Remove previous-client selectors and implicit selected-profile prefilling from the generic New order entry point.
- Preserve actual validation, server saves, account gating, request IDs/idempotency, busy states and failures. Failed saves retain entered data.
- Keep measurement-only capture distinct from order creation. Existing order details/editing must continue using their current record IDs and saved fitting.
- Review existing identity matching rules before connecting typed client information; a new order must not silently overwrite another client's contact or fitting data.
- Preserve draft warnings and recovery. Legacy overview-intake drafts and old navigation targets need an explicit migration/redirect rather than deletion.

## Settings

Replace the current Settings layout with the approved grouped design. Desktop uses section navigation; mobile uses a section index and full-width detail pages with Back. Forms remain pages; supporting dialogs become responsive sheets.

- Profile/security: use the actual profile and auth services for display name, verified email change, password reset/change and sign-out.
- Studio: persist business identity and regional preferences, connecting invoice identity where supported. Default changes must not alter historical order currencies or saved units.
- Measurements/templates: retain working production unit, currency, template and catalog behaviours under the new grouping.
- Data/privacy: expose actual export and validated restore with record counts, explicit merge/replace semantics and recovery behaviour. Explain image/file coverage.
- Help: reuse contextual tips and make tour replay/resume navigate to the correct updated workflow.
- Account deletion: implement a protected server operation with recent authentication, explicit scope/confirmation, optional export, owned-file cleanup and session/local-cache cleanup. Never port the prototype's simulated deletion or claim success when data remains.
- Each form section has Save/Cancel, retained edits on error, busy feedback and a clear saved state. Independent switches may save immediately with feedback.
- Do not add nonfunctional subscriptions, notification channels, integrations or unsupported security controls as decorative settings.

## Mobile behaviour

- Preserve Navbar's existing bottom dock for the app's current mobile/tablet breakpoint (<1024px). Do not bring over the preview's top navigation capsule on mobile.
- Add enough bottom padding and safe-area clearance so the dock never covers the last record, a Save button or an error message.
- Below 640px, action pairs stack vertically and each button fills the parent width. Add client remains above New order. Apply the same pattern to relevant Save/Cancel and dialog action groups.
- On wider screens, actions can remain horizontal while they fit; reflow without clipping or horizontal page overflow.
- Stack analytics and chart without squeezing financial amounts. Move the preserved calendar/recent-order stack below the analytics when necessary.
- Adapt the new order's details and measurements for small screens without losing field values on view changes.

### Responsive dialog standard

- Desktop: centred dialogs remain.
- Mobile/tablet layout: blocking workspace dialogs present as bottom sheets. Phone sheets fill the width; wider small-screen sheets may have a constrained width, anchored to the bottom.
- Reuse a shared dialog/sheet foundation; do not mount separate desktop/mobile forms that reset state when resizing.
- Cover add/edit client, client switching, garment templates/catalog, measurement-point entry, status/invoice actions, deletion confirmations and account-related workspace dialogs.
- Migrate legacy hand-built dialog wrappers as well as ModalDialog and ConfirmDialog consumers. Changing the shared component alone will not cover every current overlay.
- Keep focus trapping/return, semantic titles, Escape/close controls, background scroll lock, draft protection and busy-state dismissal prevention.
- Use a scrollable body with keyboard-aware height, a reachable close button and safe-area-aware actions. Sheets overlay the bottom dock rather than leaving navigation interactive beneath them.
- Dropdowns, non-modal menus and operating-system file/date pickers retain their appropriate native patterns; they are not order-details dialogs.

## Delivery order

1. Capture main-app component baselines and lock what is being preserved.
2. Implement route/origin handling and the shared responsive dialog/sheet foundation.
3. Extract measurement/intake and the existing calendar/recent cards; integrate the new creation page while preserving the client directory.
4. Replace Overview's intake-led layout with real analytics and wire all order links.
5. Integrate Settings and its real backend/account/data actions.
6. Verify mobile layouts, Back/refresh/draft behaviour, then compare rendered screens against the approved design and preserved main-app baselines.

## Acceptance checks

- Main calendar, recent-order cards, client directory and bottom navigation retain their current design.
- Add client precedes New order in both entry locations; phone action pairs are vertically stacked and full width.
- Both New order entry points start clean, while editing existing orders loads the correct records.
- Analytics → filtered orders → exact order details works without a summary modal. Overview recent order → exact order details works directly.
- Back/refresh, scroll restoration, deleted records and unsaved drafts behave predictably.
- Every blocking workspace dialog is a usable bottom sheet in the mobile layout; native pickers and non-modal menus remain appropriate.
- Account/settings actions actually persist, enforce ownership and report failures. No simulated preview operations ship.
- Real-data analytics handle mixed/unknown currencies, absent payments, status boundaries and empty history correctly.
- Test widths 320, 360, 390, 430, 768, 1024 and 1440px, plus 200% zoom, long names/amounts and an open software keyboard.
- Check focus, contrast, sheet scrolling, touch targets, reduced motion, safe-area spacing and dock clearance against rendered evidence.

Implemented in the main application. See main-workspace-integration-notes.md for verification, configuration and remaining visual review. No deployment was performed.
