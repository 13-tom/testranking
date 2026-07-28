import type { DashboardRecentTest } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";

export function RecentTestsCard({ recentTests }: { recentTests: DashboardRecentTest[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <span className="font-semibold">Recent Tests</span>
      {recentTests.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No tests yet — take your first test soon!
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {recentTests.map((test) => (
            <li key={test.id} className="flex items-center justify-between text-sm">
              <span>{test.testName}</span>
              <span className="text-slate-500 dark:text-slate-400">
                {test.score} pts · {test.accuracy}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
