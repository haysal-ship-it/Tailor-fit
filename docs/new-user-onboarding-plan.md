# Tailorfit new-user onboarding plan

Status: approved direction integrated into the main app. See onboarding-integration.md for persistence, rollout and validation details.

## Recommendation

Use two short, skippable setup screens after a verified session, followed by the real Overview with a compact getting-started checklist. Keep the existing five-step Overview tour optional and independently tracked. The first useful outcome is saving a real client or order; viewing a tour is not activation.

The proposed setup is designed to take about a minute; validate that target in usability testing rather than displaying it as a guaranteed duration.

## Current product findings

- Email signup currently collects email/password and either redirects immediately when a session exists or shows a confirmation message with resend support. Google sign-in shares the callback route.
- Successful authentication returns to a validated app URL, including some draft/order/client context. Preserve that intent through onboarding.
- Account metadata supplies the Overview greeting; Settings already supports profile name, studio information, currency and measurement unit.
- Existing settings include an onboarding object that could store versioned account-scoped setup progress after validating the data path. The current tour preferences are browser-local and must remain distinct from account setup state.
- The app uses Manrope, #F2F2F2 page surfaces, #F8F8F8 inset panels, white content cards, #1D49E8 actions, thin #DDDBDB borders, pill buttons and the production golden mannequin.

## Reference shortlist and interpretation

1. Dribbble, Sudarshan V: SaaS Onboarding Flow / Personalization Steps. Use its stated progressive-disclosure approach: one small decision group per step. Tailorfit does not need goals/team questionnaires unless their answers change actual product behaviour.
   https://dribbble.com/shots/27006716-SaaS-Onboarding-Flow-Personalization-Steps
2. Layers, Dmitry Sergushkin: Onboarding Progress Tracker. Explore a compact checklist inside Overview, with explicit next actions and progress based on successful persistence.
   https://layers.to/layers/cma0obz8e000ijr0bculi5qru
3. Dribbble, Dmitry Sergushkin: Progressive Onboarding Checklist. Its description explicitly includes a personalized greeting, progress and actionable tasks. Adapt these to real studio tasks without engagement claims or arbitrary completion percentages.
   https://dribbble.com/shots/25543224-Progressive-Onboarding-Checklist
4. Cosmos: the public Cosmos Onboarding collection was discoverable, but exposed limited collection content. Treat it as a future moodboard reference, not a fully assessed UI pattern.
   https://www.cosmos.so/jaymesdowner/cosmos-onboarding
5. Pinterest: search was attempted, but the public search URL was inaccessible through the available research tool. No specific Pin is being represented as reviewed.
   https://www.pinterest.com/search/pins/?q=saas%20onboarding%20ui

Reference-derived direction is a design recommendation, not evidence that a pattern improves Tailorfit conversion. Borrow structure and clarity while preserving Tailorfit's typography, surfaces and controls.

## Entry and routing

Email signup requiring verification -> confirmation state -> successful callback -> authenticated account and workspace hydration -> setup eligibility -> setup or the saved return destination.

Google signup or email signup with an immediate session enters at the same eligibility check. A returning sign-in and password reset must not reset setup or force onboarding. A recoverable draft or intentional order/client deep link takes priority: resume the task and offer setup later. Keep return destinations constrained to validated internal app routes.

Show setup automatically only for genuinely new accounts with no completed/deferred setup. An existing account with real records or established settings must not be classified as new just because the onboarding field is absent. Define and test a release cutover/account-creation rule; existing users can opt in through Settings.

## Screen 1: Make Tailorfit yours

Progress: Step 1 of 2. Title: Make Tailorfit yours. Body: A few details to set up your studio.

Fields:
- Your name: prefill a verified provider/account display name when available; editable. Required to use Continue, with an inline error after attempted submission. Skip setup remains available.
- Studio name: optional, with example text such as Ade Atelier clearly presented as a placeholder, never a saved default. Solo tailors can leave it blank.

Actions: Continue; Skip setup. Preserve values on Back, refresh and failed saves. Avoid repeating email/password or requesting business address, logo, phone number and team details here.

Desktop: shared Tailorfit shell, focused form card and a quieter companion panel using the existing production mannequin with a few restrained measurement callouts. It illustrates the product without introducing a second required interaction. Use semantic decorative treatment so it cannot trap focus.

## Screen 2: Set your studio defaults

Progress: Step 2 of 2. Title: How does your studio work? Body: Set the defaults for new orders and measurements. You can change these in Settings.

Controls:
- Measurement unit: Centimetres (cm) / Inches (in), using the approved menu component. Retain an existing stored choice; cm is the proposed new-account default, matching current initial settings.
- Currency: show full currency name plus ISO code, with Nigerian naira (NGN) as the proposed editable default for the initial Nigerian audience. Do not infer or lock currency from location. Support the currencies currently offered in Settings.

Actions: shared Back control; Open my workspace; Skip setup as a quiet secondary link. Buttons stack at full width on phones.

Persist the profile/studio/defaults and completed flag before claiming success. If profile save succeeds but settings save fails, retain the entered values, identify the failed part and retry that part safely. A loading/disabled primary action prevents duplicate submissions. Offer a separate explicit skip when the user wants to enter the app without completing setup.

Normalize currency to supported ISO codes at the persistence boundary; audit existing legacy symbol handling before implementation. Changing defaults must not relabel old prices or convert previously recorded measurements.

## First Overview: useful next actions

Open the actual Overview with the same analytics, chart, incumbent calendar and recent-order components. Keep real empty states and truthful zero/unknown data.

Place a compact, dismissible Get your studio ready card between the welcome/actions header and the analytics grid. On desktop use a horizontal/compact layout; on mobile use a collapsed header with a visible count and expandable task rows. Avoid turning it into a second dashboard hero.

Tasks:
1. Set studio defaults -> opens the unfinished setup or Settings; complete only after successful saving.
2. Add your first client -> uses the existing contact dialog, rendered as the established bottom sheet on mobile.
3. Save your first order -> opens the canonical New Order page; its generic flow remains fresh and can create its client as it already does.

Count actual saved records: if a new order also creates a client, mark both relevant tasks complete. Do not force users to add a client separately before creating an order. Cancellation and failed saves never tick a task. Derive client/order completion from owned records after hydration, so imports and work on another device are reflected.

Keep Add client before New order in the header, preserving the existing shared variants. Completing the checklist collapses it to a small dismissible confirmation, then leaves the normal Overview. It can be reopened through Help/Settings. Skipping setup is a deferred state, not completion.

## Optional product guide

Use the current Overview guide in its established order: analytics -> chart -> calendar -> Add client -> New order. Offer one small Show me around entry in the getting-started card, suppressing the standalone invitation while that card is shown. Do not auto-launch the guide immediately after setup or stack competing welcomes.

Guide progress, setup progress and real task completion are separate. Advancing the guide must never open dialogs, submit forms or create records. Help/Settings replay honours existing unsaved-change guards.

## Design specifications

- Keep Manrope throughout; approximately 24px setup titles, 14px body/control text, 12px supporting copy. Phone fields stay at least 16px to prevent unwanted zoom.
- Retain #F2F2F2 page, white frame/content, #F8F8F8 inset, #1D49E8 primary, #DDDBDB outline and #595959 secondary text.
- Use existing workspace card radii and pill buttons. The auth shell has larger corner radii; transition into the app's card system rather than spreading 32px radii to every nested card.
- Use the shared 4/8/12/16/24/32 spacing roles, 1216px shell maximum and phone/tablet gutters. A setup form should have a narrower reading width, approximately 440-480px.
- Reuse ChoiceMenu, BackButton, fields, button variants and the production mannequin assets; introduce no competing dropdown or icon language.
- Mobile setup is a full page, since it is a sequence. Existing modal interactions inside the app remain bottom sheets. Hide/reduce the decorative mannequin panel on narrow screens; content and actions take priority.
- Use real text labels for progress and controls, visible keyboard focus and inline errors linked to fields. Never rely only on colour. At 200% zoom the flow must reflow and scroll without clipped actions.

## Motion

Use a short 160-220ms opacity/8px positional transition between pointer-driven steps, with a faster exit and no delay before controls become usable. Keyboard navigation should be immediate. Progress changes and successful saves get brief state feedback. A decorative mannequin may make one restrained introductory turn if performance permits; do not create a continuous animation competing with form entry. Reduced-motion users receive an immediate change or a short opacity transition, with no movement. Restrict animation to transform/opacity and use the current app's motion tokens where appropriate.

## State and persistence contract

Proposed account-scoped setup state: version, status (not_started/in_progress/deferred/completed), lastStep, updatedAt and completedAt. Profile name stays in its established profile source, and studio/unit/currency remain in their established Settings sources. Avoid duplicate authoritative copies of fields.

Audit the existing settings.onboarding serialization/schema/owner checks and optimistic version handling before choosing that location. Set hydration to a neutral loading state so setup does not flash on returning accounts. Persist under the authenticated owner only. Keep server progress authoritative; local drafts may protect in-progress inputs but must not leak across accounts. A sign-out clears account-local drafts according to existing app behaviour.

Store a validated return destination through confirmation/OAuth and resume it when appropriate. Preserve the existing original-device draft constraint across email confirmation on another device; never promise cross-device access to a local-only draft.

## Review deliverables and implementation order

1. Create an isolated interactive preview with Screen 1, Screen 2, first Overview checklist and optional tour entry before changing production app screens.
2. Include desktop (1440/1024), tablet (768) and phone (390/320) review states. Preview loading, validation error, skipped setup, partial-save failure, resumed setup and completed checklist.
3. Compare the preview to the actual Tailorfit design tokens, controls and mannequin. Obtain visual direction corrections.
4. Implement the eligibility/state/routing and shared-component composition, then integrate real persistence.
5. Verify email confirmation, Google first login, return login, reset-password, direct links, interrupted drafts, retry/idempotency, no duplicate client creation, owner isolation and account switching.
6. Verify keyboard/reduced-motion, mobile keyboard, full-width stacked actions, bottom sheets, long studio names, 200% zoom and all supported viewport widths in a browser-enabled session.

## Outcome measurement

Measure setup start/completion/skip and dropoff by step, time from verified signup to first saved client/order, first-session activation and guide opt-in. Define activation as a first successfully saved order; track first-client save separately as an earlier useful milestone. Do not log client contact data, measurement values or free-text fields in analytics. Establish a baseline before selecting numeric conversion targets.
