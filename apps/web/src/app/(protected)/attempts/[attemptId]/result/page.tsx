"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchAttemptResult } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultSummary } from "@/features/attempt/result-summary";
import { ResultQuestionReview } from "@/features/attempt/result-question-review";

export default function AttemptResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { token } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["attempt-result", attemptId],
    queryFn: () => fetchAttemptResult(token as string, attemptId),
    enabled: !!token,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !data?.success) {
    return (
      <p className="text-sm text-red-500">
        Result not available yet. If you just submitted, refresh in a moment.
      </p>
    );
  }

  const result = data.data;

  return (
    <div className="flex flex-col gap-4">
      <ResultSummary result={result} />
      <ResultQuestionReview questions={result.questions} />
    </div>
  );
}
