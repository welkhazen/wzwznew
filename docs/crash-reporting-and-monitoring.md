# Crash Reporting and Monitoring

The app uses Sentry for structured crash reporting and a lightweight Vercel email alert route for owner notification.

## Flow

1. React render crashes are caught by `ErrorBoundary`.
2. Browser-level `error` and `unhandledrejection` events are captured at startup.
3. Crashes are sent to Sentry when `VITE_SENTRY_DSN` is configured.
4. The app also posts compact crash details to `/api/monitoring/crash-alert`.
5. The Vercel API route sends an email through Resend.

## Vercel Environment Variables

Set these in Vercel before expecting email delivery:

- `RESEND_API_KEY`
- `CRASH_ALERT_TO` - the owner email address that should receive crash alerts. Testing value: `mohammadz20012001@gmail.com`.
- `CRASH_ALERT_FROM` - a verified Resend sender, for example `RAW Alerts <alerts@yourdomain.com>`.
- `CRASH_ALERT_APP_NAME` - optional email subject prefix. Defaults to `raW`.

Sentry remains configured separately with:

- `VITE_SENTRY_DSN`
- `VITE_APP_VERSION`

## Notes

- Email alerts are best for urgent owner notification. Sentry should remain the source of truth for grouping, stack traces, release tracking, and history.
- The client deduplicates identical crash messages per page session to reduce repeated emails from the same failure loop.
