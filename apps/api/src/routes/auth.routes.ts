import { Router } from "express";
import { login, logout, me, register } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), asyncHandler(register));
authRouter.post("/login", validateBody(loginSchema), asyncHandler(login));
authRouter.post("/logout", authenticate, logout);
authRouter.get("/me", authenticate, asyncHandler(me));
