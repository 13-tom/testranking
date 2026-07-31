-- CreateTable
CREATE TABLE "leaderboard" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'ALL_TIME',
    "schoolRank" INTEGER,
    "districtRank" INTEGER,
    "stateRank" INTEGER,
    "indiaRank" INTEGER,
    "studyPoints" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rank_snapshots" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "studyPoints" INTEGER NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'ALL_TIME',
    "academicYear" TEXT NOT NULL,
    "rankingVersion" INTEGER NOT NULL DEFAULT 1,
    "testId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "rank_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_studentId_key" ON "leaderboard"("studentId");

-- CreateIndex
CREATE INDEX "leaderboard_schoolRank_idx" ON "leaderboard"("schoolRank");

-- CreateIndex
CREATE INDEX "leaderboard_districtRank_idx" ON "leaderboard"("districtRank");

-- CreateIndex
CREATE INDEX "leaderboard_stateRank_idx" ON "leaderboard"("stateRank");

-- CreateIndex
CREATE INDEX "leaderboard_indiaRank_idx" ON "leaderboard"("indiaRank");

-- CreateIndex
CREATE INDEX "leaderboard_studyPoints_idx" ON "leaderboard"("studyPoints");

-- CreateIndex
CREATE INDEX "rank_snapshots_studentId_scope_period_computedAt_idx" ON "rank_snapshots"("studentId", "scope", "period", "computedAt");

-- CreateIndex
CREATE INDEX "rank_snapshots_scope_scopeId_period_rankingVersion_rank_idx" ON "rank_snapshots"("scope", "scopeId", "period", "rankingVersion", "rank");

-- CreateIndex
CREATE INDEX "rank_snapshots_isPublished_computedAt_idx" ON "rank_snapshots"("isPublished", "computedAt");

-- AddForeignKey
ALTER TABLE "leaderboard" ADD CONSTRAINT "leaderboard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rank_snapshots" ADD CONSTRAINT "rank_snapshots_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rank_snapshots" ADD CONSTRAINT "rank_snapshots_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
