import { Prisma } from "@prisma/client";
import type { AdminQuestionOption } from "@board-ranking/shared";
import { ConflictError, NotFoundError } from "../errors/AppError.js";
import {
  createOption as createOptionRepo,
  findActiveOptionsByQuestionId,
  findOptionById,
  updateOption as updateOptionRepo,
} from "../repositories/question-option.repository.js";
import { findQuestionById } from "../repositories/question.repository.js";
import { assertOptionRemovalAllowed } from "../rules/question-bank.rules.js";
import type { QuestionOptionCreateInput, QuestionOptionUpdateInput } from "../validators/question-bank.validators.js";

const MAX_ACTIVE_OPTIONS = 6;

export async function createOption(questionId: string, input: QuestionOptionCreateInput): Promise<AdminQuestionOption> {
  const question = await findQuestionById(questionId);
  if (!question) {
    throw new NotFoundError("Question not found");
  }

  const activeOptions = await findActiveOptionsByQuestionId(questionId);
  if (activeOptions.length >= MAX_ACTIVE_OPTIONS) {
    throw new ConflictError("A question can have at most 6 active options");
  }

  try {
    return await createOptionRepo(questionId, input);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError(
        "This option key is already in use, or another active option is already marked correct",
      );
    }
    throw err;
  }
}

export async function updateOption(
  questionId: string,
  optionId: string,
  input: QuestionOptionUpdateInput,
): Promise<AdminQuestionOption> {
  const existing = await findOptionById(optionId);
  if (!existing || existing.questionId !== questionId) {
    throw new NotFoundError("Option not found");
  }

  const isRemoving = input.isActive === false || (input.isCorrect === false && existing.isCorrect);
  if (isRemoving) {
    const activeOptions = await findActiveOptionsByQuestionId(questionId);
    const gate = assertOptionRemovalAllowed(activeOptions, existing);
    if (!gate.valid) {
      throw new ConflictError(gate.errors.join("; "), gate.errors);
    }
  }

  try {
    return await updateOptionRepo(optionId, input);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError(
        "This option key is already in use, or another active option is already marked correct",
      );
    }
    throw err;
  }
}
