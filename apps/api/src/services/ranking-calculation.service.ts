import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import type { RankScope } from "@board-ranking/shared";
import { getCurrentAcademicYear, resolveApplicableScopes } from "../rules/ranking.rules.js";
import {
  countStudentsAboveForTest,
  countStudentsForTest,
  findLatestRankingVersion,
  findOrphanedEvaluatedRankedAttempts,
  findOwnBestAttempt,
  upsertLeaderboardRank,
  writeRankSnapshot,
} from "../repositories/ranking.repository.js";

// Phase 6 (Ranking, BR-029 through BR-036, BR-044) — the Sprint 6.2
// calculation engine. The sole writer of Leaderboard and RankSnapshot;
// triggered fire-and-forget after each ranked-mode submission
// (test-attempt.service.ts's evaluateClaimedAttempt), mirroring the
// Phase 5 Analytics writer pattern.

type RankColumn = "schoolRank" | "districtRank" | "stateRank" | "indiaRank";

const RANK_COLUMN: Record<RankScope, RankColumn> = {
  SCHOOL: "schoolRank",
  DISTRICT: "districtRank",
  STATE: "stateRank",
  NATIONAL: "indiaRank",
};

type SchoolInfo = { id: string; district: string; state: string };

function resolveScopeId(scope: RankScope, school: SchoolInfo | null): string | null {
  if (scope === "NATIONAL") {
    return "INDIA";
  }
  if (!school) {
    return null;
  }
  if (scope === "SCHOOL") {
    return school.id;
  }
  return scope === "DISTRICT" ? school.district : school.state;
}

export async function triggerRankingForAttempt(attemptId: string): Promise<void> {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: true,
      student: { include: { studentProfile: { include: { school: true } } } },
    },
  });

  // Not found, or already past the point where ranking applies (RANKED
  // already, or still mid-flight) — nothing to do.
  if (!attempt || attempt.status !== "EVALUATED") {
    return;
  }

  const { test, student } = attempt;
  // BR-011/Chapter 6 MVP scope: Practice Mode never affects rankings.
  // rankingScope === NONE is the same gate for a RANKED test that opted
  // out of geographic ranking. Such attempts stay EVALUATED forever.
  if (test.mode !== "RANKED" || test.rankingScope === "NONE") {
    return;
  }

  const school: SchoolInfo | null = student.studentProfile?.school
    ? {
        id: student.studentProfile.school.id,
        district: student.studentProfile.school.district,
        state: student.studentProfile.school.state,
      }
    : null;
  const scopes = resolveApplicableScopes(test.rankingScope, !!school);
  const period = "ALL_TIME";
  const academicYear = getCurrentAcademicYear(new Date());
  const studyPoints = student.studentProfile?.studyPoints ?? 0;

  const mine = await findOwnBestAttempt(attempt.testId, attempt.studentId);

  const rankUpdates: Partial<Record<RankColumn, number>> = {};
  const scopesComputed: { scope: RankScope; scopeId: string; rank: number; totalStudents: number }[] = [];

  if (mine) {
    for (const scope of scopes) {
      const scopeId = resolveScopeId(scope, school);
      if (!scopeId) {
        continue;
      }
      const filter = { scope, scopeId };
      const [above, total] = await Promise.all([
        countStudentsAboveForTest(attempt.testId, filter, mine),
        countStudentsForTest(attempt.testId, filter),
      ]);
      rankUpdates[RANK_COLUMN[scope]] = above + 1;
      scopesComputed.push({ scope, scopeId, rank: above + 1, totalStudents: total });
    }
  }

  const claimed = await prisma.$transaction(async (tx) => {
    // BR-035 point 3: CAS guard — a concurrent/retried call that already
    // ranked this attempt (e.g. the orphan sweep racing a live call) is a
    // no-op, so no duplicate snapshots or Leaderboard writes are possible.
    const claim = await tx.testAttempt.updateMany({
      where: { id: attemptId, status: "EVALUATED" },
      data: { status: "RANKED" },
    });
    if (claim.count === 0) {
      return false;
    }

    for (const entry of scopesComputed) {
      const rankingVersion = await findLatestRankingVersion(entry.scope, entry.scopeId, period, academicYear);
      await writeRankSnapshot(tx, {
        studentId: attempt.studentId,
        scope: entry.scope,
        scopeId: entry.scopeId,
        rank: entry.rank,
        totalStudents: entry.totalStudents,
        studyPoints,
        period,
        academicYear,
        rankingVersion,
        testId: attempt.testId,
      });
    }

    if (Object.keys(rankUpdates).length > 0) {
      await upsertLeaderboardRank(tx, attempt.studentId, rankUpdates, studyPoints, period);
    }

    await tx.auditLog.create({
      data: {
        userId: attempt.studentId,
        eventType: "RANK_COMPUTED",
        entityType: "TestAttempt",
        entityId: attemptId,
        metadata: {
          testId: attempt.testId,
          retakePolicy: "BEST_ATTEMPT",
          representativeAttemptId: mine?.id ?? null,
          scopesComputed,
        },
      },
    });

    return true;
  });

  if (!claimed) {
    logger.info({ attemptId }, "ranking calculation skipped: attempt already ranked");
  }
}

// BR-035 point 1: startup recovery for attempts orphaned by a crash
// between the submission transaction committing and the fire-and-forget
// ranking call resolving. The 10-minute grace period avoids racing an
// in-flight call for a just-submitted attempt.
export async function scanOrphanedEvaluatedAttempts(): Promise<void> {
  const cutoff = new Date(Date.now() - 10 * 60 * 1000);
  const orphaned = await findOrphanedEvaluatedRankedAttempts(cutoff);

  for (const { id } of orphaned) {
    await triggerRankingForAttempt(id).catch((err) => logger.error({ err, attemptId: id }, "orphaned ranking recovery failed"));
  }

  if (orphaned.length > 0) {
    logger.info({ count: orphaned.length }, "recovered orphaned EVALUATED attempts");
  }
}
