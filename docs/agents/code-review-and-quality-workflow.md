# Code review and quality workflow

Use this workflow for all implementation and review tasks.

## 1) Plan and success criteria

Before coding, write:

1. Assumptions (or unknowns).
2. A 2-4 step plan.
3. A concrete verification check for each step.

Template:

```md
Assumptions:
- ...

Plan:
1. [Step] -> verify: [command/check]
2. [Step] -> verify: [command/check]
```

## 2) Better-option check (required)

Before implementation, propose at least one better option that improves one of:

- Simplicity
- Safety
- Speed of validation
- Rollout risk

If no better option exists, explicitly say: "No better alternative found; current path is already minimal."

## 3) Surgical implementation

- Modify only files required for the request.
- Avoid unrelated refactors or formatting churn.
- Keep abstractions single-use unless reuse is already present.

## 4) Verification

Run the smallest meaningful checks first, then broader checks as needed:

1. Targeted tests/lint/typecheck for changed area.
2. Broader project checks only if the change touches shared behavior.

## 5) Large-run optimization guardrails (for scans, graph builds, bulk analysis)

When a workflow touches hundreds of files or background jobs, optimize for throughput and avoid avoidable reruns.

### 5.1 Fast-path execution order (required)

1. Inventory scope (`file count`, `type mix`, `top directories`).
2. Run a cheap first pass (AST-only or folder-scoped).
3. Validate artifact quality (graph/report opens, expected node/edge shape).
4. Only then propose expensive semantic/image enrichment.

### 5.2 Reliability rules

- Prefer short helper scripts over complex escaped one-liners for path-heavy logic.
- Normalize paths early (absolute vs relative, slash style) and verify before downstream steps.
- Record background task IDs/output locations immediately; poll with native task readers.
- Treat startup blockers as first-class checks (port bind failure, CLI auth missing, credentials missing).

### 5.3 Cost/time gate before fan-out (required)

Before dispatching large subagent waves, provide:

- rough runtime estimate,
- rough token/cost estimate,
- cheaper fallback option.

If the user opts into high-cost mode, confirm explicitly in one sentence before continuing.

### 5.4 Serving and deploy ladder

1. Local preview with the simplest static server first (`python -m http.server`).
2. If HTTPS/public sharing is requested, stage a minimal deploy directory.
3. Check deploy auth up front; if missing, stop with one exact user action.

## 6) Final response format

Always include:

1. Summary of changes.
2. Evidence (commands run + outcomes).
3. Risks/limitations.
4. Next best step suggestion.
