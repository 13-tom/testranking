import { prisma } from "../lib/prisma.js";

export function findStudentProfileForDashboard(studentId: string) {
  return prisma.studentProfile.findUnique({
    where: { userId: studentId },
    select: { studyPoints: true, studyLevel: true, studyStreak: true },
  });
}
