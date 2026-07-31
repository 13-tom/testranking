import type { CursorPage } from "./pagination.js";

// Phase 6: Ranking System (BR-029 through BR-036, BR-044). MVP scopes
// only — CITY/FRIENDS/CUSTOM are Sprint 6.3+ and not modeled here.
export type RankScope = "SCHOOL" | "DISTRICT" | "STATE" | "NATIONAL";

// Leaderboard entries never expose email, phone, tokens, or audit
// metadata (docs/05_API_Blueprint.md Module 7 DTO discipline). studyPoints
// is a display field only, not the ranking metric (BR-032).
export type LeaderboardEntry = {
  rank: number;
  studentId: string;
  studentName: string;
  class: number;
  profileImage: string | null;
  studyPoints: number;
  schoolName: string | null; // populated for STATE/NATIONAL scope only
};

export type LeaderboardMetadataResponseData = {
  scopes: RankScope[];
  periods: string[];
  academicYear: string;
};

export type LeaderboardResponseData = CursorPage<LeaderboardEntry> & {
  totalStudents: number;
};

export type StudentRanksResponseData = {
  studentId: string;
  schoolRank: number | null;
  districtRank: number | null;
  stateRank: number | null;
  indiaRank: number | null;
  studyPoints: number;
  updatedAt: string | null; // null if the student has never been ranked
};

export type RankHistoryEntry = {
  scope: RankScope;
  scopeId: string;
  rank: number;
  totalStudents: number;
  period: string;
  academicYear: string;
  testId: string | null;
  computedAt: string;
};

export type RankHistoryResponseData = {
  items: RankHistoryEntry[];
};
