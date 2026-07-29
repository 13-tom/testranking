-- CreateEnum
CREATE TYPE "TestCategory" AS ENUM ('CHAPTER', 'SUBJECT', 'FULL_SYLLABUS', 'MOCK', 'DAILY_CHALLENGE');

-- CreateEnum
CREATE TYPE "TestMode" AS ENUM ('PRACTICE', 'RANKED');

-- CreateEnum
CREATE TYPE "TestVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResultPublishPolicy" AS ENUM ('IMMEDIATE', 'AFTER_END_TIME', 'MANUAL');

-- CreateEnum
CREATE TYPE "RankingScope" AS ENUM ('NONE', 'SCHOOL', 'DISTRICT', 'STATE', 'INDIA');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('CREATED', 'STARTED', 'SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED', 'RANKED', 'ABANDONED');

-- CreateTable
CREATE TABLE "question_versions" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "reason" TEXT,
    "changeSummary" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "boardId" TEXT NOT NULL,
    "class" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "difficultyDistribution" JSONB NOT NULL,
    "questionTypeDistribution" JSONB NOT NULL DEFAULT '{"MCQ":100}',
    "positiveMarks" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "language" TEXT NOT NULL DEFAULT 'en',
    "duration" INTEGER NOT NULL,
    "passingMarks" DOUBLE PRECISION NOT NULL,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT true,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT true,
    "visibility" "TestVisibility" NOT NULL DEFAULT 'PUBLIC',
    "category" "TestCategory" NOT NULL,
    "mode" "TestMode" NOT NULL DEFAULT 'PRACTICE',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "instructions" TEXT,
    "calculatorAllowed" BOOLEAN NOT NULL DEFAULT false,
    "reviewAllowed" BOOLEAN NOT NULL DEFAULT true,
    "resultPublishPolicy" "ResultPublishPolicy" NOT NULL DEFAULT 'IMMEDIATE',
    "rankingScope" "RankingScope" NOT NULL DEFAULT 'NONE',
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "status" "TestStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_subjects" (
    "testId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "test_subjects_pkey" PRIMARY KEY ("testId","subjectId")
);

-- CreateTable
CREATE TABLE "test_chapters" (
    "testId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,

    CONSTRAINT "test_chapters_pkey" PRIMARY KEY ("testId","chapterId")
);

-- CreateTable
CREATE TABLE "test_topics" (
    "testId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "test_topics_pkey" PRIMARY KEY ("testId","topicId")
);

-- CreateTable
CREATE TABLE "test_attempts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'STARTED',
    "selectionAlgorithmVersion" TEXT NOT NULL DEFAULT 'v1',
    "selectionMeta" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "sessionId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "totalMarks" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "correctCount" INTEGER,
    "wrongCount" INTEGER,
    "unansweredCount" INTEGER,
    "timeTaken" INTEGER,
    "studyPointsEarned" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_questions" (
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "optionOrder" JSONB NOT NULL,

    CONSTRAINT "attempt_questions_pkey" PRIMARY KEY ("attemptId","questionId")
);

-- CreateTable
CREATE TABLE "student_answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionVersionId" TEXT NOT NULL,
    "selectedOptionKey" TEXT,
    "markedForReview" BOOLEAN NOT NULL DEFAULT false,
    "answerSequence" INTEGER NOT NULL,
    "clientRequestId" TEXT NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCorrect" BOOLEAN,
    "marksAwarded" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_versions_questionId_createdAt_idx" ON "question_versions"("questionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "question_versions_questionId_version_key" ON "question_versions"("questionId", "version");

-- CreateIndex
CREATE INDEX "tests_status_isActive_idx" ON "tests"("status", "isActive");

-- CreateIndex
CREATE INDEX "tests_boardId_class_idx" ON "tests"("boardId", "class");

-- CreateIndex
CREATE INDEX "tests_category_idx" ON "tests"("category");

-- CreateIndex
CREATE INDEX "test_subjects_subjectId_idx" ON "test_subjects"("subjectId");

-- CreateIndex
CREATE INDEX "test_chapters_chapterId_idx" ON "test_chapters"("chapterId");

-- CreateIndex
CREATE INDEX "test_topics_topicId_idx" ON "test_topics"("topicId");

-- CreateIndex
CREATE INDEX "test_attempts_studentId_testId_idx" ON "test_attempts"("studentId", "testId");

-- CreateIndex
CREATE INDEX "test_attempts_testId_idx" ON "test_attempts"("testId");

-- CreateIndex
CREATE INDEX "test_attempts_status_expiresAt_idx" ON "test_attempts"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "test_attempts_submittedAt_idx" ON "test_attempts"("submittedAt");

-- CreateIndex
CREATE INDEX "attempt_questions_questionId_idx" ON "attempt_questions"("questionId");

-- CreateIndex
CREATE INDEX "attempt_questions_questionVersionId_idx" ON "attempt_questions"("questionVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_questions_attemptId_displayOrder_key" ON "attempt_questions"("attemptId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "student_answers_clientRequestId_key" ON "student_answers"("clientRequestId");

-- CreateIndex
CREATE INDEX "student_answers_attemptId_idx" ON "student_answers"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "student_answers_attemptId_questionId_key" ON "student_answers"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_subjects" ADD CONSTRAINT "test_subjects_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_subjects" ADD CONSTRAINT "test_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_chapters" ADD CONSTRAINT "test_chapters_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_chapters" ADD CONSTRAINT "test_chapters_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_topics" ADD CONSTRAINT "test_topics_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_topics" ADD CONSTRAINT "test_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_questions" ADD CONSTRAINT "attempt_questions_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_questions" ADD CONSTRAINT "attempt_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_questions" ADD CONSTRAINT "attempt_questions_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- docs/04_database.md §14 — partial unique index, not expressible via
-- Prisma's @@unique (no WHERE-clause support). At most one CREATED/STARTED
-- attempt per student per test, enforced under any concurrency (double-
-- click Start, two tabs, retried requests).
CREATE UNIQUE INDEX "test_attempts_active_key"
  ON "test_attempts" ("studentId", "testId") WHERE "status" IN ('CREATED', 'STARTED');
