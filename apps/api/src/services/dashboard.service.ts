import type { DashboardResponseData } from "@board-ranking/shared";
import { NotFoundError } from "../errors/AppError.js";
import { findUserById } from "../repositories/user.repository.js";
import { buildRecommendedTest, buildTodaysGoal } from "../rules/dashboard.rules.js";

export async function getDashboard(userId: string): Promise<DashboardResponseData> {
  const user = await findUserById(userId);
  const profile = user?.studentProfile;
  if (!profile) {
    throw new NotFoundError("Student profile not found");
  }

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
    recentTests: [],
    todaysGoal: buildTodaysGoal(profile.profileCompletion),
    recommendedTest: buildRecommendedTest(),
  };
}
