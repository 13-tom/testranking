"use client";

import Link from "next/link";
import type { ReviewQueueItem } from "@board-ranking/shared";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function ReviewQueueTable({
  items,
  selected,
  onToggle,
}: {
  items: ReviewQueueItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No questions waiting for review.</p>;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell></TableHeaderCell>
          <TableHeaderCell>Reference</TableHeaderCell>
          <TableHeaderCell>Question</TableHeaderCell>
          <TableHeaderCell>Difficulty</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <input type="checkbox" checked={selected.has(item.id)} onChange={() => onToggle(item.id)} />
            </TableCell>
            <TableCell>
              <Link href={`/admin/questions/${item.id}`} className="font-medium underline">
                {item.referenceCode}
              </Link>
            </TableCell>
            <TableCell className="max-w-md truncate">{item.questionText}</TableCell>
            <TableCell>
              <Badge>{item.difficulty}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
