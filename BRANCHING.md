# Branching and Deployment Workflow

This project uses a simple two-stage workflow:

```text
feature branch -> PR to preview -> staging test -> PR preview to main -> production
```

## Branch Roles

- `main` is production. It should always represent production-ready code.
- `preview` is staging. It receives feature work first and deploys to the staging/preview environment.
- Feature branches start from `preview`.

## Daily Development

1. Update local branches:

   ```sh
   git fetch origin
   git checkout preview
   git pull origin preview
   ```

2. Create feature branches from `preview`:

   ```sh
   git checkout -b feature/my-change
   ```

3. Open pull requests into `preview`.
4. Test the deployed `preview` environment.
5. After approval, open a pull request from `preview` into `main`.
6. Merge to `main` only when the code is stable and production-ready.

## Rules

- Never push directly to `main`.
- Avoid pushing directly to `preview`.
- All real development starts from `preview`.
- Pull requests to `main` should normally come from `preview`.
- Production deployment should only happen from `main`.

## Required GitHub Protections

`main` should require:

- Pull request before merge.
- At least 1 approval.
- Required status checks.
- Branch up to date before merge.
- No force pushes.
- No deletion.

`preview` should require:

- Pull request before merge.
- Required status checks.
- No force pushes.
- No deletion.
- Faster merging than `main` is okay, but direct unsafe pushes should stay blocked.

These rules require repository admin access. In GitHub, open:

```text
Settings -> Branches -> Branch protection rules -> Add branch protection rule
```

Use `main` and `preview` as separate branch name patterns.

Set the required status check to:

```text
Lint + Typecheck + Test + Build
```

Recommended `main` settings:

- Require a pull request before merging.
- Require approvals: `1`.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Do not allow force pushes.
- Do not allow deletions.

Recommended `preview` settings:

- Require a pull request before merging.
- Require status checks to pass before merging.
- Do not allow force pushes.
- Do not allow deletions.
- Approval can be optional for speed, or set to `1` if the team wants stricter staging control.

Admin CLI option:

```sh
gh api --method PUT repos/OWNER/REPO/branches/main/protection --input main-protection.json
gh api --method PUT repos/OWNER/REPO/branches/preview/protection --input preview-protection.json
```

Example `main-protection.json`:

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint + Typecheck + Test + Build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false,
  "lock_branch": false,
  "allow_fork_syncing": true
}
```

Example `preview-protection.json`:

```json
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["Lint + Typecheck + Test + Build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false,
  "lock_branch": false,
  "allow_fork_syncing": true
}
```

## Vercel Settings

In Vercel Project Settings -> Git:

- Set Production Branch to `main`.
- Keep automatic deployments enabled.
- Allow `preview` to create Preview deployments for staging.
- Allow feature branches to create temporary Preview deployments when useful.

Environment variables should be separated by environment:

- Production values belong to Vercel Production.
- Staging/test values belong to Vercel Preview, with branch-specific overrides for `preview` if needed.

## GitHub Actions

- Pull requests into `preview` and `main` run CI.
- Pushes to `preview` and `main` run CI.
- `deployment-routing.yml` documents and verifies which branch is allowed to deploy to which environment.
- Actual deployment is handled by Vercel Git integration.
