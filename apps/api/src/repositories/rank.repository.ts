// Phase 6 (Ranking, BR-044) activation: every rank-dependent read in
// Modules 14/17/18 goes through these two functions, which previously
// always returned null (BR-043). "Rank" here means the student's Overall
// Platform Rank (NATIONAL/ALL_TIME) per PRD Ch6/Ch7 — the broadest, most
// universally-applicable of the four MVP scopes and the one every student
// has regardless of whether they have a school on file.
import { prisma } from "../lib/prisma.js";

export async function getCurrentRank(studentId: string): Promise<number | null> {
  const row = await prisma.leaderboard.findUnique({ where: { studentId }, select: { indiaRank: true } });
  return row?.indiaRank ?? null;
}

export async function getTotalStudents(): Promise<number | null> {
  const latest = await prisma.rankSnapshot.findFirst({
    where: { scope: "NATIONAL", scopeId: "INDIA", period: "ALL_TIME", isPublished: true },
    orderBy: { computedAt: "desc" },
    select: { totalStudents: true },
  });
  return latest?.totalStudents ?? null;
}
