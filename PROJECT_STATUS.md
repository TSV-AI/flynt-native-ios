# FLYNT native app plan and release ledger

Last updated: 2026-08-01
Planning repository: `/Users/lukemcglynn/FLYNT-Native`
Native client repository: `/Users/lukemcglynn/FLYNT-Native`
Target client: Expo React Native development build with focused Swift modules
Backend: Existing FLYNT Vercel API and workflows
System of record: Existing FLYNT Supabase project `nnfxswxzjqocnlkoqsbl`
Distribution: Apple App Store through App Store Connect

Current source state: Native foundation, lifecycle navigation, and the PWA-referenced ready-state native preview are committed locally on `codex/native-foundation`
Current local verification: Foundation checks passed on 2026-07-30; the corrected native preview passed lifecycle tests, type, lint, copy style, Expo Doctor 20 of 20, and a 2.7 MB iOS Hermes export from 1,282 modules on 2026-07-31. Final checks for the 2026-08-01 material and navigation refinements are recorded below.
Current Simulator verification: Debug build, install, launch, Metro bundle, account entry, the Today, Plan, Progress, and Trainer tabs, top-right Profile & Settings journey, SwiftUI App Settings in light and dark modes, designed Profile, native material sheets, and the light-mode Today surface passed on iPhone 17 / iOS 26.5 through 2026-08-01.
Current TestFlight verification: Not started
Current physical iPhone verification: Not started

## Current decisions

- Product name: FLYNT.
- Intended public developer name: FLYNT, conditional on a registered DBA or
  trade name and Apple approval when the first app record is created.
- Legal Apple organization: Three Sixty Vue LLC.
- Local repository: `FLYNT-Native`.
- Provisional bundle identifier: `com.threesixtyvue.flynt`. This remains
  provisional until Apple identifiers and signing records are created.
- No GitHub remote or Apple record has been created.
- The repository is private product source owned by Three Sixty Vue LLC. The
  Expo starter MIT license was removed before the first FLYNT foundation commit.
- Android remains a later P2 decision. Android demo configuration and artwork
  are intentionally absent from the iOS foundation.

## Active blockers

- No local Xcode, Swift, Node, CocoaPods, build, install, or Simulator-launch
  blocker remains. The machine now uses Xcode 26.6, Swift 6.3.3, and the
  repository-pinned Node 24.14.0 plus pnpm 11.9.0.
- Product-level work remains before TestFlight: authoritative session and
  `/api/app-state` injection, runtime lifecycle transitions, signing and Apple
  Developer enrollment, and physical-device verification.

## Lifecycle navigation foundation | 2026-07-31

- Implemented in source: one exhaustive mapping from all six authoritative
  lifecycle values to signed-out, consultation, building, ready, and attention
  destinations, plus guarded Expo Router routes and shared lifecycle state
  scaffolds with Settings and sign-out access.
- Verified locally: two Node tests passed with mocked authoritative lifecycle
  values and confirmed that every destination has a concrete native route.
- Verified locally: TypeScript, ESLint, copy style, and an iOS Expo export passed
  with the bundled Node 24.14.0 runtime. The export produced a 2.4 MB Hermes
  bundle from 1,128 modules.
- Simulator account-entry rendering is verified. Still not verified:
  authoritative session and `/api/app-state` injection, loading and retry
  fixtures, runtime lifecycle transitions, TestFlight, or a physical iPhone.
- Roadmap maintenance: the dashboard load error now names the actual
  `PROJECT_STATUS.md` ledger.

## PWA-referenced ready-state native preview | 2026-07-31

- Corrected product direction: the PWA remains the source of truth for FLYNT
  content, tone, hierarchy, brand, and visual identity. Native work may move or
  restyle controls only when the result adds clear iPhone usability or value.
- Implemented in source: the PWA navigation model with Today, Plan, Progress,
  and Trainer in the bottom bar, plus Profile & Settings behind the top-right
  control. The inaccurate fifth Settings tab and floating iOS 26 tab treatment
  were removed.
- Implemented in source: the real PWA light and ink FLYNT mark assets, dark
  ready-state palette, compact seven-day selector, numbered workout cards,
  expandable set entry, progress, plan, history, Trainer composer, and the full
  Profile and App settings information architecture.
- Native refinements implemented in source: at least 44-point touch targets,
  semantic haptics, native switches, numeric keyboards, system confirmation and
  action sheets, push and back navigation, and draggable Stats and Guide native
  SwiftUI sheets with native detents while Today remains visible behind them.
- Native sheet refinement implemented in source: a shared Expo UI 57 SwiftUI
  BottomSheet owns native detents, the system grabber, rounded presentation
  chrome, and the home-indicator safe area. Its background follows the intended
  inverse appearance: dark over light mode and bright warm white over dark
  mode. Content and presentation colors use the same mode-dependent value. The
  redundant divider below the exercise title was removed. Stats no
  longer uses a generic decorative bar chart. It presents recent completed top
  sets, the load change with stable effort and pain context, and a clear slot
  for the server-owned next-workout recommendation in one decision surface.
  Guide content sits directly on the glass surface without a nested white card.
- Settings interaction decision: Settings remains a pushed page. Binary choices
  remain inline switches, multi-option preferences use bottom sheets on iPhone
  and may adapt to popovers on iPad, and alerts are limited to blocking messages
  while final destructive confirmation uses a bottom action sheet on iPhone.
- Settings rebuild implemented in source: App Settings now uses Expo UI 57.0.8
  SwiftUI Form, Section, Toggle, Button, and segmented Picker controls. System,
  Light, and Dark appearance choices are inline and update shared app theme
  state immediately. Both segmented controls use the larger native control
  size. Sign Out is separated near the bottom. Export Data and Delete Account
  use the same 50-point, 16-point-radius button geometry as the Profile actions.
  In light mode Sign Out is black with warm-white text. Export is white with a
  subtle boundary, and Delete uses a translucent red fill with matching red
  border and label. Routine helper paragraphs and custom floating card groups
  were removed.
- Profile rebuild implemented in source: Profile is a designed FLYNT surface,
  not a settings form. It uses a strong identity hero, personal metrics rail,
  editorial Trainer context, and focused Personal Details and Training Profile
  sheets. Trainer retains the top-right Settings path.
- Architecture boundary: all dashboard fixtures are explicitly development-only
  preview data. They do not prescribe, revise, save, or represent authoritative
  server state. The production lifecycle still defaults to signed out until the
  session and `/api/app-state` boot milestone lands.
- Verified locally: TypeScript, ESLint, copy style, both lifecycle mapping tests,
  Expo Doctor 20 of 20, and a 2.7 MB iOS Hermes export from 1,282 modules passed
  after the corrected implementation on 2026-07-31.
- Re-verified locally on 2026-08-01 after the sheet, navigation, and Today
  refinements: both lifecycle navigation tests, TypeScript, ESLint, copy style,
  and Expo Doctor 20 of 20 passed with Node 24.14.0.
- Verified in Simulator: the four bottom destinations, top-right Settings push
  and back path, Profile and App sections, native switches, set inputs, active
  exercise expansion, and draggable inverted Stats and Guide native sheets
  rendered on iPhone 17 with iOS 26.5. The rebuilt development client linked
  Expo UI and Expo Glass Effect successfully. SwiftUI Settings control alignment,
  functional Light and Dark appearance switching, the designed Profile surface,
  Settings access from Trainer, and the corrected brighter white sheet over
  dark mode also passed Simulator review. The inset week track, fitted selected
  day, taller segmented controls, and separated privacy actions passed visual
  review in the same Simulator. On 2026-08-01 the shared sheet was verified to
  paint through the home-indicator safe area, and the light-mode Guide sheet was
  verified with a dark presentation background and light content. Training
  Profile choices were verified as drill-in content within one sheet rather
  than a second modal. The restored full-width bottom navigation uses SF
  Symbols and native glass, stays dark in both app appearances, and passed
  Simulator review. The light-mode Today canvas, `#FAFAFA` exercise cards, and
  restrained card bevel also passed Simulator visual review.
- Still not verified: authoritative account data, server reads or writes,
  offline and error states, Dynamic Type extremes, VoiceOver journeys,
  TestFlight, or a physical iPhone.

## Foundation verification | 2026-07-30

- TypeScript: passed with `tsc --noEmit`.
- Lint: passed with ESLint 9.39.2 and Expo flat config.
- Expo Doctor: 20 of 20 checks passed with live Expo and React Native Directory
  metadata.
- Production bundle: `expo export --platform ios` produced a 2.4 MB Hermes
  bundle from 1,117 modules after the final cleanup.
- CocoaPods: 113 dependencies and 112 pods installed successfully.
- Simulator build: reached Xcode and failed because package `apple` requires
  Swift tools 6.2 while the installed version is 6.1.
- Simulator re-verification on 2026-07-31: after installing Xcode 26.6,
  Swift 6.3.3, and the iOS 26.5 runtime, scheme `FLYNT` built, installed, and
  launched successfully. Metro bundled 1,288 modules on private IPv4 localhost,
  and the native account-entry screen rendered with Create account and Sign in.
- Visual review: the account entry screen passed a 402 by 874 mobile web review
  in dark appearance. Create account, Sign in, and both back paths navigated.
- Copy style: `pnpm copy:check` enforces the no-em-dash rule across repository
  text files and passed before the foundation commit.
- Repository audit: Expo demo screens, components, artwork, root license,
  Claude-specific starter files, unused Android configuration, and unused
  Android artwork were removed. Generated native output and dependencies remain
  ignored. No Git remote or credential-bearing file is present.

This file is the living plan, acceptance checklist, and evidence ledger for the
FLYNT native iOS application. Update it in every native-app commit that changes
scope, evidence, dependencies, risk, or completion status. Never store secrets,
tokens, signing certificates, private keys, or test-account credentials here.

## Current conclusion

FLYNT can move to a native iOS client without replacing its production backend.
The existing bearer-token API, Supabase Auth, RLS policies, program workflows,
exercise library, media, workout history, Trainer history, and weekly and
four-week programming logic are reusable.

The recommended client is an Expo React Native development build, not Expo Go
and not a web view. Swift and SwiftUI remain first-class parts of the product
for WidgetKit, Live Activities, App Intents, Spotify App Remote, advanced
haptics, and any Apple framework that is cleaner to own natively.

The current hybrid consultation is an adapter boundary. Native work should
implement its current schema and lifecycle contract without freezing the
current screen design. Consultation UI changes in the web application should
be portable by changing the native adapter and shared API contract, not by
rewriting the workout application.

## Architecture decisions

- The existing web repository continues to own server APIs, durable workflows,
  database migrations, media generation, and production operations.
- The native client should live in a clean sibling repository when creation is
  explicitly authorized. Do not fork the complete web application or carry
  browser-only code into the native client.
- The native app calls the existing HTTPS API using a Supabase bearer token.
  Vercel remains the API and workflow host. Supabase remains the authentication,
  Postgres, RLS, and storage provider. Railway is not required.
- The native repository owns screens, navigation, device state, Keychain-backed
  session persistence, APNs registration, widgets, App Intents, native modules,
  and App Store delivery.
- Shared request and response contracts must be versioned. The native app never
  imports server internals or reconstructs business rules in the UI.
- The server remains authoritative for lifecycle, consultation completion,
  program construction, idempotency, weekly revision, exercise fulfillment,
  account isolation, and destructive account actions.
- The app remains fully useful without Spotify installed or connected.
- JavaScript updates may use Expo Updates only for compatible JavaScript and
  asset changes. Native module, entitlement, privacy, or SDK changes require a
  new App Store binary.

## Interaction contract

- Native controls first. Use system navigation, sheets, menus, pickers, toggles,
  text input, Dynamic Type, safe areas, and accessibility behavior unless a
  custom control materially improves the workout.
- One motion language. Navigation follows platform direction, sheets rise from
  their source context, expansions preserve spatial continuity, and dismissals
  reverse the entrance direction.
- One haptic language. Selection feedback confirms discrete changes, impact
  feedback confirms direct manipulation, success confirms durable completion,
  warning confirms a recoverable concern, and error is reserved for a failed
  action that needs attention.
- Haptics never decorate passive navigation or fire repeatedly during scrolling.
  System controls keep their system feedback.
- Motion communicates state, not spectacle. Respect Reduce Motion and never make
  animation the only indication of progress or completion.
- Touch targets are at least 44 by 44 points. Destructive actions are separated
  from common actions and require clear confirmation.
- Loading preserves layout. Prefer existing content, skeleton structure, and
  explicit progress over full-screen spinners.
- Optimistic UI is allowed only when failure is reversible. Program publication,
  workout completion, account deletion, and paid access wait for server truth.
- Every screen has a recovery path. Authentication can return, consultation can
  reach settings and sign out, builds can recover or explain attention, and
  modal surfaces always have an obvious dismissal.
- Copy remains concise, human, beginner-safe, and free of em dashes. Advanced
  terminology appears only when the athlete's experience and context support it.

## Haptic and motion map

| Interaction | Feedback | Motion |
| --- | --- | --- |
| Tab selection | None unless selection changes | Native tab transition |
| Segmented choice or picker detent | Selection | System control behavior |
| Add or remove a completed set | Light impact | Check and value settle |
| Start workout or timer | Medium impact | Content expands from source |
| Pause or resume timer | Light impact | State crossfade |
| Finish exercise | Success only when saved | Card resolves to completed state |
| Finish workout | Success only after server save | Summary replaces workout |
| Invalid field | Error once on attempted continuation | Field remains anchored |
| Recoverable pain or safety warning | Warning | Warning sheet rises in context |
| Pull to refresh | System feedback | System refresh behavior |
| Destructive confirmation | Warning before, success after deletion | Native confirmation sheet |

## Widget plan

- Small system widget: today's state, workout name, progress ring, and one
  Start or Resume App Intent.
- Medium system widget: today's workout, completed and remaining sets, next
  exercise, and Start or Resume.
- Large system widget: the current week, today's detailed progress, next session,
  and recent completion context.
- Widget data is a minimal, privacy-safe snapshot written to an App Group after
  authoritative app-state changes. Widgets do not receive Supabase credentials.
- Every widget has useful placeholder, snapshot, stale, signed-out, build, rest,
  and ready states. Tapping deep-links to the exact native destination.

## Native build phases

### Phase 0 | Planning and system boundaries

- [x] Read the production handoff ledger and audit the current repository before proposing native architecture.
  Evidence: `PROJECT_STATUS.md`, API routes, lifecycle schemas, consultation schemas, migrations, and the existing release dashboard were inspected on 2026-07-30.
  Exit check: The plan distinguishes reusable backend behavior from browser-only client behavior.
- [x] Confirm the current API authenticates requests with Supabase bearer tokens.
  Evidence: `lib/supabase/server.ts` validates `Authorization: Bearer` with `supabase.auth.getUser`.
  Exit check: A native token can reach a read-only endpoint without cookies.
- [x] Confirm the production state contract already exposes lifecycle, profile, preferences, program, build, conversation, and workout state.
  Evidence: `lib/lifecycle/types.ts` and `lib/lifecycle/app-state.ts`.
  Exit check: Native boot can be driven from one authoritative state response.
- [x] Confirm program creation and weekly adaptation remain server-owned and idempotent.
  Evidence: Existing program-build and weekly-program workflows plus their production evidence in `PROJECT_STATUS.md`.
  Exit check: No prescription or weekly revision rules need to be copied into the client.
- [x] Identify browser-only systems that require native replacements.
  Evidence: Browser Supabase persistence, service-worker Web Push, PWA install lifecycle, DOM/CSS UI, and Spotify Web API playback polling were identified.
  Exit check: Each replacement appears in a later phase with an acceptance gate.
- [x] Establish the consultation as a replaceable adapter around the existing completed-consultation schema.
  Evidence: `completedConsultationSchema` is the current prescriber contract and the server persists a confirmed snapshot.
  Exit check: Native work can proceed outside consultation while its UX continues evolving.
- [x] Decide the native repository name, GitHub ownership, bundle identifier, and whether the App Store seller is an individual or organization.
  Evidence: On 2026-07-30 the owner selected FLYNT as the product and intended public developer name, Three Sixty Vue LLC as the legal organization, `FLYNT-Native` as the local repository, and `com.threesixtyvue.flynt` as the provisional bundle identifier. No remote or Apple record was created.
  Exit check: Names are stable before signing, App Groups, associated domains, or App Store records are created.
- [ ] Enroll in the Apple Developer Program under the intended seller identity.
  Evidence required: Active membership and accepted current agreements.
  Exit check: Team ID is available for signing, TestFlight, App Groups, push, Sign in with Apple, and App Store Connect.

### Phase 1 | Clean native foundation

- [ ] Create a clean Expo TypeScript repository with development builds and no copied browser UI.
  Evidence: The fresh local Expo SDK 57 TypeScript repository was created at `/Users/lukemcglynn/FLYNT-Native` on 2026-07-30. Browser starter UI was removed, development-build dependencies were added, and no GitHub remote was created. Type, lint, Doctor, production JavaScript export, CocoaPods, mobile web review, and a native iOS 26.5 Simulator build and launch passed.
  Exit check: `main` contains only intentional native code, configuration, tests, and documentation.
- [ ] Pin Node, Expo SDK, React Native, Xcode, CocoaPods, Ruby, and package-manager versions.
  Evidence: `.node-version` and `package.json` pin Node 24.14.0 and pnpm 11.9.0. Expo 57.0.9, React Native 0.86.2, and React 19.2.3 are lockfile-pinned. Xcode 26.6 and Swift 6.3.3 are installed and verified. CocoaPods and Ruby pinning plus a clean independent bootstrap remain outstanding.
  Exit check: Two independent installs produce the same working development build.
- [~] Establish Expo Router navigation for signed-out, consultation, building, ready, and attention lifecycles.
  Evidence: Exhaustive lifecycle-to-destination mapping, guarded routes, and shared lifecycle scaffolds were implemented on 2026-07-31. Two mocked mapping and route-coverage tests, TypeScript, ESLint, copy style, and iOS export passed. Authoritative session and app-state injection, loading and retry fixtures, and runtime transition evidence remain outstanding.
  Exit check: No lifecycle can fall through to a blank screen or dead end.
- [ ] Add generated TypeScript API contracts and runtime validation for every mobile endpoint.
  Evidence: The current authoritative `/api/app-state` lifecycle, preferences, profile, program, build, conversation, and workout schemas were ported with Zod validation on 2026-07-30. Generation, remaining endpoints, and fixture coverage remain outstanding.
  Exit check: A server shape change fails CI before it silently breaks the app.
- [ ] Add environment profiles for local, preview, TestFlight, and production.
  Evidence required: Documented non-secret configuration with distinct application identifiers where needed.
  Exit check: No production secret or service-role value exists in the app bundle.
- [ ] Add error reporting, structured diagnostics, release identifiers, and privacy-safe breadcrumbs.
  Evidence required: Captured nonfatal and fatal test events with personal data redacted.
  Exit check: A TestFlight failure can be tied to app version, build, route, and lifecycle without exposing health details.
- [ ] Establish continuous integration for type checks, lint, unit tests, contract tests, native build validation, and stale-file checks.
  Evidence required: Green clean-branch workflow and a deliberately failing control run.
  Exit check: No merge can bypass the required checks.
- [ ] Enforce clean-as-you-go ownership.
  Evidence required: Repository rule that replacement code removes superseded code, tests, exports, assets, and dependencies in the same change.
  Exit check: CI reports unused exports, unreachable files, duplicate assets, and dependency drift.

### Phase 2 | Native design and behavior system

- [ ] Translate the approved FLYNT color, type, spacing, radius, elevation, and material tokens into a typed native theme.
  Evidence: Initial typed light and dark color, type, spacing, and radius tokens were implemented in `src/constants/theme.ts` on 2026-07-30. A component gallery and device evidence remain outstanding.
  Exit check: Product screens do not hard-code competing visual values.
- [~] Define the navigation model and exact ownership of stacks, tabs, sheets, full-screen covers, menus, and alerts.
  Evidence: Lifecycle stacks, the PWA-aligned four-tab ready shell, top-right Settings push, native settings action sheets, system confirmation, and draggable exercise form sheets were implemented and exercised in Simulator on 2026-07-31. Remaining deep links and lifecycle detail ownership are incomplete.
  Exit check: The same destination is not presented with conflicting patterns.
- [~] Build shared buttons, fields, list rows, cards, progress, empty states, errors, and loading states.
  Evidence: Shared PWA-referenced app screen, real FLYNT mark, cards, actions, list rows, progress, fields, switches, and 44-point controls were implemented across the ready shell on 2026-07-31. Empty, error, loading, gallery, and accessibility matrices remain outstanding.
  Exit check: Feature screens compose primitives instead of inventing local variants.
- [ ] Implement the haptic map as semantic functions, not raw vibration calls.
  Evidence: Initial semantic functions were implemented in `src/lib/haptics.ts` and documented in `docs/INTERACTION_SYSTEM.md` on 2026-07-30. Unit mapping and physical-device review remain outstanding.
  Exit check: Call sites request `selection`, `saved`, `warning`, or `failed`, not device-specific patterns.
- [ ] Implement the motion map with shared timing, springs, interruption behavior, and Reduce Motion alternatives.
  Evidence required: Slow-motion recordings and reduced-motion matrix.
  Exit check: Sheets, navigation, expansion, loading, and completion behave consistently.
- [ ] Define gesture precedence for vertical scroll, horizontal paging, swipe actions, sheet dismissal, and workout controls.
  Evidence required: Conflict matrix tested with VoiceOver and one-handed use.
  Exit check: No gesture traps the user or hides the only path to an action.
- [ ] Pass Dynamic Type, VoiceOver, Switch Control, color contrast, reduced transparency, and bold-text checks in the component gallery.
  Evidence required: Accessibility test report and screenshots at the largest supported text size.
  Exit check: Core tasks remain complete without relying on color, animation, or precise gestures.
- [ ] Test the design system on the smallest supported iPhone and current large-screen iPhone in portrait.
  Evidence required: Screenshot matrix with no clipping, overlap, or hidden actions.
  Exit check: V1 can remain iPhone-only without accidental iPad or landscape promises.

### Phase 3 | Identity, legal, and authoritative boot

- [ ] Implement Supabase session storage with iOS Keychain or SecureStore and foreground token refresh.
  Evidence: A Keychain-backed SecureStore adapter using `WHEN_UNLOCKED_THIS_DEVICE_ONLY` was implemented on 2026-07-30. Supabase integration, refresh, revocation, and reinstall tests remain outstanding.
  Exit check: Tokens never use plain AsyncStorage and a revoked session cannot display cached account data.
- [ ] Implement passwordless email authentication and native deep-link or universal-link return handling.
  Evidence required: Real OTP flow from Mail back into the development build and TestFlight build.
  Exit check: Links cannot establish a session for the wrong app environment.
- [ ] Implement Sign in with Apple and reconcile identity linking with existing Google and email accounts.
  Evidence required: New, returning, hidden-email, revoked-credential, and account-link tests.
  Exit check: The primary account can be recovered without creating duplicates.
- [ ] Decide whether Google remains in V1 and, if retained, implement the native Google flow.
  Evidence required: Product decision plus App Review login-services compliance review.
  Exit check: Authentication options satisfy Apple guideline 4.8.
- [ ] Implement authoritative app boot from `/api/app-state` with cached shell, stale-data labeling, retry, sign out, and account isolation.
  Evidence required: Offline, slow, 401, 403, 409, 429, 500, and malformed-response fixtures.
  Exit check: No prior athlete data flashes after account switching.
- [ ] Port Terms, Safety Notice, Privacy Notice, data export, and in-app account deletion.
  Evidence required: Reviewer-visible screens and a production deletion run that removes the account and revokes linked Sign in with Apple tokens.
  Exit check: Account deletion is easy to find and does not require email or phone support.
- [ ] Create reviewer-safe demo access and App Review instructions.
  Evidence required: Stable review account or fully documented alternative, accessible backend, and exact feature walkthrough.
  Exit check: Reviewers can reach every gated capability without contacting the owner.

### Phase 4 | Consultation and program creation

- [ ] Port the basic profile setup with native fields, pickers, units, validation, resume, and correction.
  Evidence required: Beginner and experienced fixtures, keyboard review, and relaunch persistence.
  Exit check: Name, age, height, weight, and experience reach the current schema exactly once.
- [ ] Implement the hybrid Trainer conversation using native chat primitives, dictation, and interactive answer cards.
  Evidence required: Real streaming conversation with editable card drafts and speech transcription.
  Exit check: Cards reduce effort without removing the athlete's ability to correct or add context.
- [ ] Preserve full prescriber-schema coverage for goals, success measure, schedule, history, preferences, equipment, limitations, mobility, sport, and recovery.
  Evidence required: Contract fixtures covering bodyweight-only, full gym, other equipment, good-to-go, and one or two limitations.
  Exit check: The server can produce a valid completed consultation without invented placeholders.
- [ ] Adapt tone and terminology from the stored experience level.
  Evidence required: Side-by-side beginner, intermediate, and advanced transcripts.
  Exit check: Beginner copy avoids unexplained jargon and advanced copy remains precise without becoming performative.
- [ ] Implement the reflection and correction loop before final review.
  Evidence required: Exactly, Not quite, edited answer, and dictated correction paths.
  Exit check: A correction updates structured state without restarting the consultation.
- [ ] Implement one definitive review card with section edits and a durable confirmation action.
  Evidence required: Relaunch before review, during review, and after approval.
  Exit check: Review always appears when complete and cannot duplicate the build.
- [ ] Preserve Settings and Sign out throughout consultation and build states.
  Evidence required: Navigation test from every consultation step and every build phase.
  Exit check: No account can be trapped.
- [ ] Verify confirmation idempotency and exact-once program creation against production-like infrastructure.
  Evidence required: Double tap, retry, offline reconnect, app termination, and duplicate callback tests.
  Exit check: All attempts resolve to one durable build and one published version.
- [ ] Build the native program-building and attention states.
  Evidence required: Real workflow progress, backgrounding, notification, recovery, and failure fixtures.
  Exit check: No partial program appears and every failure has retry, explanation, settings, and sign-out access.

### Phase 5 | Workout core

- [~] Build Today and Plan from the authoritative weekly program contract.
  Evidence: PWA-referenced Today and seven-day Plan preview surfaces with training and recovery states, set progress, day selection, and native tab navigation were implemented and verified in Simulator on 2026-07-31. The data is development-only and authoritative contract injection plus the complete fixture matrix remain outstanding.
  Exit check: The program remains readable at large text sizes and on the smallest supported phone.
- [ ] Build workout execution with set completion, reps, load, RPE, pain, notes, rest, and elapsed time.
  Evidence required: Full session, partial session, edited session, and interrupted-session runs.
  Exit check: Every saved value round-trips through the existing normalized workout API.
- [ ] Implement local draft recovery without treating local state as published server truth.
  Evidence required: Force quit, low-memory termination, offline completion, and conflict tests.
  Exit check: The athlete can recover work without duplicating the server session.
- [ ] Implement the rest timer with background-safe timing based on absolute timestamps.
  Evidence required: Lock screen, background, clock change, interruption, and notification tests.
  Exit check: Timer drift remains bounded and the workout never depends on an active JavaScript interval.
- [ ] Port exercise guides, instructional visuals, pending-media state, and retry behavior.
  Evidence required: Published, pending, failed, replaced, and cached media fixtures.
  Exit check: Rejected or incomplete media never appears.
- [ ] Implement workout completion as a server-confirmed transaction.
  Evidence required: Network loss during save, duplicate completion, and restored summary tests.
  Exit check: Success haptic and summary appear only after a durable save.
- [ ] Complete a physical-device week of workouts through the native client.
  Evidence required: Seven calendar days with at least three completed sessions and preserved set-level history.
  Exit check: The existing deterministic weekly workflow receives the expected evidence.

### Phase 6 | Progress, Trainer, settings, and media

- [~] Port Progress history, workout detail, charts, weekly decisions, and block context.
  Evidence: A PWA-referenced Progress preview with four-week metrics, a strength trend, and recent training rows rendered in Simulator on 2026-07-31. Authoritative history, details, decisions, block context, and the complete fixture matrix remain outstanding.
  Exit check: Historical program versions remain immutable and understandable.
- [~] Port post-consultation Trainer chat and explicit program-change approval.
  Evidence: A conversation-first Trainer preview with request chips, multiline native composer, local send behavior, and explicit preview labeling rendered in Simulator on 2026-07-31. Server streaming, persistence, proposal approval, retry, and duplication evidence remain outstanding.
  Exit check: No proposed program change applies before approval.
- [~] Port profile, preferences, avatar, reminders, appearance, progression, rest, export, and deletion.
  Evidence: Top-right Profile & Settings now contains PWA-aligned Profile and App sections, personal fields, Trainer report context, appearance, Spotify placement, reminders, notification test, progression, rest, sign out, export, and deletion. Native switches, segmented choices, action sheets, and confirmation rendered in Simulator on 2026-07-31. Authoritative account round trips, avatar editing, export, deletion, and isolation evidence remain outstanding.
  Exit check: All current account controls are available natively.
- [ ] Add native media caching with bounded storage and version-aware invalidation.
  Evidence required: Offline guide access, cache eviction, media revision, and low-storage tests.
  Exit check: Old visuals cannot remain current after a published replacement.
- [ ] Add share and support surfaces without exposing private training or health data by default.
  Evidence required: Share-sheet review and redaction tests.
  Exit check: Export is intentional and system previews contain only selected content.

### Phase 7 | Apple platform capabilities

- [ ] Replace Web Push with APNs registration, device-token ownership, environment separation, and token rotation.
  Evidence required: Development and TestFlight delivery, revoked token cleanup, and two-account isolation.
  Exit check: Program-ready, reminder, timer, and attention notifications deep-link correctly.
- [ ] Build small, medium, and large WidgetKit widgets backed by an App Group snapshot.
  Evidence required: Placeholder, signed-out, building, rest, ready, stale, and active-workout screenshots in light, dark, tinted, and accented modes.
  Exit check: All three sizes are glanceable, private, accessible, and deep-link correctly.
- [ ] Add App Intents for Start workout, Resume workout, and Open today where safe.
  Evidence required: Widget, Spotlight, Shortcuts, locked-device, and signed-out tests.
  Exit check: An intent never bypasses authentication or mutates a workout without confirmation.
- [ ] Evaluate Live Activities and Dynamic Island for active workout and rest timer.
  Evidence required: Product decision plus battery, privacy, stale-state, dismissal, and update-budget tests.
  Exit check: Ship only if it improves an active session without becoming persistent noise.
- [ ] Evaluate HealthKit read and write scope.
  Evidence required: Exact data-type inventory, benefit statement, permission copy, privacy review, and opt-out behavior.
  Exit check: V1 requests only data used directly for the athlete and never uses health data for advertising.
- [ ] Evaluate Apple Watch only after the phone workout loop is stable.
  Evidence required: Separate scope decision and product value test.
  Exit check: Watch work cannot delay the iPhone V1 release.

### Phase 8 | Spotify App Remote feasibility

- [ ] Obtain written Spotify clarification for public App Remote eligibility and expected user limits.
  Evidence required: Spotify Developer Support response retained outside the repository.
  Exit check: FLYNT does not make Spotify a launch dependency without policy confidence.
- [ ] Build a Swift Expo module around the official Spotify iOS SDK.
  Evidence required: Internal module with typed events, main-thread ownership, authentication callback, connect, disconnect, and reconnect tests.
  Exit check: No abandoned third-party React Native wrapper is required.
- [ ] Prove play, pause, seek, previous, next, shuffle, metadata, artwork, and live player-state behavior.
  Evidence required: Physical-device run with Spotify installed, Premium account, headphones, lock, background, and interruption.
  Exit check: The player recovers predictably after Spotify suspension.
- [ ] Define the honest queue experience without depending on undocumented full-queue access.
  Evidence required: Product decision and SDK capability test.
  Exit check: UI never implies control or queue data the SDK cannot provide.
- [ ] Preserve a complete workout when Spotify is absent, signed out, unavailable, or disconnected.
  Evidence required: App Review-style clean-device run without Spotify.
  Exit check: Guideline 4.2.3 minimum standalone functionality is satisfied.
- [ ] Complete Spotify branding, attribution, privacy, and App Store metadata review.
  Evidence required: Current Spotify design-policy checklist and legal approval.
  Exit check: Artwork, metadata, naming, links, and marks comply at submission time.

### Phase 9 | Hardening and TestFlight

- [ ] Define the supported device and OS matrix and test every core task on its boundaries.
  Evidence required: Smallest and largest supported iPhone, current iOS, minimum iOS, light, dark, and accessibility matrix.
  Exit check: Unsupported combinations are excluded in project and App Store settings.
- [ ] Add unit, integration, API contract, navigation, state-machine, and native module tests.
  Evidence required: Coverage mapped to release gates, including deliberate failure controls.
  Exit check: Consultation loops, duplicate builds, account leakage, and workout loss are regression tests.
- [ ] Run performance, memory, battery, network, and launch profiling on release builds.
  Evidence required: Instruments or equivalent traces for cold launch, chat, workout, media, widgets, and background transitions.
  Exit check: No repeatable leak, main-thread stall, runaway timer, or abusive background work remains.
- [ ] Run security review for token storage, deep links, universal links, API authorization, logs, screenshots, backups, and dependency risk.
  Evidence required: Threat model, dependency audit, and resolved high-severity findings.
  Exit check: Service-role keys and server secrets are absent from binaries and updates.
- [ ] Run internal TestFlight with owner acceptance.
  Evidence required: Signed build, release notes, crash-free owner journey, and rollback build retained.
  Exit check: Signup through one completed week passes without developer intervention.
- [ ] Run external TestFlight friend cohort.
  Evidence required: Beta App Review approval, consented testers, feedback triage, and crash and performance review.
  Exit check: Every P0 is closed with reproducible evidence from the release candidate.
- [ ] Verify update and rollback behavior.
  Evidence required: Prior binary, current binary, compatible Expo update, incompatible native change, and rollback drills.
  Exit check: A bad JavaScript update or binary can be stopped without corrupting durable athlete state.

### Phase 10 | App Store compliance and release

- [ ] Keep the current App Review Guidelines and Human Interface Guidelines linked in the native repository and review them at each release milestone.
  Evidence required: Dated compliance review in this ledger.
  Exit check: Requirements are checked against current Apple text, not memory.
- [ ] Confirm the app provides substantial native utility beyond a repackaged website.
  Evidence required: Native workout execution, notifications, widgets, haptics, offline recovery, and platform behavior.
  Exit check: Guideline 4.2 minimum functionality has clear reviewer evidence.
- [ ] Publish an accessible privacy policy URL and keep the same policy easy to reach inside the app.
  Evidence required: Live URL, in-app link, retention and deletion language, and third-party disclosure.
  Exit check: Policy matches actual SDK and server behavior.
- [ ] Complete App Privacy responses for every app and third-party SDK data type.
  Evidence required: Data inventory covering contact, identifiers, health and fitness, usage, diagnostics, content, and linked or tracking status.
  Exit check: App Store privacy labels match the release binary and backend.
- [ ] Complete privacy manifests and required-reason API declarations.
  Evidence required: Xcode privacy report with all third-party SDK signatures and manifests accounted for.
  Exit check: No unresolved privacy-manifest warning remains.
- [ ] Complete export-compliance determination for encryption.
  Evidence required: App Store Connect answers and Info.plist declaration or approved documentation.
  Exit check: Every uploaded build has the correct encryption status.
- [ ] Decide the V1 business model before implementing paid access.
  Evidence required: Written decision for free, physical service, or digital subscription.
  Exit check: Digital feature unlocking uses StoreKit when Apple requires in-app purchase.
- [ ] Complete age rating, health and safety positioning, content rights, and support contact information.
  Evidence required: App Store Connect preview and legal review of training claims.
  Exit check: FLYNT does not imply diagnosis, treatment, guaranteed outcomes, or emergency support.
- [ ] Prepare app name, subtitle, description, keywords, category, screenshots, preview, icon, copyright, support URL, marketing URL, and release notes.
  Evidence required: Final App Store Connect product-page review on every required device size.
  Exit check: Metadata accurately describes the submitted build.
- [ ] Prepare App Review notes, demo access, backend availability, Spotify explanation, notification behavior, HealthKit use, and any non-obvious test steps.
  Evidence required: Reviewer script completed from a clean device.
  Exit check: Reviewers can evaluate every feature without guessing.
- [ ] Submit the release candidate and retain the last TestFlight build for rollback.
  Evidence required: Submitted build number, commit, EAS build, App Store status, and rollback identifier.
  Exit check: The exact submitted binary has passed every P0 gate.
- [ ] Run post-approval production smoke tests before phased release.
  Evidence required: Fresh install, existing-account upgrade, signup, consultation, program build, workout, notification, widget, deletion, and support checks.
  Exit check: Release begins only after production services and the approved binary agree.

## Friend-ready native release gates

### P0 | Must pass before any friend receives the native app

- [ ] A fresh install can create an account, accept current legal terms, complete consultation, review the captured information, and start one program build.
- [ ] The consultation review card always appears when required, confirmation creates one build, and Settings and Sign out remain available throughout.
- [ ] Program construction survives termination, reconnect, duplicate requests, and notification delivery without exposing a partial week.
- [ ] A complete workout saves every set, load, rep, RPE, pain value, note, duration, and completion exactly once.
- [ ] Same-device account switching never exposes another athlete's profile, consultation, Trainer history, program, media, workout, widget, notification, or cache.
- [ ] In-app account deletion removes the account and associated data, revokes Sign in with Apple when used, and returns to a clean signed-out state.
- [ ] No service-role key, provider secret, signing secret, private health detail, or reusable reviewer credential is present in the binary, logs, repository, or crash reports.
- [ ] The release build passes type, lint, unit, contract, native build, security, accessibility, and physical-device smoke checks.
- [ ] The exact TestFlight build completes signup through one week without developer-only tools.

### P1 | Must pass before App Store submission

- [ ] Small, medium, and large widgets pass privacy, stale-state, deep-link, appearance, accessibility, and signed-out checks.
- [ ] Push notification permission is contextual, optional, recoverable, and every notification routes to the correct current state.
- [ ] App Review metadata, privacy labels, privacy manifests, export compliance, reviewer access, age rating, and support information are complete.
- [ ] Sign in with Apple and any retained third-party login comply with the current login-services rule.
- [ ] The app remains valuable and complete without Spotify, HealthKit, notification permission, widgets on the Home Screen, or background refresh.
- [ ] App launch, workout execution, media viewing, chat streaming, background timer, and widgets meet the agreed performance and battery budgets.
- [ ] A prior known-good binary and update channel can be restored without data loss.

### P2 | May follow the first App Store release

- [ ] Live Activities and Dynamic Island workout state.
- [ ] HealthKit integration beyond the minimum athlete-owned benefit.
- [ ] Apple Watch companion workout experience.
- [ ] Android client after iOS product and backend contracts stabilize.
- [ ] Expanded Siri, Spotlight, Shortcuts, and App Intent surfaces.

## Current high-risk decisions

- Apple seller identity and bundle identifiers become difficult to change after
  App Store records, entitlements, and Sign in with Apple are established.
- Sign in with Apple should be treated as required if Google remains a primary
  sign-in option.
- Native push is a real backend change. Existing Web Push subscriptions cannot
  deliver APNs notifications.
- Spotify App Remote is technically feasible but policy eligibility and full
  queue behavior are not yet proven.
- HealthKit adds sensitive-data obligations. Do not request it merely because it
  is available.
- Digital subscriptions add StoreKit, receipt validation, restore-purchase,
  entitlement, cancellation, and App Review requirements. Decide the business
  model before building paywalls.
- Expo Updates must not become a path for shipping native capability changes
  outside App Review.

## Official references

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)
- [Apple Developer membership comparison](https://developer.apple.com/support/compare-memberships/)
- [Apple Developer Program membership details](https://developer.apple.com/programs/whats-included/)
- [App Review preparation](https://developer.apple.com/app-store/review/)
- [App Store Connect submission overview](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/overview-of-submitting-for-review)
- [In-app account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app)
- [App privacy management](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)
- [Export compliance overview](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance)
- [WidgetKit families](https://developer.apple.com/documentation/widgetkit/widgetfamily)
- [Apple haptic guidance](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)
- [Apple motion guidance](https://developer.apple.com/design/human-interface-guidelines/motion)
- [TestFlight external testing](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo native customization](https://docs.expo.dev/workflow/customizing/)
- [Expo EAS Build](https://docs.expo.dev/build)
- [Supabase React Native authentication](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Supabase native deep linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
- [Official Spotify iOS SDK](https://github.com/spotify/ios-sdk)
- [Spotify iOS App Remote lifecycle](https://developer.spotify.com/documentation/ios/concepts/application-lifecycle)
