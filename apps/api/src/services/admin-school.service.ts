import type { AdminSchoolDetail, AdminSchoolSummary, SchoolListResponseData, SchoolStatsResponseData } from "@board-ranking/shared";
import { ConflictError, NotFoundError } from "../errors/AppError.js";
import {
  countEvaluatedAttemptsInSchool,
  countStudentsInSchool,
  findSchoolById,
  findSchools,
  setSchoolActive,
  writeAuditLog,
} from "../repositories/admin.repository.js";
import { decodeAdminCursor, encodeAdminCursor, evaluateSchoolActiveTransition } from "../rules/admin.rules.js";
import type { AdminSchoolsQuery } from "../validators/admin.validators.js";

const DEFAULT_LIMIT = 20;

type SchoolRow = {
  id: string;
  schoolName: string;
  city: string;
  district: string;
  state: string;
  isActive: boolean;
  board: string;
  country: string;
  postalCode: string;
  createdAt: Date;
};

function toSummary(row: SchoolRow): AdminSchoolSummary {
  return {
    id: row.id,
    schoolName: row.schoolName,
    city: row.city,
    district: row.district,
    state: row.state,
    isActive: row.isActive,
  };
}

function toDetail(row: SchoolRow): AdminSchoolDetail {
  return {
    ...toSummary(row),
    board: row.board,
    country: row.country,
    postalCode: row.postalCode,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listSchools(query: AdminSchoolsQuery): Promise<SchoolListResponseData> {
  const limit = query.limit ?? DEFAULT_LIMIT;
  const cursor = decodeAdminCursor(query.cursor);
  const rows = await findSchools({ search: query.search, state: query.state, district: query.district, isActive: query.isActive }, cursor, limit);

  const items = rows.map(toSummary);
  const last = rows[rows.length - 1];
  const nextCursor = rows.length === limit && last ? encodeAdminCursor({ createdAt: last.createdAt, id: last.id }) : null;

  return { items, nextCursor };
}

export async function getSchoolDetail(id: string): Promise<AdminSchoolDetail> {
  const row = await findSchoolById(id);
  if (!row) {
    throw new NotFoundError("School not found");
  }
  return toDetail(row);
}

export async function getSchoolStats(id: string): Promise<SchoolStatsResponseData> {
  const row = await findSchoolById(id);
  if (!row) {
    throw new NotFoundError("School not found");
  }
  const [studentCount, evaluatedAttemptCount] = await Promise.all([countStudentsInSchool(id), countEvaluatedAttemptsInSchool(id)]);
  return { studentCount, evaluatedAttemptCount };
}

async function setActive(adminId: string, id: string, action: "archive" | "activate"): Promise<AdminSchoolDetail> {
  const existing = await findSchoolById(id);
  if (!existing) {
    throw new NotFoundError("School not found");
  }
  const evaluation = evaluateSchoolActiveTransition(existing.isActive, action);
  if (!evaluation.valid) {
    throw new ConflictError(evaluation.error ?? "Invalid school status transition");
  }
  const updated = await setSchoolActive(id, action === "activate");
  await writeAuditLog(adminId, action === "archive" ? "ADMIN_SCHOOL_ARCHIVED" : "ADMIN_SCHOOL_ACTIVATED", "School", id, {});
  return toDetail(updated);
}

export function archiveSchool(adminId: string, id: string): Promise<AdminSchoolDetail> {
  return setActive(adminId, id, "archive");
}

export function activateSchool(adminId: string, id: string): Promise<AdminSchoolDetail> {
  return setActive(adminId, id, "activate");
}
