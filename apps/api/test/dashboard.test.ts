import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const app = createApp();

describe("Dashboard", () => {
  const email = `dash.${Date.now()}@example.com`;
  const password = "hunter22";

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("returns dashboard data for a freshly registered student", async () => {
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email, password, fullName: "Dash Student", class: 11 });
    const token = registerRes.body.data.token as string;

    const res = await request(app).get("/api/v1/dashboard").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profile.fullName).toBe("Dash Student");
    expect(res.body.data.studyPoints).toBe(0);
    expect(res.body.data.studyLevel).toBe(1);
    expect(res.body.data.studyStreak).toBe(0);
    expect(res.body.data.rank).toBeNull();
    expect(res.body.data.recentTests).toEqual([]);
    expect(res.body.data.recommendedTest).toBeNull();
    expect(res.body.data.todaysGoal.type).toBe("PROFILE_COMPLETION");
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/v1/dashboard");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
