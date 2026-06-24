---
description: Whole-repo audit for over-engineering — ranked list of what to cut
---

ponytail-review, repo-wide. Scan the whole tree instead of a diff. Rank findings biggest cut first.

Tags (same as ponytail-review):
- `delete:` dead code, unused flexibility, speculative feature → replacement: nothing.
- `stdlib:` hand-rolled thing the standard library ships → name the function.
- `native:` dependency or code doing what the platform already does → name the feature.
- `yagni:` abstraction with one implementation, config nobody sets, layer with one caller.
- `shrink:` same logic, fewer lines → show the shorter form.

Hunt for: deps the stdlib or platform already ships, single-implementation interfaces, factories with one product, wrappers that only delegate, files exporting one thing, dead flags and config, hand-rolled stdlib.

One line per finding, ranked: `<tag> <what to cut>. <replacement>. [path]`. End with `net: -<N> lines, -<M> deps possible.` Nothing to cut: `Lean already. Ship.`

Scope: over-engineering and complexity only. Correctness bugs, security holes, and performance are out of scope — route them to a normal review. One-shot report: lists findings, applies nothing.
