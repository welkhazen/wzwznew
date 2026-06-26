# Android / Samsung Capacitor Readiness

## Status

`@capacitor/android@^8.3.1` is now declared in `package.json` alongside the existing `@capacitor/core` and `@capacitor/ios` packages. The `android/` native project does **not** exist in this repo yet — it must be generated before any Android build can be produced.

## Prerequisites

- Android Studio (latest stable) installed on the build machine
- Java 17 or newer on `PATH`
- `ANDROID_HOME` / `ANDROID_SDK_ROOT` set to the Android SDK directory

## First-time Android project generation

Run once to scaffold the native project:

```bash
npm install               # picks up the new @capacitor/android package
npm run mobile:sync:android   # runs vite build then: npx cap sync android
npx cap add android           # generates android/ directory
```

> **Note:** The `android/` directory is currently not committed. After generation, decide with the team whether to commit it or keep it in `.gitignore`. Large projects often exclude it and generate on CI; smaller teams often commit it for IDE support.

## Daily workflow

```bash
# Build web assets and sync to the Android project
npm run mobile:sync:android

# Open Android Studio to build, run, or debug
npm run mobile:open:android
```

## Available scripts (added in this PR)

| Script | What it does |
|---|---|
| `mobile:build` | `vite build` only |
| `mobile:sync` | `vite build` + `npx cap sync` (all platforms) |
| `mobile:sync:android` | `vite build` + `npx cap sync android` |
| `mobile:sync:ios` | `vite build` + `npx cap sync ios` |
| `mobile:open:android` | Opens the Android Studio project |
| `mobile:open:ios` | Opens Xcode |

## `capacitor.config.ts` notes

The config does not yet have an `android` section. The defaults (HTTPS scheme, `dist/` web dir) are correct for initial testing. Add an `android` block only when you need to override settings such as `allowMixedContent` or `webContentsDebuggingEnabled`.

## What is NOT in scope for this PR

- Committing the generated `android/` directory
- FCM / push notification setup for Android 13+
- `POST_NOTIFICATIONS` manifest permission
- CI pipeline for Android builds

See `docs/mobile-permissions-inventory.md` for the full Android notification permission plan.
