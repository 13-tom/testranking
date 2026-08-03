"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@board-ranking/shared";
import { fetchAchievements, fetchStreak } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AchievementList } from "@/features/gamification/achievement-list";
import { StreakCalendar } from "@/features/gamification/streak-calendar";

export default function AchievementsPage() {
  const { token } = useAuth();
  const enabled = !!token;

  const achievementsQuery = useQuery({
    queryKey: ["achievements"],
    queryFn: () => fetchAchievements(token as string),
    enabled,
  });
  const streakQuery = useQuery({
    queryKey: ["streak"],
    queryFn: () => fetchStreak(token as string),
    enabled,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Achievements</h1>

      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Study Streak</h2>
        <Section
          query={streakQuery}
          render={(data) => <StreakCalendar currentStreak={data.currentStreak} longestStreak={data.longestStreak} history={data.history} />}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Badges</h2>
        <Section query={achievementsQuery} render={(data) => <AchievementList items={data.items} />} />
      </Card>
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
