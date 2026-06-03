# Supabase access boundary

This repo runs three distinct trust zones. **Do not blur them.**

## 1. Frontend Supabase client (`src/backend/supabase/client.ts`)

- Uses the **anon key** only. Never imports or references `SUPABASE_SERVICE_ROLE_KEY`.
- Safe for: public table reads (polls, communities list, avatar catalog), and authenticated calls that route through `SECURITY DEFINER` RPCs where ownership is enforced server-side.
- **Forbidden**: direct `INSERT`/`UPDATE`/`DELETE` on tables where the row has a `user_id`/`sender_id`/`requester_id`. RLS will reject those after `20260603170000_harden_rls_security.sql`. Use the RPCs (`send_community_message`, `delete_community_message`, `spend_tokens`, etc.) instead.

## 2. Server API routes (`api/**/*.ts`, `server/**/*.ts`)

- May use `supabaseServerClient` (service-role) **only** in code under `api/` and `server/`. Never import it from anywhere in `src/`.
- Responsible for verifying session before calling any RPC or table write.
- Token spend, payment webhooks, admin moderation, and other privileged writes live here.
- `api/users/[userId]/tokens.ts` does **not** trust the URL `userId`. The route enforces that the verified session user matches the route id, and the underlying `spend_tokens(p_amount)` RPC re-derives identity from `current_user_id()` inside the database.

## 3. SQL / RPC (`supabase/migrations/*.sql`)

- Identity check happens here, not in the caller. RPCs that mutate user data must read `public.current_user_id()` and never accept a `p_user_id` argument.
- `public.is_admin()` is the only admin gate.
- RLS policies must never use `USING (true)` or `WITH CHECK (true)` for writes. Public read with `USING (true)` is acceptable for data that is intentionally public; column-level `GRANT SELECT` keeps sensitive fields (`password_hash`, `email`, `phone`, `token_balance`) out of anon reach.

## What `localStorage` is and isn't

`localStorage` holds a **UI cache** of the user object (username, avatar level, etc.) so the dashboard can render without a round-trip. It is **not** identity. Any code path that reads `localStorage` to decide "is this user allowed to do X?" is a bug — that check must happen server-side (RPC, RLS, or server route).

## Quick checklist before merging a Supabase-touching PR

- [ ] No `SUPABASE_SERVICE_ROLE_KEY` import in any `src/` file.
- [ ] No new `USING (true)` / `WITH CHECK (true)` write policy.
- [ ] Any RPC that mutates user-owned rows derives identity from `current_user_id()` and does not accept a `p_user_id` argument.
- [ ] Any API route that takes a `userId` in the path or body verifies it matches the session user before touching the DB.
- [ ] The frontend does not send `sender_id`, `senderName`, `senderAvatarLevel`, or anything else that the server can derive itself.

## Remaining work (transitional)

- Custom username/password auth still issues identity through `localStorage`. Until that finishes migrating to Supabase Auth (or a server-side session that mints a Supabase JWT per request), `current_user_id()` returns `auth.uid()` which is `NULL` for custom-auth users. The API edge routes currently bridge this with a short-lived `X-Raw-Session-User` header check; that bridge is marked `TODO(auth-migration)` in code and must be replaced with a real verified session before any new privileged surface is added.
