# Mobile Native QA Checklist

Use this checklist before any native iOS or Android release. Test on physical devices — simulators and emulators cannot fully validate push notifications, camera, or system permission dialogs.

---

## 1. Install and launch

- [ ] App installs from TestFlight / internal track without errors
- [ ] App launches cold (no prior session) and shows the landing screen
- [ ] App resumes correctly after being backgrounded for 10+ minutes
- [ ] App recovers from being killed by the OS and relaunched

---

## 2. Authentication

- [ ] Sign-up flow completes end-to-end on device
- [ ] Log-in with existing credentials works
- [ ] Session persists across app restarts (no unexpected sign-out)
- [ ] Sign-out clears session data

---

## 3. Push notifications (iOS)

- [ ] Permission prompt appears on first launch (alert + badge + sound)
- [ ] Declining permission does not break any other feature
- [ ] Device token is stored in Supabase `notification_consents`
- [ ] Community push notification is received on a physical iOS device
- [ ] Tapping the notification opens the app to the correct community
- [ ] Notification received while app is in foreground shows an in-app banner
- [ ] Notification received while app is in background appears in notification center
- [ ] Users who declined push do not receive notifications

### iOS — not yet enabled (track in `docs/ios-push-readiness.md`)

- [ ] APNs entitlement added in Xcode
- [ ] APNs credentials uploaded to Apple Developer portal

---

## 4. Push notifications (Android)

- [ ] `POST_NOTIFICATIONS` permission prompt appears on Android 13+
- [ ] Community push notification is received on a physical Android device
- [ ] Tapping the notification opens the app to the correct community

### Android — not yet enabled (track in `docs/android-readiness.md`)

- [ ] `android/` native project generated via `npx cap add android`
- [ ] FCM setup completed
- [ ] `POST_NOTIFICATIONS` added to `AndroidManifest.xml`

---

## 5. Core features

- [ ] Community list loads and scrolls smoothly
- [ ] Chat messages send and receive in real time
- [ ] Poll voting works and updates visually
- [ ] Avatar wheel spins and awards the correct avatar
- [ ] Profile page loads with correct avatar and rank

---

## 6. Moderation

- [ ] Blocked words are enforced on chat send (server returns 422, UI shows error)
- [ ] Links are blocked in chat text fields
- [ ] Long number sequences are blocked in chat text fields

---

## 7. Offline / network

- [ ] App shows a graceful error when offline (no crash)
- [ ] App recovers and reloads data when network returns

---

## 8. Performance

- [ ] Cold launch completes within 3 seconds on a mid-range device
- [ ] Scroll in community list is smooth (no dropped frames)
- [ ] Chat scroll with 100+ messages does not stutter

---

## 9. Safe area and layout

- [ ] Content is not obscured by the notch / Dynamic Island (iOS)
- [ ] Content is not obscured by the camera cutout (Android)
- [ ] Bottom navigation bar is not hidden behind the home gesture bar (iOS / Android)
- [ ] Keyboard push-up does not obscure input fields

---

## 10. Accessibility

- [ ] VoiceOver (iOS) / TalkBack (Android) can navigate the main screens
- [ ] Text scaling (Accessibility → Larger Text) does not break layouts
- [ ] Tap targets are at least 44×44 pt (iOS) / 48×48 dp (Android)

---

## Sign-off

| Platform | Build | Tester | Date | Pass |
|---|---|---|---|---|
| iOS | | | | ☐ |
| Android | | | | ☐ |
