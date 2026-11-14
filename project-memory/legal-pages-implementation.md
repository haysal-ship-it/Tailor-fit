# Terms and privacy pages — 14 November 2026

The owner approved proceeding after supplying survey answers and reviewing competitor-informed policy proposals. Implemented public `/privacy` and `/terms` routes, with shared server-rendered legal-page layout and content in `lib/legal-content.ts`.

Layout follows the reference's plain-language numbered structure, using TailorFit Manrope, blue buttons, neutral surfaces and logo. Added desktop sticky contents, mobile stacking, anchor navigation, visible keyboard focus, contact links, reciprocal legal links, print styling and route metadata. Long-form legal text has no entrance animation. Existing landing and authentication legal links now resolve to these routes.

Public copy includes the confirmed operator/email, adult account rule, prohibited reference images, conditional invoice-email processing, provider names and service-purpose processing. It omits editorial placeholders and invented business addresses. It does not promise an implemented Settings account-deletion flow, fixed deletion/backup deadlines, automated upload moderation or paid checkout. Account closure uses the confirmed contact email.

Operational follow-ups remain: usable service/correspondence address and applicable disclosure requirements; actual infrastructure regions and transfer arrangements; provider-specific log/backup periods; verified closure/file-cleanup and privacy-request procedures; jurisdiction-appropriate legal review. Competitor recommendations do not establish compliance or implement those procedures. No claim of regulatory certification or completed compliance is made.

Verification: both routes returned HTTP 200; browser checked desktop privacy and mobile terms, confirmed 11 privacy sections / 12 terms sections and the 18+ rule; all contact links use haysal618@gmail.com; tested the retention contents anchor (24px top offset); no horizontal overflow at 320/390/768/1024/1440px. TypeScript, new-file lint and the interface detector passed. The final production build passed compilation, type checking, all 16 static pages and build tracing, including both new legal routes.

## Shared navigation update
- Privacy and Terms now use the same LandingNavbar component as the homepage, including the animated nav underline and responsive account actions.
- Section links resolve to homepage anchors from either legal page. The previous legal-only header switcher was removed; legal footer links remain available.
- Policy intro clearance, section anchor offsets, and sticky table-of-contents position account for the floating header. Navigation is hidden in print.
- Verified no horizontal overflow at 320, 390, 768, 1024 and 1440px, cross-page Features navigation, Escape dismissal and focus restoration.
