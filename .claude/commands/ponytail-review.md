---
description: Review the current diff for over-engineering and unnecessary complexity
---

Review the current diff (default to the staged + unstaged changes via `git diff HEAD`; if the user named files or a range, use those) for over-engineering ONLY. Hunt for reinvented standard library, unneeded dependencies, speculative abstractions, and dead flexibility.

One line per finding: `L<line>: <tag> <what>. <replacement>.`

Tags:
- `delete:` dead code, unused flexibility, speculative feature → replacement: nothing.
- `stdlib:` hand-rolled thing the standard library ships → name the function.
- `native:` dependency or code doing what the platform already does → name the feature.
- `yagni:` abstraction with one implementation, config nobody sets, layer with one caller.
- `shrink:` same logic, fewer lines → show the shorter form.

Example: `L4: native: moment.js imported for one format call. Intl.DateTimeFormat, 0 deps.`

Out of scope (route to a normal review): correctness bugs, security holes, performance. A single smoke test or assert-based self-check is necessary, not bloat — never flag it.

End with `net: -<N> lines possible.` Nothing to cut: `Lean already. Ship.` List findings only — apply nothing unless the user asks.
