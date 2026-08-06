# FLYNT native app plan and release ledger

Last updated: 2026-08-05
Planning repository: `/Users/lukemcglynn/FLYNT-Native`
Native client repository: `/Users/lukemcglynn/FLYNT-Native`
Target client: Expo React Native development build with focused Swift modules
Backend: Existing FLYNT Vercel API and workflows
System of record: Existing FLYNT Supabase project `nnfxswxzjqocnlkoqsbl`
Distribution: Apple App Store through App Store Connect

Current source state: Native foundation, lifecycle navigation, first-sign-in consultation, real program-build progress, contextual notification permission capture, database-backed ready-state surfaces, Trainer conversation and approval handling, workout customization, native icon, authentication, Spotify App Remote boundary, rest-timer behavior, the native-list Today experiment, and one Today WidgetKit configuration are implemented on `codex/native-foundation`. The widget currently supports only system small, medium, and large. Next Set and Week designs are deferred and are not registered or published by the current source.
Current local verification: On 2026-08-05, eight authentication callback and validation tests, 11 authoritative boot tests, two lifecycle navigation tests, 13 native feature-contract tests, one global sheet-system contract, TypeScript, focused ESLint, copy style, and whitespace validation passed. The iOS workspace also compiled the FLYNT-owned Swift Google authentication bridge against GoogleSignIn 9.2 and linked Expo Notifications 57.0.8. The shell used Node 22.23.1 rather than the repository requirement of Node 24.14.0 and reported the known engine warning. Expo Doctor last passed 18 of 20 checks with network access on 2026-08-04. It reported six one-patch Expo SDK 57 package mismatches and the known local-module ignore warning. Those Expo versions were not changed.
Current Simulator verification: On 2026-08-04 the current source built, installed, and launched on iPhone 17 / iOS 26.5. The signed-out marketing flow rendered the six PWA-approved stories, product previews, blurred color fields, and unified account transition in dark appearance. On 2026-08-05 the signed-out marketing and Sign in screens also rendered with the forced FLYNT light canvas, light native system appearance, dark status-bar content, and adaptive provider controls on iPhone 17e / iOS 26.5. A staged account-creation smoke test deleted the exact `info@threesixtyvue.com` Auth user and all discovered owned rows, recreated it through native Google authentication, wrote legal acceptance, and reached the authoritative first consultation screen with a new account identifier. The brief authoritative boot screen now follows the active surface appearance rather than combining a hard-coded dark background with light-theme text. The first consultation welcome uses the standalone FLYNT mark at 72-point height rather than the placeholder letter. The first-sign-in setup rendered and advanced through welcome, basic text and numeric fields, and experience selection in light and dark appearances. The ready-state Today workout editor transformed in place, exposed its safe-area-fixed Cancel and Save actions, opened an exercise detail editor, reordered Back Squat beneath Romanian Deadlift through a direct grab-handle drag, and exposed Replace and Delete through a left swipe. Active swipe and drag rows used the raised card treatment and returned to the resting list surface after release. The authenticated consultation rendered through the same shared chat thread and composer used by Trainer. Its hero scrolled away with the conversation while the settings row stayed fixed, messages moved under the glass composer, the newest content settled above it, the composer expanded and reset to its bounded multiline height, and dark-mode athlete bubbles used the shared `#222222` item surface. The live consultation completed its grouped answers, correctly withheld Review after an incomplete safety template, accepted an explicit safety correction, exposed Review only after the server response said the profile was ready, generated a structured review, and exercised the correction path. A recorded request showed the shared `FLYNT is thinking` row while the server was responding. Chat content now reaches the physical top edge beneath a short translucent status-bar scrim, the menu remains below the safe-area inset, and the light inline composer uses only a subtle glass shadow with its bottom scrim confined below the composer. Existing Markdown replies present sentence-case bullets, while the Trainer server prompt now requests sentence-case bullets for future replies. The program build published one version and activated one current week without duplicate builds or versions. A development-only lifecycle fixture displayed the real build screen without changing that account. The screen rendered a large circular progress track with a thick black clockwise fill and matching rounded moving endpoint, a centered percentage, one compact phase label, and the contextual notification action. The complete content group was shifted down together and verified in iPhone 17e / iOS 26.5 Simulator. Its title now translates each authoritative build phase into trainer work such as reviewing goals and limitations, structuring the training week, selecting exercises, programming movements, and checking the sessions. A neutral 30-percent text mask with a solid moving band matches the referenced SwiftUI shimmer behavior, stops at completion, and becomes static when Reduce Motion is enabled. The light appearance animation was recorded and reviewed in the same Simulator without a colored tint. The movement-guide counter has been removed from the build screen, and the accepted notification state now changes from a button to the plain confirmation `We’ll notify you when it’s ready!`. Today loaded the resulting exercise catalog with real thumbnails. The list thumbnails, exercise media panel, and set-entry controls use the shared light `#D4D3D0` exercise surface. A clean native rebuild on iPhone 17e / iOS 26.5 verified the shared `#141414` Today, Plan, and Trainer transition surface, the anchored Today action menu, open Plan rows with aligned day tiles, full scrolling clearance through Complete Rest, the shared Trainer composer with compact first input, bounded multiline growth, visible send control, compact reset after send, and response auto-scroll clearance above the composer. No set was completed and no workout session was created. Persisted workout override writes, Trainer program-change approval, larger Dynamic Type, VoiceOver speech, Reduce Motion, Reduce Transparency, TestFlight, and physical-iPhone behavior remain unverified. Widget evidence below remains unchanged.
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

## Signed-out marketing and account parity | 2026-08-04

- Product source of truth: the native signed-out experience was traced against
  `/Users/lukemcglynn/FLYNT-Web App/components/first-run.tsx`,
  `/Users/lukemcglynn/FLYNT-Web App/components/marketing-product-previews.tsx`,
  and the associated first-run rules in `app/globals.css`. The PWA repository
  was not edited.
- Implemented in source: the native introduction uses the PWA's exact six
  titles and descriptions, product-preview order, 6.5-second automatic advance,
  horizontal paging, final Sign in action, and Reduce Motion behavior. The
  prior invented landing page and onboarding Skip control were removed.
- Implemented in source: each product stage uses the PWA's exact near-black
  base, radial glow, olive, sand, blue, and warm gradient stops, Gaussian blur,
  grain, per-slide rotation, scale, and opacity. These compositions are
  pre-rendered because the installed React Native iOS runtime does not render
  the required blur filter on gradient views. Interface content remains native
  and uses the PWA's approved guide and Spotify imagery.
- Implemented and verified in Simulator on 2026-08-06: slides one through five
  consume the five approved pre-rendered color fields in their explicit
  left-to-right order. The feature cards, copy, sizing, and sixth Spotify slide
  remain unchanged.
- Implemented in source on 2026-08-06: the marketing stage no longer uses
  pre-rendered color-field images. A native SVG composition now draws the PWA's
  dark base, bottom bloom, exact sage, cream, blue, grey, and bronze gradient
  stops, Gaussian blur, synthetic grain, and per-story transforms behind the
  unchanged native preview cards.
- Implemented in source on 2026-08-06: the complete marketing introduction now
  uses the existing FLYNT dark canvas, ink, muted-copy, divider, and light
  status-bar tokens. The shared onboarding appearance now carries that dark
  treatment through Sign in, Create account, recovery, email code entry,
  authentication callback, and the complete consultation lifecycle.
- Implemented in source on 2026-08-06: the generated color stage uses the
  supplied dark concave inset treatment: 38-point blurred inner shadows with a
  30-percent white highlight at minus 20 points and a solid `#000000` shade at
  plus 20 points. The color field remains unchanged.
- Implemented in source on 2026-08-06: each foreground marketing preview card
  now sits inside a separate unclipped rounded shadow host. Its stronger soft
  black shadow renders outside the clipped glass card, giving the preview clear
  lift above the recessed generated color stage.
- Implemented in source: the Spotify capture is full-width, uses its natural
  source aspect ratio, remains pinned to the top, and allows only the bottom to
  be clipped by the preview card, matching the PWA image rule.
- Implemented in source: Sign in and Create account share one full-screen FLYNT
  account surface with system Sign in with Apple first, Google second, email
  code, recovery, consent, and shared FLYNT legal sheets. Apple and Google use
  the same primary button hierarchy while email is a centered text action. The
  Google control uses the PWA's four-color vector G, rasterized locally for the
  native image pipeline, with an Apple-scale centered icon and label group.
  Marketing, account, authentication callback, and boot canvases use the app's
  shared `#111111` dark surface so transitions do not reveal the older
  `#1E1E1D` canvas. The first-run seen marker is recorded when the first app
  session begins displaying marketing, so later signed-out launches enter
  authentication directly. This non-secret marker lives in the installed app's
  documents container rather than Keychain, so uninstalling the app also
  removes it and a new download receives one new first-run sequence.
- Verified locally on 2026-08-04: all seven native feature contracts,
  TypeScript, focused ESLint, copy style, and whitespace validation passed.
- Verified in the running iPhone 17 / iOS 26.5 Simulator on 2026-08-04: the
  first and Trainer stories rendered blurred PWA color fields without the prior
  hard diagonal polygons. The Spotify story showed the complete top edge,
  player artwork, metadata, playback controls, and initial queue content at the
  correct width. The signed-out marketing flow and unified account page were
  verified in dark appearance. A launch without the install-scoped marker
  opened to marketing, then a stopped and relaunched app opened directly to
  Sign in without replaying marketing. The Apple and Google controls rendered
  with matched primary-button geometry and type, the centered multicolor Google
  mark, and the separate email text action. Light appearance, an actual
  uninstall and clean reinstall, larger Dynamic Type, VoiceOver speech and
  order, Reduce Transparency, TestFlight, and a physical iPhone remain
  unverified.
- Implemented in source on 2026-08-05: Google now uses the FLYNT-owned
  `FlyntGoogleAuth` Swift Expo module and the official GoogleSignIn 9.2 iOS
  SDK. Swift configures the registered iOS and server clients, presents the
  provider, supplies the SHA-256 nonce through Google's native nonce overload,
  and returns only the identity token. The shared authentication layer retains
  the raw nonce for Supabase verification and remains the only Supabase session
  authority. The React Native Google wrapper and its CocoaPods adapter were
  removed rather than patched. Apple's provider boundary remains the native
  Swift `expo-apple-authentication` implementation. The Create account route
  retains explicit FLYNT legal consent before starting either provider and
  records acceptance only after Supabase returns a session.
- Verified locally on 2026-08-05: the nine native feature contracts, eight
  authentication tests, 11 authoritative boot tests, two lifecycle navigation
  tests, global sheet contract, whole-project TypeScript, ESLint, copy style,
  and whitespace validation passed. CocoaPods linked `FlyntGoogleAuth` and
  removed `RNGoogleSignin` and `ExpoAdapterGoogleSignIn`. The Debug workspace
  built, installed, and launched on iPhone 17e / iOS 26.5, then reached
  Google's native `accounts.google.com` account chooser from Create account.
  The selected-account token exchange, account creation, legal acceptance
  write, lifecycle boot, TestFlight, and physical iPhone remain unverified.
- Corrected and verified in Simulator on 2026-08-05: a development-only
  `consultation_required` server flag had bypassed the real session gate and
  made signed-out state look authenticated. The forced preview server was
  stopped and replaced by one normal Metro server on port 8081. Reloading the
  same Simulator with no stored session opened Sign in, not consultation. The
  separate lifecycle Settings placeholder was removed; consultation, loading
  failure, program-building, and attention-state actions now share the real
  authenticated Profile & Settings route. Native feature contracts prevent the
  deleted route from being restored.
- Implemented in source on 2026-08-05: native provider authentication now
  separates identity authentication from admission to an existing FLYNT
  account, matching the production PWA. Sign in reads the server-owned
  `/api/account/status` endpoint and proceeds only when an athlete profile has
  accepted the current Terms. A Google, Apple, or email identity without that
  application account is signed out locally and directed to Create account.
  Create account records the current Terms through
  `/api/account/accept-terms` before authoritative boot can enter consultation.
  The client does not infer account existence from provider identity or create
  athlete state during the sign-in check.
- Implemented in source, updated on 2026-08-06: the complete signed-out
  marketing, Sign in, Create account, legal, authentication-callback, and
  consultation experience defaults to FLYNT dark appearance regardless of the
  device appearance. The shared lifecycle-aware theme boundary restores the
  authenticated account's saved System, Light, or Dark preference after
  consultation. Onboarding route canvases, status-bar content, provider
  controls, text, and transitions share the dark tokens. This is a FLYNT
  product decision; Apple Color and Accessibility guidance governs contrast and
  adaptation but does not prescribe this default.
- Verified in the running iPhone 17e / iOS 26.5 Simulator on 2026-08-06: the
  existing-account Sign in page and Trouble signing in recovery page use the
  shared dark canvas, light status-bar content, adaptive FLYNT mark, readable
  muted copy, and light provider controls. Create account, submitted email-code
  entry, authentication callback, and consultation were not rerun in Simulator
  after this appearance-boundary change.
- Implemented and verified in the running iPhone 17e / iOS 26.5 Simulator on
  2026-08-06: focused email-entry groups receive additional bottom clearance,
  moving recovery and regular email tasks higher as one unit without changing
  the provider Sign in or Create account landing layouts. Submitted code entry
  uses the same source path but was not submitted or rerun.
- Release smoke verification on 2026-08-06: commit `32e56cc` passed eight auth,
  11 authoritative boot, two lifecycle navigation, and 14 native feature tests,
  plus TypeScript, ESLint, and copy validation. A clean Debug workspace build
  installed and launched on iPhone 17e / iOS 26.5 Simulator. The dark Sign in,
  focused email entry, Trouble signing in recovery, Create account consent, and
  Terms & Safety sheet rendered and exposed their expected accessible actions.
  No provider request, email delivery, OTP verification, authenticated session,
  consultation mutation, workout mutation, or production data write occurred.
  Expo Doctor completed 16 of 20 offline checks; its online Expo config and
  React Native Directory checks could not resolve `exp.host`, and it retained
  the known local-module ignore warning plus the installed
  `react-native-keyboard-controller` 1.22.2 versus expected 1.21.9 mismatch.
- Verified locally on 2026-08-05: whole-project TypeScript, focused ESLint,
  nine native feature contracts, lifecycle navigation, copy style, and
  whitespace validation passed after the signed-out light-default boundary was
  added.
- Verified in the running iPhone 17e / iOS 26.5 Simulator on 2026-08-05: a
  fresh Debug build connected to the single LAN Metro server, rendered the
  signed-out marketing flow with the FLYNT light canvas and dark status-bar
  content, and transitioned to the light Sign in screen with adaptive Apple,
  Google, and email actions. Removing unsupported per-screen status-bar options
  left the shared Expo StatusBar and lifecycle-aware theme as the sole status
  appearance authority; the route transition completed without a native error.
- Design basis: current Apple HIG pages for Onboarding, Managing accounts, Sign
  in with Apple, Layout, Accessibility, and Launching, plus
  `docs/APPLE_HIG_BASELINE.md` and `docs/INTERACTION_SYSTEM.md`. Product copy,
  imagery, preview composition, and information hierarchy are FLYNT decisions
  sourced from the PWA.

## Consultation, Trainer, and workout customization parity | 2026-08-04

- Product source of truth: the implementation was traced against the real PWA
  in `/Users/lukemcglynn/FLYNT`, including the production exposure commit
  `86b7208`, consultation setup and guided prompts, Trainer approval tools,
  profile override persistence, authenticated exercise catalog, and deployment
  `dpl_GFpmMXKSdWtPhMgb2ZDkuSckdGkm`. The PWA repository was not edited.
- Implemented in source: the first-sign-in consultation replaces the native
  placeholder with the PWA's four-step basics flow, six guided Trainer turns,
  persisted conversation rendering, review summary, legal acceptance, retry,
  Settings, sign-out recovery, and server-owned program-build confirmation.
  Small draft basics are stored only through Keychain-backed SecureStore and
  scoped to the server conversation identifier.
- Implemented in source: post-login Trainer now sends through the existing
  authenticated `/api/trainer` contract, renders persisted user and assistant
  messages, retains failed messages for retry, shows the PWA's three quick
  prompts, renders bounded proposed plan changes, and applies a plan change only
  after explicit athlete approval through the server-owned program endpoint.
- Implemented in source on 2026-08-04: Trainer conversation layout now uses the
  maintained `@kesha-antonov/react-native-chat` shell with its native
  virtualized list and keyboard controller. Assistant messages use the
  Fabric-native GitHub Markdown renderer with headings, lists, links, code, and
  selectable text on the page canvas without an assistant card. Quick prompts
  exist only in the synthetic opening message and disappear when conversation
  content exists. Thinking feedback occupies the newest-message edge only while
  a request is active. The composer uses the iOS 26 native tabs bottom accessory
  instead of an absolute screen overlay, and the chat reserves shared-token
  clearance so the newest response remains above it. Earlier supported iOS
  versions keep the same composer inside the chat layout because UIKit bottom
  accessories require iOS 26. On iOS 26 the FLYNT input, send control, draft
  sizing, and timer state render directly inside the system accessory. They do
  not add a second `GlassView` inside the native glass capsule. Earlier iOS and
  Reduce Transparency fallbacks retain one explicit FLYNT surface.
- Implemented in source on 2026-08-05: consultation and signed-in Trainer now
  render through one `FlyntChatThread` and one shared native composer surface.
  Both use the same virtualized list, Markdown Trainer responses, FLYNT thinking
  state, automatic bottom tracking, athlete bubble, bounded multiline input,
  and overlay clearance. Consultation retains its server-owned guided prompts,
  secure draft, retry, review, legal, and build logic, and omits only the tab
  bar. The shared Trainer hero is a list header, so its title and explanatory
  copy scroll away while the safe-area menu row remains fixed. Inline composers
  float above the conversation; messages can move beneath the translucent
  material, and shared bottom clearance keeps the final item readable. Athlete
  bubbles use the FLYNT black fill in light appearance and the shared `#222222`
  item surface in dark appearance.
- Refined and verified in Simulator on 2026-08-05: the shared chat list uses a
  real footer spacer, so automatic bottom tracking includes the overlaid
  composer rather than ending beneath it. The same footer owns the visible
  `FLYNT is thinking` state, which was confirmed in a recorded server request.
  Consultation no longer treats a sixth user message as proof of completion;
  it waits for the server response to state that the profile is ready before
  exposing Review. Content extends behind the fixed menu to the physical top
  edge, where a short translucent status-bar scrim replaces the former hard
  clipping line. The inline light-mode composer retains its glass shape and
  receives only a subtle shadow. Its bottom scrim begins below the composer in
  the safe-area region. Current and future Markdown bullets use sentence case;
  the native renderer normalizes stored replies and the PWA Trainer prompt was
  corrected for future output. These are FLYNT presentation decisions grounded
  in Apple Layout, Materials, Accessibility, and Motion guidance. No departure
  from Apple guidance was required.
- Implemented in source: Today exposes Edit beside the workout title. The
  Today page transforms in place into a maintained draggable list with
  handle-only reordering and native gesture-handler swipe actions. Add, custom
  add, remove, replace, undo, and exercise detail editing continue through the
  shared FLYNT sheet. Published exercise search includes current library
  visuals and identity slugs. Editable fields cover sets, reps, load, rest,
  RPE, tempo, and notes. Overrides remain keyed by week and day and leave the
  original FLYNT prescription unchanged.
- Implemented in source as a FLYNT motion decision: a row begins easing into
  its raised card surface as soon as a swipe begins. Drag release is separated
  from the list library's placement animation, so the row starts a 160 ms
  return to the resting canvas when touch ends instead of waiting for the item
  snap to finish. Reduce Motion resolves both transitions immediately.
- Sheet rule: every new legal, library, workout, and exercise editor surface is
  a page inside `FlyntSheet`. No feature creates or styles a direct local bottom
  sheet. The global native-material host now follows Expo UI's fixed-detent
  React Native host sizing pattern, which keeps global sheet footers inside the
  safe area.
- Implemented in source on 2026-08-04: exercise, Spotify, progress, rest timer,
  workout editor, consultation, and settings sheets now resolve the approved
  full-size translucent presentation background and expanded 98-percent detent
  from `src/constants/sheet.ts`. The extra material and content-overlay stack
  was removed. Per-feature 44-percent and 66-percent detents and the exercise
  medium detent were removed. A named sheet can receive an explicit override
  without changing the global defaults; an all-sheet change edits the defaults.
  A source contract fails if a new direct sheet host bypasses this system.
- Interaction and accessibility basis: current first-party Apple HIG pages for
  Onboarding, Search fields, Drag and drop, Accessibility, Layout, and Motion,
  plus `docs/APPLE_HIG_BASELINE.md` and `docs/INTERACTION_SYSTEM.md`. Search
  filters as text changes, controls meet the 44-point target baseline, drag
  reorder uses a visible handle, and VoiceOver receives adjustable move-up and
  move-down actions as the required non-drag alternative. No custom motion runs
  when the existing system and shared component behavior is sufficient.
- Expo basis: exact SDK 57 documentation for Router, SecureStore, and Expo UI,
  plus the installed SDK 57 Expo UI fixed-detent host implementation. No Expo
  API was added from memory.
- Verified locally on 2026-08-04: authentication 8 of 8, authoritative boot 11
  of 11, lifecycle navigation 2 of 2, native feature contracts 4 of 4, and the
  global sheet-system contract passed. TypeScript, ESLint, copy style, and
  `git diff --check` passed. Expo
  Doctor's remaining two findings are recorded in Current local verification.
- Verified in iPhone 17 / iOS 26.5 Simulator on 2026-08-04: native build and
  launch passed; signed-out launch passed; consultation welcome, basics,
  experience, disabled selection state, Settings escape, light appearance, and
  dark appearance rendered; Today editor safe-area footer rendered; exercise
  detail fields rendered; direct drag reordered the first exercise beneath the
  second; visible arrow buttons are absent; adjustable accessibility handles
  expose position values; and Trainer quick prompts and composer rendered.
- Re-verified in the running iPhone 17 / iOS 26.5 Simulator on 2026-08-04:
  entering the in-place editor rendered the fixed Cancel and Save row, a left
  swipe exposed the circular Replace and Delete actions while the exercise used
  the raised card surface, and releasing a handle drag returned the exercise to
  the resting canvas without leaving the active card color behind. TypeScript,
  focused ESLint, and whitespace validation passed after the motion change.
- Verified in the running iPhone 17 / iOS 26.5 Simulator on 2026-08-04: the
  rebuilt Trainer opened with upright opening content, showed prompts only in
  that opening state, and placed the FLYNT glass composer in the native bottom
  accessory above the tab bar. An isolated nonproduction conversation fixture
  then rendered a right-aligned athlete bubble and an uncarded Trainer response
  with a Markdown heading, bullet list, and paragraph; the prompt chips were
  absent and the response remained fully above the composer. The fixture was
  removed after the check. Apple Accessibility, Layout, Text Fields,
  Typography, and Design Principles guidance plus the FLYNT interaction system
  informed the implementation. Software-keyboard animation and a live server
  response remain unverified after this shell replacement.
- Re-verified in the running iPhone 17 / iOS 26.5 Simulator on 2026-08-04: the
  native tab accessory provided the sole glass capsule around the FLYNT
  composer. Empty and typed draft states rendered without the prior nested
  capsule, the input remained labeled `Message Trainer`, and entering text
  enabled the existing arrow send control. Earlier-iOS fallback rendering,
  Reduce Transparency, software-keyboard animation, multiline growth, and live
  sending remain unverified for this correction.
- Not yet verified: authenticated production writes and streamed responses,
  consultation review and legal sheets with a real completed tool result,
  published exercise-library visuals from a signed-in native session, Trainer
  proposal approval with a real server tool call, undo after every operation,
  Dynamic Type sizes, VoiceOver spoken order, Reduce Motion, Reduce
  Transparency, interruption recovery, TestFlight, and physical iPhone.

## Today WidgetKit scope | 2026-08-04

- Implemented in source with Expo SDK 57's official `expo-widgets` package:
  `FlyntTodayWidget` is the only current Home Screen widget configuration and
  supports system small, medium, and large families. Next Set and Week remain
  design references for later work, but their source modules, configuration,
  generated Swift registrations, and snapshot publications were removed on
  2026-08-04. The extension is generated reproducibly from Expo configuration
  rather than maintained as an untracked one-off Xcode target.
- Implemented in source: the app and extension share
  `group.com.threesixtyvue.flynt`; EAS configuration advertises extension
  bundle identifier `com.threesixtyvue.flynt.widget`. The host app publishes a
  privacy-limited snapshot containing workout and weekly plan labels, completed
  and total counts, next-exercise prescription fields, lifecycle state, and
  update timestamp. No session credential, athlete identity, health note, or
  direct server access enters a widget.
- Implemented Today states: signed out, no plan, program building, unavailable,
  recovery day, ready workout, active workout, completed workout, and stale
  data. Today opens `flynt://today`. A lifecycle-aware root link handler applies
  the destination only after the authenticated ready route is available.
- Implemented in source: Today inspects WidgetKit's rendering mode and uses an
  alpha-based monochrome hierarchy in accented mode. This lets iOS replace the
  removable container background with its native Clear Liquid Glass or tinted
  treatment while preserving distinct primary text, secondary text,
  separators, item surfaces, selected states, and action fills. Full-color
  light and dark palettes remain unchanged.
- Apple and FLYNT design basis: Apple Widgets, Layout, Typography,
  Accessibility, and App Groups guidance plus the repository Apple HIG
  baseline and FLYNT interaction system. Today is a glanceable status surface
  rather than a compressed workout editor. It summarizes current training
  progress and intentionally has no embedded mutation controls because workout
  writes remain authenticated and server-owned.
- Verified locally on 2026-08-04: Expo prebuild regenerated a WidgetKit bundle
  containing only `FlyntTodayWidget` plus Expo's generated Live Activity host.
  The generated widget configuration declares only system small, medium, and
  large. TypeScript, ESLint, and copy style passed. The shell used Node 22.23.1
  instead of the repository's pinned Node 24.14.0 and reported the known engine
  warning.
- Verified in iPhone 17 / iOS 26.6 Simulator on 2026-08-04: a fresh native build
  installed the Today-only extension. The Home Screen context menu exposed
  exactly Small widget, Medium-sized widget, and Large widget. Each family
  rendered after live resizing. The large ready-workout state showed the week
  row directly above the title with the intended compact boundary after the
  explicit title inset changed from 12 to 4 points. No other large-widget
  content, geometry, or behavior changed. Small and medium fallback states
  rendered without clipping. Reduce Motion adds no special case because Today
  defines no custom motion. Reduce Transparency remains unverified.
- Verified in iPhone 17 / iOS 26.5 Simulator on 2026-08-03: the rebuilt widget
  extension rendered Today medium in the Home Screen's native Clear Light
  appearance. WidgetKit removed the opaque FLYNT container, supplied the
  wallpaper-responsive Liquid Glass surface, and retained legible signed-out
  title and action hierarchy. Clear Dark, tinted rendering, authenticated
  workout layouts, increased contrast, and Reduce Transparency remain
  unverified for the new accented palette.
- Historical EAS evidence from 2026-08-03: signed internal development build
  `65810869-2f75-4f3f-8354-67fa41917785` finished successfully for a physical
  iPhone with the earlier three-widget extension, App Group capability, and
  both provisioning profiles. It does not verify the current Today-only binary.
- Implemented as a local review tool on 2026-08-03:
  `tools/widget-review.html` presents the approved Claude handoff beside current
  native captures for all 18 Home Screen family, size, and appearance targets,
  seven lifecycle-state variations, and six Lock Screen or Live Activity
  targets. Per-target good notes, requested changes, and approval checkmarks
  persist in the browser and export as a feedback brief or JSON. Goal images
  are exact crops from the supplied handoff. Current installed Simulator
  captures are present for all six Today size and appearance targets. Next Set,
  Week, lifecycle, and Lock Screen current captures remain explicitly pending,
  and no visual target is marked accepted by this tool.
- Not yet verified: the current Today-only configuration in an EAS device
  build, physical-iPhone installation, Home Screen refresh timing, background
  refresh after workout mutations, every lifecycle state in every family,
  larger Dynamic Type categories, VoiceOver speech on physical SpringBoard,
  Reduce Transparency, and tinted or accented rendering.

## Shared app surfaces | 2026-08-02

- Implemented in source as a FLYNT visual-system decision: Today, Plan,
  Progress, Trainer, Profile, and App now resolve their page canvas through one
  shared primary-background token. Dark appearance uses `#111111`; light
  appearance preserves the existing Today canvas `#F7F6F2`.
- Implemented in source: content placed directly on those page canvases now
  resolves through one shared item-background token. Dark appearance uses
  `#222222`; light appearance preserves the existing Today exercise-thumbnail
  surface `#F2F2F1`. Plan rows, Progress metrics and history, Trainer coach and
  prompt surfaces, Profile information surfaces, and App settings groups use
  the shared item token. Sheets, nested surfaces, semantic selection states,
  user messages, and primary or destructive actions retain their own tokens.
- Implemented in source on 2026-08-02: the Appearance segmented control and the
  Account & Data action stack no longer add an item-background container. Both
  areas sit directly on the shared primary page background while the segmented
  control and the Sign Out, Export Data, and Delete Account buttons retain their
  existing size, spacing, treatment, and behavior.
- Verified locally on 2026-08-02: focused ESLint and whole-project TypeScript
  passed after the shared token migration.
- Verified in the running iPhone 17 / iOS 26.5 Simulator development preview on
  2026-08-02: Plan, Progress, Trainer, Profile, and App rendered the shared
  primary and item surface hierarchy in both dark and light appearances. The
  ready-state preview was used, so no account credentials or production data
  were involved. Dynamic Type, VoiceOver, Reduce Motion, and Reduce
  Transparency remain to be reverified for the broader current UI.
- Verified in the running dark-appearance Simulator preview on 2026-08-02: the
  Appearance selector and all three Account & Data buttons render directly on
  the primary background without an enclosing item card.

## Authoritative workout data foundation | 2026-08-02

- Implemented in source: the tab application now resolves its week, exercises,
  current-day date labels, completed-set counts, finished-workout state,
  session count, tracked-lift count, and Progress history through one
  `WorkoutDataProvider`. An authenticated ready account consumes the existing
  `/api/app-state` payload; the static fixtures remain available only when the
  explicit development preview lifecycle is active.
- Implemented in source: Progress refreshes normalized workout sessions and
  their related set rows from the existing authenticated `/api/workouts`
  endpoint. The client maps only completed sets into the history sheet and
  provides loading, empty, refresh-error, and Retry states. Legacy app-state
  session summaries remain a useful fallback if the normalized refresh fails.
- Implemented in source: the native Zod boundary now validates program-week
  metadata, legacy workout summaries, normalized workout sessions, related set
  rows, numeric database values, nullable fields, and the workout-history
  response before any value reaches the UI.
- Architecture evidence: the phone does not query server-owned training tables
  directly. It uses the existing FLYNT server, which validates the Supabase
  access token and owns lifecycle, program, profile, and workout persistence.
  The mobile bundle receives only the public project URL and publishable key;
  no service-role or secret key was copied. Current Supabase React Native Auth,
  API key, secure-data, and Row Level Security guidance and the 2026 breaking
  change index were consulted.
- Local environment: the native ignored `.env.local` now reuses the PWA's
  configured public Supabase URL and publishable key plus the production FLYNT
  API base URL. The preview lifecycle override is absent from that file.
- Verified locally on 2026-08-02: whole-project TypeScript, ESLint, copy style,
  and diff hygiene passed. Both production endpoints returned `401` without an
  access token, confirming that they are reachable and retain their
  authenticated boundary. Expo loaded only the three expected public native
  variables from the ignored file.
- Verified in the iPhone 17 / iOS 26.5 Simulator on 2026-08-02: launching from
  the newly configured non-preview Metro server resolved to the signed-out
  lifecycle with Create account and Sign in, rather than exposing preview or
  workout content without a session. A real-account app-state response and
  database-backed Today, Plan, and Progress rendering remain unverified until
  an account is signed in on the Simulator.

## Authenticated account surfaces and Trainer | 2026-08-02

- Implemented in source: Profile now hydrates the signed-in athlete's name,
  avatar, age, height, weight, consultation experience, primary goal,
  equipment, and scheduled training-day count from the validated
  `/api/app-state` response. The Luke preview identity and fixed personal
  metrics no longer appear for an authenticated account.
- Implemented in source: App Settings hydrates appearance, Spotify player
  placement, reminders, reminder time, automatic progression, progression
  mode, rest timers, and rest mode from the authenticated preference payload.
  Supported preference changes use the existing `/api/preferences` endpoint,
  and Personal Details uses the existing `/api/athlete-profile` endpoint. Both
  requests continue through the server's bearer-token account boundary instead
  of querying Supabase training tables from the phone.
- Implemented in source: the root account providers are keyed to the current
  authenticated account. A local change can remain responsive without leaking
  into the next signed-in account. Theme and settings fall back to server truth
  whenever no account-scoped local override exists.
- Implemented in source: Trainer renders the authenticated conversation
  messages when present and otherwise builds its opening context from the real
  athlete name and current program day. Sending consumes the existing streamed
  `/api/trainer` response, preserves the authoritative conversation workflow,
  then silently refreshes `/api/app-state` to render the persisted result.
  Loading and failure feedback are visible, and failed text remains available
  in the conversation surface.
- Source guidance: current Supabase session, `getUser`, React Native Auth, and
  2026 breaking-change guidance were checked. The existing Keychain-backed
  storage, foreground token refresh, publishable client key, and server-owned
  account isolation remain unchanged. No service-role credential or direct
  training-table access was added to the native client.
- Verified locally on 2026-08-02: eight auth tests, 11 authoritative boot
  tests, two lifecycle navigation tests, whole-project TypeScript, ESLint, and
  copy style passed. The configured shell still reports Node 22.23.1 against
  the repository's required Node 24.14 range.
- Verified in the signed-in dark-appearance iPhone 17 / iOS 26.5 Simulator on
  2026-08-02: Profile rendered Priya's server-provided avatar, name, age,
  height, weight, training summary, equipment context, and five-day schedule.
  App rendered the saved System appearance, Pill Spotify placement, disabled
  reminders, enabled Balanced progression, and enabled Adaptive rest timing.
  Trainer rendered Priya and the authoritative Sunday recovery day instead of
  the prior preview identity and workout. Production preference writes,
  Personal Details writes, and Trainer sending were not exercised because
  verification must not alter the athlete's real account without an intentional
  user action.

## Live exercise catalog metadata | 2026-08-02

- Implemented in source: authenticated program exercise IDs are sent to the
  existing `/api/exercises` boundary. The validated response merges published
  guide steps, alt text, dimensions, and visual URLs into the current program
  without replacing prescription, lifecycle, or workout ownership logic.
- Implemented in source: API-relative exercise assets resolve against the
  configured FLYNT server. Published server artwork has priority, the five
  approved bundled assets remain an offline fallback, and the system-symbol
  placeholder remains available when neither source has artwork.
- Verified locally on 2026-08-02: TypeScript, ESLint, copy style, and diff
  hygiene passed for the catalog boundary and renderer.
- Verified in the signed-in iPhone 17 / iOS 26.5 Simulator on 2026-08-02:
  the database-backed Monday program rendered published visuals for
  Half-kneeling Kettlebell Halo, Seated 90/90 Hip Switch,
  Double-kettlebell Front Squat, and additional live program exercises.

## Native Spotify live-state boundary | 2026-08-02

- Implemented in source: development mode no longer automatically replaces an
  unavailable Spotify session with the Dai Dai preview queue. Preview playback
  requires the explicit `EXPO_PUBLIC_SPOTIFY_PREVIEW=1` development flag, and
  normal builds are driven only by the existing native Spotify App Remote
  module's configured, unavailable, disconnected, connecting, connected, and
  error states.
- Implemented in source: the disconnected sheet retains the shared 98-percent
  native material presentation and the PWA's Connect Spotify hierarchy,
  active-device explanation, Spotify Premium requirement, and privacy note.
  An unconfigured build shows a disabled setup-required action instead of
  starting a broken authorization attempt. The provider now also exposes the
  native disconnect operation for a later connected-account control.
- Source guidance: official Spotify iOS Getting Started and App Remote
  lifecycle documentation plus Apple Sheets, Privacy, Layout, and
  Accessibility guidance were checked. Spotify remains optional and every
  nonconnected state leaves the training app usable.
- Verified locally on 2026-08-02: TypeScript, ESLint, copy style, and diff
  hygiene passed. The public Spotify client identifier is now present in the
  ignored local development environment. The user reported adding the FLYNT
  iOS bundle identifier, Web API and iOS capabilities, and the native callback
  to the existing Spotify developer application. Dashboard state was not
  independently inspected.
- Verified after a clean native rebuild in the signed-in dark-appearance
  iPhone 17 / iOS 26.5 Simulator on 2026-08-02: the launcher displayed Connect
  Spotify, opened the shared native material sheet, retained a 44-point Close
  path, and reported Spotify as configured but unavailable because the Spotify
  iOS app is not installed in Simulator. The disabled setup-required state no
  longer appeared, and no fake track data was exposed.
- Physical-device authorization and playback remain unverified. That evidence
  requires Spotify installed and signed in on a physical iPhone, a Spotify
  Premium account, successful return through `flynt://spotify-callback`, and
  App Remote playback and interruption checks.

## EAS physical-device development distribution | 2026-08-02

- Implemented in source and Expo configuration: the repository is linked to
  `@tsv-ai/flynt-native`, with development, preview, and production profiles in
  `eas.json`. The development profile uses an Expo development client, internal
  iOS distribution, the EAS development environment, Node 24.14.0, and a
  physical-device archive rather than a Simulator archive.
- Implemented in external configuration: the four public runtime values needed
  for the server, Supabase client, and Spotify client are stored in the EAS
  development environment. Apple bundle identifier
  `com.threesixtyvue.flynt`, Sign in with Apple, a distribution certificate,
  and an active ad hoc provisioning profile were created through the owner's
  Apple Developer team. One iPhone is enabled in that profile.
- Verified in EAS Build on 2026-08-02: build
  `4c19cea9-de2d-4640-8ef4-1a83e076284b` finished successfully as FLYNT 1.0.0
  build 1 for Expo SDK 57. The signed internal IPA and the registered-device
  installation dialog are available from the Expo build record through
  2026-08-16 local time.
- Verified in EAS Build on 2026-08-03: development build
  `65810869-2f75-4f3f-8354-67fa41917785` added the registered WidgetKit bundle,
  App Group capability, and widget provisioning profile and produced a signed
  internal IPA successfully. This supersedes the 2026-08-02 build for device
  testing and is available through 2026-08-17.
- Not yet verified on a physical iPhone: installation, first launch, live
  backend session restoration, Spotify authorization callback, App Remote
  playback, light and dark appearance, safe areas, Dynamic Type, VoiceOver,
  Reduce Motion, and Reduce Transparency remain acceptance checks after the
  build is installed.

## Exercise-sheet input contrast | 2026-08-02

- Implemented as a focused FLYNT visual adjustment: dark-appearance Load and
  Reps input surfaces use `#282828`, one restrained luminance step above the
  surrounding sheet and visually closer to the exercise-media surface. Input
  dimensions, capsule geometry, borders, labels, text, controls, touch targets,
  accessibility metadata, and interaction behavior are unchanged.
- Verified in the running dark-appearance iPhone 17 / iOS 26.5 Simulator on
  2026-08-02: all four Overhead Squat rows rendered the lighter input treatment
  while their native text fields, plus and minus controls, completion controls,
  and sheet geometry remained intact. Light appearance and Increase Contrast
  remain to be verified for this adjustment.

## Trainer composer and Personal Details sheet | 2026-08-02

- Implemented in source: Trainer conversation draft and sent-message state now
  live above the tab route so the composer can survive route-host rendering.
  The composer provides a leading attachment action, a multiline native text
  field, a microphone action, and a trailing Send action. It grows upward from
  one line to a four-line maximum, then scrolls its text. A running rest timer
  replaces the attachment action on Trainer and opens the existing timer sheet.
- Implemented in source as a FLYNT presentation decision: Trainer uses a
  keyboard-aware Liquid Glass footer immediately above the native tab bar. The
  iOS 26 tab bottom accessory was evaluated first, but the system hides that
  accessory with the tab bar during keyboard entry. The footer therefore uses
  the native glass API where available, an opaque fallback for Reduce
  Transparency and earlier systems, and preserves 44-point action targets.
  Apple HIG Tab bars, Text fields, Layout, and Liquid Glass guidance and Expo
  SDK 57 native-tabs bottom-accessory documentation were consulted.
- Implemented in source: the composer is absolutely anchored to the keyboard's
  reported frame instead of resizing the Trainer page. Opening the software
  keyboard therefore leaves page content in place, preserves the keyboard's
  rounded top-corner reveal, and prevents underlying page controls from being
  pushed behind the composer.
- Implemented in source: moving composer glyphs now use Expo SDK 57's dedicated
  native `SymbolView` rather than a nested SwiftUI host. This keeps Plus, Mic,
  Timer, and Send aligned while the composer follows the keyboard. The exact
  Expo SDK 57 Symbols documentation was consulted and `expo-symbols` is pinned
  to the recommended SDK-compatible version.
- Verified locally on 2026-08-02: whole-project TypeScript and ESLint passed.
- Verified in the running dark-appearance iPhone 17 / iOS 26.5 Simulator on
  2026-08-02: the empty composer cleared the native tab bar, Plus, Mic, and Send
  aligned within the glass surface, the software keyboard left the composer
  visible without moving the page, a long draft expanded upward to four lines,
  the keyboard-open and closed states retained one symbol centerline, Send
  appended the local preview message, and the field cleared and collapsed.
  Attachment and voice
  actions currently present explicit preview alerts because live services are
  not connected. Light appearance, Dynamic Type, VoiceOver order, Reduce
  Motion, Reduce Transparency, and active-rest-timer coexistence remain to be
  verified for this revision.
- Implemented in source: Personal Details and Training Profile now compose
  their presentations through the shared `FlyntSheet` and `FlyntSheetCard`
  primitives. The primitives inherit the native material presentation, detent,
  safe-area treatment, 44-point glass Close control, left-aligned title,
  content insets, and full-width sheet-item geometry. Training Profile keeps
  its intentional 66-percent detent, inverted appearance, nested Back action,
  and selection content as explicit component-level configuration.
- Verified in the running dark-appearance iPhone 17 / iOS 26.5 Simulator on
  2026-08-02: Personal Details retained its 98-percent native detent, material
  surface, full-width grouped field card, editable fields, and isolated Close
  action after migration to the shared scaffold. Training Profile retained its
  66-percent detent, inverted appearance, full-width grouped rows, nested Back
  action, selected checkmark, and Close action. Light appearance, Dynamic Type,
  full VoiceOver reading order, and Reduce Transparency remain to be verified
  for the shared scaffold.

## Plan workout status | 2026-08-02

- Implemented in source: Plan no longer displays exercise-count circles. Its
  trailing area now communicates workout state from the same shared preview
  progress used by Today. A completed workout uses the native
  `checkmark.circle.fill` symbol, a partially completed workout shows the
  completed and total set counts, an upcoming workout has no trailing status,
  and the Rest day uses a plain `Rest` label instead of zero.
- Implemented in source: Today set completion and finished-workout state moved
  into a tab-level preview provider, so navigating between Today and Plan no
  longer creates two independent progress copies. Plan rows expose the full
  status in their accessibility labels while decorative trailing content is
  hidden from duplicate VoiceOver traversal.
- Verified locally on 2026-08-02: whole-project TypeScript, ESLint, and diff
  hygiene passed.
- Verified in the running dark-appearance iPhone 17 / iOS 26.5 Simulator on
  2026-08-02: Plan rendered partial states as `4 of 17`, omitted trailing
  content for not-started training and recovery rows, and rendered `Rest` for
  Sunday. Completing one additional Friday set on Today changed the same Plan
  row to `5 of 17` without reloading. The runtime accessibility snapshot exposed
  `5 of 17 sets complete`. A fully completed workout checkmark, light
  appearance, Dynamic Type, and VoiceOver reading order remain to be visually
  verified for this revision.

## Progress completed-workout sheet | 2026-08-02

- Implemented in source from the PWA product hierarchy: every Recent workouts
  row is now a descriptive button that opens a completed-workout sheet without
  leaving Progress. The sheet shows the completed date, completed and planned
  set counts, total volume, exercise-grouped set history, load, reps, optional
  RPE or pain context, and the PWA legacy-session empty state when set details
  are unavailable.
- Implemented in source: the Progress detail uses the same shared `FlyntSheet`
  and `FlyntSheetCard` primitives as standard Settings detail sheets. The
  default is the 98-percent native regular-material presentation with the
  shared title, eyebrow, Close control, safe area, 18-point content inset, and
  cards that stretch to the full inherited content width. Utility sheets with
  different tasks, such as the compact rest timer, retain explicit detent and
  control-layout overrides on the same low-level native presentation host.
- Design evidence: Apple HIG Sheets, Designing for iOS, Design principles, and
  Accessibility were consulted on 2026-08-02. The sheet keeps the person in the
  Progress context for one scoped inspection task, uses the system sheet and
  drag behavior, exposes 44-point controls, and avoids a nested sheet. The PWA
  remains authoritative for workout-history content and information order.
- Verified locally on 2026-08-02: whole-project TypeScript, ESLint, copy style,
  and diff hygiene passed. The configured shell reported Node 22.23.1 against
  the repository's Node 24.14 requirement, so the checks passed with the known
  engine warning.
- Verified in the running dark-appearance iPhone 17 / iOS 26.5 Simulator on
  2026-08-02: all three workout rows exposed complete VoiceOver labels; Lower
  Strength opened the 98-percent material sheet with full-width summary and
  exercise cards; Close dismissed to Progress; and Conditioning rendered the
  legacy set-history empty state. Light appearance, larger Dynamic Type, full
  VoiceOver reading order, Reduce Motion, and Reduce Transparency remain to be
  verified for this revision.

## Native app icon | 2026-08-01

- Implemented in source: the approved 1024-point FLYNT Default and Dark exports
  replace the starter icon. Expo SDK 57 now receives semantic Light, Dark, and
  Tinted sources through `ios.icon`; the Tinted source is grayscale so iOS can
  apply the athlete's selected system tint. The native asset catalog contains
  the corresponding universal light, dark, and tinted appearances.
- Verified locally: Expo resolved all three semantic icon paths, the generated
  Light and Tinted catalog assets are opaque, and all generated catalog assets
  are 1024 by 1024 points.
- Verified in Simulator: scheme `FLYNT` built, installed, and launched on iPhone
  17 / iOS 26.5 in 20.5 seconds. The approved white Default icon rendered on the
  Home Screen. Dark and Tinted are bundled in the native asset catalog but their
  Home Screen customization modes have not yet received separate visual review.

## Exercise artwork and logging density | 2026-08-01

- Implemented in source: five owner-supplied two-position exercise illustrations
  now map to Goblet Squat, Overhead Squat, Single-Leg Romanian Deadlift, Glute
  Bridge, and Dumbbell Step-Up. Each movement uses the same artwork registry for
  its Today list thumbnail and full exercise-sheet visual. Exercises without
  published artwork retain the existing system-symbol fallback.
- Implemented in source: exercise rows no longer repeat the prescribed set count
  or display incomplete fractions and chevrons in the trailing column.
  Workout-level progress remains visible, each row uses a quiet derived status
  circle, completed exercises receive a check and softened content, and the full
  prescription and set completion remain in the VoiceOver label.
  Each row now uses the established full-width native `Pressable` treatment,
  including the space between text and status. A held press applies the raised
  surface and 72-percent opacity feedback before the exercise sheet opens. The
  status circle retains a 16-point trailing inset within that pressed surface.
  The visible row summary is reduced to set count and rest only. Long exercise
  names can grow vertically without replacing the text with artwork.
- Implemented in source as a FLYNT surface decision: Today and its exercise
  sheet now share one semantic sheet-surface token in both appearances, removing
  the background-color shift when an exercise opens.
- Implemented in source as a reversible FLYNT surface test: Today uses
  `#111111` in dark appearance while light appearance retains the shared page
  canvas. This experiment is now the shared app-surface system documented
  above; the exercise sheet remains independently tokenized.
- Implemented in source on 2026-08-02: Today exercise-thumbnail backgrounds use
  the `#222222` sheet item background color in dark appearance. Light appearance
  retains `#F2F2F1`, and exercise-sheet entry surfaces remain unchanged.
- Verified in the running Simulator development build on 2026-08-02: all five
  visible Today exercise thumbnails rendered with the `#222222` dark item
  background while the page canvas, artwork, labels, and completion controls
  remained unchanged.
- Verified in the running Simulator development build on 2026-08-02: the Today
  dark-appearance canvas rendered as `#111111` while its cards, Spotify player,
  native tab bar, and exercise sheet treatment remained unchanged.
- Implemented in source as a FLYNT presentation decision: the exercise sheet
  uses one native SwiftUI regular-material presentation background with medium
  and 98-percent fractional detents. The fractional expanded state avoids the
  discrete opaque transition observed at the system large detent while leaving
  Today visible for context. Apple HIG Sheets and Materials guidance and the
  SwiftUI `PresentationDetent.fraction(_:)` API were consulted. Apple supports
  resizable sheets, fractional detents, and standard materials; the 98-percent
  value is a FLYNT choice rather than an Apple-prescribed dimension.
- Implemented in source as a reversible FLYNT contrast test: the regular sheet
  material carries a 70-percent black wash as an intentionally strong visual
  test to reduce its apparent luminosity
  over the shared page canvas without changing the material thickness.
- Implemented in source: the native tab bar now uses `text.page` and
  `text.page.fill` for Plan, `chart.bar` and `chart.bar.fill` for Progress, and
  `message` and `message.fill` for Trainer, preserving the unfilled default and
  filled selected-state convention.
- Implemented in source on 2026-08-02: Today now selects the native SF Symbol
  named `<local day>.calendar`, using the device date for the numeric prefix.
  The value refreshes at local midnight and whenever the app becomes active.
  Earlier iOS versions fall back to `calendar`; no custom icon asset is used.
- Verified locally and in the running iOS 26 Simulator development build on
  2026-08-02: the installed SF Symbols 7 catalog contains `1.calendar` through
  `31.calendar`, the current `2.calendar` symbol rendered above the Today label,
  and focused ESLint, whole-project TypeScript, and diff checks passed. Apple
  HIG Tab Bars, Icons, and SF Symbols guidance and the Expo Router 57 native-tab
  icon API were consulted. Showing the live day is a FLYNT product decision.
- Verified locally on 2026-08-02: the installed SF Symbols 7 type catalog
  contains `text.page` and `text.page.fill`, and focused ESLint passed for the
  native tab layout. Whole-project TypeScript remains blocked by three existing
  Spotify player type errors. A fresh Simulator build remains blocked by the
  existing missing `SpotifyAppRemote.h` native dependency.
- Verified in the running Simulator development build on 2026-08-02: Plan kept
  its label, rendered `text.page.fill` while selected, and returned to the
  unfilled `text.page` symbol after Today was selected. This verification used
  the existing installed development build and current JavaScript bundle, not a
  fresh native build.
- Implemented in source: the exercise sheet header now presents only the
  exercise name and close action. The repeated reps, RPE, and rest subtitle was
  removed. Its native SwiftUI Close action and Spotify's React Native Close
  action share the same 44-point circular glass treatment, 17-point X symbol,
  appearance handling, and accessibility semantics while remaining native to
  their respective view hosts.
- Verified in the running Simulator development build on 2026-08-02: the
  exercise sheet rendered the matched glass X without changing its title,
  artwork, logging layout, or sheet geometry. The runtime accessibility snapshot
  exposed the control as the labeled `Close exercise` button.
- Implemented in source as a FLYNT surface vocabulary decision: `sheet item
  background` means neutral cards, inputs, and highlights inside a sheet, while
  `item background` or `primary item background` means equivalent surfaces
  directly on a page. The current dark sheet item background is `#222222`.
  The stats recommendation card, Spotify selected queue item, and Spotify
  artwork placeholder use that value at full opacity. The exercise visual card
  and Load and Reps inputs use `#222222` at 90-percent opacity. Branded artwork
  gradients and semantic control states remain distinct. Today page items are
  unchanged.
- Verified in the running Simulator development build on 2026-08-02: dark
  appearance rendered the Exercise stats recommendation card and Spotify
  selected-track highlight with the `#222222` sheet item background. The
  exercise visual card and Load and Reps inputs were reverified with the
  90-percent treatment. The `#111111` primary background and `#171717` secondary
  sheet background remained unchanged.
- Implemented in source as a reversible FLYNT contrast test: the native exercise
  sheet presentation remains unchanged, with a separate 90-percent `#171717`
  layer filling the sheet behind the exercise and stats pages.
- Implemented in source: the temporary light-surface contrast treatment was
  removed. Sheet text, dividers, icons, status controls, stats content, and
  native Load and Reps rendering again use the original dark-sheet palette.
- Verified in Simulator: the exercise page retained its native sheet detent,
  rounded presentation, drag indicator, layout, and controls while the separate
  content layer filled the visible sheet behind them.
- Implemented in source on 2026-08-02: the Spotify player sheet now uses its own
  bottom-most `#171717` at 90-percent content layer, matching the existing
  exercise sheet treatment. Spotify artwork, playback controls, queue, and
  actions render above that layer. The exercise sheet treatment is unchanged.
- Implemented in source on 2026-08-02: opening the Spotify sheet now resets its
  presentation to the shared 98-percent expanded height, matching the exercise
  sheet's expanded geometry. Spotify no longer offers a shorter medium detent.
- Verified in the running Simulator development build on 2026-08-02: reopening
  Spotify rendered the single 98-percent presentation rather than its previous
  shorter position.
- Verified in the running Simulator development build on 2026-08-02: the
  Spotify player retained its native sheet detent, drag indicator, rounded
  presentation, artwork, controls, and queue while the matching layer filled
  the sheet behind all player content in dark appearance. The shared layer's
  `#171717` revision was visually reverified on the Spotify sheet. Light
  appearance and Reduce Transparency remain to be verified for the Spotify
  layer.
- Implemented and verified in the running Simulator development build on
  2026-08-02: the Spotify sheet now provides a dedicated 64-point header row
  with the white Spotify mark in a 44-point leading slot and a labeled 44-point
  glass Close control on the trailing side. The player removes its former
  redundant top padding, so the medium detent keeps the artwork, playback
  controls, and visible queue content clear of the header. The header provides
  10 points of vertical breathing room around each control and a 16-point
  horizontal inset.
  Selecting Close dismissed the sheet directly to Today. Expanded-detent
  Dynamic Type and VoiceOver order remain to be reverified.
- Implemented in source on 2026-08-02: the redundant small Spotify mark was
  removed from the bottom-right corner of the colored Now Playing card. The
  white Spotify mark in the sheet header and the explicit Open Spotify action
  remain unchanged.
- Verified in the running Simulator development build on 2026-08-02: the Now
  Playing card no longer rendered the bottom-right Spotify mark while the sheet
  header logo and Open Spotify action remained present.
- Implemented and verified in the running Simulator development build on
  2026-08-02: the Today header row now provides eight points of external
  vertical space around the unchanged 44-point ellipsis control. A held touch
  confirmed that the interactive glass expansion and lower edge remain fully
  visible instead of clipping at the list-row boundary.
- Implemented in source as a FLYNT density decision: Today exercise thumbnails
  now use that same input fill and outline treatment. Their size increases from
  72 by 54 points to 80 by 60 points, and the row minimum increases from 82 to
  88 points so the movement positions are easier to recognize without turning
  the workout list into a stack of large cards.
- Implemented in source: the thumbnail receives a 12-point leading inset inside
  the full-row pressed surface while the status circle retains its 16-point
  trailing inset. The artwork card no longer touches the pressed row edge.
- Implemented in source as a FLYNT information-hierarchy decision: Today now
  places the week selector before the selected workout's date, title, and focus.
  The redundant brand mark was removed from this operational screen, leaving a
  44-point Settings action above the selector. The week dates sit directly on
  the page canvas without a container fill, border, bevel, or shadow; only the
  selected-day pill defines the active date. Its solid selected fill remains
  unchanged, it reuses the thumbnail card's 0.5-point outline treatment, and its
  62-point highlight width is independent of seven fixed-width day columns so
  date labels do not shift between selections. Workout progress is one compact
  row with a shortened progress bar and trailing percentage; the redundant
  completed-set count was removed.
- Implemented in source: a full-width 56-point `Finish workout` action now
  follows the exercise list. It remains visible but disabled until every set is
  complete, then marks the local preview workout complete, stops the rest timer,
  closes exercise state, supplies one deliberate haptic, and changes to
  `Workout complete`.
- Implemented in source: decorative target tags were removed from the exercise
  sheet. `Exercise stats` is now a labeled 44-point navigation row beneath set
  logging instead of competing with the title or remaining below the viewport.
  The restrained divider remains between coaching and logging to preserve the
  two task groups.
- Implemented in source: set logging no longer repeats visible set numbers or
  load and rep units on every row. One aligned `LOAD (LBS)` and `REPS` header sits
  over unframed logging rows. Only the editable load and rep controls retain a
  restrained capsule surface. Load remains directly editable, while reps use
  44-point decrease and increase actions around a directly editable numeric
  value. Set order remains available in every field and action accessibility label.
  Prescribed reps are now parsed from the `reps` value instead of incorrectly
  using the leading set count.
- Implemented in source: the rest countdown now uses one shared accessory
  surface inside the exercise sheet and above the Today tab bar. Completing a
  set starts the timer without moving exercise content or presenting a second
  sheet. Closing the exercise preserves the same timer state on Today, while
  selecting the accessory closes the exercise before expanding timer controls.
- Implemented in source: completing an exercise's final set keeps the current
  exercise visible and reveals an explicit `Next exercise` action, or `Back to
  workout` when no incomplete exercise remains. The app no longer replaces the
  exercise content instantaneously.
- Implemented in source: Exercise stats now uses the exercise name as its sole
  navigation title, removes redundant eyebrow labels, condenses its training
  signal, presents recent top sets as a connected timeline, and gives the next
  workout recommendation one restrained raised surface centered within the
  sheet.
- Verified locally: all five PNG files retain alpha transparency, TypeScript and
  focused ESLint passed, and the repository copy-style check passed.
- Verified in Simulator: scheme `FLYNT` built, installed, and launched on iPhone
  17 / iOS 26.5. The latest build completed in 11.1 seconds. Dark-appearance
  review confirmed all five thumbnails, set-and-rest-only list summaries,
  removal of incomplete row fractions, the shared Today and sheet background,
  the transparent Goblet Squat sheet visual, simplified sheet header, unframed
  logging rows, correct 8-rep defaults, and sheet scrolling. Runtime
  checks changed reps from 8 to 9 with the increase action and replaced the
  editable value with 12 through the numeric keyboard. The runtime snapshot
  exposed labeled load fields, rep
  fields, decrease and increase actions, and completion actions for every set.
  The Today tab showed unfilled Plan, Progress, and Trainer symbols. Selecting
  Plan produced `text.page.fill`, selecting Progress produced `chart.bar.fill`,
  and visual review confirmed the 16-point exercise
  status inset, the raised 80-by-60-point thumbnails, and clean wrapping for the
  longest exercise name. A held row showed the 12-point thumbnail inset within
  its raised pressed surface. The ready-state preview verified the selector-first
  hierarchy without the brand mark, the unframed week-selector treatment, the
  outlined 62-point selected-day highlight with fixed day columns, the compact
  progress bar and percentage, and the full-width disabled Finish workout state
  above the tab bar.
  The 368-by-800 exercise sheet displayed the title, visual, three coaching
  steps, divider, all four Goblet Squat set rows, and Exercise stats without
  scrolling. The raised Goblet Squat artwork card was verified with the same
  fill and outline hierarchy as the Load and Reps controls. The shared timer
  accessory was verified in the exercise sheet and
  then above the Today tab bar after the sheet closed, with one continuous
  countdown and no stacked presentation.
- Evidence boundary: light appearance, Dynamic Type extremes, VoiceOver reading
  order, Switch Control, Reduce Transparency, increased contrast, smallest
  supported iPhone, physical iPhone, TestFlight, server-published exercise media,
  caching, failure, and retry states remain unverified. The explicit final-set
  transition and the cleaned Exercise stats presentation are implemented in
  source and compile, but their final runtime visual states remain unverified.

## Active blockers

- No local Xcode, Swift, Node, CocoaPods, build, install, or Simulator-launch
  blocker remains. The machine now uses Xcode 26.6, Swift 6.3.3, and the
  repository-pinned Node 24.14.0 plus pnpm 11.9.0.
- Product-level work remains before TestFlight: verify a live email OTP exchange,
  allowlist and verify `flynt://auth-callback` for retained providers, configure
  the Apple provider and app capability, verify the existing Google provider
  for the native callback, complete account-linking policy, exercise token
  refresh and account switching, verify live `/api/app-state`, complete signing
  and Apple Developer enrollment, and verify on a physical iPhone.

## Native email OTP verification | 2026-08-02

- Implemented in source: passwordless email entry now matches the configured
  Supabase email template. After requesting email authentication, FLYNT shows a
  native six-digit one-time-code field instead of instructing the athlete to
  open a magic link. The field uses the iOS one-time-code content type, numeric
  keyboard, six-digit validation, and system AutoFill semantics.
- Implemented in source: Continue verifies the code with Supabase
  `verifyOtp` using the normalized email and `email` verification type, then
  enters authoritative boot through the existing lifecycle path. Invalid or
  expired codes retain the screen with actionable recovery copy. Send a new
  code and Use another email provide explicit recovery without exposing account
  details.
- Design and platform evidence: current Apple HIG Text fields, Buttons,
  Accessibility, and Layout guidance; the FLYNT interaction baseline; current
  Supabase `signInWithOtp`, `verifyOtp`, and email-template documentation; and
  the exact Expo SDK 57 Router documentation were consulted. OTP entry is the
  appropriate FLYNT product behavior because the configured email template
  sends `{{ .Token }}` rather than `{{ .ConfirmationURL }}`.
- Verified locally on 2026-08-02: eight authentication callback, email, and OTP
  normalization fixtures passed. Whole-project TypeScript, ESLint, copy style,
  and diff hygiene passed with the known local Node 22 engine warning.
- Not yet verified: a live Priya code exchange, automatic code suggestion,
  successful authoritative account boot, light appearance, Dynamic Type,
  VoiceOver order, Switch Control, and physical-iPhone behavior.

## Native authentication client | 2026-08-01

- Implemented in source: Supabase Auth now uses a lazy SDK 57 client with PKCE,
  automatic foreground token refresh, disabled browser URL auto-detection, and
  one Keychain-backed SecureStore adapter. The Supabase session storage key is
  the same session read by authoritative boot, so access tokens are not copied
  into a second client store.
- Implemented in source: signed-out account entry supports native Sign in with
  Apple, Google through the system authentication session, and passwordless
  email OTP. Sign-in email does not create unknown accounts, account creation
  can create an account, and successful OTP verification enters authoritative
  boot directly. Provider authentication returns through
  `flynt://auth-callback`.
- Implemented in source: Apple uses Expo's system-rendered authentication
  button, a cryptographically secure nonce and state, the native identity
  token exchange, and one-time name metadata capture. Google uses Supabase
  PKCE and `ASWebAuthenticationSession` through Expo WebBrowser. Callback code
  exchange, legacy token callbacks, denial, malformed links, cancellation,
  retry, and safe user-facing errors are handled without logging credentials.
- Implemented in source: Supabase local sign-out is centralized with lifecycle
  teardown and an unconditional local Keychain clear, so an offline account is
  not trapped. Session refresh starts only while the app is active.
- Verified locally: eight deterministic authentication callback, email, and OTP
  validation tests passed. TypeScript, ESLint, copy style, and Expo Doctor 20
  of 20 passed after the SDK 57 packages and app configuration were added.
- Verified in Simulator: a regenerated iOS project installed
  `ExpoAppleAuthentication`, `ExpoCrypto`, and `ExpoWebBrowser`; scheme `FLYNT`
  built, installed, and launched on iPhone 17 / iOS 26.5. Simulator inspection
  found and corrected a callback-route cold-launch ordering defect, then the
  incremental rebuild passed in 19.4 seconds. The signed-out home and account
  entry were exercised after signing out of the ready preview. The runtime
  snapshot exposed the system Apple button, Google button, labeled email field,
  secure-link action, and Back action. With no publishable key configured, a
  valid development email produced the intended safe configuration message.
- Evidence boundary: the repository has no configured
  `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. No live email, Google, or Apple
  exchange was attempted. Apple requires the final App ID capability and
  Supabase provider audience configuration. Account reconciliation for existing
  Google, email, hidden-email Apple, and duplicate identities remains
  server-policy work before production acceptance.

## Apple HIG design authority | 2026-08-01

- Implemented in repository guidance: Apple's current Human Interface
  Guidelines now govern iOS behavior, interaction semantics, accessibility, and
  native component selection for every coding agent working in this repository.
- Implemented in repository guidance: `docs/APPLE_HIG_BASELINE.md` defines one
  efficient authority order, mandatory seven-question design pass, platform
  rules mapped to current first-party Apple pages, a source-grounded decision
  note, repeatable definition-of-done checklist, official Apple source index,
  update cadence, and an owner-approved departure record. FLYNT product policy
  is labeled separately so it cannot be misrepresented as Apple guidance.
- Implemented in repository guidance: `docs/INTERACTION_SYSTEM.md` is explicitly
  subordinate to the Apple baseline and remains the FLYNT-specific expression
  layer. The PWA remains authoritative for product content, feature coverage,
  brand direction, and established information hierarchy.
- Verified locally: documentation diff hygiene and repository copy-style checks
  passed after the authority, source map, agent rules, and checklist were added.
- Evidence boundary: this is implemented as development policy and design-review
  criteria. Existing screens have not been retroactively certified against the
  full checklist. Dynamic Type extremes, VoiceOver, Switch Control, Reduce
  Transparency, smallest-device, and physical-iPhone audits remain outstanding.

## First HIG remediation pass | 2026-08-01

- Implemented in source: the hand-built Expo Router UI tab bar was replaced by
  Expo Router 57 native tabs with four persistent top-level destinations, SF
  Symbols, native tab roles, system selection behavior, and iOS 26 tab-bar
  minimization. On iOS 26 the system owns the adaptive Liquid Glass material and
  ignores legacy background and blur appearance properties. FLYNT therefore
  uses a dark bar in dark appearance and the system light material in light
  appearance, with semantic selected and unselected colors in each mode.
- Implemented in source: native material sheets now provide an opaque Reduce
  Transparency fallback, expand to a larger detent when text scale is elevated,
  declare modal accessibility content, hide the presenting screen, and hide the
  native tab bar while presented. The shared top-right control is now one React
  Native accessibility element labeled `Open menu and settings`, with native
  Liquid Glass visual treatment and an opaque fallback.
- Implemented in source: Today takes its selected day directly from the route,
  so choosing a day in Plan cannot leave stale Friday content visible. Recovery
  days show duration instead of a false zero-percent workout. Prescribed reps
  render as entered values rather than placeholder text. Small low-contrast
  preview labels were moved to semantic theme colors or raised to at least 11
  points, and Today light surfaces now use shared semantic palette entries.
- Implemented in source: Progress history rows no longer expose chevrons or
  button behavior without a detail destination. Trainer uses a fixed composer
  above the native tab bar, a distinct input label and placeholder, and concise
  preview-only delivery copy. Passive navigation haptics were removed from the
  app shell and lifecycle escape paths. The attention lifecycle now exposes the
  existing authoritative retry action.
- Verified locally: TypeScript, ESLint, 11 authoritative boot tests, two
  lifecycle navigation tests, copy style, and Expo Doctor 20 of 20 passed with
  repository-pinned Node 24.14.0 after implementation.
- Verified in Simulator: scheme `FLYNT` built, installed, and launched on
  iPhone 17 / iOS 26.5 in 17.2 seconds. Runtime snapshots exposed Today, Plan,
  Progress, and Trainer as native `tab` elements; exposed the settings button
  with its intended label; confirmed Plan Monday rendered Monday exercises;
  and showed only the sheet Close action while Guide was presented.
- Remaining evidence boundary: the Expo UI 57 SwiftUI segmented Picker and
  Toggle bridge still exposes unlabeled duplicate control nodes in the runtime
  accessibility snapshot even though the labeled native controls are present.
  This pass does not claim that Settings is VoiceOver-complete. Largest Dynamic
  Type, Switch Control, Bold Text, Reduce Transparency in Simulator settings,
  smallest-device, TestFlight, and physical-iPhone checks remain outstanding.
- Product-data boundary: workout, progress, Trainer, profile, and preference
  content remains development preview data. This pass makes incomplete actions
  honest but does not invent server persistence, history detail, export,
  deletion, or Trainer delivery behavior.

## SwiftUI Today workout composition | 2026-08-01

- Implemented in source as a reversible experiment: Today uses one native
  SwiftUI `List` with compact, scannable exercise rows instead of expanding set
  entry inside every workout card. Each row exposes exercise name,
  prescription, completion state, and a 44-point navigation target. Its leading
  SF Symbol is an explicit development placeholder until authoritative exercise
  media is published. The real FLYNT mark and shared 44-point glass menu control
  remain in the native top bar.
- Implemented in source: selecting an exercise opens one system SwiftUI sheet
  at the large detent, with medium available as a compact execution state. The
  medium state prioritizes name, prescription, and set entry. The large state
  follows the existing Guide hierarchy directly on the sheet: FLYNT Visual,
  supporting copy, Execution, Targets, then load, rep, and completion controls.
  The visual is not enclosed in a secondary card.
- Implemented in source: Training History is a row within the exercise sheet.
  It moves to a native paged view inside that same sheet, preserving the Stats
  hierarchy, recent top sets, and next target. A 44-point top-left back chevron
  returns to execution. The superseded standalone Stats and Guide sheet was
  removed, so this flow does not stack one sheet over another.
- Reversibility boundary: local checkpoint `ad23dd0` preserves the prior Today
  accordion, separate Stats and Guide sheets, timer behavior, icon work, and
  status ledger before this experiment.
- Implemented in source: the week selector, progress display, exercise rows,
  fields, and completion actions use native semantic controls while preserving
  FLYNT colors, the existing Plan-to-Today route, and 44-point interaction
  targets.
- Implemented in source: the selected week day uses one persistent native
  surface whose offset and neighboring widths use the shared responsive motion
  token, with Reduce Motion disabling the spring. Tapped-day state remains
  local to the mounted Today screen so route mutation cannot destroy the
  animation context, while a day routed from Plan still takes precedence.
  The selected-day animation remains independent from exercise-sheet state.
- Implemented in source: completing a non-final set starts a settings-aware rest
  timer from an absolute end timestamp. Quick, Adaptive, and Full recovery
  settings use the PWA multipliers and 15-second rounding. Unchecking, skipping,
  or completing the exercise dismisses the timer, while completing the exercise
  advances to the next incomplete exercise.
- Implemented in source: the rest timer uses the same `NativeMaterialSheet`
  wrapper, drag indicator, adaptive material, dismissal behavior, and header
  pattern as the other app sheets. It provides a progress track, 15-second
  adjustments, a full-width center Skip action, and app-standard tabular system
  numerals.
- Implemented in source: timer ownership moved from Today into one app-level
  provider so countdown state survives native tab navigation. Minimizing the
  sheet preserves the timer and reveals Expo Router 57's iOS 26 native
  `NativeTabs.BottomAccessory` above the tab bar. The accessory uses a `NEXT UP`
  eyebrow above the exercise title, keeps remaining time on the trailing edge,
  omits a redundant leading timer icon, preserves normal tab interaction, and
  reopens the sheet. At zero, the accessory is removed and the provider opens
  the existing timer sheet if it was minimized. A timer sheet that is already
  open is not re-presented or otherwise changed; its established completion
  content, timing, animation, and dismissal behavior remain authoritative.
  Skip remains the explicit timer-cancellation action. A semantic translucent
  progress tint fills the native accessory and contracts with remaining time:
  strongly contrasted matte warm white over system glass in dark appearance
  and dark ink in light appearance, without replacing the system material. A
  clipped duplicate content layer gives the filled region inverse icon and text
  colors while the unfilled region retains normal theme colors, so contrast
  changes precisely as the moving progress boundary crosses each element. The
  fill, clipping mask, and native accessory share the same semantic pill radius,
  so the moving boundary retains the outer capsule curvature. The accessory and sheet
  fills use one shared UI-thread linear interpolation token between timestamp
  updates, eliminating visible one-second width steps without re-rendering the
  full workout at display refresh rate. Reduce Motion disables interpolation.
- Implemented in source: the sheet readout is a dedicated 64-point numeric
  region. Progress and the 15-second and Skip controls occupy a separate lower
  footer so timer hierarchy remains clear without crowding the sheet header.
- Implemented in source: the Today set-progress `ProgressView` now uses a native
  SwiftUI ease transition keyed to completed-set progress rather than snapping
  between values.
- Verified locally: seven authentication tests, 11 authoritative boot tests,
  two lifecycle navigation tests, TypeScript, ESLint, copy style, and Expo
  Doctor 20 of 20 passed with the repository's pinned Node 24.14.0 runtime.
- Verified in Simulator: scheme `FLYNT` built, installed, and launched on iPhone
  17 / iOS 26.5 in 15.0 seconds. Runtime inspection exposed every day and
  compact exercise row as a labeled button, every set value as a labeled native
  text field, completion controls as labeled buttons, Training History as a
  labeled action, and back and close as native actions. The sheet opened large,
  pulled down to medium, returned to large, and paged to Training History
  without presenting a second sheet. The list, Guide-style large layout, medium
  set-entry layout, and Stats-style history page passed visual review in dark
  appearance. A non-final set completion presented the shared native rest-timer sheet;
  countdown, progress, adjustment controls, expanded Skip action, swipe and close
  dismissal, and the established inverse sheet material passed visual review.
  Minimizing revealed a labeled native bottom accessory, switching from Today
  to Plan preserved the absolute countdown, and tapping the accessory reopened
  the timer sheet. The revised `NEXT UP` hierarchy, exercise title, trailing
  countdown, and removed leading timer icon passed visual review in dark
  appearance. The contracting matte progress tint and split-contrast text mask
  were visually verified in dark appearance. The superseded zero-state tab-bar
  completion treatment was removed on 2026-08-01. Automatic sheet presentation
  from a minimized zero-state is source-implemented and awaits a reproducible
  Simulator timing capture. Light appearance remains source-implemented but not yet
  visually verified in Simulator. The UI-thread interpolation and SwiftUI
  progress animation compile and launch in Simulator; frame-level motion review
  on a recorded Simulator or physical device remains outstanding.
- Evidence boundary: all workout content and set values remain development
  preview data. Authoritative workout binding, persistence, interrupted-session
  recovery, process-termination persistence, lock-screen behavior, largest
  Dynamic Type, a complete VoiceOver journey, light appearance visual review,
  physical iPhone, and TestFlight verification remain outstanding.

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
- Simulator account-entry and ready-preview rendering are verified. The
  authoritative boot boundary and failure fixtures are now recorded below.
  Live authenticated lifecycle transitions, TestFlight, and physical iPhone
  behavior remain unverified.
- Roadmap maintenance: the dashboard load error now names the actual
  `PROJECT_STATUS.md` ledger.

## Authoritative app boot boundary | 2026-08-01

- Implemented in source: production boot reads only the Keychain-backed session,
  extracts its access token without logging it, requests `/api/app-state` with a
  bearer header, validates the response with the existing Zod contract, and
  routes from the server-owned lifecycle. No athlete state renders while boot
  is loading or after a boot failure.
- Implemented in source: one guarded native boot route provides explicit loading
  and failure states. Recoverable failures provide Try again, Settings, and Sign
  out. Sign out is centralized so every lifecycle clears secure session state
  and removes in-memory app state through the same path.
- Verified locally: 11 deterministic tests passed for no session, malformed
  session, authenticated token use, slow response, 401, 403, 409, 429, 500,
  offline, and malformed server response. A rejected or malformed session is
  cleared. Other failures preserve the session for retry or explicit sign out.
- Verified locally: TypeScript, ESLint, copy style, diff hygiene, and Expo Doctor
  20 of 20 passed after implementation.
- Verified in Simulator: scheme `FLYNT` built, installed, and launched on iPhone
  17 / iOS 26.5 in 21.4 seconds. The development ready fixture still routes to
  the native app shell after the guarded boot integration.
- Not yet verified: a real Supabase session, token refresh, live production API
  response, account switching, cached-shell stale labeling, boot failure UI in
  Simulator, TestFlight, or a physical iPhone. The preview fixture remains
  development-only and does not count as authoritative server evidence.

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
  remain inline switches, short multi-option preferences use system menu
  pickers with checkmarked selection, and reminder time uses the system compact
  time picker with hour and minute wheels. Alerts are limited to blocking
  messages while final destructive confirmation uses a bottom action sheet on
  iPhone.
- Settings rebuild implemented in source: App Settings now uses Expo UI 57.0.8
  SwiftUI Form, Section, Toggle, Button, and segmented Picker controls. System,
  Light, and Dark appearance choices are inline and update shared app theme
  state immediately. Spotify position, progression style, and rest duration
  now use native menu-style Pickers, and reminder time uses the native
  time-only DatePicker. Their values use the semantic foreground tint. Settings
  switches use the unmodified native SwiftUI switch style, including the
  system-prescribed adaptive on and off colors, thumb, track, animation, state,
  and accessibility behavior. Both segmented controls use the larger native
  control size. Sign Out is separated near the bottom. Export Data and Delete Account
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
  restrained card bevel also passed Simulator visual review. On 2026-08-01 the
  persistent selected-day surface was recorded moving through intermediate
  positions from Monday to Friday. The Spotify, progression, and rest system
  menus displayed checkmarked options, and the reminder control displayed the
  native hour, minute, and AM or PM wheels. On 2026-08-02 the three enabled
  Settings toggles were verified with the native system-green on state in dark
  appearance. Workout Reminders was toggled off and back on to verify the native
  gray off state, thumb position, conditional row behavior, and restored value.
  The system-managed switch colors remain to be reverified in light appearance.
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

- Current scope: Today is the only registered widget. Its small, medium, and
  large families show the current workout state and progress, with exercise
  detail increasing by family size.
- Deferred design references: Next Set and Week may be implemented later after
  Today is accepted. They are not present in the current widget configuration,
  source modules, or snapshot publishing path.
- Widget data is a minimal, privacy-safe snapshot written to an App Group after
  authoritative app-state changes. Widgets do not receive Supabase credentials.
- Today has useful signed-out, no-plan, build, unavailable, rest, ready, active,
  complete, and stale states. Tapping deep-links to the Today destination.
- Embedded App Intent controls remain a later phase. The current widget uses one
  whole-widget link and does not mutate authoritative workout state from
  WidgetKit.

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
  Evidence: Exhaustive lifecycle-to-destination mapping, guarded routes, and shared lifecycle scaffolds were implemented on 2026-07-31. On 2026-08-01 the guarded loading and boot-failure route was added and the Keychain session plus validated `/api/app-state` result became the production navigation input. Thirteen boot and navigation tests, TypeScript, ESLint, copy style, Expo Doctor, and an iOS Simulator build passed. Live authenticated runtime transitions remain outstanding.
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

- [~] Translate the approved FLYNT color, type, spacing, radius, elevation, and material tokens into a typed native theme.
  Evidence: Initial typed light and dark color, type, spacing, and radius tokens were implemented in `src/constants/theme.ts` on 2026-07-30. On 2026-08-01 Apple's current HIG became the repository design authority through `AGENTS.md`, `docs/APPLE_HIG_BASELINE.md`, and the linked FLYNT interaction system. A completed token audit, component gallery, and device evidence remain outstanding.
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

- [~] Implement Supabase session storage with iOS Keychain or SecureStore and foreground token refresh.
  Evidence: A Keychain-backed SecureStore adapter using `WHEN_UNLOCKED_THIS_DEVICE_ONLY` was implemented on 2026-07-30. On 2026-08-01 the Supabase client was connected to that adapter with one shared storage key, persisted PKCE sessions, foreground-only automatic refresh, and local sign-out cleanup. Live refresh, revocation, reinstall, and account-switch tests remain outstanding.
  Exit check: Tokens never use plain AsyncStorage and a revoked session cannot display cached account data.
- [~] Implement passwordless email authentication and native deep-link or universal-link return handling.
  Evidence: Native email entry, separate create versus sign-in behavior, PKCE provider callback exchange, safe failure states, and seven callback and validation fixtures were implemented on 2026-08-01. On 2026-08-02 the email path was aligned with the production OTP template through a six-digit one-time-code field, Supabase `verifyOtp`, resend and email-change recovery, and an eighth validation fixture. A live OTP exchange and authoritative account boot remain unverified.
  Exit check: Links cannot establish a session for the wrong app environment.
- [~] Implement Sign in with Apple and reconcile identity linking with existing Google and email accounts.
  Evidence: The Expo SDK 57 native Apple button, secure nonce and state, Supabase identity-token exchange, one-time Apple name capture, iOS entitlement, and native module build were implemented on 2026-08-01. Apple provider configuration plus new, returning, hidden-email, revoked-credential, and account-link tests remain outstanding.
  Exit check: The primary account can be recovered without creating duplicates.
- [~] Decide whether Google remains in V1 and, if retained, implement the native Google flow.
  Evidence: The owner retained Google alongside Apple and email on 2026-08-01. The native client now starts Google through Supabase PKCE in the iOS system authentication session and returns through the shared callback. Live provider and account-link verification remain outstanding.
  Exit check: Authentication options satisfy Apple guideline 4.8.
- [~] Implement authoritative app boot from `/api/app-state` with cached shell, stale-data labeling, retry, sign out, and account isolation.
  Evidence: On 2026-08-01 the Keychain session, bearer request, Zod response validation, server lifecycle routing, loading state, retry state, Settings escape, centralized sign out, and 11 deterministic failure fixtures were implemented. The ready development fixture passed a fresh iOS Simulator build and launch. The Supabase client, PKCE account entry, foreground refresh wiring, and local sign-out were then implemented. Live authentication, refresh, account switching, cached shell, and stale labeling remain outstanding.
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
  Evidence: PWA-referenced Today and seven-day Plan preview surfaces with training and recovery states, set progress, day selection, and native tab navigation were implemented and verified in Simulator. On 2026-08-02 Plan replaced exercise-count badges with shared Today-derived completion status; a Friday set update changed Plan from 4 of 17 to 5 of 17 in the running iPhone 17 Simulator. The data is development-only and authoritative contract injection, completed-day visual verification, and the complete fixture matrix remain outstanding.
  Exit check: The program remains readable at large text sizes and on the smallest supported phone.
- [ ] Build workout execution with set completion, reps, load, RPE, pain, notes, rest, and elapsed time.
  Evidence required: Full session, partial session, edited session, and interrupted-session runs.
  Exit check: Every saved value round-trips through the existing normalized workout API.
- [ ] Implement local draft recovery without treating local state as published server truth.
  Evidence required: Force quit, low-memory termination, offline completion, and conflict tests.
  Exit check: The athlete can recover work without duplicating the server session.
- [~] Implement the rest timer with background-safe timing based on absolute timestamps.
  Evidence: Absolute-end-time countdown, foreground reconciliation, PWA duration modes, set transition rules, shared native material sheet, root timer ownership, and the iOS 26 native tab-bar accessory were implemented and verified in iPhone 17 Simulator on 2026-08-01. The countdown persisted across Today-to-Plan navigation and reopened from the accessory. Lock screen, process termination, clock change, interruption, notification, pre-iOS-26 fallback, and physical-device tests remain outstanding.
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
  Evidence: A conversation-first Trainer preview with request chips, a keyboard-aware Liquid Glass composer, Plus and Mic actions, four-line upward draft growth, local send behavior, and explicit preview labeling rendered in iPhone 17 Simulator on 2026-08-02. Empty, keyboard-open, multiline, sent, cleared, and collapsed states passed dark-appearance Simulator review. Server streaming, persistence, attachments, dictation, proposal approval, retry, duplication, accessibility, light-appearance, and active-timer coexistence evidence remain outstanding.
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
  Partial evidence: Today is the only current widget and is implemented in all
  three Home Screen families. A fresh Today-only native build and all three
  family choices passed in iPhone 17 / iOS 26.6 Simulator on 2026-08-04.
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

- [~] Keep the current App Review Guidelines and Human Interface Guidelines linked in the native repository and review them at each release milestone.
  Evidence: On 2026-08-01 the current Apple HIG was reviewed and converted into a dated repository baseline with official links, mandatory agent workflow, acceptance checklist, and departure record. App Review Guidelines review and repeated release-milestone reviews remain outstanding.
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
