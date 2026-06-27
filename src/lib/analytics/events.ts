/**
 * Event taxonomy. Every analytics event the app may emit is declared here as a
 * discriminated union. `track(name, props)` enforces the matching property
 * shape at compile time.
 */

// ---------------- shared property types ----------------

export type Surface = "landing" | "app" | "admin";
export type DeviceClass = "mobile" | "tablet" | "desktop";
export type AuthMethod = "username_password" | "oauth_google";
export type OtpChannel = "sms" | "whatsapp" | "email";
export type OnboardingStepName =
  | "avatar"
  | "polls"
  | "profile"
  | "communities"
  | "ready"
  | "spin"
  | "username"
  | "voucher";
export type WaitlistRole = "owner" | "provider" | "user";
export type ModerationAction =
  | "warn"
  | "ban"
  | "unban"
  | "promote"
  | "demote"
  | "delete_content"
  | "approve_community"
  | "reject_community"
  | "dismiss_report";

// ---------------- event union ----------------

export type AppEvent =
  // landing / acquisition
  | {
      name: "page_viewed";
      properties: {
        path: string;
        referrer?: string;
        utm_source?: string;
        utm_medium?: string;
        utm_campaign?: string;
        utm_term?: string;
        utm_content?: string;
      };
    }
  | {
      name: "landing_section_viewed";
      properties: {
        section_id:
          | "hero"
          | "polls"
          | "how_it_works"
          | "communities"
          | "avatar"
          | "why_anonymity"
          | "faq"
          | "security"
          | "problem"
          | "personality_insights"
          | "final_cta";
      };
    }
  | {
      name: "landing_cta_clicked";
      properties: {
        cta_id: string;
        cta_text: string;
        source_section: string;
      };
    }
  | {
      name: "landing_poll_sampled";
      properties: {
        poll_id: string;
        option_id: string;
        answer?: "yes" | "no";
        votes_used: number;
        gate_reached: boolean;
      };
    }
  | {
      name: "signup_gate_triggered";
      properties: {
        trigger: "poll_gate" | "scroll_gate";
        votes_used: number;
      };
    }
  | {
      name: "waitlist_submitted";
      properties: {
        role: WaitlistRole;
        source: string;
      };
    }
  | {
      name: "demo_video_played";
      properties: {
        video_id: string;
        watched_pct: number;
      };
    }
  | {
      name: "anon_question_submitted";
      properties: {
        source: string;
      };
    }

  // auth
  | {
      name: "signup_modal_opened";
      properties: {
        source: string;
      };
    }
  | {
      name: "signup_started";
      properties: {
        method: AuthMethod;
      };
    }
  | {
      name: "signup_otp_sent";
      properties: {
        channel: OtpChannel;
        attempt: number;
      };
    }
  | {
      name: "signup_otp_verified";
      properties: {
        attempts_used: number;
        time_to_verify_ms: number;
      };
    }
  | {
      name: "signup_failed";
      properties: {
        reason: string;
        step: "details" | "otp" | "verify";
      };
    }
  | {
      name: "signup_completed";
      properties: {
        time_since_first_visit_ms?: number;
        source: string;
      };
    }
  | {
      name: "login_started";
      properties: {
        method: AuthMethod;
      };
    }
  | {
      name: "login_completed";
      properties: {
        method: AuthMethod;
      };
    }
  | {
      name: "login_failed";
      properties: {
        method: AuthMethod;
        reason: string;
      };
    }
  | {
      name: "session_expired";
      properties: Record<string, never>;
    }
  | {
      name: "logout_clicked";
      properties: Record<string, never>;
    }

  // onboarding
  | {
      name: "onboarding_started";
      properties: Record<string, never>;
    }
  | {
      name: "onboarding_step_viewed";
      properties: {
        step: OnboardingStepName;
        step_index: number;
      };
    }
  | {
      name: "onboarding_avatar_selected";
      properties: {
        avatar_level: number;
        attempts: number;
      };
    }
  | {
      name: "onboarding_poll_answered";
      properties: {
        poll_id: string;
        option_id: string;
        step_index: number;
      };
    }
  | {
      name: "onboarding_community_selected";
      properties: {
        community_id: string;
        selected_count: number;
      };
    }
  | {
      name: "onboarding_step_completed";
      properties: {
        step: OnboardingStepName;
        step_index?: number;
        duration_ms: number;
      };
    }
  | {
      name: "onboarding_completed";
      properties: {
        total_duration_ms: number;
        polls_answered: number;
        communities_selected: number;
        source?: string;
      };
    }

  // engagement
  | {
      name: "poll_answered";
      properties: {
        poll_id: string;
        option_id: string;
        surface: Surface;
        community_id?: string;
      };
    }
  | {
      name: "poll_skipped";
      properties: {
        poll_id: string;
        reason: string;
      };
    }
  | {
      name: "poll_comment_posted";
      properties: {
        poll_id: string;
        length: number;
      };
    }
  | {
      name: "daily_spin_opened";
      properties: Record<string, never>;
    }
  | {
      name: "daily_spin_claimed";
      properties: {
        prize_id: string;
        prize_type: string;
        rarity: string;
      };
    }
  | {
      name: "challenge_viewed";
      properties: {
        challenge_id: string;
        progress_pct: number;
      };
    }
  | {
      name: "challenge_progressed";
      properties: {
        challenge_id: string;
        progress_pct: number;
      };
    }
  | {
      name: "challenge_completed";
      properties: {
        challenge_id: string;
        progress_pct: number;
      };
    }
  | {
      name: "community_joined";
      properties: {
        community_id: string;
        source: string;
      };
    }
  | {
      name: "community_left";
      properties: {
        community_id: string;
      };
    }
  | {
      name: "community_message_sent";
      properties: {
        community_id: string;
        length: number;
      };
    }
  | {
      name: "community_message_reported";
      properties: {
        community_id: string;
        message_id: string;
        reason: string;
      };
    }
  | {
      name: "community_requested";
      properties: {
        focus_area: string;
        audience: string;
      };
    }
  | {
      name: "avatar_level_up";
      properties: {
        from_level: number;
        to_level: number;
        trigger: string;
      };
    }
  | {
      name: "experiment_exposure";
      properties: {
        flag: "exp_hero_copy" | "exp_signup_cta" | "exp_gate_position";
        variant: string;
      };
    }
  | {
      name: "push_prompt_shown";
      properties: {
        provider: "apple-native" | "browser" | "onesignal";
      };
    }

  // admin / moderation
  | {
      name: "admin_action_performed";
      properties: {
        action: ModerationAction;
        target_user_id?: string;
        resource_id?: string;
      };
    }

  // system
  | {
      name: "error_boundary_triggered";
      properties: {
        message: string;
        stack?: string;
        route: string;
      };
    }
  | {
      name: "api_error";
      properties: {
        endpoint: string;
        status: number;
        latency_ms: number;
      };
    }
  | {
      name: "web_vitals_reported";
      properties: {
        metric: "CLS" | "LCP" | "INP" | "FCP" | "TTFB";
        value: number;
      };
    }
  | {
      name: "diagnostics_probe_fired";
      properties: {
        source: "hidden_button" | "query_param";
        mode: string;
      };
    };

// ---------------- helpers ----------------

export type EventName = AppEvent["name"];

export type EventPropsFor<E extends EventName> = Extract<
  AppEvent,
  { name: E }
>["properties"];
