import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { AdminStudentSummary } from "@board-ranking/shared";
import { StudentTable } from "../student-table";

afterEach(cleanup);

const items: AdminStudentSummary[] = [
  {
    id: "s1",
    email: "alice@example.com",
    fullName: "Alice",
    class: 10,
    schoolId: "sch1",
    schoolName: "Delhi Public School",
    studyPoints: 100,
    isSuspended: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("StudentTable", () => {
  it("renders the empty-state message when there are no students", () => {
    render(<StudentTable items={[]} />);
    expect(screen.getByText(/No students match these filters/)).toBeDefined();
  });

  it("renders one row per student", () => {
    render(<StudentTable items={items} />);
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("alice@example.com")).toBeDefined();
    expect(screen.getByText("Active")).toBeDefined();
  });
});
