import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReviewQueueItem } from "@board-ranking/shared";
import { ReviewQueueTable } from "../review-queue-table";

afterEach(cleanup);

const items: ReviewQueueItem[] = [
  { id: "q1", referenceCode: "10-MAT-01-001", questionText: "What is 2 + 2?", difficulty: "EASY", status: "IN_REVIEW", topicId: "t1", updatedAt: "2026-01-01T00:00:00.000Z" },
];

describe("ReviewQueueTable", () => {
  it("renders the empty-state message when there are no items", () => {
    render(<ReviewQueueTable items={[]} selected={new Set()} onToggle={vi.fn()} />);
    expect(screen.getByText(/No questions waiting for review/)).toBeDefined();
  });

  it("renders one row per item", () => {
    render(<ReviewQueueTable items={items} selected={new Set()} onToggle={vi.fn()} />);
    expect(screen.getByText("10-MAT-01-001")).toBeDefined();
    expect(screen.getByText("What is 2 + 2?")).toBeDefined();
    expect(screen.getByText("EASY")).toBeDefined();
  });
});
