# Changelog

All notable production-impacting changes should be recorded here before a production deploy.

This project follows a simple release discipline:

- Keep unreleased production-impacting changes under `Unreleased`.
- Group entries by change type so release risk is easy to scan.
- Move unreleased entries into a dated version section before deploying to production.
- Keep the app version in `package.json` aligned with the release section being deployed.
- Include the production tag, commit, or deployment reference when available.
- Do not add purely internal refactors, draft-only work, or local development experiments unless they affect production behavior or release operations.

## Unreleased

### Added

- Add crash email alerting via a Vercel monitoring endpoint and Resend.
- Add screenshot-based issue reporting from the dashboard menu with an admin review queue.
- Add Apple APNs server sender scaffold and push notification setup documentation.
- Add notification consent recording and platform-specific Apple/Samsung permission prompts.
- Route logged-in token balance reads, token awards, and poll-unlock token spending through a Vercel API endpoint.
- Add `docs/SECURITY_NOTES.md` documenting the API boundary, RPC security model, rate-limit policy, and required production environment variables.
- Start changelog discipline for production releases.
- Add a Supabase-backed admin API for managing globally persistent blocked words.

### Changed

- Route poll vote submissions directly to the canonical Express API via `VITE_API_ORIGIN` when configured.
- Centralize Supabase browser/server clients and document the direct browser access boundary.
- Consolidate frontend poll access behind one typed API module and remove the old Supabase poll shims.
- Tighten browser Supabase client documentation; the canonical entry is `src/backend/supabase/client.ts` with the anon publishable key only.

### Fixed

- No unreleased bug fixes recorded yet.

### Security

- Poll voting now goes through the `submit_poll_vote` SECURITY DEFINER RPC. The voter is derived from `auth.uid()`; the frontend can no longer impersonate voters. A unique partial index on `(user_id, poll_id)` enforces one vote per user per poll at the database layer.
- Token spending now uses the atomic `spend_tokens` RPC through a single conditional `UPDATE ... WHERE token_balance >= p_amount`, closing the previous JavaScript read-modify-write race window that could double-spend under concurrency.
- Community membership and admin writes now go through SECURITY DEFINER RPCs: `joinCommunity`, `leaveCommunity`, `touchMemberActivity`, `markCommunityRead`, `setCommunityNotifications`, `updateCommunityPresentation`, and `createCommunityFromRequest`. User-scoped calls derive identity from `current_user_id()`; admin-only calls are gated on `is_admin()`.
- Rate limiting now applies to `/api/auth/signup`, `/api/auth/login`, `/api/auth/change-password`, `/api/polls/[pollId]/vote`, and `/api/users/[userId]/tokens` via Upstash sliding windows. Production fails closed when Upstash environment variables are missing.
- Blocked-word admin writes are now gated by the server session and persisted in Supabase instead of browser storage.

### Performance

- Replace the N+1 query pattern in `fetchPolls` with the `get_polls_with_vote_counts` RPC so one query returns polls, options, and vote counts.

### Removed

- Remove orphan dependencies with zero importers: `lenis`, `@hookform/resolvers`, and `@supabase/ssr`.
- Remove the empty `src/utils/supabase.ts` re-export shim.

### Deployment Notes

- Verify Vercel has all required production environment variables before deployment.
- Verify Supabase migrations for RPCs, indexes, and RLS policy changes are applied before promoting frontend changes.
- Verify monitoring and notification credentials are configured before enabling production alerting or push flows.

## Production Releases

## 0.0.0 - 2026-05-19

### Added

- Initial changelog baseline for the current app state.

### Fixed

- No bug fixes recorded for this baseline.

### Security

- No security fixes recorded for this baseline.

### Deployment Notes

- Initial baseline only; no production deployment reference recorded.
