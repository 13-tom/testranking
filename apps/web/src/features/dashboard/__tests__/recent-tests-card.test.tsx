import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentTestsCard } from "../recent-tests-card";

describe("RecentTestsCard", () => {
  it("renders empty-state copy when there are no recent tests", () => {
    render(<RecentTestsCard recentTests={[]} />);
    expect(screen.getByText("No tests yet — take your first test soon!")).toBeDefined();
  });
});
