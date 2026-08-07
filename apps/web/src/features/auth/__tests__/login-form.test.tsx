import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "../login-form";
import { AuthProvider } from "@/store/auth-context";
import { AdminAuthProvider } from "@/store/admin-auth-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("LoginForm", () => {
  it("renders email, password fields and a submit button", () => {
    render(
      <AuthProvider>
        <AdminAuthProvider>
          <LoginForm />
        </AdminAuthProvider>
      </AuthProvider>,
    );

    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(screen.getByRole("button", { name: "Log in" })).toBeDefined();
  });
});
