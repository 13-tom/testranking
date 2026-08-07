import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { AdminSchoolSummary } from "@board-ranking/shared";
import { SchoolTable } from "../school-table";

afterEach(cleanup);

const items: AdminSchoolSummary[] = [
  { id: "sch1", schoolName: "Delhi Public School", city: "Delhi", district: "New Delhi", state: "Delhi", isActive: true },
];

describe("SchoolTable", () => {
  it("renders the empty-state message when there are no schools", () => {
    render(<SchoolTable items={[]} />);
    expect(screen.getByText(/No schools match these filters/)).toBeDefined();
  });

  it("renders one row per school", () => {
    render(<SchoolTable items={items} />);
    expect(screen.getByText("Delhi Public School")).toBeDefined();
    expect(screen.getByText("Active")).toBeDefined();
  });
});
