import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { AchievementItem } from "@board-ranking/shared";
import { AchievementList } from "../achievement-list";

afterEach(cleanup);

const items: AchievementItem[] = [
  {
    code: "FIRST_TEST",
    title: "First Steps",
    description: "Complete your first test.",
    icon: "🥇",
    category: "TESTS",
    studyPointsReward: 25,
    earned: true,
    earnedAt: "2026-07-31T00:00:00.000Z",
  },
  {
    code: "STREAK_30",
    title: "Unstoppable",
    description: "Maintain a 30-day study streak.",
    icon: "🔥",
    category: "STREAK",
    studyPointsReward: 200,
    earned: false,
    earnedAt: null,
  },
];

describe("AchievementList", () => {
  it("renders an earned achievement with its earned date", () => {
    render(<AchievementList items={items} />);
    expect(screen.getByText("First Steps")).toBeDefined();
    expect(screen.getByText(/Earned/)).toBeDefined();
  });

  it("renders a locked achievement as locked, with no earned date", () => {
    render(<AchievementList items={items} />);
    expect(screen.getByText("Unstoppable")).toBeDefined();
    expect(screen.getByText("Locked")).toBeDefined();
  });
});
