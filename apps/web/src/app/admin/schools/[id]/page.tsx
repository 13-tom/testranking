"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@board-ranking/shared";
import { activateSchool, archiveSchool, fetchAdminSchool, fetchSchoolStats } from "@/lib/api";
import { useAdminAuth } from "@/store/admin-auth-context";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminSchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAdminAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const queryKey = ["admin-school", id];
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => fetchAdminSchool(token as string, id),
    enabled: !!token && !!id,
  });

  const statsQuery = useQuery({
    queryKey: ["admin-school-stats", id],
    queryFn: () => fetchSchoolStats(token as string, id),
    enabled: !!token && !!id,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey });
  }

  async function runAction(action: () => Promise<ApiResponse<unknown>>) {
    setActionError(null);
    const res = await action();
    if (!res.success) {
      setActionError(res.message || (res.errors ?? []).join(", ") || "That action failed");
      return;
    }
    refresh();
  }

  const handleArchive = () => runAction(() => archiveSchool(token as string, id));
  const handleActivate = () => runAction(() => activateSchool(token as string, id));

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data?.success) {
    return (
      <Card>
        <p className="text-sm text-red-500">Could not load this school.</p>
      </Card>
    );
  }

  const school = data.data;
  const stats = statsQuery.data?.success ? statsQuery.data.data : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{school.schoolName}</h1>
          <Badge tone={school.isActive ? "positive" : "negative"}>{school.isActive ? "Active" : "Archived"}</Badge>
        </div>
        {school.isActive ? (
          <Button variant="secondary" onClick={handleArchive}>
            Archive
          </Button>
        ) : (
          <Button variant="secondary" onClick={handleActivate}>
            Activate
          </Button>
        )}
      </div>

      {actionError && <p className="text-sm text-red-500">{actionError}</p>}

      <Card className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Board" value={school.board} />
        <Field label="City" value={school.city} />
        <Field label="District" value={school.district} />
        <Field label="State" value={school.state} />
        <Field label="Country" value={school.country} />
        <Field label="Postal Code" value={school.postalCode} />
      </Card>

      <Card className="grid grid-cols-2 gap-4">
        <Field label="Students" value={stats?.studentCount ?? "—"} />
        <Field label="Evaluated Attempts" value={stats?.evaluatedAttemptCount ?? "—"} />
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
