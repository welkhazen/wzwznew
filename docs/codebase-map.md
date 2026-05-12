# RAW codebase map (zoomed out)

This map uses the product vocabulary already present in the code (RAW, onboarding journey, polls, communities, avatar levels, token balance, signup OTP, streak cron, assistant feedback).

## 1) Top-level bounded contexts

- **Experience shell (web/mobile UI):** route composition, page-level flows, visual components and hooks under `src/`.
- **State orchestration (client domain state):** composite store that merges auth, polls, rewards, onboarding, and communities into one RAW-facing API.
- **Backend API (Express):** auth/session, polls, users, assistant, notifications, cron.
- **Persistence/adapters:** user repository + poll repository + OTP/email adapters + server-side in-memory/session store helpers.

## 2) Entry points and flow spine

### Client entry + route graph

- `src/App.tsx` is the UI root and route switchboard.
- Most product routes eventually converge into `Index` for the main user-state decision tree.

### Main experience splitter

- `src/pages/Index.tsx` decides among three major experiences:
  1. **Landing shell** (visitor / pre-auth)
  2. **Onboarding journey** (logged in, not completed)
  3. **Dashboard** (logged in, onboarding completed)
- This file is the best “single control-room” for understanding user progression states.

### Client domain façade

- `src/store/useRawStore.ts` aggregates sub-stores (`useAuth`, `usePolls`, `useRewards`, `useOnboarding`, `useCommunities`) into one consistent API used by `Index` and downstream pages/components.

### Server entry + route mounting

- `server/index.ts` wires middleware (helmet, CORS, session, rate limits), mounts feature routers, exposes health, and starts cron routines.

## 3) Module map by domain language

## Identity & access (signup/login/session)

- **Primary router:** `server/routes/auth.ts`
- Responsibilities in domain terms:
  - signup OTP request/verify
  - login protection and throttling
  - referral-code gate (invite-only mode)
  - session regeneration and transfer of anonymous vote context
- Key callers:
  - Frontend auth actions exposed through `useRawStore` (`requestSignupOtp`, `verifySignupOtp`, `login`, `logout`)
  - Any route requiring session user identity indirectly depends on this context.

## Polls and voting economy

- **Primary router:** `server/routes/polls.ts`
- Responsibilities:
  - bootstrap payload for user/session state
  - random poll feed retrieval (repository-backed with fallback)
  - vote authorization and recording
- Core server collaborators:
  - `server/lib/store.ts` (bootstrap construction, vote rules, vote mutation)
  - `server/lib/pollRepository.ts` (active poll feed fetch)
  - `server/lib/userRepository.ts` (resolve session user)
- Key UI callers:
  - client poll hooks/stores (via raw-store façade)
  - onboarding and dashboard vote actions.

## Onboarding journey

- **Orchestration seam:** `src/pages/Index.tsx`
- **Execution component:** `src/components/onboarding/OnboardingJourney.tsx`
- Domain artifacts tracked in state:
  - onboarding step
  - answered poll IDs
  - selected communities
  - completion marker
- Cross-domain side effect:
  - upon onboarding completion, community chat join is triggered via `joinCommunityChat`.

## Communities

- Client state merged via `useCommunities` into raw-store.
- Onboarding uses community selection constraints and post-completion join behavior.
- Dashboard has community-focused panes/components (`DashboardCommunities`, community routes).

## Rewards / avatar progression

- Client state merged via `useRewards`.
- Domain terms surfaced to callers:
  - avatar level
  - owned avatar levels
  - unlock avatar level
  - token balance and extra-poll unlocks
- Consumed directly by onboarding and dashboard flows.

## Assistant / notifications / cron

- Mounted from `server/index.ts` as separate routers (`assistant`, `notifications`, `cron`).
- Time-based streak workflows (`runStreakResetAtUtc`, `sendStreakAtRiskEmailsUtc`) run from server bootstrap loop.

## 4) Caller graph (practical “who calls what”)

- `src/App.tsx` → routes to `Index`, `Dashboard` path, and secondary pages.
- `src/pages/Index.tsx` → calls `useRawStore` and conditionally renders `LandingShell`, `OnboardingJourney`, `Dashboard`.
- `src/store/useRawStore.ts` → calls `useAuth`, `usePolls`, `useRewards`, `useOnboarding`, `useCommunities`; exports unified action/state surface.
- Client auth/poll actions → call backend API endpoints under:
  - `/api/auth/*`
  - `/api/polls/*` and `/api/v2/polls/*`
  - `/api/bootstrap`
- `server/index.ts` → mounts `authRouter`, `pollsRouter`, `usersRouter`, `assistantRouter`, `notificationsRouter`, `cronRouter`.
- `pollsRouter` → calls store/repository helpers (`buildBootstrap`, `canVote`, `applyVote`, `recordPollVote`, `fetchActivePolls`).
- `authRouter` → calls user repository + OTP/email/password/phone utilities.

## 5) Where to look first for changes

- **If a bug is “wrong screen shown”**: start at `src/pages/Index.tsx` branch logic.
- **If a bug is “action exists but weird state”**: inspect `src/store/useRawStore.ts` and the specific underlying store.
- **If a bug is “auth/session oddity”**: inspect `server/routes/auth.ts` and session mutation points.
- **If a bug is “poll eligibility/vote conflict”**: inspect `server/routes/polls.ts` plus `server/lib/store.ts` rule helpers.

## 6) Better alternatives to smooth future debugging flow

1. Add a formal `CONTEXT.md` glossary at repo root defining canonical terms (RAW user, onboarding completion, free vote, locked poll, streak-at-risk, avatar unlock).
2. Add lightweight sequence diagrams (`docs/flows/*.md`) for:
   - signup OTP happy path + failure path
   - bootstrap + random polls + vote cycle
   - onboarding completion → community join
3. Introduce a tiny dependency map generator script (e.g., madge/ts-prune-based) to keep “caller map” always current.
4. Create one integration test per spine flow (auth, poll vote, onboarding gating) so diagnose loops can start from deterministic failing tests faster.
