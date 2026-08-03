import type {
  AdminStudentDetail,
  AdminStudentSummary,
  GrantPointsInput,
  StudentListResponseData,
  SuspendStudentInput,
} from "@board-ranking/shared";
import { ConflictError, NotFoundError } from "../errors/AppError.js";
import {
  findStudentProfileById,
  findStudents,
  grantStudyPoints,
  reactivateStudent as reactivateStudentRepo,
  suspendStudent as suspendStudentRepo,
  writeAuditLog,
} from "../repositories/admin.repository.js";
import { computeStudyLevel } from "../rules/gamification.rules.js";
import { decodeAdminCursor, encodeAdminCursor, evaluateSuspensionTransition } from "../rules/admin.rules.js";
import type { AdminStudentsQuery } from "../validators/admin.validators.js";

const DEFAULT_LIMIT = 20;

type StudentListRow = {
  id: string;
  fullName: string;
  class: number;
  schoolId: string | null;
  studyPoints: number;
  isSuspended: boolean;
  createdAt: Date;
  school: { schoolName: string } | null;
  user: { email: string };
};

function toSummary(row: StudentListRow): AdminStudentSummary {
  return {
    id: row.id,
    email: row.user.email,
    fullName: row.fullName,
    class: row.class,
    schoolId: row.schoolId,
    schoolName: row.school?.schoolName ?? null,
    studyPoints: row.studyPoints,
    isSuspended: row.isSuspended,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listStudents(query: AdminStudentsQuery): Promise<StudentListResponseData> {
  const limit = query.limit ?? DEFAULT_LIMIT;
  const cursor = decodeAdminCursor(query.cursor);
  const rows = await findStudents({ search: query.search, class: query.class, schoolId: query.schoolId, isSuspended: query.isSuspended }, cursor, limit);

  const items = rows.map(toSummary);
  const last = rows[rows.length - 1];
  const nextCursor = rows.length === limit && last ? encodeAdminCursor({ createdAt: last.createdAt, id: last.id }) : null;

  return { items, nextCursor };
}

export async function getStudentDetail(id: string): Promise<AdminStudentDetail> {
  const row = await findStudentProfileById(id);
  if (!row) {
    throw new NotFoundError("Student not found");
  }
  return {
    ...toSummary(row),
    studyLevel: row.studyLevel,
    studyStreak: row.studyStreak,
    longestStreak: row.longestStreak,
    profileCompletion: row.profileCompletion,
    suspendedAt: row.suspendedAt ? row.suspendedAt.toISOString() : null,
    suspendedReason: row.suspendedReason,
    lastLogin: row.user.lastLogin ? row.user.lastLogin.toISOString() : null,
  };
}

async function assertStudentExists(id: string): Promise<{ isSuspended: boolean }> {
  const row = await findStudentProfileById(id);
  if (!row) {
    throw new NotFoundError("Student not found");
  }
  return row;
}

export async function suspendStudent(adminId: string, id: string, input: SuspendStudentInput): Promise<AdminStudentDetail> {
  const existing = await assertStudentExists(id);
  const evaluation = evaluateSuspensionTransition(existing.isSuspended, "suspend");
  if (!evaluation.valid) {
    throw new ConflictError(evaluation.error ?? "Invalid suspension transition");
  }
  await suspendStudentRepo(id, input.reason);
  await writeAuditLog(adminId, "ADMIN_STUDENT_SUSPENDED", "StudentProfile", id, { reason: input.reason });
  return getStudentDetail(id);
}

export async function reactivateStudent(adminId: string, id: string): Promise<AdminStudentDetail> {
  const existing = await assertStudentExists(id);
  const evaluation = evaluateSuspensionTransition(existing.isSuspended, "reactivate");
  if (!evaluation.valid) {
    throw new ConflictError(evaluation.error ?? "Invalid suspension transition");
  }
  await reactivateStudentRepo(id);
  await writeAuditLog(adminId, "ADMIN_STUDENT_REACTIVATED", "StudentProfile", id, {});
  return getStudentDetail(id);
}

export async function grantPoints(adminId: string, id: string, input: GrantPointsInput): Promise<AdminStudentDetail> {
  const row = await findStudentProfileById(id);
  if (!row) {
    throw new NotFoundError("Student not found");
  }
  const { level } = computeStudyLevel(row.studyPoints + input.amount);
  await grantStudyPoints(id, input.amount, level);
  await writeAuditLog(adminId, "ADMIN_STUDENT_POINTS_GRANTED", "StudentProfile", id, { amount: input.amount, reason: input.reason });
  return getStudentDetail(id);
}
