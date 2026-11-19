# Provider-independent onboarding eligibility

Status: implemented with canonical account state, signup initialization, owner-only reads and revision-checked progress writes. See onboarding-integration.md for the resulting behaviour and validation.

## Findings from the previous implementation

- Email signup explicitly supplies tailorfit_setup_version in user metadata.
- GoogleAuthButton signs in through OAuth without that signup metadata. The common auth callback attempts to infer a first account session from created_at and last_sign_in_at.
- isFirstOAuthSession requires creation within five minutes and sign-in within sixty seconds of creation. This is a timing heuristic, not a durable new-account signal.
- The callback ignores updateUser's returned error and intentionally suppresses exceptions to preserve successful authentication. A failed metadata update therefore silently leaves the app without the required onboarding marker.
- StudioSetupProvider requires the marker. The eligibility helper also bypasses client/order/draft return routes and treats an existing settings version as evidence against newness. Those checks can suppress onboarding independently of whether a new user has completed it.
- These are confirmed failure paths in the local source. A failing live session and its deployed commit have not been inspected, so they do not establish which path caused a specific reported sign-in.
- Deployment must include both the onboarding migration and the corresponding application code.

## Decision

Whether to show onboarding must depend on the Tailorfit account's persisted lifecycle state, independent of email versus Google and independent of which page contained Continue with Google.

Use an account-owned onboarding record initialized at actual auth-user creation. Prefer a small dedicated user_onboarding table keyed to auth.users.id so ordinary profile upserts, studio-settings edits and backup restores cannot accidentally reset account classification. Store version, status, last_step, created_at, updated_at and completed_at. Valid states: not_started, in_progress, deferred, completed and legacy_existing.

This is the canonical source for automatic eligibility. Migrate the existing studioSetup progress into it and retire metadata/timestamp inference for routing. Existing unit, currency and studio values remain in their current settings source; the account/profile name remains in its current profile source. Do not keep two competing progress authorities.

## Initialization and migration

1. Add the account-owned state table with authenticated owner read access and constrained authenticated state updates. Account deletion cascades to this record. Account classification at creation is server-controlled; the browser cannot assign another user's record or legacy/new classification.
2. Backfill current users before enabling the new gate. Preserve recorded completion, deferral and in-progress state. Classify established pre-existing accounts as legacy_existing so empty workspaces or absent profile rows never force them through new-user onboarding.
3. Add a minimal transactional auth.users INSERT trigger that inserts not_started exactly once for genuinely new auth accounts. This covers email and OAuth account creation. Use conflict-safe insertion that never resets a record during repeated callbacks or sign-in.
4. Keep the trigger free of remote calls and unrelated work. Test it in a non-production environment: trigger errors can prevent account creation.
5. Separately identify Google accounts that demonstrably missed onboarding using account-creation/audit evidence and the affected release window. Repair only confirmed affected accounts that have neither completed/deferred setup nor established workspace activity. Do not classify every missing state or empty workspace as new.

The exact migration cutover and repair cohort are implementation-time data checks. Runtime eligibility will not depend on five-minute/sixty-second windows.

## Authentication and routing

Both email confirmation/immediate email signup and the Google callback establish the session and enter one shared onboarding resolver. The callback no longer tries to create a new-account flag by comparing sign-in timestamps.

- not_started: show setup at step 1.
- in_progress: resume the last valid step, preserving entered/saved data.
- completed or legacy_existing: go to the normal intended destination.
- deferred: enter the workspace with a resume option; do not force the wizard on every login.
- unknown/read failure: distinguish failure from a legitimate legacy record. Preserve authentication and show a retryable loading/error state with an explicit continue-without-setup option; do not silently claim the user is existing or completed. Repair missing records through an authenticated server path using creation/backfill evidence rather than a browser guess.

For a genuinely new account, a preserved order/client/draft URL should not silently suppress onboarding. Retain that validated internal destination, show setup, then continue to that destination after completion or an explicit skip. Keep original-device drafts intact and never promise that a local-only draft transfers to a different device.

Refresh the signed-in account and authoritative progress before deciding the first destination. There should be no flash of Overview followed by a late onboarding redirect, and no dependence on stale user_metadata in the session token.

## Identity linking

Determine newness by Tailorfit's auth user ID, not by whether the person is using Google for the first time. Supabase can automatically link an OAuth identity to an existing account with the same eligible email. That remains the existing account and retains clients, orders and onboarding state. Avoid manual email matching or creating a second Tailorfit profile in the callback.

## Save and UI behaviour

Retain the approved two setup screens, defaults, mobile behaviour, looping mannequin and optional Overview tour. Continue using existing guarded, owner-scoped writes for profile and studio values.

Initialize not_started once; move to in_progress only when the relevant saved step succeeds. Mark completed only after all required profile/default writes and the progress update succeed. Retrying a partial failure must be idempotent and must not reset saved progress. Skip is an explicit deferred transition. Checklist dismissal and tour progress remain independent from setup completion.

The existing setup progress namespace must stop controlling routing once canonical account state is enabled. Checklist completion, Help/Settings resume and callback routing must all consume the same account state.

## Validation matrix

- A never-before-registered Google account from both Sign in and Sign up pages receives setup.
- New email account with confirmation enabled, confirmation delayed, or an immediate session receives the same setup.
- Existing Google account and existing email/password account using linked Google sign-in keep normal access and their original auth user ID.
- Refresh, callback replay, two tabs and a different browser preserve the same state without duplicate initialization.
- Incomplete setup resumes; explicit skip stays deferred; completed setup stays completed.
- A default settings row or prefilled Google name does not skip new-user onboarding.
- New signup with a validated order/client/draft destination sees setup and resumes the intended task after completion/skip.
- Password recovery and expired callbacks retain their established behaviour.
- Trigger migration, RLS, account switching and account deletion behave correctly.
- Progress-read/save failures remain retryable and do not erase authentication or falsely complete setup.
- Confirm the database migration and application version are deployed together, then verify one real new Google account and one existing account in a browser-enabled environment.

## References

Supabase user-data initialization and trigger guidance: https://supabase.com/docs/guides/auth/managing-user-data

Supabase automatic identity linking: https://supabase.com/docs/guides/auth/auth-identity-linking
