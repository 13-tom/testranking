import type { DashboardResponseData } from "@board-ranking/shared";
import { NotFoundError } from "../errors/AppError.js";
import { findUserById } from "../repositories/user.repository.js";
import {
  findChapterTestAccuracyByStudent,
  findFirstUnattemptedChapterTest,
  findRecentEvaluatedAttempts,
} from "../repositories/test-attempt.repository.js";
import { buildRecommendedTest, buildTodaysGoal } from "../rules/dashboard.rules.js";

export async function getDashboard(userId: string): Promise<DashboardResponseData> {
  const user = await findUserById(userId);
  const profile = user?.studentProfile;
  if (!profile) {
    throw new NotFoundError("Student profile not found");
  }

  const [recentAttempts, chapterAttempts, unattemptedChapterTest] = await Promise.all([
    findRecentEvaluatedAttempts(userId),
    findChapterTestAccuracyByStudent(userId),
    findFirstUnattemptedChapterTest(profile.class, userId),
  ]);

  const recentTests = recentAttempts.map((a) => ({
    id: a.id,
    testName: a.test.name,
    date: (a.submittedAt ?? a.updatedAt).toISOString(),
    score: a.score ?? 0,
    accuracy: a.accuracy ?? 0,
  }));

  const recommendedTest = buildRecommendedTest(
    chapterAttempts.map((a) => ({ test: a.test, accuracy: a.accuracy })),
    unattemptedChapterTest ? { id: unattemptedChapterTest.id, name: unattemptedChapterTest.name } : null,
  );

  return {
    profile: {
      fullName: profile.fullName,
      avatarUrl: profile.profileImage,
      profileCompletion: profile.profileCompletion,
    },
    studyPoints: profile.studyPoints,
    studyLevel: profile.studyLevel,
    studyStreak: profile.studyStreak,
    rank: null,
    recentTests,
    todaysGoal: buildTodaysGoal(profile.profileCompletion),
    recommendedTest,
  };
}
