# Landing-page refinement — validation

Completed 8 November 2026. Based on the approved subtle-polish plan and Git baseline `517b441`.

## Delivered

- Consistent landing typography, locally served Instrument Serif, normal-flow hero spacing, and responsive section layouts.
- Original mannequin screenshot cropped for phones and Measurements; no model or workspace control changes.
- Readable client/order illustrations, quieter feature backgrounds, and a responsive illustrated footer.
- Brief preview/workflow entrances, interruptible FAQ expansion, menu entry/exit, and scroll-linked feature indicators.
- Reduced-motion support; decorative backgrounds remain static on touch and pause offscreen or when the document is hidden.
- Skip link, main landmark, keyboard focus, menu Escape handling, accessible FAQ relationships, and anchor offsets.
- Seven WebP derivatives total 357,430 bytes. Original image assets are retained. The two noise textures total 28,636 bytes, versus 10,931,484 bytes for the originals.

## Verification

- Isolated production build: passed, all 12 static pages generated.
- TypeScript: passed. Lint for all changed code files: passed.
- Impeccable typography and layout scans: no findings.
- Browser check results: [after/checks.json](after/checks.json). Includes desktop/mobile layout, menu/FAQ behavior, navigation focus, loaded fonts, layout stability, offscreen motion, real coarse-pointer emulation, reduced motion, resource errors, and browser exceptions.
- Viewports: 320×900, 390×844, 768×900, 1024×900, 1440×900, and 844×390 landscape. A 720×450 CSS viewport verifies reflow equivalent to 200% browser zoom on a 1440×900 screen.
- Chrome screenshots were visually reviewed. The 320px navigation wrap found in review was corrected and rechecked.
- Full-project lint still reports **33 existing errors and 8 warnings** in unchanged code, including the legacy unused shader, mannequin rig, onboarding, screens, and store. These do not block the production build; the existing Next configuration skips lint during builds.

Before screenshots are in `before/`; final screenshots and machine-readable results are in `after/`. The before captures show the correctly rendered pre-refinement page, rather than the stale preview server with missing CSS.

## Reproduce

PowerShell, from the repository root:

```powershell
$env:TAILORFIT_DIST_DIR = '.next-landing'
npm run build
npm run start -- --hostname 127.0.0.1 --port 3002
```

In a second terminal:

```powershell
node scripts/verify-landing.mjs
```

Preview: http://127.0.0.1:3002/landing

The verifier uses installed Chrome on Windows. Override `CHROME_PATH` or `LANDING_URL` when needed. `scripts/optimize-landing-assets.mjs` regenerates the image derivatives using the installed Sharp package.

The optional `TAILORFIT_DIST_DIR` setting isolates validation from existing development servers; normal builds retain `.next`. The isolated output is excluded from Git and ESLint. Next may update generated TypeScript references when switching output folders; validation-only edits to those references were restored after the build. Existing `tsconfig.tsbuildinfo` changes are generated cache data.

No deployment or Git commit was made. Browser validation covers Chrome; Safari, Firefox, and physical-device performance remain unmeasured.
