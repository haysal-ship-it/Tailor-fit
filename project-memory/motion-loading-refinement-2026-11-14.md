# Landing motion and workspace loading refinement

Implemented 14 November 2026. Changes remain local; no commit or deployment was requested for this task.

## Direction and boundaries

Keep TailorFit's existing typography, colour, illustration, mannequin and controls. Use the previously selected Solva reference for restrained section entrances. Refero research was attempted but unavailable because the connected account has no subscription. The existing TailorFit design and previously selected reference therefore ground this refinement.

The Features section and its existing animation are unchanged. Authentication, storage, records and save outcomes retain their existing behavior.

## Changes

- Replaced the landing reveal wrapper with a deferred GSAP enhancement using ScrollTrigger, CustomEase and React lifecycle cleanup. Initial HTML remains visible without animation initialization.
- Ordinary copy already in view stays fully readable. Below-fold sections reveal once with an 18px rise over 600ms; the hero preview settles 12px over 700ms. Delays are capped at 120ms, using the existing 0.23, 1, 0.32, 1 entrance curve.
- Fast scrolling completes skipped entrances. Keyboard focus immediately finishes an entrance. Hidden-tab playback pauses. Reduced-motion preference bypasses decorative entrances. No scroll hijacking or smooth-scroll replacement was added.
- Testimonials straighten once at a lower visibility threshold, avoiding repeated retilting while scrolling back and forth.
- Replaced the plain workspace loading message with responsive overview, client-directory and settings placeholders. Route and record hydration now finish before real screen content appears.
- Added an indeterminate progress line, accessible loading announcements and a reload hint after ten seconds. The progress line pauses when the tab is hidden and becomes static under reduced motion.
- Busy buttons retain their original dimensions and readable contrast. Save-button transitions are shorter and honor reduced motion.
- Corrected a loading-header overflow discovered at 320px.

## Verification

- Production build and TypeScript passed.
- Changed-file lint: no errors; one existing Workspace effect-dependency warning remains.
- Pricing verification passed, including monthly prices of NGN 5,000 / NGN 10,000 and discounted yearly prices of NGN 54,000 / NGN 108,000.
- Production landing and guest workspace navigation reviewed in the browser; no console errors observed in the final production review. Annual pricing and FAQ interactions worked.
- Loading layouts checked at 320, 390, 768, 1024 and 1440px without horizontal overflow after correction.
- Actual loading component tested in an isolated React preview: ten-second recovery hint appeared; busy-button width was identical before and during loading, with the busy state disabled and announced.
- Deferred animation loading limits initial landing JavaScript to 181kB versus the previous 180kB. App initial JavaScript is 345kB versus 343kB.
- FeaturesSection and LandingMotion have no changes in this task.

## Limits

Signed-in account flows were not browser-tested, following the user's earlier preference. Loading states were reviewed with the actual component in an isolated preview rather than by altering live account data or auth responses. Reduced-motion branches were inspected in code; browser/OS reduced-motion emulation was not completed. No new throttled-network or real-device touch verification is claimed by this report.

## Evidence

Screenshots are in `project-memory/motion-loading-2026-11-14/`:

- `after-production-landing-mobile.jpg`: production mobile landing.
- `after-production-settings.jpg`: production guest settings.
- `after-loading-desktop.jpg`: isolated workspace loading component, desktop.
- `after-loading-mobile.jpg` and `after-loading-320.jpg`: isolated mobile loading component.
- `after-client-loading-desktop.jpg`: client-directory loading layout.
- `after-live-button.jpg`: live busy-button behavior.
- `after-loading-recovery.jpg`: delayed-loading recovery hint.

The isolated live fixture runs outside Next.js; its image-origin handling is fixture-specific. The final desktop loading screenshot uses the component's server-rendered fixture with its real stylesheet and resolved logo. Production logo loading was verified separately.

## Preview

- Landing: http://localhost:3007/
- Guest workspace: http://localhost:3007/app?tab=overview

Existing unrelated responsive QA edits and generated files were retained. Source implementation is in LandingRevealMotion, SolvaReveal, WorkspaceLoading and its stylesheet, with integration in the landing page, workspace route and shared buttons.
