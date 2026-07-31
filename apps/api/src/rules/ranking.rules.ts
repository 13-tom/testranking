import type { RankingScope } from "@prisma/client";
import type { RankScope } from "@board-ranking/shared";

// Phase 6 (Ranking, BR-044): Test.rankingScope names the WIDEST scope a
// test's submissions rank at, and cascades downward through every
// narrower scope too — a SCHOOL < DISTRICT < STATE < NATIONAL ladder. An
// INDIA-scoped test (the common case: one shared national test) therefore
// populates all four Leaderboard columns for every ranked submission, not
// just indiaRank. This reverses this session's earlier single-scope-only
// recommendation now that the Leaderboard table's shape (four simultaneous
// rank columns per student) and the seed data's single-shared-test-per-
// class reality make cascading the design that actually delivers "Overall
// + Class + School rank" together, as the PRD's dashboard widget expects.
const SCOPE_LADDER: RankScope[] = ["SCHOOL", "DISTRICT", "STATE", "NATIONAL"];

export function resolveApplicableScopes(rankingScope: RankingScope, hasSchool: boolean): RankScope[] {
  if (rankingScope === "NONE") {
    return [];
  }
  const widestIndex = rankingScope === "INDIA" ? 3 : SCOPE_LADDER.indexOf(rankingScope as RankScope);
  return SCOPE_LADDER.slice(0, widestIndex + 1).filter((scope) => scope === "NATIONAL" || hasSchool);
}

// Academic year window is April -> March (e.g. "2026-27"), per
// docs/04_database.md's RankSnapshot.academicYear field.
export function getCurrentAcademicYear(date: Date): string {
  const startYear = date.getUTCMonth() >= 3 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}-${endYearShort}`;
}

// Opaque keyset cursor encoding the last (rank, id) pair seen, per
// docs/05_API_Blueprint.md Module 7's cursor pagination strategy.
export type RankCursor = { rank: number; id: string };

export function encodeRankCursor(cursor: RankCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeRankCursor(raw: string | undefined): RankCursor | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as RankCursor).rank === "number" &&
      typeof (parsed as RankCursor).id === "string"
    ) {
      return parsed as RankCursor;
    }
    return null;
  } catch {
    return null;
  }
}
