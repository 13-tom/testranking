import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtPayload = {
  sub: string;
  role: "STUDENT" | "ADMIN";
};

// Single access token for this phase — no refresh-token rotation yet.
// The docs only detail a refresh-token pattern for Admin auth; revisit if
// student session requirements grow (see plan notes / CLAUDE.md).
const TOKEN_TTL = "7d";

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
