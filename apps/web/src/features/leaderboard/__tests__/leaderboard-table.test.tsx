import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { LeaderboardEntry } from "@board-ranking/shared";
import { LeaderboardTable } from "../leaderboard-table";

afterEach(cleanup);

const entries: LeaderboardEntry[] = [
  { rank: 1, studentId: "s1", studentName: "Alice", class: 10, profileImage: null, studyPoints: 100, schoolName: "Delhi Public School" },
  { rank: 2, studentId: "s2", studentName: "Bob", class: 10, profileImage: null, studyPoints: 50, schoolName: null },
];

describe("LeaderboardTable", () => {
  it("renders the empty-state message when there are no entries", () => {
    render(<LeaderboardTable entries={[]} currentStudentId="s1" />);
    expect(screen.getByText(/No one has been ranked here yet/)).toBeDefined();
  });

  it("renders one row per entry and marks the current student", () => {
    render(<LeaderboardTable entries={entries} currentStudentId="s2" />);
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("(You)")).toBeDefined();
    expect(screen.getByText("Delhi Public School")).toBeDefined();
  });
});
