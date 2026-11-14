# Landing revision — 13 November 2026

Design source: Figma file A48UWm2f2jLr05iXak67wZ, node 724:939. Used Figma design context and screenshot, and downloaded original assets to public/assets/landing/revision.

Implemented the new hero artwork, inset blue CTA/button styling, workflow borders/backgrounds and wide order-details visual, original feature screenshot assets, pricing, testimonial cards, constrained rounded CTA banner, and redesigned footer/contact details. Navigation includes pricing and testimonials. Preserved the app's mannequin and controls.

Kept the user-confirmed Solo name where the Figma design inconsistently uses Creator. Omitted claims of public order links because the current invoice links are private. Paid plan CTAs lead to account creation with a clear coming-soon notice; no checkout or subscription enforcement is implemented by this landing-page task.

Pricing uses the unchanged monthly base multiplied by 12 and then by 0.9. Solo: ₦10,000 monthly / ₦108,000 yearly, saving ₦12,000. Fashion House: ₦40,000 monthly / ₦432,000 yearly, saving ₦48,000. Annual totals are labelled per year, with monthly equivalents separately identified. Free stays ₦0.

Testimonials use the names, quotes and rating artwork supplied in Figma. Side cards start at -10/+10 degrees and animate to zero in view. Motion respects reduced-motion preference. Existing restrained section reveal behaviour is retained pending the actual animation reference video: the attachment supplied in this request was a PNG still, which cannot establish scroll timing or choreography.

FAQ questions/answers come from the new Nigerian-audience PRD, with pricing updated to the Figma amounts and explicit checkout availability. Removed outdated footer claims of local-first storage and zero data leakage.

Verification:
- Pricing unit calculations passed for monthly, annual, savings and free tiers.
- Browser toggle passed in both directions with correct annual amounts and labels.
- No horizontal overflow at 320, 390, 768, 1024 and 1440px after correcting an inherited feature-image minimum height.
- Browser FAQ expansion displayed the new internet/draft explanation.
- Browser inspection found no broken loaded images. Original SVG dimensions retained.
- Source TypeScript and changed-file lint passed. Initial general type checking exposed stale generated exploration-route types; only that obsolete generated directory was removed before the project type check passed.
- Impeccable detector returned no findings for the landing page and new pricing/testimonial components.

The production build passed compilation, type checking, page generation and tracing. Final browser checks verified monthly/yearly reversal, new FAQ expansion, all five widths without overflow, and testimonial rotation returning to the original ±10 degrees offscreen. Reviewed desktop hero, pricing, testimonials, CTA/footer and mobile FAQ. The reusable calculation test is `node scripts/test-landing-pricing.mjs`.

Reduced-motion behaviour has code handling but has not been emulated in the browser. Terms/Privacy destinations remain deferred existing 404s; legal text was not invented. Exact video-reference scroll motion awaits a playable reference: attachment metadata confirmed a single-frame PNG, 681 × 477. No claim of a perfect match or fully enabled billing is made. Preview: http://localhost:3006/.


## Follow-up: adopted scroll reveals and revised prices

The user replaced the missing-video requirement with Framer Motion scroll reveals. LandingMotion now uses useInView and useAnimate: entrances play once, move 20px (hero 12px), fade from 0.72 to 1 over 600ms (hero 500ms), and use the shared ease-out curve. Card staggering is capped at 120ms. Default HTML content is visible; reduced motion skips entrances, and tab visibility pauses playback. Sticky feature layout remains intact. Testimonials retain their existing independent tilt animation.

Solo is now ₦5,000 monthly / ₦54,000 yearly, saving ₦6,000. Fashion House is ₦10,000 monthly / ₦108,000 yearly, saving ₦12,000. FAQ and calculation tests were updated. Browser testing confirmed the new annual values, monthly equivalents and no overflow in the inspected mobile viewport. Exact video imitation is no longer pending.
