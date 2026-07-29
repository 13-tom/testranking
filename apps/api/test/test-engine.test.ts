import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { signToken } from "../src/lib/jwt.js";

const app = createApp();

describe("Test Engine", () => {
  const suffix = Date.now();
  const studentEmail = `te-student.${suffix}@example.com`;
  const adminEmail = `te-admin.${suffix}@example.com`;

  let studentToken: string;
  let adminToken: string;
  let boardId: string;
  let subjectId: string;
  let topicId: string;

  async function createPublishedQuestion(difficulty: "EASY" | "MEDIUM" | "HARD", tag: string) {
    const qRes = await request(app)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ topicId, questionText: `Q ${tag}`, difficulty, explanation: "Because.", positiveMarks: 1 });
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
        name: `TE Test ${suffix}-${randomUUID().slice(0, 8)}`,
        boardId,
        class: 10,
        questionCount: 4,
        difficultyDistribution: { EASY: 50, MEDIUM: 25, HARD: 25 },
        duration: 30,
        passingMarks: 1,
        category: "CHAPTER",
        mode: "PRACTICE",
        subjectIds: [subjectId],
        ...overrides,
      });
    expect(res.status).toBe(201);
    const testId = res.body.data.id as string;

    const publishRes = await request(app).patch(`/api/v1/admin/tests/${testId}/publish`).set("Authorization", `Bearer ${adminToken}`);
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.status).toBe("ACTIVE");
    return testId;
  }

  beforeAll(async () => {
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: studentEmail, password: "hunter22", fullName: "TE Student", class: 10 });
    studentToken = registerRes.body.data.token as string;

    const adminUser = await prisma.user.create({ data: { email: adminEmail, passwordHash: "not-used", role: "ADMIN" } });
    adminToken = signToken({ sub: adminUser.id, role: "ADMIN" });

    const board = await prisma.board.upsert({
      where: { name: `TE Board ${suffix}` },
      update: {},
      create: { name: `TE Board ${suffix}` },
    });
    boardId = board.id;

    const subjectRes = await request(app)
      .post("/api/v1/admin/subjects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `TE Subject ${suffix}`, boardId, class: 10 });
    subjectId = subjectRes.body.data.id as string;

    const chapterRes = await request(app)
      .post("/api/v1/admin/chapters")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ subjectId, name: "TE Chapter", chapterNumber: (suffix % 89) + 1 });
    const chapterId = chapterRes.body.data.id as string;

    const topicRes = await request(app)
      .post("/api/v1/admin/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ chapterId, name: "TE Topic" });
    topicId = topicRes.body.data.id as string;

    // Pool: 2 EASY, 1 MEDIUM, 1 HARD — satisfies questionCount:4, 50/25/25.
    await createPublishedQuestion("EASY", "e1");
    await createPublishedQuestion("EASY", "e2");
    await createPublishedQuestion("MEDIUM", "m1");
    await createPublishedQuestion("HARD", "h1");
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [studentEmail, adminEmail] } } });
    await prisma.$disconnect();
  });

  it("runs the full authoring -> attempt -> submit -> result flow", async () => {
    const testId = await createAndPublishTest();

    const startRes = await request(app).post(`/api/v1/tests/${testId}/attempts`).set("Authorization", `Bearer ${studentToken}`).send({});
    expect(startRes.status).toBe(201);
    expect(startRes.body.data.status).toBe("STARTED");
    expect(startRes.body.data.questions).toHaveLength(4);
    // Pre-submission questions never reveal the correct answer.
    expect(startRes.body.data.questions[0]).not.toHaveProperty("isCorrect");
    expect(startRes.body.data.questions[0]).not.toHaveProperty("correctOptionKey");
    const attemptId = startRes.body.data.attemptId as string;

    let seq = 1;
    for (const q of startRes.body.data.questions as Array<{ questionId: string }>) {
      const answerRes = await request(app)
        .put(`/api/v1/attempts/${attemptId}/answers/${q.questionId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ selectedOptionKey: "A", answerSequence: seq++, clientRequestId: randomUUID() });
      expect(answerRes.status).toBe(200);
    }

    const submitRes = await request(app).post(`/api/v1/attempts/${attemptId}/submit`).set("Authorization", `Bearer ${studentToken}`);
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.status).toBe("EVALUATED");
    expect(submitRes.body.data.correctCount).toBe(4);
    expect(submitRes.body.data.score).toBe(4);

    const resultRes = await request(app).get(`/api/v1/attempts/${attemptId}/result`).set("Authorization", `Bearer ${studentToken}`);
    expect(resultRes.status).toBe(200);
    expect(resultRes.body.data.questions).toHaveLength(4);
    expect(resultRes.body.data.questions[0].correctOptionKey).toBe("A");
  });

  it("rejects publishing a test whose blueprint the question pool can't satisfy", async () => {
    const res = await request(app)
      .post("/api/v1/admin/tests")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: `TE Underfilled ${suffix}`,
        boardId,
        class: 10,
        questionCount: 50,
        difficultyDistribution: { EASY: 100, MEDIUM: 0, HARD: 0 },
        duration: 30,
        passingMarks: 1,
        category: "CHAPTER",
        mode: "PRACTICE",
        subjectIds: [subjectId],
      });
    expect(res.status).toBe(201);
    const testId = res.body.data.id as string;

    const publishRes = await request(app).patch(`/api/v1/admin/tests/${testId}/publish`).set("Authorization", `Bearer ${adminToken}`);
    expect(publishRes.status).toBe(409);
    expect(publishRes.body.errors.length).toBeGreaterThan(0);
  });

  it("rejects a stale answer write", async () => {
    const testId = await createAndPublishTest();
    const startRes = await request(app).post(`/api/v1/tests/${testId}/attempts`).set("Authorization", `Bearer ${studentToken}`).send({});
    const attemptId = startRes.body.data.attemptId as string;
    const questionId = startRes.body.data.questions[0].questionId as string;

    const first = await request(app)
      .put(`/api/v1/attempts/${attemptId}/answers/${questionId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ selectedOptionKey: "A", answerSequence: 2, clientRequestId: randomUUID() });
    expect(first.status).toBe(200);

    const stale = await request(app)
      .put(`/api/v1/attempts/${attemptId}/answers/${questionId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ selectedOptionKey: "B", answerSequence: 1, clientRequestId: randomUUID() });
    expect(stale.status).toBe(409);
  });

  it("lazily auto-submits an expired attempt on the next read", async () => {
    const testId = await createAndPublishTest();
    const startRes = await request(app).post(`/api/v1/tests/${testId}/attempts`).set("Authorization", `Bearer ${studentToken}`).send({});
    const attemptId = startRes.body.data.attemptId as string;

    await prisma.testAttempt.update({ where: { id: attemptId }, data: { expiresAt: new Date(Date.now() - 1000) } });

    const getRes = await request(app).get(`/api/v1/attempts/${attemptId}`).set("Authorization", `Bearer ${studentToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.status).toBe("EVALUATED");
  });

  it("enforces maxAttempts for RANKED tests", async () => {
    const testId = await createAndPublishTest({ mode: "RANKED", maxAttempts: 1 });

    const startRes = await request(app).post(`/api/v1/tests/${testId}/attempts`).set("Authorization", `Bearer ${studentToken}`).send({});
    expect(startRes.status).toBe(201);
    const attemptId = startRes.body.data.attemptId as string;
    await request(app).post(`/api/v1/attempts/${attemptId}/submit`).set("Authorization", `Bearer ${studentToken}`);

    const secondRes = await request(app).post(`/api/v1/tests/${testId}/attempts`).set("Authorization", `Bearer ${studentToken}`).send({});
    expect(secondRes.status).toBe(409);
  });

  it("returns the identical question set for a Practice Again (SAME) retake", async () => {
    const testId = await createAndPublishTest({ mode: "PRACTICE" });

    const firstRes = await request(app).post(`/api/v1/tests/${testId}/attempts`).set("Authorization", `Bearer ${studentToken}`).send({});
    const firstAttemptId = firstRes.body.data.attemptId as string;
    const firstQuestionIds = (firstRes.body.data.questions as Array<{ questionId: string }>).map((q) => q.questionId).sort();
    await request(app).post(`/api/v1/attempts/${firstAttemptId}/submit`).set("Authorization", `Bearer ${studentToken}`);

    const retakeRes = await request(app)
      .post(`/api/v1/tests/${testId}/attempts`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ retakeMode: "SAME" });
    expect(retakeRes.status).toBe(201);
    const retakeQuestionIds = (retakeRes.body.data.questions as Array<{ questionId: string }>).map((q) => q.questionId).sort();
    expect(retakeQuestionIds).toEqual(firstQuestionIds);
  });

  it("rejects admin test routes without a token, and a STUDENT-role token", async () => {
    const noTokenRes = await request(app).post("/api/v1/admin/tests").send({});
    expect(noTokenRes.status).toBe(401);

    const studentRes = await request(app)
      .post("/api/v1/admin/tests")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({});
    expect(studentRes.status).toBe(403);
  });
});
