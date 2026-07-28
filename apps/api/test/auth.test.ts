import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const app = createApp();

describe("Auth", () => {
  const email = `student.${Date.now()}@example.com`;
  const password = "hunter22";

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("registers, logs in, and fetches the current user", async () => {
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email, password, fullName: "Test Student", class: 10 });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.data.user.email).toBe(email);
    expect(registerRes.body.data.studentProfile.fullName).toBe("Test Student");
    expect(typeof registerRes.body.data.token).toBe("string");

    const loginRes = await request(app).post("/api/v1/auth/login").send({ email, password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    const token = loginRes.body.data.token as string;

    const meRes = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(email);
    expect(meRes.body.data.studentProfile.fullName).toBe("Test Student");
  });

  it("rejects login with a wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects registration with an invalid body", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});
