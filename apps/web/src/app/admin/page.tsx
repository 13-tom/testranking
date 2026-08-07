"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminOverview } from "@/lib/api";
import { useAdminAuth } from "@/store/admin-auth-context";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/features/admin-overview/stat-card";

export default function AdminOverviewPage() {
  const { token } = useAdminAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchAdminOverview(token as string),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !data?.success) {
    return (
      <Card>
        <p className="text-sm text-red-500">Could not load the platform overview.</p>
      </Card>
    );
  }

  const overview = data.data;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Overview</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Students" value={overview.students.total} />
        <StatCard label="Suspended Students" value={overview.students.suspended} />
        <StatCard label="Schools" value={overview.schools.total} />
        <StatCard label="Active Schools" value={overview.schools.active} />
        <StatCard label="Evaluated Attempts" value={overview.evaluatedAttempts} />
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">Questions by Status</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(overview.questions).map(([status, count]) => (
            <StatCard key={status} label={status} value={count} />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">Tests by Status</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(overview.tests).map(([status, count]) => (
            <StatCard key={status} label={status} value={count} />
          ))}
        </div>
      </Card>
    </div>
  );
}
