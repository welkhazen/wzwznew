import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import {
  createCommunityPoll,
  deleteCommunityPoll,
  fetchCommunityPolls,
  voteOnCommunityPoll,
} from "@/backend/supabase/controllers/communityPollController";
import { supabase } from "@/backend/supabase/client";
import { getUserTextModerationMessage, moderateUserText } from "@/lib/inputSecurity";
import type { CommunityPollRecord } from "@/backend/supabase/models/community-poll";

export interface CommunityPollsState {
  communityPolls: CommunityPollRecord[];
  communityPollsAvailable: boolean;
  communityPollsExpanded: boolean;
  setCommunityPollsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  hiddenAnsweredPollIds: Set<string>;
  visibleCommunityPolls: CommunityPollRecord[];
  pollComposerOpen: boolean;
  setPollComposerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pollQuestion: string;
  setPollQuestion: React.Dispatch<React.SetStateAction<string>>;
  pollOptionDrafts: string[];
  pollSubmitting: boolean;
  openPollComposer: () => void;
  updatePollOption: (index: number, value: string) => void;
  submitPoll: (communityId: string, userId: string, username: string) => Promise<void>;
  votePoll: (pollId: string, optionId: string) => Promise<void>;
  deletePoll: (pollId: string) => Promise<void>;
}

export function useCommunityPolls(
  activeCommunityId: string | null,
  userId: string,
  canManagePolls: boolean,
): CommunityPollsState {
  const [communityPolls, setCommunityPolls] = useState<CommunityPollRecord[]>([]);
  const [communityPollsAvailable, setCommunityPollsAvailable] = useState(true);
  const [communityPollsExpanded, setCommunityPollsExpanded] = useState(false);
  const [hiddenAnsweredPollIds, setHiddenAnsweredPollIds] = useState<Set<string>>(new Set());
  const [pollComposerOpen, setPollComposerOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptionDrafts, setPollOptionDrafts] = useState<string[]>(["", ""]);
  const [pollSubmitting, setPollSubmitting] = useState(false);

  useEffect(() => {
    setCommunityPollsExpanded(false);
    setHiddenAnsweredPollIds(new Set());
  }, [activeCommunityId]);

  const reload = useCallback(async () => {
    if (!activeCommunityId || !communityPollsAvailable) {
      setCommunityPolls([]);
      return;
    }
    try {
      const polls = await fetchCommunityPolls(activeCommunityId, userId);
      setCommunityPolls(polls);
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? Number((error as { status?: number }).status)
          : null;
      if (status === 404) {
        setCommunityPollsAvailable(false);
        setCommunityPolls([]);
        return;
      }
      console.error("Failed to load community polls", error);
    }
  }, [activeCommunityId, communityPollsAvailable, userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedReload = useCallback(() => {
    if (reloadTimerRef.current !== null) clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = setTimeout(() => {
      reloadTimerRef.current = null;
      void reload();
    }, 300);
  }, [reload]);

  useEffect(() => {
    if (!activeCommunityId || !communityPollsAvailable) return;
    const channel = supabase
      .channel(`community-polls:${activeCommunityId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "community_polls", filter: `community_id=eq.${activeCommunityId}` }, debouncedReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "community_poll_votes" }, debouncedReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "community_poll_options" }, debouncedReload)
      .subscribe();
    return () => {
      if (reloadTimerRef.current !== null) { clearTimeout(reloadTimerRef.current); reloadTimerRef.current = null; }
      void supabase.removeChannel(channel);
    };
  }, [activeCommunityId, communityPollsAvailable, debouncedReload]);

  const visibleCommunityPolls = useMemo(
    () => communityPolls.filter((poll) => !hiddenAnsweredPollIds.has(poll.id)),
    [communityPolls, hiddenAnsweredPollIds],
  );

  const openPollComposer = useCallback(() => {
    setPollQuestion("");
    setPollOptionDrafts(["", ""]);
    setPollComposerOpen(true);
  }, []);

  const updatePollOption = useCallback((index: number, value: string) => {
    setPollOptionDrafts((drafts) => drafts.map((d, i) => (i === index ? value : d)));
  }, []);

  const submitPoll = useCallback(
    async (communityId: string, createdByUserId: string, createdByUsername: string) => {
      if (!canManagePolls) return;
      const trimmedOptions = pollOptionDrafts.map((o) => o.trim()).filter(Boolean);
      const questionModeration = moderateUserText(pollQuestion);
      if (!pollQuestion.trim()) {
        toast({ title: "Add a question", description: "Polls need a question to ask the room." });
        return;
      }
      if (!questionModeration.allowed) {
        toast({ title: "Poll question blocked", description: getUserTextModerationMessage(questionModeration) });
        return;
      }
      if (trimmedOptions.length < 2) {
        toast({ title: "Add at least two options", description: "Members need something to choose between." });
        return;
      }
      const moderatedOptions: string[] = [];
      for (const option of trimmedOptions) {
        const mod = moderateUserText(option);
        if (!mod.allowed) {
          toast({ title: "Poll option blocked", description: getUserTextModerationMessage(mod) });
          return;
        }
        moderatedOptions.push(mod.text);
      }
      setPollSubmitting(true);
      try {
        await createCommunityPoll({
          communityId,
          question: questionModeration.text,
          options: moderatedOptions,
          createdByUserId,
          createdByUsername,
        });
        setPollComposerOpen(false);
        await reload();
        toast({ title: "Poll posted", description: "Your poll is live in the room." });
      } catch (error) {
        console.error("Failed to create poll", error);
        toast({ title: "Couldn't post poll", description: "Please try again in a moment." });
      } finally {
        setPollSubmitting(false);
      }
    },
    [canManagePolls, pollOptionDrafts, pollQuestion, reload],
  );

  const votePoll = useCallback(
    async (pollId: string, optionId: string) => {
      const previous = communityPolls;
      setCommunityPolls((polls) =>
        polls.map((poll) => {
          if (poll.id !== pollId) return poll;
          const wasOption = poll.userVoteOptionId;
          if (wasOption === optionId) return poll;
          const nextOptions = poll.options.map((opt) => {
            if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 };
            if (opt.id === wasOption) return { ...opt, votes: Math.max(0, opt.votes - 1) };
            return opt;
          });
          const totalVotes = wasOption ? poll.totalVotes : poll.totalVotes + 1;
          return { ...poll, options: nextOptions, userVoteOptionId: optionId, totalVotes };
        }),
      );
      try {
        await voteOnCommunityPoll(pollId, optionId, userId);
        window.setTimeout(() => {
          setHiddenAnsweredPollIds((prev) => new Set([...prev, pollId]));
        }, 4500);
      } catch (error) {
        console.error("Failed to vote on poll", error);
        setCommunityPolls(previous);
        toast({ title: "Couldn't record vote", description: "Please try again in a moment." });
      }
    },
    [communityPolls, userId],
  );

  const deletePoll = useCallback(
    async (pollId: string) => {
      if (!canManagePolls) return;
      const previous = communityPolls;
      setCommunityPolls((polls) => polls.filter((p) => p.id !== pollId));
      try {
        await deleteCommunityPoll(pollId);
      } catch (error) {
        console.error("Failed to delete poll", error);
        setCommunityPolls(previous);
        toast({ title: "Couldn't delete poll", description: "Please try again in a moment." });
      }
    },
    [canManagePolls, communityPolls],
  );

  return {
    communityPolls,
    communityPollsAvailable,
    communityPollsExpanded,
    setCommunityPollsExpanded,
    hiddenAnsweredPollIds,
    visibleCommunityPolls,
    pollComposerOpen,
    setPollComposerOpen,
    pollQuestion,
    setPollQuestion,
    pollOptionDrafts,
    pollSubmitting,
    openPollComposer,
    updatePollOption,
    submitPoll,
    votePoll,
    deletePoll,
  };
}
