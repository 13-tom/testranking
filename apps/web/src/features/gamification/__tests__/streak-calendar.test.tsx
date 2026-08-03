import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { StreakHistoryPoint } from "@board-ranking/shared";
import { StreakCalendar } from "../streak-calendar";

afterEach(cleanup);

describe("StreakCalendar", () => {
  it("renders the empty-state message when there is no history", () => {
    render(<StreakCalendar currentStreak={0} longestStreak={0} history={[]} />);
    expect(screen.getByText(/No study activity yet/)).toBeDefined();
  });

  it("renders the streak labels and a grid cell per history entry", () => {
    const history: StreakHistoryPoint[] = [
      { date: "2026-07-30T00:00:00.000Z", completed: true },
      { date: "2026-07-31T00:00:00.000Z", completed: true },
    ];
    const { container } = render(<StreakCalendar currentStreak={2} longestStreak={5} history={history} />);
    expect(screen.getByText("day streak")).toBeDefined();
    expect(screen.getByText("longest streak")).toBeDefined();
    expect(container.querySelector('[title="2026-07-30"]')).not.toBeNull();
    expect(container.querySelector('[title="2026-07-31"]')).not.toBeNull();
  });
});
