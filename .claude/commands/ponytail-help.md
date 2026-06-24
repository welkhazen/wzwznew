---
description: Quick-reference card for ponytail modes and commands
---

Display this reference card. One-shot — do NOT change mode or persist anything.

## Levels

| Level | Trigger | What change |
|-------|---------|-------------|
| **Lite** | `/ponytail lite` | Build what's asked, name the lazier alternative in one line. |
| **Full** | `/ponytail` | The ladder enforced: YAGNI → stdlib → native → one line → minimum. Default. |
| **Ultra** | `/ponytail ultra` | YAGNI extremist. Deletion before addition. Challenges requirements before building. |

Level sticks until changed or session end. Activated automatically every session by the `.claude/hooks/ponytail-activate.sh` SessionStart hook.

## Commands

| Command | What it does |
|---------|--------------|
| `/ponytail [lite\|full\|ultra\|off]` | Switch lazy-mode intensity. |
| `/ponytail-review` | Over-engineering review of the current diff: `L42: yagni: factory, one product. Inline.` |
| `/ponytail-audit` | Whole-repo over-engineering audit, ranked biggest cut first. |
| `/ponytail-debt` | Collect `ponytail:` shortcut markers into a debt ledger. |
| `/ponytail-gain` | Measured-impact scoreboard: less code, less cost, more speed. |
| `/ponytail-help` | This card. |

## Deactivate

Say "stop ponytail" or "normal mode". Resume anytime with `/ponytail`.

Full docs + examples: https://github.com/DietrichGebert/ponytail
