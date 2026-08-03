// Phase 9 (Admin Panel, BR-046): Student/School/Question-moderation queries.
// Test Management additions live in test.repository.ts instead (existing
// file for the existing model), per the phase's file layout.
import { prisma } from "../lib/prisma.js";
import type { Prisma, QuestionStatus } from "@prisma/client";
import type { AdminCursor } from "../rules/admin.rules.js";

const REVIEW_QUEUE_SELECT = {
  id: true,
  referenceCode: true,
  questionText: true,
  difficulty: true,
  status: true,
  topicId: true,
  updatedAt: true,
} as const;

export function findReviewQueue(cursor: AdminCursor | null, limit: number) {
  return prisma.question.findMany({
    where: {
      status: "IN_REVIEW",
      ...(cursor ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    select: { ...REVIEW_QUEUE_SELECT, createdAt: true },
  });
}

export function findQuestionStatusById(id: string) {
  return prisma.question.findUnique({ where: { id }, select: { id: true, status: true } });
}

export function updateQuestionStatus(id: string, status: QuestionStatus) {
  return prisma.question.update({ where: { id }, data: { status }, select: REVIEW_QUEUE_SELECT });
}

export function bulkUpdateQuestionStatus(ids: string[], fromStatuses: QuestionStatus[], toStatus: QuestionStatus) {
  return prisma.question.updateMany({
    where: { id: { in: ids }, status: { in: fromStatuses } },
    data: { status: toStatus },
  });
}

export function countQuestionsByStatus() {
  return prisma.question.groupBy({ by: ["status"], _count: { _all: true } });
}

// --- Student Management ---

const STUDENT_SUMMARY_INCLUDE = { school: { select: { schoolName: true } } } as const;

type StudentFilter = { search?: string; class?: number; schoolId?: string; isSuspended?: boolean };

function studentWhere(filter: StudentFilter): Prisma.StudentProfileWhereInput {
  return {
    class: filter.class,
    schoolId: filter.schoolId,
    isSuspended: filter.isSuspended,
    user: filter.search
      ? { OR: [{ email: { contains: filter.search, mode: "insensitive" } }, { studentProfile: { fullName: { contains: filter.search, mode: "insensitive" } } }] }
      : undefined,
  };
}

export function findStudents(filter: StudentFilter, cursor: AdminCursor | null, limit: number) {
  return prisma.studentProfile.findMany({
    where: {
      ...studentWhere(filter),
      ...(cursor ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    include: { ...STUDENT_SUMMARY_INCLUDE, user: { select: { email: true } } },
  });
}

export function findStudentProfileById(id: string) {
  return prisma.studentProfile.findUnique({
    where: { id },
    include: { school: { select: { schoolName: true } }, user: { select: { email: true, lastLogin: true } } },
  });
}

export function suspendStudent(id: string, reason: string) {
  return prisma.studentProfile.update({
    where: { id },
    data: { isSuspended: true, suspendedAt: new Date(), suspendedReason: reason },
  });
}

export function reactivateStudent(id: string) {
  return prisma.studentProfile.update({
    where: { id },
    data: { isSuspended: false, suspendedAt: null, suspendedReason: null },
  });
}

export function grantStudyPoints(id: string, amount: number, newStudyLevel: number) {
  return prisma.studentProfile.update({
    where: { id },
    data: { studyPoints: { increment: amount }, studyLevel: newStudyLevel },
  });
}

export function countStudents() {
  return prisma.studentProfile.count();
}

export function countSuspendedStudents() {
  return prisma.studentProfile.count({ where: { isSuspended: true } });
}

// --- School Management ---

type SchoolFilter = { search?: string; state?: string; district?: string; isActive?: boolean };

function schoolWhere(filter: SchoolFilter): Prisma.SchoolWhereInput {
  return {
    state: filter.state,
    district: filter.district,
    isActive: filter.isActive,
    schoolName: filter.search ? { contains: filter.search, mode: "insensitive" } : undefined,
  };
}

export function findSchools(filter: SchoolFilter, cursor: AdminCursor | null, limit: number) {
  return prisma.school.findMany({
    where: {
      ...schoolWhere(filter),
      ...(cursor ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });
}

export function findSchoolById(id: string) {
  return prisma.school.findUnique({ where: { id } });
}

export function countStudentsInSchool(schoolId: string) {
  return prisma.studentProfile.count({ where: { schoolId } });
}

export function countEvaluatedAttemptsInSchool(schoolId: string) {
  return prisma.testAttempt.count({ where: { status: "EVALUATED", student: { studentProfile: { schoolId } } } });
}

export function setSchoolActive(id: string, isActive: boolean) {
  return prisma.school.update({ where: { id }, data: { isActive } });
}

export function countSchools() {
  return prisma.school.count();
}

export function countActiveSchools() {
  return prisma.school.count({ where: { isActive: true } });
}

export function countEvaluatedAttempts() {
  return prisma.testAttempt.count({ where: { status: "EVALUATED" } });
}

export function writeAuditLog(userId: string, eventType: string, entityType: string, entityId: string, metadata: Prisma.InputJsonValue) {
  return prisma.auditLog.create({ data: { userId, eventType, entityType, entityId, metadata } });
}
