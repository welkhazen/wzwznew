# Graph Report

Generated: 2026-05-26T06:55:10.722Z
Nodes: 41
Edges: 39

## Top connected nodes

- backend/supabase/client.ts — degree 8 (other)
- lib/analytics/index.ts — degree 4 (other)
- lib/communityChat.types.ts — degree 4 (other)
- lib/communityChat.ts — degree 4 (other)
- features/insights/insights-engine.ts — degree 3 (other)
- features/insights/types.ts — degree 3 (other)
- lib/communityChat.storage.ts — degree 3 (other)
- lib/communityChat.utils.ts — degree 3 (other)
- backend/supabase/controllers/chatController.ts — degree 2 (other)
- backend/supabase/controllers/communityController.ts — degree 2 (other)

## Scoring notes

- `core-utility`, `analytics-core`, and `theme-core` are intentional primitives and should be deprioritized in risk triage.
- Focus architecture follow-up on high-degree `source` nodes with unexpected cross-feature imports.