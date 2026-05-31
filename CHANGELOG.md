# Changelog

All production-impacting changes should be recorded here before a Vercel production deploy.

This project uses a simple release discipline:
- Keep the app version in `package.json`.
- Add entries under `Unreleased` while work is in progress.
- Move entries into a dated version section before deploying to production.
- Include the production tag or commit in the release notes when available.

## Unreleased

### Added
- Add crash email alerting via a Vercel monitoring endpoint and Resend.
- Add screenshot-based issue reporting from the dashboard menu with an admin review queue.
- Add Apple APNs server sender scaffold and push notification setup documentation.
- Add notification consent recording and platform-specific Apple/Samsung permission prompts.
- Route logged-in token balance reads, token awards, and poll-unlock token spending through a Vercel API endpoint.
- Started changelog discipline for production releases.

### Changed
- Route poll vote submissions directly to the canonical Express API via `VITE_API_ORIGIN` when configured.

## 0.0.0 - 2026-05-19

### Notes
- Initial changelog baseline for the current app state.
