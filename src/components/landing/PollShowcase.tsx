 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/src/components/landing/PollShowcase.tsx b/src/components/landing/PollShowcase.tsx
index 0c0a71103010d1fc784943b9306b3ccf3d0bdf8c..c21e9b5ffd7ee703e11c4e1acd8e43fa674887e2 100644
--- a/src/components/landing/PollShowcase.tsx
+++ b/src/components/landing/PollShowcase.tsx
@@ -100,75 +100,51 @@ const SWIPE_THRESHOLD = 80;
 const VELOCITY_THRESHOLD = 400;
 
 export function PollShowcase({ initialOpen = true, onResolved }: PollShowcaseProps) {
   const [index, setIndex] = useState(0);
   const [answers, setAnswers] = useState<Record<number, "yes" | "no">>({});
   const [open, setOpen] = useState(initialOpen);
   const [mounted, setMounted] = useState(false);
   const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
   const [extraComments, setExtraComments] = useState<Record<number, string[]>>({});
   const isDragging = useRef(false);
   const x = useMotionValue(0);
   const rotate = useTransform(x, [-200, 0, 200], [-14, 0, 14]);
   const yesOpacity = useTransform(x, [20, 90], [0, 1]);
   const noOpacity = useTransform(x, [-90, -20], [1, 0]);
   const yesBg = useTransform(
     x,
     [0, 120],
     ["rgba(16,185,129,0)", "rgba(16,185,129,0.18)"]
   );
   const noBg = useTransform(
     x,
     [-120, 0],
     ["rgba(239,68,68,0.18)", "rgba(239,68,68,0)"]
   );
 
-  const pollsQuery = useQuery({
-    queryKey: ["polls", "showcase"],
-    retry: false,
-    queryFn: async (): Promise<Poll[]> => {
-      const res = await apiRequest<{ polls: Poll[] }>("/api/polls/random?limit=3");
-      return res.polls;
-    },
-  });
-
-  const POLLS: PollData[] =
-    pollsQuery.data && pollsQuery.data.length > 0
-      ? apiPollsToPollData(pollsQuery.data)
-      : FALLBACK_POLLS;
-
-  const poll = POLLS[index] as PollData | undefined;
-
-  const commentsQuery = useQuery({
-    queryKey: ["poll-comments", poll?.id],
-    enabled: !!poll?.id,
-    retry: false,
-    queryFn: async () => {
-      const res = await apiRequest<{ comments: string[] }>(`/api/polls/${poll!.id}/comments`);
-      return res.comments;
-    },
-  });
+  const POLLS: PollData[] = FALLBACK_POLLS;
 
   useEffect(() => {
     setMounted(true);
     const handler = () => setOpen(true);
     window.addEventListener("open-poll-showcase", handler);
     return () => window.removeEventListener("open-poll-showcase", handler);
   }, []);
 
   const closeShowcase = useCallback(() => {
     setOpen(false);
     onResolved?.();
   }, [onResolved]);
 
   // Reset card position whenever the poll changes
   useEffect(() => {
     x.set(0);
   }, [index, x]);
 
   const handleAnswer = useCallback(
     (choice: "yes" | "no") => {
       setAnswers((prev) => {
         const next = { ...prev, [index]: choice };
         if (Object.keys(next).length >= POLLS.length) {
           window.setTimeout(closeShowcase, 350);
         }
@@ -183,67 +159,60 @@ export function PollShowcase({ initialOpen = true, onResolved }: PollShowcasePro
       const { offset, velocity } = info;
       if (offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) {
         animate(x, 600, { type: "spring", stiffness: 180, damping: 22 }).then(
           () => { handleAnswer("yes"); x.set(0); }
         );
       } else if (offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) {
         animate(x, -600, { type: "spring", stiffness: 180, damping: 22 }).then(
           () => { handleAnswer("no"); x.set(0); }
         );
       } else {
         animate(x, 0, { type: "spring", stiffness: 400, damping: 28 });
       }
       isDragging.current = false;
     },
     [handleAnswer, x]
   );
 
   if (!mounted || !open) return null;
 
   const total = POLLS.length;
   const canPrev = index > 0;
   const canNext = index < total - 1;
   const selected = answers[index];
   const currentPoll = POLLS[index];
   const showComments = !!selected;
-  const backendComments = commentsQuery.data ?? [];
-  const allComments = [...backendComments, ...(extraComments[index] ?? [])];
+  const allComments = extraComments[index] ?? [];
 
   const handleSubmitComment = () => {
     const text = (commentInputs[index] ?? "").trim();
     if (!text) return;
     setExtraComments((prev) => ({
       ...prev,
       [index]: [...(prev[index] ?? []), text],
     }));
     setCommentInputs((prev) => ({ ...prev, [index]: "" }));
-    if (currentPoll?.id) {
-      apiRequest(`/api/polls/${currentPoll.id}/comments`, {
-        method: "POST",
-        body: JSON.stringify({ text }),
-      }).catch(() => {/* optimistic — already added locally */});
-    }
   };
 
   const overlay = (
     <div
       className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 px-4 backdrop-blur-md overflow-y-auto py-8"
       style={{
         backgroundImage:
           "radial-gradient(circle at 1px 1px, rgba(217,217,217,0.06) 1px, transparent 0)",
         backgroundSize: "14px 14px",
       }}
       onClick={closeShowcase}
     >
       <div className="relative w-full max-w-md" onClick={(event) => event.stopPropagation()}>
         <button
           type="button"
           onClick={closeShowcase}
           aria-label="Close poll preview"
           className="absolute -top-12 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white/70 transition hover:bg-white/10 hover:text-white"
         >
           <X className="h-4 w-4" />
         </button>
 
         {/* Counter and progress dashes */}
         <div className="mb-4 flex flex-col items-center">
           <div className="flex items-center gap-3">
 
EOF
)
