import lntCoverVideo from "@/assets/2026-04-18 10_10_00.webm";
import iijmVideo from "@/assets/itisjustme.webm";
import lebanonVideo from "@/assets/LB.mp4";
import sytVideo from "@/assets/speakyourheart.webm";

export const FEATURED_COMMUNITY_IDS = ["lnt", "syt", "iijm", "li"] as const;

export const FEATURED_COMMUNITY_ID_SET = new Set<string>(FEATURED_COMMUNITY_IDS);

export const COMMUNITY_COVER_IMAGES: Record<string, string> = {
  syt: "https://images.unsplash.com/photo-1534131707746-25d604851a1f?auto=format&fit=crop&w=1200&q=80",
  iijm: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
  li: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
  sic: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
  mw: "https://images.unsplash.com/photo-1493836512294-502baa1986e2?auto=format&fit=crop&w=1200&q=80",
};

export const COMMUNITY_COVER_VIDEOS: Record<string, string> = {
  lnt: lntCoverVideo,
  iijm: iijmVideo,
  li: lebanonVideo,
  syt: sytVideo,
};
