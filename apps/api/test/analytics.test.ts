import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { signToken } from "../src/lib/jwt.js";

const app = createApp();

describe("Analytics (Phase 5)", () => {
  const suffix = Date.now();
  const studentEmail = `an-student.${suffix}@example.com`;
  const emptyStudentEmail = `an-empty.${suffix}@example.com`;
  const adminEmail = `an-admin.${suffix}@example.com`;

  let studentToken: string;
  let studentId: string;
  let emptyStudentToken: string;
  let adminToken: string;
  let boardId: string;
  let subjectId: string;
  let chapterIds: string[] = [];

  async function createPublishedQuestion(topicId: string, tag: string) {
    const qRes = await request(app)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ topicId, questionText: `Q ${tag}`, difficulty: "EASY", explanation: "Because.", positiveMarks: 1 });
    const questionId = qRes.body.data.id as string;

    await request(app).post(`/api/v1/admin/questions/${questionId}/options`).set("Authorization", `Bearer ${adminToken}`).send({ optionKey: "A", optionText: "Correct", isCorrect: true });
    await request(app).post(`/api/v1/admin/questions/${questionId}/options`).set("Authorization", `Bearer ${adminToken}`).send({ optionKey: "B", optionText: "Wrong", isCorrect: false });
    await request(app).patch(`/api/v1/admin/questions/${questionId}`).set("Authorization", `Bearer ${adminToken}`).send({ status: "PUBLISHED" });

    return questionId;
  }

  async function submitAttempt(testId: string, answers: Array<"A" | "B" | null>) {
    const startRes = await request(app).post(`/api/v1/tests/${testId}/attempts`).set("Authorization", `Bearer ${studentToken}`).send({ retakeMode: "NEW" });
    const attemptId = startRes.body.data.attemptId as string;
    const questions = startRes.body.data.questions as Array<{ questionId: string }>;

    let seq = 1;
    for (let i = 0; i < questions.length; i++) {
      const answer = answers[i];
      if (answer === null || answer === undefined) continue;
      await request(app)
        .put(`/api/v1/attempts/${attemptId}/answers/${questions[i]!.questionId}`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ selectedOptionKey: answer, answerSequence: seq++, clientRequestId: randomUUID() });
    }

    await request(app).post(`/api/v1/attempts/${attemptId}/submit`).set("Authorization", `Bearer ${studentToken}`);
    return attemptId;
  }

  // The aggregation writer (triggerAnalyticsUpdate) is deliberately
  // fire-and-forget after submission — it isn't guaranteed to have
  // finished by the time the submit HTTP response returns. Poll instead
  // of asserting immediately, so this test isn't racing the writer.
  async function waitForTestsTaken(expected: number) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const res = await request(app).get("/api/v1/analytics/overview").set("Authorization", `Bearer ${studentToken}`);
      if (res.body.data.testsTaken === expected) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  beforeAll(async () => {
    const registerRes = await request(app).post("/api/v1/auth/register").send({ email: studentEmail, password: "hunter22", fullName: "AN Student", class: 10 });
    studentToken = registerRes.body.data.token as string;
    studentId = registerRes.body.data.user.id as string;

    const emptyRes = await request(app).post("/api/v1/auth/register").send({ email: emptyStudentEmail, password: "hunter22", fullName: "AN Empty Student", class: 10 });
    emptyStudentToken = emptyRes.body.data.token as string;

    const adminUser = await prisma.user.create({ data: { email: adminEmail, passwordHash: "not-used", role: "ADMIN" } });
    adminToken = signToken({ sub: adminUser.id, role: "ADMIN" });

    const board = await prisma.board.upsert({ where: { name: `AN Board ${suffix}` }, update: {}, create: { name: `AN Board ${suffix}` } });
    boardId = board.id;

    const subjectRes = await request(app).post("/api/v1/admin/subjects").set("Authorization", `Bearer ${adminToken}`).send({ name: `AN Subject ${suffix}`, boardId, class: 10 });
    subjectId = subjectRes.body.data.id as string;

    // 3 chapters, 1 topic + 1 published EASY question each.
    const questionIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const chapterRes = await request(app)
        .post("/api/v1/admin/chapters")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ subjectId, name: `AN Chapter ${i}`, chapterNumber: ((suffix + i) % 89) + 1 });
      const chapterId = chapterRes.body.data.id as string;
      chapterIds.push(chapterId);

      const topicRes = await request(app).post("/api/v1/admin/topics").set("Authorization", `Bearer ${adminToken}`).send({ chapterId, name: `AN Topic ${i}` });
      const topicId = topicRes.body.data.id as string;

      questionIds.push(await createPublishedQuestion(topicId, `${i}`));
    }

    // SUBJECT-category test covering all 3 chapters (chapterIds/topicIds
    // empty on the blueprint = "all of parent" per docs/04_database.md §12a).
    const testRes = await request(app)
      .post("/api/v1/admin/tests")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: `AN Test ${suffix}`,
        boardId,
        class: 10,
        questionCount: 3,
        difficultyDistribution: { EASY: 100, MEDIUM: 0, HARD: 0 },
        duration: 30,
        passingMarks: 1,
        category: "SUBJECT",
        mode: "PRACTICE",
        subjectIds: [subjectId],
      });
    const testId = testRes.body.data.id as string;
    await request(app).patch(`/api/v1/admin/tests/${testId}/publish`).set("Authorization", `Bearer ${adminToken}`);

    // Attempt 1: chapter0 correct, chapter1 wrong, chapter2 unanswered.
    // Attempt 2: all 3 correct.
    // Selection picks the whole (exactly-sized) pool each time, so the
    // question set is the same both times, just possibly reordered —
    // answers are submitted per-question in whatever order the attempt
    // returns them, not tied to chapter index.
    await submitAttempt(testId, ["A", "B", null]);
    await submitAttempt(testId, ["A", "A", "A"]);
    await waitForTestsTaken(2);
  }, 30000);

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [studentEmail, emptyStudentEmail, adminEmail] } } });
    await prisma.$disconnect();
  });

  it("aggregates real submitted attempts into StudentAnalytics", async () => {
    const res = await request(app).get("/api/v1/analytics/overview").set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.testsTaken).toBe(2);
    expect(res.body.data.testsCompleted).toBe(2);
    expect(res.body.data.questionsSolved).toBe(5); // 2 attempts x 3 questions - 1 unanswered
    expect(res.body.data.correctAnswers).toBe(4);
    expect(res.body.data.incorrectAnswers).toBe(1);
    expect(res.body.data.accuracy).toBeCloseTo(80, 0);
  });

  it("computes per-chapter weaknessScore (=100-accuracy)", async () => {
    const res = await request(app).get(`/api/v1/analytics/chapters/${chapterIds[0]}`).set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.weaknessScore).toBeCloseTo(100 - res.body.data.accuracy, 0);
  });

  it("returns 404 for an entity with no analytics yet", async () => {
    const res = await request(app).get("/api/v1/analytics/subjects/00000000-0000-0000-0000-000000000000").set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(404);
  });

  it("returns a zeroed-out overview and 404 detail for a student with zero attempts", async () => {
    const overviewRes = await request(app).get("/api/v1/analytics/overview").set("Authorization", `Bearer ${emptyStudentToken}`);
    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.data.testsTaken).toBe(0);
    expect(overviewRes.body.data.accuracy).toBe(0);

    const detailRes = await request(app).get(`/api/v1/analytics/subjects/${subjectId}`).set("Authorization", `Bearer ${emptyStudentToken}`);
    expect(detailRes.status).toBe(404);
  });

  it("paginates analytics-dashboard chapters with no duplicates or gaps across pages", async () => {
    const seen = new Set<string>();
    let cursor: string | undefined;
    for (let page = 0; page < 5; page++) {
      const res = await request(app)
        .get("/api/v1/analytics-dashboard/chapters")
        .query({ limit: 1, ...(cursor ? { cursor } : {}) })
        .set("Authorization", `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      for (const item of res.body.data.items) seen.add(item.chapterId);
      cursor = res.body.data.nextCursor ?? undefined;
      if (!cursor) break;
    }
    expect(seen.size).toBe(3);
  });

  it("returns one 200 happy-path response per remaining module", async () => {
    const endpoints = [
      "/api/v1/analytics-dashboard/overview",
      "/api/v1/intelligence/mastery",
      "/api/v1/weakness/overview",
      "/api/v1/trends/overview",
      "/api/v1/recommendations/today",
    ];
    for (const path of endpoints) {
      const res = await request(app).get(path).set("Authorization", `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }
  });

  it("degrades /trends/rank to INSUFFICIENT_DATA instead of erroring (no Leaderboard yet — BR-043)", async () => {
    const res = await request(app).get("/api/v1/trends/rank").set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.classification).toBe("INSUFFICIENT_DATA");
    expect(res.body.data.bestRank).toBeNull();
  });

  it("rejects analytics routes without a token", async () => {
    const res = await request(app).get("/api/v1/analytics/overview");
    expect(res.status).toBe(401);
  });
});
