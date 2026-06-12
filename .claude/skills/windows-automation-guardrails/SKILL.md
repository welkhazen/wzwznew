---
name: windows-automation-guardrails
description: Stabilize Codex work on Windows PowerShell when automation, maintenance, or repo-inspection tasks keep failing on shell assumptions instead of task logic. Use when `CODEX_HOME` is unset, `rg.exe` is blocked or missing, Git reports dubious ownership or cannot write global config, or when JSONL session scanning needs reliable PowerShell-native fallbacks.
---

# Windows Automation Guardrails

## Overview

Normalize the Windows shell first so recurring automation work does not waste time on the same environment failures. Prefer local, per-command fixes over machine-wide configuration changes.

## Fast Start

Resolve Codex paths once at the top of the run:

```powershell
$CodexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME '.codex' }
$SessionsDir = Join-Path $CodexHome 'sessions'
$SkillsDir = Join-Path $CodexHome 'skills'
$AutomationsDir = Join-Path $CodexHome 'automations'
```

Reuse those variables instead of assuming `$env:CODEX_HOME` exists inside each shell call.

## Workflow

### 1. Classify the failure before changing anything

Treat these as environment issues unless evidence says otherwise:

- `CODEX_HOME` is null or empty
- `rg.exe` returns `Access is denied` or is unavailable
- Git reports `detected dubious ownership`
- `git config --global` fails with permission errors on the user profile
- Session-log parsing becomes noisy because JSONL files embed large instruction payloads

Do not interpret those failures as proof that a repo, skill, or feature is broken.

### 2. Use PowerShell-native fallbacks when search tooling is unreliable

For file discovery:

```powershell
Get-ChildItem $SessionsDir -Recurse -File
```

For text search:

```powershell
Get-Content $path | Select-String -Pattern 'failed|error|skill' -CaseSensitive:$false
```

For structured session inspection, prefer JSONL parsing over raw grep-style matching:

```powershell
Get-Content $path | ForEach-Object {
  try { $_ | ConvertFrom-Json } catch {}
}
```

When the file contains full system or developer instructions, filter by structured fields like `type`, `payload.type`, `payload.role`, `payload.name`, or `payload.message` before searching text.

### 3. Keep Git fixes local to the current command

If Git needs a safe directory and global config is blocked, avoid `git config --global`. Use per-command overrides:

```powershell
git -c safe.directory="$PWD" status
git -c safe.directory="C:/Users/willi/.codex/worktrees/86e7/raw-war-main" log -1 --oneline
```

Use the explicit worktree path when the command may run outside the repo root.

### 4. Keep automation memory and skill paths deterministic

When an automation mentions `$CODEX_HOME/...`, expand it manually with the resolved fallback path:

```powershell
$MemoryPath = Join-Path $CodexHome 'automations/update-skills/memory.md'
```

Read that file first if it exists. Append concise run outcomes so later runs can distinguish repeated environment friction from new task-specific issues.

### 5. Record the right conclusion

If the run only hit Windows shell friction, report it as environment friction and do not invent skill edits. Create or update a personal skill only when the same workaround pattern repeats across runs and clearly belongs in reusable instructions.

## Repeated Patterns Seen So Far

- `$env:CODEX_HOME` may be unset in shell commands even when Codex itself knows the home directory.
- `rg.exe` can be unusable under Windows despite being the preferred search tool.
- Global Git config changes may be blocked, so per-command `safe.directory` is safer than persistent configuration.
- Session logs are easier to analyze with `ConvertFrom-Json` than with plain text search because instruction payloads create false positives.

## Output Expectations

When this skill is used:

- state the environment issue plainly
- switch to the fallback immediately
- avoid broad machine reconfiguration unless the user explicitly asks
- keep fixes scoped to the current run or repository
