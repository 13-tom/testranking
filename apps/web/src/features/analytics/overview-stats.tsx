import type { StudentAnalyticsOverview } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";

function formatMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

export function OverviewStats({ overview }: { overview: StudentAnalyticsOverview }) {
  return (
    <Card className="flex flex-col gap-3">
      <span className="font-semibold">Performance Summary</span>
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Stat label="Tests Taken" value={String(overview.testsTaken)} />
        <Stat label="Accuracy" value={`${overview.accuracy.toFixed(1)}%`} />
        <Stat label="Average Score" value={overview.averageScore.toFixed(1)} />
        <Stat label="Best Score" value={overview.bestScore.toFixed(1)} />
        <Stat label="Best Percentage" value={`${overview.bestPercentage.toFixed(1)}%`} />
        <Stat label="Study Time" value={formatMinutes(overview.totalStudyTime)} />
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
