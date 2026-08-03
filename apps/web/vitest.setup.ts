import { vi } from "vitest";

// next/font/google relies on a build-time (webpack/SWC) transform that
// Vitest's Vite pipeline doesn't apply, so the real call throws outside a
// Next.js build. Stub it with the same shape (className/variable) so
// components using it render normally under test.
vi.mock("next/font/google", () => ({
  Fraunces: () => ({ className: "font-fraunces-mock", variable: "--font-fraunces-mock" }),
}));
