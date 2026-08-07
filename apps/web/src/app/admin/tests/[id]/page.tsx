"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@board-ranking/shared";
import { fetchAdminTestDetail, publishTest, unpublishTest, updateAdminTest } from "@/lib/api";
import { useAdminAuth } from "@/store/admin-auth-context";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestForm } from "@/features/admin-tests/test-form";

export default function AdminTestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAdminAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const queryKey = ["admin-test", id];
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => fetchAdminTestDetail(token as string, id),
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

  const handlePublish = () => runAction(() => publishTest(token as string, id));
  const handleUnpublish = () => runAction(() => unpublishTest(token as string, id));

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
        <p className="text-sm text-red-500">Could not load this test.</p>
      </Card>
    );
  }

  const test = data.data;
  const dist = test.difficultyDistribution;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{test.name}</h1>
          <Badge tone={test.status === "ACTIVE" ? "positive" : test.status === "ARCHIVED" ? "negative" : "neutral"}>{test.status}</Badge>
        </div>
        {test.status === "DRAFT" && <Button onClick={handlePublish}>Publish</Button>}
        {test.status === "ACTIVE" && (
          <Button variant="secondary" onClick={handleUnpublish}>
            Unpublish
          </Button>
        )}
      </div>

      {actionError && <p className="text-sm text-red-500">{actionError}</p>}

      <Card>
        <TestForm
          submitLabel="Save Changes"
          defaultValues={{
            name: test.name,
            boardId: test.boardId,
            class: test.class,
            category: test.category,
            questionCount: test.questionCount,
            duration: test.duration,
            passingMarks: test.passingMarks,
            easyPercent: dist.EASY ?? 0,
            mediumPercent: dist.MEDIUM ?? 0,
            hardPercent: dist.HARD ?? 0,
            subjectIds: test.subjectIds,
          }}
          onSubmit={async (input) => {
            const res = await updateAdminTest(token as string, id, input);
            if (res.success) refresh();
            return res;
          }}
        />
      </Card>
    </div>
  );
}
