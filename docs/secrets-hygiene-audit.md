# Secrets Hygiene Audit

Date: 2026-06-26

## Current State

- `.env` is not tracked.
- `.env.local` is ignored by `.gitignore`.
- `.env.example` is tracked as the safe template.
- `.gitignore` ignores `.env*` while explicitly allowing `.env.example` and `.env.*.example`.

## Checks Performed

- Checked tracked env files with `git ls-files`.
- Checked ignored local env status with `git status --ignored`.
- Checked historical env commits with `git log --all -- .env .env.local .env.production .env.development`.
- Extracted only variable names from historical `.env` files; no values were printed or copied into this document.
- Ran a tracked-file grep for high-risk secret variable names and reviewed file paths only.

## Historical Exposure

The file `.env` appears in repository history in these commits:

- `d2ecd9e`
- `048e30a`
- `5b9dd10`
- `02e8003`
- `1f22608`

The historical `.env` entries included these variable names:

- `VITE_APP_VERSION`
- `VITE_CLARITY_PROJECT_ID`
- `VITE_GA_MEASUREMENT_ID`
- `VITE_ONESIGNAL_APP_ID`
- `VITE_POSTHOG_HOST`
- `VITE_POSTHOG_KEY`
- `VITE_SENTRY_DSN`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPPORT_EMAIL`
- `VITE_SUPPORT_WHATSAPP_NUMBER`

No secret values are included here.

## Rotation Guidance

Rotate or reissue any historical values that were not intentionally public:

- PostHog project key if event ingestion should be locked to a new key.
- Sentry DSN if the old DSN should no longer accept client events.
- OneSignal app ID and related dashboard configuration if it was paired with exposed REST credentials elsewhere.
- Supabase publishable key only if project policy requires replacing public anon keys after exposure; also review RLS policies before relying on key rotation.
- Analytics IDs if the exposed IDs should not continue receiving production traffic.

The audit did not find tracked `.env`, `.env.local`, `.env.production`, or `.env.development` files in the current tree.

## Follow-Up

- Run a full history scan with Gitleaks in CI or a POSIX shell environment.
- Keep production secrets in Vercel, Supabase, and provider dashboards only.
- Never paste secret values into issues, PRs, documentation, or chat.
