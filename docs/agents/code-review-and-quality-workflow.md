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

## 5) Final response format

Always include:

1. Summary of changes.
2. Evidence (commands run + outcomes).
3. Risks/limitations.
4. Next best step suggestion.
