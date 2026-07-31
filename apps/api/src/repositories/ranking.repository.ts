import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import type { RankScope } from "@board-ranking/shared";

type Db = Prisma.TransactionClient;

export type ScopeFilter = { scope: RankScope; scopeId: string };

export type BestAttemptRow = {
  id: string;
  studentId: string;
  percentage: number;
  totalMarks: number;
  accuracy: number;
  submittedAt: Date;
};

// BR-030: scopeId is canonical (schools.id / schools.district /
// schools.state / literal 'INDIA') — sourced by the caller from the
// School row, never from request input.
function scopeFilterSql(filter: ScopeFilter): Prisma.Sql {
  switch (filter.scope) {
    case "NATIONAL":
      return Prisma.sql`TRUE`;
    case "SCHOOL":
      return Prisma.sql`sp."schoolId" = ${filter.scopeId}`;
    case "DISTRICT":
      return Prisma.sql`s.district = ${filter.scopeId}`;
    case "STATE":
      return Prisma.sql`s.state = ${filter.scopeId}`;
  }
}

// BR-036: one row per student — their best attempt on this test under the
// BR-032 deterministic order — via DISTINCT ON. Retakes never create
// duplicate leaderboard entries.
function bestAttemptsCte(testId: string, filter: ScopeFilter): Prisma.Sql {
  return Prisma.sql`
    SELECT DISTINCT ON (ta."studentId")
      ta."studentId" AS "studentId",
      ta.percentage AS percentage,
      ta."totalMarks" AS "totalMarks",
      ta.accuracy AS accuracy,
      ta."submittedAt" AS "submittedAt"
    FROM test_attempts ta
    JOIN users u ON u.id = ta."studentId"
    LEFT JOIN student_profiles sp ON sp."userId" = u.id
    LEFT JOIN schools s ON s.id = sp."schoolId"
    WHERE ta."testId" = ${testId}
      AND ta.status IN ('EVALUATED', 'RANKED')
      AND (${scopeFilterSql(filter)})
    ORDER BY ta."studentId", ta.percentage DESC, ta."totalMarks" DESC, ta.accuracy DESC, ta."submittedAt" ASC
  `;
}

// The triggering student's own best-attempt row on this test, used as the
// comparison tuple for countStudentsAboveForTest below.
export async function findOwnBestAttempt(testId: string, studentId: string): Promise<BestAttemptRow | null> {
  const rows = await prisma.$queryRaw<BestAttemptRow[]>`
    SELECT
      ta.id AS id,
      ta."studentId" AS "studentId",
      ta.percentage AS percentage,
      ta."totalMarks" AS "totalMarks",
      ta.accuracy AS accuracy,
      ta."submittedAt" AS "submittedAt"
    FROM test_attempts ta
    WHERE ta."testId" = ${testId} AND ta."studentId" = ${studentId} AND ta.status IN ('EVALUATED', 'RANKED')
    ORDER BY ta.percentage DESC, ta."totalMarks" DESC, ta.accuracy DESC, ta."submittedAt" ASC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

// BR-034: two indexed COUNT queries per scope (above-count + total-count),
// evaluated against the best-attempt CTE so retakes count once.
export async function countStudentsForTest(testId: string, filter: ScopeFilter): Promise<number> {
  const cte = bestAttemptsCte(testId, filter);
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    WITH best_attempts AS (${cte})
    SELECT count(*)::bigint AS count FROM best_attempts
  `;
  return Number(rows[0]?.count ?? 0n);
}

// BR-032's 5-field deterministic order expressed as a cascading OR, since
// the sort mixes DESC (percentage/totalMarks/accuracy) and ASC
// (submittedAt/studentId) directions and can't be a single row-tuple
// comparison.
export async function countStudentsAboveForTest(testId: string, filter: ScopeFilter, mine: BestAttemptRow): Promise<number> {
  const cte = bestAttemptsCte(testId, filter);
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    WITH best_attempts AS (${cte})
    SELECT count(*)::bigint AS count FROM best_attempts
    WHERE percentage > ${mine.percentage}
       OR (percentage = ${mine.percentage} AND "totalMarks" > ${mine.totalMarks})
       OR (percentage = ${mine.percentage} AND "totalMarks" = ${mine.totalMarks} AND accuracy > ${mine.accuracy})
       OR (percentage = ${mine.percentage} AND "totalMarks" = ${mine.totalMarks} AND accuracy = ${mine.accuracy} AND "submittedAt" < ${mine.submittedAt})
       OR (percentage = ${mine.percentage} AND "totalMarks" = ${mine.totalMarks} AND accuracy = ${mine.accuracy} AND "submittedAt" = ${mine.submittedAt} AND "studentId" < ${mine.studentId})
  `;
  return Number(rows[0]?.count ?? 0n);
}

// BR-031: version increments only on a verified-bug rerun, never for
// routine recalculation — every routine event reuses the current version.
export async function findLatestRankingVersion(scope: string, scopeId: string, period: string, academicYear: string): Promise<number> {
  const latest = await prisma.rankSnapshot.findFirst({
    where: { scope, scopeId, period, academicYear },
    orderBy: { rankingVersion: "desc" },
    select: { rankingVersion: true },
  });
  return latest?.rankingVersion ?? 1;
}

export async function writeRankSnapshot(
  tx: Db,
  data: {
    studentId: string;
    scope: RankScope;
    scopeId: string;
    rank: number;
    totalStudents: number;
    studyPoints: number;
    period: string;
    academicYear: string;
    rankingVersion: number;
    testId: string;
  },
): Promise<void> {
  await tx.rankSnapshot.create({
    data: { ...data, isPublished: true, publishedAt: new Date() },
  });
}

export async function upsertLeaderboardRank(
  tx: Db,
  studentId: string,
  rankUpdates: Partial<Record<"schoolRank" | "districtRank" | "stateRank" | "indiaRank", number>>,
  studyPoints: number,
  period: string,
): Promise<void> {
  await tx.leaderboard.upsert({
    where: { studentId },
    create: { studentId, period, studyPoints, ...rankUpdates },
    update: { period, studyPoints, ...rankUpdates },
  });
}

// BR-035 point 1: attempts orphaned by a crash between the submission
// transaction committing and the fire-and-forget ranking call resolving.
// The 10-minute grace period (caller-supplied cutoff) avoids racing
// in-flight calls.
export function findOrphanedEvaluatedRankedAttempts(cutoff: Date) {
  return prisma.testAttempt.findMany({
    where: {
      status: "EVALUATED",
      submittedAt: { lt: cutoff },
      test: { mode: "RANKED", rankingScope: { not: "NONE" } },
    },
    select: { id: true },
  });
}
