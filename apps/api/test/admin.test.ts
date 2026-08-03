import bcrypt from "bcryptjs";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { signToken } from "../src/lib/jwt.js";

const app = createApp();

describe("Admin Panel (Phase 9, BR-046)", () => {
  const suffix = Date.now();
  const studentEmail = `admin-student.${suffix}@example.com`;
  const suspendEmail = `admin-suspend.${suffix}@example.com`;
  const adminEmail = `admin-admin.${suffix}@example.com`;

  let studentToken: string;
  let studentId: string;
  let suspendUserId: string;
  let suspendProfileId: string;
  let adminToken: string;
  let boardId: string;
  let subjectId: string;
  let topicId: string;
  let schoolId: string;
  let schoolState: string;

  beforeAll(async () => {
    const school = await prisma.school.create({
      data: {
        schoolName: `Admin Test School ${suffix}`,
        board: "CBSE",
        city: "Delhi",
        district: `Admin District ${suffix}`,
        state: `Admin State ${suffix}`,
        country: "India",
        postalCode: "110001",
      },
    });
    schoolId = school.id;
    schoolState = school.state;

    const studentRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: studentEmail, password: "hunter22", fullName: "Admin Test Student", class: 10, schoolId });
    studentToken = studentRes.body.data.token as string;
    studentId = studentRes.body.data.user.id as string;

    const suspendRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: suspendEmail, password: "hunter22", fullName: "Suspend Me", class: 10, schoolId });
    suspendUserId = suspendRes.body.data.user.id as string;

    const adminUser = await prisma.user.create({ data: { email: adminEmail, passwordHash: "not-used", role: "ADMIN" } });
    adminToken = signToken({ sub: adminUser.id, role: "ADMIN" });

    const board = await prisma.board.upsert({
      where: { name: `Admin Board ${suffix}` },
      update: {},
      create: { name: `Admin Board ${suffix}` },
    });
    boardId = board.id;

    const subjectRes = await request(app)
      .post("/api/v1/admin/subjects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Admin Subject ${suffix}`, boardId, class: 10 });
    subjectId = subjectRes.body.data.id as string;

    const chapterRes = await request(app)
      .post("/api/v1/admin/chapters")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ subjectId, name: "Admin Chapter", chapterNumber: (suffix % 89) + 1 });
    const chapterId = chapterRes.body.data.id as string;

    const topicRes = await request(app)
      .post("/api/v1/admin/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ chapterId, name: "Admin Topic" });
    topicId = topicRes.body.data.id as string;

    const profile = await prisma.studentProfile.findUnique({ where: { userId: suspendUserId } });
    suspendProfileId = profile!.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [studentEmail, suspendEmail, adminEmail] } } });
    await prisma.school.deleteMany({ where: { id: schoolId } });
    await prisma.$disconnect();
  });

  it("logs an admin in through the shared /auth/login endpoint with no StudentProfile", async () => {
    // BR-046: there is no separate /admin/auth/login — the existing
    // student login endpoint now also handles a null StudentProfile for
    // ADMIN-role users and issues an admin-audience token.
    const loginAdminEmail = `admin-login.${suffix}@example.com`;
    const passwordHash = await bcrypt.hash("hunter22", 10);
    await prisma.user.create({ data: { email: loginAdminEmail, passwordHash, role: "ADMIN" } });

    const loginRes = await request(app).post("/api/v1/auth/login").send({ email: loginAdminEmail, password: "hunter22" });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.studentProfile).toBeNull();

    const overviewRes = await request(app).get("/api/v1/admin/overview").set("Authorization", `Bearer ${loginRes.body.data.token}`);
    expect(overviewRes.status).toBe(200);

    await prisma.user.delete({ where: { email: loginAdminEmail } });
  });

  it("rejects a student token on an admin-audience route", async () => {
    const res = await request(app).get("/api/v1/admin/overview").set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(401);
  });

  it("rejects an admin token on a student-audience route", async () => {
    const res = await request(app).get("/api/v1/dashboard").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(401);
  });

  it("returns platform overview counts", async () => {
    const res = await request(app).get("/api/v1/admin/overview").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.students.total).toBeGreaterThanOrEqual(2);
    expect(res.body.data.schools.total).toBeGreaterThanOrEqual(1);
  });

  it("walks a question through the review-queue moderation cycle", async () => {
    const createRes = await request(app)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ topicId, questionText: "Moderation Q1", difficulty: "EASY", explanation: "Because.", positiveMarks: 1 });
    const questionId = createRes.body.data.id as string;

    // DRAFT -> IN_REVIEW via the existing generic PATCH (no new endpoint needed).
    const toReviewRes = await request(app)
      .patch(`/api/v1/admin/questions/${questionId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "IN_REVIEW" });
    expect(toReviewRes.status).toBe(200);

    const queueRes = await request(app).get("/api/v1/admin/questions/review").set("Authorization", `Bearer ${adminToken}`);
    expect(queueRes.status).toBe(200);
    expect((queueRes.body.data.items as Array<{ id: string }>).some((q) => q.id === questionId)).toBe(true);

    const approveRes = await request(app).patch(`/api/v1/admin/questions/${questionId}/approve`).set("Authorization", `Bearer ${adminToken}`);
    expect(approveRes.status).toBe(200);

    // A second approve attempt (now APPROVED, not IN_REVIEW) must be rejected.
    const reapproveRes = await request(app).patch(`/api/v1/admin/questions/${questionId}/approve`).set("Authorization", `Bearer ${adminToken}`);
    expect(reapproveRes.status).toBe(409);

    const archiveRes = await request(app).patch(`/api/v1/admin/questions/${questionId}/archive`).set("Authorization", `Bearer ${adminToken}`);
    expect(archiveRes.status).toBe(200);

    const getRes = await request(app).get(`/api/v1/admin/questions/${questionId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(getRes.body.data.status).toBe("ARCHIVED");
  });

  it("rejects a question and supports a bulk approval batch", async () => {
    const rejectCreate = await request(app)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ topicId, questionText: "Moderation Reject Q", difficulty: "EASY", explanation: "Because.", positiveMarks: 1 });
    const rejectId = rejectCreate.body.data.id as string;
    await request(app).patch(`/api/v1/admin/questions/${rejectId}`).set("Authorization", `Bearer ${adminToken}`).send({ status: "IN_REVIEW" });
    const rejectRes = await request(app).patch(`/api/v1/admin/questions/${rejectId}/reject`).set("Authorization", `Bearer ${adminToken}`);
    expect(rejectRes.status).toBe(200);
    const rejectGet = await request(app).get(`/api/v1/admin/questions/${rejectId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(rejectGet.body.data.status).toBe("REJECTED");

    const bulkIds: string[] = [];
    for (const tag of ["bulk1", "bulk2"]) {
      const created = await request(app)
        .post("/api/v1/admin/questions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ topicId, questionText: `Bulk Q ${tag}`, difficulty: "EASY", explanation: "Because.", positiveMarks: 1 });
      const id = created.body.data.id as string;
      await request(app).patch(`/api/v1/admin/questions/${id}`).set("Authorization", `Bearer ${adminToken}`).send({ status: "IN_REVIEW" });
      bulkIds.push(id);
    }

    const bulkRes = await request(app)
      .post("/api/v1/admin/questions/bulk-approve")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ questionIds: bulkIds });
    expect(bulkRes.status).toBe(200);
    expect(bulkRes.body.data.requested).toBe(2);
    expect(bulkRes.body.data.updated).toBe(2);
  });

  it("suspends a student, blocks their login, then reactivates them", async () => {
    const suspendRes = await request(app)
      .patch(`/api/v1/admin/students/${suspendProfileId}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Testing suspension" });
    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.isSuspended).toBe(true);

    const loginRes = await request(app).post("/api/v1/auth/login").send({ email: suspendEmail, password: "hunter22" });
    expect(loginRes.status).toBe(403);

    // Suspending an already-suspended student is a conflict.
    const doubleSuspendRes = await request(app)
      .patch(`/api/v1/admin/students/${suspendProfileId}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Again" });
    expect(doubleSuspendRes.status).toBe(409);

    const reactivateRes = await request(app).patch(`/api/v1/admin/students/${suspendProfileId}/reactivate`).set("Authorization", `Bearer ${adminToken}`);
    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.data.isSuspended).toBe(false);

    const loginAfterRes = await request(app).post("/api/v1/auth/login").send({ email: suspendEmail, password: "hunter22" });
    expect(loginAfterRes.status).toBe(200);
  });

  it("lists students and grants study points", async () => {
    const listRes = await request(app).get("/api/v1/admin/students").set("Authorization", `Bearer ${adminToken}`).query({ schoolId });
    expect(listRes.status).toBe(200);
    expect((listRes.body.data.items as Array<{ id: string }>).some((s) => s.id !== undefined)).toBe(true);

    const profileBefore = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
    const grantRes = await request(app)
      .post(`/api/v1/admin/students/${profileBefore!.id}/grant-points`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ amount: 100, reason: "Contest prize" });
    expect(grantRes.status).toBe(200);
    expect(grantRes.body.data.studyPoints).toBe(profileBefore!.studyPoints + 100);
  });

  it("lists, archives, and reactivates a school", async () => {
    const listRes = await request(app).get("/api/v1/admin/schools").set("Authorization", `Bearer ${adminToken}`).query({ state: schoolState });
    expect(listRes.status).toBe(200);

    const statsRes = await request(app).get(`/api/v1/admin/schools/${schoolId}/stats`).set("Authorization", `Bearer ${adminToken}`);
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data.studentCount).toBeGreaterThanOrEqual(2);

    const archiveRes = await request(app).patch(`/api/v1/admin/schools/${schoolId}/archive`).set("Authorization", `Bearer ${adminToken}`);
    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.data.isActive).toBe(false);

    const doubleArchiveRes = await request(app).patch(`/api/v1/admin/schools/${schoolId}/archive`).set("Authorization", `Bearer ${adminToken}`);
    expect(doubleArchiveRes.status).toBe(409);

    const activateRes = await request(app).patch(`/api/v1/admin/schools/${schoolId}/activate`).set("Authorization", `Bearer ${adminToken}`);
    expect(activateRes.status).toBe(200);
    expect(activateRes.body.data.isActive).toBe(true);
  });

  it("lists admin tests and unpublishes an active one", async () => {
    const createRes = await request(app)
      .post("/api/v1/admin/tests")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: `Admin Unpublish Test ${suffix}`,
        boardId,
        class: 10,
        questionCount: 1,
        difficultyDistribution: { EASY: 100, MEDIUM: 0, HARD: 0 },
        duration: 30,
        passingMarks: 1,
        category: "CHAPTER",
        subjectIds: [subjectId],
      });
    const testId = createRes.body.data.id as string;

    const q1 = await request(app)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ topicId, questionText: "Unpublish Pool Q", difficulty: "EASY", explanation: "Because.", positiveMarks: 1 });
    const q1Id = q1.body.data.id as string;
    await request(app).post(`/api/v1/admin/questions/${q1Id}/options`).set("Authorization", `Bearer ${adminToken}`).send({ optionKey: "A", optionText: "Correct", isCorrect: true });
    await request(app).post(`/api/v1/admin/questions/${q1Id}/options`).set("Authorization", `Bearer ${adminToken}`).send({ optionKey: "B", optionText: "Wrong", isCorrect: false });
    await request(app).patch(`/api/v1/admin/questions/${q1Id}`).set("Authorization", `Bearer ${adminToken}`).send({ status: "PUBLISHED" });

    const publishRes = await request(app).patch(`/api/v1/admin/tests/${testId}/publish`).set("Authorization", `Bearer ${adminToken}`);
    expect(publishRes.status).toBe(200);

    const listRes = await request(app).get("/api/v1/admin/tests").set("Authorization", `Bearer ${adminToken}`).query({ status: "ACTIVE" });
    expect(listRes.status).toBe(200);
    expect((listRes.body.data.items as Array<{ id: string }>).some((t) => t.id === testId)).toBe(true);

    const unpublishRes = await request(app).patch(`/api/v1/admin/tests/${testId}/unpublish`).set("Authorization", `Bearer ${adminToken}`);
    expect(unpublishRes.status).toBe(200);
    expect(unpublishRes.body.data.status).toBe("DRAFT");

    const doubleUnpublishRes = await request(app).patch(`/api/v1/admin/tests/${testId}/unpublish`).set("Authorization", `Bearer ${adminToken}`);
    expect(doubleUnpublishRes.status).toBe(409);
  });
});
