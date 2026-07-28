import { prisma } from "../lib/prisma.js";
import type { RegisterInput } from "../validators/auth.validators.js";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { studentProfile: true },
  });
}

export function createStudentUser(input: RegisterInput, passwordHash: string) {
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      studentProfile: {
        create: {
          fullName: input.fullName,
          class: input.class,
          schoolId: input.schoolId,
        },
      },
    },
    include: { studentProfile: true },
  });
}

export function touchLastLogin(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLogin: new Date() },
  });
}
