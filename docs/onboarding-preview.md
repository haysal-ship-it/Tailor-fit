# Independent onboarding review

Open http://127.0.0.1:4322/ in the local browser.

This is a standalone React preview on its own server. It does not change the main app, run authentication, or connect to live clients/orders. It reuses the production mannequin, shared controls, five tour definitions, calendar and recent-order components against a dedicated local preview store. Settings and record writes affect the preview only.

## Review paths

- Fresh signup: enter your name and optional studio name, choose unit/currency, then open Overview.
- Skip setup: enter Overview with an unfinished setup task; Resume returns to setup.
- Failed save: select the failed-save scenario, submit defaults, then retry without losing values.
- Add a preview client: submit the mobile bottom sheet / desktop dialog and see checklist progress.
- Save a preview order: its preview client and order both count toward completion. Payment information stays unknown until recorded.
- Show me around: inspect the existing analytics, chart, calendar, Add client, New order sequence.
- Completed checklist: inspect the collapsed success state; its client and order are explicitly review examples.
- Refresh: resume preview state from local storage. Restart resets only this preview.

Desktop, Tablet, Phone and 320px controls change the iframe viewport, so actual media queries and shared modal bottom-sheet behaviour apply. Review controls sit outside the proposed product interface.

## Run and verify

Build/start: node scripts/preview-onboarding.mjs

Build only: node scripts/preview-onboarding.mjs --build-only

Checks: node scripts/check-onboarding-preview.cjs

Generated files live in public/previews/onboarding. The build excludes live account/data modules. The product entry routes, main settings/store, authentication and main preview server are untouched.

This review demonstrates onboarding and preview records; its abbreviated order form and detail view are not replacements for the main application's complete order workflow.

## Looping mannequin demonstration

The setup companion panel now runs an automatic 18-second sequence: cursor to waist, reveal leader line and size, repeat for bust and shoulder, then show left/back/right views and return to the front before repeating. It uses the production mannequin and its landmark coordinates. Example values follow the chosen centimetre/inch default without creating measurement records. The SVG overlays scale in the same coordinate system as the real renderer.

A pause/resume icon controls the looping timeline. The labels and turntable share the cursor animation clock, with measurements hidden during rotation. Reduced-motion preferences show a static front view with a meaningful waist callout. Both setup steps share the same running demo. The existing narrow-screen companion-panel visibility is preserved.
