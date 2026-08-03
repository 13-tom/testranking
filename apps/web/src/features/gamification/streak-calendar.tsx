import type { StreakHistoryPoint } from "@board-ranking/shared";
import { fraunces } from "@/lib/fonts";
import { clsx } from "@/components/ui/clsx";

const WEEKS = 4;
const DAYS_PER_WEEK = 7;
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dateKey(d: Date): string {
  return utcMidnight(d).toISOString().slice(0, 10);
}

function addUtcDays(d: Date, amount: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + amount);
  return copy;
}

type Cell = { key: string; day: number; completed: boolean; isToday: boolean; isFuture: boolean };

function buildGrid(history: StreakHistoryPoint[]): Cell[] {
  const completedKeys = new Set(history.map((point) => dateKey(new Date(point.date))));
  const today = utcMidnight(new Date());
  const todayKey = dateKey(today);
  const mondayFirstDow = (today.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  const thisWeekSunday = addUtcDays(today, 6 - mondayFirstDow);
  const gridStart = addUtcDays(thisWeekSunday, -(WEEKS * DAYS_PER_WEEK - 1));

  return Array.from({ length: WEEKS * DAYS_PER_WEEK }, (_, i) => {
    const date = addUtcDays(gridStart, i);
    const key = dateKey(date);
    return {
      key,
      day: date.getUTCDate(),
      completed: completedKeys.has(key),
      isToday: key === todayKey,
      isFuture: date.getTime() > today.getTime(),
    };
  });
}

export function StreakCalendar({
  currentStreak,
  longestStreak,
  history,
}: {
  currentStreak: number;
  longestStreak: number;
  history: StreakHistoryPoint[];
}) {
  if (history.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No study activity yet — take a test today to start your streak.</p>;
  }

  const cells = buildGrid(history);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
      <div className="flex shrink-0 gap-6 sm:flex-col sm:gap-4">
        <div className="flex flex-col">
          <span className={clsx(fraunces.className, "text-4xl leading-none text-orange-600 dark:text-orange-400")}>{currentStreak}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">day streak</span>
        </div>
        <div className="flex flex-col">
          <span className={clsx(fraunces.className, "text-2xl leading-none text-slate-700 dark:text-slate-300")}>{longestStreak}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">longest streak</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-7 gap-1">
          {DAY_LABELS.map((label, i) => (
            <span key={i} className="text-center text-[10px] font-medium uppercase text-slate-400 dark:text-slate-600">
              {label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => (
            <div
              key={cell.key}
              title={cell.key}
              className={clsx(
                "flex h-7 w-7 items-center justify-center rounded text-[10px] font-medium",
                cell.isFuture
                  ? "border border-dashed border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-700"
                  : cell.completed
                    ? "bg-gradient-to-br from-orange-500 to-marigold-400 text-white shadow-sm"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600",
                cell.isToday && "ring-2 ring-offset-1 ring-orange-500 dark:ring-offset-slate-900",
              )}
            >
              {cell.day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
