import type { CursorPage } from "./pagination.js";
import type { Difficulty, QuestionStatus } from "./question-bank.js";
import type { TestStatus, TestSummary } from "./test-engine.js";

// --- Phase 9: Admin Panel (BR-046), lean MVP cut ---

export type AdminQuestionModerationAction = "approve" | "reject" | "archive";

export type ReviewQueueItem = {
  id: string;
  referenceCode: string;
  questionText: string;
  difficulty: Difficulty;
  status: QuestionStatus;
  topicId: string;
  updatedAt: string;
};

export type ReviewQueueResponseData = CursorPage<ReviewQueueItem>;

export type BulkQuestionModerationInput = { questionIds: string[] };

export type BulkModerationResultData = {
  requested: number;
  updated: number;
};

// --- Student Management ---

export type AdminStudentListQuery = {
  cursor?: string;
  limit?: number;
  search?: string;
  class?: number;
  schoolId?: string;
  isSuspended?: boolean;
};

export type AdminStudentSummary = {
  id: string;
  email: string;
  fullName: string;
  class: number;
  schoolId: string | null;
  schoolName: string | null;
  studyPoints: number;
  isSuspended: boolean;
  createdAt: string;
};

export type StudentListResponseData = CursorPage<AdminStudentSummary>;

export type AdminStudentDetail = AdminStudentSummary & {
  studyLevel: number;
  studyStreak: number;
  longestStreak: number;
  profileCompletion: number;
  suspendedAt: string | null;
  suspendedReason: string | null;
  lastLogin: string | null;
};

export type SuspendStudentInput = { reason: string };
export type GrantPointsInput = { amount: number; reason: string };

// --- School Management ---

export type AdminSchoolListQuery = {
  cursor?: string;
  limit?: number;
  search?: string;
  state?: string;
  district?: string;
  isActive?: boolean;
};

export type AdminSchoolSummary = {
  id: string;
  schoolName: string;
  city: string;
  district: string;
  state: string;
  isActive: boolean;
};

export type SchoolListResponseData = CursorPage<AdminSchoolSummary>;

export type AdminSchoolDetail = AdminSchoolSummary & {
  board: string;
  country: string;
  postalCode: string;
  createdAt: string;
};

export type SchoolStatsResponseData = {
  studentCount: number;
  evaluatedAttemptCount: number;
};

// --- Test Management additions ---

export type AdminTestListQuery = {
  cursor?: string;
  limit?: number;
  status?: TestStatus;
  class?: number;
};

export type AdminTestListResponseData = CursorPage<TestSummary>;

// --- Platform overview ---

export type PlatformOverviewResponseData = {
  students: { total: number; suspended: number };
  questions: Record<QuestionStatus, number>;
  tests: Record<TestStatus, number>;
  schools: { total: number; active: number };
  evaluatedAttempts: number;
};
