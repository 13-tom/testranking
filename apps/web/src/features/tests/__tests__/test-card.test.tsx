import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { TestSummary } from "@board-ranking/shared";
import { TestCard } from "../test-card";

const baseTest: TestSummary = {
  id: "test-1",
  name: "Full Practice Test",
  description: "Covers all chapters",
  boardId: "board-1",
  class: 10,
  category: "SUBJECT",
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
};

describe("TestCard", () => {
  it("renders the test name, category, and question count", () => {
    render(<TestCard test={baseTest} />);
    expect(screen.getByText("Full Practice Test")).toBeDefined();
    expect(screen.getByText("SUBJECT")).toBeDefined();
    expect(screen.getByText("10 questions")).toBeDefined();
  });
});
