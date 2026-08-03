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

  it("renders current and longest streak counts with a filled day per history entry", () => {
    const history: StreakHistoryPoint[] = [
      { date: "2026-07-30T00:00:00.000Z", completed: true },
      { date: "2026-07-31T00:00:00.000Z", completed: true },
    ];
    render(<StreakCalendar currentStreak={2} longestStreak={5} history={history} />);
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getByText("Current streak")).toBeDefined();
    expect(screen.getByText("Longest streak")).toBeDefined();
  });
});
