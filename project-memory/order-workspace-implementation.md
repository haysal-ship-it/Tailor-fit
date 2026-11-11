# Order workspace and invoices — implementation record

The order-history grid now opens an in-page workspace, with view/edit/create modes, profile-prefilled contact details, an Options menu, invoice review/download, and confirmed deletion. The original mannequin assets and interaction rendering are preserved. Order routes use `/app?tab=clients&client=<id>&order=<id>`; new orders use `order=new`.

## Implementation

- `components/orders/OrderWorkspace.tsx`: shared create/view/edit surface, diagram/list switching, account-bound drafts, saved-fitting selection, garment blueprints, editable custom sizes, references and captions. Client contact edits target the selected client's profile. Cancel and navigation guard unsaved changes. Failed saves retain the draft.
- `components/Workspace.tsx`: route integration and browser navigation; order opening no longer mounts the legacy side sheet. Explicit client selection replaces first-client fallback.
- `components/ui/ChoiceMenu.tsx`: shared menu/listbox, actual-value checkmarks, keyboard navigation and Escape handling, viewport-aware positioning with a 4px trigger gap. Saved-measurement selectors use this component. Shared semantic field tokens cover inputs, textareas, native selects and shared select triggers.
- `lib/invoices/server.ts`: authenticated, owner-scoped assembly of saved order/client/fitting records. Prices, recipients and storage paths are server-owned. Missing linked records and unavailable images fail explicitly. Fingerprints detect stale reviews.
- `lib/invoices/pdf.tsx`: one server renderer for preview, download and email; local Manrope fonts, original front/back mannequin assets with matching numbered sizes, automatic A4 table wrapping, repeated headings, page numbers, and proportional reference images. Currency codes avoid unsupported currency glyphs. Internal notes are excluded. Fixed document metadata makes retry payloads reproducible.
- `app/api/orders/[id]/invoice/route.ts`: private, non-cached preview/download and review metadata.
- `lib/invoices/actions.ts`: reviewed-fingerprint validation, recipient validation, Resend PDF attachment and request idempotency. Reports provider acceptance, not delivery.
- `20261108141632_order_invoice_sends.sql`: applied to Supabase project `rgmgaygfzrcvbdygnmbb`. Owner-scoped ledger with guarded reservation/completion functions, immutable client-side history, serialized five-per-order/hour reservations and bounded retry age.
- Deletion uses the existing version-checked transaction and attachment cleanup queue. No eager storage-file deletion was added; shared references must remain safe. The pre-existing backend does not yet contain a deployed cleanup worker, so queued file cleanup still needs that separate backend follow-up.

## Verification evidence

- Earlier TypeScript and focused lint passed; the final focused lint run also passed without warnings.
- SQL rollback tests passed for same-request reuse, accepted status, the five-per-hour limit, denied direct ledger deletion, cross-account history isolation and cross-account reservation rejection. Test data was rolled back.
- Initial PDF generation passed for both genders, 47 custom sizes, six references, missing values and zero price. Files are in `project-memory/order-workspace-evidence/`.
- Inspected the rendered female invoice: original mannequins and numbered landmarks appear correctly. Long-table pagination was subsequently changed to automatic wrapping to avoid sparse overflow pages.
- The Impeccable mechanical detector returned no findings for the new workspace/menu/dialog components.
- A production bundle compiled successfully. Its type-check phase subsequently hit host memory exhaustion. A single-process TypeScript rerun passed. Later full-build and expanded PDF retry checks are recorded separately when complete.
- Browser automation could not attach reliably: in-app browser target closed; the Brave navigation attempt timed out. Responsive widths, keyboard interactions, browser Back, signed-in save/delete flows, reduced-motion behavior and live PDF review remain **unverified**, not passed.

## Email release gate

### Verification update — 9 November 2026

- The single-worker production build completed successfully, including TypeScript, all 14 static pages and build traces.
- `npm run test:invoices` passed, including byte-identical repeated rendering for safe provider idempotency. The long invoice has 10 A4 pages, with all 47 measurements and all six images. The rendered size-list page was inspected and has readable rows and page numbering.
- The production invoice endpoint returns HTTP 401 for a signed-out request and `Cache-Control: no-store, private`.
- Browser access recovered. Inspected the new-order form on desktop and mobile. No horizontal overflow at 320, 390, 768, 1024 or 1440px. The client form's measured backgrounds/borders match #F8F8F8/#DDDBDB at every width.
- Browser inspection confirmed a 4px status-menu gap, only the stored status marked selected, arrow-key movement, Escape dismissal and focus restoration.
- The user explicitly chose to continue without signed-in browser testing. Saved-order view/edit/delete, client prefill with real records, stale-review errors and signed-in PDF download/email remain unverified end to end. No customer records or email sends were created for these browser checks.
- The client profile actions menu was subsequently switched to the shared menu component, and Tab dismissal now permits normal focus progression. Final checks for these small updates follow the same focused lint/type/build workflow.
- The final source TypeScript and focused ESLint checks passed after these updates. TypeScript excludes generated standalone copies and nested dependency folders; Next route types remain included.
- The final production rebuild also passed compilation, type checking, static generation and dependency tracing. Local production preview: `http://localhost:3004/app?tab=clients`.

Set server-only `RESEND_API_KEY` and `INVOICE_FROM_EMAIL` to a verified TailorFit sender. Keep `INVOICE_EMAIL_ENABLED=false` until a designated test recipient has received the invoice and checked its contents. No live email was sent during implementation. Resend provider acceptance does not prove receipt.

Supabase's advisor flags the two authenticated SECURITY DEFINER functions. They are deliberately narrow bookkeeping endpoints: fixed search path, verified `auth.uid()`, owner-scoped relationships, no anonymous grant, no dynamic SQL, and no direct client writes to the ledger. Retain their ownership/rate-limit tests when changing them.

## Reproduction

Run `node scripts/run-invoice-tests.mjs` for invoice fixtures and byte-identical retry assertions. The runner uses the esbuild installation supplied by the development toolchain to load ESM-only PDF dependencies. Run focused ESLint on the new workspace, menu/dialog, invoice modules and endpoint. Use `TAILORFIT_DIST_DIR=.next-order-test` and `TAILORFIT_VERIFY_SINGLE_WORKER=true` for a memory-constrained production verification build, without replacing a development build.

Terms/Privacy pages, Google sign-in and unrelated backend issues remain deferred as requested. This record does not claim release acceptance or deployment of the frontend.
