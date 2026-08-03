import type { AchievementItem } from "@board-ranking/shared";
import { fraunces } from "@/lib/fonts";
import { clsx } from "@/components/ui/clsx";

export function AchievementList({ items }: { items: AchievementItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.code} className="flex flex-col items-center gap-2 text-center">
          <div
            className={clsx(
              "flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl transition-transform duration-150 hover:scale-105 motion-reduce:hover:scale-100",
              item.earned
                ? "bg-gradient-to-br from-marigold-200 to-marigold-500 shadow-[0_2px_10px_rgba(217,143,36,0.5)] ring-2 ring-marigold-500/40 dark:from-marigold-600 dark:to-marigold-900"
                : "bg-slate-100 dark:bg-slate-800",
            )}
          >
            <span className={clsx(!item.earned && "opacity-40 grayscale")}>{item.icon}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span
              className={clsx(
                fraunces.className,
                "text-sm font-medium leading-tight",
                item.earned ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600",
              )}
            >
              {item.title}
            </span>
            <span className="text-[11px] leading-snug text-slate-500 dark:text-slate-500">{item.description}</span>
            <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-600">{item.category}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-600">+{item.studyPointsReward} pts</span>
            {item.earned && item.earnedAt ? (
              <span className="text-[10px] font-medium text-marigold-600 dark:text-marigold-400">Earned {new Date(item.earnedAt).toLocaleDateString()}</span>
            ) : (
              <span className="text-[10px] text-slate-400 dark:text-slate-600">Locked</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
