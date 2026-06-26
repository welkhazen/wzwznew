# Autofix review system

A two-layer system that, **after every commit on a pull request**, detects
likely-new bugs and efficiency opportunities, reports them as **one
simplified, CEO-readable checklist**, and applies **only the fixes you
approve**. Nothing in your code changes without explicit sign-off.

## How it works

```text
commit pushed to a PR
        │
        ▼
┌───────────────────────────────────────────────┐
│ autofix-review.yml  (runs on every PR commit)  │
│                                                │
│ 1. Deterministic layer  (free, always runs)    │
│    scripts/detect-new-issues.mjs               │
│    → TypeScript errors, ESLint errors/warnings │
│      and high/critical npm advisories in the   │
│      files this change touched                 │
│                                                │
│ 2. Claude layer  (needs ANTHROPIC_API_KEY)     │
│    → reads the diff + the deterministic report │
│    → posts ONE PR comment:                     │
│        • CEO summary (plain English)           │
│        • Ranked checklist of proposed fixes    │
│        • Efficiency propositions (API / MCP)   │
│    → makes NO code changes                      │
└───────────────────────────────────────────────┘
        │
        │  you review the checklist and reply:
        │     /autofix apply 1 3
        ▼
┌───────────────────────────────────────────────┐
│ autofix-apply.yml  (runs on your command)      │
│  • authorized approvers only                   │
│  • applies ONLY the approved items             │
│  • runs lint + typecheck, commits, pushes      │
│  • replies with what changed / what it skipped │
└───────────────────────────────────────────────┘
```

## One-time setup

1. **Add the API key.** Repo → **Settings → Secrets and variables → Actions →
   New repository secret**:
   - Name: `ANTHROPIC_API_KEY`
   - Value: a key from the Anthropic Console.

   Until this is set, the review still runs and posts the **deterministic
   report**; the plain-language summary and efficiency propositions are skipped.

2. **(Optional) Set who may apply fixes.** Repo → **Settings → Secrets and
   variables → Actions → Variables → New variable**:
   - Name: `AUTOFIX_APPROVERS`
   - Value: a JSON array of GitHub logins, e.g. `["welkhazen","your-cto-login"]`

   If unset, only the repo owner (`welkhazen`) can trigger `/autofix apply`.

## Using it

- **Review:** open any PR. Within a couple of minutes a comment appears with a
  CEO summary, a ranked checklist, and efficiency ideas. Each checklist item is
  numbered and tagged with severity, whether it's newly introduced or
  pre-existing, and a confidence level.
- **Approve fixes:** reply to the PR with the numbers you want, e.g.
  ```text
  /autofix apply 1 3
  ```
  The apply job changes only those items, verifies them, and pushes a commit
  back to the PR with a summary. Anything it can't do safely is skipped and
  explained — never guessed.
- **Approve nothing:** just merge, or ask follow-up questions on the PR.

## Why it's built this way (the decisions)

| Decision | Choice |
| --- | --- |
| When it runs | GitHub Actions on every PR commit (centralized, visible to CEO + CTO) |
| Detection | Deterministic tools **and** Claude AI review (best coverage) |
| Reporting | One PR comment with a checklist |
| Fixes | Confirm everything first — no automatic code changes |

## Tailored output

- **For the CEO:** the top "CEO summary" and the per-item plain-language titles
  describe risk and impact in business terms (is it safe to merge, what slows
  the app or costs API spend) — no jargon required.
- **For the CTO:** each item carries `file:line`, the rule/error code, and the
  concrete technical change, so engineering can act without re-investigating.

## Tuning

- **Severity / noise:** edit the prompt in `.github/workflows/autofix-review.yml`
  (e.g. "only list Medium and above").
- **What the deterministic layer scans:** edit `scripts/detect-new-issues.mjs`
  (TS projects scanned, audit threshold, file types).
- **Efficiency focus:** the "Efficiency propositions" section of the review
  prompt is where API-call and MCP/Supabase connection guidance is defined.

## Safety model

- The review job is **read-only** (`--disallowedTools Edit,Write,...`).
- The apply job runs **only** on an explicit `/autofix apply` command from an
  authorized approver, and is scoped to the approved items.
- Both use the repo-scoped `GITHUB_TOKEN`; no extra permissions are granted.
