---
description: Show ponytail's measured-impact scoreboard (benchmark medians)
---

Display this scoreboard. One-shot: do NOT change mode, write flag files, or persist anything.

The figures are the published benchmark medians (5 everyday tasks: email validator, debounce, CSV sum, countdown timer, rate limiter; three models: Haiku, Sonnet, Opus). They are measured, not computed from this repo.

```
  ponytail gain                     benchmark median · 5 tasks · 3 models

  Lines of code   no-skill  ████████████████████  100%
                  ponytail  ██▌·················    6–20%   ▼ 80–94%
  Cost            no-skill  ████████████████████  100%
                  ponytail  █████▌··············   23–53%  ▼ 47–77%
  Speed           ponytail  ▸ 3–6× faster

  This repo:  /ponytail-debt  (shortcuts you deferred)
              /ponytail-audit (what's still cuttable)
```

Honesty boundary: these are benchmark medians, not this repo. NEVER print a per-repo savings number — the unbuilt version was never written, so there's no real baseline to subtract from. The only real per-repo figures come from `/ponytail-debt`.
