"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ReviewQueueItem } from "@board-ranking/shared";
import { bulkApproveQuestions, bulkArchiveQuestions, bulkRejectQuestions, fetchReviewQueue } from "@/lib/api";
import { useAdminAuth } from "@/store/admin-auth-context";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ReviewQueueTable } from "@/features/admin-questions/review-queue-table";

export default function AdminQuestionsPage() {
  const { token } = useAdminAuth();
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [hasError, setHasError] = useState(false);

  function load() {
    if (!token) return;
    setIsLoading(true);
    setHasError(false);
    fetchReviewQueue(token)
      .then((res) => {
        if (res.success) {
          setItems(res.data.items);
          setNextCursor(res.data.nextCursor);
          setSelected(new Set());
        } else {
          setHasError(true);
        }
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [token]);

  async function loadMore() {
    if (!token || !nextCursor) return;
    setIsLoadingMore(true);
    const res = await fetchReviewQueue(token, nextCursor);
    if (res.success) {
      setItems((prev) => [...prev, ...res.data.items]);
      setNextCursor(res.data.nextCursor);
    }
    setIsLoadingMore(false);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulk(action: (token: string, ids: string[]) => Promise<{ success: boolean }>) {
    if (!token || selected.size === 0) return;
    setIsActing(true);
    await action(token, Array.from(selected));
    setIsActing(false);
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Question Review Queue</h1>
        <Link href="/admin/questions/new">
          <Button>New Question</Button>
        </Link>
      </div>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">{selected.size} selected</span>
          <Button variant="secondary" disabled={selected.size === 0 || isActing} onClick={() => runBulk(bulkApproveQuestions)}>
            Bulk Approve
          </Button>
          <Button variant="secondary" disabled={selected.size === 0 || isActing} onClick={() => runBulk(bulkRejectQuestions)}>
            Bulk Reject
          </Button>
          <Button variant="secondary" disabled={selected.size === 0 || isActing} onClick={() => runBulk(bulkArchiveQuestions)}>
            Bulk Archive
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : hasError ? (
          <p className="text-sm text-red-500">Could not load the review queue.</p>
        ) : (
          <>
            <ReviewQueueTable items={items} selected={selected} onToggle={toggle} />
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
