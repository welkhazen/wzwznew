# LLM Memory Pack (Cross-Model Handoff)

Use this folder to export the highest-signal project memory from Codex/ChatGPT and import it into another LLM.

## What to fill

- `00_identity.md`: Working preferences and constraints.
- `01_projects.md`: Project status snapshots.
- `02_decisions.md`: Important decisions and tradeoffs.
- `03_open_loops.md`: Unfinished items and blockers.
- `04_timeline.md`: Date-based milestones.
- `05_glossary.md`: Terms and abbreviations.
- `BOOTSTRAP_PROMPT.md`: Copy/paste prompt for the destination LLM.

## Suggested flow (better than raw transcript dump)

1. Export source data from your current tool.
2. Summarize into these files (high signal, low noise).
3. Paste `BOOTSTRAP_PROMPT.md` into the destination LLM plus the six files.
4. Keep these files updated after each major session.

## Why this is better

A single giant transcript usually exceeds context windows and contains noise. This format gives predictable structure and better retrieval in any model.
