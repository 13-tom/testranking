import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QuestionNavigator, type NavigatorQuestion } from "../question-navigator";

afterEach(cleanup);

const questions: NavigatorQuestion[] = [
  { questionId: "q1", displayOrder: 1, selectedOptionKey: "A", markedForReview: false },
  { questionId: "q2", displayOrder: 2, selectedOptionKey: null, markedForReview: false },
  { questionId: "q3", displayOrder: 3, selectedOptionKey: null, markedForReview: true },
];

describe("QuestionNavigator", () => {
  it("renders one button per question", () => {
    render(<QuestionNavigator questions={questions} currentIndex={0} onSelect={vi.fn()} />);
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });

  it("marks the current question button as aria-current", () => {
    render(<QuestionNavigator questions={questions} currentIndex={1} onSelect={vi.fn()} />);
    expect(screen.getByText("2").getAttribute("aria-current")).toBe("true");
    expect(screen.getByText("1").getAttribute("aria-current")).toBe("false");
  });
});
