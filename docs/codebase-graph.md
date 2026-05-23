# Codebase dependency graph

Generated from `src` on 2026-05-23T08:49:57.252Z.

```mermaid
graph LR
  backend/supabase/controllers/authController.ts-->backend/supabase/client.ts
  backend/supabase/controllers/chatController.ts-->backend/supabase/client.ts
  backend/supabase/controllers/communityController.ts-->backend/supabase/client.ts
  backend/supabase/controllers/communityController.ts-->backend/supabase/controllers/chatController.ts
  backend/supabase/controllers/communityPollController.ts-->backend/supabase/client.ts
  backend/supabase/controllers/communityPollController.ts-->backend/supabase/models/community-poll.ts
  backend/supabase/controllers/communityRequestController.ts-->backend/supabase/client.ts
  backend/supabase/controllers/pollController.ts-->backend/supabase/client.ts
  backend/supabase/controllers/pollController.ts-->backend/supabase/models/poll.ts
  backend/supabase/controllers/userController.ts-->backend/supabase/client.ts
  backend/supabase/controllers/userController.ts-->backend/supabase/models/user.ts
  backend/supabase/controllers/waitlistController.ts-->backend/supabase/client.ts
  components/dashboard/DashboardHome.tsx-->components/dashboard/DashboardNav.tsx
  components/dashboard/DashboardSidebar.tsx-->components/dashboard/DashboardNav.tsx
  components/onboarding/CommentsModal.tsx-->components/onboarding/PollComments.tsx
  components/onboarding/OnboardingJourney.tsx-->components/onboarding/EnterRawModal.tsx
  components/onboarding/OnboardingJourney.tsx-->components/onboarding/SwipeablePollCard.tsx
  components/ui/highlightRawWordmark.tsx-->components/ui/brand-name.tsx
  features/insights/insights-engine.test.ts-->features/insights/insights-engine.ts
  features/insights/insights-engine.test.ts-->features/insights/types.ts
  features/insights/insights-engine.ts-->features/insights/insights.config.ts
  features/insights/insights-engine.ts-->features/insights/types.ts
  features/insights/insights.config.ts-->features/insights/types.ts
  lib/analytics/index.ts-->lib/analytics/client.ts
  lib/analytics/index.ts-->lib/analytics/events.ts
  lib/analytics/useTrackPageView.ts-->lib/analytics/index.ts
  lib/analytics/useTrackSectionView.ts-->lib/analytics/events.ts
  lib/analytics/useTrackSectionView.ts-->lib/analytics/index.ts
  lib/communityChat.seed.ts-->lib/communityChat.types.ts
  lib/communityChat.storage.ts-->lib/communityChat.types.ts
  lib/communityChat.storage.ts-->lib/communityChat.utils.ts
  lib/communityChat.ts-->lib/communityChat.seed.ts
  lib/communityChat.ts-->lib/communityChat.storage.ts
  lib/communityChat.ts-->lib/communityChat.types.ts
  lib/communityChat.ts-->lib/communityChat.utils.ts
  lib/communityChat.utils.ts-->lib/communityChat.types.ts
  store/useRawStore.polling.ts-->store/useRawStore.types.ts
  store/useRawStore.storage.ts-->store/useRawStore.types.ts
  utils/supabasePolls.ts-->utils/supabase.ts
```

> Regenerate with `node scripts/graphify.mjs .`.
> Export callflow HTML with `node scripts/graphify.mjs export callflow-html .`.