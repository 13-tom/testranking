// Sprint 6.1 read API (BR-029, BR-044): scope/pagination validation,
// authorization, and DTO mapping. leaderboard.repository.ts is the only
// dependency — this module never touches ranking.repository.ts's writer
// functions.
import type {
  LeaderboardEntry,
  LeaderboardMetadataResponseData,
  LeaderboardResponseData,
  RankHistoryResponseData,
  RankScope,
  StudentRanksResponseData,
} from "@board-ranking/shared";
import { ForbiddenError, ValidationError } from "../errors/AppError.js";
import {
  countLeaderboardEntries,
  findLeaderboard,
  findRankHistory,
  findStudentRanks,
  type LeaderboardRow,
} from "../repositories/leaderboard.repository.js";
import { decodeRankCursor, encodeRankCursor, getCurrentAcademicYear } from "../rules/ranking.rules.js";
import type { LeaderboardPageQuery } from "../validators/leaderboard.validators.js";

const SCOPES: RankScope[] = ["SCHOOL", "DISTRICT", "STATE", "NATIONAL"];
const DEFAULT_LIMIT = 20;

function rankForScope(row: LeaderboardRow, scope: RankScope): number | null {
  switch (scope) {
    case "SCHOOL":
      return row.schoolRank;
    case "DISTRICT":
      return row.districtRank;
    case "STATE":
      return row.stateRank;
    case "NATIONAL":
      return row.indiaRank;
  }
}

// DTO discipline (docs/05_API_Blueprint.md Module 7): schoolName is only
// exposed on STATE/NATIONAL leaderboards, never email/phone/tokens.
function toEntry(row: LeaderboardRow, scope: RankScope): LeaderboardEntry {
  const profile = row.student.studentProfile;
  const includeSchoolName = scope === "STATE" || scope === "NATIONAL";
  return {
    rank: rankForScope(row, scope) ?? 0,
    studentId: row.studentId,
    studentName: profile?.fullName ?? "",
    class: profile?.class ?? 0,
    profileImage: profile?.profileImage ?? null,
    studyPoints: row.studyPoints,
    schoolName: includeSchoolName ? (profile?.school?.schoolName ?? null) : null,
  };
}

export function getLeaderboardMetadata(): LeaderboardMetadataResponseData {
  return { scopes: SCOPES, periods: ["ALL_TIME"], academicYear: getCurrentAcademicYear(new Date()) };
}

function assertValidScopeId(scope: RankScope, scopeId: string | undefined): asserts scopeId is string {
  if (!scopeId || scopeId.trim().length === 0) {
    throw new ValidationError(`scopeId is required for scope ${scope}`);
  }
}

export async function getScopedLeaderboard(scope: string, scopeId: string | undefined, query: LeaderboardPageQuery): Promise<LeaderboardResponseData> {
  if (!SCOPES.includes(scope as RankScope)) {
    throw new ValidationError("Unknown ranking scope");
  }
  const rankScope = scope as RankScope;
  const resolvedScopeId = rankScope === "NATIONAL" ? "INDIA" : scopeId;
  assertValidScopeId(rankScope, resolvedScopeId);

  const limit = query.limit ?? DEFAULT_LIMIT;
  const cursor = decodeRankCursor(query.cursor);

  const [rows, totalStudents] = await Promise.all([
    findLeaderboard(rankScope, resolvedScopeId, cursor, limit),
    countLeaderboardEntries(rankScope, resolvedScopeId),
  ]);

  const items = rows.map((row) => toEntry(row, rankScope));
  const last = rows[rows.length - 1];
  const nextCursor = rows.length === limit && last ? encodeRankCursor({ rank: rankForScope(last, rankScope) ?? 0, id: last.studentId }) : null;

  return { items, nextCursor, totalStudents };
}

export function getNationalScopeOnly(scope: string): void {
  if (scope !== "NATIONAL") {
    throw new ValidationError("This scope requires a scopeId — use /leaderboards/:scope/:scopeId");
  }
}

export async function getStudentRanks(studentId: string): Promise<StudentRanksResponseData> {
  const row = await findStudentRanks(studentId);
  if (!row) {
    return { studentId, schoolRank: null, districtRank: null, stateRank: null, indiaRank: null, studyPoints: 0, updatedAt: null };
  }
  return {
    studentId,
    schoolRank: row.schoolRank,
    districtRank: row.districtRank,
    stateRank: row.stateRank,
    indiaRank: row.indiaRank,
    studyPoints: row.studyPoints,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getRankHistory(studentId: string, callerId: string, callerRole: string): Promise<RankHistoryResponseData> {
  if (studentId !== callerId && callerRole !== "ADMIN") {
    throw new ForbiddenError("You can only view your own rank history");
  }
  const rows = await findRankHistory(studentId);
  return {
    items: rows.map((row) => ({
      scope: row.scope as RankScope,
      scopeId: row.scopeId,
      rank: row.rank,
      totalStudents: row.totalStudents,
      period: row.period,
      academicYear: row.academicYear,
      testId: row.testId,
      computedAt: row.computedAt.toISOString(),
    })),
  };
}
