# Solva-style section motion

Reference: https://solva-template.framer.website/ . Inspected its public Framer appear-animation payload. Hero subtitle/CTA use 16px upward travel, opacity 0.001 → 1, a 1.2-second spring with bounce 0.1, and delays of 0.4/0.5 seconds. Adapted these settings to TailorFit rather than importing reference styling or content.

New SolvaReveal component is used only by hero, How it works, pricing and testimonials. Hero sequences heading, subtitle, CTA and preview. Section/card entrances trigger once. Existing testimonial tilt remains independent. Default HTML stays readable if animation initialization fails. Reduced motion skips entrances; keyboard focus stops an entrance and immediately restores full visibility; hidden tabs pause playback; completed entrances do not restart on tab visibility changes.

FeaturesSection.tsx and LandingMotion.tsx were byte-for-byte unchanged during this task, verified with before/after file hashes. Browser DOM confirmed zero Solva reveal wrappers in Features and its four original reveal wrappers remain. FAQ, CTA and footer keep their prior animation implementation.

Validation: TypeScript, changed-file lint and diff whitespace checks passed. Browser confirmed 17 scoped reveal wrappers, settled hero opacity 1 with identity transform, no reported console errors, and no overflow at 320/390/768/1024/1440px. Reduced-motion handling is implemented but was not browser-emulated. No frame-rate benchmark or pixel-identical timing claim is made. Local preview: http://localhost:3006/ .
