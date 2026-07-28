import type { DashboardRank } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";

export function RankCard({ rank }: { rank: DashboardRank }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs text-slate-500 dark:text-slate-400">Current Rank</span>
      {rank ? (
        <span className="text-2xl font-bold">
          #{rank.value} <span className="text-sm font-normal">({rank.scope})</span>
        </span>
      ) : (
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Rank not available yet — take a test to get ranked.
        </span>
      )}
    </Card>
  );
}
