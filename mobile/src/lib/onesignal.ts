import { OneSignal, LogLevel } from "react-native-onesignal";
import { ONESIGNAL_APP_ID } from "./config";

let initialized = false;

/** Call once on app boot (e.g. from the root layout). */
export function initOneSignal(): void {
  if (initialized) return;
  initialized = true;

  if (__DEV__) {
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
  }

  OneSignal.initialize(ONESIGNAL_APP_ID);
}

/** Show the OS notification permission prompt. Resolves to true if granted. */
export async function requestPushPermission(): Promise<boolean> {
  return await OneSignal.Notifications.requestPermission(true);
}

/** Tie the device subscription to your Supabase user id. */
export function identifyUser(userId: string): void {
  OneSignal.login(userId);
}

/** Clear identity (e.g. on logout). */
export function clearUser(): void {
  OneSignal.logout();
}
