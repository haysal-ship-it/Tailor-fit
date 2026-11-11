# Supabase smoke test — 8 November 2026

Project: rgmgaygfzrcvbdygnmbb. Local app: http://localhost:3003.

## Passed
- TypeScript: `tsc --noEmit --incremental false` exited 0.
- SQL transaction created a client, fitting, and order as the authenticated role.
- Replaying its request ID did not create a duplicate order.
- An invalid order rolled back the client created in the same intake request.
- Deleting the fitting cleared the order's optional fitting reference.
- A second authenticated account could not see the first account's clients/orders.
- A cross-account client reference was rejected by its foreign key.
- Tests ran inside BEGIN/ROLLBACK. Subsequent counts: zero clients, fittings, orders.
- Unauthenticated REST request for clients returned 401.
- Auth settings report email enabled and confirmation required.
- HTTP 200: /, /app?tab=overview, /signin, /signup, /reset-password, /update-password.
- /?tab=clients returned 307 to /app?tab=clients.

## Findings
- Google authentication is disabled in the Supabase provider settings.
- /terms and /privacy return 404, although the authentication footer links to them.

## Limits
The in-app browser failed to attach twice. HTTP responses establish server rendering, not client hydration or working controls. Signup confirmation delivery, recovery email delivery, signed-in browser saves, cross-device refresh, draft restoration, image uploads, ZIP restore, mobile layout and keyboard interaction were not verified in this run. No email was sent and no real customer data was used. This is a smoke test, not release acceptance.
