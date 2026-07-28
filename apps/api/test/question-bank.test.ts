import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { signToken } from "../src/lib/jwt.js";

const app = createApp();

describe("Question Bank", () => {
  const suffix = Date.now();
  const studentEmail = `qb-student.${suffix}@example.com`;
  const adminEmail = `qb-admin.${suffix}@example.com`;

  let studentToken: string;
  let adminToken: string;
  let boardId: string;

  beforeAll(async () => {
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: studentEmail, password: "hunter22", fullName: "QB Student", class: 10 });
    studentToken = registerRes.body.data.token as string;

    const adminUser = await prisma.user.create({
      data: { email: adminEmail, passwordHash: "not-used", role: "ADMIN" },
    });
    adminToken = signToken({ sub: adminUser.id, role: "ADMIN" });

    const board = await prisma.board.upsert({
      where: { name: `Test Board ${suffix}` },
      update: {},
      create: { name: `Test Board ${suffix}` },
    });
    boardId = board.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [studentEmail, adminEmail] } } });
    await prisma.$disconnect();
  });

  it("returns seeded subjects and chapters via the public endpoints", async () => {
    const subjectsRes = await request(app).get("/api/v1/subjects");
    expect(subjectsRes.status).toBe(200);
    expect(subjectsRes.body.success).toBe(true);
    const maths = subjectsRes.body.data.find((s: { name: string }) => s.name === "Mathematics");
    expect(maths).toBeDefined();

    const chaptersRes = await request(app).get(`/api/v1/chapters?subjectId=${maths.id}`);
    expect(chaptersRes.status).toBe(200);
    const chapterNames = chaptersRes.body.data.map((c: { name: string }) => c.name);
    expect(chapterNames).toContain("Real Numbers");
    expect(chapterNames).toContain("Polynomials");
  });

  it("rejects admin routes without a token", async () => {
    const res = await request(app).post("/api/v1/admin/subjects").send({});
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects a STUDENT-role token on admin routes", async () => {
    const res = await request(app)
      .post("/api/v1/admin/subjects")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ name: "Should Fail", boardId, class: 10 });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("runs the full authoring chain and publishes a question", async () => {
    const subjectRes = await request(app)
      .post("/api/v1/admin/subjects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Science ${suffix}`, boardId, class: 9 });
    expect(subjectRes.status).toBe(201);
    const subjectId = subjectRes.body.data.id as string;

    const chapterRes = await request(app)
      .post("/api/v1/admin/chapters")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ subjectId, name: "Light", chapterNumber: 1 });
    expect(chapterRes.status).toBe(201);
    const chapterId = chapterRes.body.data.id as string;

    const topicRes = await request(app)
      .post("/api/v1/admin/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ chapterId, name: "Reflection" });
    expect(topicRes.status).toBe(201);
    const topicId = topicRes.body.data.id as string;

    const questionRes = await request(app)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        topicId,
        questionText: "The angle of incidence equals the angle of:",
        difficulty: "EASY",
        explanation: "By the law of reflection, the angle of incidence equals the angle of reflection.",
        positiveMarks: 1,
      });
    expect(questionRes.status).toBe(201);
    const questionId = questionRes.body.data.id as string;
    expect(questionRes.body.data.referenceCode).toBe("09S0101");
    expect(questionRes.body.data.status).toBe("DRAFT");

    const optionPayloads = [
      { optionKey: "A", optionText: "incidence", isCorrect: false },
      { optionKey: "B", optionText: "reflection", isCorrect: true },
      { optionKey: "C", optionText: "refraction", isCorrect: false },
      { optionKey: "D", optionText: "deviation", isCorrect: false },
    ];
    for (const option of optionPayloads) {
      const optionRes = await request(app)
        .post(`/api/v1/admin/questions/${questionId}/options`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(option);
      expect(optionRes.status).toBe(201);
    }

    const publishRes = await request(app)
      .patch(`/api/v1/admin/questions/${questionId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "PUBLISHED" });
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.status).toBe("PUBLISHED");

    const publicSubjectRes = await request(app).get(`/api/v1/subjects/${subjectId}`);
    expect(publicSubjectRes.status).toBe(200);
    expect(publicSubjectRes.body.data.name).toBe(`Science ${suffix}`);
  });

  it("rejects publishing a question with no correct option", async () => {
    const subjectRes = await request(app)
      .post("/api/v1/admin/subjects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Gate Test Subject ${suffix}`, boardId, class: 9 });
    const subjectId = subjectRes.body.data.id as string;

    const chapterRes = await request(app)
      .post("/api/v1/admin/chapters")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ subjectId, name: "Gate Chapter", chapterNumber: 1 });
    const chapterId = chapterRes.body.data.id as string;

    const topicRes = await request(app)
      .post("/api/v1/admin/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ chapterId, name: "Gate Topic" });
    const topicId = topicRes.body.data.id as string;

    const questionRes = await request(app)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        topicId,
        questionText: "A question with no correct option",
        difficulty: "EASY",
        explanation: "N/A",
        positiveMarks: 1,
      });
    const questionId = questionRes.body.data.id as string;

    // Only 2 options, neither marked correct — fails the publish gate.
    await request(app)
      .post(`/api/v1/admin/questions/${questionId}/options`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ optionKey: "A", optionText: "Option A", isCorrect: false });
    await request(app)
      .post(`/api/v1/admin/questions/${questionId}/options`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ optionKey: "B", optionText: "Option B", isCorrect: false });

    const publishRes = await request(app)
      .patch(`/api/v1/admin/questions/${questionId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "PUBLISHED" });

    expect(publishRes.status).toBe(409);
    expect(publishRes.body.success).toBe(false);
    expect(publishRes.body.errors.length).toBeGreaterThan(0);
  });
});
