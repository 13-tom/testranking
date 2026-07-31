// Sprint 6.1 read infrastructure (BR-029, BR-044): strictly READ-ONLY — no
// insert/update/delete path exists here. The Sprint 6.2 calculation engine
// (ranking.repository.ts) is the only writer of Leaderboard and
// RankSnapshot; these reads can never trigger recalculation.
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import type { RankScope } from "@board-ranking/shared";
import type { RankCursor } from "../rules/ranking.rules.js";

const LEADERBOARD_INCLUDE = {
  student: { include: { studentProfile: { include: { school: true } } } },
} as const;

export type LeaderboardRow = Prisma.LeaderboardGetPayload<{ include: typeof LEADERBOARD_INCLUDE }>;

function baseWhere(scope: RankScope, scopeId: string): Prisma.LeaderboardWhereInput {
  switch (scope) {
    case "NATIONAL":
      return { indiaRank: { not: null } };
    case "SCHOOL":
      return { schoolRank: { not: null }, student: { studentProfile: { schoolId: scopeId } } };
    case "DISTRICT":
      return { districtRank: { not: null }, student: { studentProfile: { school: { district: scopeId } } } };
    case "STATE":
      return { stateRank: { not: null }, student: { studentProfile: { school: { state: scopeId } } } };
  }
}

function cursorWhere(scope: RankScope, cursor: RankCursor): Prisma.LeaderboardWhereInput {
  switch (scope) {
    case "NATIONAL":
      return { OR: [{ indiaRank: { gt: cursor.rank } }, { indiaRank: cursor.rank, studentId: { gt: cursor.id } }] };
    case "SCHOOL":
      return { OR: [{ schoolRank: { gt: cursor.rank } }, { schoolRank: cursor.rank, studentId: { gt: cursor.id } }] };
    case "DISTRICT":
      return { OR: [{ districtRank: { gt: cursor.rank } }, { districtRank: cursor.rank, studentId: { gt: cursor.id } }] };
    case "STATE":
      return { OR: [{ stateRank: { gt: cursor.rank } }, { stateRank: cursor.rank, studentId: { gt: cursor.id } }] };
  }
}

function orderBy(scope: RankScope): Prisma.LeaderboardOrderByWithRelationInput[] {
  switch (scope) {
    case "NATIONAL":
      return [{ indiaRank: "asc" }, { studentId: "asc" }];
    case "SCHOOL":
      return [{ schoolRank: "asc" }, { studentId: "asc" }];
    case "DISTRICT":
      return [{ districtRank: "asc" }, { studentId: "asc" }];
    case "STATE":
      return [{ stateRank: "asc" }, { studentId: "asc" }];
  }
}

export function findLeaderboard(scope: RankScope, scopeId: string, cursor: RankCursor | null, limit: number): Promise<LeaderboardRow[]> {
  const where: Prisma.LeaderboardWhereInput = cursor ? { AND: [baseWhere(scope, scopeId), cursorWhere(scope, cursor)] } : baseWhere(scope, scopeId);
  return prisma.leaderboard.findMany({
    where,
    orderBy: orderBy(scope),
    take: limit,
    include: LEADERBOARD_INCLUDE,
  });
}

export function countLeaderboardEntries(scope: RankScope, scopeId: string): Promise<number> {
  return prisma.leaderboard.count({ where: baseWhere(scope, scopeId) });
}

export function findStudentRanks(studentId: string) {
  return prisma.leaderboard.findUnique({ where: { studentId } });
}

const RANK_HISTORY_LIMIT = 50;

export function findRankHistory(studentId: string) {
  return prisma.rankSnapshot.findMany({
    where: { studentId, isPublished: true },
    orderBy: { computedAt: "desc" },
    take: RANK_HISTORY_LIMIT,
  });
}
