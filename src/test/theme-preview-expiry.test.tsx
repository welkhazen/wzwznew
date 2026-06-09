import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { ThemeCustomizer } from "@/components/theme/ThemeCustomizer";
import { ACCENT_PRESETS } from "@/providers/theme-context";

const setAccent = vi.fn();

vi.mock("@/providers/useTheme", () => ({
  useTheme: () => ({
    mode: "dark",
    accent: "gold",
    accentPresets: ACCENT_PRESETS,
    setMode: vi.fn(),
    setAccent,
  }),
}));

vi.mock("@/store/useRawStore", () => ({
  useRawStore: () => ({ user: null, tokenBalance: 0, addTokens: vi.fn() }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

vi.mock("@/lib/api/tokens", () => ({ spendTokens: vi.fn() }));
vi.mock("@/components/ui/use-toast", () => ({ toast: vi.fn() }));
vi.mock("@/components/ui/avatar-figure", () => ({ AvatarFigure: () => <span>Avatar</span> }));

function expectRootAccent(rgb: string) {
  expect(document.documentElement.style.getPropertyValue("--raw-accent")).toBe(rgb);
}

describe("theme accent previews", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    setAccent.mockClear();
    document.documentElement.removeAttribute("style");
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("reverts the landing theme preview after one minute", () => {
    render(<ThemeCustomizer placement="inline" triggerStyle="compact" />);

    fireEvent.click(screen.getAllByRole("button")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Preview or buy Coral accent" }));
    fireEvent.click(screen.getByRole("button", { name: "View" }));

    expectRootAccent("255 125 92");
    expect(screen.queryByRole("button", { name: "View" })).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(59_999));
    expectRootAccent("255 125 92");
    expect(screen.queryByRole("button", { name: "View" })).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expectRootAccent("241 196 45");
    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
  });

  it("reverts the dashboard Appearance preview after one minute", () => {
    render(
      <DashboardNav
        userId="user-1"
        username="tester"
        avatarLevel={1}
        onProfileClick={vi.fn()}
        onBillingClick={vi.fn()}
        onLogout={vi.fn()}
        communities={[]}
      />,
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: "Open profile menu" }), { button: 0, ctrlKey: false });
    fireEvent.click(screen.getByRole("button", { name: "Appearance" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview or buy Coral accent" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview color" }));

    expectRootAccent("255 125 92");

    act(() => vi.advanceTimersByTime(60_000));
    expectRootAccent("241 196 45");
    expect(setAccent).not.toHaveBeenCalled();
  });
});
