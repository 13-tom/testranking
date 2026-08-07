"use client";

import { useEffect, useState } from "react";
import type { AdminSchoolSummary } from "@board-ranking/shared";
import { fetchAdminSchools } from "@/lib/api";
import { useAdminAuth } from "@/store/admin-auth-context";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SchoolTable } from "@/features/admin-schools/school-table";

export default function AdminSchoolsPage() {
  const { token } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<AdminSchoolSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);

  function load() {
    if (!token) return;
    setIsLoading(true);
    setHasError(false);
    fetchAdminSchools(token, { search: search || undefined })
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

  useEffect(load, [token]);

  async function loadMore() {
    if (!token || !nextCursor) return;
    setIsLoadingMore(true);
    const res = await fetchAdminSchools(token, { cursor: nextCursor, search: search || undefined });
    if (res.success) {
      setItems((prev) => [...prev, ...res.data.items]);
      setNextCursor(res.data.nextCursor);
    }
    setIsLoadingMore(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Schools</h1>

      <Card className="flex flex-col gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Search</label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="School name" />
          </div>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : hasError ? (
          <p className="text-sm text-red-500">Could not load schools.</p>
        ) : (
          <>
            <SchoolTable items={items} />
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
