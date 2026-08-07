"use client";

import Link from "next/link";
import type { AdminStudentSummary } from "@board-ranking/shared";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function StudentTable({ items }: { items: AdminStudentSummary[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No students match these filters.</p>;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Class</TableHeaderCell>
          <TableHeaderCell>School</TableHeaderCell>
          <TableHeaderCell>Study Points</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((student) => (
          <TableRow key={student.id}>
            <TableCell>
              <Link href={`/admin/students/${student.id}`} className="font-medium underline">
                {student.fullName}
              </Link>
            </TableCell>
            <TableCell>{student.email}</TableCell>
            <TableCell>{student.class}</TableCell>
            <TableCell>{student.schoolName ?? "—"}</TableCell>
            <TableCell>{student.studyPoints}</TableCell>
            <TableCell>
              <Badge tone={student.isSuspended ? "negative" : "positive"}>{student.isSuspended ? "Suspended" : "Active"}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
