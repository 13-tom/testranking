// Phase 5 (Analytics, BR-043): Module 15 reads the same 5 pre-computed
// tables as every other analytics module — thin re-exports of the shared
// readers already defined in analytics.repository.ts (Module 13's own
// table), kept here so intelligence.service.ts doesn't reach across
// module boundaries directly.
export {
  findAllChapterAnalytics,
  findAllProgressSnapshots,
  findAllSubjectAnalytics,
  findAllTopicAnalytics,
  findStudentAnalytics,
} from "./analytics.repository.js";
