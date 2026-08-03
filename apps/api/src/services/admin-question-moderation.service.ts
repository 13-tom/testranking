// Phase 9 (Admin Panel, BR-046): closes BR-041's review-queue gap. Reuses
// the existing QuestionStatus enum — DRAFT -> IN_REVIEW is already
// reachable via the existing generic PATCH /admin/questions/:id, so this
// module only covers the IN_REVIEW-onward transitions plus bulk variants.
import type { QuestionStatus } from "@prisma/client";
import type {
  AdminQuestionModerationAction,
  BulkModerationResultData,
  BulkQuestionModerationInput,
  ReviewQueueItem,
  ReviewQueueResponseData,
} from "@board-ranking/shared";
import { ConflictError, NotFoundError } from "../errors/AppError.js";
import {
  bulkUpdateQuestionStatus,
  findQuestionStatusById,
  findReviewQueue,
  updateQuestionStatus,
  writeAuditLog,
} from "../repositories/admin.repository.js";
import { decodeAdminCursor, encodeAdminCursor, evaluateQuestionModeration, questionSourceStatuses, questionTargetStatus } from "../rules/admin.rules.js";
import type { ReviewQueueQuery } from "../validators/admin.validators.js";

const DEFAULT_LIMIT = 20;

export async function getReviewQueue(query: ReviewQueueQuery): Promise<ReviewQueueResponseData> {
  const limit = query.limit ?? DEFAULT_LIMIT;
  const cursor = decodeAdminCursor(query.cursor);
  const rows = await findReviewQueue(cursor, limit);

  const items: ReviewQueueItem[] = rows.map((row) => ({
    id: row.id,
    referenceCode: row.referenceCode,
    questionText: row.questionText,
    difficulty: row.difficulty,
    status: row.status,
    topicId: row.topicId,
    updatedAt: row.updatedAt.toISOString(),
  }));

  const last = rows[rows.length - 1];
  const nextCursor = rows.length === limit && last ? encodeAdminCursor({ createdAt: last.createdAt, id: last.id }) : null;

  return { items, nextCursor };
}

async function moderateQuestion(adminId: string, questionId: string, action: AdminQuestionModerationAction): Promise<void> {
  const question = await findQuestionStatusById(questionId);
  if (!question) {
    throw new NotFoundError("Question not found");
  }

  const evaluation = evaluateQuestionModeration(question.status, action);
  if (!evaluation.valid) {
    throw new ConflictError(evaluation.error ?? "Invalid status transition");
  }

  const targetStatus = questionTargetStatus(action) as QuestionStatus;
  await updateQuestionStatus(questionId, targetStatus);
  await writeAuditLog(adminId, `ADMIN_QUESTION_${action.toUpperCase()}`, "Question", questionId, { fromStatus: question.status, toStatus: targetStatus });
}

export function approveQuestion(adminId: string, questionId: string): Promise<void> {
  return moderateQuestion(adminId, questionId, "approve");
}

export function rejectQuestion(adminId: string, questionId: string): Promise<void> {
  return moderateQuestion(adminId, questionId, "reject");
}

export function archiveQuestion(adminId: string, questionId: string): Promise<void> {
  return moderateQuestion(adminId, questionId, "archive");
}

async function bulkModerateQuestions(
  adminId: string,
  input: BulkQuestionModerationInput,
  action: AdminQuestionModerationAction,
): Promise<BulkModerationResultData> {
  const fromStatuses = questionSourceStatuses(action) as QuestionStatus[];
  const targetStatus = questionTargetStatus(action) as QuestionStatus;
  const result = await bulkUpdateQuestionStatus(input.questionIds, fromStatuses, targetStatus);
  await writeAuditLog(adminId, `ADMIN_QUESTION_BULK_${action.toUpperCase()}`, "Question", "bulk", {
    requestedIds: input.questionIds,
    toStatus: targetStatus,
    updated: result.count,
  });
  return { requested: input.questionIds.length, updated: result.count };
}

export function bulkApproveQuestions(adminId: string, input: BulkQuestionModerationInput): Promise<BulkModerationResultData> {
  return bulkModerateQuestions(adminId, input, "approve");
}

export function bulkRejectQuestions(adminId: string, input: BulkQuestionModerationInput): Promise<BulkModerationResultData> {
  return bulkModerateQuestions(adminId, input, "reject");
}

export function bulkArchiveQuestions(adminId: string, input: BulkQuestionModerationInput): Promise<BulkModerationResultData> {
  return bulkModerateQuestions(adminId, input, "archive");
}
