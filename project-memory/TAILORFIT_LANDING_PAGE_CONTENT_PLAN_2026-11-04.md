# TailorFit landing page — sections, UX copy and navigation

Prepared 4 November 2026. Status: proposed content/design plan; no landing page implemented.

## Direction and audience

The page is for independent tailors, dressmakers and studio assistants who need to keep client measurements and garment orders organized. The primary outcome is opening the TailorFit workspace. The secondary outcome is understanding its workflow before entering.

Lead with the relationship between clients, measurements and orders. Use the mannequin as product evidence, and explain that measurements are entered by the tailor. TailorFit is not being positioned as a body scanner or automatic measuring service.

Recommended headline: **Made to measure. Built to keep you organized.** This was a previous copy recommendation, not a headline already selected by the user.

Voice: practical, confident and familiar with tailoring. Prefer client, fitting, garment, measurements, order and due date. Use garment template rather than blueprint. Avoid promising perfect fit, guaranteed delivery, automatic measurement, cloud synchronization or features not verified in the product.

## Page structure

Header → Hero → How it works → Measurements → Client records → Orders and due dates → FAQ → Closing CTA → Footer.

The three product stories sit within one Features region. This creates a clear progression without a long navigation bar or repeated generic feature grids.

## 1. Header and navigation

| Item | Label | Destination / behavior |
|---|---|---|
| Logo | TailorFit | Top of landing page; accessible name “TailorFit home” |
| Product link | Features | `#features`, at the start of the measurement/client/order story region |
| Workflow link | How it works | `#how-it-works` |
| Questions link | FAQ | `#faq` |
| Primary action | Open TailorFit | Actual workspace route; same tab |

Use a light header with the existing origami logo and blue primary pill. A sticky header is appropriate if it stays compact and does not obscure content. Anchor destinations need scroll margin and meaningful heading focus handling.

Mobile: logo, primary action if space allows, and a menu button. If all three cannot fit at 320 px, put Open TailorFit at the top of the menu and keep the hero CTA prominent. Menu labels: Features, How it works, FAQ, Open TailorFit. Accessible toggle names: “Open navigation” and “Close navigation”; Escape closes and returns focus. Selecting an anchor closes the menu.

Do not add Pricing, Sign in, Book a demo, Download, Contact or external social links until the actual offer and destination exist. The reviewed app currently opens directly into a workspace and contains browser-local persistence; no login/pricing flow was found in the active routes inspected for this plan.

## 2. Hero

**Eyebrow**

For tailors and dressmakers

**Headline**

Made to measure. Built to keep you organized.

**Supporting copy**

Keep client measurements, style references and garment orders in one workspace. Use an interactive mannequin to record each fitting and find the details you need for the next order.

**Primary action:** Open TailorFit

**Secondary action:** See how it works → `#how-it-works`

**Short capability line:** Client records · Visual measurements · Order tracking

### Visual treatment

Use a large, real product composition showing the original mannequin and its control panel with a compact measurement list or client context. Keep the mannequin's proportions, texture and approved appearance intact. Do not use the experimental reconstruction as an approved marketing asset by default.

If the real viewer is stable enough to embed, offer an explicit “Explore the mannequin” action that loads it on demand. Start with a faithful static preview to keep the landing page responsive. Do not add a heavy second viewer on initial page load, autonomous rotation or image-crossfade rotation. Keyboard controls and a static fallback are required for any interactive version.

Use fictional sample records consistently, marked “Example client”. Example name: Amara Okafor; garment: Shirt. Do not expose actual client contact details or imply sample values are recommended measurements.

## 3. How it works — `#how-it-works`

**Heading**

From client details to the next fitting.

**Introduction**

A simple workflow for recording measurements and keeping each garment order connected to the right client.

| Step | Heading | Copy |
|---|---|---|
| 01 | Add your client | Enter their contact details and the garment you're making. |
| 02 | Record the fitting | Choose a garment template, then enter measurements on the mannequin or in List view. |
| 03 | Keep the order together | Add style references, price and a due date. Return to the client's record when you need them. |

Visual: three cropped views of the actual workflow with restrained numbered captions. On mobile, stack them in order; no carousel is required. Explain progress with the screenshots, not decorative arrows alone.

This is a landing-page explanation. Do not label the anchor CTA “Take a tour” unless it actually starts the in-app tour. A future “Take the app tour” action must have an explicit working handoff into onboarding.

## 4. Measurements — start of `#features`

**Eyebrow:** Measurements

**Heading**

See where every measurement belongs.

**Body**

Rotate the mannequin to view each angle, select a measurement point and enter its value. Choose a garment template to bring up the fields you need, or switch to List view for keyboard entry.

**Supporting labels**

- Rotate to inspect each angle
- Choose measurements by garment
- Enter values on the diagram or in a list

**Clarifying helper**

Take measurements with your tape, then record them in TailorFit.

Visual: the existing viewer and a close view of one measurement input, with the real unit visible. Keep the explanatory helper near the visual so a visitor does not mistake the mannequin for a body-scanning feature.

No extra CTA is necessary here. Let the product image and explanation carry the section.

## 5. Client records

**Eyebrow:** Client records

**Heading**

When your client returns, their details are ready.

**Body**

Keep contact details, saved measurements and order history together. Review an earlier fitting and use its measurements as the starting point for a new garment.

**Supporting labels**

- Contact details in one place
- Saved fittings to refer back to
- Measurements you can reuse

Visual: an actual client workspace showing Saved Measurements and Order History for the same fictional client introduced in the hero. Include a readable fitting date. Demonstrate the reuse action rather than inventing a customer profile design.

Editorial note: reusing values should not imply that a client's measurements never change. “Starting point” makes room for a new fitting and verification.

## 6. Orders and due dates

**Eyebrow:** Orders

**Heading**

Know what's in progress and what's due.

**Body**

Keep the garment brief, reference images, price and due date with each order. Review its status and use the calendar to see the work coming up.

**Supporting labels**

- Style references alongside order notes
- Status updates as work progresses
- Due dates in the calendar

Visual: one actual order card beside a cropped calendar, using consistent status and dates. Avoid fake activity, unread notification counts or analytics charts that the app does not provide.

Price storage does not imply payment collection, invoicing or accounting. Calendar display does not imply reminders, SMS or guaranteed on-time completion.

## 7. FAQ — `#faq`

**Heading**

A few things before you start.

Use an accessible accordion with native buttons, expanded state and keyboard support. Four to six questions is enough; recommended copy follows.

### Who is TailorFit for?

TailorFit is designed for tailors, dressmakers and studio assistants who manage client measurements and garment orders.

### Does the mannequin take measurements automatically?

No. You take the measurements yourself and enter them in TailorFit. The mannequin helps you see which part of the body each measurement belongs to.

### Can I reuse a client's measurements?

Yes. Open the client's saved measurements and use them to start another order. Check that the measurements are still current before making the new garment.

### Can I use TailorFit on my phone?

TailorFit has layouts for phone and desktop browsers. You can use List view to enter measurements on a smaller screen.

Publication gate: verify the shipped mobile flows on actual supported browsers. Do not expand this into “works on any device” or an untested installed-app claim.

### Where are my records stored?

Your records are currently stored in the browser you use on this device. They do not automatically appear on another device, and clearing browser data can remove them. Export a backup from Settings to keep a separate copy.

### Can I back up my work?

Yes. Settings lets you export your workspace as a backup file and restore a backup later. Keep a recent copy somewhere you can find it.

Publication gate: export/restore exists in current source, but it must pass a real round-trip test before these statements ship. Update storage copy if the product changes to a verified cloud model.

Do not turn this into an unsupported broad privacy promise such as “nothing ever leaves your device.” Browser-local business storage alone does not establish the behavior of every network request.

## 8. Closing CTA

**Heading**

Give every fitting a place to come back to.

**Body**

Bring your client details, measurements and next garment order together in TailorFit.

**Primary action:** Open TailorFit

Use a calm, spacious closing section with the existing blue button and a small product detail if useful. No email capture or account form is needed for the current direct-access app. Repeat the same primary action label as the header and hero.

## 9. Footer

**Brand line**

TailorFit — Client measurements and garment orders, together.

**Links**

Features · How it works · FAQ · Open TailorFit

**Copyright**

© {current year} TailorFit.

Add Privacy, Terms and a support contact only once their actual content/destinations are provided and verified. No placeholder `#` legal links or invented email address. A concise footer fits the current product better than several empty link columns.

## 10. Design and mobile guidance

- Preserve the app's identity: Manrope, black/near-black headings, white and soft-gray surfaces, blue #1D49E8 primary actions, existing logo and pill buttons.
- Give marketing copy more room than the dense app: suggested content width 1120–1200 px, 80–112 px desktop section spacing, 48–64 px on phones; consistent 16–24 px mobile gutters.
- Suggested type: fluid hero heading around 40–64 px, section headings 28–40 px, body 16–18 px with comfortable line height. Verify line wraps at 320 px and 200% zoom.
- Prefer an editorial sequence of product evidence: a large hero composition, three-step workflow, then focused product stories. Avoid placing every section inside the same rounded feature-card grid.
- Keep sample product text readable. Crop to the relevant interaction instead of shrinking a full desktop screen into an unreadable phone thumbnail.
- Maintain copy-first reading order when image/text alternation collapses to mobile.
- Keep primary controls comfortably tappable, visible focus states strong, and all anchor destinations below the sticky header.
- Use short, restrained reveals only if they improve comprehension. No scroll hijacking, constant parallax or automatic mannequin rotation. Reduced-motion users get the full content immediately.
- Never present illustrative screen controls as functioning UI. If a preview is interactive, name the action and supply keyboard support.

## 11. Content and launch decisions

Settled recommendations for this first version:

1. Primary CTA: Open TailorFit; secondary CTA: See how it works.
2. Header links: Features, How it works, FAQ.
3. Product evidence replaces unverified social proof. Do not invent testimonial quotes, user counts, customer logos, time-saved statistics or fit-accuracy claims.
4. Pricing and account-signup sections are deferred until the business model and working flows are supplied. Do not imply free forever, a trial, no credit card or subscription availability.
5. Phone/desktop support and backup copy have release verification gates; no new security or privacy guarantees are being added.

Routing proposal for implementation: build/review the landing page at an isolated route first, keeping the existing root workspace available. A potential final structure is landing at `/` and workspace at `/app`, but neither that migration nor those links exist yet. Choose the final route explicitly during implementation, preserve existing query-based navigation and browser-local data, and test redirects before publishing. Every Open TailorFit link must point to the same verified workspace destination.

## 12. Required assets and acceptance checklist

Prepare accurate screenshots or faithful static compositions of:

- The approved original mannequin with its real controls.
- A selected template and one measurement field with unit.
- A client record with saved measurements and order history.
- An order with style references and a due date visible in the calendar.

Use one fictional client throughout and identify demo data as examples. Do not capture sensitive real records. Reuse existing original mannequin assets after visual verification; do not generate a visually different model for marketing.

Before publishing:

- A visitor can identify the audience, purpose and next action from the hero alone.
- The mannequin is clearly a visual recording aid, not an automatic body scanner.
- All three navigation anchors land correctly and primary links open the intended workspace.
- Claims match real saved-data, unit, reuse, date, status and backup behavior.
- Header, mobile menu and FAQ are keyboard-accessible; contrast and reduced motion are checked.
- Product images remain legible on mobile and have appropriate alt text.
- No real client data, invented testimonials, broken footer links or unsupported pricing claims appear.
- The landing page does not alter mannequin geometry, overwrite work in the existing app, or force the in-app tour to start merely from scrolling a marketing section.

## Evidence and status

This plan uses the product context established in the audit/tour work and source inspected on 4 November 2026. Current source includes TourProvider integration, saved measurements/order history, calendar/order fields and export/restore UI. This planning task did not verify those flows in a live browser or certify the previous audit repairs. Landing-page content remains proposed copy until reviewed and implemented.
