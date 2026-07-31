"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@board-ranking/shared";
import {
  fetchAnalyticsOverview,
  fetchProgress,
  fetchStrengths,
  fetchTodayRecommendations,
  fetchTrendOverview,
  fetchWeaknesses,
} from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewStats } from "@/features/analytics/overview-stats";
import { StrengthWeaknessList } from "@/features/analytics/strength-weakness-list";
import { StudyHistoryChart } from "@/features/analytics/study-history-chart";
import { TrendBadge } from "@/features/analytics/trend-badge";
import { RecommendationList } from "@/features/analytics/recommendation-list";

export default function AnalyticsPage() {
  const { token } = useAuth();
  const enabled = !!token;

  const overviewQuery = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => fetchAnalyticsOverview(token as string),
    enabled,
  });
  const strengthsQuery = useQuery({
    queryKey: ["analytics-strengths"],
    queryFn: () => fetchStrengths(token as string),
    enabled,
  });
  const weaknessesQuery = useQuery({
    queryKey: ["analytics-weaknesses"],
    queryFn: () => fetchWeaknesses(token as string),
    enabled,
  });
  const progressQuery = useQuery({
    queryKey: ["analytics-progress"],
    queryFn: () => fetchProgress(token as string),
    enabled,
  });
  const trendQuery = useQuery({
    queryKey: ["analytics-trend"],
    queryFn: () => fetchTrendOverview(token as string),
    enabled,
  });
  const recommendationsQuery = useQuery({
    queryKey: ["analytics-recommendations"],
    queryFn: () => fetchTodayRecommendations(token as string),
    enabled,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Analytics</h1>

      <Section query={overviewQuery} render={(data) => <OverviewStats overview={data} />} />
      <Section query={trendQuery} render={(data) => <TrendBadge trend={data} />} />
      <Section
        query={strengthsQuery}
        render={(data) => (
          <StrengthWeaknessList title="Strong Areas" data={data} emptyMessage="Take a few tests to see your strong areas here." />
        )}
      />
      <Section
        query={weaknessesQuery}
        render={(data) => (
          <StrengthWeaknessList title="Weak Areas" data={data} emptyMessage="Take a few tests to see your weak areas here." />
        )}
      />
      <Section query={progressQuery} render={(data) => <StudyHistoryChart points={data} />} />
      <Section query={recommendationsQuery} render={(data) => <RecommendationList items={data} />} />
    </div>
  );
}

function Section<T>({
  query,
  render,
}: {
  query: { data?: ApiResponse<T>; isLoading: boolean; isError: boolean };
  render: (data: T) => React.ReactNode;
}) {
  if (query.isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }
  if (query.isError || !query.data?.success) {
    return <p className="text-sm text-red-500">Could not load this section. Please try again.</p>;
  }
  return <>{render(query.data.data)}</>;
}
