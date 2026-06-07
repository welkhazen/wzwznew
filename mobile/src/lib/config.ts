import Constants from "expo-constants";

type Extra = {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  oneSignalAppId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

function required(name: string, value: string | undefined): string {
  if (!value || value.startsWith("REPLACE_")) {
    throw new Error(
      `Missing config: ${name}. Set it in app.json under expo.extra (or via EAS env vars).`,
    );
  }
  return value;
}

export const ONESIGNAL_APP_ID =
  extra.oneSignalAppId ?? "debf83a7-182a-4f37-8bd1-614de363322f";

export const SUPABASE_URL = required("supabaseUrl", extra.supabaseUrl);
export const SUPABASE_PUBLISHABLE_KEY = required(
  "supabasePublishableKey",
  extra.supabasePublishableKey,
);
