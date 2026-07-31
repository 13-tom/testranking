import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { AnalyticsDashboardStrengths } from "@board-ranking/shared";
import { StrengthWeaknessList } from "../strength-weakness-list";

afterEach(cleanup);

describe("StrengthWeaknessList", () => {
  it("renders the empty-state message when there are no entries", () => {
    const empty: AnalyticsDashboardStrengths = { subjects: [], chapters: [], topics: [] };
    render(<StrengthWeaknessList title="Strong Areas" data={empty} emptyMessage="Nothing here yet." />);
    expect(screen.getByText("Nothing here yet.")).toBeDefined();
  });

  it("renders entries grouped by type", () => {
    const data: AnalyticsDashboardStrengths = {
      subjects: [{ type: "SUBJECT", id: "s1", name: "Mathematics", score: 82.5 }],
      chapters: [],
      topics: [],
    };
    render(<StrengthWeaknessList title="Strong Areas" data={data} emptyMessage="Nothing here yet." />);
    expect(screen.getByText("Mathematics")).toBeDefined();
    expect(screen.getByText("82.5")).toBeDefined();
  });
});
