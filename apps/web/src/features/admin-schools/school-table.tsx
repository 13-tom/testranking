"use client";

import Link from "next/link";
import type { AdminSchoolSummary } from "@board-ranking/shared";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function SchoolTable({ items }: { items: AdminSchoolSummary[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No schools match these filters.</p>;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>City</TableHeaderCell>
          <TableHeaderCell>District</TableHeaderCell>
          <TableHeaderCell>State</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((school) => (
          <TableRow key={school.id}>
            <TableCell>
              <Link href={`/admin/schools/${school.id}`} className="font-medium underline">
                {school.schoolName}
              </Link>
            </TableCell>
            <TableCell>{school.city}</TableCell>
            <TableCell>{school.district}</TableCell>
            <TableCell>{school.state}</TableCell>
            <TableCell>
              <Badge tone={school.isActive ? "positive" : "negative"}>{school.isActive ? "Active" : "Archived"}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
