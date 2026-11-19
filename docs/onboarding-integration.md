# New-user studio onboarding

The approved two-screen setup, compact Overview checklist and looping mannequin demonstration are integrated into the main app. The independent preview remains available for design review and runs against its own local records.

## Entry and rollout

Both Google and email signups use the same account-owned public.user_onboarding record. A minimal auth.users INSERT trigger initializes not_started once. Returning users retain their existing state, including when Google links to an existing auth identity. Sign-in timestamps, user metadata, workspace size and settings versions do not determine eligibility.

Existing accounts are backfilled as legacy_existing unless they already have explicit saved setup progress. The migration preserves in-progress, deferred and completed states. Only confirmed affected Google accounts should be repaired separately; empty workspaces alone are insufficient evidence.

New and unfinished accounts enter setup before mounting the workspace. Validated order/client/draft return URLs remain intact and resume after completion or explicit skip. Unknown status and read errors show retry and continue-without-setup controls. Password recovery retains its own route.

Existing accounts can opt in through Help or Settings > Help > Set up your studio. Getting started reopens the checklist. Entry respects existing unsaved-change guards.

## Data and saves

Profile names and studio/default values retain their existing authenticated write paths. Canonical progress lives only in user_onboarding, protected by owner-only RLS reads and an authenticated revision-checked RPC. Its privileged implementation lives in a private schema; the public RPC is an invoker wrapper. Direct browser insert/update privileges are denied. Completed state cannot be downgraded by a late tab, and exact retries are idempotent.

Step 1 saves profile, optional studio name and in-progress state. Step 2 saves unit/currency then completes setup. Profile writes verify the expected owner; settings writes retain owner/version checks. Failed or conflicting saves retain form input with retry/reload controls. Completion requires a saved name and valid defaults.

Account-scoped drafts protect unfinished input. Completion removes the draft. Skip saves deferred state; an explicit continue-without-saving action permits a session-only departure if saving fails. Currency defaults never rewrite historical prices or measurements.

## First Overview

The checklist sits below the welcome/actions header and above the analytics grid. Milestones derive from persisted setup completion and real saved clients/orders. Creating an order that also creates its client counts toward both milestones. The completed checklist collapses and can be dismissed/reopened with the preference saved to the account.

The optional guide retains analytics, chart, calendar, Add client and New order in that order. A standalone tour invitation is suppressed for checklist participants. Canonical order details, existing client dialogs/mobile sheets, calendar, recent orders and main navigation are retained.

## Shared mannequin demonstration

The same component drives main setup and review: an 18-second automatic cursor/measurement sequence followed by front/side/back rotation. Markers use production landmark coordinates and the production mannequin renderer. Example values follow centimetres/inches without creating records. Pause/resume and a static reduced-motion poster are supported. The approved companion-panel visibility on narrow screens is retained.

## Verification

- Studio setup tests cover canonical eligibility, malformed state, save failures, account switching, OAuth return destinations and password recovery. PostgreSQL tests execute the migration, auth-user trigger, RLS, RPC revisions, completion preconditions and anonymous access checks.
- Server-render checks cover the real Overview checklist, milestone completion, canonical order/reuse routes, Settings fills and setup without review controls.
- Existing client, analytics, dropdown placement, recovery, account and tour regression tests are retained.
- The standalone preview has additional timeline, landmark alignment, unit conversion and shared-component checks. Its build rejects live account/data modules.
- Run npm run build with a separate TAILORFIT_DIST_DIR for production validation without overwriting the running preview.

Browser visual inspection and real-provider email/Google signup were not available in this session. Callback and persistence cases are verified with controlled dependencies, without creating live users or altering customer records.

Migration 20261119192458_user_onboarding.sql was applied to the configured TailorFit Staging project before publishing. All existing auth accounts received a state record; no existing accounts were reclassified using empty-workspace guesses. The security advisor reported no new findings. Production build and 82 automated checks passed. A real Google-provider browser signup remains a release verification step.
