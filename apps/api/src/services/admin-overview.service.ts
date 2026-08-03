// Phase 9 (Admin Panel, BR-046): one cheap aggregate-counts endpoint —
// covers PRD Ch6 §14's Reports/Basic Analytics bullets at MVP scope, not
// the documented per-KPI topSchools/topDistricts/topStates breakdown.
import type { PlatformOverviewResponseData, QuestionStatus } from "@board-ranking/shared";
import type { TestStatus } from "@board-ranking/shared";
import {
  countActiveSchools,
  countEvaluatedAttempts,
  countQuestionsByStatus,
  countSchools,
  countStudents,
  countSuspendedStudents,
} from "../repositories/admin.repository.js";
import { countTestsByStatus } from "../repositories/test.repository.js";

const QUESTION_STATUSES: QuestionStatus[] = ["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"];
const TEST_STATUSES: TestStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];

export async function getPlatformOverview(): Promise<PlatformOverviewResponseData> {
  const [studentTotal, studentSuspended, questionGroups, testGroups, schoolTotal, schoolActive, evaluatedAttempts] = await Promise.all([
    countStudents(),
    countSuspendedStudents(),
    countQuestionsByStatus(),
    countTestsByStatus(),
    countSchools(),
    countActiveSchools(),
    countEvaluatedAttempts(),
  ]);

  const questions = Object.fromEntries(QUESTION_STATUSES.map((status) => [status, 0])) as Record<QuestionStatus, number>;
  for (const group of questionGroups) {
    questions[group.status] = group._count._all;
  }

  const tests = Object.fromEntries(TEST_STATUSES.map((status) => [status, 0])) as Record<TestStatus, number>;
  for (const group of testGroups) {
    tests[group.status as TestStatus] = group._count._all;
  }

  return {
    students: { total: studentTotal, suspended: studentSuspended },
    questions,
    tests,
    schools: { total: schoolTotal, active: schoolActive },
    evaluatedAttempts,
  };
}
