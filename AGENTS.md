# FLYNT native app instructions

This repository is the native FLYNT application.

Before making changes:

1. Read `PROJECT_STATUS.md` completely.
2. Run `git status --short --branch` and preserve unrelated changes.
3. Read the exact Expo SDK 57 documentation at
   https://docs.expo.dev/versions/v57.0.0/ before using an Expo API.
4. Confirm whether the requested behavior is already implemented or verified.

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
