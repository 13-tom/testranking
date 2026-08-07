"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@board-ranking/shared";
import { approveQuestion, archiveQuestion, fetchAdminQuestion, rejectQuestion, updateAdminQuestion } from "@/lib/api";
import { useAdminAuth } from "@/store/admin-auth-context";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionEditForm } from "@/features/admin-questions/question-edit-form";
import { QuestionOptionsEditor } from "@/features/admin-questions/question-options-editor";

export default function AdminQuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAdminAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const queryKey = ["admin-question", id];
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => fetchAdminQuestion(token as string, id),
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

  const handleApprove = () => runAction(() => approveQuestion(token as string, id));
  const handleReject = () => runAction(() => rejectQuestion(token as string, id));
  const handleArchive = () => runAction(() => archiveQuestion(token as string, id));
  const handlePublish = () => runAction(() => updateAdminQuestion(token as string, id, { status: "PUBLISHED" }));
  const handleSubmitForReview = () => runAction(() => updateAdminQuestion(token as string, id, { status: "IN_REVIEW" }));

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
        <p className="text-sm text-red-500">Could not load this question.</p>
      </Card>
    );
  }

  const question = data.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{question.referenceCode}</h1>
          <Badge tone={question.status === "PUBLISHED" ? "positive" : question.status === "REJECTED" ? "negative" : "neutral"}>
            {question.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {question.status === "DRAFT" && (
            <Button variant="secondary" onClick={handleSubmitForReview}>
              Submit for Review
            </Button>
          )}
          {question.status === "IN_REVIEW" && (
            <>
              <Button variant="secondary" onClick={handleApprove}>
                Approve
              </Button>
              <Button variant="secondary" onClick={handleReject}>
                Reject
              </Button>
            </>
          )}
          {(question.status === "APPROVED" || question.status === "DRAFT" || question.status === "IN_REVIEW") && (
            <Button variant="secondary" onClick={handlePublish}>
              Publish
            </Button>
          )}
          {(question.status === "APPROVED" || question.status === "PUBLISHED") && (
            <Button variant="secondary" onClick={handleArchive}>
              Archive
            </Button>
          )}
        </div>
      </div>

      {actionError && <p className="text-sm text-red-500">{actionError}</p>}

      <Card>
        <QuestionEditForm question={question} onSaved={refresh} />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">Options</h2>
        <QuestionOptionsEditor questionId={question.id} options={question.options} onChanged={refresh} />
      </Card>
    </div>
  );
}
