import type { DashboardRecommendedTest } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function RecommendedTestCard({ recommendedTest }: { recommendedTest: DashboardRecommendedTest }) {
  return (
    <Card className="flex flex-col gap-2">
      <span className="font-semibold">Recommended Test</span>
      {recommendedTest ? (
        <>
          <span className="text-sm">{recommendedTest.testName}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400">{recommendedTest.reason}</p>
          <Button className="self-start">Start Now</Button>
        </>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Check back soon for a personalized recommendation.
        </p>
      )}
    </Card>
  );
}
