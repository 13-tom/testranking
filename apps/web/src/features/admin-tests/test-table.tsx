"use client";

import Link from "next/link";
import type { TestSummary } from "@board-ranking/shared";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function TestTable({ items }: { items: TestSummary[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No tests match these filters.</p>;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Class</TableHeaderCell>
          <TableHeaderCell>Category</TableHeaderCell>
          <TableHeaderCell>Questions</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((test) => (
          <TableRow key={test.id}>
            <TableCell>
              <Link href={`/admin/tests/${test.id}`} className="font-medium underline">
                {test.name}
              </Link>
            </TableCell>
            <TableCell>{test.class}</TableCell>
            <TableCell>{test.category}</TableCell>
            <TableCell>{test.questionCount}</TableCell>
            <TableCell>
              <Badge tone={test.status === "ACTIVE" ? "positive" : test.status === "ARCHIVED" ? "negative" : "neutral"}>{test.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
