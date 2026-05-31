# Supabase Access Boundary

Supabase access is intentionally hybrid:

- Browser code may use the publishable key only through the canonical browser client in
  `src/backend/supabase/client.ts`, re-exported by `src/lib/supabase.ts` and
  `src/utils/supabase.ts`.
- Express server code must use `server/lib/supabaseClient.ts`.
- Vercel API/edge handlers must use `api/_lib/supabaseServerClient.ts`.
- New one-off `createClient()` calls are not allowed without updating this document.

## Security Rule

Direct browser access is acceptable only when Row Level Security is the deliberate
security boundary for that table. Sensitive writes should go through an API route that
can validate input, check auth/session state, rate limit, and audit.

RLS should stay enabled even for tables currently written through API routes. That is
defense in depth, not the primary authorization layer for those routes.

## Current Browser Write Surfaces

These paths still write from browser code and require matching RLS policies:

- `src/lib/api/polls.ts`: poll reads, poll comments, and admin poll maintenance.
- `src/lib/api/tokens.ts`: token-balance fallback paths.
- `src/hooks/useNotificationConsent.ts`: notification consent fallback path.
- `src/lib/avatarCatalog.ts`: avatar catalog, user avatar inventory, user avatar selection, user avatar level.
- `src/lib/dailySpinAvatarPool.ts`: daily spin avatar pool maintenance.
- `src/lib/landingNewAvatars.ts`: landing avatar maintenance.
- `src/lib/api/client.ts`: development/mock poll comments fallback.
- `src/backend/supabase/controllers/*`: community, community poll, chat, user, user alias, waitlist controllers when imported by browser code.

Before adding a new browser write, document:

1. The table and operation.
2. The expected actor.
3. The RLS policy that permits exactly that actor.
4. Why an API route is not a better boundary.

## Move Behind API First

Use API routes by default for:

- admin and moderation writes,
- token or balance changes,
- user profile/security changes,
- poll voting,
- notification sending,
- any write needing rate limiting, audit logs, or cross-row business rules.
