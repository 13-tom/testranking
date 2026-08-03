import type { AchievementItem } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";
import { clsx } from "@/components/ui/clsx";

export function AchievementList({ items }: { items: AchievementItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card
          key={item.code}
          className={clsx(
            "flex flex-col gap-2",
            item.earned
              ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40"
              : "border-slate-200 dark:border-slate-800",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <span className={clsx("text-3xl", !item.earned && "opacity-40 grayscale")}>{item.icon}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {item.category}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className={clsx("font-semibold", !item.earned && "text-slate-500 dark:text-slate-400")}>{item.title}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{item.description}</span>
          </div>
          <div className="mt-auto flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">+{item.studyPointsReward} pts</span>
            {item.earned && item.earnedAt ? (
              <span className="font-medium text-amber-700 dark:text-amber-400">Earned {new Date(item.earnedAt).toLocaleDateString()}</span>
            ) : (
              <span className="text-slate-400 dark:text-slate-600">Locked</span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
