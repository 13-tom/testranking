import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtPayload = {
  sub: string;
  role: "STUDENT" | "ADMIN";
  aud: "board-ranking-client" | "board-ranking-admin";
};

// Single access token for this phase — no refresh-token rotation yet.
// The docs only detail a refresh-token pattern for Admin auth; revisit if
// student session requirements grow (see plan notes / CLAUDE.md).
const TOKEN_TTL = "7d";

const AUDIENCE_BY_ROLE: Record<JwtPayload["role"], JwtPayload["aud"]> = {
  STUDENT: "board-ranking-client",
  ADMIN: "board-ranking-admin",
};

// BR-046: aud is derived from role at sign time (never accepted from a
// caller) — closes the gap where a single JWT shape let an admin token
// pass every student-only check that only inspected `role`.
export function signToken(payload: { sub: string; role: JwtPayload["role"] }): string {
  return jwt.sign({ sub: payload.sub, role: payload.role, aud: AUDIENCE_BY_ROLE[payload.role] }, env.JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
