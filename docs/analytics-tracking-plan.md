# Analytics Tracking Plan

This plan keeps product analytics changes intentional. `src/lib/analytics/events.ts`
is the source of truth for event names and TypeScript property shapes; update this
plan in the same PR when adding, removing, or materially changing an event.

## Ownership

| Funnel area | Owner | Event names | Expected properties | Funnel questions |
| --- | --- | --- | --- | --- |
| Acquisition | Growth | `page_viewed`, `landing_section_viewed`, `landing_cta_clicked`, `landing_poll_sampled`, `signup_gate_triggered`, `waitlist_submitted`, `demo_video_played` | Route/referrer/UTM fields, section or CTA identifiers, sampled poll identifiers, gate trigger, waitlist role/source, video watch percent. | Which channels bring qualified visitors? Which sections and CTAs move visitors toward signup or waitlist? Where does the landing sample experience hit the signup gate? |
| Authentication | Growth + Product | `signup_modal_opened`, `signup_started`, `signup_otp_sent`, `signup_otp_verified`, `signup_failed`, `signup_completed`, `login_started`, `login_completed`, `login_failed`, `session_expired`, `logout_clicked` | Auth method, OTP channel/attempts, failure reason and step, signup source, time to verify, time since first visit. | Where do users abandon signup? Which auth method or OTP channel has the highest completion rate? Are failures concentrated in a specific step? |
| Onboarding | Product | `onboarding_started`, `onboarding_step_viewed`, `onboarding_avatar_selected`, `onboarding_poll_answered`, `onboarding_community_selected`, `onboarding_step_completed`, `onboarding_completed` | Step name/index, avatar level and attempts, poll/option ids, community id/count, step duration, total duration, polls answered, communities selected. | Which onboarding step causes the most drop-off? Do avatar, poll, or community choices predict activation? How long does successful onboarding take? |
| Engagement | Product | `poll_answered`, `poll_skipped`, `poll_comment_posted`, `daily_spin_opened`, `daily_spin_claimed`, `challenge_viewed`, `challenge_progressed`, `challenge_completed`, `community_joined`, `community_left`, `community_message_sent`, `community_message_reported`, `community_requested`, `avatar_level_up`, `push_prompt_shown` | Poll/option/community ids, surface, skip reason, comment/message length, prize metadata, challenge progress, community source, level transition trigger, push provider. | Which loops retain users after onboarding? Which communities, challenges, and rewards drive repeat activity? Where do users request more supply or report quality issues? |
| Experiments | Product + Growth | `experiment_exposure` | Flag name and variant. | Which experiments change activation, signup, or engagement metrics without harming quality or safety? |
| Admin and safety | Trust & Safety | `admin_action_performed` | Moderation action plus optional target user/resource identifiers. | What moderation actions are most common? Are specific resources or user cohorts generating elevated safety work? |
| Reliability | Engineering | `error_boundary_triggered`, `api_error`, `web_vitals_reported`, `diagnostics_probe_fired` | Error message/route/stack, endpoint/status/latency, web vital metric/value, diagnostic source/mode. | Which routes or endpoints hurt conversion or retention through errors, latency, or poor page experience? |

## Required review before adding events

1. Define the dashboard or decision the event will support.
2. Prefer extending an existing event before adding a near-duplicate.
3. Keep properties stable, low-cardinality, and free of raw private content.
4. Add the event to `src/lib/analytics/events.ts` first, then instrument with
   `track()` from `@/lib/analytics`.
5. Verify the event in development with `?analytics_test=1` or a local flow
   before relying on the metric in PostHog.
