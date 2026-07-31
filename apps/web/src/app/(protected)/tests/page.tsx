"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTests } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { TestCard } from "@/features/tests/test-card";
import { TestListSkeleton } from "@/features/tests/test-list-skeleton";

export default function TestsPage() {
  const { token, studentProfile } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tests", studentProfile?.class],
    queryFn: () => fetchTests(token as string, { class: studentProfile?.class }),
    enabled: !!token,
  });

  if (isLoading) {
    return <TestListSkeleton />;
  }

  if (isError || !data?.success) {
    return <p className="text-sm text-red-500">Could not load tests. Please try again.</p>;
  }

  const tests = data.data;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Tests</h1>
      {tests.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No tests available for your class yet — check back soon!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {tests.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
      )}
    </div>
  );
}
