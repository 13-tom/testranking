"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@board-ranking/shared";
import { fetchAchievements, fetchStreak } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fraunces } from "@/lib/fonts";
import { clsx } from "@/components/ui/clsx";
import { AchievementList } from "@/features/gamification/achievement-list";
import { StreakCalendar } from "@/features/gamification/streak-calendar";

export default function AchievementsPage() {
  const { token, studentProfile } = useAuth();
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

  const earnedCount = achievementsQuery.data?.success ? achievementsQuery.data.data.items.filter((item) => item.earned).length : null;
  const totalCount = achievementsQuery.data?.success ? achievementsQuery.data.data.items.length : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className={clsx(fraunces.className, "text-3xl font-semibold")}>Achievements</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {earnedCount !== null
            ? `You've earned ${studentProfile?.studyPoints ?? 0} Study Points and unlocked ${earnedCount} of ${totalCount} badges.`
            : "Your Study Points, streak, and earned badges, all in one place."}
        </p>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Study Streak</h2>
        <Section
          query={streakQuery}
          render={(data) => <StreakCalendar currentStreak={data.currentStreak} longestStreak={data.longestStreak} history={data.history} />}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Badges</h2>
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
