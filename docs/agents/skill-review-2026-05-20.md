# Skill-focused codebase review (2026-05-20, revised)

## Scope

Reviewed current repository implementation against requested skill areas:

- Supabase Postgres best practices
- Vercel AI gateway readiness
- Cloud SQL PostgreSQL health/data/config checks
- Figma code-connect readiness

## Assumptions

- The Windows-local skill file paths in the request are not mounted in this container.
- This revision prioritizes concrete, debuggable findings over broad recommendations.

## Findings (debugged + tightened)

### 1) Confirmed: duplicated Supabase API client bootstrap in route handlers

The same client bootstrap pattern appears in multiple routes:

- `api/polls/random.ts`
- `api/polls/[pollId]/vote.ts`
- `api/users/[userId]/tokens.ts`
- `api/users/[userId]/notification-consent.ts`
- `api/moderation/issue-reports.ts`

**Issue:** repeated env parsing and client options can drift between files.

**Fix (low risk):** create `api/_lib/supabaseServerClient.ts` exporting one `getSupabaseRouteClient()` helper and replace per-file bootstrap blocks.

**Debug check:** grep for `createClient(` in `api/` before/after to confirm duplication reduction.

---

### 2) Confirmed: server routes often use publishable key by default, privilege intent unclear

Several server routes initialize with `VITE_SUPABASE_PUBLISHABLE_KEY` and perform writes/RPC calls.

**Issue:** intent is ambiguous (RLS-constrained user path vs elevated server/admin path).

**Fix (safer):** classify each route explicitly:

- `publishable` mode (RLS expected)
- `service_role` mode (admin path)

Add a one-line route header comment (`// Privilege mode: publishable|service_role`) and validate env variable requirements per mode.

**Debug check:** run a route matrix test for unauthorized/authorized cases to verify expected RLS behavior.

---

### 3) Confirmed: poll fetch path uses multi-query composition

`server/lib/pollRepository.ts` and `src/utils/supabasePolls.ts` do fan-out reads and merge rows client-side.

**Issue:** extra round-trips and additional merge/error logic.

**Fix (performance-first option):** pilot a single SQL function or nested PostgREST query for poll + options + votes, keep legacy path behind a feature flag for fast rollback.

**Debug check:** measure p50/p95 latency and payload sizes before/after.

---

### 4) Confirmed: DB health observability is missing as executable check

Schema/migration files exist, but there is no committed health-check script/runbook command that CI can execute.

**Issue:** operational drift can go undetected until runtime.

**Fix (operations-first):** add `scripts/db-health-check.ts` (or shell equivalent) that verifies:

- DB connect/auth
- smoke read from critical tables
- expected schema/extension availability

Wire into CI as non-blocking first, then promote to blocking once stable.

**Debug check:** run locally + CI dry-run and capture structured output.

---

### 5) Corrected finding: AI Gateway is not integrated (this is a roadmap item, not a bug)

No AI request layer was found in active app routes that would currently benefit from gateway migration.

**Clarification:** this is readiness work, not break/fix.

**Fix (incremental):** add a thin AI transport adapter only when first AI endpoint is introduced; avoid speculative scaffolding now.

**Debug check:** once an AI endpoint exists, verify provider swap via adapter without changing call sites.

---

### 6) Corrected finding: Figma Code Connect is currently out-of-scope for runtime stability

No code-connect artifacts were found.

**Clarification:** absence is not a defect unless design-system sync is an active deliverable.

**Fix (minimal):** defer until a component library contract is finalized; then pilot with one stable component family.

**Debug check:** validate generated mapping for one component + token sync correctness.

## Better alternatives (recommended)

1. **Best immediate ROI:** fix finding #1 first (shared API client helper). Small diff, broad consistency gain.
2. **Best safety next:** implement finding #2 route privilege classification to prevent silent auth/permission confusion.
3. **Best speed validation:** run health-check script (#4) in CI before performance work (#3).

No better alternative found to this order; it is already minimal-risk and high signal.

## Suggested implementation order (actionable)

1. Shared API Supabase helper + migrate one tracer-bullet route.
2. Apply privilege-mode comments + env guards across all API routes.
3. Add DB health-check script and CI step.
4. Benchmark poll read optimization and rollout behind flag.
5. Introduce AI Gateway adapter only when first AI route lands.
6. Pilot Figma Code Connect only when DS sync becomes active scope.

## Verification commands used in this revision

- `rg --files -g '**/AGENTS.md'`
- `rg -n "createClient\(|VITE_SUPABASE_PUBLISHABLE_KEY|SUPABASE_SERVICE_ROLE_KEY" api server src`
- `rg -n "pollRepository|supabasePolls" server src`
- `rg -n "ai gateway|ai-gateway|figma|code connect" .`
