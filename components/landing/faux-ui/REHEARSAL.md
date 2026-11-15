# Landing-page faux UI integration

Target: the user-approved seven animated compositions from the separate review page.

Integrated into WorkflowSection (client, fitting, order, share) and FeaturesSection (measurements, client records, orders/calendar). Uses the exact mannequin front and left-view images already in the app, the existing Manrope font, and the approved rectangular calendar cells.

The Stageshow kit is locally vendored in `stageshow/`, with its LICENSE and NOTICE retained. This keeps the production components independent of the downloaded skill's examples and playground. The downloaded skill tree is excluded from global TypeScript discovery; explicitly imported reference examples remain available to the review page.

Playback: Stage `play="loop"`; each authored story holds its outcome, fades the changing data, resets while masked, restores the opening state, and repeats. Surrounding surfaces and mannequin remain visible during the seam. The local Stage adds an opt-in `runOffscreen` prop so landing timelines continue after scrolling past, as requested. Hidden browser tabs still stop execution; prefers-reduced-motion uses the completed poster state. Review-only replay buttons, labels and controls are not rendered on the landing page. Illustrations expose a descriptive image label; their internal dummy controls are inert and hidden from assistive technology.

Reference: Stageshow static-card, form-error and calendar examples; craft, motion and framing guides. Calendar detail follows the app's OverviewScreen month grid and pickup peek.

Validation:

- Next development route successfully compiled and returned HTTP 200.
- Server HTML contains seven named landing-faux-ui illustrations and no review playback label.
- Targeted TypeScript check of workflow, features, shared scenes, vendored kit, and review page: zero errors.
- `node scripts/check-faux-ui-motion.cjs`: all seven story target contracts pass; two consecutive loop cycles per scene restore exactly the initial state, reset under the mask, use offscreen looping, and render no review controls.
- Full-project type diagnostics also include unrelated app files; no errors were reported for the changed landing/faux-ui components. See scratch/faux-ui-project-typecheck.json for the check output before excluding the downloaded skill tree.

Not verified: browser-rendered geometry or actual animation playback. Browser capture remains unavailable because Chrome process/IPC creation was denied by the environment. No Stageshow film gate pass is claimed.

Local integrated preview: http://localhost:4320 . The separate exploration page remains available at http://localhost:4317 .
