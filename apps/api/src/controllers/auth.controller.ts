import type { Request, Response } from "express";
import type { ApiResponse, AuthResponseData, MeResponseData } from "@board-ranking/shared";
import { getMe, loginStudent, registerStudent } from "../services/auth.service.js";
import { UnauthorizedError } from "../errors/AppError.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validators.js";

export async function register(req: Request, res: Response): Promise<void> {
  const data = await registerStudent(req.body as RegisterInput);
  const body: ApiResponse<AuthResponseData> = { success: true, message: "Registered", data };
  res.status(201).json(body);
}

export async function login(req: Request, res: Response): Promise<void> {
  const data = await loginStudent(req.body as LoginInput);
  const body: ApiResponse<AuthResponseData> = { success: true, message: "Logged in", data };
  res.status(200).json(body);
}

export function logout(_req: Request, res: Response): void {
  // JWT is stateless in this phase (no server-side session/blacklist yet) —
  // logout is a client-side token discard; this endpoint exists for the
  // documented API surface and future session-revocation support.
  const body: ApiResponse<null> = { success: true, message: "Logged out", data: null };
  res.status(200).json(body);
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const data = await getMe(req.user.sub);
  const body: ApiResponse<MeResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}
