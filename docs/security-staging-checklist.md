# Security Staging Checklist — PR #734

Run this after applying migrations to staging. Each item maps to a specific
policy or RPC change introduced in PR #734.

---

## 1. Apply migrations

```bash
supabase db push --linked
# or on staging:
supabase migration up
```

Expect no errors. The three migrations are idempotent (DROP IF EXISTS / CREATE OR REPLACE).

---

## 2. SQL verification queries

Run these in the Supabase SQL editor on the staging project.

### 2a. blocked_words enforcement in send_community_message

```sql
-- Seed a test blocked word
INSERT INTO public.blocked_words (term) VALUES ('badword') ON CONFLICT DO NOTHING;

-- As an authenticated test user, call the RPC with the blocked term.
-- Should raise: P0001 blocked_word
SELECT public.send_community_message(
  'your-test-community-id',
  'this contains badword in it'
);
-- Expected: ERROR:  blocked_word

-- Allowed message should succeed
SELECT id, text FROM public.send_community_message(
  'your-test-community-id',
  'this is a clean message'
);
-- Expected: row returned with the message

-- Clean up test word
DELETE FROM public.blocked_words WHERE term = 'badword';
```

### 2b. user_favorite_communities — owner-scoped writes

```sql
-- As user A (auth.uid() = 'uuid-of-user-a'), try to insert a row for user B.
-- Should be rejected by RLS.
INSERT INTO public.user_favorite_communities (user_id, community_id, position)
VALUES ('uuid-of-user-b', 'any-community-id', 1);
-- Expected: ERROR: new row violates row-level security policy

-- Own row should succeed
INSERT INTO public.user_favorite_communities (user_id, community_id, position)
VALUES ('uuid-of-user-a', 'any-community-id', 1);
-- Expected: success

-- Clean up
DELETE FROM public.user_favorite_communities WHERE user_id = 'uuid-of-user-a';
```

### 2c. user_pinned_message — owner-scoped writes

```sql
-- As user A, attempt to insert a pin for user B. Should fail.
INSERT INTO public.user_pinned_message (user_id, message_id, community_id, message_text)
VALUES ('uuid-of-user-b', 'msg-1', 'community-1', 'test');
-- Expected: ERROR: new row violates row-level security policy
```

### 2d. user_accent_unlocks — owner-scoped writes

```sql
-- As user A, attempt to insert an accent unlock for user B. Should fail.
INSERT INTO public.user_accent_unlocks (user_id, accent_id)
VALUES ('uuid-of-user-b', 'accent-gold');
-- Expected: ERROR: new row violates row-level security policy
```

### 2e. communities — anon cannot insert

```sql
-- Switch to anon role and attempt direct insert. Should fail.
SET LOCAL role = anon;
INSERT INTO public.communities (id, title) VALUES ('test-id', 'test');
-- Expected: ERROR: permission denied for table communities
RESET role;
```

### 2f. communities — authenticated non-admin cannot insert

```sql
-- As a non-admin authenticated user:
INSERT INTO public.communities (id, title, status)
VALUES ('test-id', 'Hacker Community', 'approved');
-- Expected: ERROR: new row violates row-level security policy (is_admin() = false)
```

### 2g. communities — admin CAN write (via is_admin())

```sql
-- As an admin user (role = 'admin', status = 'active'):
INSERT INTO public.communities (id, title, status)
VALUES ('admin-test-id', 'Admin Test Community', 'approved');
-- Expected: success
DELETE FROM public.communities WHERE id = 'admin-test-id';
```

---

## 3. UI / smoke tests

Run these manually against the staging frontend after migrations are applied.

| # | Action | Expected result |
|---|--------|-----------------|
| 1 | Log in as existing user | Login succeeds, dashboard loads |
| 2 | Sign up with invite code | Signup succeeds, onboarding starts |
| 3 | Send a normal chat message | Message appears immediately (optimistic), confirmed by realtime |
| 4 | Send a chat message containing a blocked word | Toast: "Message blocked — That message contains blocked content." Message disappears (not left in failed/retryable state) |
| 5 | Favorite a community | Star saves, persists after reload |
| 6 | Unfavorite a community | Star removed, persists after reload |
| 7 | Pin a chat message | Pin appears in profile/pinned tab |
| 8 | Unpin a message | Pin removed |
| 9 | Unlock/select an accent color | Accent persists after logout → login |
| 10 | Browse communities | Community list loads, join/leave works |
| 11 | Submit a community request | Request submitted successfully |
| 12 | Admin: approve/update community | Community appears in browse list |
| 13 | Token spend (daily spin) | Spin deducts tokens, records reward |
| 14 | Retry a failed network message | Retry works (network error is still retryable) |
| 15 | Blocked message retry NOT shown | After blocked toast, no retry button appears |

---

## 4. Rollback

If any regression is found:

```bash
# Revert the three migrations in reverse order
supabase migration repair --status reverted 20260630020000
supabase migration repair --status reverted 20260630010000
supabase migration repair --status reverted 20260630000000
```

Or restore the permissive policies manually using the DDL in the original
migrations (`20260603000000`, `20240009000000`, `20260602114657`).
