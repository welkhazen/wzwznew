# iOS Push Notification Readiness

## Current state

The iOS native wrapper (`ios/RAW.swiftpm/`) already handles the notification permission flow end-to-end:

- `App.swift` requests alert, badge, and sound permission on first launch
- After approval, it registers for remote notifications and forwards the APNs device token to the web layer
- `WebView.swift` bridges the web app's consent dialog to the native Swift layer
- OneSignal identifies users by `appUserId` for community push delivery
- Notification consent is recorded in Supabase `notification_consents`

**Missing before native iOS push can ship:**

1. Apple Push Notification Service (APNs) entitlement added to the Xcode project
2. APNs credentials (Auth Key `.p8` or certificate) uploaded to Apple Developer portal
3. Server-side APNs delivery job (the current path uses OneSignal; a direct APNs path is optional)
4. `capacitor.config.ts` — no changes required; iOS section is already configured

## Workflow

```bash
# Sync web assets to the iOS project
npm run mobile:sync:ios

# Open Xcode to build, run, or configure capabilities
npm run mobile:open:ios
```

These scripts were added in the companion PR `mobile/android-capacitor-readiness`.

## Steps to enable APNs

1. In Xcode: select the `RAW` target → Signing & Capabilities → add **Push Notifications**
2. In Apple Developer portal: generate an APNs Auth Key (`.p8`) for the App ID `com.raw.app`
3. Upload the key to OneSignal (Settings → Apple iOS → p8 Key) — or store it as a server secret and send via APNs HTTP/2 API directly
4. Test on a physical device (simulators do not receive push notifications)

## QA checklist

- [ ] Permission prompt appears on first launch (alert + badge + sound)
- [ ] Token is forwarded to the web layer (`window.webkit.messageHandlers`)
- [ ] Token is stored in Supabase `notification_consents`
- [ ] Community push delivered via OneSignal reaches a physical iOS device
- [ ] Notification opens the app to the correct community when tapped
- [ ] Notification consent is respected — users who declined do not receive pushes
- [ ] Push works in foreground (in-app banner) and background

## What is NOT in scope for this PR

- Adding the APNs entitlement to Xcode (requires local Xcode access)
- Uploading APNs credentials to Apple Developer portal
- Direct APNs server-side delivery (OneSignal covers this path)
- Android push (tracked separately in `docs/android-readiness.md`)
