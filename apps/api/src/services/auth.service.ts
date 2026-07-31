import bcrypt from "bcryptjs";
import type { AuthResponseData, MeResponseData } from "@board-ranking/shared";
import { ConflictError, NotFoundError, UnauthorizedError } from "../errors/AppError.js";
import { signToken } from "../lib/jwt.js";
import {
  createStudentUser,
  findUserByEmail,
  findUserById,
  touchLastLogin,
} from "../repositories/user.repository.js";
import { awardRegistrationBonuses } from "./gamification.service.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validators.js";

const SALT_ROUNDS = 10;

export async function registerStudent(input: RegisterInput): Promise<AuthResponseData> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await createStudentUser(input, passwordHash);
  if (!user.studentProfile) {
    throw new Error("Student profile was not created alongside the user");
  }

  // BR-045: awarded synchronously (not fire-and-forget) — a new student's
  // opening Study Points balance and profile completion should already be
  // correct on their very first dashboard read.
  await awardRegistrationBonuses(user.id, !!user.studentProfile.schoolId);
  const withBonuses = await findUserById(user.id);
  const studentProfile = withBonuses?.studentProfile;
  if (!studentProfile) {
    throw new Error("Student profile was not created alongside the user");
  }

  const token = signToken({ sub: user.id, role: user.role });

  return {
    user: { id: user.id, email: user.email, role: user.role, isVerified: user.isVerified },
    studentProfile: {
      id: studentProfile.id,
      fullName: studentProfile.fullName,
      class: studentProfile.class,
      schoolId: studentProfile.schoolId,
      studyPoints: studentProfile.studyPoints,
      studyLevel: studentProfile.studyLevel,
      studyStreak: studentProfile.studyStreak,
      profileCompletion: studentProfile.profileCompletion,
    },
    token,
  };
}

export async function loginStudent(input: LoginInput): Promise<AuthResponseData> {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const full = await findUserById(user.id);
  const studentProfile = full?.studentProfile;
  if (!studentProfile) {
    throw new NotFoundError("Student profile not found");
  }

  await touchLastLogin(user.id);

  const token = signToken({ sub: user.id, role: user.role });

  return {
    user: { id: user.id, email: user.email, role: user.role, isVerified: user.isVerified },
    studentProfile: {
      id: studentProfile.id,
      fullName: studentProfile.fullName,
      class: studentProfile.class,
      schoolId: studentProfile.schoolId,
      studyPoints: studentProfile.studyPoints,
      studyLevel: studentProfile.studyLevel,
      studyStreak: studentProfile.studyStreak,
      profileCompletion: studentProfile.profileCompletion,
    },
    token,
  };
}

export async function getMe(userId: string): Promise<MeResponseData> {
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const studentProfile = user.studentProfile;

  return {
    user: { id: user.id, email: user.email, role: user.role, isVerified: user.isVerified },
    studentProfile: studentProfile
      ? {
          id: studentProfile.id,
          fullName: studentProfile.fullName,
          class: studentProfile.class,
          schoolId: studentProfile.schoolId,
          studyPoints: studentProfile.studyPoints,
          studyLevel: studentProfile.studyLevel,
          studyStreak: studentProfile.studyStreak,
          profileCompletion: studentProfile.profileCompletion,
        }
      : null,
  };
}
