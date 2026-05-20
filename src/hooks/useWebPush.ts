import { useEffect } from "react";
import { track } from "@/lib/analytics";

export function useWebPush(isLoggedIn: boolean) {
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
    if (oneSignalAppId && window.OneSignal) {
      void window.OneSignal
        .init({
          appId: oneSignalAppId,
          notifyButton: { enable: true },
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: "/push/onesignal/" },
        })
        .then(() => {
          window.OneSignal?.showSlidedownPrompt?.();
          track("push_prompt_shown", { provider: "onesignal" });
        });
    }
  }, [isLoggedIn]);
}
