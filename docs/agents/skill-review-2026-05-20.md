# Skill-focused codebase review (2026-05-20)

## Scope

Reviewed current repository implementation against requested skill areas:

- Supabase Postgres best practices
- Vercel AI gateway readiness
- Cloud SQL PostgreSQL health/data/config checks
- Figma code-connect readiness

## Assumptions

- The referenced Windows-local skill files are not available inside this container, so this review uses the current repo state and standard best practices.
- The request is for a practical review + improvement options, not a full architecture rewrite.

## Findings

### 1) Supabase client creation is repeated across API routes

Multiple API handlers recreate a near-identical `createClient` bootstrap with environment variable fallback logic.

Examples:

- `api/polls/random.ts`
- `api/polls/[pollId]/vote.ts`
- `api/users/[userId]/tokens.ts`
- `api/users/[userId]/notification-consent.ts`
- `api/moderation/issue-reports.ts`

**Risk:** drift in env handling and auth options across handlers.

**Better option:** add a shared server helper (`api/_lib/supabaseServerClient.ts`) and import it everywhere. This reduces duplicate configuration and rollout risk.

### 2) Publishable-key usage in server paths can hide privilege bugs

Several server handlers build clients from `VITE_SUPABASE_PUBLISHABLE_KEY`. That is fine for RLS-constrained reads/writes, but the intent of each route is not always explicit.

**Risk:** accidental assumptions about elevated privileges or unexpected RLS failures.

**Better option:** classify each endpoint by privilege level:

- user-context / publishable-key path
- service-role / admin path

Document this in each file header (one-line comment) and route docs.

### 3) Poll fetch pattern can be optimized for fewer round-trips

`server/lib/pollRepository.ts` and `src/utils/supabasePolls.ts` fetch poll rows and related rows with separate queries then merge in application logic.

**Risk:** extra network round-trips and more error surfaces.

**Better option:** move to a SQL function or a single nested PostgREST select where possible, then benchmark latency before/after.

### 4) Database observability hooks are thin

Current repo has migrations and schema files, but no explicit runbook/check script for Postgres health at deploy time.

**Better option:** add a lightweight health check script that verifies:

- connect/auth success
- key table read smoke tests
- expected extensions/schemas present

This aligns with Cloud SQL/Supabase operational best practices.

### 5) Vercel AI Gateway skill alignment is currently minimal

No clear AI gateway integration surface is present in this repo yet.

**Better option:** if adopting AI gateway next, add a thin adapter module first (single responsibility), then switch callers behind that adapter. Avoid touching UI and backend simultaneously.

### 6) Figma Code Connect readiness is limited

No obvious component metadata or code-connect mapping artifacts were found.

**Better option:** start with one stable component family and pilot code-connect mapping there before scaling.

## Suggested rollout order (lowest risk first)

1. Extract shared Supabase server client helper for API routes.
2. Add endpoint privilege classification comments/docs.
3. Add DB health-check script and CI invocation.
4. Optimize poll read path with benchmark evidence.
5. Pilot AI gateway adapter.
6. Pilot Figma code-connect on a small component slice.

## Verification checks used for this review

- `rg --files -g '**/AGENTS.md'`
- `rg -n "ai gateway|ai-gateway|supabase|postgres|cloud sql|figma|code connect|vercel" .`

