// OneSignal Web SDK helpers.
// Docs: https://documentation.onesignal.com/docs/en/web-sdk-setup
// The page SDK (<script src=".../OneSignalSDK.page.js">) is loaded in index.html.

const FALLBACK_APP_ID = "debf83a7-182a-4f37-8bd1-614de363322f";

type OneSignalSdk = {
  init: (options: Record<string, unknown>) => Promise<void>;
  login?: (externalId: string) => Promise<void>;
  logout?: () => Promise<void>;
  showSlidedownPrompt?: () => void;
  Notifications?: {
    requestPermission?: () => Promise<boolean>;
    permission?: boolean;
  };
  Slidedown?: {
    promptPush?: (options?: { force?: boolean }) => Promise<void>;
  };
  User?: {
    addTags?: (tags: Record<string, string>) => Promise<void>;
    PushSubscription?: { optIn?: () => Promise<void>; optedIn?: boolean };
  };
};

declare global {
  interface Window {
    OneSignal?: OneSignalSdk;
    OneSignalDeferred?: Array<(OneSignal: OneSignalSdk) => void | Promise<void>>;
  }
}

export function getOneSignalAppId(): string {
  const fromEnv = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
  return fromEnv && fromEnv.trim() ? fromEnv.trim() : FALLBACK_APP_ID;
}

/** Path of the OneSignal service worker file under /public. */
export const ONESIGNAL_SW_SCOPE = "/push/onesignal/";

export function isOneSignalServiceWorker(
  registration: ServiceWorkerRegistration,
): boolean {
  try {
    const scope = new URL(registration.scope).pathname;
    return scope.startsWith(ONESIGNAL_SW_SCOPE);
  } catch {
    return false;
  }
}

let initPromise: Promise<void> | null = null;

export function ensureOneSignalInit(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (initPromise) return initPromise;

  const appId = getOneSignalAppId();

  initPromise = new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error("OneSignal SDK did not load within 10s")),
      10_000,
    );

    window.OneSignalDeferred = window.OneSignalDeferred ?? [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      window.clearTimeout(timeout);
      try {
        await OneSignal.init({
          appId,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: ONESIGNAL_SW_SCOPE },
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });

  return initPromise;
}

export async function withOneSignal(
  callback: (OneSignal: OneSignalSdk) => void | Promise<void>,
): Promise<void> {
  await ensureOneSignalInit();
  if (window.OneSignal) {
    await callback(window.OneSignal);
  }
}
