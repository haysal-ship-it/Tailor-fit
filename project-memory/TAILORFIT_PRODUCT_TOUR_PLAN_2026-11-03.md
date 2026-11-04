# TailorFit product tour — design and implementation plan

Date: 3 November 2026. Status: planning only; no application implementation performed.

User-selected approach: **quick overview, followed by contextual tips**. Preserve TailorFit's design style, the original mannequin appearance, its control panel, and smooth rotation. Reconstruction remains a separate workstream.

## 1. Recommendation

Build an optional five-step orientation that explains the path from a client to reusable measurements and an order. Keep the main tour on Overview. Introduce the Clients destination without navigating away, and explain calendar/settings details later when they become useful.

The intended audience is a tailor or studio assistant who understands fitting a garment but is new to TailorFit. The useful discovery is: **measurements belong to a client and can be reused for future orders**. The tour should make the first real order easier, not require completing an order to dismiss a tutorial.

Design budget: approximately one minute of reading, to be validated with people rather than promised as a measured completion time. Five short steps, one subject per step, no required data entry, automatic saves, uploads, demo resets, or forced gestures.

## 2. What the reference actually does

Inspected the live [Vanish application](https://withvanish.com/app/) on 3 November 2026, progressing through its complete four-step tour: opening media, selecting a region, choosing a fill, and exporting. The reference uses a compact white rounded card anchored to the relevant control, a small visual example above the explanation, a dimmed backdrop with the target left clear, progress dots, and Skip/Back/Next/Done controls. A replay control is available afterward.

Adapt these ideas:

- Explain a short workflow with concrete verbs.
- Put guidance beside the actual control, with one focus at a time.
- Use small visual examples to clarify unfamiliar interactions.
- Keep progress, exit and replay obvious.

TailorFit-specific changes:

- Offer the tour through a small welcome invitation rather than starting a blocking overlay automatically.
- Use TailorFit's blue primary button and Manrope typography.
- Use five steps because the mannequin interaction deserves its own explanation.
- Use a compact mobile sheet when a floating card would obscure the task.
- Keep practice/contextual help separate from the informational tour so it never alters a client's measurements merely to demonstrate a feature.

These are recommendations for TailorFit, not claims about untested reference behavior. The reference's mobile layout and persistence policy were not investigated.

## 3. Entry, replay and completion

### First visit

After store hydration and Overview layout are ready, show a nonblocking invitation near the page's primary heading. It must not appear over an open dialog, validation error, upload, save, or actively edited form.

**Title:** “Get to know TailorFit”

**Body:** “See how client details, measurements and orders work together.”

**Actions:** “Take the tour” and “Not now”.

The invitation may take one small inline row/card; it is not a welcome wizard or a full-screen introduction. Existing populated workspaces get the same optional invitation without being treated as empty or overwritten with examples. If someone starts typing, defer the invitation instead of moving the form around them.

### Replay

Add a Help icon beside the existing header alert control, styled within the current header. Accessible name: “Help and tours”. Its small menu contains:

- “Take the quick tour”
- “Measurement help”
- “Show contextual tips” toggle

Provide a secondary replay entry under Settings → Help. Keep the existing three-item mobile navigation; Help does not need a fourth destination.

From Clients or Settings, replay should first offer “Open Overview and start tour”. Preserve any draft through the app's draft/navigation policy; do not silently unmount an unsaved form. Until that policy is dependable, offer replay only once the user returns to Overview, with a clear explanation.

### Exit and completion

Every step has visible “Skip tour”, Back when applicable, a progress count, and one primary action. Escape and a labeled close icon have the same effect as Skip. Clicking the dim backdrop does nothing, avoiding accidental dismissal. There is no automatic advance and no timed dismissal.

The final step uses “Finish tour”. After closing, show a small inline confirmation: “You're ready to start. Add your client details when you're ready.” Offer “Start an order” only when the current form is empty; focus the client-name field without creating or clearing anything. With an existing draft, offer “Continue your order” instead.

Store completed and dismissed separately; neither reopens automatically on the next visit. An interrupted session can expose “Resume tour” in Help without automatically taking over. Completion means the guide was viewed, not that an order was saved.

## 4. The five-step script

Use this wording as the initial content specification. Match final action names to the actual shipped UI before release.

| Step | Title and body | Target | Small visual example |
|---|---|---|---|
| 1 | **Start with your client.** “Add your client's details and the garment you're making. Their measurements and orders stay together.” | Basic Information within the client intake card | Two compact fictional field rows showing a client name and garment; no real client data |
| 2 | **Choose the measurements you need.** “Choose a garment template to show its measurement points. Use Add Point for any extra measurements.” | Choose Template control | A garment-template row leading to two or three measurement labels |
| 3 | **Measure from every angle.** “Drag the mannequin to rotate it. Select a measurement point to enter a value, or use List view to type measurements.” | Visible mannequin region; secondary visual cue toward List view | Static approved original mannequin thumbnail, one marker and a curved drag arrow; never a newly generated or re-proportioned model |
| 4 | **Bring the order together.** “Add reference images, price and a due date, then save. Your order stays linked to the client's measurements.” | Actual visible Save control, with price/date context in the example | Small reference-image tile, price/date rows and a Save button motif |
| 5 | **Find the fitting again.** “Open Clients to review saved measurements and order history. Reuse a fitting when the client returns.” | Visible Clients navigation item | A miniature client card with Saved Measurements and Order History labels |

Footer: text “1 of 5” plus five small progress marks, “Skip tour”, optional “Back”, and “Next” / “Finish tour”. Marks are decorative with the count carrying the accessible meaning; arbitrary jumping is unnecessary in this short linear tour.

All five steps are informational. The spotlight does not imply the underlying control is currently clickable. When the tour ends, contextual help supports actual interaction. If usability testing finds this misleading, add “Finish or skip the tour to try this” once in the guide's accessible description, rather than repeating it on every card.

Step 3's body stays concise. Keyboard help (“Focus the viewer and use Left/Right arrows”) appears in Measurement help and the contextual rotation tip. Do not present a drag-only route to success.

## 5. Visual specification

Use the existing interface as the visual authority. The current code declares Manrope, white/light-gray surfaces, restrained outlines, black navigation pills and a blue primary action. The tour should read as an existing TailorFit popover, not as a separate branded product.

| Element | Proposed specification |
|---|---|
| Tour card | 320 px desktop width; cap at viewport width minus 32 px; 16 px radius matching existing modal scale |
| Surface | `--surface` (#FFFFFF); miniature demo area `--card` (#F8F8F8) |
| Text | Title `--text-strong`; body and count `--text-2` (currently #595959) |
| Border / depth | Subtle `--hairline` edge and one restrained floating shadow consistent with popovers |
| Primary action | Existing pill-button treatment, `--primary` (#1D49E8), white text |
| Secondary action | Existing neutral chip/surface treatment; clearly visible focus outline |
| Title | Manrope 16 px / 600, approximately 22 px line height |
| Body | Manrope 14 px / 400, 21 px line height; usually two or three lines |
| Count and navigation | 12 px count; 14 px action labels; use tabular count styling |
| Spacing | 16 px card padding, 12 px between demo/title/body/footer groups, 8 px within action groups |
| Miniature demonstration | About 88–104 px tall on desktop; collapsed or omitted on narrow/short screens |
| Spotlight | Clear cutout with 6–8 px breathing room; subtle blue edge; use the target's radius |
| Backdrop | Start with black at 0.32 opacity; verify that the surrounding layout remains recognizable; no backdrop blur |
| Pointer | Small 8 px pointer on desktop only; hide whenever it cannot point accurately |
| Touch area | Aim for 44 px for navigation/close controls; extend invisible hit area where needed without overlapping neighbors |

Small demo graphics should be lightweight HTML/SVG compositions of existing controls and approved assets. No extra WebGL renderer inside the tour. No confetti, mascot, celebratory full-screen state, purple gradients, persistent pulsing hotspot or autoplay model spin. The mannequin and its control panel remain visually unchanged.

For the mannequin thumbnail, use the approved original assets already under `public/assets`, such as `mannequin-female-front.png`, after verifying that the selected image is the intended original reference. A static illustration is enough; do not emulate rotation with crossfades between mannequin images.

Card anatomy:

```text
┌──────────────────────────────────┐
│ small task-specific example    × │
│                                  │
│ Measure from every angle         │
│ Drag the mannequin to rotate it. │
│ Select a point, or use List view.│
│                                  │
│ 3 of 5      ● ● ━ ○ ○           │
│ Skip tour       Back     Next    │
└──────────────────────────────────┘
```

This is a structural wireframe, not a finished visual mockup.

## 6. Desktop, tablet and mobile placement

**Desktop:** Anchor beside the target with collision-aware flipping and shifting. Maintain a 12 px target-to-card gap and at least 16 px viewport clearance. Do not position from hard-coded page coordinates. Keep the card clear of its own spotlight and the relevant input/action.

**Tablet/narrow desktop:** Select floating versus sheet presentation from available space, not solely a named device breakpoint. Recalculate when the browser resizes or a sidebar/content section changes size.

**Mobile:** Use a compact bottom sheet with title, short body, progress and actions. The normal preference is above the floating navigation dock with safe-area clearance. On the final Clients-navigation step, the card must leave that navigation target visible; place the card at the top if the lower safe region is insufficient. On short screens, remove the decorative demo before shrinking text. Limit sheet height and let its content scroll while keeping its controls reachable.

Before showing a step, scroll its target into an unobscured region. Account for fixed navigation, the sheet, safe areas and the visual viewport. For a mannequin taller than the remaining screen, spotlight the visible viewer region and provide the static example; do not zoom/reframe the actual model or alter its camera just to fit the tour.

There is no text entry during the main tour, so it should not summon the software keyboard. Contextual input help must remain visible above the keyboard and must not cover the field. Test 320, 390, 768, 1024 and 1366 px widths plus short landscape layouts and enlarged text.

## 7. Contextual tips after the tour

Only show a tip when its associated feature is encountered and no higher-priority message is active. At most one tip at a time. Dismissing a tip records that specific tip as seen. Tour Skip does not disable all contextual help; provide the separate toggle in Help. If a user continues interacting or starts typing, defer unsolicited tips.

| Trigger | Suggested copy | Behavior |
|---|---|---|
| First template picker visit | “Templates choose the measurement fields for a garment. Your client's values are entered separately.” | Inline helper in the picker; no second modal over the picker |
| First template applied and viewer shown | “Drag to rotate. You can also focus the viewer and use the Left and Right arrow keys.” | Small dismissible hint near the viewer; never intercept pointer drag |
| First measurement entry | “Enter the value in {unit}. Use the same unit throughout this fitting.” | Adjacent to the actual field and unit; this must use the record's real unit, not an unrelated global default |
| First List view visit | “Use Tab to move between measurements.” | Only show after verifying that the actual field order supports it |
| First successful order persistence | “Find this order and its measurements in Clients.” | Integrate with the existing success feedback; optional Open client action; not a second overlapping toast |
| First Clients saved-fitting visit | “Create a new order from these measurements when the client returns.” | Anchor to the real reuse action; no automatic mutation |
| First calendar use | “Orders with a due date appear here. Select a date to review them.” | Short contextual explanation; no sample-order insertion |
| First Settings visit | “Choose defaults for new work and manage your garment templates.” | Show only after unit/currency behavior has been verified; historical records must not be relabeled |

No tip should claim that saving succeeded before persistence reports success. Error and validation feedback always takes precedence over teaching copy.

## 8. Behavior and accessibility contract

- Main tour is an explicitly started modal guide: move focus into its named dialog, keep Tab/Shift+Tab within it, make background controls inert, and restore focus on exit. Visually spotlighted background elements remain explanatory during this mode.
- Use one overlay/dialog at a time. End or suspend the guide before opening an actual product dialog. The template picker receives inline contextual help rather than a nested tour dialog.
- Announce each new title and “Step n of 5” once. Progress marks and demo illustrations are decorative unless they carry information missing from the copy.
- Back, Next, Skip and Close work by keyboard. Avoid page-global arrow shortcuts that conflict with the mannequin or inputs.
- Contextual tips are nonmodal: no focus trap, no automatic focus theft, no blocker over the target; associate explanatory text with its control when useful.
- Step transition: approximately 160–200 ms fade and up to 4 px movement using existing motion conventions; no large flying card that sweeps across the workspace. Fade out, reposition, fade in when targets are far apart.
- Reduced motion: immediate target/scroll repositioning and a short opacity change only; static miniature examples.
- The user can dismiss immediately, including while waiting for a target. Cancel stale callbacks and observers when exiting or navigating.

## 9. Implementation structure

Suggested new modules (names are proposed, not existing files):

- `components/onboarding/TourProvider.tsx`: eligibility, progress and lifecycle.
- `components/onboarding/TourOverlay.tsx`: backdrop, cutout and card positioning.
- `components/onboarding/TourCard.tsx`: shared card content and footer.
- `components/onboarding/ContextualTip.tsx`: nonmodal, dismissible feature help.
- `lib/onboarding/steps.ts`: stable step IDs, copy, target keys, placement preferences and optional example IDs.
- `lib/onboarding/storage.ts`: versioned preference/progress persistence separate from business records.

Use the existing Button and motion conventions where they satisfy the contract. Use a proven accessible dialog/positioning primitive if the existing overlay code cannot satisfy focus and collision requirements. Evaluate dependency compatibility at implementation time; this plan does not prescribe an unverified tour-library version or introduce a third-party tracking service.

Mount the provider inside the existing StoreProvider at the main application boundary. Mount a single overlay portal near the application root. Exclude `/preview/*` mannequin studies and any reconstruction-only app from tour eligibility.

### Targets

Add explicit `data-tour` targets to real rendered elements:

| Step | Proposed target key | Integration location |
|---|---|---|
| 1 | `client-basics` | OverviewScreen basic client information group |
| 2 | `choose-template` | Actual Choose Template button |
| 3 | `mannequin-viewer` | Existing viewer wrapper; no changes to its renderer |
| 4 | `save-order` | Visible desktop/mobile Save button wrapper |
| 5 | `nav-clients` | Visible Clients destination in Navbar |

Resolve only visible targets because desktop and mobile variants coexist. Register targets through refs or query stable data attributes and reject hidden/zero-area elements. Observe layout/scroll/resize changes; wait for a ready target with a bounded timeout and a recoverable fallback.

**Important current-code detail:** `overview-client-intake` appears on both the intake card and Recent Orders. Do not anchor the guide with `getElementById` on that duplicate identifier. Correct the duplicate and add distinct tour anchors. The mobile navigation currently lacks the same IDs as desktop, and Save has separate render paths, so a desktop-only selector will fail on phones.

### State model

```text
not offered → invitation → running(step 1…5) → completed
                  ↓              ↓
               dismissed      dismissed / interrupted
                                  ↓
                             manual resume/replay
```

Store stable step IDs, tour version, status, last step ID, and per-tip seen/dismissed state. Keep the preference namespace separate from clients/orders/settings export/reset logic. Read before writing; wait for `isHydrated` and do not repeat the previous empty-state persistence race. If preference storage is unavailable, continue in memory and do not block application use. Do not reopen the tour every render because a preference write failed.

On missing target, offer “Continue tour” to the next valid step or “Close tour”; never leave a dark screen with no exit. If viewport changes, retain the same step and re-anchor. If navigation changes unexpectedly, suspend without resetting the user's location. Never undo actual input values while restoring tour focus/scroll.

### Instrumentation

If the product later has approved analytics, count invitation shown, start, step viewed, skip, completion, replay and first real order saved. Do not include client names, contact details, measurements or images. Tour completion and successful product activation are separate metrics. No analytics provider is required to ship the guide.

## 10. Relationship to the audit and current work

The 2 November audit is a baseline, not a statement that all its issues remain unchanged. The latest source already includes darker supporting-text tokens, an `isHydrated` guard and other fixes. Those changes were not re-audited as part of this tour-planning task.

Before shipping tour copy, verify the actual current behavior of:

1. Save/persistence success and reopening the record.
2. Units and historical snapshots.
3. Template choice, point selection, rotation and List view.
4. Due-date behavior and calendar placement.
5. Client reuse and navigation/draft preservation.

The tour must not teach a known broken behavior or hide a defect with instructions. Fix the underlying action if a copy statement cannot truthfully describe it. It must also not create a new mannequin variant or integrate reconstruction into the main app.

## 11. Delivery sequence

1. **Prepare anchors and shared state.** Resolve duplicate targets, create versioned onboarding state, gate on hydration and preserve drafts.
2. **Build one styled card and the welcome invitation.** Review desktop/mobile proportions using TailorFit tokens; validate long text and focus behavior.
3. **Connect the five steps.** Add spotlight geometry, visible-target resolution, safe scrolling, progress and exit/replay handling.
4. **Add the contextual tips.** Begin with template, rotation, measurement unit, successful save and saved-fitting reuse. Add calendar/Settings tips only after their behavior is verified.
5. **Verify accessibility, resilience and visual fit.** Test the matrix below, then conduct a short first-use trial with a tailor or studio assistant.

Acceptance checks:

- First visit offers help without blocking; Not now and Skip are respected after reload.
- Five steps complete with Next alone; no client/order/image is created, edited or deleted.
- Back works, progress is correct, replay starts at step one, interrupted progress resumes only on request.
- Starting/ending the guide preserves existing inputs, selected client, units, mannequin form/angle and navigation context.
- Both desktop and mobile target the visible controls; no card obscures its highlighted control or fixed navigation.
- Every step and exit works using keyboard and a screen reader; focus returns predictably.
- Reduced-motion users receive equivalent information without animated model examples or sweeping movement.
- Missing/hidden targets, resize, short screens, navigation changes, unavailable storage, slow viewer loading and open dialogs do not trap the user.
- Contextual tips never compete with errors, saves or another tip, and never cover measurement entry or swallow rotation gestures.
- Reconstruction preview receives no tour overlay or onboarding side effects.
- A new user can explain where measurements are saved and how to reuse them for another order after viewing the guide.

## 12. Planning evidence and limits

Reference tour inspected live in the in-app browser. TailorFit's current code, tokens, assets and existing audit screenshots were reviewed. The local preview at port 3001 was unavailable during this planning session, so current live positioning has not been validated. The plan specifies what must be checked during implementation; it does not claim a built or browser-tested TailorFit tour.

Source integration points:

- [Application shell](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/app/page.tsx>)
- [Navigation](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/Navbar.tsx>)
- [Overview and intake](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/OverviewScreen.tsx>)
- [Clients](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/ClientsScreen.tsx>)
- [Settings](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/SettingsScreen.tsx>)
- [Design tokens](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/app/globals.css>)
- [Motion tokens](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/lib/motion-tokens.ts>)
- [Store hydration](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/lib/store.tsx>)
- [Earlier audit](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/project-memory/WEBAPP_UX_AUDIT_2026-11-02.md>)

Audience and visual direction are inferred from the existing tailoring product and the user's preservation requirements. The quick-overview/contextual-tip structure was explicitly selected by the user. Exact one-minute completion time and usability remain to be validated.
