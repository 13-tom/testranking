"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@board-ranking/shared";
import { fetchAdminStudent, reactivateStudent } from "@/lib/api";
import { useAdminAuth } from "@/store/admin-auth-context";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuspendModal } from "@/features/admin-students/suspend-modal";
import { GrantPointsModal } from "@/features/admin-students/grant-points-modal";

export default function AdminStudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAdminAuth();
  const queryClient = useQueryClient();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const queryKey = ["admin-student", id];
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => fetchAdminStudent(token as string, id),
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

  const handleReactivate = () => runAction(() => reactivateStudent(token as string, id));

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
        <p className="text-sm text-red-500">Could not load this student.</p>
      </Card>
    );
  }

  const student = data.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{student.fullName}</h1>
          <Badge tone={student.isSuspended ? "negative" : "positive"}>{student.isSuspended ? "Suspended" : "Active"}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setGrantOpen(true)}>
            Grant Points
          </Button>
          {student.isSuspended ? (
            <Button variant="secondary" onClick={handleReactivate}>
              Reactivate
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setSuspendOpen(true)}>
              Suspend
            </Button>
          )}
        </div>
      </div>

      {actionError && <p className="text-sm text-red-500">{actionError}</p>}

      <Card className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Email" value={student.email} />
        <Field label="Class" value={student.class} />
        <Field label="School" value={student.schoolName ?? "—"} />
        <Field label="Study Points" value={student.studyPoints} />
        <Field label="Study Level" value={student.studyLevel} />
        <Field label="Current Streak" value={student.studyStreak} />
        <Field label="Longest Streak" value={student.longestStreak} />
        <Field label="Profile Completion" value={`${student.profileCompletion}%`} />
        <Field label="Last Login" value={student.lastLogin ?? "—"} />
        {student.isSuspended && <Field label="Suspension Reason" value={student.suspendedReason ?? "—"} />}
      </Card>

      <SuspendModal studentId={id} open={suspendOpen} onClose={() => setSuspendOpen(false)} onSuspended={refresh} />
      <GrantPointsModal studentId={id} open={grantOpen} onClose={() => setGrantOpen(false)} onGranted={refresh} />
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
