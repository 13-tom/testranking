export type Role = "STUDENT" | "ADMIN";

export type PublicUser = {
  id: string;
  email: string;
  role: Role;
  isVerified: boolean;
};

export type PublicStudentProfile = {
  id: string;
  fullName: string;
  class: number;
  schoolId: string | null;
  studyPoints: number;
  studyLevel: number;
  studyStreak: number;
  profileCompletion: number;
};

export type RegisterRequest = {
  email: string;
  password: string;
  fullName: string;
  class: number;
  schoolId?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponseData = {
  user: PublicUser;
  // null for ADMIN-role users, who have no StudentProfile (BR-046).
  studentProfile: PublicStudentProfile | null;
  token: string;
};

export type MeResponseData = {
  user: PublicUser;
  studentProfile: PublicStudentProfile | null;
};
