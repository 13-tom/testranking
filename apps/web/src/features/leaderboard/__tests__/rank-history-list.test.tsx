import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { RankHistoryEntry } from "@board-ranking/shared";
import { RankHistoryList } from "../rank-history-list";

afterEach(cleanup);

describe("RankHistoryList", () => {
  it("renders the empty-state message when there is no history", () => {
    render(<RankHistoryList items={[]} />);
    expect(screen.getByText(/No rank history yet/)).toBeDefined();
  });

  it("renders one entry per rank history row", () => {
    const items: RankHistoryEntry[] = [
      { scope: "NATIONAL", scopeId: "INDIA", rank: 1, totalStudents: 2, period: "ALL_TIME", academicYear: "2026-27", testId: "test-1", computedAt: "2026-07-31T00:00:00.000Z" },
      { scope: "SCHOOL", scopeId: "school-1", rank: 1, totalStudents: 2, period: "ALL_TIME", academicYear: "2026-27", testId: "test-1", computedAt: "2026-07-31T00:00:00.000Z" },
    ];
    render(<RankHistoryList items={items} />);
    expect(screen.getByText("National")).toBeDefined();
    expect(screen.getByText("School")).toBeDefined();
    expect(screen.getAllByText("#1 of 2")).toHaveLength(2);
  });
});
