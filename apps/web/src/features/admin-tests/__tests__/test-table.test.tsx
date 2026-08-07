import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { TestSummary } from "@board-ranking/shared";
import { TestTable } from "../test-table";

afterEach(cleanup);

const items: TestSummary[] = [
  {
    id: "t1",
    name: "Algebra Basics",
    description: null,
    boardId: "b1",
    class: 10,
    category: "CHAPTER",
    mode: "PRACTICE",
    duration: 30,
    questionCount: 10,
    positiveMarks: 1,
    negativeMarks: 0,
    passingMarks: 4,
    visibility: "PUBLIC",
    status: "ACTIVE",
    startTime: null,
    endTime: null,
    maxAttempts: 1,
    instructions: null,
    calculatorAllowed: false,
    reviewAllowed: true,
  },
];

describe("TestTable", () => {
  it("renders the empty-state message when there are no tests", () => {
    render(<TestTable items={[]} />);
    expect(screen.getByText(/No tests match these filters/)).toBeDefined();
  });

  it("renders one row per test", () => {
    render(<TestTable items={items} />);
    expect(screen.getByText("Algebra Basics")).toBeDefined();
    expect(screen.getByText("ACTIVE")).toBeDefined();
  });
});
