import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("GET /api/v1/health", () => {
  it("responds with a health payload", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/health");

    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("status");
    expect(res.body.data).toHaveProperty("database");
    expect(res.body.data).toHaveProperty("redis");
  });
});
