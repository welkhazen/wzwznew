import { useCallback, useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";

type NotificationPlatform = "apple-ios" | "samsung-android" | "web";
type ConsentStatus = "granted" | "denied" | "dismissed" | "unsupported";

type NativeNotificationBridge = {
  postMessage: (message: Record<string, unknown>) => void;
};

type OneSignalSdk = {
  init: (options: Record<string, unknown>) => Promise<void>;
  login?: (externalId: string) => Promise<void>;
  showSlidedownPrompt?: () => void;
  Notifications?: {
    requestPermission?: () => Promise<boolean>;
  };
  User?: {
    addTags?: (tags: Record<string, string>) => Promise<void>;
  };
};

declare global {
  interface Window {
    OneSignal?: OneSignalSdk;
    OneSignalDeferred?: Array<(OneSignal: OneSignalSdk) => void | Promise<void>>;
    webkit?: {
      messageHandlers?: {
        rawNotifications?: NativeNotificationBridge;
      };
    };
  }
}

const CONSENT_STORAGE_PREFIX = "raw.notification-consent";
let oneSignalInitPromise: Promise<void> | null = null;

function detectPlatform(): NotificationPlatform {
  const ua = navigator.userAgent;
  const isAppleTouch = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isAppleTouch) return "apple-ios";
  if (/Android/i.test(ua)) return "samsung-android";
  return "web";
}

function hasAppleBridge(): boolean {
  return Boolean(window.webkit?.messageHandlers?.rawNotifications?.postMessage);
}

function storageKey(userId: string, platform: NotificationPlatform): string {
  return `${CONSENT_STORAGE_PREFIX}.${userId}.${platform}`;
}

async function withOneSignal(callback: (OneSignal: OneSignalSdk) => void | Promise<void>): Promise<void> {
  if (window.OneSignal) {
    await callback(window.OneSignal);
    return;
  }

  window.OneSignalDeferred = window.OneSignalDeferred ?? [];
  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("OneSignal SDK did not load.")), 8000);
    window.OneSignalDeferred?.push(async (OneSignal) => {
      window.clearTimeout(timeout);
      try {
        await callback(OneSignal);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

function initOneSignal(appId: string): Promise<void> {
  if (!oneSignalInitPromise) {
    oneSignalInitPromise = withOneSignal((OneSignal) =>
      OneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
        serviceWorkerParam: { scope: "/push/onesignal/" },
      })
    );
  }

  return oneSignalInitPromise;
}

async function identifyOneSignalUser(userId: string, platform: NotificationPlatform): Promise<void> {
  const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
  if (!oneSignalAppId) return;

  await initOneSignal(oneSignalAppId);
  await withOneSignal(async (OneSignal) => {
    await OneSignal.login?.(userId);
    await OneSignal.User?.addTags?.({
      raw_user_id: userId,
      platform,
    });
  });
}

async function saveConsent(
  userId: string,
  platform: NotificationPlatform,
  status: ConsentStatus,
  provider: string,
  deviceToken?: string,
): Promise<void> {
  await supabase.from("notification_consents").upsert({
    user_id: userId,
    platform,
    status,
    provider,
    device_token: deviceToken,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: "user_id,platform",
  });
}

export function useNotificationConsent(userId?: string) {
  const platform = useMemo(() => detectPlatform(), []);
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [hasLoadedStoredConsent, setHasLoadedStoredConsent] = useState(false);

  useEffect(() => {
    setHasLoadedStoredConsent(false);
    if (!userId) {
      setStatus(null);
      return;
    }
    const stored = window.localStorage.getItem(storageKey(userId, platform)) as ConsentStatus | null;
    setStatus(stored);
    setHasLoadedStoredConsent(true);
  }, [platform, userId]);

  const persist = useCallback(
    async (nextStatus: ConsentStatus, provider: string, deviceToken?: string) => {
      if (!userId) return;
      setStatus(nextStatus);
      window.localStorage.setItem(storageKey(userId, platform), nextStatus);
      await saveConsent(userId, platform, nextStatus, provider, deviceToken).catch(() => undefined);
    },
    [platform, userId],
  );

  useEffect(() => {
    if (!userId || platform !== "apple-ios") return;

    const handleApplePermission = (event: Event) => {
      const detail = (event as CustomEvent<{ status?: unknown }>).detail;
      const nextStatus = detail?.status === "granted" ? "granted" : "denied";
      void persist(nextStatus, "apple-native");
    };

    window.addEventListener("raw:apple-notification-permission", handleApplePermission);
    return () => window.removeEventListener("raw:apple-notification-permission", handleApplePermission);
  }, [persist, platform, userId]);

  useEffect(() => {
    if (!userId) return;
    void identifyOneSignalUser(userId, platform).catch(() => undefined);
  }, [platform, userId]);

  useEffect(() => {
    if (!userId || platform !== "apple-ios") return;

    const handleAppleDeviceToken = (event: Event) => {
      const detail = (event as CustomEvent<{ token?: unknown }>).detail;
      if (typeof detail?.token !== "string" || !detail.token.trim()) return;
      void persist("granted", "apple-native", detail.token.trim());
    };

    window.addEventListener("raw:apple-notification-device-token", handleAppleDeviceToken);
    return () => window.removeEventListener("raw:apple-notification-device-token", handleAppleDeviceToken);
  }, [persist, platform, userId]);

  const requestPermission = useCallback(async () => {
    if (!userId) return;

    if (platform === "apple-ios" && hasAppleBridge()) {
      await persist("dismissed", "apple-native");
      window.webkit?.messageHandlers?.rawNotifications?.postMessage({ userId });
      track("push_prompt_shown", { provider: "apple-native" });
      return;
    }

    const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
    if (oneSignalAppId) {
      try {
        await identifyOneSignalUser(userId, platform);
        await withOneSignal(async (OneSignal) => {
          if (OneSignal.Notifications?.requestPermission) {
            await OneSignal.Notifications.requestPermission();
            return;
          }

          OneSignal.showSlidedownPrompt?.();
        });
        track("push_prompt_shown", { provider: "onesignal" });
        await persist("granted", "onesignal");
        return;
      } catch {
        // Fall back to the browser permission API if OneSignal is blocked or unavailable.
      }
    }

    if (!("Notification" in window)) {
      await persist("unsupported", "browser");
      return;
    }

    const permission = await Notification.requestPermission();
    await persist(permission === "granted" ? "granted" : "denied", "browser");
  }, [persist, platform, userId]);

  const dismiss = useCallback(async () => {
    await persist("dismissed", "none");
  }, [persist]);

  return {
    dismiss,
    platform,
    requestPermission,
    shouldPrompt: Boolean(userId && hasLoadedStoredConsent && !status),
    status,
  };
}
