# TailorFit website PRD — Nigerian audience

Version: 1.0 · 13 November 2026
Status: Proposed content and implementation brief; pricing and customer evidence require approval.
Surface: Public marketing website at `/`.

## 1. Purpose and positioning

Help Nigerian tailors, dressmakers and fashion designers understand TailorFit, explore the workspace, and create an account to save their client records online.

Positioning: **A digital workspace for client measurements, records and tailoring orders.**

Primary audience: independent tailors and fashion designers managing made-to-measure work. Secondary audience: dressmakers and owners of small fashion businesses. Do not imply shared staff accounts, permissions or collaboration: each account currently owns its own workspace.

Jobs to address:
- Find the right client's measurements when they return.
- Keep client contacts, fittings and garment references together.
- Review orders and pickup dates during busy periods.
- Start using the product without a lengthy setup.

Primary conversion: open the workspace. Secondary conversion: create an account. Activation measure: first successfully saved client and fitting, followed by an order. Opening the app alone does not count as activation.

## 2. Voice and Nigerian localisation

Use clear, warm, professional English. Prefer “organise”, “colour”, “client”, “tailor”, “fashion designer”, “measurements” and “pickup date”. Explain specialist terms when necessary. Avoid forced Pidgin, jokes about unreliable tailors and stereotypes about Nigerian businesses.

Use familiar examples selectively: aso-ebi outfits, native wear, bridal gowns and everyday bespoke clothing. These are example garment descriptions, not claims that specialised garment templates already exist.

Use ₦ for illustrative order prices and approved Nigerian subscription prices. Distinguish an order price from the price of TailorFit. Support both inches and centimetres in product examples. Use unambiguous dates such as “21 Nov 2026”. Never display a real client's contact details or measurements in marketing screenshots.

Hypotheses to validate with users: phone-first browsing, preference for familiar measurement units, and the importance of finding repeat-client records quickly. Do not turn these hypotheses into market statistics.

## 3. Page structure and navigation

Section order: **Hero → Features → How it works → Testimonials → Pricing → FAQ → CTA banner → Footer.**

Desktop navigation: Features · How it works · Pricing · FAQ. Keep the same order in the mobile menu. Testimonials remain a page section without adding another primary navigation item.

Guest actions: “Log in” → `/signin`; “Open TailorFit” → `/app?tab=overview`.
Signed-in actions: “Open workspace” → `/app?tab=overview`; replace the login link with the account/workspace action.
Account creation links: `/signup`.

Anchor IDs: `features`, `how-it-works`, `testimonials`, `pricing`, `faq`. Offset anchors beneath the floating header. Hide the testimonial anchor if that section has no approved content.

## 4. Hero

**Purpose:** Explain the product and its audience immediately, then make exploration easy.

**H1:**
> Tailoring software for Nigerian fashion businesses.

**Body:**
> Keep client measurements, contact details and garment orders in one workspace. From aso-ebi outfits to everyday bespoke wear, TailorFit helps you organise the details behind each fitting and pickup.

**Primary CTA:** Open TailorFit

**Secondary CTA:** See how it works

**Supporting line:**
> Explore the workspace. Create an account when you’re ready to save your records online.

**Visual:** Real product preview featuring the original mannequin and its controls. On mobile, use a legible crop rather than shrinking an entire desktop screen. Show only synthetic client data. Suggested preview labels: “Aso-ebi gown”, “Measurements in inches”, “Pickup: 21 Nov 2026”.

**Requirements:** One H1; copy and CTA visible without waiting for animation. Primary CTA opens guest or authenticated workspace appropriately. Do not claim automatic body scanning or measurement capture.

## 5. Features

**H2:**
> Measurements, client records and orders. All together.

**Intro:**
> Give every client a record you can return to, from their first measurement to their next outfit.

### Feature 1: Body measurements

**H3:** Keep every measurement with the right client.

**Body:**
> Take measurements with your tape as usual, then record them on TailorFit’s interactive mannequin or in List view. Save sizes in inches or centimetres and reuse a saved fitting when a client returns.

**Supporting labels:** Interactive mannequin · Diagram and List views · Saved fittings

**Visual:** Original mannequin with a small number of clearly labelled saved values. Preserve its appearance and control panel. Include a visible “Example measurements” label if the surrounding context could imply real customer data.

### Feature 2: Client records

**H3:** Remember the details behind every fitting.

**Body:**
> Keep names, phone numbers, email addresses, notes and saved measurements in one client profile. Open their order history when you need to check an earlier garment.

**Supporting labels:** Contact details · Fitting records · Order history

**Visual:** A synthetic client profile with clear contact and fitting information. Avoid unrelated stock portraits and tiny screenshot text.

### Feature 3: Orders and due dates

**H3:** Know what’s in progress and what’s due next.

**Body:**
> Keep each garment’s brief, style references, price and pickup date together. Review order status and upcoming dates so you can plan the work ahead.

**Supporting labels:** Style references · Order status · Pickup dates

**Visual:** Example garment order with a naira price, status and explicit date. Label the amount “Order price” so it cannot be mistaken for subscription pricing.

**Publication guardrail:** Invoices may be introduced as a supporting benefit after signed-in download verification. Keep email-invoice claims out of public copy until the verified sender and receipt test are complete. Do not promise SMS, WhatsApp messages, automated reminders, payments, inventory management or staff roles.

## 6. How it works

**H2:**
> From first measurement to the next pickup.

**Intro:**
> Follow the way you already work, with a place to keep the details.

**Step 1 — Add your client**
> Create an account, then save your client’s name and contact details. Their measurements and orders stay connected to their profile.

**Step 2 — Record their measurements**
> Enter the sizes you take with your tape measure. Use the mannequin or List view, and save the fitting for future outfits.

**Step 3 — Create and track the order**
> Add the garment, reference images, price and pickup date. Update its status as work moves towards collection.

**CTA:** Open TailorFit

**Layout:** Three steps across on wide screens; stacked in the same reading order on mobile. Use real product visuals and readable captions. Do not add account creation to the guest exploration path: the steps describe saving real work.

## 7. Testimonials

**H2:**
> In the words of the people doing the fittings.

**Intro:**
> Hear how tailors and fashion designers use TailorFit in their daily work.

**Status:** This section is conditional. No verified testimonials were supplied for this PRD. The introduction becomes publishable only when actual approved customer stories are available.

**Required content per testimonial:** Customer's exact approved quote; approved display name; role or business name; city if voluntarily supplied; approved portrait or logo if available. Keep consent and the source of the quote in internal records.

**Internal content template — never publish as a customer quote:**
> [Approved quote describing a specific task and the customer's experience.]
> [Approved display name] · [Role/business] · [City, if approved]

**Collection prompts:** What did you use before? Which task changed after using TailorFit? Can you describe a specific example? Publish numerical results only when substantiated and approved.

**Fallback:** Hide the entire section until approved quotes exist. Continue directly from How it works to Pricing. Do not fill it with invented names, stock identities, star ratings, “trusted by thousands” or anonymous placeholder endorsements.

**Layout:** Two or three readable quotes in a grid or vertical stack. Avoid an autoplay carousel that hides the evidence.

## 8. Pricing

**H2:**
> A plan for every stage of your fashion business.

**Body:**
> Start with Free, organise your independent practice with Solo, or choose Fashion House for a larger client book and order workload.

**Status:** The three tier names and monthly prices are confirmed: Free ₦0, Solo ₦5,000 and Fashion House ₦10,000. Yearly billing is monthly × 12 × 0.9. Benefits and quotas remain proposed; billing requires implementation.

### Free

**Headline:** Start with your first clients.

**Body:**
> Bring your client details, measurements and garment orders into one workspace as you get started with TailorFit.

**Price:** ₦0

**Proposed inclusions:**
- Client profiles and contact details.
- Interactive mannequin and List view.
- Measurements in inches or centimetres.
- Saved fittings, garment orders and pickup dates.
- An introductory allowance of clients, orders and image storage; limits to be approved.

**CTA:** Get started free

**Destination:** `/signup`; signed-in visitors open their workspace. Free is an account plan, distinct from exploring without an account.

### Solo

**Headline:** Keep your growing client book organised.

**Body:**
> For independent tailors and fashion designers managing repeat clients, fittings and a steady flow of bespoke orders.

**Price:** ₦5,000 / month. Yearly: ₦54,000, including 10% off.

**Proposed inclusions:**
- Everything in Free.
- Higher client, order and image-storage allowances.
- Garment blueprints and custom measurement fields.
- Downloadable PDF order invoices, subject to release verification.

**CTA:** Choose Solo

### Fashion House

**Headline:** Make room for a busier fashion business.

**Body:**
> For established fashion businesses handling a larger client book and more garment orders, from native wear to bridal and occasion outfits.

**Price:** ₦10,000 / month. Yearly: ₦108,000, including 10% off.

**Proposed inclusions:**
- Everything in Solo.
- The highest client and order allowances.
- More storage for style-reference images.
- Email order invoices after verified sender setup, receipt testing and entitlement implementation.

**CTA:** Choose Fashion House

Fashion House means greater capacity within one owner's workspace. Staff accounts, shared access, roles and branch management need a separate product specification; this plan must not imply they are included.

### Proposed comparison

| Capability | Free | Solo | Fashion House |
|---|---|---|---|
| Client records, measurements and order tracking | Included | Included | Included |
| Client/order allowance | Introductory; TBD | Higher; TBD | Highest; TBD |
| Image-storage allowance | Introductory; TBD | Higher; TBD | Highest; TBD |
| Custom fields and garment blueprints | Proposed exclusion | Proposed inclusion | Proposed inclusion |
| PDF order invoices | Proposed exclusion | Proposed inclusion | Proposed inclusion |
| Email order invoices | Proposed exclusion | Proposed exclusion | Proposed inclusion; release gate applies |
| Workspace ownership | One owner | One owner | One owner |

This is a proposed entitlement model, not a description of restrictions currently enforced by the app. Existing blueprints, custom fields and invoices are not subscription-gated. Define a policy for existing accounts before changing their access.

### Commercial and interaction requirements

- Approve monthly naira prices, exact quotas and whether limits apply to total records or a billing period. Annual billing requires its own confirmed total and terms.
- Define payment methods, renewal, cancellation, refunds and additional charges before publishing purchase CTAs.
- Paid CTAs must open an authenticated upgrade flow that retains the selected plan. Guests create an account, then review that plan and its confirmed price before purchase. Billing and entitlement enforcement are new implementation dependencies.
- Define upgrades, downgrades and access to records above a reduced limit. Preserve saved records; do not silently delete them.
- Display three cards in Free → Solo → Fashion House order; stack in that order on mobile. Make prices and billing periods easy to compare.
- Solo may use the audience label “For independent tailors”. Do not add a “Most popular” badge without evidence.

### Interim publication state

Until paid plans are ready, show **Coming soon** on Solo and Fashion House with **Paid plan pricing will be announced here**. Replace purchase buttons with availability text and offer **Open TailorFit** as the working exploration CTA. Publish “Get started free” only when the approved Free entitlement and terms are implemented.

Never publish the price placeholders. Do not claim unlimited records, free forever, no card required, savings percentages or included team access without confirmation. Keep email invoices subject to the existing release gate.

## 9. FAQ

**H2:**
> Questions before your first fitting?

**Intro:**
> Here’s what to know about using TailorFit for your tailoring business.

**Who is TailorFit for?**
> TailorFit is for tailors, dressmakers and fashion designers who want to organise client measurements, contact details and garment orders. You can use it for work such as native wear, aso-ebi outfits, bridal gowns and other bespoke garments.

**Does the mannequin take body measurements automatically?**
> No. Take measurements with your tape measure, then enter the values on the mannequin or in List view. The mannequin helps you organise the measurements you record.

**Can I save measurements in inches or centimetres?**
> Yes. TailorFit supports both inches and centimetres. Each saved fitting records its units so you can check them when you return to it.

**Can I reuse a returning client’s measurements?**
> Yes. Open their client profile and choose a saved fitting as the starting point for a new garment. Check the measurements with the client before reusing them.

**Can I use TailorFit on my phone?**
> TailorFit runs in a web browser and has layouts for phones, tablets and computers. Open the website to use the workspace.

**Where are my client records saved?**
> Records saved while signed in are stored online in your account’s workspace. Sign in to the same account on another device to access saved records.

**Do I need an internet connection?**
> Yes, you need an internet connection to load and save online records. An unfinished draft may be kept on the device where you started it, but it is not a saved online record. If saving fails, reconnect and retry before leaving.

**Can I explore before creating an account?**
> Yes. You can explore the mannequin and draft measurements without signing in. Creating clients and saving records requires an account.

**How much does TailorFit cost?**
> TailorFit’s planned tiers are Free, Solo and Fashion House. Free is priced at ₦0; prices and allowances for Solo and Fashion House will be announced here. You can explore the workspace before signing in.

Publish the Free statement only when that account plan is available. Replace planned-tier wording with actual prices and inclusions at launch.

Replace the last answer when pricing is approved; it must match the pricing section exactly. Do not retain old claims about offline availability, automatic backups or browser-only storage. Verify account flows in the target production environment before publishing online-storage claims as release-ready.

**Interaction requirements:** Accessible accordion triggers with associated panels, visible focus and keyboard operation. Keep answers available in rendered HTML. An accordion should not make the content dependent on a third-party widget.

## 10. CTA banner

**H2:**
> Make room for the next outfit.

**Body:**
> Bring your client measurements, garment details and pickup dates together, so you can get back to the work on your cutting table.

**CTA:** Open TailorFit

**Supporting line:**
> Explore first. Sign in when you’re ready to save your work.

**Visual:** Existing illustrated brand artwork with clear space around text. Keep contrast sufficient on every crop and preserve the original visual identity.

## 11. Footer

**Brand description:**
> TailorFit helps Nigerian tailors and fashion designers organise client measurements, records and garment orders in one workspace.

**Product links:** Features · How it works · Pricing · FAQ · Open TailorFit

**Account links:** Create account · Log in

**Support:** Add a contact link only after confirming a real support channel and its destination. Add a guide link only when the guide exists.

**Legal links:** Privacy Policy · Terms of Use. These need real, reviewed pages before publication; the current deferred destinations must not ship as broken links.

**Copyright:** © [current year] TailorFit. All rights reserved.

Do not invent a Nigerian office address, WhatsApp number, CAC registration, partner logo or “Made in Nigeria” provenance claim. A Nigerian audience does not establish company location or registration.

## 12. SEO requirements

### Search intent and metadata

Primary topic: **tailoring software in Nigeria**.
Supporting topics: tailoring management software; client measurement app; fashion designer app in Nigeria; tailoring order management; save client measurements; tailoring pickup dates.

These are intent hypotheses, not verified keyword-volume findings. Validate search demand and wording with Search Console data and keyword research when available. Use terms naturally; no keyword-density target and no ranking guarantee.

**Proposed title tag:** Tailoring Software in Nigeria | TailorFit

**Proposed meta description:** Organise client measurements, records and garment orders with TailorFit, a web app for Nigerian tailors and fashion designers. Explore the workspace.

**Social title:** TailorFit — Your tailoring records, together.

**Social description:** Keep measurements, client details and garment orders in one workspace built around the way you work.

**Social image:** Branded product screenshot using synthetic data, with legible text and the original mannequin. Set dimensions and accessible fallback content.

### Content and indexing

- Serve the landing page at `/`; redirect `/landing` to it and use the final production homepage as the canonical URL. Do not invent a final domain.
- Set document language to `en-NG`. Keep the same useful content for Nigerian visitors and search crawlers. Use language-region alternatives only if actual translated/localised pages are created.
- Render one descriptive H1, section H2s and feature/step H3s. Include essential copy in the initial HTML.
- Use descriptive link text, meaningful image alternatives and empty alt text for decorative artwork. Example product alt: “TailorFit workspace showing saved body measurements and a garment order.”
- Publish a sitemap of canonical public pages and configure robots rules intentionally. Exclude private workspace and account utility pages from search indexing as appropriate; authentication remains the access control for records. Robots directives do not secure client data.
- Avoid thin city pages for Lagos, Abuja or Port Harcourt. Add location content only when it supplies real, distinct information.
- Use factual Organisation or software structured data only after checking its current requirements and the actual entity details. Do not invent ratings, reviews or offers. Do not promise FAQ rich results.
- Verify indexing and page rendering through Search Console after release. Review search queries and conversions after enough data accumulates.

SEO direction follows Google's emphasis on useful content, clear titles, crawlable links and understandable page structure: [Google Search Central SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

## 13. Design, accessibility and performance

Preserve TailorFit's blue sky, floating navigation, serif accent, original mannequin/control panel and illustrated footer. Use product evidence to explain features. Keep section spacing and type hierarchy consistent with the existing landing design.

Verify 320, 390, 768, 1024 and 1440px widths. Make product previews legible, allow long names and naira amounts to wrap, and avoid horizontal scrolling. Keep touch targets at least 44px. Provide a skip link, visible focus, sufficient text contrast and properly associated form labels.

Use restrained entrances and respect reduced motion. Avoid autoplay testimonial sliders, scroll hijacking and animation that delays reading. Optimise screenshots and illustrations, reserve their dimensions and lazy-load below-the-fold artwork. Do not load the full interactive mannequin engine merely to show a landing-page screenshot.

## 14. Measurement and acceptance

Track: hero CTA, workflow CTA, banner CTA, signup initiation, completed signup and first successful saved client/fitting/order. Record button placement as an event property; never send names, emails, phone numbers, measurement values, reference images or notes to marketing analytics. Use an approved analytics/privacy configuration.

Establish a baseline before setting numerical conversion or traffic targets. Review search impressions, qualified clicks, workspace opens, signup completion and activation separately.

Release acceptance:
- All eight requested sections have approved content or an explicit conditional state; testimonials require real evidence and pricing requires an approved commercial decision.
- Hero explains product, audience and next action immediately.
- Measurements, client records and orders/due dates appear under Features.
- Every CTA and navigation link reaches a working destination, with appropriate guest/authenticated behaviour.
- FAQ accurately distinguishes online records, local drafts and manual measurements.
- No unverified testimonials, savings claims, security guarantees, automatic-backup promises or unavailable integrations appear.
- Metadata, canonical URL, headings, image alternatives and indexing rules are verified on the final domain.
- Mobile layout, keyboard access, reduced motion, responsive image loading and layout stability pass review.

Outstanding approvals: actual pricing/access terms; authentic testimonials and consent; final domain; support contact; working Terms/Privacy pages; production account-flow verification. Email-invoice marketing waits for its separate release gate. This PRD changes no live website or billing behaviour.
