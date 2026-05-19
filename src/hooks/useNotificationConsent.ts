import { useCallback, useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics";

type NotificationPlatform = "apple-ios" | "samsung-android" | "web";
type ConsentStatus = "granted" | "denied" | "dismissed" | "unsupported";

type NativeNotificationBridge = {
  postMessage: (message: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    OneSignal?: {
      init: (options: Record<string, unknown>) => Promise<void>;
      showSlidedownPrompt: () => void;
    };
    webkit?: {
      messageHandlers?: {
        rawNotifications?: NativeNotificationBridge;
      };
    };
  }
}

const CONSENT_STORAGE_PREFIX = "raw.notification-consent";

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

async function saveConsent(
  userId: string,
  platform: NotificationPlatform,
  status: ConsentStatus,
  provider: string,
  deviceToken?: string,
): Promise<void> {
  await fetch(`/api/users/${encodeURIComponent(userId)}/notification-consent`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ platform, status, provider, deviceToken }),
  });
}

export function useNotificationConsent(userId?: string) {
  const platform = useMemo(() => detectPlatform(), []);
  const [status, setStatus] = useState<ConsentStatus | null>(null);

  useEffect(() => {
    if (!userId) return;
    const stored = window.localStorage.getItem(storageKey(userId, platform)) as ConsentStatus | null;
    if (stored) setStatus(stored);
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
      window.webkit?.messageHandlers?.rawNotifications?.postMessage({ userId });
      track("push_prompt_shown", { provider: "apple-native" });
      return;
    }

    const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
    if (oneSignalAppId && window.OneSignal) {
      await window.OneSignal.init({
        appId: oneSignalAppId,
        notifyButton: { enable: true },
        allowLocalhostAsSecureOrigin: true,
      });
      window.OneSignal.showSlidedownPrompt();
      track("push_prompt_shown", { provider: "onesignal" });
      await persist("granted", "onesignal");
      return;
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
    shouldPrompt: Boolean(userId && !status),
    status,
  };
}
