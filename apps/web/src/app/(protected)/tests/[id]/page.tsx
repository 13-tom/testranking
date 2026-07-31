"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchTestDetail, startAttempt } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["test", id],
    queryFn: () => fetchTestDetail(token as string, id),
    enabled: !!token,
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isError || !data?.success) {
    return <p className="text-sm text-red-500">Could not load this test. Please try again.</p>;
  }

  const test = data.data;

  async function handleStart() {
    setStartError(null);
    setIsStarting(true);
    const res = await startAttempt(token as string, id);
    setIsStarting(false);
    if (res.success) {
      router.push(`/attempts/${res.data.attemptId}`);
    } else {
      setStartError(res.message || "Could not start this test. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <span className="text-xl font-semibold">{test.name}</span>
        {test.description && <p className="text-sm text-slate-500 dark:text-slate-400">{test.description}</p>}
        {test.instructions && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{test.instructions}</p>
        )}
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-500 dark:text-slate-400 sm:grid-cols-4">
          <span>Category: {test.category}</span>
          <span>Questions: {test.questionCount}</span>
          <span>Duration: {test.duration} min</span>
          <span>Passing marks: {test.passingMarks}</span>
        </div>

        {startError && <p className="text-sm text-red-500">{startError}</p>}

        <Button onClick={handleStart} disabled={isStarting} className="self-start">
          {isStarting ? "Starting..." : "Start Test"}
        </Button>
      </Card>
    </div>
  );
}
