import type { DashboardGoal } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";

export function TodaysGoalCard({ goal }: { goal: DashboardGoal }) {
  return (
    <Card className="flex flex-col gap-2">
      <span className="font-semibold">Today&apos;s Goal</span>
      <span className="text-sm">{goal.title}</span>
      <p className="text-xs text-slate-500 dark:text-slate-400">{goal.description}</p>
      {goal.progress !== null && goal.target !== null && (
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-2 rounded-full bg-emerald-500"
            style={{ width: `${(goal.progress / goal.target) * 100}%` }}
          />
        </div>
      )}
    </Card>
  );
}
