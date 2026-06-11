/// <reference types="vite/client" />

declare module '*.MP4' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
	readonly VITE_APP_VERSION?: string;
	readonly VITE_SENTRY_DSN?: string;
	readonly VITE_GA_MEASUREMENT_ID?: string;
	readonly VITE_CLARITY_PROJECT_ID?: string;
	readonly VITE_SUPPORT_WHATSAPP_NUMBER?: string;
	readonly VITE_SUPPORT_EMAIL?: string;
	readonly VITE_ENABLE_DIAGNOSTICS?: string;
	readonly VITE_RAW_TEXT_DENYLIST?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
