# raW — Swift Playgrounds App Project

Native iOS shell for raW, structured as a **Swift Playgrounds App Project** (`.swiftpm`). Open it on iPad in **Swift Playgrounds 4.5+** or on macOS in **Xcode 15+** — both produce the same signed binary for the App Store.

Shares the same Supabase project and OneSignal App ID as the web (`../`) and React Native (`../mobile`) clients.

## Identity

| Field | Value |
| --- | --- |
| Display name | `raW` |
| Bundle identifier | `app.raw.mobile` (matches Android package) |
| Min iOS | 17.0 |
| Push provider | OneSignal native (App ID `debf83a7-…322f`) |
| Backend | Supabase Swift client (`supabase-community/supabase-swift`) |

## Files

```
raW.swiftpm/
├── Package.swift           # iOSApplication manifest + SPM deps
├── RawApp.swift            # @main + scene
├── ContentView.swift       # Home screen
├── Config.swift            # OneSignal id + Supabase placeholders
├── OneSignalManager.swift  # init / requestPermission / identify
└── SupabaseClient.swift    # shared client
```

## How to open

### On iPad (recommended for fast iteration)

1. Copy the `raW.swiftpm` folder to iCloud Drive (or Files → On My iPad).
2. Open **Swift Playgrounds** → "See All My Playgrounds" → tap the folder.
3. The first launch resolves SPM dependencies (OneSignal + Supabase). Needs Wi-Fi.

### On macOS

1. `open raW.swiftpm` (Xcode 15+ opens it as a regular project).
2. Xcode resolves SPM deps automatically.
3. Run on Simulator or a real device.

## Fill in real secrets before running

Open [`Config.swift`](raW.swiftpm/Config.swift) and replace the placeholders:

```swift
static let supabaseUrl = URL(string: "https://YOUR-PROJECT.supabase.co")!
static let supabasePublishableKey = "eyJhbGciOi..."
```

For App Store builds, prefer reading from `Info.plist` injected via the Distribute flow.

## Ship to App Store

Apple supports App Store distribution **directly from Swift Playgrounds**:

1. On iPad, open the project → tap `…` → **App Store Connect** → **Distribute**.
2. Sign in with your Apple Developer account ($99/year).
3. Swift Playgrounds builds, signs, and uploads the IPA to App Store Connect.
4. Submit for review from App Store Connect on the web.

Or from Xcode: **Product → Archive → Distribute App → App Store Connect**.

## Why three clients (web / RN / Swift Playgrounds)?

- **Web** — fastest to ship features; PWA install on Android works fine.
- **React Native (`../mobile`)** — single codebase for Play Store and (optionally) App Store. Best for shared business logic.
- **Swift Playgrounds (this folder)** — native SwiftUI feel, smaller binary, access to the very latest iOS APIs (Live Activities, App Intents, widgets) without waiting for RN bridges. Use if you want a *premium* iOS experience that the RN build can't match.

If you only ship one mobile target long-term, pick **RN** (covers Android too). The Playgrounds project is here so you can prototype the iOS-native version on iPad without needing a Mac.
