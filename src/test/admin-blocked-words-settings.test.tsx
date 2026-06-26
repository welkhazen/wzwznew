import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminBlockedWordsSettings } from "@/components/dashboard/AdminBlockedWordsSettings";
import {
  addBlockedWord,
  fetchBlockedWords,
  removeBlockedWord,
} from "@/lib/api/blockedWords";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/api/blockedWords", () => ({
  fetchBlockedWords: vi.fn(),
  addBlockedWord: vi.fn(),
  removeBlockedWord: vi.fn(),
}));

const fetchBlockedWordsMock = vi.mocked(fetchBlockedWords);
const addBlockedWordMock = vi.mocked(addBlockedWord);
const removeBlockedWordMock = vi.mocked(removeBlockedWord);

describe("AdminBlockedWordsSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchBlockedWordsMock.mockResolvedValue([
      {
        id: "word-1",
        term: "adminterm",
        normalizedTerm: "adminterm",
        createdAt: "2026-06-26T10:00:00.000Z",
        createdBy: "admin-1",
      },
    ]);
  });

  it("loads and shows blocked words", async () => {
    render(<AdminBlockedWordsSettings />);

    expect(await screen.findByText("adminterm")).toBeInTheDocument();
    expect(fetchBlockedWordsMock).toHaveBeenCalledTimes(1);
  });

  it("saves a blocked word and shows confirmation", async () => {
    addBlockedWordMock.mockResolvedValue({
      id: "word-2",
      term: "newterm",
      normalizedTerm: "newterm",
      createdAt: "2026-06-26T11:00:00.000Z",
      createdBy: "admin-1",
    });

    render(<AdminBlockedWordsSettings />);
    fireEvent.change(await screen.findByPlaceholderText("Word or phrase"), { target: { value: "newterm" } });
    fireEvent.click(screen.getByRole("button", { name: /save word/i }));

    expect(await screen.findByText("newterm")).toBeInTheDocument();
    expect(screen.getByText("Saved. The list is up to date.")).toBeInTheDocument();
    expect(addBlockedWordMock).toHaveBeenCalledWith("newterm");
  });

  it("removes a blocked word", async () => {
    removeBlockedWordMock.mockResolvedValue(undefined);

    render(<AdminBlockedWordsSettings />);
    fireEvent.click(await screen.findByRole("button", { name: /remove adminterm/i }));

    await waitFor(() => {
      expect(screen.queryByText("adminterm")).not.toBeInTheDocument();
    });
    expect(removeBlockedWordMock).toHaveBeenCalledWith("word-1");
  });
});
