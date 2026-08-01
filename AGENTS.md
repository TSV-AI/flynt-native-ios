# FLYNT native app instructions

This repository is the native FLYNT application.

Before making changes:

1. Read `PROJECT_STATUS.md` completely.
2. Run `git status --short --branch` and preserve unrelated changes.
3. For any visual, interaction, navigation, motion, haptic, accessibility, or
   component work, read `docs/APPLE_HIG_BASELINE.md` and
   `docs/INTERACTION_SYSTEM.md` completely.
4. Read the exact Expo SDK 57 documentation at
   https://docs.expo.dev/versions/v57.0.0/ before using an Expo API.
5. Confirm whether the requested behavior is already implemented or verified.

## Design authority

Apple's current Human Interface Guidelines are the source of truth for iOS
platform behavior, interaction semantics, accessibility, and native component
selection. `docs/APPLE_HIG_BASELINE.md` is the repository's operational Apple
baseline. `docs/INTERACTION_SYSTEM.md` specializes that baseline for FLYNT.

Use this order for every design decision:

1. Current Apple Human Interface Guidelines and Apple platform documentation.
2. `docs/APPLE_HIG_BASELINE.md` for the repeatable decision and review process.
3. `docs/INTERACTION_SYSTEM.md` and shared theme, component, motion, and haptic
   tokens for FLYNT-specific expression.
4. The FLYNT PWA for product content, feature coverage, brand direction, and
   established information hierarchy.
5. Existing native implementation only when it agrees with the sources above.

Before implementing a screen or material interaction change, identify the
person's primary task, choose the native presentation and control primitives,
define loading, empty, error, disabled, success, and interruption states, and
check accessibility and feedback behavior. Use shared tokens and components.
Do not invent local dimensions, gestures, materials, motion, or haptics.

When current Apple guidance changes or a task introduces a new interaction
pattern, check the relevant official Apple pages and update the dated baseline
before implementation. If a product need requires a departure from Apple
guidance, record the affected guidance, reason, accessibility impact,
alternative considered, and owner approval in the baseline. Never silently
depart from the baseline.

Ground design claims in current first-party Apple sources, not memory, blogs,
generic iOS conventions, or model preference. For every material UI pattern or
screen decision, name the official Apple HIG pages consulted and the applicable
FLYNT specialization in the task evidence. If Apple does not prescribe the
choice, label it as a FLYNT product decision. Do not present it as an Apple
requirement. If the current official source cannot be checked, pause that design
decision instead of guessing.

A visual or interaction task is not complete until the applicable checklist in
`docs/APPLE_HIG_BASELINE.md` has reproducible evidence. At minimum, verify the
implemented states in Simulator, light and dark appearance, safe areas, 44 by
44 point targets, Dynamic Type layout, VoiceOver names and order, Reduce Motion,
and Reduce Transparency where materials are used. Do not claim unrun checks.

Project rules:

- The current FLYNT server and Supabase project remain authoritative.
- Do not duplicate prescription, lifecycle, program-build, weekly revision, or
  account-isolation logic in the client.
- Never include a Supabase service-role key, signing key, private key, password,
  or test-account credential in source, documentation, logs, or task messages.
- Persist session secrets only through Keychain-backed secure storage.
- Every lifecycle must have a useful screen, retry path, Settings path, and
  sign-out path where an authenticated account could otherwise be trapped.
- The app must remain useful when Spotify is unavailable or permissions are
  declined.
- Use native controls and behavior first. Respect Dynamic Type, VoiceOver,
  Reduce Motion, safe areas, and a minimum 44 by 44 point touch target.
- Use semantic design and haptic tokens. Feature code must not invent local
  feedback rules.
- Do not use em dashes in product copy, documentation, or comments.
- Clean as you go. When code is replaced, remove superseded files, exports,
  assets, tests, and dependencies in the same change.

Evidence rules:

- Distinguish implemented in source, verified locally, verified in Simulator,
  verified in TestFlight, verified on a physical iPhone, and verified in
  production.
- Update `PROJECT_STATUS.md` after material implementation, verification,
  architecture changes, or release work.
- Never mark an acceptance gate complete without a reproducible check.
