# raW — Architecture Review

_A senior-engineer reverse-engineering of the codebase: data flow, problem areas, and a
staged refactoring plan. Scope of this document is **analysis + strategy**; it intentionally
does **not** change runtime behavior. Each recommendation is tagged with a risk level and
whether it is behavior-preserving._

---

## 1. What the system is

raW is a privacy-first social polling + community-chat app. A Vite/React SPA front end, a
Supabase (Postgres + RLS + Realtime) data plane, Vercel Edge functions for trust-boundary
operations, and a parallel Express server. Native shells via Capacitor (iOS/Android).
Analytics through PostHog + Sentry + Vercel Speed Insights.

Core domains: **auth**, **polls/voting**, **community chat**, **avatars/rewards/tokens**,
**onboarding**, **moderation/admin**.

---

## 2. Reverse-engineered architecture

### 2.1 Layers as they actually exist

```
┌──────────────────────────────────────────────────────────────────────┐
│ React SPA (src/)                                                       │
│   main.tsx → App.tsx (Router) → pages/ → components/                   │
│   State:  useRawStore() = useAuth + usePolls + useRewards +            │
│           useOnboarding + useCommunities   (useState + localStorage)   │
│   Data access (THREE competing paths, see §2.3):                       │
│     a) src/lib/api/*  → fetch() → /api/* (Vercel Edge)                 │
│     b) @/lib/supabase → supabase-js → Postgres directly (19 files)     │
│     c) src/lib/api/client.ts mock fallback → seeds + direct supabase   │
└──────────────────────────────────────────────────────────────────────┘
            │ /api/*                                  │ supabase-js (RLS)
            ▼                                          ▼
┌─────────────────────────────┐            ┌──────────────────────────────┐
│ api/ — Vercel Edge (PROD)   │            │ Supabase                     │
│   auth (RPC + minted JWT)   │  RPC/SQL   │   Postgres + RLS             │
│   polls/vote (RPC, JWT)     │───────────▶│   Realtime (chat)            │
│   chat/send, moderation,    │            │   Storage (avatars)          │
│   notifications, admin      │            │   RPCs: verify_user_password,│
└─────────────────────────────┘            │   submit_poll_vote, …        │
                                            └──────────────────────────────┘
┌─────────────────────────────────────────────┐
│ server/ — Express (DEV / divergent)         │  ← overlaps api/ but with a
│   express-session + bcrypt + OTP + magic    │     DIFFERENT auth mechanism,
│   links + in-memory rate maps + cron        │     storage and signup flow
└─────────────────────────────────────────────┘
```

### 2.2 Data flow — the three flows that matter

**Auth (login):**
`useAuth.login` → `authController.signIn` → `POST /api/auth/login`
(`api/auth/login.ts`: trusted-origin check → Upstash rate-limit → Supabase RPC
`verify_user_password` → `mintAccessToken` (JOSE) → `Set-Cookie` + `{ access_token }`)
→ back in the browser, `applySupabaseSession()` **decodes the JWT and forges a
Supabase session**: it writes `sb-<ref>-auth-token` into localStorage and mutates private
client fields (`sb.headers.Authorization`, `sb.rest.headers`, `realtime.setAuth`,
`functions.setAuth`) via `as unknown as {…}`
(`src/backend/supabase/controllers/authController.ts:31-83`). Subsequent **direct**
supabase-js calls then ride that forged session against RLS.

**Vote:**
`usePolls.vote` → optimistic local set + daily-limit gate (client-side) →
`voteMutation` → `submitPollVote` → `POST /api/polls/:id/vote`
(`api/polls/[pollId]/vote.ts`: origin check → `getRequestUserId` → rate-limit →
`mintAccessToken` → **per-request JWT-scoped** supabase client → RPC `submit_poll_vote`;
DB unique index is the hard dedup). This path is correctly server-authoritative.

**Poll reads / admin / comments:**
`fetchPolls` → RPC `get_polls_with_vote_counts` **directly from the browser**;
`fetchAdminPolls`, `createAdminPoll`, `deleteAdminPoll`, comments → **direct supabase-js
table writes from the browser** (`src/lib/api/polls.ts:59-117, 197-229`). Integrity here
rests entirely on RLS. Note `deleteAdminPoll` fires three unguarded client-issued deletes.

### 2.3 The defining structural fact

There is no single backend. The same logical surface is implemented up to three times:
**Vercel Edge (`api/`)**, **Express (`server/`)**, and **browser-direct supabase-js**. The
front end only speaks the Edge dialect plus direct supabase; the Express auth stack
(OTP + magic links + session cookies) is **not reachable** from the SPA's flow and has
silently diverged. This split-brain is the root cause of most findings below.

---

## 3. Critical problem areas

Severity: 🔴 high · 🟠 medium · 🟡 low. "BP" = behavior-preserving to fix.

### 3.1 Bad architecture decisions

| # | Finding | Evidence | Sev |
|---|---------|----------|-----|
| A1 | **Split-brain backend.** Auth exists twice with different mechanisms (session-cookie + bcrypt + OTP vs minted JWT + Supabase RPC), different storage, different rate-limiting, even different signup shapes (`/signup/request-otp`+`/verify` vs single `/signup`). The SPA calls `/api/auth/signup`, which Express does not serve. | `server/routes/auth.ts` vs `api/auth/*` | 🔴 |
| A2 | **Forged Supabase session via SDK internals.** `applySupabaseSession` hand-writes the auth-token localStorage key and patches private client fields. Breaks on any supabase-js internal change; `refresh_token` is set to the access token (refresh is non-functional). | `authController.ts:31-83` | 🔴 |
| A3 | **Production mock fallback in the API client.** On network error or 502/503/504 *in the browser* it silently returns seed/mock data — and runs direct Supabase queries inside the "mock" path. Real users get fake data during an outage, with no error surfaced. | `src/lib/api/client.ts:145-184, 32-110` | 🔴 |
| A4 | **Privileged operations issued from the browser.** Admin poll create/delete and comment inserts go straight to Postgres; safety depends on RLS being flawless across every table touched by 19 client files. | `src/lib/api/polls.ts:89-117`; §3.4 | 🟠 |
| A5 | **Router as a no-op; pages self-dispatch.** `/`, `/dashboard`, `/dashboard/communities/:id` all render `<Index>`; view selection happens inside an 800-line page. | `src/App.tsx:47-49` | 🟠 |

### 3.2 Duplicate logic

| # | Finding | Evidence | Sev |
|---|---------|----------|-----|
| D1 | **Auth implemented twice** (see A1). | `server/routes/auth.ts`, `api/auth/*` | 🔴 |
| D2 | **Poll fetch/seed/shape logic in ≥5 homes.** `usePolls` (`INITIAL_POLLS`, `fetchPollsWithFallback`), `lib/api/client.ts` (`getSeedPollsResponse`, `getPollsMockResponse`), `lib/api/polls.ts`, `utils/supabasePolls.ts`, `server/lib/pollRepository.ts` each re-map poll rows. | listed files | 🟠 |
| D3 | **Three fetch wrappers**, none shared: `apiRequest` (mock fallback), `apiFetch` (analytics only), `postAuth` (auth-specific). Inconsistent error handling. | `lib/api/client.ts`, `lib/http.ts`, `authController.ts:114-124` | 🟠 BP |
| D4 | **Duplicate object keys** in the central store — `onboardingPublicUsername`, `onboardingPrivateUsername`, `setOnboarding*Username` are each emitted twice in the same literal. | `src/store/useRawStore.ts:40-48` | 🟡 BP |
| D5 | **Persist-and-emit boilerplate repeated 4×** in one hook (`setTokenBalance` → `localStorage.setItem` → `emitTokenBalanceUpdated`, with try/catch each time). | `src/store/usePolls.ts:138-262` | 🟡 BP |
| D6 | **`testConnection` duplicated** (`backend/supabase/client.ts:44` and `lib/api/polls.ts:19 testPollConnection`). | both files | 🟡 BP |

### 3.3 Performance bottlenecks

| # | Finding | Evidence | Sev |
|---|---------|----------|-----|
| P1 | **Client-side trending computation.** Pulls up to 50 polls with nested comment counts, then sorts/slices in JS on every call instead of an indexed RPC/materialized view. | `lib/api/polls.ts:170-195` | 🟠 |
| P2 | **Timer + effect churn in `usePolls`.** A 60s `setInterval` recomputes `todayKey`; several effects key off derived strings (`STORAGE_KEY`, `EXTRA_BATCHES_KEY`) that change identity per scope, re-running reads/writes. | `usePolls.ts:95-160` | 🟡 |
| P3 | **Heavy 3D stack in the bundle.** `three` + `@react-three/fiber` + `drei` + `three-mesh-bvh` for avatar/landing visuals. Chunked, but still a large download for a polling app. | `package.json`, `vite.config.ts:51-54` | 🟡 |
| P4 | **localStorage JSON parse/stringify on hot paths** (read on each key change, write on each set). 142 call sites. | repo-wide | 🟡 |

### 3.4 Scalability risks

| # | Finding | Evidence | Sev |
|---|---------|----------|-----|
| S1 | **Client-authoritative value state.** Daily poll limit is enforced client-side (`vote()` early-return); token balance for logged-in users is *local-only* for display. Both are trivially bypassable and not multi-device consistent. | `usePolls.ts:264-294, 231-262` | 🔴 |
| S2 | **In-memory server state.** `loginAttempts`, `magicLinks`, `signupByPhone` maps + express-session MemoryStore are single-process; rate-limiting/lockout silently weakens behind >1 instance. (Prod start is correctly refused without `SESSION_STORE_URL`, but the maps remain in-memory.) | `server/routes/auth.ts:34-55`, `server/index.ts:61-70` | 🟠 |
| S3 | **142 localStorage refs across 40 files**, ad-hoc `.v1` versioning, no migration story. Schema drift and quota failures are unmanaged. | repo-wide | 🟠 |
| S4 | **Moderation seeded from the client** (`useBlockedWordsSeed`) — trust-boundary data initialized browser-side. | `src/hooks/useBlockedWordsSeed.ts` | 🟡 |

### 3.5 Maintainability issues

| # | Finding | Evidence | Sev |
|---|---------|----------|-----|
| M1 | **God-components.** OnboardingJourney 1473, DashboardNav 1090, DashboardCommunities 912, Dashboard 796, DashboardPolls 796, PollSection 774 LOC. Hard to test or review. | `find … -name '*.tsx'` | 🟠 |
| M2 | **No frontend data boundary.** 19 components/hooks import `@/lib/supabase` directly; data access is smeared through the view layer. | grep: 19 files | 🟠 |
| M3 | **Type-unsafe escape hatches.** `supabase as unknown as {…}` and many `as` casts over RPC results defeat the type system at the riskiest seams. | `authController.ts`, RPC callers | 🟠 |
| M4 | **Overlapping homes / naming drift.** `src/lib/api/polls.ts` vs `src/utils/supabasePolls.ts`; three dirs named like backends (`api/`, `server/`, `src/backend/`); `avataridentity.ts` vs `avatarCatalog.ts`. | tree | 🟡 |
| M5 | **Divergent dead code.** Express OTP/magic-link auth is unreachable from the SPA but still maintained, tested, and shipped in the repo. | `server/routes/auth.ts` | 🟡 |

---

## 4. Clean target architecture

```
Frontend (src/)
  ui/            presentational components (no data fetching)
  features/<x>/  container components + feature hooks
  data/          THE ONLY place that imports supabase-js or calls /api
    apiClient.ts        one fetch wrapper (errors, analytics, types)
    repositories/       pollsRepo, authRepo, chatRepo, … (typed)
    localStore.ts       one namespaced/versioned localStorage facade
  store/         thin composition over feature hooks (server = source of truth)

Backend (pick ONE surface)
  api/           Vercel Edge = the production backend (keep)
  server/        delete, OR make it import the same handlers as a local proxy
  supabase/      Postgres + RLS + RPCs (value-gating logic lives here)
```

Guardrails that keep it clean:
- ESLint `no-restricted-imports` forbids `@/lib/supabase` outside `src/data/**`.
- One fetch wrapper; one localStorage facade; one auth implementation.
- Anything that gates value (tokens, daily limits, ownership) is **server-authoritative**;
  localStorage is a cache reconciled from the server, never the source of truth.

---

## 5. Refactoring strategy (staged, risk-ordered)

**P0 — behavior-preserving cleanups (safe now):**
1. ✅ Remove duplicate keys in `useRawStore.ts` (applied in this PR — see §6).
2. Consolidate the 3 fetch wrappers into one `apiClient` in `src/data/`; keep the public
   signatures so call sites don't change.
3. Extract the persist-and-emit helper in `usePolls` (`writeTokenBalance(key, value)`).
4. De-dupe `testConnection`/`testPollConnection`.

**P0.5 — needs product sign-off (changes prod behavior):**
5. Gate the API-client mock fallback behind `import.meta.env.DEV` so production stops
   silently serving seed data on outage; replace with explicit empty/error states +
   React-Query cache persistence for offline. _(A3 — listed, not applied, because the brief
   says don't change functionality.)_

**P1 — structural, incremental:**
6. Introduce `src/data/` repository boundary + the ESLint rule; migrate the 19 direct
   importers one feature at a time behind `repositories/*`.
7. Resolve the split-brain backend: delete `server/` auth or make it re-export the Edge
   handlers; one auth implementation, one rate-limit policy.
8. Replace the forged session (A2) with `supabase.auth.setSession({ access_token,
   refresh_token })` and a real refresh token from the Edge function.

**P2 — scalability + size:**
9. Make tokens and daily limits server-authoritative (RPC + RLS); localStorage becomes a
   cache. Reconcile on load.
10. One versioned `localStore` facade with typed keys + migrations.
11. Decompose god-components (M1) into container + presentational; push fetching into hooks.
12. Move trending computation into an indexed RPC/materialized view (P1).

---

## 6. Representative production-grade refactors

### 6.1 One fetch wrapper (replaces D3)

```ts
// src/data/apiClient.ts
import { track } from "@/lib/analytics";

export class ApiError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

export async function api<T>(input: string, init?: RequestInit): Promise<T> {
  const startedAt = performance.now();
  let res: Response;
  try {
    res = await fetch(input, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
  } catch (err) {
    track("api_error", { endpoint: input, status: 0, latency_ms: Math.round(performance.now() - startedAt) });
    throw err;
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    track("api_error", { endpoint: input, status: res.status, latency_ms: Math.round(performance.now() - startedAt) });
    const message =
      payload && typeof payload === "object" && typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : "Request failed.";
    throw new ApiError(res.status, message);
  }
  return payload as T;
}
```

Dev-only mock data moves to a `vite` dev plugin / MSW handler, so it never ships to prod
(addresses A3 without changing prod success-path behavior).

### 6.2 Persist-and-emit helper (replaces D5)

```ts
// inside usePolls — collapses 4 copies into one
const writeTokenBalance = useCallback((value: number) => {
  setTokenBalance(value);
  try {
    window.localStorage.setItem(TOKEN_BALANCE_KEY, String(value));
    emitTokenBalanceUpdated(TOKEN_BALANCE_KEY, value);
  } catch { /* ignore storage errors */ }
}, [TOKEN_BALANCE_KEY]);
```

### 6.3 Real Supabase session (replaces A2's internals-poking)

```ts
// Edge function returns { access_token, refresh_token, user }
await supabase.auth.setSession({ access_token, refresh_token });
// supabase-js then owns persistence + autorefresh; no localStorage forging,
// no `as unknown as {…}` against private fields.
```

### 6.4 Frontend data boundary (eslint guardrail for M2)

```js
// eslint.config.js — forbid supabase outside the data layer
{
  files: ["src/**/*.{ts,tsx}"],
  ignores: ["src/data/**"],
  rules: {
    "no-restricted-imports": ["error", {
      paths: [{ name: "@/lib/supabase", message: "Import data via src/data/repositories/*." }],
    }],
  },
}
```

---

## 7. What NOT to do

- Don't "fix" the split-brain by syncing the two auth stacks — **delete one**. Two
  implementations of a security boundary is the bug.
- Don't migrate all 40 localStorage sites at once; introduce the facade and migrate per
  feature so each step stays reviewable and behavior-preserving.
- Don't remove the production mock fallback (A3) silently — it's load-bearing for the
  current "looks alive during outage" behavior. Flip it with product sign-off and a real
  offline-cache replacement.

---

_The only code change shipped alongside this document is the §6 P0.1 duplicate-key removal
in `useRawStore.ts`; everything else is analysis and a staged plan to be executed on
approval._
