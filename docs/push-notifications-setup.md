# Push Notifications Setup

The repo now has the notification consent flow, OneSignal Web Push delivery, and an Apple APNs sender scaffold. Full production delivery requires provider credentials in the deployed environment.

## Current Architecture

- The app shows an in-app consent prompt before requesting platform permission.
- Apple/iOS uses the Swift Playgrounds wrapper to request native notification permission and capture the APNs device token.
- iPhone/iPad web push uses the PWA path: iOS 16.4+ users must add the site to the Home Screen and allow notifications.
- Samsung/Android and desktop use the web/PWA path through OneSignal.
- Consent and device tokens are stored in `notification_consents`.
- OneSignal users are identified with the app user id as `external_id`, so the backend can send to the same user across desktop, Samsung, and supported iPhone PWA installs.
- Community mentions, message likes, and newly approved communities call `POST /api/notifications/community-push`, which sends a OneSignal push by external id.
- Server-side Apple delivery is scaffolded at `POST /api/notifications/send`.

## Required Environment Variables

Set these only in server/Vercel environment variables:

- `PUSH_SEND_SECRET`: bearer token required to call `POST /api/notifications/send`.
- `SUPABASE_SERVICE_ROLE_KEY`: preferred server key for reading notification device tokens.
- `APPLE_TEAM_ID`: Apple Developer team ID.
- `APPLE_KEY_ID`: APNs auth key ID.
- `APPLE_BUNDLE_ID`: app bundle ID, currently `com.raw.wzwz`.
- `APPLE_APNS_PRIVATE_KEY`: full `.p8` private key contents. Newlines may be stored as `\n`.
- `APPLE_APNS_ENV`: `sandbox` for development/TestFlight-style testing, `production` for App Store production.

Existing client-side variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_ONESIGNAL_APP_ID` for Samsung/web push path when available.

OneSignal server variables:

- `ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY`

## Apple Developer Steps Later

After buying the Apple Developer account:

1. Create or open the app identifier for `com.raw.wzwz`.
2. Enable the Push Notifications capability for that identifier.
3. Create an APNs Auth Key.
4. Copy the Team ID, Key ID, Bundle ID, and `.p8` private key into Vercel environment variables.
5. In Swift Playgrounds, enable the matching notification capability if shown in App Settings.
6. Build/run on a real iPhone or iPad and accept the in-app notification prompt.
7. Confirm a `notification_consents` row exists with `platform = 'apple-ios'`, `status = 'granted'`, and a non-empty `device_token`.

## Test Send

Call the sender route with the secret:

```sh
curl -X POST https://YOUR_DOMAIN/api/notifications/send \
  -H "Authorization: Bearer $PUSH_SEND_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","title":"raW","body":"You have a new update."}'
```

If Apple env vars are missing, the route returns `503 apple_apns_not_configured` by design.

## OneSignal Web/PWA Requirements

1. In OneSignal, configure the Web platform with the deployed site origin.
2. Set the service worker path to `/push/onesignal/`.
3. Set the worker filename to `OneSignalSDKWorker.js`.
4. Set the worker registration scope to `/push/onesignal/`.
5. Add `VITE_ONESIGNAL_APP_ID`, `ONESIGNAL_APP_ID`, and `ONESIGNAL_REST_API_KEY` to production env.
6. On iPhone/iPad, users must install the site to Home Screen before iOS web push can appear outside the browser.

## Remaining Native Samsung Work

True native Samsung push needs an Android project and FCM configuration. Until then, Samsung-compatible closed-browser notifications are handled through the browser/PWA/OneSignal path.
