"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { ProfileCard } from "@/features/dashboard/profile-card";
import { StatsRow } from "@/features/dashboard/stats-row";
import { RankCard } from "@/features/dashboard/rank-card";
import { RecentTestsCard } from "@/features/dashboard/recent-tests-card";
import { TodaysGoalCard } from "@/features/dashboard/todays-goal-card";
import { RecommendedTestCard } from "@/features/dashboard/recommended-test-card";
import { DashboardSkeleton } from "@/features/dashboard/dashboard-skeleton";

export default function DashboardPage() {
  const { token } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(token as string),
    enabled: !!token,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data?.success) {
    return <p className="text-sm text-red-500">Could not load your dashboard. Please try again.</p>;
  }

  const dashboard = data.data;

  return (
    <div className="flex flex-col gap-4">
      <ProfileCard profile={dashboard.profile} />
      <StatsRow
        studyPoints={dashboard.studyPoints}
        studyLevel={dashboard.studyLevel}
        studyLevelProgress={dashboard.studyLevelProgress}
        studyStreak={dashboard.studyStreak}
      />
      <RankCard rank={dashboard.rank} />
      <RecentTestsCard recentTests={dashboard.recentTests} />
      <TodaysGoalCard goal={dashboard.todaysGoal} />
      <RecommendedTestCard recommendedTest={dashboard.recommendedTest} />
    </div>
  );
}
