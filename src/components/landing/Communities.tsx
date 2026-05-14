import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";
import { getMessagesForCommunity, type ChatMessage } from "@/lib/communityMessages";
import isItJustMeVideo from "@/assets/itisjustme.webm";
import lebanonVideo from "@/assets/LB.mp4";
import speakYourTruthVideo from "@/assets/speakyourheart.webm";
import lateNightTalksVideo from "@/assets/2026-04-18 10_10_00.webm";

const communities = [
  {
    title: "Late Night Talks",
    description: "Founding community for deep, late-night conversations and real connection.",
    badge: "Founding Community",
    video: lateNightTalksVideo,
  },
  {
    title: "Speak Your Truth",
    description: "A safe space to share your story, be heard, and support others on their journey.",
    badge: "Active",
    video: speakYourTruthVideo,
  },
  {
    title: "Is It Just Me?",
    description: "Relatable moments, shared observations, and the quiet comfort of realizing you're not the only one.",
    badge: "Active",
    video: isItJustMeVideo,
  },
  {
    title: "Lebanon Initiatives",
    description: "Coming soon.",
    badge: "Waitlist",
    video: lebanonVideo,
    videoType: "video/mp4",
    waitlist: true,
  },
];

interface CommunitiesProps {
  onSignupClick: () => void;
}

export function Communities({ onSignupClick }: CommunitiesProps) {
  const sectionRef = useTrackSectionView("communities");
  const [waitlistConfirmed, setWaitlistConfirmed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [clickedCardRect, setClickedCardRect] = useState<DOMRect | null>(null);
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [anonInput, setAnonInput] = useState("");

  // Per-open random message pool (3 messages)
  const [selectedMessages, setSelectedMessages] = useState<ChatMessage[]>([]);
  const [messageAnonIds, setMessageAnonIds] = useState<string[]>([]);
  const selectedCountRef = useRef(0);

  // Messages the visitor has sent anonymously this session
  const [sentMessages, setSentMessages] = useState<ChatMessage[]>([]);
  const [anonId, setAnonId] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  function openCommunityPreview(e: React.MouseEvent<HTMLDivElement>, community: (typeof communities)[number]) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pool = getMessagesForCommunity(community.title);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const msgs = shuffled.slice(0, 3);

    setClickedCardRect(rect);
    setSelectedCommunity(community.title);
    setSelectedMessages(msgs);
    setMessageAnonIds(msgs.map(() => `ANON${Math.floor(10000 + Math.random() * 90000)}`));
    selectedCountRef.current = msgs.length;
    setSentMessages([]);
    setAnonId(`ANON${Math.floor(10000 + Math.random() * 90000)}`);
    setPreviewOpen(true);
    setVisibleMessages(0);
    setAnonInput("");

    if (community.waitlist) {
      setWaitlistConfirmed(true);
    }
  }

  useEffect(() => {
    if (!previewOpen) return;

    const timers: number[] = [];
    let messageIndex = 0;
    const count = selectedCountRef.current;

    const interval = window.setInterval(() => {
      messageIndex += 1;
      setVisibleMessages(messageIndex);
      if (messageIndex >= count) {
        window.clearInterval(interval);
      }
    }, 800);

    return () => {
      window.clearInterval(interval);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [previewOpen]);

  // Scroll to bottom when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages, sentMessages.length]);

  function sendMessage() {
    const text = anonInput.trim();
    if (!text) return;
    setSentMessages((prev) => [...prev, { user: anonId, text }]);
    setAnonInput("");
  }

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      id="communities"
      className="landing-section relative py-14 px-4 sm:py-20 sm:px-6 md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div
          className="relative overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 p-6 sm:p-8"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />

          {/* title */}
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="landing-heading">
              24/7 communities for real talk.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-raw-silver/50 sm:mt-4 sm:text-base">
              Start with 3 founding categories. Smaller micro-communities unlock as raW grows.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4">
          {communities.map((c) => (
            <div
              key={c.title}
              onClick={(e) => { if (c.waitlist) setWaitlistConfirmed(true); else openCommunityPreview(e, c); }}
              className="cursor-pointer"
            >
              <div
                className={
                  `rounded-2xl p-5 sm:p-6 relative overflow-visible transition-colors duration-200 ` +
                  (c.waitlist || c.video
                    ? "bg-transparent border-0 shadow-none"
                    : "border border-raw-border/50 bg-raw-surface/50 overflow-hidden")
                }
              >
                {c.waitlist ? (
                  <div className="relative flex h-full min-h-40 flex-col items-center justify-center overflow-hidden rounded-xl py-8 gap-3 text-center">
                    {c.video && (
                      <video
                        className="absolute inset-0 h-full w-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                      >
                        <source src={c.video} type={c.videoType ?? "video/webm"} />
                      </video>
                    )}
                    <div className="absolute inset-0 bg-raw-black/55" />
                    {waitlistConfirmed ? (
                      <div className="relative z-10 flex flex-col items-center justify-center gap-3">
                        <div className="text-3xl">🎉</div>
                        <h3 className="font-display text-sm tracking-wide text-raw-gold">
                          You're on the waitlist!
                        </h3>
                        <p className="max-w-[220px] text-xs leading-relaxed text-raw-silver/60">
                          Lebanon Initiatives is coming soon. We'll let you know when it launches.
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSignupClick();
                          }}
                          className="mt-4 rounded-full bg-raw-gold px-4 py-2 text-[11px] font-semibold text-raw-black transition hover:opacity-90"
                        >
                          Sign up to get notified
                        </button>
                      </div>
                    ) : (
                      <div className="relative z-10 flex flex-col items-center justify-center gap-3">
                        <span className="text-3xl">🔒</span>
                        <h3 className="font-display text-sm tracking-wide text-raw-text text-center">{c.title}</h3>
                        <span className="inline-block rounded-full border border-raw-gold/30 bg-raw-gold/5 px-2 py-0.5 text-[10px] font-medium tracking-wider text-raw-gold/70 uppercase">
                          Waitlist
                        </span>
                        <span className="text-[10px] text-raw-silver/40 text-center">Click to join waitlist</span>
                      </div>
                    )}
                  </div>
                ) : c.video ? (
                  <>
                    <video
                      className="rounded-xl w-full h-32 object-cover mb-3"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                    >
                      <source src={c.video} type={c.videoType ?? "video/webm"} />
                      Your browser does not support this video format.
                    </video>
                    <h3 className="font-display text-sm tracking-wide text-raw-text">{c.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-raw-silver/50">{c.description}</p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 inline-block rounded-full border border-raw-gold/20 bg-raw-gold/5 px-3 py-1">
                      <span className="text-[10px] font-medium tracking-wider text-raw-gold/70 uppercase">{c.badge}</span>
                    </div>
                    <h3 className="font-display text-sm tracking-wide text-raw-text">{c.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-raw-silver/50">{c.description}</p>
                  </>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Communities worldwide */}
        <div
          className="relative mx-auto mt-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 px-6 py-10 text-center sm:mt-16 sm:px-10 sm:py-14"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />
          <p className="font-display text-[10px] tracking-[0.3em] uppercase text-raw-silver/40">
            Communities worldwide
          </p>
          <h3 className="mt-3 landing-heading">
            Where mind meets heart.
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-raw-silver/50">
            Real connection starts when intellect and emotion align. raW communities
            are built for people who think deeply and feel deeply — worldwide, 24/7.
          </p>
        </div>
      </div>

      {previewOpen && selectedCommunity && clickedCardRect && createPortal(
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setPreviewOpen(false)} />

          {/* popup */}
          <div
            className="fixed z-[9999] w-[22rem]"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              animation: "popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            }}
          >
            <div
              className="relative p-px shadow-[0_28px_70px_rgba(0,0,0,0.72),0_0_40px_rgba(241,196,45,0.18)]"
              style={{
                borderRadius: "1.25rem",
                background:
                  "linear-gradient(155deg, rgba(241,196,45,0.72), rgba(235,235,235,0.18) 28%, rgba(35,35,35,0.5) 52%, rgba(241,196,45,0.64))",
              }}
            >
              <div
                className="chat-popup-interior relative overflow-hidden"
                style={{ borderRadius: "calc(1.25rem - 1px)" }}
              >
                <div className="chat-popup-dots pointer-events-none absolute inset-0 opacity-100" />
                <div className="chat-popup-vignette pointer-events-none absolute inset-0" />
                <div
                  className="pointer-events-none absolute inset-[5px] border border-raw-gold/[0.12]"
                  style={{ borderRadius: "calc(1.25rem - 6px)" }}
                />

                <div className="relative px-5 pt-5 pb-5">
                  {/* close */}
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(false)}
                    className="absolute right-4 top-4 z-10 rounded-full border border-raw-gold/20 bg-black/60 px-3 py-1.5 text-[11px] uppercase tracking-widest text-raw-silver/70 transition hover:border-raw-gold/40 hover:text-raw-silver"
                  >
                    ✕
                  </button>

                  <div className="flex w-full items-center gap-3 mb-4">
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-raw-gold/55 to-raw-gold/20" />
                    <span className="h-1.5 w-1.5 rotate-45 bg-raw-gold shadow-[0_0_10px_rgba(241,196,45,0.9)]" />
                    <span className="h-px flex-1 bg-gradient-to-l from-transparent via-raw-gold/55 to-raw-gold/20" />
                  </div>

                  <p className="text-center text-[10px] uppercase tracking-[0.3em] text-raw-gold/70">
                    Live chat preview
                  </p>
                  <h3 className="mt-1 text-center font-display text-lg tracking-wide text-raw-text">
                    {selectedCommunity}
                  </h3>

                  {/* messages feed */}
                  <div className="mt-4 max-h-52 space-y-2 overflow-y-auto pr-1">
                    {/* auto messages */}
                    {selectedMessages.slice(0, visibleMessages).map((msg, idx) => (
                      <div
                        key={idx}
                        className="chat-popup-bubble animate-fadeInUp rounded-2xl border border-raw-gold/15 p-3"
                        style={{ animationDelay: `${idx * 120}ms` }}
                      >
                        <p className="text-[10px] uppercase tracking-[0.22em] text-raw-gold/60">{messageAnonIds[idx] ?? msg.user}</p>
                        <p className="mt-1 text-sm leading-relaxed text-raw-text/90">{msg.text}</p>
                      </div>
                    ))}

                    {/* loading dots while messages are appearing */}
                    {visibleMessages < selectedMessages.length && (
                      <div className="chat-popup-reply flex items-center gap-2 rounded-2xl border border-raw-gold/10 p-3">
                        <span className="h-2 w-2 rounded-full bg-raw-gold/70 animate-pulse" />
                        <span className="h-2 w-2 rounded-full bg-raw-gold/70 animate-pulse" style={{ animationDelay: "160ms" }} />
                        <span className="h-2 w-2 rounded-full bg-raw-gold/70 animate-pulse" style={{ animationDelay: "320ms" }} />
                      </div>
                    )}

                    {/* anonymous user messages */}
                    {sentMessages.map((msg, idx) => (
                      <div
                        key={`sent-${idx}`}
                        className="animate-fadeInUp rounded-2xl border border-raw-gold/30 bg-raw-gold/5 p-3"
                      >
                        <p className="text-[10px] uppercase tracking-[0.22em] text-raw-gold/80">{msg.user}</p>
                        <p className="mt-1 text-sm leading-relaxed text-raw-text/90">{msg.text}</p>
                      </div>
                    ))}

                    <div ref={messagesEndRef} />
                  </div>

                  <div className="flex w-full items-center gap-3 my-4">
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-raw-gold/30 to-raw-gold/10" />
                    <span className="h-1 w-1 rotate-45 bg-raw-gold/40" />
                    <span className="h-px flex-1 bg-gradient-to-l from-transparent via-raw-gold/30 to-raw-gold/10" />
                  </div>

                  {/* anonymous input — no redirect */}
                  <div className="chat-popup-input flex items-center gap-2 rounded-xl border border-raw-gold/20 px-3 py-2">
                    <span className="flex-shrink-0 text-[10px] uppercase tracking-[0.2em] text-raw-gold/50">{anonId || "You"}</span>
                    <input
                      type="text"
                      value={anonInput}
                      onChange={(e) => setAnonInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                      placeholder="Write anonymously..."
                      className="min-w-0 flex-1 bg-transparent text-sm text-raw-text/90 placeholder:text-raw-silver/30 outline-none"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      className="flex-shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-raw-black transition"
                      style={{
                        background: "linear-gradient(145deg, rgba(241,196,45,0.95), rgba(180,140,20,0.9))",
                        border: "1px solid rgba(241,196,45,0.6)",
                        boxShadow: "0 0 14px rgba(241,196,45,0.25)",
                      }}
                    >
                      Send
                    </button>
                  </div>

                  {/* join button — redirects to signup */}
                  <button
                    type="button"
                    onClick={() => {
                      onSignupClick();
                      setPreviewOpen(false);
                    }}
                    className="mt-3 w-full rounded-xl py-3 text-sm font-semibold uppercase tracking-wider text-raw-black transition hover:brightness-110"
                    style={{
                      background: "linear-gradient(160deg, #f7d557, #d29b12)",
                      border: "1px solid rgba(241,196,45,0.62)",
                      boxShadow: "inset 0 0 0 1px rgba(255,241,178,0.12), 0 0 18px rgba(241,196,45,0.2)",
                    }}
                  >
                    Join the room
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </section>
  );
}
