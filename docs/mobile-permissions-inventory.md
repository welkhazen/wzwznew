# Mobile Permissions Inventory

Scope: notification permission only.

## Apple / iOS

- Permission: Notifications.
- Current Swift package behavior: the web app shows an in-app consent dialog, then `ios/RAW.swiftpm/WebView.swift` forwards the approved request to native Swift. `ios/RAW.swiftpm/App.swift` requests alert, badge, and sound permission, registers for remote notifications when permission is granted, and forwards the APNs device token back to the web app for backend storage.
- Current native config: no Apple Push Notification entitlement is present in the repo.
- Current app behavior: notification consent is recorded through `/api/users/[userId]/notification-consent`.
- Needed before native iOS push release: add Apple Push Notification capability, APNs credentials, and the server-side APNs send job.

## Samsung / Android

- Permission: Notifications.
- Current native config: no Android project or `POST_NOTIFICATIONS` permission is present in this repo.
- Current app behavior: the web app shows an in-app consent dialog, then requests Samsung/Android notifications through OneSignal or browser notification permission. Notification consent is recorded through `/api/users/[userId]/notification-consent`.
- Needed before native Android/Samsung release: add Android project, notification permission for Android 13+, FCM setup, and the Capacitor/native notification integration.

## Not In Scope For Now

- Camera.
- Microphone.
- Location.
- Contacts.
- Photos/media library.
- Bluetooth.
- Health data.
