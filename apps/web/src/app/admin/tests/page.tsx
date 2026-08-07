"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TestStatus, TestSummary } from "@board-ranking/shared";
import { fetchAdminTests } from "@/lib/api";
import { useAdminAuth } from "@/store/admin-auth-context";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TestTable } from "@/features/admin-tests/test-table";

export default function AdminTestsPage() {
  const { token } = useAdminAuth();
  const [status, setStatus] = useState<TestStatus | "">("");
  const [items, setItems] = useState<TestSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);

  function load() {
    if (!token) return;
    setIsLoading(true);
    setHasError(false);
    fetchAdminTests(token, { status: status || undefined })
      .then((res) => {
        if (res.success) {
          setItems(res.data.items);
          setNextCursor(res.data.nextCursor);
        } else {
          setHasError(true);
        }
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [token, status]);

  async function loadMore() {
    if (!token || !nextCursor) return;
    setIsLoadingMore(true);
    const res = await fetchAdminTests(token, { cursor: nextCursor, status: status || undefined });
    if (res.success) {
      setItems((prev) => [...prev, ...res.data.items]);
      setNextCursor(res.data.nextCursor);
    }
    setIsLoadingMore(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tests</h1>
        <Link href="/admin/tests/new">
          <Button>New Test</Button>
        </Link>
      </div>

      <Card className="flex flex-col gap-3">
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as TestStatus | "")}>
              <option value="">All</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : hasError ? (
          <p className="text-sm text-red-500">Could not load tests.</p>
        ) : (
          <>
            <TestTable items={items} />
            {nextCursor && (
              <Button variant="secondary" onClick={loadMore} disabled={isLoadingMore}>
                {isLoadingMore ? "Loading..." : "Load more"}
              </Button>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
