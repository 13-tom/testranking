import type { DashboardStudyLevelProgress } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";

type StatsRowProps = {
  studyPoints: number;
  studyLevel: number;
  studyLevelProgress: DashboardStudyLevelProgress;
  studyStreak: number;
};

export function StatsRow({ studyPoints, studyLevel, studyLevelProgress, studyStreak }: StatsRowProps) {
  // Level 100 is the cap (computeStudyLevel) — nothing left to progress toward.
  const percentToNext =
    studyLevelProgress.totalXpForNext > 0
      ? Math.round(((studyLevelProgress.totalXpForNext - studyLevelProgress.xpToNext) / studyLevelProgress.totalXpForNext) * 100)
      : 100;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 dark:text-slate-400">Study Points</span>
        <span className="text-2xl font-bold">{studyPoints}</span>
      </Card>
      <Card className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 dark:text-slate-400">Study Level</span>
        <span className="text-2xl font-bold">{studyLevel}</span>
        {studyLevelProgress.totalXpForNext > 0 ? (
          <>
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                style={{ width: `${percentToNext}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{studyLevelProgress.xpToNext} points to next level</span>
          </>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400">Max level reached</span>
        )}
      </Card>
      <Card className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 dark:text-slate-400">Study Streak</span>
        <span className="text-2xl font-bold">{studyStreak} days</span>
      </Card>
    </div>
  );
}
