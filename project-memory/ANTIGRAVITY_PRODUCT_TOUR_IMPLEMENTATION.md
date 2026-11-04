# Antigravity implementation handoff — TailorFit product tour

Prepared: 3 November 2026.

## Assignment

Implement an optional five-step product tour followed by contextual tips in the existing TailorFit webapp. The user selected **“Quick overview, then contextual tips.”** Treat that decision as settled. Build the feature, verify it in a live browser on desktop and mobile, and deliver screenshots and a concise verification report.

The detailed design source is [TAILORFIT_PRODUCT_TOUR_PLAN_2026-11-03.md](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/project-memory/TAILORFIT_PRODUCT_TOUR_PLAN_2026-11-03.md>). This handoff turns that design into implementation tasks and explicit acceptance gates. Where a detail below clarifies a technical ambiguity, follow this handoff. Preserve the agreed user experience.

Reference: [Vanish](https://withvanish.com/app/). Its four-step live tour was inspected: anchored white cards, miniature examples, a dim backdrop with a clear target, progress indicators, and Skip/Back/Next/Done. Adapt the interaction pattern to TailorFit's design; do not copy Vanish branding, media, product claims, or text.

## Non-negotiable boundaries

1. Preserve the mannequin's appearance, materials, proportions, camera, smooth rotation and control-panel styling. This feature requires wrapper targets, not changes to the renderer.
2. Keep the separate mannequin reconstruction work separate. Do not merge `/preview/reconstructed-mannequin` into the main app, and do not mount onboarding on `/preview/*` routes. The tour itself belongs in the main TailorFit app.
3. Never create, update, delete, reset, upload or save client/order data to demonstrate a tour step. Five Next clicks must be sufficient to complete the tour.
4. Preserve every unrelated working-tree change. There are existing audit repairs and reconstruction changes, including untracked files. Do not reset the checkout, clean untracked files, overwrite the store, or restore older versions to simplify integration.
5. Maintain the existing three navigation destinations. Help belongs in the header and Settings, not as a fourth mobile dock tab.
6. The first-use invitation is optional. Starting the spotlight tour is always an explicit user action.
7. Do not add external analytics, authentication, AI services, generated mannequin imagery or a second WebGL canvas.

## Current repository facts to verify before editing

Workspace: `C:\Users\Sal\Documents\Vibe coding\Tailor-fit-main`.

The project uses Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion and Lucide icons. Read the installed versions and lockfile before introducing any dependency; this handoff does not certify compatibility of a particular tour library.

Relevant current files:

| Existing file | Role / planned integration |
|---|---|
| [app/page.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/app/page.tsx>) | StoreProvider wraps TailorFitApp; place TourProvider inside it; one overlay host |
| [components/Navbar.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/Navbar.tsx>) | Header Help control and visible Clients tour target in both navigation variants |
| [components/screens/OverviewScreen.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/OverviewScreen.tsx>) | Invitation, four main content targets and template/rotation/entry/save tips |
| [components/screens/ClientsScreen.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/ClientsScreen.tsx>) | Saved-fitting reuse tip |
| [components/screens/SettingsScreen.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/SettingsScreen.tsx>) | Help section, replay entry, contextual-tip preference |
| [components/ui/Button.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/ui/Button.tsx>) | Existing primary, secondary, ghost and icon variants; reuse and extend locally if needed |
| [app/globals.css](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/app/globals.css>) | Existing semantic design tokens |
| [lib/motion-tokens.ts](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/lib/motion-tokens.ts>) | Existing motion conventions |
| [lib/store.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/lib/store.tsx>) | Existing `isHydrated`; onboarding reads readiness but owns separate preference storage |

Known integration hazards:

- `overview-client-intake` currently appears on both intake and Recent Orders. Give Recent Orders its own unique ID; do not use the duplicated ID as a tour target.
- Desktop and mobile Save controls are rendered separately. Desktop navigation has `nav-pill-*` IDs; mobile does not have matching IDs. Use explicit shared target keys with visible-element resolution.
- Screen changes can unmount local form state. The tour must stay on Overview, including its final Clients-navigation explanation.
- Supporting-text tokens and hydration logic have changed since the 2 November audit. Read the actual files. Do not blindly reapply old audit findings or mark existing fixes verified without testing.
- The local server was offline during tour planning. Start an available local preview for this implementation and report its real URL. Do not assume port 3001 is running or stop another developer's server.

## Product behavior and exact copy

### Invitation

Show a compact, nonblocking invitation near the Overview heading once both business data and onboarding preferences are hydrated, layout is ready, and no conflicting interaction is active.

- Title: **Get to know TailorFit**
- Body: **See how client details, measurements and orders work together.**
- Primary: **Take the tour**
- Secondary: **Not now**

Reserve the invitation's layout space during initial hydration if necessary to avoid late movement. If the user begins typing before eligibility resolves, defer the invitation for that visit. An already visible invitation must not repeatedly appear/disappear as fields change. Populated workspaces receive the same optional invitation; do not insert sample business data.

### Five steps

Keep these stable IDs independent of position in the array:

| Stable ID | Target key | Title | Body |
|---|---|---|---|
| `client` | `client-basics` | Start with your client. | Add your client's details and the garment you're making. Their measurements and orders stay together. |
| `template` | `choose-template` | Choose the measurements you need. | Choose a garment template to show its measurement points. Use Add Point for any extra measurements. |
| `measure` | `mannequin-viewer` | Measure from every angle. | Drag the mannequin to rotate it. Select a measurement point to enter a value, or use List view to type measurements. |
| `save` | `save-order` | Bring the order together. | Add reference images, price and a due date, then save. Your order stays linked to the client's measurements. |
| `reuse` | `nav-clients` | Find the fitting again. | Open Clients to review saved measurements and order history. Reuse a fitting when the client returns. |

Keep the actual copy truthful to the verified behavior. Do not use the guide to claim persistence or unit correctness without testing the underlying flow.

Card controls: visible **Skip tour**, **Back** on steps 2–5, **Next** on steps 1–4, **Finish tour** on step 5, and a close icon labeled **Close tour**. Show **n of 5** plus decorative progress marks. No arbitrary step jumping, automatic progression, countdown or forced click on the highlighted target.

Main-tour targets are explanatory and inert while the modal tour is active. Do not attach Next behavior to real Save, point, template or navigation controls. Finish closes the tour; it does not navigate to Clients.

Completion feedback: **You're ready to start. Add your client details when you're ready.** For an empty form offer **Start an order**; for an existing draft use **Continue your order**. These actions only focus the appropriate form field. Do not overwrite or clear a draft.

### Help and replay

Header accessible label: **Help and tours**. Menu items:

- **Take the quick tour**
- **Resume tour**, only for interrupted progress
- **Measurement help**
- **Show contextual tips**, exposed as a named checked control

Settings contains the same replay and preference access under a small Help section. The Help popover closes before the tour starts, preventing competing focus traps.

For this version, if invoked outside Overview, show: **Return to Overview to take the tour. Your current work will stay where it is.** Keep the user on the current screen. This deliberately avoids depending on an unverified cross-screen draft-preservation feature. Do not silently navigate or trigger a save. Once the user returns normally, the header replay action is available.

On Overview, explicit replay can run over a draft if no picker/dialog/save is active: make the page inert while viewing and preserve all draft values and mannequin state. Do not remount the screen.

## Build architecture

Create focused modules rather than adding a large tour implementation to OverviewScreen. Suggested names and ownership:

| New module | Responsibility |
|---|---|
| `components/onboarding/TourProvider.tsx` | Runtime state, eligibility, actions, blocker registration and persistence coordination |
| `components/onboarding/TourInvitation.tsx` | First-use invitation and completion message |
| `components/onboarding/TourOverlay.tsx` | Modal lifecycle, spotlight, positioning and target readiness |
| `components/onboarding/TourCard.tsx` | Shared text, example, count and controls |
| `components/onboarding/TourExamples.tsx` | Lightweight static miniature demonstrations |
| `components/onboarding/HelpMenu.tsx` | Header entry, replay, resume and help controls |
| `components/onboarding/ContextualTip.tsx` | Nonmodal feature help, dismissal and accessible descriptions |
| `lib/onboarding/steps.ts` | Static step definitions and copy |
| `lib/onboarding/state.ts` | Pure state transitions and persisted-state validation |
| `lib/onboarding/storage.ts` | Versioned preference reads/writes with graceful failure |
| `lib/onboarding/targets.ts` | Visible target resolution and rectangle calculations |

A small positioning hook may live beside TourOverlay rather than becoming a general layout framework. Adapt the split if the repository already has suitable primitives. Keep the new files independent of the 3D renderer.

Proposed provider API:

```ts
type TourStepId = 'client' | 'template' | 'measure' | 'save' | 'reuse';
type TourStatus = 'unseen' | 'interrupted' | 'dismissed' | 'completed';

interface OnboardingPreferences {
  version: 1;
  status: TourStatus;
  lastStepId: TourStepId | null;
  contextualTipsEnabled: boolean;
  acknowledgedTipIds: string[];
}

// Runtime is separate from preferences: closed, preparing or running.
// Public actions: start, resume, next, back, dismiss, finish,
// acknowledgeTip, setTipsEnabled, registerBlocker.
```

Use blocker registration with cleanup and unique ownership rather than a single global boolean that one closing component could incorrectly clear. Blockers cover open dialogs/pickers, saving, uploads, validation errors, and focus-sensitive activity. A normal draft suppresses unsolicited invitations/tips but does not prevent an explicitly requested tour.

## Persistence and state transitions

Use a dedicated key such as `tailorfit:onboarding:v1`. Do not put tour progress into client/order state, include it in business-data backup, or reset business data when restarting the guide.

1. Read and validate preferences on mount before any preference write.
2. Independently wait for `useStore().isHydrated` before assessing first-use eligibility.
3. Missing preferences yield unseen/defaults. Malformed values and unknown step IDs must not crash rendering or auto-open a modal. Normalize safely and show at most the invitation.
4. Starting persists `status: interrupted` and the current step ID. This records resumable progress without a fragile unload handler.
5. Next/Back persist the current stable ID; runtime remains running.
6. Not now, Skip, Escape and Close persist dismissed. Finish persists completed.
7. Reload with interrupted state never auto-opens the guide. Offer manual Resume in Help. Replay always starts at `client` regardless of stored progress.
8. A future content version must not force every existing user through the tour again. Treat release announcements separately.
9. Storage exceptions fall back to in-memory state for the visit. Suppress repeated offers during that session even if writing fails. Existing client workflows must remain usable.

Treat dismissal of the overview separately from disabling contextual tips. Dismissing one tip marks only that tip acknowledged. Turning tips off suppresses all unsolicited tips without removing manual Measurement help.

## Targeting, spotlight and modal behavior

Add `data-tour` values to the actual wrappers/buttons from the target table. Multiple responsive candidates may share a target key, but IDs must stay unique. Choose the rendered candidate with a nonempty layout box and visible computed styles; an off-screen target is still eligible for deliberate scrolling, while a `display:none` variant is not.

Implementation order for each step:

1. Resolve the currently visible responsive candidate.
2. Wait for it to mount and have nonzero bounds, with a bounded readiness window (start with 2 seconds).
3. Scroll it into an area not occupied by the guide, fixed navigation or browser keyboard.
4. Measure and position after layout settles. Avoid an arbitrary sleep as the only readiness mechanism.
5. Render the spotlight and card. Recalculate on relevant scrolling, ResizeObserver notifications, viewport resize and VisualViewport changes.

Use a requestAnimationFrame-coalesced measurement pass; do not run an always-on animation loop. Clean up all observers/listeners and pending callbacks on close. Prevent a stale step's callback from repositioning a newer step.

If a target is absent, retain a usable centered card with **This part of the workspace isn't available right now.** Offer **Continue tour** to the next valid step and **Close tour**. If no later step is available, offer Close rather than looping. Do not falsely mark a skipped/missing step as read or emit completion merely because all targets were unavailable.

Use a single SVG mask or equivalent overlay with a real cutout and a separate outline; avoid cloning/reparenting the live target or raising it above application dialogs. The overlay intercepts pointer interaction even over the cutout. Mount it outside the content region that becomes inert. Never set inert on an ancestor of the tour dialog itself.

Main tour accessibility:

- Named modal dialog with title and description associations.
- Move focus to its heading or first appropriate control; announce the new step once.
- Trap Tab/Shift+Tab within guide controls; background including spotlight targets is inert.
- Restore previous inert/scroll styles exactly on close; do not permanently mutate global behavior.
- Escape closes and persists dismissal. Backdrop clicks do not dismiss.
- Restore focus to the invoking element if it remains available, otherwise a sensible Overview heading/control. Focus the client field only when the user explicitly chooses Start/Continue order.
- Remember scroll position at start; restore it on dismissal when still on the same screen. Finish can leave the current position until the user chooses the next action. Do not force restoration after an external navigation change.
- Suspend on unexpected screen navigation; do not navigate back or discard user work.

Prefer an existing accessible dialog/positioning primitive. If adding one is necessary, verify current compatibility, licensing and package footprint, and retain TailorFit's own styling. Do not accept a library's default theme or inaccessible behavior as the design.

## Visual and responsive implementation values

Reuse Manrope and semantic variables from the app:

- White `--surface` card, `--card` miniature area, `--hairline` edge.
- `--text-strong` title and `--text-2` body; blue `--primary` action.
- Desktop width 320 px, maximum viewport width minus 32 px, radius 16 px, padding 16 px.
- Title 16/22 px at weight 600; body 14/21 px; count 12 px; action labels 14 px.
- Internal spacing 8/12/16 px; primary and secondary controls use existing Button variants.
- Cutout padding 6–8 px, target-to-card gap 12 px, minimum viewport edge clearance 16 px.
- Begin with a black 0.32-opacity backdrop and subtle floating shadow. No backdrop blur.
- Aim for 44 px touch areas with no overlaps; keep decorative icons appropriately compact.
- Miniature examples about 88–104 px tall; omit them before compromising text or controls on short screens.

Examples are decorative, static HTML/SVG compositions with fictional labels. For the mannequin example, inspect and reuse an approved original thumbnail from the existing assets. Do not generate a new body, render a second 3D scene, autoplay rotation, or crossfade mannequin views.

Desktop cards flip/shift around targets. Mobile uses a compact sheet above the floating dock, accounting for its measured bounds and safe-area inset. For the final navigation target, move the card to the top if necessary to keep Clients visible. A bottom-sheet rule must not blindly cover the thing being explained.

Use the visual viewport for short-screen/keyboard handling and explicit available-space calculations. A tall mannequin may be highlighted only within its visible intersection; never alter model scale, pose or camera to fit the guide. At 320 px, wrap footer groups into two rows if required. Controls must remain reachable with enlarged text.

Motion: 160–200 ms opacity transition with up to 4 px movement; no sweeping trajectory between distant targets. Respect reduced motion with immediate scrolling/repositioning and a short fade. Never animate the real mannequin automatically as onboarding decoration.

## Contextual-tip implementation

The following are part of the feature, not a second mandatory tour. Render one eligible tip at most. Errors, saves, uploads and active dialogs win over unsolicited overlay tips. Use real feature events/props; do not infer success from a timer or button click.

| Tip ID | Trigger and location | Copy / condition |
|---|---|---|
| `template-fields` | First template picker opened; inline inside picker | “Templates choose the measurement fields for a garment. Your client's values are entered separately.” |
| `viewer-rotate` | First template applied and viewer ready; adjacent hint | “Drag to rotate. You can also focus the viewer and use the Left and Right arrow keys.” |
| `measurement-unit` | First measurement field interaction; associated helper text | “Enter the value in {unit}. Use the same unit throughout this fitting.” Use the actual record unit. |
| `measurement-list` | First List view use | “Use Tab to move between measurements.” Verify the field order first. |
| `order-saved` | Actual persistence success; augment existing success feedback | “Find this order and its measurements in Clients.” Optional Open client action. |
| `reuse-fitting` | First saved-fitting view; beside the reuse action | “Create a new order from these measurements when the client returns.” |
| `calendar-dates` | First calendar interaction | “Orders with a due date appear here. Select a date to review them.” |
| `settings-defaults` | First Settings visit | “Choose defaults for new work and manage your garment templates.” Only if verified against current behavior. |

Contextual tips are nonmodal, never steal focus, and never intercept drag gestures or cover input controls. For field helper text, reserve space or use an existing helper region so the focused field does not jump. Use `aria-describedby` when appropriate. Provide a labeled dismiss control; do not auto-dismiss by timeout.

The template tip can appear inline within its existing dialog; no second focus trap. The saved-order tip must reuse existing success feedback rather than adding a competing toast. If the current persistence API cannot reliably report success, leave that specific success tip disabled and report the prerequisite instead of showing a false success claim.

## Work packages and completion gates

### 1. Baseline and integration preparation

- Read local instructions, current diff and the design plan.
- Record existing build/type/lint failures before attributing them to this feature.
- Start a separate available development-server port if needed; keep other processes intact.
- Capture current Overview desktop/mobile screenshots.
- Correct the duplicated Recent Orders ID and add stable tour targets.

Gate: each step resolves exactly one visible target at both desktop and mobile widths; existing form and mannequin behavior are unchanged.

### 2. State and preferences

- Implement validated storage, pure transitions and provider.
- Add hydration gating, blockers and cleanup.
- Add invitation, Not now, replay and interrupted resume behavior.

Gate: dismissal/completion survive reload; unavailable storage does not cause repeated overlays or block the app; no business-data mutation occurs.

### 3. Five-step guide

- Implement card, static examples, single overlay, focus lifecycle and target geometry.
- Connect Back/Next/Skip/Finish and missing-target fallback.
- Add responsive positioning and reduced motion.

Gate: full tour works with mouse and keyboard, on narrow and wide layouts, without target/card collisions or data changes.

### 4. Contextual help

- Add event-driven tips, Help menu, manual Measurement help and Settings access.
- Connect settings-default and save-success tips only to verified behavior.
- Validate one-tip policy and the independent preferences.

Gate: no competing overlay, false save success, pointer interception or focus stealing.

### 5. Verification and handoff

- Run relevant automated checks and browser scenarios below.
- Inspect every tour step at desktop and mobile sizes, then fix clipping, alignment or focus problems found.
- Record changed files, commands/results, screenshots, actual preview URL and any narrowly identified unverified checks.

Gate: user can review the finished experience and reproduce the tests. Do not describe planned tests as completed.

## Test matrix

Add meaningful tests around behavior rather than snapshots that only mirror markup. Use the project's available test tooling; inspect existing `.test.ts` conventions first. The package currently has no general `test` script, so do not invent a command and claim it passed.

| Area | Required scenario / expected result |
|---|---|
| First visit | Empty and populated workspaces receive an invitation after hydration; no automatic modal |
| Early interaction | Starting to type before invitation eligibility resolves defers it; inputs do not jump |
| Persistence | Not now, Skip and Finish persist distinct expected states after reload |
| Interruption | Reload at step 3 offers manual Resume; it never auto-opens |
| Replay | Completed/dismissed tour can be restarted from step 1 |
| State preservation | Compare client/order/snapshot data, form draft, selection, unit and mannequin state before/after tour; no changes |
| Navigation | Step 5 highlights Clients without leaving Overview; replay outside Overview does not discard drafts |
| Responsive targets | Desktop/mobile Save and Clients targets resolve correctly; hidden variants never receive a spotlight |
| Missing target | Target removed, late-mounted or zero-size produces recoverable UI; close always works |
| Resize | Switch widths mid-step without resetting progress or losing focus |
| Keyboard | Tab/Shift+Tab stay in main guide; Back/Next/Finish/Escape work; focus restoration is sensible |
| Screen reader | Title, body and step count are announced once; decorative examples are not noisy |
| Tips | One at a time, individually dismissible, global preference respected, no overlap with errors or existing modals |
| Viewer | No pointer interception or rotation/vertical-scroll regression after tour closes |
| Failure modes | Storage denied/malformed, viewer unavailable, save error, navigation while waiting, repeated open/close |
| Scope | All mannequin `/preview/*` routes remain free of tour providers, overlays and preference writes |

Visual matrix: 320×740, 390×844, 768×1024, 1024×768, 1366×900; short landscape; enlarged text/zoom; reduced motion. Check the software keyboard and actual touch scrolling on a physical device if available. Clearly label viewport-only testing if physical devices are unavailable.

Suggested repository checks, after confirming local tooling: `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Distinguish pre-existing failures, environment/network failures and new regressions. Avoid unrelated cleanup while resolving tour issues. Use targeted tests for state transitions, preference parsing, target selection and missing-target behavior; one end-to-end data-preservation test is especially important.

Save screenshots of all five steps at 1366 px and 390 px, the 320 px footer, first-use invitation and one contextual tip. Include before/after proof that the mannequin/control panel has not been restyled. Store evidence in a dedicated `project-memory/tour-evidence/` folder or the repository's established equivalent.

## Definition of done

- Optional five-step overview, Help/replay/resume and contextual help are implemented.
- TailorFit tokens and existing button/motion conventions are used consistently.
- The real mannequin/control panel and separate reconstruction work are preserved.
- No onboarding step mutates business data or silently navigates away from a draft.
- Every exit path restores usable focus, scrolling and pointer interaction.
- Desktop/mobile targeting, short-screen layouts and reduced motion have been checked.
- Required checks are run with honest pass/fail reporting; remaining limitations are named precisely.
- The final delivery includes a working preview URL, screenshots, changed-file summary and verification notes.

## Ready-to-paste instruction for Antigravity

> Implement the TailorFit product tour described in `project-memory/ANTIGRAVITY_PRODUCT_TOUR_IMPLEMENTATION.md`. Read that file and `project-memory/TAILORFIT_PRODUCT_TOUR_PLAN_2026-11-03.md` before editing. The approved approach is an optional five-step overview followed by contextual tips. Preserve TailorFit's existing styling, mannequin appearance, control panel and smooth rotation, and keep mannequin reconstruction previews separate. Preserve all unrelated working-tree changes. Build the feature through all work packages, test it in the live app at desktop/mobile sizes, and deliver screenshots, the preview URL and an accurate verification report. Do not create or alter real client/order data through the tour, and do not claim unexecuted checks passed.

This document is a handoff artifact. Preparing it did not implement the tour, run its tests or send instructions to an external Antigravity session.
