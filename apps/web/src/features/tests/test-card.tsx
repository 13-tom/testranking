import Link from "next/link";
import type { TestSummary } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";

export function TestCard({ test }: { test: TestSummary }) {
  return (
    <Link href={`/tests/${test.id}`}>
      <Card className="flex flex-col gap-2 transition-colors hover:border-slate-400 dark:hover:border-slate-600">
        <span className="font-semibold">{test.name}</span>
        {test.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{test.description}</p>
        )}
        <div className="flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span>{test.category}</span>
          <span>{test.questionCount} questions</span>
          <span>{test.duration} min</span>
          <span>Pass: {test.passingMarks}</span>
        </div>
      </Card>
    </Link>
  );
}
