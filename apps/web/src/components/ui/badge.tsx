import type { HTMLAttributes } from "react";
import { clsx } from "./clsx";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "positive" | "negative" | "warning";
};

const TONE_CLASSES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  positive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  negative: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
