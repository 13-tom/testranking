import { Prisma } from "@prisma/client";
import type { AdminSubject, AdminSubjectListResponseData, SubjectDetailResponseData, SubjectListResponseData } from "@board-ranking/shared";
import { ConflictError, NotFoundError } from "../errors/AppError.js";
import {
  createSubject as createSubjectRepo,
  findActiveSubjectById,
  findActiveSubjects,
  findAllSubjects,
  findSubjectById,
  updateSubject as updateSubjectRepo,
} from "../repositories/subject.repository.js";
import type { SubjectCreateInput, SubjectUpdateInput } from "../validators/question-bank.validators.js";

export async function listPublicSubjects(): Promise<SubjectListResponseData> {
  const subjects = await findActiveSubjects();
  return subjects.map(toPublicSubject);
}

export async function listAdminSubjects(): Promise<AdminSubjectListResponseData> {
  const subjects = await findAllSubjects();
  return subjects.map(toAdminSubject);
}

export async function getPublicSubjectById(id: string): Promise<SubjectDetailResponseData> {
  const subject = await findActiveSubjectById(id);
  if (!subject) {
    throw new NotFoundError("Subject not found");
  }
  return toPublicSubject(subject);
}

export async function createSubject(input: SubjectCreateInput): Promise<AdminSubject> {
  try {
    const subject = await createSubjectRepo(input);
    return toAdminSubject(subject);
  } catch (err) {
    throw mapConflict(err, "A subject with this name already exists for this board/class");
  }
}

export async function updateSubject(id: string, input: SubjectUpdateInput): Promise<AdminSubject> {
  const existing = await findSubjectById(id);
  if (!existing) {
    throw new NotFoundError("Subject not found");
  }
  try {
    const subject = await updateSubjectRepo(id, input);
    return toAdminSubject(subject);
  } catch (err) {
    throw mapConflict(err, "A subject with this name already exists for this board/class");
  }
}

function mapConflict(err: unknown, message: string): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return new ConflictError(message);
  }
  return err;
}

type SubjectRow = {
  id: string;
  name: string;
  boardId: string;
  class: number;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
};

function toPublicSubject(subject: SubjectRow) {
  return {
    id: subject.id,
    name: subject.name,
    boardId: subject.boardId,
    class: subject.class,
    description: subject.description,
    displayOrder: subject.displayOrder,
  };
}

function toAdminSubject(subject: SubjectRow): AdminSubject {
  return { ...toPublicSubject(subject), isActive: subject.isActive };
}
