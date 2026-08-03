import { Fraunces } from "next/font/google";

// Achievements page only (BR-045 frontend) — a characterful soft-serif
// for medal titles and the streak numeral, deliberately different from
// the rest of the app's plain system sans, reserved for this one page
// so the "merit wall" feels earned rather than another dashboard screen.
export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});
