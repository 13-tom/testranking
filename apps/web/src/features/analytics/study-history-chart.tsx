import type { ProgressSnapshotPoint } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";

export function StudyHistoryChart({ points }: { points: ProgressSnapshotPoint[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <span className="font-semibold">Study History</span>
      {points.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No study history yet — take a test to start building your progress chart.
        </p>
      ) : (
        <div className="flex items-end gap-2 overflow-x-auto pb-1">
          {points.map((point) => (
            <div key={point.date} className="flex flex-col items-center gap-1">
              <div className="flex h-24 w-8 items-end rounded-sm bg-slate-100 dark:bg-slate-800">
                <div
                  className="w-full rounded-sm bg-slate-900 dark:bg-white"
                  style={{ height: `${Math.max(2, Math.min(100, point.accuracy))}%` }}
                  title={`${point.accuracy.toFixed(1)}% accuracy on ${point.date}`}
                />
              </div>
              <span className="w-12 truncate text-center text-[10px] text-slate-500 dark:text-slate-400">
                {point.date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
