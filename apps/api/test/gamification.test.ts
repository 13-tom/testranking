import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { signToken } from "../src/lib/jwt.js";

const app = createApp();

describe("Gamification", () => {
  const suffix = Date.now();
  const withSchoolEmail = `gam-school.${suffix}@example.com`;
  const noSchoolEmail = `gam-noschool.${suffix}@example.com`;
  const adminEmail = `gam-admin.${suffix}@example.com`;

  let withSchoolToken: string;
  let noSchoolToken: string;
  let noSchoolStudentId: string;
  let adminToken: string;
  let boardId: string;
  let subjectId: string;
  let topicId: string;
  let schoolId: string;

  async function createPublishedQuestion(tag: string) {
    const qRes = await request(app)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ topicId, questionText: `Gam Q ${tag}`, difficulty: "EASY", explanation: "Because.", positiveMarks: 1 });
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

  async function createAndPublishTest(mode: "PRACTICE" | "RANKED") {
    const res = await request(app)
      .post("/api/v1/admin/tests")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: `Gam Test ${suffix}-${randomUUID().slice(0, 8)}`,
        boardId,
        class: 10,
        questionCount: 2,
        difficultyDistribution: { EASY: 100, MEDIUM: 0, HARD: 0 },
        duration: 30,
        passingMarks: 1,
        category: "CHAPTER",
        mode,
        subjectIds: [subjectId],
      });
    expect(res.status).toBe(201);
    const testId = res.body.data.id as string;
    const publishRes = await request(app).patch(`/api/v1/admin/tests/${testId}/publish`).set("Authorization", `Bearer ${adminToken}`);
    expect(publishRes.status).toBe(200);
    return testId;
  }

  async function submitAllCorrect(testId: string, token: string) {
    const startRes = await request(app).post(`/api/v1/tests/${testId}/attempts`).set("Authorization", `Bearer ${token}`).send({});
    expect(startRes.status).toBe(201);
    const attemptId = startRes.body.data.attemptId as string;
    const questions = startRes.body.data.questions as Array<{ questionId: string }>;
    let seq = 1;
    for (const q of questions) {
      await request(app)
        .put(`/api/v1/attempts/${attemptId}/answers/${q.questionId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ selectedOptionKey: "A", answerSequence: seq++, clientRequestId: randomUUID() });
    }
    const submitRes = await request(app).post(`/api/v1/attempts/${attemptId}/submit`).set("Authorization", `Bearer ${token}`);
    expect(submitRes.status).toBe(200);
    return submitRes.body.data;
  }

  async function waitForAchievement(token: string, code: string): Promise<boolean> {
    for (let attempt = 0; attempt < 30; attempt++) {
      const res = await request(app).get("/api/v1/achievements").set("Authorization", `Bearer ${token}`);
      const items = res.body.data.items as Array<{ code: string; earned: boolean }>;
      if (items.find((i) => i.code === code)?.earned) return true;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
  }

  beforeAll(async () => {
    const school = await prisma.school.create({
      data: {
        schoolName: `Gam School ${suffix}`,
        board: "CBSE",
        city: "Delhi",
        district: `Gam District ${suffix}`,
        state: `Gam State ${suffix}`,
        country: "India",
        postalCode: "110001",
      },
    });
    schoolId = school.id;

    const withSchoolRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: withSchoolEmail, password: "hunter22", fullName: "Gam School Student", class: 10, schoolId });
    withSchoolToken = withSchoolRes.body.data.token as string;

    const noSchoolRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: noSchoolEmail, password: "hunter22", fullName: "Gam No School Student", class: 10 });
    noSchoolToken = noSchoolRes.body.data.token as string;
    noSchoolStudentId = noSchoolRes.body.data.user.id as string;

    const adminUser = await prisma.user.create({ data: { email: adminEmail, passwordHash: "not-used", role: "ADMIN" } });
    adminToken = signToken({ sub: adminUser.id, role: "ADMIN" });

    const board = await prisma.board.upsert({
      where: { name: `Gam Board ${suffix}` },
      update: {},
      create: { name: `Gam Board ${suffix}` },
    });
    boardId = board.id;

    const subjectRes = await request(app)
      .post("/api/v1/admin/subjects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Gam Subject ${suffix}`, boardId, class: 10 });
    subjectId = subjectRes.body.data.id as string;

    const chapterRes = await request(app)
      .post("/api/v1/admin/chapters")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ subjectId, name: "Gam Chapter", chapterNumber: (suffix % 89) + 1 });
    const chapterId = chapterRes.body.data.id as string;

    const topicRes = await request(app)
      .post("/api/v1/admin/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ chapterId, name: "Gam Topic" });
    topicId = topicRes.body.data.id as string;

    await createPublishedQuestion("q1");
    await createPublishedQuestion("q2");
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [withSchoolEmail, noSchoolEmail, adminEmail] } } });
    await prisma.school.deleteMany({ where: { id: schoolId } });
    await prisma.$disconnect();
  });

  it("awards a registration bonus and full profile-completion bonus when a school is provided", async () => {
    const profileRes = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${withSchoolToken}`);
    expect(profileRes.body.data.studentProfile.profileCompletion).toBe(100);
    expect(profileRes.body.data.studentProfile.studyPoints).toBe(100); // 50 registration + 50 PROFILE_COMPLETE

    const achievementsRes = await request(app).get("/api/v1/achievements").set("Authorization", `Bearer ${withSchoolToken}`);
    const profileComplete = (achievementsRes.body.data.items as Array<{ code: string; earned: boolean }>).find((i) => i.code === "PROFILE_COMPLETE");
    expect(profileComplete?.earned).toBe(true);
  });

  it("awards only the base registration bonus without a school", async () => {
    const profileRes = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${noSchoolToken}`);
    expect(profileRes.body.data.studentProfile.profileCompletion).toBe(70);
    expect(profileRes.body.data.studentProfile.studyPoints).toBe(50);
  });

  it("credits study points for a PRACTICE-mode submission and unlocks FIRST_TEST", async () => {
    const testId = await createAndPublishTest("PRACTICE");
    const before = await prisma.studentProfile.findUnique({ where: { userId: noSchoolStudentId } });

    const result = await submitAllCorrect(testId, noSchoolToken);
    expect(result.correctCount).toBe(2);

    const unlocked = await waitForAchievement(noSchoolToken, "FIRST_TEST");
    expect(unlocked).toBe(true);

    const after = await prisma.studentProfile.findUnique({ where: { userId: noSchoolStudentId } });
    // A perfect first score unlocks 3 achievements at once: 2 correct *
    // 10 + 5 completion bonus + FIRST_TEST(25) + ACCURACY_90(50) +
    // PERFECT_SCORE(100) = 200.
    expect(after!.studyPoints).toBe(before!.studyPoints + 200);
    expect(after!.studyStreak).toBe(1);
  }, 15000);

  it("reports streak data via GET /streak", async () => {
    const res = await request(app).get("/api/v1/streak").set("Authorization", `Bearer ${noSchoolToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.currentStreak).toBeGreaterThanOrEqual(1);
    expect(res.body.data.history.length).toBeGreaterThanOrEqual(1);
  });

  it("extends the streak on a second consecutive day", async () => {
    // Simulate "yesterday" by backdating the existing streak history row
    // and the profile's streak counters, then take another test "today".
    await prisma.studyStreakHistory.updateMany({
      where: { studentId: noSchoolStudentId },
      data: { date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    await prisma.studentProfile.update({ where: { userId: noSchoolStudentId }, data: { studyStreak: 1, longestStreak: 1 } });

    const testId = await createAndPublishTest("PRACTICE");
    await submitAllCorrect(testId, noSchoolToken);

    for (let attempt = 0; attempt < 30; attempt++) {
      const profile = await prisma.studentProfile.findUnique({ where: { userId: noSchoolStudentId } });
      if (profile!.studyStreak === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const profile = await prisma.studentProfile.findUnique({ where: { userId: noSchoolStudentId } });
    expect(profile!.studyStreak).toBe(2);
    expect(profile!.longestStreak).toBe(2);
  }, 15000);
});
