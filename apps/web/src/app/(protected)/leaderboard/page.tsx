"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LeaderboardEntry } from "@board-ranking/shared";
import { fetchLeaderboard, fetchRankHistory } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScopeTabs, type ScopeOption } from "@/features/leaderboard/scope-tabs";
import { LeaderboardTable } from "@/features/leaderboard/leaderboard-table";
import { RankHistoryList } from "@/features/leaderboard/rank-history-list";

const NATIONAL_OPTION: ScopeOption = { scope: "NATIONAL", scopeId: "INDIA", label: "India" };

export default function LeaderboardPage() {
  const { token, user, studentProfile } = useAuth();
  const enabled = !!token && !!user;

  const rankHistoryQuery = useQuery({
    queryKey: ["rank-history", user?.id],
    queryFn: () => fetchRankHistory(token as string, user!.id),
    enabled,
  });

  // My District/My State tabs are derived from the student's own past
  // rank-history entries (their scopeId isn't exposed anywhere else on the
  // frontend) — only shown once the student has been ranked at least once.
  const scopeOptions = useMemo<ScopeOption[]>(() => {
    const options = [NATIONAL_OPTION];
    if (studentProfile?.schoolId) {
      options.push({ scope: "SCHOOL", scopeId: studentProfile.schoolId, label: "My School" });
    }
    if (rankHistoryQuery.data?.success) {
      const district = rankHistoryQuery.data.data.items.find((item) => item.scope === "DISTRICT");
      const state = rankHistoryQuery.data.data.items.find((item) => item.scope === "STATE");
      if (district) options.push({ scope: "DISTRICT", scopeId: district.scopeId, label: "My District" });
      if (state) options.push({ scope: "STATE", scopeId: state.scopeId, label: "My State" });
    }
    return options;
  }, [studentProfile?.schoolId, rankHistoryQuery.data]);

  const [active, setActive] = useState<ScopeOption>(NATIONAL_OPTION);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setIsLoading(true);
    setHasError(false);
    fetchLeaderboard(token, active.scope, active.scopeId)
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setEntries(res.data.items);
          setNextCursor(res.data.nextCursor);
          setTotalStudents(res.data.totalStudents);
        } else {
          setHasError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, active]);

  async function loadMore() {
    if (!token || !nextCursor) return;
    setIsLoadingMore(true);
    const res = await fetchLeaderboard(token, active.scope, active.scopeId, nextCursor);
    if (res.success) {
      setEntries((prev) => [...prev, ...res.data.items]);
      setNextCursor(res.data.nextCursor);
    }
    setIsLoadingMore(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Leaderboard</h1>

      <ScopeTabs options={scopeOptions} active={active} onSelect={setActive} />

      <Card className="flex flex-col gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {totalStudents} student{totalStudents === 1 ? "" : "s"} ranked
        </p>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : hasError ? (
          <p className="text-sm text-red-500">Could not load the leaderboard. Please try again.</p>
        ) : (
          <>
            <LeaderboardTable entries={entries} currentStudentId={user?.id ?? ""} />
            {nextCursor && (
              <Button variant="secondary" onClick={loadMore} disabled={isLoadingMore}>
                {isLoadingMore ? "Loading..." : "Load more"}
              </Button>
            )}
          </>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Rank History</h2>
        {rankHistoryQuery.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : rankHistoryQuery.isError || !rankHistoryQuery.data?.success ? (
          <p className="text-sm text-red-500">Could not load rank history.</p>
        ) : (
          <RankHistoryList items={rankHistoryQuery.data.data.items} />
        )}
      </Card>
    </div>
  );
}
