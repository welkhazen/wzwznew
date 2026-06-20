import type { Request, Response } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { audit } from "../lib/audit";
import { applyVote, buildBootstrap, canVote, recordPollVote } from "../lib/store";
import { fetchActivePolls } from "../lib/pollRepository";
import { getUserRepository } from "../lib/userRepository";
import type { AuthSessionData } from "../types";

const voteBodySchema = z.object({
  optionId: z.string().min(1).max(64),
});

const pollParamsSchema = z.object({
  pollId: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
});

const randomPollsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

function getSessionData(req: Request): AuthSessionData {
  return req.session as unknown as AuthSessionData;
}

export const pollsRouter = Router();
const userRepository = getUserRepository();

const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many vote attempts. Please slow down." },
});

pollsRouter.get("/bootstrap", async (req, res) => {
  const sessionData = getSessionData(req);
  const user = sessionData.userId ? await userRepository.findById(sessionData.userId) : null;

  if (sessionData.userId && !user) {
    sessionData.userId = undefined;
  }

  return res.status(200).json(buildBootstrap(user, sessionData));
});

async function handleRandomPolls(req: Request, res: Response) {
  const parsed = randomPollsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid poll query." });
  }

  const sessionData = getSessionData(req);
  const user = sessionData.userId ? await userRepository.findById(sessionData.userId) : null;
  const bootstrap = buildBootstrap(user, sessionData);
  const fallbackPolls = bootstrap.polls
    .filter((poll) => !poll.locked)
    .map((poll) => ({ poll, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, parsed.data.limit)
    .map(({ poll }) => poll);
  const remotePolls = await fetchActivePolls(parsed.data.limit);
  const polls = remotePolls && remotePolls.length > 0 ? remotePolls : fallbackPolls;

  return res.status(200).json({
    polls,
    votedPolls: bootstrap.votedPollIds,
    freeVotesUsed: bootstrap.freeVotesUsed,
  });
}

async function handleVote(req: Request, res: Response) {
  const parsedParams = pollParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ error: "Invalid poll ID." });
  }

  const parsed = voteBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid vote payload." });
  }

  const sessionData = getSessionData(req);
  const user = sessionData.userId ? await userRepository.findById(sessionData.userId) : null;
  const { pollId } = parsedParams.data;

  const permission = canVote(user, sessionData, pollId);
  if (!permission.ok) {
    if (permission.reason === "auth_required") {
      return res.status(403).json({ error: "Sign up or log in to continue voting." });
    }

    return res.status(409).json({ error: "You already voted on this poll." });
  }

  const voted = applyVote(user, sessionData, pollId, parsed.data.optionId);
  if (!voted) {
    // Poll could come from database-backed feed instead of in-memory seed store.
    const recheck = canVote(user, sessionData, pollId);
    if (!recheck.ok) {
      if (recheck.reason === "auth_required") {
        return res.status(403).json({ error: "Sign up or log in to continue voting." });
      }

      return res.status(409).json({ error: "You already voted on this poll." });
    }

    recordPollVote(user, sessionData, pollId);

    audit("poll.vote", {
      pollId,
      optionId: parsed.data.optionId,
      userId: user?.id ?? null,
      ip: req.ip,
    });

    return res.status(200).json({ ok: true });
  }

  audit("poll.vote", {
    pollId,
    optionId: parsed.data.optionId,
    userId: user?.id ?? null,
    ip: req.ip,
  });

  return res.status(200).json(buildBootstrap(user, sessionData));
}

pollsRouter.get("/polls/random", handleRandomPolls);
pollsRouter.get("/v2/polls/random", handleRandomPolls);
pollsRouter.post("/polls/:pollId/vote", voteLimiter, handleVote);
pollsRouter.post("/v2/polls/:pollId/vote", voteLimiter, handleVote);
