# RAW codebase map (zoomed out)

> Audience: engineers new to this area who need a reliable “where do I start?” map before debugging or changing behavior.

This map intentionally uses product vocabulary already present in the code (RAW, onboarding journey, polls, communities, avatar levels, token balance, signup OTP, streak cron, assistant feedback).

## Domain glossary (project language → code seams)

| Domain term | Meaning in this codebase | Primary seam(s) |
|---|---|---|
| RAW session | Browser/server session carrying logged-in identity and anonymous vote context | `server/routes/auth.ts`, `server/routes/polls.ts`, `server/types.ts` |
| Onboarding journey | Multi-step flow after login and before dashboard access | `src/pages/Index.tsx`, `src/components/onboarding/OnboardingJourney.tsx`, `src/store/useOnboarding.ts` |
| Poll vote cycle | Fetch poll feed, apply eligibility rules, record vote, return updated view state | `server/routes/polls.ts`, `server/lib/store.ts`, `server/lib/pollRepository.ts` |
| Community selection/join | User selects onboarding communities then joins chats on completion | `src/pages/Index.tsx`, `src/store/useCommunities.ts`, `src/lib/communityChat.ts` |
| Avatar progression | Unlock/select avatar levels and track ownership/pricing | `src/store/useRewards.ts`, dashboard + onboarding consumers |
| Token economy | Balance + extra-poll unlock behavior exposed to dashboard | `src/store/usePolls.ts`, `src/store/useRewards.ts`, dashboard consumers |
| Signup OTP | Request and verify one-time code before account creation | `server/routes/auth.ts`, `server/lib/otp.ts`, `server/lib/phoneHash.ts` |
| Streak cron | Scheduled reset + “at risk” notifications | `server/index.ts`, `server/lib/streakCron.ts` |

## 1) Bounded contexts (one layer up)

- **Experience shell (UI composition):** routing, page branches, and visual sections under `src/`.
- **Client domain orchestration:** `useRawStore` composes auth + polls + rewards + onboarding + communities into one façade.
- **Backend API surface:** Express routers for auth, polls, users, assistant, notifications, cron.
- **Domain/persistence adapters:** repository + service helpers (`userRepository`, `pollRepository`, OTP/email/password/phone utilities, bootstrap/vote rule helpers).

## 2) Flow spine (the control rooms)

### Client control rooms

1. `src/App.tsx` — route switchboard and global providers.
2. `src/pages/Index.tsx` — main experience splitter:
   - visitor/pre-auth → landing shell
   - logged in + onboarding incomplete → onboarding journey
   - logged in + onboarding complete → dashboard
3. `src/store/useRawStore.ts` — single client façade used by `Index` and many child components.

### Server control room

1. `server/index.ts` — middleware/security/session/rate-limit setup.
2. Route mounting:
   - `/api/auth` → auth router
   - `/api/users` → users router
   - `/api/assistant` → assistant router
   - `/api/notifications` → notifications router
   - `/api/cron` → cron router
   - `/api/*` polls endpoints
3. In-process schedule loop triggers streak reset + at-risk emails.

## 3) Module map + callers

## Identity & access (signup/login/session)

- **Owner:** `server/routes/auth.ts`
- **Behavior:** OTP signup, login throttling, invite-code checks, session regeneration, anonymous-vote transfer.
- **Main callers:** client auth actions surfaced through `useRawStore` (`requestSignupOtp`, `verifySignupOtp`, `login`, `logout`).
- **Important collaborators:** `userRepository`, `otp`, `email`, `password`, `phoneHash` libs.

## Polls and voting

- **Owner:** `server/routes/polls.ts`
- **Behavior:** bootstrap response, random poll retrieval, vote permission checks, vote recording.
- **Main collaborators:**
  - `server/lib/store.ts` (`buildBootstrap`, `canVote`, `applyVote`, `recordPollVote`)
  - `server/lib/pollRepository.ts` (active poll feed)
  - `server/lib/userRepository.ts` (session user lookup)
- **Main callers:** poll flows in client stores/components via API.

## Onboarding + community activation

- **Owner seam:** `src/pages/Index.tsx`
- **Behavior:** gates dashboard access until onboarding completion; writes onboarding state; triggers community joins.
- **Main callers:** login-success path in `Index`; onboarding UI components and related stores.

## Rewards and avatar progression

- **Owner seam:** `src/store/useRewards.ts` (composed by `useRawStore`).
- **Behavior:** avatar level ownership/pricing/unlock, onboarding avatar selection, reward-facing state used by dashboard.
- **Main callers:** `Index` and dashboard panels.

## Assistant / notifications / cron

- **Owner seams:** mounted routers from `server/index.ts` + `server/lib/streakCron.ts`.
- **Behavior:** assistant-related endpoints, notification endpoints, scheduled streak jobs.

## 4) Verified caller map (quick grep-level truth)

- `App` routes to `Index` and other page modules.
- `Index` imports and calls `useRawStore`.
- `useRawStore` composes `useAuth`, `usePolls`, `useRewards`, `useOnboarding`, `useCommunities`.
- `server/index.ts` mounts auth/polls/users/assistant/notifications/cron routers.
- `pollsRouter` calls `buildBootstrap`, `canVote`, `applyVote`, `recordPollVote`, `fetchActivePolls`.
- `authRouter` calls `sendOtp`, `verifyOtp`, password and phone utilities, and user repository methods.

> If this map and code disagree, trust code first and update this file.

## 5) Where to start when diagnosing

1. **Wrong screen / redirect / gating:** start in `src/pages/Index.tsx` branch logic.
2. **Action exists but state feels inconsistent:** start in `src/store/useRawStore.ts`, then descend into the composed store (`useAuth`/`usePolls`/etc.).
3. **Auth/session anomalies:** start in `server/routes/auth.ts` and session mutation points.
4. **Vote denied/duplicated/eligibility confusion:** start in `server/routes/polls.ts` + `server/lib/store.ts` vote rules.
5. **Time-based streak issues:** start in `server/index.ts` scheduler + `server/lib/streakCron.ts`.

## 6) Better alternatives (recommended next steps)

1. **Best immediate upgrade:** add `CONTEXT.md` at repo root with canonical glossary + “source of truth” definitions used in tests and docs.
2. Add `docs/flows/` sequence docs for:
   - OTP signup request/verify (happy + failure)
   - bootstrap → random polls → vote
   - onboarding completion → community join.
3. Add a script-generated dependency snapshot (e.g., madge) and check in a simple graph artifact to avoid doc drift.
4. Add 3 integration tests (one per flow spine):
   - auth signup/login/session continuity,
   - poll vote eligibility + recording,
   - onboarding gating transition to dashboard.

## 7) Lightweight maintenance contract

- Update this map whenever route mounts, store composition, or onboarding gating logic changes.
- Prefer editing glossary terms first, then caller graph, then recommendations.
