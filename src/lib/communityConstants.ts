import lntCoverVideo from "@/assets/2026-04-18 10_10_00.webm";
import lebanonImage from "@/assets/LB.webp";
import sytVideo from "@/assets/speakyourheart.webm";

export const FEATURED_COMMUNITY_IDS = ["lnt", "syt", "iijm", "li"] as const;

export const FEATURED_COMMUNITY_ID_SET = new Set<string>(FEATURED_COMMUNITY_IDS);

export const COMMUNITY_COVER_IMAGES: Record<string, string> = {
  syt: "https://images.unsplash.com/photo-1534131707746-25d604851a1f?auto=format&fit=crop&w=1200&q=80",
  iijm: "/assets/itisjustme-bounce.gif",
  li: lebanonImage,
  sic: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
  mw: "https://images.unsplash.com/photo-1493836512294-502baa1986e2?auto=format&fit=crop&w=1200&q=80",

  "the-ick": "/assets/community-covers/the-ick.svg",
  "am-i-evil": "/assets/community-covers/am-i-evil.svg",
  "weirdest-thoughts": "/assets/community-covers/weirdest-thoughts.svg",
  "is-this-normal": "/assets/community-covers/is-this-normal.svg",
  mancave: "/assets/community-covers/mancave.svg",
  "gamer-gang": "/assets/community-covers/gamer-gang.svg",
  "bizniz-minded": "/assets/community-covers/bizniz-minded.svg",
  "match-maker": "/assets/community-covers/match-maker.svg",
  "fucking-bored": "/assets/community-covers/fucking-bored.svg",
  "advice-now": "/assets/community-covers/advice-now.svg",
  "feeling-like-shit": "/assets/community-covers/feeling-like-shit.svg",
  "best-story": "/assets/community-covers/best-story.svg",
};

export const COMMUNITY_COVER_VIDEOS: Record<string, string> = {
  lnt: lntCoverVideo,
  syt: sytVideo,
};
