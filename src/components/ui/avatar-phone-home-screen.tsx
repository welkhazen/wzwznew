import { AvatarFigure } from "@/components/ui/avatar-figure";
import { getAvatar } from "@/lib/avataridentity";

interface AvatarPhoneHomeScreenProps {
  avatarIndex: number;
}

export function AvatarPhoneHomeScreen({ avatarIndex }: AvatarPhoneHomeScreenProps) {
  const theme = getAvatar(avatarIndex);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#f2f2f2] via-[#e6e6e8] to-[#d7d7da] px-4 pt-5 pb-4">
      <div className="flex-1">
      <div className="grid grid-cols-4 gap-x-3 gap-y-5">
        <AppIcon kind="facetime" label="FaceTime" />
        <AppIcon kind="calendar" label="Calendar" />
        <AppIcon kind="photos" label="Photos" />
        <AppIcon kind="camera" label="Camera" />

        <AppIcon kind="clock" label="Clock" />
        <AppIcon kind="maps" label="Maps" />
        <AppIcon kind="weather" label="Weather" />
        <AppIcon kind="notes" label="Notes" />

        <AppIcon kind="reminders" label="Reminders" />
        <AppIcon kind="stocks" label="Stocks" />

        <div className="col-span-2 row-span-2 flex flex-col items-center gap-2">
          <div
            key={avatarIndex}
            className="relative flex h-full min-h-[150px] w-full animate-[iconPop_420ms_ease-out] items-center justify-center overflow-hidden rounded-[20px] shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${theme.bg} 0%, #050505 70%)`,
              boxShadow: theme.glow !== "none" ? `0 0 22px ${theme.glow}` : "0 6px 16px rgba(0,0,0,0.35)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent" />
            <div className="relative scale-[1.45]">
              <AvatarFigure avatarIndex={avatarIndex} size="md" selected />
            </div>
          </div>
          <span className="font-display text-[10px] tracking-[0.18em] text-[#222]">raW</span>
        </div>

        <AppIcon kind="podcasts" label="Podcasts" />
        <AppIcon kind="tv" label="TV" />

        <AppIcon kind="reminders" label="Health" />
        <AppIcon kind="stocks" label="Wallet" />
        <AppIcon kind="maps" label="Find My" />
        <AppIcon kind="notes" label="Files" />
      </div>

      </div>

      <div className="py-3 flex items-center justify-center gap-1.5">
        <div className="h-[3px] w-[3px] rounded-full bg-[#1a1a1a]/60" />
        <div className="h-[3px] w-[3px] rounded-full bg-[#1a1a1a]/25" />
        <div className="h-[3px] w-[3px] rounded-full bg-[#1a1a1a]/25" />
        <div className="h-[3px] w-[3px] rounded-full bg-[#1a1a1a]/25" />
      </div>

      <div className="flex items-center justify-between rounded-[22px] bg-white/40 px-3 py-2 backdrop-blur-sm">
        <DockIcon kind="phone" />
        <DockIcon kind="siri" />
        <DockIcon kind="messages" />
        <DockIcon kind="music" />
      </div>
    </div>
  );
}

type IconKind =
  | "facetime"
  | "calendar"
  | "photos"
  | "camera"
  | "clock"
  | "maps"
  | "weather"
  | "notes"
  | "reminders"
  | "stocks"
  | "podcasts"
  | "tv"
  | "phone"
  | "siri"
  | "messages"
  | "music";

function AppIcon({ kind, label }: { kind: IconKind; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <IconTile kind={kind} />
      <span className="leading-none text-[8px] font-medium text-[#222]">{label}</span>
    </div>
  );
}

function DockIcon({ kind }: { kind: IconKind }) {
  return <IconTile kind={kind} small />;
}

function IconTile({ kind, small = false }: { kind: IconKind; small?: boolean }) {
  const sizeClass = small ? "h-[38px] w-[38px] rounded-[10px]" : "h-[44px] w-[44px] rounded-[11px]";
  const base = `flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.25)] ${sizeClass}`;

  switch (kind) {
    case "facetime":
      return (
        <div className={base} style={{ background: "linear-gradient(180deg,#34D058 0%,#1DB341 100%)" }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M17 10.5V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-3.5l4 4v-11l-4 4z" /></svg>
        </div>
      );
    case "calendar":
      return (
        <div className={`${base} !gap-0 flex-col bg-white`}>
          <span className="mt-[3px] text-[6px] font-bold leading-none tracking-tight text-red-500">TUESDAY</span>
          <span className="mt-[-1px] text-[18px] font-extralight leading-none text-[#111]">23</span>
        </div>
      );
    case "photos":
      return (
        <div className={`${base} relative overflow-hidden bg-white`}>
          <div
            className="absolute inset-[3px]"
            style={{
              background: "conic-gradient(from 0deg, #FFCA28, #FF5252, #AB47BC, #42A5F5, #66BB6A, #FFCA28)",
              WebkitMaskImage: "radial-gradient(circle, transparent 22%, black 23%)",
              maskImage: "radial-gradient(circle, transparent 22%, black 23%)",
              borderRadius: "50%",
            }}
          />
        </div>
      );
    case "camera":
      return (
        <div className={`${base} bg-white`}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#111" strokeWidth="1.7">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <circle cx="12" cy="13.5" r="3.5" fill="#111" />
            <rect x="8" y="5" width="5" height="3" rx="0.5" fill="#111" />
          </svg>
        </div>
      );
    case "clock":
      return (
        <div className={`${base} relative bg-black`}>
          <div className="absolute inset-[4px] rounded-full border border-white/70" />
          <div className="absolute left-1/2 top-1/2 h-[14px] w-[1.5px] origin-bottom -translate-x-1/2 -translate-y-full bg-white" />
          <div className="absolute left-1/2 top-1/2 h-[1.5px] w-[10px] origin-left -translate-y-1/2 bg-orange-400" />
        </div>
      );
    case "maps":
      return (
        <div className={base} style={{ background: "linear-gradient(180deg,#C8F5C0 0%,#9CE394 100%)" }}>
          <span className="font-display text-[18px] font-bold text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>V</span>
        </div>
      );
    case "weather":
      return (
        <div className={`${base} relative overflow-hidden`} style={{ background: "linear-gradient(180deg,#3AA5E0 0%,#1E88E5 100%)" }}>
          <div className="absolute right-[6px] top-[6px] h-[10px] w-[10px] rounded-full bg-yellow-300" />
          <div className="absolute bottom-[6px] left-[5px] h-[10px] w-[22px] rounded-full bg-white" />
          <span className="absolute left-1/2 top-[9px] -translate-x-1/2 text-[9px] font-bold text-white">69°</span>
        </div>
      );
    case "notes":
      return (
        <div className={`${base} relative overflow-hidden bg-white`}>
          <div className="absolute left-0 right-0 top-0 h-[9px] bg-yellow-400" />
          <div className="absolute inset-x-[5px] top-[13px] flex flex-col gap-[2px]">
            <div className="h-[1.5px] w-full rounded bg-[#222]/50" />
            <div className="h-[1.5px] w-[80%] rounded bg-[#222]/40" />
            <div className="h-[1.5px] w-[60%] rounded bg-[#222]/30" />
          </div>
        </div>
      );
    case "reminders":
      return (
        <div className={`${base} flex flex-col items-start justify-center gap-[3px] bg-white px-[6px]`}>
          <div className="flex items-center gap-1"><div className="h-[5px] w-[5px] rounded-full border border-blue-500" /><div className="h-[1.5px] w-[16px] rounded bg-[#222]/50" /></div>
          <div className="flex items-center gap-1"><div className="h-[5px] w-[5px] rounded-full border border-orange-500" /><div className="h-[1.5px] w-[12px] rounded bg-[#222]/50" /></div>
          <div className="flex items-center gap-1"><div className="h-[5px] w-[5px] rounded-full border border-red-500" /><div className="h-[1.5px] w-[18px] rounded bg-[#222]/50" /></div>
        </div>
      );
    case "stocks":
      return (
        <div className={`${base} relative overflow-hidden bg-black`}>
          <svg viewBox="0 0 40 40" className="h-full w-full">
            <polyline points="2,30 10,22 16,26 24,12 32,18 38,8" fill="none" stroke="#34D058" strokeWidth="2" />
          </svg>
        </div>
      );
    case "podcasts":
      return (
        <div className={base} style={{ background: "linear-gradient(180deg,#C77CFF 0%,#8A3FE0 100%)" }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><circle cx="12" cy="12" r="2.5" /><path d="M12 2a10 10 0 00-7 17.1l1.4-1.4A8 8 0 1120.1 8.4l1.4-1.4A10 10 0 0012 2z" opacity="0.9" /><path d="M12 6a6 6 0 00-4.2 10.2l1.4-1.4A4 4 0 1117.8 10l1.4-1.4A6 6 0 0012 6z" opacity="0.7" /></svg>
        </div>
      );
    case "tv":
      return (
        <div className={`${base} bg-black`}>
          <span className="font-display text-[14px] font-extrabold leading-none text-white">TV</span>
        </div>
      );
    case "phone":
      return (
        <div className={base} style={{ background: "linear-gradient(180deg,#34D058 0%,#1DB341 100%)" }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.3a11 11 0 003.4.6c.6 0 1 .4 1 1V20c0 .5-.4 1-1 1A17 17 0 013 4c0-.5.4-1 1-1h3.5c.5 0 1 .4 1 1 0 1.2.2 2.3.5 3.4.1.3 0 .7-.3 1l-2.1 2.1z" /></svg>
        </div>
      );
    case "siri":
      return (
        <div className={`${base} relative overflow-hidden bg-white`}>
          <div className="absolute inset-0 rounded-[10px] border-2 border-blue-500" />
          <svg viewBox="0 0 24 24" width="16" height="16" fill="url(#siriGrad)"><defs><linearGradient id="siriGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF4081" /><stop offset="100%" stopColor="#7C4DFF" /></linearGradient></defs><path d="M12 3c-1.7 0-3 1.3-3 3v6a3 3 0 006 0V6c0-1.7-1.3-3-3-3zm-7 9a7 7 0 0014 0h-2a5 5 0 01-10 0H5zm6 8v2h2v-2h-2z" /></svg>
        </div>
      );
    case "messages":
      return (
        <div className={base} style={{ background: "linear-gradient(180deg,#34D058 0%,#1DB341 100%)" }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.2 1 4.2 2.7 5.7L3.5 21l4.2-1.5A11 11 0 0012 20c5.5 0 10-3.8 10-8.5S17.5 3 12 3z" /></svg>
        </div>
      );
    case "music":
      return (
        <div className={base} style={{ background: "linear-gradient(180deg,#FF5E7E 0%,#F43352 100%)" }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M20 3L9 5v10.6A3.5 3.5 0 1010 18V8.4l8-1.5v7.7A3.5 3.5 0 1019 17V3z" /></svg>
        </div>
      );
  }
}
