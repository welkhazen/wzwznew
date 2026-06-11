import { afterEach, describe, expect, it, vi } from "vitest";
import { getDailyResetStartMs, getTodayKey } from "@/store/useRawStore.storage";

describe("daily poll reset boundary", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the previous poll day before 10 PM", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T21:59:00"));

    expect(getTodayKey()).toBe("2026-06-10");
  });

  it("starts a new poll day at 10 PM", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T22:00:00"));

    expect(getTodayKey()).toBe("2026-06-11");
    expect(new Date(getDailyResetStartMs()).getHours()).toBe(22);
  });
});
