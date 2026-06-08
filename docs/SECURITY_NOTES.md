# Security Notes

Operator-facing summary of the security model. Keep this short. When in doubt,
prefer the source of truth: the RPC definitions in Supabase and the handlers in
`api/`.

## API boundary

Three execution surfaces:

1. **Browser** — `@/lib/supabase` (re-export of `src/backend/supabase/client.ts`).
   Uses the **anon publishable key only**. RLS + SECURITY DEFINER RPCs are the
   only thing standing between an authenticated user and the data.
2. **Vercel edge functions** (`api/*`) — use `supabaseServerClient` from
   `api/_lib/supabaseServerClient.ts` which holds the service-role key. Edge
   functions verify the session cookie, then either forward the user's minted
   JWT to PostgREST (so RLS still applies) or use the service-role client for
   trusted operations.
3. **Legacy dev Express server** (`server/`) — only runs via `npm run dev:server`.
   Not deployed. Uses its own service-role client (`server/lib/supabaseClient.ts`).

Service-role keys must never appear in any file under `src/`. The canonical
browser client carries a comment to that effect.

## RPC security model

Every mutating write that takes user identity goes through a SECURITY DEFINER
function. Inside the RPC:
- `current_user_id()` returns `auth.uid()` (resolved from the JWT in the
  Authorization header forwarded by PostgREST).
- `is_admin()` checks the caller's role for admin-only operations.

Hardened RPCs:
| RPC | Caller | Purpose |
|---|---|---|
| `verify_user_password(username, password)` | server (service role) | Login |
| `create_user_with_password(username, password)` | server (service role) | Signup |
| `update_user_password(user_id, old, new)` | server (service role) | Change password |
| `submit_poll_vote(poll_id, option_id)` | authenticated user | Vote; one per user/poll |
| `spend_tokens(amount)` | authenticated user | Atomic spend, no race |
| `get_polls_with_vote_counts(limit)` | anon + authenticated | Landing poll page |
| `join_community / leave_community / touch_member_activity / mark_community_read / set_community_notifications` | authenticated user | Membership writes |
| `update_community_presentation / create_community_from_request` | admin | Admin actions, gated on `is_admin()` |
| `send_community_message / delete_community_message / toggle_message_like` | authenticated user | Chat writes (pre-existing) |

`revoke all from public, anon` + explicit `grant execute` to the right role
on every RPC.

## Rate limiting

Implemented in `api/_lib/rateLimit.ts` with an in-memory sliding window.
No external service required.

| Endpoint | Key | Cap |
|---|---|---|
| `POST /api/auth/signup` | client IP | 5 / 10 min |
| `POST /api/auth/login` | `username:IP` | 10 / 10 min |
| `POST /api/auth/change-password` | user id | 5 / 10 min |
| `POST /api/polls/[pollId]/vote` | client IP | 30 / 10 min |
| `POST /api/users/[userId]/tokens` | user id | 20 / 1 min |

Behaviour:
- Counters live per Vercel function instance. Cold starts wipe state and
  concurrent instances do not share. Accepted tradeoff: slows a single
  attacker burst within an instance without an external dependency.
- **Limit reached** → 429 `rate_limited` with a `retry-after` header.

## Required production env vars

These must be set in Vercel project env (Production scope at minimum):

| Var | Purpose | Failure mode if missing |
|---|---|---|
| `SUPABASE_URL` | All server Supabase calls | Endpoints return 503 |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role client (signup, admin tasks) | 503 |
| `SUPABASE_JWT_SECRET` | Mint + verify session JWTs | Sessions fail; `/api/auth/me` 500 |
| `VITE_SUPABASE_URL` | Browser client | App can't load |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser anon key | App can't load |
| `APP_BASE_URL` *(optional)* | Trusted-origin check | Falls back to same-host detection |
| `VITE_POSTHOG_KEY` *(optional)* | Analytics | Analytics no-ops gracefully |

## What's not covered yet (TODO)

- **Distributed rate-limit consistency** — counters are per-instance only.
  Concurrent Vercel instances do not share, and cold starts reset state. Fine
  for current traffic; revisit if abuse becomes coordinated across IPs.
- **Account lockout** — login rate-limit slows credential stuffing but doesn't
  lock accounts after N failures.
- **CSP headers** — content-security-policy is not set; the app currently
  relies on same-origin + httpOnly cookie for session protection.
- **Webhook signature verification** — none of the integration webhooks
  currently verify signatures end-to-end.
- **Pitch pages** (`/pitch`, `/pitch-v1`, `/pitch-v2`) — left publicly routable
  pending product confirmation that they are no longer used in outreach.

## Routes

Public landing + legal pages remain public. The only dev-only route
(`/__test/poll-onboarding`) is gated by `import.meta.env.DEV` so it's stripped
from production builds.

## Analytics

PostHog is wired in `src/main.tsx` and initializes only when `VITE_POSTHOG_KEY`
is set. When unset, every analytics call no-ops. Web vitals reporting runs
unconditionally via the `web-vitals` package.
