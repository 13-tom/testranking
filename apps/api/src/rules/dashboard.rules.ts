import type { DashboardGoal, DashboardRecommendedTest } from "@board-ranking/shared";

const PROFILE_COMPLETE_THRESHOLD = 100;

export function buildTodaysGoal(profileCompletion: number): DashboardGoal {
  if (profileCompletion < PROFILE_COMPLETE_THRESHOLD) {
    return {
      type: "PROFILE_COMPLETION",
      title: "Complete your profile",
      description: `Your profile is ${profileCompletion}% complete. Finish it to unlock personalized recommendations.`,
      progress: profileCompletion,
      target: PROFILE_COMPLETE_THRESHOLD,
    };
  }
  return {
    type: "STATIC",
    title: "Keep your streak alive",
    description: "Log in and practice today to keep your study streak going.",
    progress: null,
    target: null,
  };
}

type ChapterTestAccuracy = {
  test: { id: string; name: string };
  accuracy: number | null;
};

type UnattemptedTest = { id: string; name: string } | null;

// Phase 4 (Test Engine) is live: recommend the Chapter Test the student
// did worst on (accuracy-wise), or their first not-yet-attempted Chapter
// Test if they haven't attempted any yet. Deliberately simple/rule-based —
// no AI, matching PRD Ch10 §8/§10 ("No AI in MVP. Rule-based
// recommendations only").
export function buildRecommendedTest(
  chapterAttempts: ChapterTestAccuracy[],
  unattemptedChapterTest: UnattemptedTest,
): DashboardRecommendedTest {
  if (chapterAttempts.length > 0) {
    const worst = chapterAttempts.reduce((min, a) => ((a.accuracy ?? 100) < (min.accuracy ?? 100) ? a : min));
    return {
      id: worst.test.id,
      testName: worst.test.name,
      reason: `Your accuracy here was ${Math.round(worst.accuracy ?? 0)}% — try again to improve.`,
    };
  }
  if (unattemptedChapterTest) {
    return {
      id: unattemptedChapterTest.id,
      testName: unattemptedChapterTest.name,
      reason: "You haven't attempted any chapter tests yet — start here.",
    };
  }
  return null;
}
