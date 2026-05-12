# Finishing a Development Branch

Use this sequence before opening a pull request to keep merge flow predictable and low-risk.

## 1) Pre-flight
- Rebase onto latest base branch (`main` or release branch).
- Ensure `git status` is clean before running checks.
- Remove accidental debug logs and temporary files.

## 2) Local quality gates
- Run `npm run lint:ci`.
- Run `npm test`.
- Run `npm run build`.

If any check fails, fix before committing.

## 3) Commit hygiene
- Prefer small, scoped commits over one large dump.
- Use imperative commit messages (e.g., `Add poll voting edge-case guard`).
- Include docs/config updates in the same commit when behavior changes.

## 4) Pull request prep
- Summarize what changed and why.
- List verification commands and outcomes.
- Call out risk areas and rollback approach.
- Link follow-up issues for deferred work.

## 5) Suggested smoother alternative
Instead of waiting until the end, run `npm run lint:ci` and targeted tests during implementation milestones. This catches regressions earlier and keeps final branch-finishing mostly administrative.
