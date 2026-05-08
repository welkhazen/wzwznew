import { Suspense, lazy } from "react";
import { PasswordGate } from "@/components/PasswordGate";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const FAQ = lazy(() => import("./pages/FAQ"));
const AskAI = lazy(() => import("./pages/AskAI"));
const Security = lazy(() => import("./pages/Security"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const PollsExplained = lazy(() => import("./pages/PollsExplained"));
const CommunitiesExplained = lazy(() => import("./pages/CommunitiesExplained"));
const PitchSelector = lazy(() => import("./pages/PitchSelector"));
const PitchV1 = lazy(() => import("./pages/PitchV1"));
const PitchV2 = lazy(() => import("./pages/PitchV2"));
const TestPollOnboarding = import.meta.env.DEV
  ? lazy(() => import("./pages/_TestPollOnboarding"))
  : null;

const routeFallback = <div className="sr-only">Loading page…</div>;

const App = () => (
  <PasswordGate>
  <ErrorBoundary>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AnalyticsProvider>
            <Suspense fallback={routeFallback}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Index />} />
                <Route path="/dashboard/communities/:communityId" element={<Index />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/polls-explained" element={<PollsExplained />} />
                <Route path="/communities-explained" element={<CommunitiesExplained />} />
                <Route path="/ask" element={<AskAI />} />
                <Route path="/security" element={<Security />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/pitch" element={<PitchSelector />} />
                <Route path="/pitch-v1" element={<PitchV1 />} />
                <Route path="/pitch-v2" element={<PitchV2 />} />
                {TestPollOnboarding && (
                  <Route path="/__test/poll-onboarding" element={<TestPollOnboarding />} />
                )}
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AnalyticsProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </ErrorBoundary>
  </PasswordGate>
);

export default App;
