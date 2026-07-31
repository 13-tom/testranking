import type { AttemptResultResponseData } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";

export function ResultSummary({ result }: { result: AttemptResultResponseData }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xl font-semibold">{result.testName}</span>
        <span
          className={
            result.passed
              ? "rounded-md bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300"
          }
        >
          {result.passed ? "Passed" : "Not Passed"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Stat label="Score" value={`${result.score} / ${result.totalMarks}`} />
        <Stat label="Percentage" value={`${result.percentage.toFixed(1)}%`} />
        <Stat label="Accuracy" value={`${result.accuracy.toFixed(1)}%`} />
        <Stat label="Correct" value={String(result.correctCount)} />
        <Stat label="Wrong" value={String(result.wrongCount)} />
        <Stat label="Unanswered" value={String(result.unansweredCount)} />
        <Stat label="Study Points" value={String(result.studyPointsEarned)} />
        <Stat label="Passing Marks" value={String(result.passingMarks)} />
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
