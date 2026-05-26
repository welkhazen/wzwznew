# Claude Code Export Preview (Filled Example)

Use this as a **preview of the final form** to paste into Claude Code so it can review context accurately.

## 00_identity

### Collaboration Preferences
- Preferred response style: concise summary first, then actionable next steps.
- Preferred level of detail: medium; include commands and evidence for changes.
- Preferred planning style: short goal-driven plan with verification checks.

### Engineering Preferences
- Code style constraints: surgical edits only; avoid unrelated refactors.
- Testing expectations: run targeted checks and report outcomes.
- Review preferences: include risks and suggested next best step.

### Hard Constraints
- Tools to use / avoid: avoid noisy raw transcript dumps when context transfer is the goal.
- Repo policies: keep handoff docs as living artifacts updated after major sessions.
- Non-negotiable requirements: preserve key decisions and open loops during transfer.

### Communication Notes
- Common terminology: memory pack, open loops, bootstrap prompt, handoff.
- Things to avoid: giant unstructured JSON pastes as primary context.

---

## 01_projects

### Project: Cross-LLM memory handoff setup
- Repo(s): `welkhazen/wzwznew` (also often paired with `welkhazen/wzwz`).
- Goal: package high-signal project memory so another LLM can continue work with minimal loss.
- Current status: baseline template pack created in `docs/llm-memory-pack/`.
- Current branch: current working branch containing the memory-pack docs commit.
- Top 3 priorities:
  1. Fill templates with real project state.
  2. Provide a copy-paste section tailored for Claude Code intake.
  3. Keep pack updated incrementally after each major session.
- Blockers: source history may be noisy or too large to paste directly.
- Risks: stale handoff docs lead to wrong assumptions in destination model.
- Next best action: paste the curated export block below into Claude Code and ask it to produce next actions + questions.

---

## 02_decisions

### Decision: Use structured memory pack over raw transcript export
- Date: 2026-05-26
- Context: raw chat exports are verbose and exceed practical context windows.
- Decision made: use six structured markdown files plus a bootstrap prompt.
- Alternatives considered: full JSON dump; selective screenshot history; ad-hoc summaries.
- Tradeoffs: requires manual curation, but gives better signal and portability.
- Consequences: easier onboarding for a new LLM and more reliable retrieval.
- References (PRs/issues/files): `docs/llm-memory-pack/*`.

### Decision: Keep the handoff as a living ledger
- Date: 2026-05-26
- Context: one-time migrations lose momentum and become stale quickly.
- Decision made: continuously update handoff docs after major sessions.
- Alternatives considered: one-time export only.
- Tradeoffs: small ongoing maintenance cost.
- Consequences: faster future migrations and fewer repeated explanations.
- References (PRs/issues/files): `docs/llm-memory-pack/README.md`.

---

## 03_open_loops

### Open Loop: Claude-ready export block requested
- Owner: current agent
- Current state: in progress
- Missing info: none critical
- Blocked by: none
- Unblock step: provide ready-to-paste export preview format
- Due/priority: high

### Open Loop: Populate templates from real repo state
- Owner: user + assistant
- Current state: pending
- Missing info: latest active tasks and priorities
- Blocked by: not yet curated from current docs/commits/issues
- Unblock step: run a quick curation pass and fill each template with concrete facts
- Due/priority: medium

---

## 04_timeline

### 2026-05-26 — Memory-pack templates created
- What happened: added `00_identity.md` through `05_glossary.md`, `README.md`, and `BOOTSTRAP_PROMPT.md`.
- Why it mattered: established a portable structure for cross-model handoff.
- Links: `docs/llm-memory-pack/`.

### 2026-05-26 — User requested Claude-oriented summary/export preview
- What happened: requested a concise format that Claude Code can ingest correctly.
- Why it mattered: improves transfer quality and reduces misunderstanding.
- Links: this file.

---

## 05_glossary

- **Memory pack**: Structured set of markdown files that preserves high-signal context for LLM transfer.
- **Bootstrap prompt**: Initialization prompt telling the destination model how to ingest the pack and what outputs to produce.
- **Open loop**: Unresolved task, blocker, or question requiring follow-up.
- **Living ledger**: Continuously maintained handoff docs, not a one-time snapshot.

---

## Ready-to-paste block for Claude Code

Paste this exact instruction with the filled sections above:

> You are taking over an active engineering workflow. Use the sections in this document as source of truth.
> 1) Summarize your understanding in 10 bullets max.
> 2) List top risks/unknowns.
> 3) Propose next 3 highest-impact actions.
> 4) Ask only blocker-level clarifying questions.
> 5) Return an updated Open Loops list with owner + next action.
