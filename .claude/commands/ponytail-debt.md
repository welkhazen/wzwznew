---
description: Collect ponytail: shortcut markers into a debt ledger
---

Harvest every deliberate shortcut marked with a `ponytail:` comment and compile a debt ledger. One-shot scan — modify no code.

Search for the marker (e.g. `rg -n "(#|//) ?ponytail:"`), excluding `node_modules`, `.git`, and build dirs. Each match is one tracked shortcut.

One line per marker: `<file>:<line>, <what was simplified>. ceiling: <the limit named>. upgrade: <the trigger to revisit>.`

Pull the ceiling and upgrade trigger straight from the comment text. Flag any entry with no upgrade path as `no-trigger` — those are the highest rot risk.

End with `<N> markers, <M> with no trigger.` No markers: `No ponytail: debt. Clean ledger.`

Read-only by default. Only write the ledger to a file (e.g. `PONYTAIL-DEBT.md`) if the user asks.
