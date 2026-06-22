# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## Brand wordmark rule

The product name "raW" must always render with its capital **W** in the active
theme accent color. Never hand-write the colored span. Instead:

- In JSX, use `<BrandName />` from `@/components/ui/brand-name` (renders `ra` +
  accent-colored `W`).
- For prose strings that may contain "raW", use `highlightRawWordmark(...)` from
  `@/components/ui/highlightRawWordmark` (many section shells already do this).

The accent color comes from `--primary` / `--accent` / `--raw-accent`, which
ThemeProvider and ThemeCustomizer update when the user picks an accent — so the
W follows the theme automatically. See `docs/avatars.md` for the avatar system.

## 0. Minimal File Inspection

**Only inspect the exact files needed. Do not scan the whole repo.**

- Do not read large generated files, lock files, build folders, `node_modules`, or Supabase dumps unless strictly necessary.
- Prefer targeted `Read`/`Grep`/`Glob` on known paths over broad exploration.
- If you don't know which file to open, ask or narrow the search first — don't bulk-read.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available gstack skills:
- `/office-hours` - Office hours facilitation
- `/plan-ceo-review` - Plan CEO review
- `/plan-eng-review` - Plan engineering review
- `/plan-design-review` - Plan design review
- `/design-consultation` - Design consultation
- `/design-shotgun` - Design shotgun
- `/design-html` - Design HTML
- `/review` - Code review
- `/ship` - Ship changes
- `/land-and-deploy` - Land and deploy
- `/canary` - Canary deployment
- `/benchmark` - Benchmarking
- `/browse` - Web browsing (use this for all web browsing)
- `/connect-chrome` - Connect to Chrome
- `/qa` - QA testing
- `/qa-only` - QA only
- `/design-review` - Design review
- `/setup-browser-cookies` - Setup browser cookies
- `/setup-deploy` - Setup deployment
- `/setup-gbrain` - Setup gbrain
- `/retro` - Retrospective
- `/investigate` - Investigation
- `/document-release` - Document release
- `/document-generate` - Document generation
- `/codex` - Codex
- `/cso` - CSO
- `/autoplan` - Auto planning
- `/plan-devex-review` - Plan devex review
- `/devex-review` - Devex review
- `/careful` - Careful mode
- `/freeze` - Freeze
- `/guard` - Guard
- `/unfreeze` - Unfreeze
- `/gstack-upgrade` - Upgrade gstack
- `/learn` - Learning

## Agent skills

### Issue tracker

Issues are tracked as local markdown in `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) plus category labels (`bug`, `enhancement`). See `docs/agents/triage-labels.md`.

### Domain docs

Repo is configured as single-context. See `docs/agents/domain.md`.
