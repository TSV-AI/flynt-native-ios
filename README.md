# FLYNT Native

The premium native iPhone client for FLYNT. The app uses Expo React Native for
the main product and focused Swift modules for Apple platform capabilities such
as widgets, App Intents, Spotify App Remote, and advanced haptics.

The existing FLYNT Vercel API and Supabase project remain the system of record.
This client renders authoritative lifecycle and training state. It does not
reimplement program logic.

## Local requirements

- Node 24.14.0
- pnpm 11.9.0
- Xcode 26.4 or newer for Expo SDK 57 iOS builds
- iOS 16.4 or newer

## Commands

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm copy:check
pnpm doctor
pnpm start
```

Use a development build for native work. Expo Go is not a product target.

## Configuration

`EXPO_PUBLIC_API_BASE_URL` may point the client to another non-secret API
environment. It defaults to `https://flynt.training`.

Never place Supabase service-role values or other server secrets in this app.
Public client configuration and bearer sessions are the only supported client
credentials.

Read `PROJECT_STATUS.md` before starting work. It is the living plan, release
checklist, blocker register, and evidence ledger.

Copyright 2026 Three Sixty Vue LLC. All rights reserved.
