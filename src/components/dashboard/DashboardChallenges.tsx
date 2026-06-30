import {
  Calendar,
  CheckCircle2,
  Flame,
  Lock,
  MessageCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getTodayKey } from "@/store/useRawStore.storage";
import { loadLocalLoginDays, loadUserXPClaimKeys } from "@/lib/userProgress";

interface DashboardChallengesProps {
  userId: string;
  isAdmin?: boolean;
  avatarLevel: number;
  pollsAnswered: number;
  dailyAnsweredCount: number;
  dailyPollLimit: number;
  onAwardXP?: (amount: number) => Promise<void>;
  onClaimXP?: (source: string, claimKey: string, amount: number) => Promise<boolean>;
  onAwardTokens?: (amount: number) => void;
  onAvatarWon?: (level: number) => void;
}

type ChallengeReset = "daily" | "weekly" | "monthly";

interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  target: number;
  rewardXP: number;
  rewardTokens?: number;
  reset: ChallengeReset;
  progressKey: "dailyPolls" | "totalPolls" | "streakDays" | "avatarLevel";
  accent: string;
  Icon: typeof Calendar;
}

const challengeDefinitions = [
  {
    id: "daily-7-polls",
    title: "Daily Voice",
    description: "Answer 7 polls today",
    target: 7,
    rewardXP: 50,
    reset: "daily",
    progressKey: "dailyPolls",
    accent: "from-[#F1C42D]/22 via-[#D9D9D9]/14 to-transparent",
    Icon: MessageCircle,
  },
  {
    id: "weekly-warrior",
    title: "Weekly Warrior",
    description: "Answer 21 polls this week",
    target: 21,
    rewardXP: 150,
    reset: "weekly",
    progressKey: "totalPolls",
    accent: "from-[#F1C42D]/28 via-[#B82E2E]/12 to-transparent",
    Icon: Trophy,
  },
  {
    id: "monthly-70-polls",
    title: "70 Poll Deep Dive",
    description: "Answer 70 polls this month",
    target: 70,
    rewardXP: 500,
    reset: "monthly",
    progressKey: "totalPolls",
    accent: "from-[#D9D9D9]/24 via-[#F1C42D]/10 to-transparent",
    Icon: MessageCircle,
  },
  {
    id: "seven-day-streak",
    title: "7-Day Streak",
    description: "Open the app 7 days in a row",
    target: 7,
    rewardXP: 100,
    rewardTokens: 20,
    reset: "weekly",
    progressKey: "streakDays",
    accent: "from-[#B82E2E]/18 via-[#F1C42D]/20 to-transparent",
    Icon: Sparkles,
  },
  {
    id: "thirty-day-streak",
    title: "30-Day Streak",
    description: "Open the app 30 days in a row",
    target: 30,
    rewardXP: 300,
    rewardTokens: 20,
    reset: "monthly",
    progressKey: "streakDays",
    accent: "from-[#F1C42D]/26 via-[#EBEBEB]/10 to-transparent",
    Icon: Flame,
  },
] satisfies ChallengeDefinition[];

function getWeekKey(): string {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  return `${start.getFullYear()}-W${String(Math.ceil((((start.getTime() - new Date(start.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7)).padStart(2, "0")}`;
}

function getMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getResetKey(reset: ChallengeReset): string {
  if (reset === "weekly") return getWeekKey();
  if (reset === "monthly") return getMonthKey();
  return getTodayKey();
}

function getResetLabel(reset: ChallengeReset): string {
  if (reset === "weekly") return "Resets next week";
  if (reset === "monthly") return "Resets next month";
  return "Resets tomorrow";
}

function countConsecutiveDays(dayKeys: string[]): number {
  const days = new Set(dayKeys);
  const cursor = new Date();
  let streak = 0;

  while (true) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (!days.has(key)) return streak;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
}

export function DashboardChallenges({
  userId,
  isAdmin = false,
  avatarLevel,
  pollsAnswered,
  dailyAnsweredCount,
  dailyPollLimit,
  onAwardXP,
  onClaimXP,
  onAwardTokens,
  onAvatarWon,
}: DashboardChallengesProps) {
  const [claimedChallenges, setClaimedChallenges] = useState<Set<string>>(new Set());
  const [dailyLoginClaimKeys, setDailyLoginClaimKeys] = useState<string[]>([]);
  const [testProgress, setTestProgress] = useState<Record<string, number>>({});
  const autoClaimingRef = useRef<Set<string>>(new Set());
  const streakDays = countConsecutiveDays(dailyLoginClaimKeys);
  const progressSourceMap = useMemo<Record<ChallengeDefinition["progressKey"], number>>(() => ({
    dailyPolls: dailyAnsweredCount,
    totalPolls: pollsAnswered,
    streakDays,
    avatarLevel,
  }), [avatarLevel, dailyAnsweredCount, pollsAnswered, streakDays]);

  useEffect(() => {
    loadUserXPClaimKeys(userId, "challenge").then((claimKeys) => {
      setClaimedChallenges(new Set(claimKeys));
    });
    setDailyLoginClaimKeys(loadLocalLoginDays(userId));
  }, [userId]);

  const completedCount = challengeDefinitions.filter((challenge) => {
    const current = testProgress[challenge.id] ?? progressSourceMap[challenge.progressKey] ?? 0;
    return current >= challenge.target;
  }).length;

  const handleClaimChallenge = useCallback((challenge: ChallengeDefinition) => {
    const claimKey = `${challenge.id}:${getResetKey(challenge.reset)}`;
    if (!isAdmin && (claimedChallenges.has(claimKey) || autoClaimingRef.current.has(claimKey))) return;
    autoClaimingRef.current.add(claimKey);

    const awardTokens = () => {
      if (challenge.rewardTokens && onAwardTokens) {
        onAwardTokens(challenge.rewardTokens);
      }
    };

    if (isAdmin && onAwardXP) {
      awardTokens();
      void onAwardXP(challenge.rewardXP).finally(() => {
        autoClaimingRef.current.delete(claimKey);
      });
      return;
    }

    if (onClaimXP) {
      void onClaimXP("challenge", claimKey, challenge.rewardXP).then((awarded) => {
        if (awarded) {
          awardTokens();
          setClaimedChallenges((previous) => new Set(previous).add(claimKey));
          toast({
            title: `${challenge.title} complete`,
            description: `+${challenge.rewardXP} XP${challenge.rewardTokens ? ` and +${challenge.rewardTokens} tokens` : ""} claimed automatically.`,
          });
        }
      }).finally(() => {
        autoClaimingRef.current.delete(claimKey);
      });
      return;
    }

    if (onAwardXP) {
      void onAwardXP(challenge.rewardXP).then(() => {
        awardTokens();
        setClaimedChallenges((previous) => new Set(previous).add(claimKey));
        toast({
          title: `${challenge.title} complete`,
          description: `+${challenge.rewardXP} XP${challenge.rewardTokens ? ` and +${challenge.rewardTokens} tokens` : ""} claimed automatically.`,
        });
      }).finally(() => {
        autoClaimingRef.current.delete(claimKey);
      });
      return;
    }

    autoClaimingRef.current.delete(claimKey);
  }, [claimedChallenges, isAdmin, onAwardTokens, onAwardXP, onClaimXP]);

  useEffect(() => {
    if (isAdmin) return;

    challengeDefinitions.forEach((challenge) => {
      const current = testProgress[challenge.id] ?? progressSourceMap[challenge.progressKey] ?? 0;
      const claimKey = `${challenge.id}:${getResetKey(challenge.reset)}`;
      if (current >= challenge.target && !claimedChallenges.has(claimKey)) {
        handleClaimChallenge(challenge);
      }
    });
  }, [claimedChallenges, handleClaimChallenge, isAdmin, progressSourceMap, testProgress]);

  return (
    <div className="space-y-5">
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
              {completedCount}/{challengeDefinitions.length} ready to claim
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-raw-gold/30 bg-raw-gold/[0.08] px-3 py-1.5 text-xs text-raw-gold/85">
              <Flame className="h-3.5 w-3.5" />
              {dailyAnsweredCount}/{dailyPollLimit} daily polls answered
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {challengeDefinitions.map((challenge) => {
          const current = testProgress[challenge.id] ?? progressSourceMap[challenge.progressKey] ?? 0;
          const done = current >= challenge.target;
          const claimKey = `${challenge.id}:${getResetKey(challenge.reset)}`;
          const claimed = claimedChallenges.has(claimKey);
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
                  +{challenge.rewardXP} XP{challenge.rewardTokens ? ` / +${challenge.rewardTokens} tokens` : ""}
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
                  {done ? getResetLabel(challenge.reset) : getResetLabel(challenge.reset)}
                </div>
                {isAdmin && !done ? (
                  <button
                    type="button"
                    onClick={() => setTestProgress((previous) => ({ ...previous, [challenge.id]: challenge.target }))}
                    className="rounded-full border border-raw-gold/35 bg-raw-gold/10 px-2.5 py-0.5 text-[10px] font-medium text-raw-gold transition hover:bg-raw-gold/20"
                  >
                    Test Complete
                  </button>
                ) : null}
                {done ? (
                  <button
                    type="button"
                    onClick={() => handleClaimChallenge(challenge)}
                    disabled={claimed && !isAdmin}
                    className="rounded-full border border-emerald-300/35 bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-medium text-emerald-100 transition hover:bg-emerald-400/30 disabled:cursor-default disabled:opacity-55"
                  >
                    {claimed && !isAdmin ? "Claimed" : "Claim"}
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
