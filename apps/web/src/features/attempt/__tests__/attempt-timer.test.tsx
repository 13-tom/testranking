import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AttemptTimer } from "../attempt-timer";

describe("AttemptTimer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the initial remaining time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const expiresAt = new Date("2026-01-01T00:02:00Z").toISOString();

    render(<AttemptTimer expiresAt={expiresAt} onExpire={vi.fn()} />);
    expect(screen.getByRole("timer").textContent).toBe("2:00");
  });

  it("calls onExpire once the countdown reaches zero", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const expiresAt = new Date("2026-01-01T00:00:02Z").toISOString();
    const onExpire = vi.fn();

    render(<AttemptTimer expiresAt={expiresAt} onExpire={onExpire} />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
