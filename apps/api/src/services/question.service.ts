import { Prisma } from "@prisma/client";
import type { AdminQuestion } from "@board-ranking/shared";
import { ConflictError, NotFoundError } from "../errors/AppError.js";
import {
  countQuestionsInChapter,
  createQuestion as createQuestionRepo,
  findQuestionById,
  updateQuestion as updateQuestionRepo,
} from "../repositories/question.repository.js";
import { findTopicWithHierarchyById } from "../repositories/topic.repository.js";
import { buildReferenceCode, evaluatePublishGate } from "../rules/question-bank.rules.js";
import type { QuestionCreateInput, QuestionUpdateInput } from "../validators/question-bank.validators.js";

const MAX_REFERENCE_CODE_RETRIES = 5;

export async function createQuestion(input: QuestionCreateInput): Promise<AdminQuestion> {
  const topic = await findTopicWithHierarchyById(input.topicId);
  if (!topic) {
    throw new NotFoundError("Topic not found");
  }
  const { chapter } = topic;
  const { subject } = chapter;

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_REFERENCE_CODE_RETRIES; attempt++) {
    const existingCount = await countQuestionsInChapter(chapter.id);
    const referenceCode = buildReferenceCode({
      classLevel: subject.class,
      subjectName: subject.name,
      chapterNumber: chapter.chapterNumber,
      sequenceInChapter: existingCount + 1 + attempt,
    });

    try {
      const question = await createQuestionRepo({
        referenceCode,
        topic: { connect: { id: input.topicId } },
        questionText: input.questionText,
        image: input.image,
        explanation: input.explanation,
        difficulty: input.difficulty,
        bloomLevel: input.bloomLevel,
        timeLimitSeconds: input.timeLimitSeconds,
        positiveMarks: input.positiveMarks,
        negativeMarks: input.negativeMarks ?? 0,
        language: input.language ?? "en",
        source: input.source,
        tags: input.tags ?? [],
      });
      return toAdminQuestion(question);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw new ConflictError("Could not generate a unique reference code, please retry", [String(lastError)]);
}

export async function getQuestion(id: string): Promise<AdminQuestion> {
  const question = await findQuestionById(id);
  if (!question) {
    throw new NotFoundError("Question not found");
  }
  return toAdminQuestion(question);
}

export async function updateQuestion(id: string, input: QuestionUpdateInput): Promise<AdminQuestion> {
  const existing = await findQuestionById(id);
  if (!existing) {
    throw new NotFoundError("Question not found");
  }

  if (input.status === "PUBLISHED") {
    const explanation = input.explanation !== undefined ? input.explanation : existing.explanation;
    const gate = evaluatePublishGate({ explanation, questionType: existing.questionType }, existing.options);
    if (!gate.valid) {
      throw new ConflictError(gate.errors.join("; "), gate.errors);
    }
  }

  try {
    const question = await updateQuestionRepo(id, {
      questionText: input.questionText,
      image: input.image,
      explanation: input.explanation,
      difficulty: input.difficulty,
      bloomLevel: input.bloomLevel,
      timeLimitSeconds: input.timeLimitSeconds,
      positiveMarks: input.positiveMarks,
      negativeMarks: input.negativeMarks,
      status: input.status,
      language: input.language,
      source: input.source,
      tags: input.tags,
      isActive: input.isActive,
    });
    return toAdminQuestion(question);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("Update conflicts with an existing question");
    }
    throw err;
  }
}

type QuestionRow = {
  id: string;
  referenceCode: string;
  topicId: string;
  questionText: string;
  questionType: string;
  image: string | null;
  explanation: string | null;
  difficulty: string;
  bloomLevel: string | null;
  timeLimitSeconds: number | null;
  positiveMarks: number;
  negativeMarks: number;
  status: string;
  language: string;
  source: string | null;
  tags: string[];
  isActive: boolean;
  options: Array<{
    id: string;
    optionKey: string;
    optionText: string;
    optionImage: string | null;
    explanation: string | null;
    isCorrect: boolean;
    displayOrder: number;
    isActive: boolean;
  }>;
};

function toAdminQuestion(question: QuestionRow): AdminQuestion {
  return {
    id: question.id,
    referenceCode: question.referenceCode,
    topicId: question.topicId,
    questionText: question.questionText,
    questionType: "MCQ",
    image: question.image,
    explanation: question.explanation,
    difficulty: question.difficulty as AdminQuestion["difficulty"],
    bloomLevel: question.bloomLevel as AdminQuestion["bloomLevel"],
    timeLimitSeconds: question.timeLimitSeconds,
    positiveMarks: question.positiveMarks,
    negativeMarks: question.negativeMarks,
    status: question.status as AdminQuestion["status"],
    language: question.language,
    source: question.source,
    tags: question.tags,
    isActive: question.isActive,
    options: question.options,
  };
}
