import {
  Calendar,
  CheckCircle2,
  Flame,
  Lock,
  MessageCircle,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
} from "lucide-react";
import { DashboardDailySpin } from "@/components/dashboard/DashboardDailySpin";

interface DashboardChallengesProps {
  userId: string;
  isAdmin?: boolean;
  avatarLevel: number;
  pollsAnswered: number;
  dailyAnsweredCount: number;
  dailyPollLimit: number;
  onAwardXP?: (amount: number) => Promise<void>;
}

const challengeDefinitions = [
  {
    id: "first-session",
    title: "First Session",
    description: "Book your first session with any instructor",
    target: 1,
    reward: 50,
    accent: "from-sky-500/35 via-blue-500/20 to-transparent",
    Icon: Calendar,
  },
  {
    id: "weekly-warrior",
    title: "Weekly Warrior",
    description: "Complete 3 sessions this week",
    target: 3,
    reward: 100,
    accent: "from-amber-500/35 via-orange-500/20 to-transparent",
    Icon: Trophy,
    deadline: "5 days",
  },
  {
    id: "voice-your-opinion",
    title: "Voice Your Opinion",
    description: "Answer 5 polls in The Cumulative Mind",
    target: 5,
    reward: 15,
    accent: "from-violet-500/35 via-fuchsia-500/20 to-transparent",
    Icon: MessageCircle,
  },
  {
    id: "seven-day-streak",
    title: "7-Day Streak",
    description: "Open the app 7 days in a row",
    target: 7,
    reward: 50,
    accent: "from-orange-500/35 via-rose-500/20 to-transparent",
    Icon: Sparkles,
  },
  {
    id: "review-master",
    title: "Review Master",
    description: "Leave a review after your session",
    target: 1,
    reward: 10,
    accent: "from-indigo-500/35 via-violet-500/20 to-transparent",
    Icon: Star,
  },
  {
    id: "refer-a-friend",
    title: "Refer a Friend",
    description: "Invite a friend who books their first session",
    target: 1,
    reward: 75,
    accent: "from-emerald-500/35 via-teal-500/20 to-transparent",
    Icon: UserPlus,
  },
  {
    id: "signal-builder",
    title: "Signal Builder",
    description: "Reach avatar level 5",
    target: 5,
    reward: 50,
    accent: "from-cyan-500/35 via-sky-500/20 to-transparent",
    Icon: Flame,
  },
];

export function DashboardChallenges({
  userId,
  isAdmin = false,
  avatarLevel,
  pollsAnswered,
  dailyAnsweredCount,
  dailyPollLimit,
  onAwardXP,
}: DashboardChallengesProps) {
  const progressMap: Record<string, number> = {
    "first-session": pollsAnswered > 0 ? 1 : 0,
    "weekly-warrior": Math.min(3, Math.floor(pollsAnswered / 3)),
    "voice-your-opinion": dailyAnsweredCount,
    "seven-day-streak": Math.min(7, Math.max(1, avatarLevel + 1)),
    "review-master": pollsAnswered >= 8 ? 1 : 0,
    "refer-a-friend": 0,
    "signal-builder": avatarLevel,
  };

  const completedCount = challengeDefinitions.filter((challenge) => {
    const current = progressMap[challenge.id] ?? 0;
    return current >= challenge.target;
  }).length;

  return (
    <div className="space-y-5">
      <DashboardDailySpin userId={userId} isAdmin={isAdmin} onAwardXP={onAwardXP} />

      <header className="space-y-2">
        <h1 className="font-display text-xl tracking-wide text-raw-text sm:text-2xl">Challenges</h1>
        <p className="text-xs text-raw-silver/45 sm:text-sm">
          Complete high-impact missions to unlock rewards and level up your identity faster.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-black/45 p-4 sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-30%,rgba(241,196,45,0.25),transparent_55%)]" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-raw-gold/65">Challenge Board</p>
            <p className="mt-1 text-sm text-raw-silver/70">
              {completedCount}/{challengeDefinitions.length} completed today
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-raw-gold/30 bg-raw-gold/[0.08] px-3 py-1.5 text-xs text-raw-gold/85">
            <Flame className="h-3.5 w-3.5" />
            {dailyAnsweredCount}/{dailyPollLimit} daily polls answered
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
        {challengeDefinitions.map((challenge) => {
          const current = progressMap[challenge.id] ?? 0;
          const done = current >= challenge.target;
          const pct = Math.min(100, Math.round((Math.min(current, challenge.target) / challenge.target) * 100));
          const Icon = challenge.Icon;

          return (
            <article
              key={challenge.id}
              className="group relative overflow-hidden rounded-2xl border border-raw-border/45 bg-raw-black/45 p-3 sm:p-5"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${challenge.accent} opacity-60 transition-opacity duration-300 group-hover:opacity-90`} />
              <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(255,255,255,0.15)_0.6px,transparent_0.6px)] [background-size:8px_8px]" />

              <div className="relative flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <div className="shrink-0 rounded-xl border border-raw-border/45 bg-raw-black/55 p-2">
                    <Icon className="h-3.5 w-3.5 text-raw-gold/80" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-xs leading-tight text-raw-text sm:text-sm">{challenge.title}</h2>
                    <p className="mt-0.5 text-[10px] leading-snug text-raw-silver/65 sm:text-xs line-clamp-2">{challenge.description}</p>
                  </div>
                </div>
                <div className="relative shrink-0 inline-flex items-center gap-0.5 rounded-full border border-raw-border/45 bg-raw-black/55 px-2 py-0.5 text-xs text-raw-text">
                  <Flame className="h-3 w-3 text-raw-gold/80" />
                  +{challenge.reward}
                </div>
              </div>

              <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-raw-border/35">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${done ? "bg-gradient-to-r from-emerald-400/90 to-emerald-300" : "bg-gradient-to-r from-raw-gold/70 to-raw-gold"}`}
                  style={{ width: `${Math.max(6, pct)}%` }}
                />
              </div>

              <div className="relative mt-2 flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1 rounded-full border border-raw-border/40 bg-raw-black/45 px-2 py-0.5 text-[10px] text-raw-silver/70">
                  {done ? <CheckCircle2 className="h-3 w-3 text-emerald-300" /> : <Lock className="h-3 w-3 text-raw-silver/55" />}
                  {done ? "Done" : "In Progress"}
                </div>
                {done ? (
                  <button className="rounded-full border border-emerald-300/35 bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-medium text-emerald-100 transition hover:bg-emerald-400/30">
                    Claim
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1 text-[10px] text-raw-silver/55">
                    <Trophy className="h-3 w-3 text-raw-gold/65" />
                    Pending
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
