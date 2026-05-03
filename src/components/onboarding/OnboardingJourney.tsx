import { useEffect, useMemo, useRef, useState } from "react";
import isItJustMeVideo from "@/assets/itisjustme.webm";
import speakYourTruthVideo from "@/assets/speakyourheart.webm";
import lntVideo from "@/assets/2026-04-18 10_10_00.webm";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { AVATARS } from "@/lib/avataridentity";
import { AvatarPhoneHomeScreen } from "@/components/ui/avatar-phone-home-screen";
import { PhoneMockup } from "@/components/ui/phone-mockup";

import { SwipeablePollCard } from "./SwipeablePollCard";
import type { OnboardingStep, Poll, User } from "@/store/useRawStore";
import type { Comment } from "./PollComments";
import { track } from "@/lib/analytics";

type OnboardingPoll = {
  id: string;
  question: string;
  options: string[];
};

interface OnboardingJourneyProps {
  user: User;
  polls: Poll[];
  avatarIndex: number;
  onAvatarChange: (index: number) => void;
  onboardingStep: OnboardingStep;
  onboardingAnsweredPollIds: Set<string>;
  onSetOnboardingStep: (step: OnboardingStep) => void;
  onMarkPollAnswered: (pollId: string) => void;
  selectedCommunityIds: string[];
  onToggleCommunity: (communityId: string) => void;
  onCompleteOnboarding: () => void;
  onLogout: () => void;
}

const STEP_ORDER: OnboardingStep[] = ["avatar", "polls", "communities"];
const STEP_LABELS: Record<OnboardingStep, string> = {
  avatar: "avatar",
  polls: "polls",
  communities: "communities",
  marketplace: "insights",
  ready: "ready",
};

const FALLBACK_POLLS: OnboardingPoll[] = [
  {
    id: "core-safety",
    question: "Should all high-impact content claims require visible evidence labels?",
    options: ["Always", "Only on flagged topics"],
  },
  {
    id: "core-moderation",
    question: "What should happen first when harmful content is reported?",
    options: ["Temporary freeze", "Community review"],
  },
  {
    id: "core-identity",
    question: "How should trust be built in anonymous spaces?",
    options: ["Reputation over time", "Verified circles"],
  },
];

const EXTRA_ONBOARDING_POLLS: OnboardingPoll[] = [
  {
    id: "launch-feedback-loop",
    question: "How often should raW ask members for product feedback during launch?",
    options: ["Every week", "Every 2 weeks"],
  },
  {
    id: "launch-community-priority",
    question: "What matters most in your first community?",
    options: ["Serious debate", "Constructive support"],
  },
];

const ONBOARDING_COMMUNITIES = [
  {
    id: "lnt",
    title: "Late Night Talk",
    description: "Honest conversation when the world gets quiet and people finally say what they actually mean.",
    members: "3",
    activeNow: "1 active",
    video: lntVideo,
    image: undefined,
  },
  {
    id: "syt",
    title: "Speak Your Truth",
    description: "A space to say what you've been holding back. No filters, no judgment — just real voices sharing real experiences.",
    members: "3",
    activeNow: "1 active",
    video: speakYourTruthVideo,
    image: undefined,
  },
  {
    id: "iijm",
    title: "Is It Just Me?",
    description: "Relatable moments, shared observations, and the quiet comfort of realizing you're not the only one.",
    members: "3",
    activeNow: "1 active",
    video: isItJustMeVideo,
    image: undefined,
  },
  {
    id: "li",
    title: "Lebanon Initiatives",
    description: "A space for Lebanese change-makers, community builders, and people driving impact inside Lebanon and across the diaspora.",
    members: "0",
    activeNow: "Early Access",
    image: "https://images.unsplash.com/photo-1549895885-2e9af1a79571?auto=format&fit=crop&w=900&q=80",
  },
];

function toOnboardingPolls(polls: Poll[]): OnboardingPoll[] {
  const core = polls.slice(0, 3).map((poll) => ({
    id: poll.id,
    question: poll.question,
    options: poll.options.slice(0, 2).map((option) => option.text),
  }));

  const neededFallback = Math.max(0, 3 - core.length);
  const fallback = FALLBACK_POLLS.slice(0, neededFallback).map((poll) => ({
    ...poll,
    options: poll.options.slice(0, 2),
  }));

  const extra = EXTRA_ONBOARDING_POLLS.map((poll) => ({
    ...poll,
    options: poll.options.slice(0, 2),
  }));

  return [...core, ...fallback, ...extra];
}

function getNextStep(step: OnboardingStep): OnboardingStep {
  const currentIndex = STEP_ORDER.indexOf(step);
  if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
    return "ready";
  }

  return STEP_ORDER[currentIndex + 1];
}

function StepPill({ label, active, complete }: { label: string; active: boolean; complete: boolean }) {
  return (
    <div
      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] transition-all ${
        active
          ? "border-raw-gold/60 bg-raw-gold/15 text-raw-gold"
          : complete
            ? "border-raw-gold/30 bg-raw-gold/5 text-raw-gold/70"
            : "border-raw-border/40 bg-raw-surface/20 text-raw-silver/35"
      }`}
    >
      {label}
    </div>
  );
}

export function OnboardingJourney({
  user,
  polls,
  avatarIndex,
  onAvatarChange,
  onboardingStep,
  onboardingAnsweredPollIds,
  onSetOnboardingStep,
  onMarkPollAnswered,
  selectedCommunityIds,
  onToggleCommunity,
  onCompleteOnboarding,
  onLogout,
}: OnboardingJourneyProps) {
  const onboardingPolls = useMemo(() => toOnboardingPolls(polls), [polls]);
  const [pollSelections, setPollSelections] = useState<Record<string, string>>({});
  const [pollComments, setPollComments] = useState<Record<string, Comment[]>>({});
  const [pollStats, setPollStats] = useState<Record<string, Record<string, number>>>({});
  const [currentPollIndex, setCurrentPollIndex] = useState(0);
  const answeredCount = onboardingPolls.filter((poll) => onboardingAnsweredPollIds.has(poll.id)).length;
  const startedFiredRef = useRef(false);
  const stepStartTimeRef = useRef(Date.now());
  const currentPoll = onboardingPolls[currentPollIndex];
  const currentPollSelected = currentPoll ? pollSelections[currentPoll.id] : undefined;
  const currentPollAnswered = currentPoll ? onboardingAnsweredPollIds.has(currentPoll.id) : false;
  const currentPollStats = currentPoll ? (pollStats[currentPoll.id] || {}) : {};

  useEffect(() => {
    if (!startedFiredRef.current) {
      startedFiredRef.current = true;
      track("onboarding_started", {});
    }
    // Always reset swipe guide so it shows on every fresh onboarding session
    localStorage.removeItem("raw.onboarding.swipe-guide-seen");
  }, []);

  useEffect(() => {
    const stepIndex = STEP_ORDER.indexOf(onboardingStep);
    track("onboarding_step_viewed", { step: onboardingStep as "avatar" | "polls" | "communities" | "ready", step_index: stepIndex });
    stepStartTimeRef.current = Date.now();
  }, [onboardingStep]);

  const canContinueFromAvatar = avatarIndex >= 1;
  const canContinueFromPolls = answeredCount >= onboardingPolls.length;
  const canContinueFromCommunities = selectedCommunityIds.length === 2;

  // Initialize poll stats with mock data
  useMemo(() => {
    const stats: Record<string, Record<string, number>> = {};
    onboardingPolls.forEach((poll) => {
      stats[poll.id] = {};
      poll.options.forEach((option) => {
        stats[poll.id][option] = Math.floor(Math.random() * 1000) + 50;
      });
    });
    setPollStats(stats);
  }, [onboardingPolls]);

  const goToNextStep = () => {
    track("onboarding_step_completed", {
      step: onboardingStep as "avatar" | "polls" | "communities" | "ready",
      duration_ms: Date.now() - stepStartTimeRef.current,
    });
    onSetOnboardingStep(getNextStep(onboardingStep));
  };

  const currentStepIndex = STEP_ORDER.indexOf(onboardingStep);
  return (
    <div className="min-h-screen overflow-x-hidden bg-raw-black">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-8 md:py-10">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-xs uppercase tracking-[0.35em] text-raw-gold/60">Welcome to raW</p>
            <button
              onClick={onLogout}
              className="shrink-0 rounded-xl border border-raw-border/50 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-raw-silver/55 transition-colors hover:border-raw-border hover:text-raw-silver"
            >
              Log out
            </button>
          </div>
          <h1 className="mt-3 font-display text-2xl tracking-wide text-raw-text sm:text-3xl">
            Complete your identity path, {user.username}
          </h1>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {STEP_ORDER.map((step, index) => (
            <StepPill
              key={step}
              label={STEP_LABELS[step]}
              active={step === onboardingStep}
              complete={index < currentStepIndex}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-raw-border/40 bg-gradient-to-b from-raw-surface/40 to-raw-black/90 p-4 sm:rounded-3xl sm:p-6 md:p-8">
          {onboardingStep === "avatar" && (
            <section>
              <h2 className="font-display text-lg tracking-wide text-raw-text sm:text-xl">1. Choose your avatar</h2>
              <p className="mt-2 text-xs text-raw-silver/45 sm:text-sm">
                Your avatar is your public signal. You can evolve it later, but choose your starting form now.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 md:items-center">
                {/* Left: Avatar Selector Grid */}
                <div className="flex flex-col items-center justify-center min-w-0">
                  <div className="grid w-fit grid-cols-5 gap-2 sm:gap-4">
                    {AVATARS.map((avatar, i) => {
                      const index = i + 1;
                      const isActive = index === avatarIndex;
                      return (
                        <button
                          key={index}
                          onClick={() => { track("onboarding_avatar_selected", { avatar_level: index, attempts: 1 }); onAvatarChange(index); }}
                          className="group relative flex flex-col items-center gap-1 p-1 sm:gap-2 sm:p-2 focus:outline-none"
                          aria-label={`Select ${avatar.name}`}
                          aria-pressed={isActive}
                        >
                          {isActive && (
                            <div
                              className="absolute -inset-1 rounded-full opacity-50 blur-md pointer-events-none"
                              style={{ background: avatar.ring }}
                            />
                          )}
                          <div className={`relative rounded-full transition-all duration-300 ${
                            isActive ? "scale-115" : "opacity-80 group-hover:opacity-100 group-hover:scale-105"
                          }`}>
                            <AvatarFigure avatarIndex={index} size="sm" selected={isActive} className="sm:hidden" />
                            <AvatarFigure avatarIndex={index} size="md" selected={isActive} className="hidden sm:block" />
                          </div>
                          <span className={`font-display text-[8px] tracking-[0.1em] text-center leading-tight transition-colors ${
                            isActive ? "text-raw-text" : "text-raw-silver/45 group-hover:text-raw-silver/80"
                          }`}>
                            {avatar.name.split(" ")[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Phone preview */}
                <div className="hidden md:flex flex-col items-center justify-center">
                  <PhoneMockup className="w-full max-w-[260px]" showStatusBar={false}>
                    <AvatarPhoneHomeScreen avatarIndex={avatarIndex} />
                  </PhoneMockup>
                </div>
              </div>

              <div className="mt-6 flex justify-end sm:mt-8">
                <button
                  onClick={goToNextStep}
                  disabled={!canContinueFromAvatar}
                  className="w-full rounded-xl bg-raw-gold px-5 py-3 text-sm font-semibold text-raw-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-2.5"
                >
                  Next: Polls
                </button>
              </div>
            </section>
          )}

          {onboardingStep === "polls" && (
            <section>
              <div className="flex flex-wrap items-start justify-between gap-3 sm:items-end sm:gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg tracking-wide text-raw-text sm:text-xl">2. Answer 5 launch polls</h2>
                </div>
                <p className="shrink-0 rounded-full border border-raw-border/40 px-3 py-1 text-xs text-raw-gold/75">
                  {answeredCount}/{onboardingPolls.length} completed
                </p>
              </div>

              {/* Single Poll Card */}
              <div className="mt-4 sm:mt-6 flex flex-col items-center justify-center min-h-[55vh]">
                {onboardingPolls.length > 0 && currentPoll && (
                  <div className="w-full">
                    <div className="mx-auto mb-3 flex w-full max-w-md items-center justify-between sm:max-w-xl lg:max-w-2xl">
                      <button
                        onClick={() => setCurrentPollIndex(Math.max(0, currentPollIndex - 1))}
                        disabled={currentPollIndex === 0}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-raw-border/35 bg-raw-black/45 text-lg text-raw-silver/70 transition-all hover:border-raw-gold/35 hover:text-raw-gold/75 disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label="Previous poll"
                      >
                        ←
                      </button>
                      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-raw-silver/35">
                        {currentPollIndex + 1} / {onboardingPolls.length}
                      </span>
                      <button
                        onClick={() => {
                          if (currentPollIndex < onboardingPolls.length - 1) {
                            setCurrentPollIndex(Math.min(onboardingPolls.length - 1, currentPollIndex + 1));
                            return;
                          }
                          goToNextStep();
                        }}
                        disabled={currentPollIndex === onboardingPolls.length - 1 && !canContinueFromPolls}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-lg transition-all disabled:cursor-not-allowed disabled:opacity-35 ${
                          currentPollIndex < onboardingPolls.length - 1
                            ? "border-raw-border/35 bg-raw-black/45 text-raw-silver/70 hover:border-raw-gold/35 hover:text-raw-gold/75"
                            : "border-raw-gold/40 bg-raw-gold/15 text-raw-gold hover:bg-raw-gold/25"
                        }`}
                        aria-label={currentPollIndex < onboardingPolls.length - 1 ? "Next poll" : "Complete polls"}
                      >
                        →
                      </button>
                    </div>

                    <div className="mx-auto w-full max-w-md sm:max-w-xl lg:max-w-2xl lg:px-12">
                      <div>
                        <SwipeablePollCard
                          id={currentPoll.id}
                          question={currentPoll.question}
                          options={currentPoll.options}
                          selectedOption={currentPollSelected}
                          isAnswered={currentPollAnswered}
                          totalResponses={Object.values(currentPollStats).reduce((a, b) => a + b, 0)}
                          responseStats={currentPollStats}
                          comments={pollComments[currentPoll.id] || []}
                          pollIndex={currentPollIndex}
                          totalPolls={onboardingPolls.length}
                          onSwipe={(option) => {
                            track("onboarding_poll_answered", { poll_id: currentPoll.id, option_id: option, step_index: currentPollIndex });
                            setPollSelections((prev) => ({ ...prev, [currentPoll.id]: option }));
                            onMarkPollAnswered(currentPoll.id);
                          }}
                          onNavigate={(direction) => {
                            if (direction === "left") {
                              setCurrentPollIndex((prev) => Math.max(0, prev - 1));
                              return;
                            }
                            setCurrentPollIndex((prev) => Math.min(onboardingPolls.length - 1, prev + 1));
                          }}
                          currentIndex={currentPollIndex}
                          completedCount={answeredCount}
                          onAddComment={(content) => {
                            const newComment: Comment = {
                              id: `${currentPoll.id}-${Date.now()}`,
                              author: user.username,
                              avatar: avatarIndex,
                              content,
                              timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                              likes: 0,
                              replies: [],
                              isAnonymous: Math.random() > 0.7,
                            };
                            setPollComments((prev) => ({
                              ...prev,
                              [currentPoll.id]: [...(prev[currentPoll.id] || []), newComment],
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={goToNextStep}
                  disabled={!canContinueFromPolls}
                  className="rounded-xl border border-raw-gold/40 bg-raw-gold/15 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-raw-gold transition-all hover:bg-raw-gold/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue to communities →
                </button>
              </div>
            </section>
          )}

          {onboardingStep === "communities" && (
            <section>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg tracking-wide text-raw-text sm:text-xl">3. Pick 2 communities</h2>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  selectedCommunityIds.length === 2
                    ? "border-raw-gold/60 bg-raw-gold/10 text-raw-gold"
                    : "border-raw-border/40 text-raw-gold/75"
                }`}>
                  {selectedCommunityIds.length}/2
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {ONBOARDING_COMMUNITIES.map((community) => {
                  const isSelected = selectedCommunityIds.includes(community.id);
                  const selectionLimitReached = selectedCommunityIds.length >= 2;
                  const isSelectionDisabled = selectionLimitReached && !isSelected;

                  return (
                    <button
                      key={community.id}
                      onClick={() => {
                        const willBeSelected = !selectedCommunityIds.includes(community.id);
                        if (willBeSelected) {
                          track("onboarding_community_selected", {
                            community_id: community.id,
                            selected_count: selectedCommunityIds.length + 1,
                          });
                        }
                        onToggleCommunity(community.id);
                      }}
                      disabled={isSelectionDisabled}
                      className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
                        isSelected
                          ? "border-raw-gold/70 shadow-[0_0_0_1px_rgba(241,196,45,0.25),0_12px_28px_rgba(241,196,45,0.15)]"
                          : isSelectionDisabled
                          ? "border-raw-border/20 opacity-40 cursor-not-allowed"
                          : "border-raw-border/35 hover:border-raw-gold/40 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
                      }`}
                    >
                      {/* Media */}
                      <div className="relative h-28 overflow-hidden sm:h-36">
                        {community.video ? (
                          <video
                            src={community.video}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={community.image}
                            alt={community.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Selected checkmark */}
                        {isSelected && (
                          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-raw-gold shadow-lg">
                            <span className="text-[11px] font-bold text-black">✓</span>
                          </div>
                        )}

                        {/* Active badge */}
                        <div className="absolute bottom-2 left-2 rounded-full border border-white/15 bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                          <p className="text-[9px] uppercase tracking-[0.1em] text-white/70">
                            <span className="mr-1 text-raw-gold">●</span>
                            {community.activeNow}
                          </p>
                        </div>
                      </div>

                      {/* Info */}
                      <div className={`p-3 sm:p-4 transition-colors ${isSelected ? "bg-raw-gold/[0.06]" : "bg-raw-surface/40"}`}>
                        <p className="font-display text-[13px] leading-tight text-raw-text sm:text-base">{community.title}</p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-raw-silver/50 sm:text-xs">{community.description}</p>

                        <div className="mt-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors sm:px-3 ${
                              isSelected
                                ? "border-raw-gold/80 bg-raw-gold/15 text-raw-gold"
                                : isSelectionDisabled
                                  ? "border-raw-border/35 text-raw-silver/35"
                                  : "border-raw-border/50 text-raw-gold/85 group-hover:border-raw-gold/45"
                            }`}
                          >
                            {isSelected ? "✓ Selected" : "Enter Circle"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end sm:mt-8">
                <button
                  onClick={() => {
                    track("onboarding_completed", {
                      total_duration_ms: Date.now() - stepStartTimeRef.current,
                      polls_answered: answeredCount,
                      communities_selected: selectedCommunityIds.length,
                    });
                    onCompleteOnboarding();
                  }}
                  disabled={!canContinueFromCommunities}
                  className="w-full rounded-xl bg-raw-gold px-5 py-3 text-sm font-semibold text-raw-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-2.5"
                >
                  Complete onboarding
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
