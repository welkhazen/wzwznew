# Changelog

All production-impacting changes should be recorded here before a Vercel production deploy.

This project uses a simple release discipline:
- Keep the app version in `package.json`.
- Add entries under `Unreleased` while work is in progress.
- Move entries into a dated version section before deploying to production.
- Include the production tag or commit in the release notes when available.

## Unreleased

### Security
- Poll voting now goes through `submit_poll_vote` SECURITY DEFINER RPC. The
  voter is derived from `auth.uid()`; the frontend can no longer impersonate.
  Added a unique partial index `(user_id, poll_id)` to enforce one vote per
  user per poll at the DB layer.
- Token spending now uses the atomic `spend_tokens` RPC (single conditional
  `UPDATE … WHERE token_balance >= p_amount`). Closes the previous JS
  read-modify-write race window that could double-spend under concurrency.
- Community membership and admin writes (`joinCommunity`, `leaveCommunity`,
  `touchMemberActivity`, `markCommunityRead`, `setCommunityNotifications`,
  `updateCommunityPresentation`, `createCommunityFromRequest`) all go through
  SECURITY DEFINER RPCs. User-scoped ones derive identity from
  `current_user_id()`; admin-only ones are gated on `is_admin()`.
- Rate limiting on `/api/auth/signup`, `/api/auth/login`,
  `/api/auth/change-password`, `/api/polls/[pollId]/vote`, and
  `/api/users/[userId]/tokens` via Upstash sliding window. Fails closed in
  production when Upstash env vars are missing.

### Performance
- Replaced N+1 in `fetchPolls` with `get_polls_with_vote_counts` RPC: one
  query returns polls + options + counts (was 1 + 1 + N).

### Changed
- Route poll vote submissions directly to the canonical Express API via `VITE_API_ORIGIN` when configured.
- Centralize Supabase browser/server clients and document the direct browser access boundary.
- Consolidate frontend poll access behind one typed API module and remove the old Supabase poll shims.
- Tighten browser Supabase client documentation; the canonical entry is
  `src/backend/supabase/client.ts` (anon publishable key only).

### Removed
- Dropped three orphan dependencies with zero importers: `lenis`,
  `@hookform/resolvers`, `@supabase/ssr`.
- Removed the empty `src/utils/supabase.ts` re-export shim (no callers).

### Added
- Add crash email alerting via a Vercel monitoring endpoint and Resend.
- Add screenshot-based issue reporting from the dashboard menu with an admin review queue.
- Add Apple APNs server sender scaffold and push notification setup documentation.
- Add notification consent recording and platform-specific Apple/Samsung permission prompts.
- Route logged-in token balance reads, token awards, and poll-unlock token spending through a Vercel API endpoint.
- `docs/SECURITY_NOTES.md` documenting the API boundary, RPC security model,
  rate-limit policy, and required production env vars.
- Started changelog discipline for production releases.

## 0.0.0 - 2026-05-19

### Notes
- Initial changelog baseline for the current app state.
