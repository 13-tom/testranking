import type { PriorityLevel, RecommendationItem } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";
import { clsx } from "@/components/ui/clsx";

const PRIORITY_STYLE: Record<PriorityLevel, string> = {
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  HIGH: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  MEDIUM: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  VERY_LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function RecommendationList({ items }: { items: RecommendationItem[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <span className="font-semibold">Recommended Practice</span>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Take a few tests to unlock personalized practice recommendations.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={`${item.entityType}-${item.id}`}
              className="flex flex-col gap-1 rounded-md border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{item.name}</span>
                <span className={clsx("rounded-md px-2 py-0.5 text-xs font-medium", PRIORITY_STYLE[item.priority])}>
                  {item.priority}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{item.reason}</p>
              <span className="text-sm">
                {item.suggestedActivity} · {item.suggestedQuantity} questions · ~{item.estimatedTimeMinutes} min
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
