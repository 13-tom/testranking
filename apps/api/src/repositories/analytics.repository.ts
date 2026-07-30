import { prisma } from "../lib/prisma.js";
import type { ChapterAggregate, OverallAggregate, ProgressSnapshotAggregate, SubjectAggregate, TopicAggregate } from "../rules/analytics-aggregation.rules.js";

// --- Writer (Phase 5, BR-043): full idempotent upsert per analytics run ---

export function upsertStudentAnalytics(studentId: string, data: OverallAggregate) {
  return prisma.studentAnalytics.upsert({
    where: { studentId },
    create: { studentId, ...data },
    update: data,
  });
}

export async function upsertSubjectAnalytics(studentId: string, subjects: SubjectAggregate[]) {
  for (const s of subjects) {
    const { subjectId, ...data } = s;
    await prisma.studentSubjectAnalytics.upsert({
      where: { studentId_subjectId: { studentId, subjectId } },
      create: { studentId, subjectId, ...data },
      update: data,
    });
  }
}

export async function upsertChapterAnalytics(studentId: string, chapters: ChapterAggregate[]) {
  for (const c of chapters) {
    const { chapterId, ...data } = c;
    await prisma.studentChapterAnalytics.upsert({
      where: { studentId_chapterId: { studentId, chapterId } },
      create: { studentId, chapterId, ...data },
      update: data,
    });
  }
}

export async function upsertTopicAnalytics(studentId: string, topics: TopicAggregate[]) {
  for (const t of topics) {
    const { topicId, ...data } = t;
    await prisma.studentTopicAnalytics.upsert({
      where: { studentId_topicId: { studentId, topicId } },
      create: { studentId, topicId, ...data },
      update: data,
    });
  }
}

export async function upsertProgressSnapshots(studentId: string, snapshots: ProgressSnapshotAggregate[]) {
  for (const snap of snapshots) {
    const { date, ...data } = snap;
    await prisma.studentProgressSnapshot.upsert({
      where: { studentId_date: { studentId, date } },
      create: { studentId, date, ...data },
      update: data,
    });
  }
}

// --- Readers (Module 13: analytics.*) ---

export function findStudentAnalytics(studentId: string) {
  return prisma.studentAnalytics.findUnique({ where: { studentId } });
}

export function findSubjectAnalyticsList(studentId: string) {
  return prisma.studentSubjectAnalytics.findMany({
    where: { studentId },
    include: { subject: { select: { name: true } } },
    orderBy: { accuracy: "desc" },
  });
}

export function findSubjectAnalyticsDetail(studentId: string, subjectId: string) {
  return prisma.studentSubjectAnalytics.findUnique({
    where: { studentId_subjectId: { studentId, subjectId } },
    include: { subject: { select: { name: true } } },
  });
}

export function findChapterAnalyticsDetail(studentId: string, chapterId: string) {
  return prisma.studentChapterAnalytics.findUnique({
    where: { studentId_chapterId: { studentId, chapterId } },
    include: { chapter: { select: { name: true, subjectId: true } } },
  });
}

export function findTopicAnalyticsDetail(studentId: string, topicId: string) {
  return prisma.studentTopicAnalytics.findUnique({
    where: { studentId_topicId: { studentId, topicId } },
    include: { topic: { select: { name: true, chapterId: true } } },
  });
}

export function findProgressSnapshots(studentId: string, from?: Date, to?: Date, limit = 90) {
  return prisma.studentProgressSnapshot.findMany({
    where: {
      studentId,
      ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    },
    orderBy: { date: "asc" },
    take: limit,
  });
}

// --- Shared readers (Modules 14-18 all read the same 5 tables) ---

export function findAllChapterAnalytics(studentId: string) {
  return prisma.studentChapterAnalytics.findMany({
    where: { studentId },
    include: { chapter: { select: { name: true, subjectId: true } } },
  });
}

export function findAllTopicAnalytics(studentId: string) {
  return prisma.studentTopicAnalytics.findMany({
    where: { studentId },
    include: { topic: { select: { name: true, chapterId: true } } },
  });
}

export function findAllSubjectAnalytics(studentId: string) {
  return prisma.studentSubjectAnalytics.findMany({
    where: { studentId },
    include: { subject: { select: { name: true, displayOrder: true } } },
  });
}

export function findAllProgressSnapshots(studentId: string) {
  return prisma.studentProgressSnapshot.findMany({ where: { studentId }, orderBy: { date: "asc" } });
}
