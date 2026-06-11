import type { PersistedCommunityRecord } from "./communityChat.types";
import LNTLogo from "@/assets/LNT.webp";
import SYTLogo from "@/assets/logospeak.webp";

// Fallback community shells used while the real chat API is loading or unavailable.
// Members and messages are intentionally empty so the UI never flashes hardcoded
// mock chat content before the API renders the actual data.
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
      members: [],
      messages: [],
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
      members: [],
      messages: [],
    },
    {
      id: "iijm",
      abbr: "IIM",
      title: "Is It Just Me?",
      description: "Relatable moments, shared observations, and the quiet comfort of realizing you're not the only one.",
      topic: "What's something you do or feel that you thought was only you?",
      status: "Active",
      createdAt: "2026-04-01T00:00:00.000Z",
      members: [],
      messages: [],
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
