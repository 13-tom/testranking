import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Badge } from "../badge";

afterEach(cleanup);

describe("Badge", () => {
  it("renders its label text", () => {
    render(<Badge>PUBLISHED</Badge>);
    expect(screen.getByText("PUBLISHED")).toBeDefined();
  });
});
