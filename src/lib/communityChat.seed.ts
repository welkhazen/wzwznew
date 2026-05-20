import { toUserId } from "@/lib/adminData";
import type { CommunityChatMemberRecord, CommunityChatMessageRecord, PersistedCommunityRecord } from "./communityChat.types";
import LNTLogo from "@/assets/LNT.webp";
import SYTLogo from "@/assets/logospeak.webp";

function createSeedMessage(
  communityId: string,
  id: string,
  senderName: string,
  text: string,
  createdAt: string,
  pinned = false,
): CommunityChatMessageRecord {
  return {
    id,
    communityId,
    senderId: toUserId(senderName),
    senderName,
    text,
    createdAt,
    pinned,
  };
}

function createSeedMember(username: string, joinedAt: string, notificationsEnabled: boolean): CommunityChatMemberRecord {
  return {
    userId: toUserId(username),
    username,
    joinedAt,
    lastSeenAt: joinedAt,
    lastReadAt: joinedAt,
    notificationsEnabled,
  };
}

export function buildDefaultCommunities(): PersistedCommunityRecord[] {
  return [
    {
      id: "lnt",
      abbr: "LNT",
      logoUrl: LNTLogo,
      title: "Late Night Talk",
      description: "Honest conversation when the world gets quiet and people finally say what they actually mean.",
      topic: "What thought has been following you all week?",
      status: "Active",
      createdAt: "2026-04-01T00:00:00.000Z",
      members: [
        createSeedMember("ghost_mind", "2026-04-13T22:48:00.000Z", true),
        createSeedMember("neon_drift", "2026-04-13T23:16:00.000Z", true),
        createSeedMember("silent_ash", "2026-04-13T23:57:00.000Z", false),
      ],
      messages: [
        createSeedMessage("lnt", "l1", "ghost_mind", "Does anyone else feel more alive at 2am than at 2pm?", "2026-04-13T23:48:00.000Z", true),
        createSeedMessage("lnt", "l2", "neon_drift", "Night strips away performance. People sound more honest here.", "2026-04-13T23:52:00.000Z"),
        createSeedMessage("lnt", "l3", "silent_ash", "I only journal when the house is asleep. Feels like my thoughts can breathe.", "2026-04-13T23:57:00.000Z"),
      ],
    },
    {
      id: "syt",
      abbr: "SYT",
      logoUrl: SYTLogo,
      title: "Speak Your Truth",
      description: "A space to say what you've been holding back. No filters, no judgment — just real voices sharing real experiences.",
      topic: "What's something you've been afraid to say out loud?",
      status: "Active",
      createdAt: "2026-04-01T00:00:00.000Z",
      members: [
        createSeedMember("open_voice", "2026-04-13T21:30:00.000Z", true),
        createSeedMember("raw_signal", "2026-04-13T22:10:00.000Z", true),
        createSeedMember("echo_freely", "2026-04-13T23:44:00.000Z", false),
      ],
      messages: [
        createSeedMessage("syt", "sy1", "open_voice", "I told my family I wasn't okay. First time in years. It felt terrifying and right.", "2026-04-13T23:20:00.000Z", true),
        createSeedMessage("syt", "sy2", "raw_signal", "Honesty isn't aggression. It's just clarity people aren't used to.", "2026-04-13T23:38:00.000Z"),
        createSeedMessage("syt", "sy3", "echo_freely", "Anyone else notice how much lighter you feel after you stop pretending?", "2026-04-13T23:44:00.000Z"),
      ],
    },
    {
      id: "iijm",
      abbr: "IIM",
      title: "Is It Just Me?",
      description: "Relatable moments, shared observations, and the quiet comfort of realizing you're not the only one.",
      topic: "What's something you do or feel that you thought was only you?",
      status: "Active",
      createdAt: "2026-04-01T00:00:00.000Z",
      members: [
        createSeedMember("soft_signal", "2026-04-13T22:10:00.000Z", true),
        createSeedMember("quiet_flame", "2026-04-13T23:49:00.000Z", true),
        createSeedMember("still_water", "2026-04-13T23:54:00.000Z", false),
      ],
      messages: [
        createSeedMessage("iijm", "ij1", "soft_signal", "Is it just me or does replying to a 3-day-old message feel harder than starting a new conversation?", "2026-04-13T23:10:00.000Z", true),
        createSeedMessage("iijm", "ij2", "quiet_flame", "Not just you. The longer you wait the bigger the apology feels.", "2026-04-13T23:31:00.000Z"),
        createSeedMessage("iijm", "ij3", "still_water", "Is it just me or does background music make every task feel more meaningful?", "2026-04-13T23:54:00.000Z"),
      ],
    },
    {
      id: "li",
      abbr: "LI",
      title: "Lebanon Initiatives",
      description: "A space for Lebanese change-makers, community builders, and people driving impact inside Lebanon and across the diaspora.",
      topic: "What initiative or project are you working on right now?",
      status: "Early Access",
      locked: true,
      createdAt: "2026-04-01T00:00:00.000Z",
      members: [],
      messages: [],
    },
  ];
}
