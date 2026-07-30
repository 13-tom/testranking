-- CreateTable
CREATE TABLE "student_analytics" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "testsTaken" INTEGER NOT NULL DEFAULT 0,
    "testsCompleted" INTEGER NOT NULL DEFAULT 0,
    "questionsSolved" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "incorrectAnswers" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averagePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageRank" INTEGER,
    "bestRank" INTEGER,
    "totalStudyTime" INTEGER NOT NULL DEFAULT 0,
    "lastTestDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_subject_analytics" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "questionsSolved" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "incorrectAnswers" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageTimePerQuestion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_subject_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_chapter_analytics" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "questionsSolved" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "incorrectAnswers" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageTimePerQuestion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weaknessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_chapter_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_topic_analytics" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "questionsSolved" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "incorrectAnswers" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageTimePerQuestion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "masteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_topic_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_progress_snapshots" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "rank" INTEGER,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averagePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "studyPoints" INTEGER NOT NULL DEFAULT 0,
    "testsTaken" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_progress_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_analytics_studentId_key" ON "student_analytics"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_subject_analytics_studentId_subjectId_key" ON "student_subject_analytics"("studentId", "subjectId");

-- CreateIndex
CREATE INDEX "student_chapter_analytics_studentId_weaknessScore_idx" ON "student_chapter_analytics"("studentId", "weaknessScore");

-- CreateIndex
CREATE UNIQUE INDEX "student_chapter_analytics_studentId_chapterId_key" ON "student_chapter_analytics"("studentId", "chapterId");

-- CreateIndex
CREATE INDEX "student_topic_analytics_studentId_masteryScore_idx" ON "student_topic_analytics"("studentId", "masteryScore");

-- CreateIndex
CREATE UNIQUE INDEX "student_topic_analytics_studentId_topicId_key" ON "student_topic_analytics"("studentId", "topicId");

-- CreateIndex
CREATE INDEX "student_progress_snapshots_studentId_date_idx" ON "student_progress_snapshots"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "student_progress_snapshots_studentId_date_key" ON "student_progress_snapshots"("studentId", "date");

-- AddForeignKey
ALTER TABLE "student_analytics" ADD CONSTRAINT "student_analytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_subject_analytics" ADD CONSTRAINT "student_subject_analytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_subject_analytics" ADD CONSTRAINT "student_subject_analytics_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_chapter_analytics" ADD CONSTRAINT "student_chapter_analytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_chapter_analytics" ADD CONSTRAINT "student_chapter_analytics_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_topic_analytics" ADD CONSTRAINT "student_topic_analytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_topic_analytics" ADD CONSTRAINT "student_topic_analytics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_progress_snapshots" ADD CONSTRAINT "student_progress_snapshots_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
