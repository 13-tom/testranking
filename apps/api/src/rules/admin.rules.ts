// Phase 9 (Admin Panel, BR-046): pure lifecycle-guard checks — no I/O.
import type { AdminQuestionModerationAction } from "@board-ranking/shared";

// Shared keyset-pagination cursor for this phase's admin lists (review
// queue, students, schools): all order by createdAt desc, id desc.
export type AdminCursor = { createdAt: Date; id: string };

export function encodeAdminCursor(cursor: AdminCursor): string {
  return Buffer.from(JSON.stringify({ createdAt: cursor.createdAt.toISOString(), id: cursor.id })).toString("base64url");
}

export function decodeAdminCursor(raw: string | undefined): AdminCursor | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed === "object" && parsed !== null && typeof (parsed as { createdAt?: unknown }).createdAt === "string" && typeof (parsed as { id?: unknown }).id === "string") {
      const { createdAt, id } = parsed as { createdAt: string; id: string };
      return { createdAt: new Date(createdAt), id };
    }
    return null;
  } catch {
    return null;
  }
}

const QUESTION_SOURCE_STATUSES: Record<AdminQuestionModerationAction, readonly string[]> = {
  approve: ["IN_REVIEW"],
  reject: ["IN_REVIEW"],
  archive: ["APPROVED", "PUBLISHED"],
};

const QUESTION_TARGET_STATUS: Record<AdminQuestionModerationAction, string> = {
  approve: "APPROVED",
  reject: "REJECTED",
  archive: "ARCHIVED",
};

export function questionTargetStatus(action: AdminQuestionModerationAction): string {
  return QUESTION_TARGET_STATUS[action];
}

export function questionSourceStatuses(action: AdminQuestionModerationAction): readonly string[] {
  return QUESTION_SOURCE_STATUSES[action];
}

export function evaluateQuestionModeration(
  currentStatus: string,
  action: AdminQuestionModerationAction,
): { valid: boolean; error?: string } {
  const allowed = QUESTION_SOURCE_STATUSES[action];
  if (!allowed.includes(currentStatus)) {
    return { valid: false, error: `Cannot ${action} a question with status ${currentStatus} (expected ${allowed.join(" or ")})` };
  }
  return { valid: true };
}

export function evaluateSuspensionTransition(isSuspended: boolean, action: "suspend" | "reactivate"): { valid: boolean; error?: string } {
  if (action === "suspend" && isSuspended) {
    return { valid: false, error: "Student is already suspended" };
  }
  if (action === "reactivate" && !isSuspended) {
    return { valid: false, error: "Student is not suspended" };
  }
  return { valid: true };
}

export function evaluateSchoolActiveTransition(isActive: boolean, action: "archive" | "activate"): { valid: boolean; error?: string } {
  if (action === "archive" && !isActive) {
    return { valid: false, error: "School is already archived" };
  }
  if (action === "activate" && isActive) {
    return { valid: false, error: "School is already active" };
  }
  return { valid: true };
}

export function evaluateTestUnpublish(status: string): { valid: boolean; error?: string } {
  if (status !== "ACTIVE") {
    return { valid: false, error: "Only an ACTIVE test can be unpublished" };
  }
  return { valid: true };
}
