import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { signToken } from "../src/lib/jwt.js";

const app = createApp();

describe("Ranking System", () => {
  const suffix = Date.now();
  const topStudentEmail = `rank-top.${suffix}@example.com`;
  const bottomStudentEmail = `rank-bottom.${suffix}@example.com`;
  const noSchoolStudentEmail = `rank-noschool.${suffix}@example.com`;
  const adminEmail = `rank-admin.${suffix}@example.com`;

  let topToken: string;
  let bottomToken: string;
  let noSchoolToken: string;
  let topStudentId: string;
  let bottomStudentId: string;
  let adminToken: string;
  let boardId: string;
  let subjectId: string;
  let topicId: string;
  let schoolId: string;
  let questionIds: string[];

  async function waitForIndiaRank(studentId: string, token: string): Promise<number | null> {
    for (let attempt = 0; attempt < 30; attempt++) {
      const res = await request(app).get(`/api/v1/students/${studentId}/ranks`).set("Authorization", `Bearer ${token}`);
      if (res.body.data.indiaRank !== null) {
        return res.body.data.indiaRank as number;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return null;
  }

  async function createPublishedQuestion(tag: string) {
    const qRes = await request(app)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ topicId, questionText: `Rank Q ${tag}`, difficulty: "EASY", explanation: "Because.", positiveMarks: 1 });
    const questionId = qRes.body.data.id as string;

    await request(app)
      .post(`/api/v1/admin/questions/${questionId}/options`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ optionKey: "A", optionText: "Correct", isCorrect: true });
    await request(app)
      .post(`/api/v1/admin/questions/${questionId}/options`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ optionKey: "B", optionText: "Wrong", isCorrect: false });
    await request(app)
      .patch(`/api/v1/admin/questions/${questionId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "PUBLISHED" });

    return questionId;
  }

  async function createAndPublishTest(overrides: Record<string, unknown> = {}) {
    const res = await request(app)
      .post("/api/v1/admin/tests")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: `Rank Test ${suffix}-${randomUUID().slice(0, 8)}`,
        boardId,
        class: 10,
        questionCount: 4,
        difficultyDistribution: { EASY: 100, MEDIUM: 0, HARD: 0 },
        duration: 30,
        passingMarks: 1,
        category: "CHAPTER",
        mode: "RANKED",
        rankingScope: "INDIA",
        subjectIds: [subjectId],
        ...overrides,
      });
    expect(res.status).toBe(201);
    const testId = res.body.data.id as string;
    const publishRes = await request(app).patch(`/api/v1/admin/tests/${testId}/publish`).set("Authorization", `Bearer ${adminToken}`);
    expect(publishRes.status).toBe(200);
    return testId;
  }

  async function submitAllCorrect(testId: string, token: string, correctCount: number) {
    const startRes = await request(app).post(`/api/v1/tests/${testId}/attempts`).set("Authorization", `Bearer ${token}`).send({});
    expect(startRes.status).toBe(201);
    const attemptId = startRes.body.data.attemptId as string;
    const questions = startRes.body.data.questions as Array<{ questionId: string }>;

    let seq = 1;
    for (let i = 0; i < questions.length; i++) {
      const selectedOptionKey = i < correctCount ? "A" : "B";
      await request(app)
        .put(`/api/v1/attempts/${attemptId}/answers/${questions[i]!.questionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ selectedOptionKey, answerSequence: seq++, clientRequestId: randomUUID() });
    }

    const submitRes = await request(app).post(`/api/v1/attempts/${attemptId}/submit`).set("Authorization", `Bearer ${token}`);
    expect(submitRes.status).toBe(200);
    return { attemptId, submitRes };
  }

  beforeAll(async () => {
    const school = await prisma.school.create({
      data: {
        schoolName: `Rank Test School ${suffix}`,
        board: "CBSE",
        city: "Delhi",
        district: `Rank District ${suffix}`,
        state: `Rank State ${suffix}`,
        country: "India",
        postalCode: "110001",
      },
    });
    schoolId = school.id;

    const topRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: topStudentEmail, password: "hunter22", fullName: "Top Student", class: 10, schoolId });
    topToken = topRes.body.data.token as string;
    topStudentId = topRes.body.data.user.id as string;

    const bottomRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: bottomStudentEmail, password: "hunter22", fullName: "Bottom Student", class: 10, schoolId });
    bottomToken = bottomRes.body.data.token as string;
    bottomStudentId = bottomRes.body.data.user.id as string;

    const noSchoolRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: noSchoolStudentEmail, password: "hunter22", fullName: "No School Student", class: 10 });
    noSchoolToken = noSchoolRes.body.data.token as string;

    const adminUser = await prisma.user.create({ data: { email: adminEmail, passwordHash: "not-used", role: "ADMIN" } });
    adminToken = signToken({ sub: adminUser.id, role: "ADMIN" });

    const board = await prisma.board.upsert({
      where: { name: `Rank Board ${suffix}` },
      update: {},
      create: { name: `Rank Board ${suffix}` },
    });
    boardId = board.id;

    const subjectRes = await request(app)
      .post("/api/v1/admin/subjects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Rank Subject ${suffix}`, boardId, class: 10 });
    subjectId = subjectRes.body.data.id as string;

    const chapterRes = await request(app)
      .post("/api/v1/admin/chapters")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ subjectId, name: "Rank Chapter", chapterNumber: (suffix % 89) + 1 });
    const chapterId = chapterRes.body.data.id as string;

    const topicRes = await request(app)
      .post("/api/v1/admin/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ chapterId, name: "Rank Topic" });
    topicId = topicRes.body.data.id as string;

    questionIds = [];
    for (let i = 0; i < 4; i++) {
      questionIds.push(await createPublishedQuestion(`q${i}`));
    }
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [topStudentEmail, bottomStudentEmail, noSchoolStudentEmail, adminEmail] } } });
    await prisma.school.deleteMany({ where: { id: schoolId } });
    await prisma.$disconnect();
  });

  it("ranks a RANKED submission and reflects it on /students/:id/ranks, /leaderboards, and rank-history", async () => {
    const testId = await createAndPublishTest();

    await submitAllCorrect(testId, topToken, 4);
    await submitAllCorrect(testId, bottomToken, 1);

    const topRank = await waitForIndiaRank(topStudentId, topToken);
    const bottomRank = await waitForIndiaRank(bottomStudentId, bottomToken);

    expect(topRank).toBe(1);
    expect(bottomRank).toBe(2);

    // Same school + INDIA rankingScope cascades down (BR-044) — both
    // students share a school, so schoolRank should also be populated.
    const topRanks = await request(app).get(`/api/v1/students/${topStudentId}/ranks`).set("Authorization", `Bearer ${topToken}`);
    expect(topRanks.body.data.schoolRank).toBe(1);
    expect(topRanks.body.data.districtRank).toBe(1);
    expect(topRanks.body.data.stateRank).toBe(1);

    const leaderboardRes = await request(app).get("/api/v1/leaderboards/NATIONAL/INDIA").set("Authorization", `Bearer ${topToken}`);
    expect(leaderboardRes.status).toBe(200);
    const entries = leaderboardRes.body.data.items as Array<{ rank: number; studentId: string }>;
    const topEntry = entries.find((e) => e.studentId === topStudentId);
    const bottomEntry = entries.find((e) => e.studentId === bottomStudentId);
    expect(topEntry?.rank).toBe(1);
    expect(bottomEntry?.rank).toBe(2);

    const historyRes = await request(app).get(`/api/v1/students/${topStudentId}/rank-history`).set("Authorization", `Bearer ${topToken}`);
    expect(historyRes.status).toBe(200);
    const nationalEntry = (historyRes.body.data.items as Array<{ scope: string; rank: number }>).find((e) => e.scope === "NATIONAL");
    expect(nationalEntry?.rank).toBe(1);

    // A student can't read another student's rank history.
    const forbiddenRes = await request(app).get(`/api/v1/students/${topStudentId}/rank-history`).set("Authorization", `Bearer ${bottomToken}`);
    expect(forbiddenRes.status).toBe(403);
  }, 20000);

  it("never ranks a PRACTICE-mode attempt", async () => {
    const testId = await createAndPublishTest({ mode: "PRACTICE", rankingScope: "NONE" });
    const { attemptId } = await submitAllCorrect(testId, noSchoolToken, 4);

    await new Promise((resolve) => setTimeout(resolve, 500));
    const attempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } });
    expect(attempt?.status).toBe("EVALUATED");
  });

  it("leaves SCHOOL/DISTRICT/STATE rank null for a student with no school", async () => {
    const testId = await createAndPublishTest();
    const meRes = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${noSchoolToken}`);
    const noSchoolStudentId = meRes.body.data.user.id as string;

    await submitAllCorrect(testId, noSchoolToken, 2);
    const indiaRank = await waitForIndiaRank(noSchoolStudentId, noSchoolToken);
    expect(indiaRank).not.toBeNull();

    const ranksRes = await request(app).get(`/api/v1/students/${noSchoolStudentId}/ranks`).set("Authorization", `Bearer ${noSchoolToken}`);
    expect(ranksRes.body.data.schoolRank).toBeNull();
    expect(ranksRes.body.data.districtRank).toBeNull();
    expect(ranksRes.body.data.stateRank).toBeNull();
  }, 20000);
});
