# raW Mobile

React Native (Expo) app for raW — Android (Play Store) + iOS.

Lives alongside the web app in this monorepo — `../` is the Vite + React web client; this folder is the mobile shell that ships to the Play Store. Both share the same Supabase project and the same OneSignal App ID.

## Stack

- Expo SDK 51 + expo-router
- React Native 0.74
- TypeScript (strict)
- Supabase JS (via AsyncStorage)
- OneSignal native push (App ID baked in)
- EAS Build for signed Android `.aab` / iOS builds

## App identity

- Display name: **raW**
- Android package: `app.raw.mobile`
- iOS bundle id: `app.raw.mobile`

These are immutable on the stores — do not change after first publish.

## Local dev (first time)

```bash
cd C:\Users\user\OneDrive\Desktop\wzwz-mobile
npm install
```

You'll need:
- Node 18+
- The **Expo Go** app on your phone (App Store / Play Store), OR
- Android Studio with an emulator

Then:

```bash
npm run start          # QR code → scan in Expo Go
npm run android        # emulator / connected device
```

## Fill in real secrets before running

Open `app.json` and replace the placeholders:

```jsonc
"extra": {
  "supabaseUrl": "REPLACE_WITH_VITE_SUPABASE_URL",
  "supabasePublishableKey": "REPLACE_WITH_VITE_SUPABASE_PUBLISHABLE_KEY",
  "oneSignalAppId": "debf83a7-182a-4f37-8bd1-614de363322f"
}
```

For production builds, use EAS secrets instead of committing real keys:

```bash
eas secret:create --scope project --name SUPABASE_URL --value "..."
eas secret:create --scope project --name SUPABASE_PUBLISHABLE_KEY --value "..."
```

## Assets (still TODO)

You need to drop these into `assets/`:

- `icon.png` — 1024×1024
- `adaptive-icon.png` — 1024×1024 (Android adaptive foreground)
- `splash.png` — 1242×2436
- `favicon.png` — 48×48 (web preview only)

Easiest path: take the existing `../wzwz/public/raw-logo-512.png` and resize.

## Ship to Play Store

```bash
# One-time
npm install -g eas-cli
eas login
eas init                       # writes a real projectId into app.json -> extra.eas
eas credentials                # generate or upload Android keystore

# Build & submit
npm run build:android:production
npm run submit:android         # uploads the .aab to the internal track
```

Then promote internal → closed → production from the Google Play Console UI.

## Notes

- Notification badge color is set to `#F1C42D` (raw-gold) in `app.json`.
- Push permission is requested from `app/index.tsx` via the "Enable notifications" button.
- The OneSignal app ID is the same one wired into the web app — devices share the same OneSignal project, so a single broadcast hits both web and mobile.
- Do NOT commit your keystore or `google-play-service-account.json`. The `.gitignore` already excludes them.
