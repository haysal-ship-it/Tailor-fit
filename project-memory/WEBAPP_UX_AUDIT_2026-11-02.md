# TailorFit — webapp UX audit and repair plan

Audit date: 2 November 2026. Scope: the current local working tree and the active application at http://127.0.0.1:3001/. This is an audit and implementation plan, not a record of implemented fixes.

## Verdict

**Implementation integrity: fail for release readiness.** The product has a recognizable tailoring workflow and a useful visual foundation, but saving, units, dates, and identity are not yet trustworthy. Fix those before investing in visual polish. A live test client disappeared after reload. A saved 40 cm shoulder measurement was displayed as 40 inches after changing the default unit. An order entered as 31 February was accepted as 3 March.

The findings below are specific to this working tree. It contains ongoing mannequin reconstruction changes from another workstream; this audit did not change application source, revert those changes, or integrate the reconstruction preview.

**Preserve the original mannequin appearance and its control panel.** Improve surrounding usability without redesigning them. Keep reconstruction in its separate preview route/workspace until a separate visual review approves it. The current main viewer visibly differs from the original image-based mannequin; this audit is not approval of that visual replacement. Follow the existing ANTIGRAVITY_3D_MANNEQUIN_HANDOFF.md for that separate project.

## Health score and severity

This is a heuristic manual/source-review score, not a WCAG certification or performance benchmark.

| Dimension | Score / 4 | Reason |
|---|---:|---|
| Accessibility | 1 | Keyboard-inaccessible order cards, incomplete dialog behavior, and low-contrast text |
| Performance | 2, provisional | Some motion safeguards exist; unbounded base64 attachments and broad state updates remain; no production profiling performed |
| Theming / consistency | 2 | Useful tokens exist, but repeated hard-coded colors and divergent component implementations remain |
| Responsive design | 2 | Main layouts reflow, but mobile loses order status and Settings overflows at 320 px |
| Implementation integrity | 1 | Repeated contradictions between displayed promises and saved behavior |
| **Total** | **8 / 20 — Poor** | **Major functional repairs required; a wholesale visual redesign is not recommended** |

22 grouped findings: **1 P0, 12 P1, 9 P2, 0 P3**. P0 = immediate blocker/data loss; P1 = major defect or accessibility barrier; P2 = usability/consistency issue with a workaround. Counts group related symptoms by fix, not by every affected element.

## Method and coverage

Used Impeccable's technical audit and copy/adaptation guidance, Interface Design, and the [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Examined source, live accessibility/DOM output, screenshots, computed styles, bounds, and console messages. Impeccable context loading and its bundled detector were attempted but could not run because the required engine package was unavailable and the package/cache environment failed. There is **no successful detector result** behind this report; findings were manually verified.

Evidence labels: **Live** = reproduced in the browser; **Source** = verified in the implementation but not exercised destructively; **Judgment** = a visual/usability recommendation rather than a demonstrated functional failure.

| Area | Coverage | Limits |
|---|---|---|
| Overview / intake | Desktop/mobile rendering, labels, validation logic, creation logic, calendar and recent-order logic | Not every calendar date or input permutation executed |
| Clients | Empty state, create client, reload persistence, demo roster, saved measurement editing and units | Destructive client deletion not executed |
| Orders | Use Measurement → Create Order → open edit; invalid date; mobile/desktop field comparison | Every lifecycle transition and every attachment type not executed |
| Settings | Units, currency logic, template dialog, sizing action, data actions, export implementation | Clear/reset not executed against existing user data; restore flow absent |
| Accessibility | DOM semantics, focused element, Escape, labels, contrast arithmetic, target bounds | No full screen-reader session, axe certification, or exhaustive tab traversal |
| Responsiveness | Chromium viewport checks at 320×740, 390×844, 768×1024, 1024×768, 1366×900 | No physical iPhone/Android, Safari, software keyboard, pinch zoom, or synthesized touch drag |
| Motion / performance | Source review and browser warning review | No frame-time, Core Web Vitals, throttled-device, or production bundle benchmark |
| Mannequin experiment | Integration boundary and current main-view visual observation | Geometry matching remains in the separate reconstruction handoff |

The active entrypoint mounts OverviewScreen, ClientsScreen, SettingsScreen and OrderFormModal. Older DashboardScreen, OrdersScreen, PickupCalendarScreen, ClientProfileScreen and MeasurementCaptureScreen implementations are not equivalent to live routes. Do not treat fixes in those files alone as fixes to the active app. A store helper still targets an `orders` screen that the entrypoint does not render; this is a latent path, not a reproduced blank-screen bug in the current main navigation.

Tests used the initially empty in-app-browser origin and clearly named audit/demo data. They did not use the user's other browser profile. Temporary viewport overrides were reset after testing. Port 3000 was unavailable; the running preview was on 3001.

## Findings and concrete fixes

### A01 — P0: Reload can erase saved records

**Evidence: Live + Source. Category: implementation integrity.** Created `AUDIT TEST — Persistence` through Clients, saw it saved, reloaded, returned to Clients, and saw “No Clients in Atelier.” In [store.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/lib/store.tsx:100>), hydration waits for a zero-delay timer while persistence effects immediately write initial empty arrays/default settings. That can overwrite storage before it is read.

**Fix:** Introduce an explicit hydration state. Read, parse, validate and migrate stored data before enabling writes or user saves. Persist only after successful initialization. Keep malformed data recoverable instead of replacing it silently. Make saves return a result that the UI can acknowledge accurately.

**Acceptance:** Seed clients, snapshots, orders, custom templates and preferences; reload repeatedly, including React development Strict Mode; all values survive. Empty storage initializes once. Malformed storage and unavailable storage show a recoverable error without destructive replacement. Suggested workflow: `$impeccable harden`.

### A02 — P1: Changing units changes meaning without conversion; currency has the same modeling risk

**Evidence: Live + Source. Category: integrity/copy.** Saved Shoulder width = 40 cm, changed Settings to inches, returned to Clients: the field and hotspot both read 40 in. [ClientsScreen.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/ClientsScreen.tsx:102>) uses the global default unit; snapshot loading around line 300 reads values without conversion. OrderFormModal also derives its label from the default. Snapshot units exist in the data model, but Order has no stored currency in [types/index.ts](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/types/index.ts>).

**Fix:** Decide and enforce one measurement representation: canonical base units with explicit display conversion, or immutable per-snapshot units. Defaults should affect new records; viewing existing records must respect their unit. Store an ISO currency code on each order, preserve historical amounts, and format independently of global preferences. Do not automatically apply an exchange rate.

**Acceptance:** 40 cm displays as approximately 15.748 in when explicitly converted and round-trips without cumulative rounding loss. Editing in inches saves the correct physical length. Changing preferred currency does not turn an existing NGN amount into the same number of dollars. Migrate legacy records using a documented assumption and preserve original data. `$impeccable harden`.

### A03 — P1: Invalid dates are silently changed; blank dates and prices have hidden meanings

**Evidence: Live + Source. Category: integrity/forms.** Entered `31/02/2026` via Use Measurement, created an order, opened edit, and saw `03/03/2026`. [initial-data.ts](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/lib/initial-data.ts:27>) accepts Date.UTC rollover and substitutes a date seven days ahead for blank/invalid input. It also invents a 15:00 UTC time although the form asks only for a date. Clearing an existing date retains the old value in [OrderFormModal.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/OrderFormModal.tsx:673>). Price parsing removes non-digits, so a negative sign can disappear and malformed values can become zero or partial numbers.

**Fix:** Use one strict parser/schema across all order entrypoints. Round-trip year/month/day to reject impossible dates. Store a date-only value when no time was requested. Make due date optional with an explicit “Not scheduled” state, or require it visibly; never invent one. Define the meaning of a missing quote separately from a zero-price order. Reject invalid/negative prices before mutation.

**Acceptance:** Reject 31 February, 31 April and malformed input; accept leap day only in valid years. Blank/cleared dates behave consistently. Dates remain stable across timezones. `-100`, `12.3.4`, blank and zero prices receive the intended distinct treatment. `$impeccable harden` + `$impeccable clarify`.

### A04 — P1: Creating a client can overwrite a different person with the same name

**Evidence: Source. Category: integrity.** [OverviewScreen.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/OverviewScreen.tsx:538>) reuses a client when either the name or email matches, then overwrites contact details. Two people can share a name.

**Fix:** Select existing clients by ID. Offer a possible-match choice during creation without silently merging. Updates to a selected client must be explicit. Preserve references when reconciling duplicates.

**Acceptance:** Create two clients with the same name and different phone/email; neither overwrites the other. An existing-client order links to the selected ID even if the display name changes. `$impeccable harden`.

### A05 — P1: “Take Measurements” loses the selected-client context

**Evidence: Source. Category: flow integrity.** [page.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/app/page.tsx:48>) selects the client then opens Overview. [OverviewScreen.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/OverviewScreen.tsx:75>) initializes an empty New Client form and does not consume that selected ID. Its save path also always creates an order, even though the originating action promises measurement capture.

**Fix:** Give capture an explicit mode and client ID. Prefill/display the selected client, allow measurement-only saving, and offer Create order as a separate next step. Do not use name matching to recover context.

**Acceptance:** Capture from an existing client creates a snapshot on that client, adds no duplicate client, and creates no order unless requested. The header names the client and the primary action states exactly what will be saved. `$impeccable harden` + `$impeccable clarify`.

### A06 — P1: Order identifiers can collide

**Evidence: Source. Category: integrity.** [store.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/lib/store.tsx:233>) uses only the last four timestamp digits for order IDs. Those repeat every ten seconds; editing/deleting by ID can affect the wrong or multiple records.

**Fix:** Use stable collision-resistant IDs, such as UUIDs. Detect duplicate legacy IDs before migration; preserve relationships rather than blindly reassigning them.

**Acceptance:** Generate many orders including identical/time-offset timestamps; all IDs are unique. Updating one order changes only that order. `$impeccable harden`.

### A07 — P1: Editing shared measurements can rewrite historical orders and reset snapshot selection

**Evidence: Source. Category: integrity/history.** [ClientsScreen.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/ClientsScreen.tsx:327>) mutates the active snapshot directly. Orders reference that snapshot. [OrderFormModal.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/OrderFormModal.tsx:633>) can also update an existing linked snapshot. Separately, Clients' synchronization effect around line 289 depends on `getClientSnapshots`, a function recreated on store render, and resets selection to the first snapshot on reruns.

**Fix:** Define immutable measurement versions or copy measurements into each order at creation. Make “Edit recorded measurements” distinct from “Take new measurements,” with a deliberate policy for correcting historical records. Stabilize selectors/effect dependencies and retain active snapshot ID unless it is removed or the client changes. Persist mannequin form metadata with a snapshot if it is part of the recorded fitting; the current snapshot type has no such field.

**Acceptance:** Two orders sharing an original fitting retain their historical measurements after a new fitting is recorded. Selecting/editing an older snapshot does not jump to the latest snapshot after a store update. `$impeccable harden`.

### A08 — P1: Clear and demo-reset actions immediately replace data

**Evidence: Source; destructive actions not executed. Category: integrity/copy.** [SettingsScreen.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/SettingsScreen.tsx:589>) calls clearAllData directly; line 621 calls resetToDemoData directly. “Populate your atelier” does not disclose replacement. The reset also resets preferences.

**Fix:** Provide a confirmation dialog stating affected record counts and whether preferences change, a safe cancel default, and an export option. Prefer a separate demo workspace over replacing real data. If replacement remains, label it “Replace workspace with demo data.” Client deletion already has a confirmation pattern to retain.

**Acceptance:** Opening either action changes nothing; cancel preserves all data. Confirmed replacement affects only the selected workspace. Copy precisely describes what is lost and what can be recovered. `$impeccable harden` + `$impeccable clarify`.

### A09 — P1: Saving can report success when storage fails; images are unbounded

**Evidence: Source. Category: integrity/performance.** Persistence catches errors without feedback in [store.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/lib/store.tsx:148>). [AnimatedFileUpload.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/ui/AnimatedFileUpload.tsx:28>) reads every file as a data URL without size/count/type validation. A file-picker accept hint is not drop validation. Data URLs enlarge local-storage payloads. Progress percentages are timer-driven rather than measured work.

**Fix:** Validate files before reading; set a documented count/size budget, decode images, resize where appropriate, and store blobs in IndexedDB or a deliberate upload service. Return persistence errors to the save action. Keep edits available for retry/export. Describe local processing as “Adding images…” rather than simulated upload percentages.

**Acceptance:** A quota/storage failure never displays Saved. Oversized, unsupported and interrupted attachment operations yield an actionable error and retain existing images. Concurrent additions do not lose prior images. `$impeccable harden` + `$impeccable optimize`.

### A10 — P1: Mobile order editing cannot change status

**Evidence: Live + Source. Category: responsive/flow.** Desktop edit has Order Status; the 390 px mobile sheet omits it. Desktop and mobile markup diverge in [OrderFormModal.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/OrderFormModal.tsx:1044>) and its mobile branch starting around line 1287. The desktop options also omit the model's PickedUp state.

**Fix:** Render shared order fields and validation in both layouts. Include the full supported lifecycle, with user-facing labels such as “Ready for pickup” and “Collected.” Define Completed versus Collected explicitly instead of retaining overlapping meanings accidentally.

**Acceptance:** A phone user can make every allowed status transition available on desktop and see it reflected in the card/calendar after reopening. Compare fields at 390 and 1366 px. `$impeccable adapt` + `$impeccable harden`.

### A11 — P1: Keyboard and assistive-technology access is inconsistent

**Evidence: Live + Source. Category: accessibility.** The Add Blueprint Template overlay in [SettingsScreen.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/SettingsScreen.tsx:740>) has no dialog role, focus stays on the background Add Template button, its close icon is unnamed, and Escape from its title field does not close it. Client order cards are click-only divs in [ClientsScreen.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/ClientsScreen.tsx:1525>). Order form visual labels are often not connected to their controls, including the status select. Overview has no h1 or skip-to-content link.

**Fix:** Use one accessible dialog primitive; move/trap/restore focus, make the background inert, name the dialog and close action, support Escape. Use native buttons/links for cards, connected labels and described errors for every field, proper pressed/selected states for choice controls, one page h1 and a skip link. Avoid nested interactive targets in recent-order cards. Do not blanket-replace dialogs that already implement focus handling; OrderFormModal has its own handling that needs verification, not the same missing-dialog diagnosis.

**Acceptance:** Complete create/edit/template flows with keyboard only; focus remains visible and reaches all actions. Screen readers announce dialog titles, field names, selected states and errors. Follow the [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). `$impeccable harden`.

### A12 — P1: Informational text is too faint

**Evidence: Live styles + source + calculated contrast. Category: accessibility/typography.** [globals.css](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/app/globals.css:56>) defines muted #A2A2A2, weekday #A8A8A8 and sub #8D8D8D. On white their ratios are approximately **2.55:1, 2.38:1, 3.32:1**; on #F8F8F8 they are **2.40:1, 2.24:1, 3.13:1**. These tokens are used for small, meaningful metadata, hints and dates. The weekday styling and tiny record metadata are visibly weak.

**Fix:** Use a readable secondary-text token for meaningful copy, and reserve faint tones for nonessential decoration or genuinely disabled controls. Recheck status badges separately. Preserve brand blue and the restrained light palette.

**Acceptance:** Normal informational text reaches 4.5:1 against its actual composited background; large text uses its applicable threshold. Disabled controls are not automatically counted as failures. See [WCAG contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). `$impeccable typeset` + `$impeccable polish`.

### A13 — P1: Settings horizontally overflows on a narrow phone

**Evidence: Live + Source. Category: responsive/layout.** At 320×740, the document expanded to **355 px**. The Sizing/Measurements heading and nonshrinking Add Measurement button exceeded the screen; activating it horizontally scrolled the page to roughly 39 px, clipping the left edge. See [SettingsScreen.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/SettingsScreen.tsx:442>) and the evidence screenshot.

**Fix:** Stack heading/action below the necessary width; allow the text column to shrink/wrap. Use min-width:0 on flexible children and prevent action rows from establishing a wider document. Do not hide overflow globally to conceal unreachable content.

**Acceptance:** At 320 px, every Settings section and dialog fits the viewport with no horizontal page scroll; heading and action remain fully readable. Repeat with long template names and enlarged text. `$impeccable adapt`.

### A14 — P2: Order status and date captions misrepresent the record

**Evidence: Live + Source. Category: copy/integrity.** In-progress cards default to “Urgent” in [ClientsScreen.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/ClientsScreen.tsx:508>) without deadline logic. “Size taken on” uses order creation time, not snapshot date. Overview maps Ready to Completed and otherwise unknown/PickedUp statuses to Pending around line 218.

**Fix:** Share one status presentation mapping across cards, calendar and forms. Separate workflow status from deadline risk. Derive “Overdue” or “Due soon” only from a documented rule and exclude finished orders. Show “Order created…” and “Measurements recorded…” with their actual source dates.

**Acceptance:** A future in-progress order is not marked Urgent by default; Ready and Collected are represented consistently; captions remain correct when an old snapshot is reused. `$impeccable clarify` + `$impeccable harden`.

### A15 — P2: “Add Measurement” does not add anything

**Evidence: Source + live activation. Category: flow/copy.** [SettingsScreen.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/screens/SettingsScreen.tsx:453>) only raises “All 21 standard anatomical landmarks active.” No add form or new measurement is created.

**Fix:** Implement a supported custom-measurement flow if that capability is intended. Otherwise remove the action and show static text “21 standard measurements available.” Do not imply custom anatomical landmarks can be placed unless the viewer actually supports them.

**Acceptance:** Every action label describes a real operation. Any custom measurement can subsequently be selected in a template, captured, saved and reopened. `$impeccable clarify` + `$impeccable harden`.

### A16 — P2: Navigation lacks durable location and carries scroll between screens

**Evidence: Live + Source. Category: navigation.** Navigation changes in-memory activeScreen at `/`; it does not create a restorable client/order location. Moving from a scrolled Clients screen to Overview left the page approximately 835 px down, displaying the middle of the intake instead of its start. Unmounting Overview also resets its local draft state.

**Fix:** Use routes/search parameters for screen/client/order selection. Define scroll restoration and focus movement per navigation type. Preserve unsaved drafts or warn when discarding them. Keep Back behavior predictable and distinguish opening a modal from switching screens.

**Acceptance:** Browser Back/Forward and refresh return to the intended record; switching top-level screens starts at its heading unless explicitly restoring a previous visit. Switching away and back cannot silently discard an in-progress intake. `$impeccable harden`.

### A17 — P2: Intake hierarchy and spacing obscure what the primary action does

**Evidence: Judgment + measured styles. Category: layout/typography.** Overview labels its combined client/measurement/order flow “New Client” while Save creates all three. On desktop, 11–12 px form labels/metadata and numerous 2 px nested-card seams make the page visually busy. Save is under the mannequin, spatially separated from the contact/price form. At 768 px, users pass the entire intake and a large viewer before reaching Save. At 1024×768 the lower viewer/action requires scrolling; this is not itself a missing-action bug, but reinforces weak task orientation.

**Fix:** Establish an explicit sequence: Client → Garment and measurements → Order details. Match the primary action to the actual transaction. Use a consistent spacing scale (suggested 4/8/12/16/24/32 px), 16–24 px section padding, 16 px field-row gaps, readable 14 px labels/secondary copy and 16 px form entry. Flatten unnecessary surface nesting; align section headings and input edges. On mobile place a clearly labeled action in a safe footer above navigation, with sufficient content padding. Preserve the mannequin and its controls.

**Acceptance:** The user can identify what is being saved before pressing the primary action. Form edges and heading baselines align, long text wraps, and the last field/action is reachable above the mobile dock and software keyboard. `$impeccable layout` + `$impeccable typeset`.

### A18 — P2: Small targets and timed feedback make interaction harder

**Evidence: Live bounds + Source. Category: accessibility/responsive.** Desktop calendar arrows and the due-date icon measured 22×22 px; direction buttons were 23 px tall. Several remove/close controls are similarly compact. Toast undo pauses on mouse hover but not keyboard focus in [Toasts.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/components/ui/Toasts.tsx:83>).

**Fix:** Expand hit areas without enlarging the visual icons or redesigning the mannequin controls. Aim for 44×44 px touch hit areas, prevent adjacent hit-region overlap, add visible focus, and pause timed undo on focus as well as hover. Allow record text such as phone/email to be selected and copied where screen-wide select-none currently prevents it.

**Acceptance:** Touch and keyboard users can activate the same actions without precision tapping or racing a timeout. The WCAG 2.2 AA target criterion is 24×24 CSS px with exceptions; 44 px is the proposed comfort target, not a blanket AA requirement. Assess spacing exceptions individually using [target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). `$impeccable adapt` + `$impeccable harden`.

### A19 — P2: Copy and required fields vary by entrypoint

**Evidence: Live + Source. Category: UX copy/forms.** Overview requires both phone and email; other client/order paths permit much less information. The create-client dialog has the accessible title “Edit or switch client profile.” “Garments Blueprints,” “Sizing/Measurements,” “Use Measurement,” “Bespoke Order,” and generic Save use inconsistent concepts. Overview can create an empty measurement snapshot; OrderFormModal requires fields but does not consistently require useful values.

**Fix:** Establish one validation policy and a small terminology set. Recommended policy to confirm during implementation: client name plus at least one contact method when operationally necessary; email optional unless a feature needs it. Mark required versus optional accurately. Distinguish a garment template from a saved fitting and a new order. Avoid representing missing measurements as zero; show “Not recorded.”

**Acceptance:** Equivalent operations enforce the same rules from every entrypoint. Error text names the field and recovery, preserves inputs, and moves focus to the first problem. See the copy table below. `$impeccable clarify`.

### A20 — P2: Backup has export but no user-facing recovery workflow

**Evidence: Source + visible Settings inventory. Category: recovery.** [store.tsx](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/lib/store.tsx:323>) exports versioned JSON with settings, clients, snapshots and orders. Settings offers no matching restore/import path, so “backup” is difficult for a nontechnical user to recover from.

**Fix:** Provide validated restore with a preview of counts, schema version, units/currency assumptions, and explicit replace/merge behavior. Preserve a pre-restore backup. Until implemented, explain that export downloads a data file and restoration requires assistance rather than implying full recovery support.

**Acceptance:** Export a workspace, restore into a separate empty test workspace, and compare all linked records/settings/images. Invalid or incompatible files leave current data untouched. `$impeccable harden` + `$impeccable clarify`.

### A21 — P2: Motion behavior is inconsistent and includes misleading delays

**Evidence: Source + live console. Category: motion/performance.** The viewer contains reduced-motion detection, keyboard rotation, pointer cancellation/lost-capture handling and pan-y touch intent—retain these. Other screen/template transitions do not consistently apply reduced-motion preferences. Order creation adds timer-based loading delays; upload progress is simulated. Console warnings report backgroundColor animation between transparent representations.

**Fix:** Use one motion policy for drawers, dialogs, toasts and validation; reduced-motion should retain clear state changes with minimal movement. Tie pending indicators to actual persistence work. Normalize animated color values. Profile the viewer and image-heavy orders on a representative phone before making performance claims; do not replace smooth rotation with image crossfades.

**Acceptance:** Reduced-motion mode completes all flows without large entrance/scroll movement. Saves finish according to actual work, warnings are resolved at their source, and rotation can be interrupted/reversed cleanly. Physical touch scroll-versus-drag remains an explicit test gate. `$impeccable optimize` + `$impeccable animate`.

### A22 — P2: Duplicated forms and mixed design tokens cause recurring drift

**Evidence: Source. Category: theming/maintainability.** Overview, client inline flows, Use Measurement and desktop/mobile OrderFormModal repeat parsing, labels and order creation logic. Hard-coded grays coexist with semantic tokens. The mobile missing-status defect is one concrete consequence of duplicated rendering.

**Fix:** Share domain validation and mutation functions first, then field groups and accessible primitives. Document a compact token set for text, surfaces, spacing, radius and focus. Retain component variants where layout needs differ; do not force all screens into one giant component. Dark mode is not exposed as an active requirement, so this report does not count missing dark styling as a standalone defect.

**Acceptance:** A field or validation change reaches every active entrypoint; mobile/desktop cannot silently diverge in supported operations. Semantic token changes consistently update all intended surfaces. `$impeccable document` + `$impeccable polish`.

## Responsive evidence and interpretation

| Viewport | Observed result | Follow-up |
|---|---|---|
| 320×740 | Overview fits; inputs compute to 16 px. Settings becomes 355 px wide at the sizing heading/action | Fix A13; test long labels and text zoom |
| 390×844 | Client workspace and order sheet render; mobile order status absent; navigation can retain prior vertical scroll | Fix A10/A16; test keyboard-open footer |
| 768×1024 | Overview stacks/reflows without measured horizontal overflow | Improve task progression/action visibility, not a blanket overflow fix |
| 1024×768 | Two-column overview, no measured horizontal overflow; desktop inputs 12 px; lower content requires scrolling | Raise readable type and test action reachability |
| 1366×900 | Three-column overview fits horizontally; hierarchy is present but dense/faint | Correct contrast, spacing and action labeling |

No claim that every page at every listed size passed. Settings at 320 and order edit at 390 are specific failures. A viewport screenshot proves layout, not physical touch or software-keyboard behavior.

Evidence files:

- [Mobile order sheet, 390 px](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/project-memory/audit-evidence/mobile-order-390.png>)
- [Mobile overview after navigation, 390 px](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/project-memory/audit-evidence/mobile-overview-390.png>)
- [Narrow overview, 320 px](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/project-memory/audit-evidence/mobile-overview-320.png>)
- [Settings overflow, 320 px](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/project-memory/audit-evidence/mobile-settings-320.png>)
- [Tablet overview, 768 px](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/project-memory/audit-evidence/tablet-overview-768.png>)
- [Compact desktop, 1024 px](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/project-memory/audit-evidence/compact-desktop-1024.png>)
- [Desktop overview, 1366 px](<C:/Users/Sal/Documents/Vibe coding/Tailor-fit-main/project-memory/audit-evidence/desktop-overview-1366.png>)

## UX copy specification

Copy changes must accompany the matching behavior; words alone cannot repair data integrity.

| Current | Proposed | Condition / rationale |
|---|---|---|
| New Client + Save (creates client, fitting and order) | New order + Create order | Only after the combined flow is made explicit; use Save measurements for measurement-only mode |
| Client * | Client name | Required marker and validation policy shared across forms |
| Email Address * | Email address (optional) | Recommended unless email is operationally required |
| Garments Blueprints | Garment templates | Standard noun, simpler plural |
| Blueprint Title | Template name | Consistent with template picker |
| Create Blueprint | Create template | Match action and object |
| Sizing/Measurements | Measurement library | Distinguish definitions from a client's recorded values |
| Add Measurement (no operation) | 21 standard measurements available | Static explanatory text if custom creation is unsupported |
| Use Measurement | Create order from these measurements | Explain consequence before switching context |
| Size taken on [order date] | Order created [date] | Add Measurements recorded [snapshot date] separately |
| Urgent (all in-progress orders) | In progress | Add Overdue/Due soon only when rules justify it |
| Ready | Ready for pickup | Explain the next operational step |
| PickedUp | Collected | Human-facing wording; keep a stable internal enum |
| Garment's Calendar | Pickup calendar | Use only once dates actually represent agreed pickup dates |
| Due Date | Due date (DD/MM/YYYY) | Persistent format hint; example 09/11/2026; strict validation |
| Silent date rollover | Enter a valid date, for example 09/11/2026. | Associate with the date field and preserve the invalid entry |
| Price/Due date | Price and schedule | Clear section label |
| 0 / 0 cm for missing data | Not recorded | Zero should not masquerade as a valid body measurement |
| Edit or switch client profile in create mode | Add client | Dialog heading/name must match mode |
| Reset to Clean Slate / Purge | Delete workspace data | Plain language with counts and confirmation |
| Load Demo Data / Populate | Open demo workspace | Preferred isolation; otherwise explicitly say Replace workspace with demo data |
| Tap to upload image | Add reference images | Works for pointer, touch and keyboard; show supported formats/limits |
| Uploading 65% (timer-driven) | Adding images… | Indeterminate feedback for actual local processing |
| Saved (before storage success) | Saved on this device | Only after persistence succeeds; explain device-local storage in onboarding/settings |
| Storage failure swallowed | Couldn't save on this device. Your changes are still here. Retry or export a copy. | Provide real Retry/Export actions |
| Manage your account settings and preferences | Manage measurement defaults, templates and workspace data. | Matches the controls actually present |

## Implementation sequence and release gates

### Phase 1 — Protect records before any UI refresh

Work: A01, A02, A04, A06, A07, A08, A09. Back up existing data before migrations. Create a small storage/domain boundary that returns success/failure, supports versioned migrations and keeps failed writes recoverable. Define measurement and currency semantics before changing display labels. Add meaningful regression tests for hydration races, record identity, units and historical snapshots.

Gate: records survive reload, failures are visible, units are correct, existing-client data is never silently overwritten, and destructive actions require an explicit product confirmation. Do not combine this phase with mannequin geometry work.

### Phase 2 — Make the active flows consistent

Work: A03, A05, A10, A14, A15, A16, A19, A20. Share validation and lifecycle rules across intake, saved measurements, order creation/edit and Settings. Decide the few product semantics: optional contact fields, unscheduled dates, draft quote versus zero price, and Completed versus Collected. Implement explicit capture/create/edit modes with durable navigation.

Gate: new client → fitting → order → status update → pickup/collection works on desktop and mobile; existing client → new fitting works without an unwanted order. Cancel/back/reload preserve the expected state. Backup/restore round-trips in a separate test workspace.

### Phase 3 — Accessibility and responsive repair

Work: A11, A12, A13, A18. Build/reuse accessible dialogs and form primitives; repair card semantics, connected labels, focus handling, contrast and narrow-screen wrapping. Expand hit targets through invisible padding where the existing visual shape must stay unchanged.

Gate: keyboard-only end-to-end flows pass; check with an actual screen reader; test 320/390/768/1024/1366 widths plus 200% text and 400% zoom/reflow where applicable. On actual mobile Safari/Chrome test the software keyboard, safe-area bottom navigation, nested scrolling, orientation changes, rotation cancellation and vertical scroll over the mannequin.

### Phase 4 — Layout, typography and copy polish

Work: A17, A19, A21, A22. Apply the spacing/type scale and copy table to active components. Keep the original mannequin appearance/control panel and smooth rotation behavior as explicit constraints. Use screenshots at the same sizes for before/after review. Profile image-heavy records and the 3D viewer before speculative optimization.

Gate: legible hierarchy, aligned headings/fields, no content concealed by fixed actions, accurate empty/error/loading/success states, no unexpected console warnings, and no visual regression to the approved mannequin reference. Re-run the audit and record remaining exceptions.

## Acceptance test inventory

1. Hydration: empty, populated, malformed, old-schema and denied/quota-limited storage; reload twice.
2. Identity: duplicate names, changed email, explicitly selected existing client, rapid order creation.
3. Measurement semantics: cm/in conversion, editable round-trip, unknown values, old snapshot selection, historical order stability, form metadata.
4. Order forms: missing garment, missing/partial measurements, zero/negative/malformed price, leap dates, invalid dates, cleared due date, every supported status on mobile and desktop.
5. Recovery: cancel edits, navigate away/back, retry failed save, export/restore, cancel destructive actions, isolated demo workspace.
6. Accessibility: dialog entry/exit/Tab/Shift+Tab/Escape, visible focus, card activation, labels/errors, selection announcements, live save feedback and focused Undo.
7. Responsive: smallest supported width, long names/emails/template names, large text, mobile keyboard, landscape, safe areas, sticky-footer reachability and no horizontal page scroll.
8. Motion/assets: reduced motion, interrupted/reversed rotation, pointer cancellation, simultaneous vertical scroll, unsupported/large/multiple images, storage failure and production performance profiling.

These are planned release checks. They are not all claimed as executed during this audit.

## What is worth retaining

- The three primary destinations are understandable and stay compact on mobile.
- Main Overview reflows at the sampled widths; mobile text inputs compute to 16 px.
- The mannequin provides spatial measurement context, with a list alternative in the broader UI.
- The current rotation code includes keyboard input, reduced-motion detection and pointer-cancellation handling; preserve these during visual reconstruction.
- Shared Input has label/error support, and toasts use live announcements. Extend these foundations to custom controls.
- Client deletion already has confirmation; template removal has Undo. Improve consistency rather than assuming every destructive action lacks protection.
- Export already includes a schema version and settings, which is a useful base for actual recovery.
- Primary blue #1D49E8 has approximately 6.62:1 contrast against white; preserve this strength while repairing faint supporting text.

## Suggested skill passes

1. `$impeccable harden` — persistence, data semantics, validation, dialogs and recovery.
2. `$impeccable adapt` — mobile field parity, narrow Settings layout and touch targets.
3. `$impeccable clarify` — action labels, validation, status language and destructive copy.
4. `$impeccable layout` and `$impeccable typeset` — task hierarchy, alignment, spacing and legibility.
5. `$impeccable optimize` and `$impeccable animate` — measured performance and consistent reduced-motion behavior.
6. `$impeccable document` — shared tokens and interaction contracts.
7. Re-run `$impeccable audit` to verify functional/accessibility repairs, then finish with `$impeccable polish`.

You can ask for these one at a time, all at once, or in any order. Dependency order above is recommended because visual changes cannot compensate for incorrect saved records.
