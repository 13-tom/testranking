import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

type Db = Prisma.TransactionClient;

export function findAllAchievements() {
  return prisma.achievement.findMany({ orderBy: { createdAt: "asc" } });
}

export function findEarnedAchievements(studentId: string) {
  return prisma.studentAchievement.findMany({
    where: { studentId },
    include: { achievement: true },
  });
}

export async function findEarnedAchievementCodes(studentId: string): Promise<Set<string>> {
  const rows = await prisma.studentAchievement.findMany({
    where: { studentId },
    select: { achievement: { select: { code: true } } },
  });
  return new Set(rows.map((row) => row.achievement.code));
}

// Idempotent: the (studentId, achievementId) unique constraint means a
// retried or racing call never awards the same achievement twice.
export async function createStudentAchievement(tx: Db, studentId: string, achievementId: string): Promise<void> {
  await tx.studentAchievement.upsert({
    where: { studentId_achievementId: { studentId, achievementId } },
    create: { studentId, achievementId },
    update: {},
  });
}

export function findLastStreakEntry(studentId: string) {
  return prisma.studyStreakHistory.findFirst({
    where: { studentId },
    orderBy: { date: "desc" },
  });
}

export async function upsertStreakEntry(tx: Db, studentId: string, date: Date): Promise<void> {
  await tx.studyStreakHistory.upsert({
    where: { studentId_date: { studentId, date } },
    create: { studentId, date, completed: true },
    update: {},
  });
}

const STREAK_HISTORY_DAYS = 30;

export function findStreakHistory(studentId: string) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - STREAK_HISTORY_DAYS);
  return prisma.studyStreakHistory.findMany({
    where: { studentId, date: { gte: since } },
    orderBy: { date: "asc" },
  });
}
