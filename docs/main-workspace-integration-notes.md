# Main workspace integration — 18 November 2026

Implemented in the main application, with menu and Clients empty-state refinements prepared for publication to main on 19 November 2026. No deployment was performed.

## Main app design retained

- Pickup calendar and recent-order rows were extracted from the existing Overview implementation, retaining their classes, layout and status handling. Their order links now open the exact OrderWorkspace record.
- The Clients directory/profile and mobile bottom dock remain the main application's components.
- Manrope and the semantic design tokens remain in use. The new order uses the production RotatableMannequin.

## Integrated behaviour

- Overview: welcome header; Add client then New order; three white analytics panels and a white orders-by-date chart in the grey container.
- Analytics open URL-addressable all/active/outstanding order lists. Query/filter context is preserved when returning from details. Search updates replace the current history entry.
- Order details use the saved order ID and linked fitting ID. An unrelated fitting is never substituted for an order without one.
- Generic New order starts without a selected client, previous fitting or client selector. It creates a client record from the typed contact details, using the existing saveIntake transaction, upload staging and idempotent draft ID.
- Existing order edits preserve an unknown historical currency instead of assigning the latest studio default.
- The old intake page and Overview shortcut are retired. Genuine old intake drafts can be explicitly recovered inside New order. Measurement capture stays in the client profile and saves fittings without creating orders.
- Settings: grouped desktop navigation and mobile index/detail pages; profile name, verified email change, password reset, business identity, units/currency, templates, backup/restore, contextual tips and tour replay.
- Studio identity is included in newly generated invoices. Existing order currencies and saved fitting units are retained.
- Native workspace dialogs become bottom sheets below 1024px. Focus trapping, restoration, nested scroll locks, safe-area spacing, software-keyboard viewport changes and busy dismissal protection are handled centrally.
- Phone action pairs stack at full width. Main navigation retains the original bottom dock.

## Account deletion

The server action derives ownership from the authenticated user and freshly verifies their password. It removes owned workspace-image files before deleting the auth account, whose records cascade through the existing schema. Failures return structured errors rather than simulated success. A partial file cleanup is reported honestly and can be retried.

Self-service deletion requires SUPABASE_SERVICE_ROLE_KEY on the server. The interface remains unavailable when this is not configured. Never expose this key with a NEXT_PUBLIC prefix. No real account deletion was used during verification.

## Verification

- scripts/test-workspace-integration.cjs: 12 analytics and mocked account-deletion checks.
- scripts/test-client-details.cjs: 5 client persistence/validation checks.
- scripts/check-workspace-render.cjs: 7 server-render checks for Overview, blank New order, exact order details, grouped Settings, primary button fills and explicit fitting reuse. Mannequin/upload internals are stubbed in this test; it is not a browser screenshot check.
- TypeScript and targeted ESLint checks.
- Production build passed with a separate output directory. An initial attempt exhausted memory; icon imports were optimized and the build was retried without the preview process.

## Visual review still required

Browser automation is unavailable in this session. Responsive classes and server-rendered output were checked, but pixel accuracy, actual software-keyboard behaviour, touch interaction, focus movement and screenshots at 320/360/390/430/768/1024/1440px and 200% zoom are not marked as visually verified.

The local main workspace preview is served on port 4320 at /app?tab=overview. The separate hosted direction review was not overwritten.

## Menu and empty-state refinements — 19 November 2026

The Overview chart period and All orders filter now reuse the same ChoiceMenu component as Clients. The Clients directory empty state now follows the existing white frame, grey content container, compact icon and typography, with stacked full-width phone actions.

## Flow and dropdown consistency fixes

All workspace selection and action menus share ChoiceMenu, preserving the approved Saved Measurements design. Menus open below their trigger, constrain their scrollable height to the visible viewport and render inside an owning native dialog when applicable. Settings action styles use separate primary/secondary backgrounds to prevent white-on-white default buttons.

Take Measurements stays in the client profile. Explicit fitting reuse opens OrderWorkspace with an ownership-checked fitting ID; generic New order remains blank. Tour entry points use the approved order form. Old intake URLs redirect to the dashboard or selected client, and old drafts are recovered only by an explicit action inside the new form.

Additional verification: scripts/test-workspace-flow.cjs covers menu geometry, legacy redirects and draft conversion, including invalid dates. These fixes replace the previous intake flow and menu implementations.
