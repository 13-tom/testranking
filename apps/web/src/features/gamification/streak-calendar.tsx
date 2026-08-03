import type { StreakHistoryPoint } from "@board-ranking/shared";
import { clsx } from "@/components/ui/clsx";

export function StreakCalendar({
  currentStreak,
  longestStreak,
  history,
}: {
  currentStreak: number;
  longestStreak: number;
  history: StreakHistoryPoint[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-6">
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{currentStreak}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Current streak</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{longestStreak}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Longest streak</span>
        </div>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No study activity yet — take a test today to start your streak.</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {history.map((point) => (
            <div
              key={point.date}
              title={new Date(point.date).toLocaleDateString()}
              className={clsx("h-6 w-6 rounded", point.completed ? "bg-gradient-to-br from-orange-500 to-amber-400" : "bg-slate-200 dark:bg-slate-800")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
