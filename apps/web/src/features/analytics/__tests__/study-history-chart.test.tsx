import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ProgressSnapshotPoint } from "@board-ranking/shared";
import { StudyHistoryChart } from "../study-history-chart";

afterEach(cleanup);

describe("StudyHistoryChart", () => {
  it("renders the empty-state message when there is no history", () => {
    render(<StudyHistoryChart points={[]} />);
    expect(screen.getByText(/No study history yet/)).toBeDefined();
  });

  it("renders one bar per data point", () => {
    const points: ProgressSnapshotPoint[] = [
      { date: "2026-01-01", rank: null, accuracy: 50, averageScore: 5, averagePercentage: 50, studyPoints: 10, testsTaken: 1 },
      { date: "2026-01-02", rank: null, accuracy: 75, averageScore: 7.5, averagePercentage: 75, studyPoints: 20, testsTaken: 2 },
    ];
    render(<StudyHistoryChart points={points} />);
    expect(screen.getByText("01-01")).toBeDefined();
    expect(screen.getByText("01-02")).toBeDefined();
  });
});
