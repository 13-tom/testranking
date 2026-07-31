import type { MomentumLevel, TrendClassification, TrendOverviewResponseData } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";
import { clsx } from "@/components/ui/clsx";

const TREND_STYLE: Record<TrendClassification, { label: string; className: string }> = {
  RAPIDLY_IMPROVING: { label: "Rapidly Improving", className: "text-emerald-600 dark:text-emerald-400" },
  IMPROVING: { label: "Improving", className: "text-emerald-600 dark:text-emerald-400" },
  STABLE: { label: "Stable", className: "text-slate-500 dark:text-slate-400" },
  DECLINING: { label: "Declining", className: "text-red-500" },
  RAPIDLY_DECLINING: { label: "Rapidly Declining", className: "text-red-500" },
  INSUFFICIENT_DATA: { label: "Not Enough Data Yet", className: "text-slate-500 dark:text-slate-400" },
};

const MOMENTUM_STYLE: Record<MomentumLevel, { label: string; className: string }> = {
  SURGING: { label: "Surging", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  STRONG: { label: "Strong", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  MODERATE: { label: "Moderate", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  LOW: { label: "Low", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  STALLED: { label: "Stalled", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
};

export function TrendBadge({ trend }: { trend: TrendOverviewResponseData }) {
  const accuracyTrend = TREND_STYLE[trend.accuracyTrend];
  const momentum = MOMENTUM_STYLE[trend.momentum.level];

  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <span className="font-semibold">Accuracy Trend: </span>
        <span className={accuracyTrend.className}>{accuracyTrend.label}</span>
      </div>
      <span className={clsx("rounded-md px-3 py-1 text-sm font-medium", momentum.className)}>
        Momentum: {momentum.label}
      </span>
    </Card>
  );
}
