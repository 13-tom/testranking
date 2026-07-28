import { Prisma } from "@prisma/client";
import type { AdminChapter, ChapterListResponseData } from "@board-ranking/shared";
import { ConflictError, NotFoundError } from "../errors/AppError.js";
import {
  createChapter as createChapterRepo,
  findActiveChapters,
  findChapterById,
  updateChapter as updateChapterRepo,
} from "../repositories/chapter.repository.js";
import type { ChapterCreateInput, ChaptersQuery, ChapterUpdateInput } from "../validators/question-bank.validators.js";

export async function listPublicChapters(filter: ChaptersQuery): Promise<ChapterListResponseData> {
  const chapters = await findActiveChapters(filter);
  return chapters.map(toPublicChapter);
}

export async function createChapter(input: ChapterCreateInput): Promise<AdminChapter> {
  try {
    const chapter = await createChapterRepo(input);
    return toAdminChapter(chapter);
  } catch (err) {
    throw mapConflict(err, "A chapter with this name or number already exists for this subject");
  }
}

export async function updateChapter(id: string, input: ChapterUpdateInput): Promise<AdminChapter> {
  const existing = await findChapterById(id);
  if (!existing) {
    throw new NotFoundError("Chapter not found");
  }
  try {
    const chapter = await updateChapterRepo(id, input);
    return toAdminChapter(chapter);
  } catch (err) {
    throw mapConflict(err, "A chapter with this name or number already exists for this subject");
  }
}

function mapConflict(err: unknown, message: string): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return new ConflictError(message);
  }
  return err;
}

type ChapterRow = {
  id: string;
  subjectId: string;
  name: string;
  chapterNumber: number;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
};

function toPublicChapter(chapter: ChapterRow) {
  return {
    id: chapter.id,
    subjectId: chapter.subjectId,
    name: chapter.name,
    chapterNumber: chapter.chapterNumber,
    description: chapter.description,
    displayOrder: chapter.displayOrder,
  };
}

function toAdminChapter(chapter: ChapterRow): AdminChapter {
  return { ...toPublicChapter(chapter), isActive: chapter.isActive };
}
