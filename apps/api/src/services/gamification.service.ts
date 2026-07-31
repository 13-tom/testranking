import type { AchievementsResponseData, StreakResponseData } from "@board-ranking/shared";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { findStudentAnalytics } from "../repositories/analytics.repository.js";
import { getCurrentRank } from "../repositories/rank.repository.js";
import {
  createStudentAchievement,
  findAllAchievements,
  findEarnedAchievementCodes,
  findEarnedAchievements,
  findLastStreakEntry,
  findStreakHistory,
  upsertStreakEntry,
} from "../repositories/gamification.repository.js";
import {
  ACHIEVEMENT_DEFINITIONS,
  computeProfileCompletion,
  computeStudyLevel,
  evaluateAchievementUnlocks,
  evaluateStreakUpdate,
  truncateToUtcDay,
} from "../rules/gamification.rules.js";

// Phase 7 (Gamification, BR-045).

const REGISTRATION_BONUS = 50;
const TEST_COMPLETION_BONUS = 5;

function rewardFor(code: string): number {
  return ACHIEVEMENT_DEFINITIONS.find((def) => def.code === code)?.studyPointsReward ?? 0;
}

// --- Registration-time bonuses: called once from auth.service.ts's
// registerStudent, in the same request (not fire-and-forget — a new
// student's opening balance should be visible on their very first
// dashboard read). ---
export async function awardRegistrationBonuses(userId: string, hasSchool: boolean): Promise<void> {
  const profileCompletion = computeProfileCompletion(hasSchool);
  const isProfileComplete = profileCompletion >= 100;
  const studyPoints = REGISTRATION_BONUS + (isProfileComplete ? rewardFor("PROFILE_COMPLETE") : 0);
  const level = computeStudyLevel(studyPoints);

  await prisma.$transaction(async (tx) => {
    await tx.studentProfile.update({
      where: { userId },
      data: { profileCompletion, studyPoints, studyLevel: level.level },
    });
    if (isProfileComplete) {
      const achievement = await tx.achievement.findUnique({ where: { code: "PROFILE_COMPLETE" } });
      if (achievement) {
        await createStudentAchievement(tx, userId, achievement.id);
      }
    }
  });
}

// --- Post-submission update: fire-and-forget, called after ranking and
// analytics both resolve (BR-045) — analytics for testsTaken/
// bestPercentage, ranking for the current India rank (RANK_TOP_100). ---
export async function triggerGamificationUpdate(studentId: string): Promise<void> {
  const now = new Date();

  const [analytics, lastStreakEntry, profile, currentRank, earnedCodes] = await Promise.all([
    findStudentAnalytics(studentId),
    findLastStreakEntry(studentId),
    prisma.studentProfile.findUnique({ where: { userId: studentId } }),
    getCurrentRank(studentId),
    findEarnedAchievementCodes(studentId),
  ]);
  if (!profile) {
    return;
  }

  const streakResult = evaluateStreakUpdate(lastStreakEntry?.date ?? null, now, profile.studyStreak, profile.longestStreak);
  const pointsBeforeAchievements = profile.studyPoints + TEST_COMPLETION_BONUS;

  const newlyUnlocked = evaluateAchievementUnlocks(
    {
      testsTaken: analytics?.testsTaken ?? 0,
      bestPercentage: analytics?.bestPercentage ?? 0,
      studyPoints: pointsBeforeAchievements,
      studyStreak: streakResult.streak,
      indiaRank: currentRank,
      profileComplete: profile.profileCompletion >= 100,
    },
    earnedCodes,
  );
  const achievementBonus = newlyUnlocked.reduce((sum, achievement) => sum + achievement.studyPointsReward, 0);
  const totalPoints = pointsBeforeAchievements + achievementBonus;
  const level = computeStudyLevel(totalPoints);

  await prisma.$transaction(async (tx) => {
    if (streakResult.isNewDay) {
      await upsertStreakEntry(tx, studentId, truncateToUtcDay(now));
    }
    await tx.studentProfile.update({
      where: { userId: studentId },
      data: {
        studyPoints: totalPoints,
        studyLevel: level.level,
        studyStreak: streakResult.streak,
        longestStreak: streakResult.longestStreak,
      },
    });
    for (const achievement of newlyUnlocked) {
      const row = await tx.achievement.findUnique({ where: { code: achievement.code } });
      if (row) {
        await createStudentAchievement(tx, studentId, row.id);
      }
    }
  });

  if (newlyUnlocked.length > 0) {
    logger.info({ studentId, unlocked: newlyUnlocked.map((achievement) => achievement.code) }, "achievements unlocked");
  }
}

// --- Module reads ---

export async function getAchievements(studentId: string): Promise<AchievementsResponseData> {
  const [all, earned] = await Promise.all([findAllAchievements(), findEarnedAchievements(studentId)]);
  const earnedByCode = new Map(earned.map((row) => [row.achievement.code, row.earnedAt]));

  return {
    items: all.map((achievement) => ({
      code: achievement.code,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      studyPointsReward: achievement.studyPointsReward,
      earned: earnedByCode.has(achievement.code),
      earnedAt: earnedByCode.get(achievement.code)?.toISOString() ?? null,
    })),
  };
}

export async function getStreak(studentId: string): Promise<StreakResponseData> {
  const [profile, history] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId: studentId }, select: { studyStreak: true, longestStreak: true } }),
    findStreakHistory(studentId),
  ]);

  return {
    currentStreak: profile?.studyStreak ?? 0,
    longestStreak: profile?.longestStreak ?? 0,
    history: history.map((entry) => ({ date: entry.date.toISOString(), completed: entry.completed })),
  };
}
