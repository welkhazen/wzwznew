import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/backend/supabase/controllers/generalFeedController", () => ({
  fetchGeneralFeedPosts: vi.fn().mockResolvedValue([]),
  sendGeneralFeedPost: vi.fn(),
}));

import { GeneralFeedBox } from "@/components/dashboard/GeneralFeedBox";

describe("GeneralFeedBox", () => {
  it("uses the light-theme heading colors when the feed is rendered in light mode", async () => {
    render(<GeneralFeedBox userId="user-1" compact showHeader={false} isLight />);

    await waitFor(() => expect(screen.getByText("General Feed")).toBeInTheDocument());

    expect(screen.getByText("General Feed")).toHaveClass("text-slate-950");
  });
});
