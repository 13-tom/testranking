import type {
  ChaptersRecommendationResponseData,
  GoalsResponseData,
  PracticeResponseData,
  RecommendationItem,
  RecommendationSummaryResponseData,
  RevisionResponseData,
  TodayPlanResponseData,
  TopicsRecommendationResponseData,
  WeekPlanDay,
  WeekPlanResponseData,
} from "@board-ranking/shared";
import { findAllChapterAnalytics, findAllProgressSnapshots, findAllSubjectAnalytics, findAllTopicAnalytics, findStudentAnalytics, findStudentProfileForDashboard } from "../repositories/recommendation.repository.js";
import { classifyAccuracyTrend } from "../rules/trend.rules.js";
import { computeSubjectReadiness } from "../rules/intelligence.rules.js";
import { computeAccuracyPenalty, computeSpeedPenalty, computeSubjectMasteryPenalty, computeVolumePenalty, computeWeaknessScore as computeWeaknessComposite } from "../rules/weakness.rules.js";
import {
  buildContributingFactors,
  buildExpectedBenefit,
  buildPracticeSuggestions,
  buildReasonSentence,
  classifyRecommendationPriority,
  computeConsistencyFactor,
  computeFrequencyFactor,
  computeMasteryGapFactor,
  computeRecommendationScore,
  computeRevisionUrgency,
  computeTrendFactor,
  determineRecommendationType,
  finalizeGoal,
  isRevisionCandidate,
  suggestedActivityForType,
  WEEK_THEMES,
} from "../rules/recommendation.rules.js";
import { paginateByCursor } from "../rules/pagination.rules.js";
import type { GoalsQuery, PracticeQuery, RecommendationListQuery, RevisionQuery, TodayQuery, WeekQuery } from "../validators/recommendation.validators.js";

async function buildCandidates(studentId: string): Promise<RecommendationItem[]> {
  const [subjects, chapters, topics, snapshots] = await Promise.all([
    findAllSubjectAnalytics(studentId),
    findAllChapterAnalytics(studentId),
    findAllTopicAnalytics(studentId),
    findAllProgressSnapshots(studentId),
  ]);

  const half = Math.floor(snapshots.length / 2);
  const olderAvg = snapshots.slice(0, half);
  const recentAvg = snapshots.slice(half);
  const avg = (arr: { accuracy: number }[]) => (arr.length > 0 ? arr.reduce((sum, s) => sum + s.accuracy, 0) / arr.length : 0);
  const trend = classifyAccuracyTrend(avg(recentAvg) - avg(olderAvg), snapshots.length);

  function toItem(entityType: RecommendationItem["entityType"], id: string, name: string, accuracy: number, masteryMetric: number, questionsSolved: number, attempts: number, avgTime: number, masteryPenalty: number): RecommendationItem {
    const weaknessScore = computeWeaknessComposite(computeAccuracyPenalty(accuracy), computeVolumePenalty(questionsSolved), computeSpeedPenalty(avgTime), masteryPenalty);
    const readiness = computeSubjectReadiness(accuracy, questionsSolved, avgTime);
    const weaknessFactor = weaknessScore;
    const trendFactor = computeTrendFactor(trend);
    const readinessFactor = 100 - readiness;
    const masteryGapFactor = computeMasteryGapFactor(masteryMetric);
    const frequencyFactor = computeFrequencyFactor(questionsSolved);
    const consistencyFactor = computeConsistencyFactor(attempts);
    const score = computeRecommendationScore(weaknessFactor, trendFactor, readinessFactor, masteryGapFactor, frequencyFactor, consistencyFactor);
    const priority = classifyRecommendationPriority(score);
    const type = determineRecommendationType({ weaknessScore, trend, masteryMetric, questionsSolved, accuracy, attempts });
    const { activity, quantity } = suggestedActivityForType(type);

    return {
      entityType,
      id,
      name,
      type,
      score,
      priority: priority.level,
      estimatedTimeMinutes: priority.estimatedTimeMinutes,
      reason: buildReasonSentence(type, name),
      contributingFactors: buildContributingFactors(weaknessFactor, trendFactor, readinessFactor, masteryGapFactor, frequencyFactor, consistencyFactor),
      expectedBenefit: buildExpectedBenefit(type),
      suggestedActivity: activity,
      suggestedQuantity: quantity,
    };
  }

  const subjectItems = subjects.map((s) => toItem("SUBJECT", s.subjectId, s.subject.name, s.accuracy, s.accuracy, s.questionsSolved, s.attempts, s.averageTimePerQuestion, computeSubjectMasteryPenalty(s.averageScore, s.bestScore)));
  const chapterItems = chapters.map((c) => toItem("CHAPTER", c.chapterId, c.chapter.name, c.accuracy, c.accuracy, c.questionsSolved, c.attempts, c.averageTimePerQuestion, c.weaknessScore));
  const topicItems = topics.map((t) => toItem("TOPIC", t.topicId, t.topic.name, t.accuracy, t.masteryScore, t.questionsSolved, t.attempts, t.averageTimePerQuestion, 100 - t.masteryScore));

  return [...subjectItems, ...chapterItems, ...topicItems];
}

function buildTodayPlan(candidates: RecommendationItem[], limit: number): RecommendationItem[] {
  const sorted = candidates.slice().sort((a, b) => b.score - a.score);
  const maxItems = Math.min(5, limit);
  const maxMinutes = 120;
  const maxWeaknessMinutes = maxMinutes * 0.6;
  const minRevisionMinutes = maxMinutes * 0.15;
  const selected: RecommendationItem[] = [];
  let totalMinutes = 0;
  let weaknessMinutes = 0;
  let revisionMinutes = 0;

  for (const c of sorted) {
    if (selected.length >= maxItems) break;
    if (totalMinutes + c.estimatedTimeMinutes > maxMinutes) continue;
    const isWeaknessType = c.type === "WEAKNESS_RECOVERY" || c.type === "DECLINING_RECOVERY";
    if (isWeaknessType && weaknessMinutes + c.estimatedTimeMinutes > maxWeaknessMinutes) continue;
    selected.push(c);
    totalMinutes += c.estimatedTimeMinutes;
    if (isWeaknessType) weaknessMinutes += c.estimatedTimeMinutes;
    if (c.type === "REVISION") revisionMinutes += c.estimatedTimeMinutes;
  }

  if (revisionMinutes < minRevisionMinutes && selected.length < maxItems) {
    const candidate = sorted.find((c) => c.type === "REVISION" && !selected.includes(c) && totalMinutes + c.estimatedTimeMinutes <= maxMinutes);
    if (candidate) selected.push(candidate);
  }
  return selected;
}

function buildWeekPlan(candidates: RecommendationItem[], maxPerDay: number): WeekPlanResponseData {
  const sorted = candidates.slice().sort((a, b) => b.score - a.score);
  const key = (c: RecommendationItem) => `${c.entityType}:${c.id}`;
  const used = new Set<string>();
  const days: WeekPlanDay[] = WEEK_THEMES.map((t) => ({ day: t.day, theme: t.theme, items: [] }));

  WEEK_THEMES.forEach((theme, i) => {
    for (const c of sorted) {
      if (days[i]!.items.length >= maxPerDay) break;
      if (used.has(key(c))) continue;
      if (theme.focus.includes(c.type)) {
        days[i]!.items.push(c);
        used.add(key(c));
      }
    }
  });

  const remaining = sorted.filter((c) => !used.has(key(c)));
  let dayIndex = 0;
  for (const c of remaining) {
    let attempts = 0;
    while (days[dayIndex]!.items.length >= maxPerDay && attempts < days.length) {
      dayIndex = (dayIndex + 1) % days.length;
      attempts++;
    }
    if (attempts >= days.length) break;
    days[dayIndex]!.items.push(c);
    used.add(key(c));
    dayIndex = (dayIndex + 1) % days.length;
  }
  return days;
}

export async function getTodayPlan(studentId: string, query: TodayQuery): Promise<TodayPlanResponseData> {
  const candidates = await buildCandidates(studentId);
  return buildTodayPlan(candidates, query.limit ?? 5);
}

export async function getWeekPlan(studentId: string, query: WeekQuery): Promise<WeekPlanResponseData> {
  const candidates = await buildCandidates(studentId);
  return buildWeekPlan(candidates, query.maxPerDay ?? 4);
}

export async function getChaptersRecommendations(studentId: string, query: RecommendationListQuery): Promise<ChaptersRecommendationResponseData> {
  const candidates = await buildCandidates(studentId);
  const sorted = candidates.filter((c) => c.entityType === "CHAPTER").sort((a, b) => b.score - a.score);
  return paginateByCursor(sorted, query.cursor, query.limit ?? 10);
}

export async function getTopicsRecommendations(studentId: string, query: RecommendationListQuery): Promise<TopicsRecommendationResponseData> {
  const candidates = await buildCandidates(studentId);
  const sorted = candidates.filter((c) => c.entityType === "TOPIC").sort((a, b) => b.score - a.score);
  return paginateByCursor(sorted, query.cursor, query.limit ?? 10);
}

export async function getPracticeSuggestions(studentId: string, query: PracticeQuery): Promise<PracticeResponseData> {
  const [overall, candidates] = await Promise.all([findStudentAnalytics(studentId), buildCandidates(studentId)]);
  const weakChapterCount = candidates.filter((c) => c.entityType === "CHAPTER" && c.type === "WEAKNESS_RECOVERY").length;
  const weakSubjectCount = candidates.filter((c) => c.entityType === "SUBJECT" && c.type === "WEAKNESS_RECOVERY").length;
  const suggestions = buildPracticeSuggestions({
    weakChapterCount,
    weakSubjectCount,
    overallAccuracy: overall?.accuracy ?? 0,
    testsTaken: overall?.testsTaken ?? 0,
    questionsSolved: overall?.questionsSolved ?? 0,
  });
  return suggestions.slice(0, query.limit ?? 5);
}

export async function getRevisionQueue(studentId: string, query: RevisionQuery): Promise<RevisionResponseData> {
  const [subjects, chapters, topics, candidates] = await Promise.all([
    findAllSubjectAnalytics(studentId),
    findAllChapterAnalytics(studentId),
    findAllTopicAnalytics(studentId),
    buildCandidates(studentId),
  ]);

  const urgencyById = new Map<string, number>();
  for (const s of subjects) if (isRevisionCandidate(s.accuracy, s.questionsSolved, 0, s.attempts)) urgencyById.set(s.subjectId, computeRevisionUrgency(s.accuracy, 0, s.questionsSolved));
  for (const c of chapters) if (isRevisionCandidate(c.accuracy, c.questionsSolved, c.weaknessScore, c.attempts)) urgencyById.set(c.chapterId, computeRevisionUrgency(c.accuracy, c.weaknessScore, c.questionsSolved));
  for (const t of topics) if (isRevisionCandidate(t.accuracy, t.questionsSolved, 100 - t.masteryScore, t.attempts)) urgencyById.set(t.topicId, computeRevisionUrgency(t.accuracy, 100 - t.masteryScore, t.questionsSolved));

  const revisionItems = candidates.filter((c) => urgencyById.has(c.id)).sort((a, b) => urgencyById.get(b.id)! - urgencyById.get(a.id)!);
  return paginateByCursor(revisionItems, query.cursor, query.limit ?? 10);
}

export async function getGoals(studentId: string, query: GoalsQuery): Promise<GoalsResponseData> {
  const [overall, profile] = await Promise.all([findStudentAnalytics(studentId), findStudentProfileForDashboard(studentId)]);
  const accuracy = overall?.accuracy ?? 0;
  const questionsSolved = overall?.questionsSolved ?? 0;
  const studyStreak = profile?.studyStreak ?? 0;

  const shortTerm = [
    finalizeGoal({ timeframe: "SHORT_TERM", description: "Raise accuracy by 5%", target: accuracy + 5, currentValue: accuracy, requiredImprovement: 5, explanation: "A short, achievable accuracy push over the next week." }, 7),
    finalizeGoal({ timeframe: "SHORT_TERM", description: "Solve 50 more questions", target: questionsSolved + 50, currentValue: questionsSolved, requiredImprovement: 50, explanation: "Build practice volume with 50 more questions this week." }, 7),
    finalizeGoal({ timeframe: "SHORT_TERM", description: "Reach a 7-day streak", target: 7, currentValue: studyStreak, requiredImprovement: Math.max(0, 7 - studyStreak), explanation: "Practice every day this week to build a streak." }, 7),
  ];

  const mediumTerm = [
    finalizeGoal({ timeframe: "MEDIUM_TERM", description: "Raise accuracy by 15%", target: accuracy + 15, currentValue: accuracy, requiredImprovement: 15, explanation: "A steady month-long accuracy improvement goal." }, 28),
    finalizeGoal({ timeframe: "MEDIUM_TERM", description: "Reach a 14-day streak", target: 14, currentValue: studyStreak, requiredImprovement: Math.max(0, 14 - studyStreak), explanation: "Build a consistent two-week study habit." }, 28),
  ];

  const longTerm = [
    finalizeGoal({ timeframe: "LONG_TERM", description: "Reach 95% accuracy", target: 95, currentValue: accuracy, requiredImprovement: Math.max(0, 95 - accuracy), explanation: "A long-term mastery target across all your subjects." }, 90),
    finalizeGoal({ timeframe: "LONG_TERM", description: "Solve 500 questions", target: 500, currentValue: questionsSolved, requiredImprovement: Math.max(0, 500 - questionsSolved), explanation: "Build deep practice volume over the next few months." }, 90),
    finalizeGoal({ timeframe: "LONG_TERM", description: "Reach a 30-day streak", target: 30, currentValue: studyStreak, requiredImprovement: Math.max(0, 30 - studyStreak), explanation: "Sustain a full month of consistent practice." }, 90),
  ];

  const all = [...shortTerm, ...mediumTerm, ...longTerm];
  return query.timeframe ? all.filter((g) => g.timeframe === query.timeframe) : all;
}

export async function getRecommendationSummary(studentId: string): Promise<RecommendationSummaryResponseData> {
  const candidates = await buildCandidates(studentId);
  const today = buildTodayPlan(candidates, 5);
  const topItem = candidates.slice().sort((a, b) => b.score - a.score)[0] ?? null;
  return { topItem, totalItemsToday: today.length };
}
