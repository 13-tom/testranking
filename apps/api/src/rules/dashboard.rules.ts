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

// Test Engine / Question Bank (Phases 3-4) don't exist yet — nothing to
// recommend. Stub kept in the Rules layer so real logic slots in later
// without moving business logic out of the backend (CLAUDE.md).
export function buildRecommendedTest(): DashboardRecommendedTest {
  return null;
}
