-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "BloomLevel" AS ENUM ('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL DEFAULT 'MCQ',
    "image" TEXT,
    "explanation" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "bloomLevel" "BloomLevel",
    "timeLimitSeconds" INTEGER,
    "positiveMarks" DOUBLE PRECISION NOT NULL,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "QuestionStatus" NOT NULL DEFAULT 'DRAFT',
    "language" TEXT NOT NULL DEFAULT 'en',
    "source" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionKey" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "optionImage" TEXT,
    "explanation" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "questions_referenceCode_key" ON "questions"("referenceCode");

-- CreateIndex
CREATE INDEX "questions_topicId_status_isActive_idx" ON "questions"("topicId", "status", "isActive");

-- CreateIndex
CREATE INDEX "questions_status_isActive_idx" ON "questions"("status", "isActive");

-- CreateIndex
CREATE INDEX "questions_difficulty_idx" ON "questions"("difficulty");

-- CreateIndex
CREATE INDEX "questions_tags_idx" ON "questions" USING GIN ("tags" array_ops);

-- CreateIndex
CREATE INDEX "question_options_questionId_isActive_idx" ON "question_options"("questionId", "isActive");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Deferred from Phase 0/1 (docs/04_database.md §10a/11/11a) — case-insensitive
-- uniqueness on academic-hierarchy names, scoped to parent. Not expressible
-- via Prisma's @@unique (no functional/expression index support).
CREATE UNIQUE INDEX "subjects_boardId_class_name_ci_key"
  ON "subjects" ("boardId", "class", lower("name"));

CREATE UNIQUE INDEX "chapters_subjectId_name_ci_key"
  ON "chapters" ("subjectId", lower("name"));

CREATE UNIQUE INDEX "topics_chapterId_name_ci_key"
  ON "topics" ("chapterId", lower("name"));

-- docs/04_database.md §13a — partial unique indexes, not expressible via
-- Prisma's @@unique (no WHERE-clause support).
CREATE UNIQUE INDEX "question_options_questionId_optionKey_active_key"
  ON "question_options" ("questionId", "optionKey") WHERE "isActive";

CREATE UNIQUE INDEX "question_options_questionId_correct_active_key"
  ON "question_options" ("questionId") WHERE "isCorrect" AND "isActive";
