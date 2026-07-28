# 12_Product_Decisions.md

**Project:** Board Ranking

**Document Version:** 1.0

**Status:** Living Document

---

# Introduction

This document records all approved product, engineering, and architectural decisions made during the development of Board Ranking.

Every major decision should include:

* Decision ID
* Category
* Decision
* Status
* Reason
* Alternatives Considered
* Date
* Future Review (if applicable)

This document is updated whenever an important decision is approved.

---

# Decision Format

Every decision follows this template.

```text
Decision ID:

Category:

Decision:

Status:

Reason:

Alternatives Considered:

Future Review:

Approved By:

Version:
```

---

# Product Decisions

---

## BR-001

**Category**

Product

**Decision**

Board Ranking will initially support only **CBSE Class 9, 10, 11, and 12**.

**Status**

Approved

**Reason**

Focus on a clearly defined audience and launch faster.

**Alternatives Considered**

Support all education boards from Day One.

**Why Rejected**

Would significantly increase syllabus complexity.

---

## BR-002

**Category**

Authentication

**Decision**

Use **Mobile Number + OTP** authentication.

**Status**

Approved

**Reason**

Simple onboarding for Indian students.

**Alternatives Considered**

Email login

Google Login

Password login

**Future Review**

Google Login may be introduced in a later release.

---

## BR-003

**Category**

User Roles

**Decision**

Release 1 supports only:

* Student
* Admin

**Status**

Approved

**Reason**

Keep MVP focused and reduce development complexity.

---

## BR-004

**Category**

Teacher Module

**Decision**

Teacher Dashboard is postponed.

**Status**

Approved

**Reason**

Question quality will be managed entirely by Admins during the MVP.

---

## BR-005

**Category**

Parent Module

**Decision**

Parent Dashboard is postponed.

**Status**

Approved

**Reason**

Primary focus is student learning.

---

## BR-006

**Category**

Question System

**Decision**

Release 1 supports only **MCQ questions**.

**Status**

Approved

**Reason**

Fast development, simpler evaluation, and reliable analytics.

**Future Review**

Support additional question types in future releases.

---

## BR-007

**Category**

Question Ownership

**Decision**

Only Admins can create, edit, publish, or archive questions.

**Status**

Approved

---

## BR-008

**Category**

Question IDs

**Decision**

Every question has:

* Internal UUID
* Human-readable Question Reference Code

Example:

10M0101

**Status**

Approved

---

## BR-009

**Category**

Question Deletion

**Decision**

Questions are never permanently deleted.

They are archived.

**Status**

Approved

**Reason**

Maintain academic history and auditability.

---

## BR-010

**Category**

Duplicate Detection

**Decision**

The Question Bank must prevent duplicate and near-duplicate questions.

**Status**

Approved

---

## BR-011

**Category**

Retake Policy

**Decision**

Students can retake tests using two modes.

Practice Again

* Same questions
* Does not affect ranking

New Challenge

* Different questions
* Updates rankings and analytics

**Status**

Approved

---

## BR-012

**Category**

Backend

**Decision**

All business logic executes on the backend.

**Status**

Approved

Examples:

* Study Points
* Rankings
* Test Evaluation
* Recommendations

Frontend only displays information.

---

## BR-013

**Category**

Database

**Decision**

PostgreSQL will be used as the primary database.

Prisma ORM will manage database access.

**Status**

Approved

---

## BR-014

**Category**

Security

**Decision**

Frontend never communicates directly with the database.

All communication passes through the backend API.

**Status**

Approved

---

## BR-015

**Category**

Profile System

**Decision**

Students complete profiles progressively.

Study Points are awarded gradually.

**Status**

Approved

---

## BR-016

**Category**

Gamification

**Decision**

Use **Study Points (SP)** instead of traditional gaming XP.

**Status**

Approved

**Reason**

Creates an educational identity while maintaining motivation.

---

## BR-017

**Category**

Recommendations

**Decision**

Recommendations are rule-based in Release 1.

No AI is used for recommendations.

**Status**

Approved

---

## BR-018

**Category**

Rankings

**Decision**

Release 1 includes:

* Overall Platform Rank
* Class Rank

School, District, and State rankings will be introduced after sufficient user growth.

**Status**

Approved

---

## BR-019

**Category**

Question Lifecycle

**Decision**

Every question follows:

Draft

↓

Review

↓

Approved

↓

Published

↓

Archived

**Status**

Approved

---

## BR-020

**Category**

Documentation

**Decision**

Development begins only after documentation is approved.

Required documentation includes:

* Product Bible
* Engineering Guide
* Design System
* Database Blueprint
* API Blueprint
* PRD

**Status**

Approved

---

## BR-021

**Category**

Architecture

**Decision**

The platform will be built using modular engines.

Examples:

* Academic Question Management System
* Test Engine
* Evaluation Engine
* Analytics Engine
* Ranking Engine
* Study Points Engine

**Status**

Approved

---

## BR-022

**Category**

Security

**Decision**

Backend is the single source of truth.

No score, ranking, Study Point, or evaluation calculation may occur on the frontend.

**Status**

Approved

---

## BR-023

**Category**

Question Bank

**Decision**

The Question Bank is considered the most valuable intellectual property of Board Ranking.

**Status**

Approved

---

## BR-024

**Category**

MVP Strategy

**Decision**

Launch a small, polished product instead of a feature-heavy platform.

**Status**

Approved

---

## BR-025

**Category**

Product Philosophy

**Decision**

Every feature must answer one question:

> "Does this help students learn better?"

If the answer is no, the feature should not be built.

**Status**

Approved

---

## BR-026

**Category**

Architecture — Test Engine (Sprint 5.5)

**Decision**

Persisted results are the single source of truth for evaluated attempts.

The submission transaction writes the official result exactly once:

* TestAttempt: score, totalMarks, percentage, accuracy, correctCount,
  wrongCount, unansweredCount, timeTaken, studyPointsEarned
* StudentAnswer: isCorrect, marksAwarded (per question)
* StudentProfile: studyPoints incremented (exactly once, CAS-guarded)
* AuditLog: TEST_SUBMITTED entry (atomic with the evaluation)

`GET /result` and `GET /summary` read these persisted values. The pure
scoring function (`scoreQuestions`) remains available for replay, validation,
and testing, but must never become the source of truth for historical results.

**Status**

Approved

---

## BR-027

**Category**

Architecture — Test Engine (Sprint 5.5 / Sprint 6)

**Decision**

Auto-submission is guaranteed by the server, not the client.

* The client-triggered `POST /attempts/:attemptId/auto-submit` endpoint is an
  OPTIMIZATION only — it gives the student an immediate result when their
  timer expires while the app is open.
* The authoritative guarantee comes from a server-side sweeper (background
  worker, Sprint 6): it periodically scans for STARTED attempts with
  `expiresAt < now()` (served by the `(status, expiresAt)` index) and submits
  them through the same CAS transaction — even if the client disconnected,
  closed the tab, or lost network permanently.
* Both paths share one CAS transaction (`UPDATE … WHERE status = 'STARTED'`),
  so whichever fires first wins and the other is a no-op idempotent read.
  Double-evaluation, double study-point awards, and duplicate audit entries
  are structurally impossible.

**Status**

Approved (sweeper implementation scheduled for Sprint 6)

---

## BR-028

**Category**

Product — Test Engine (Sprint 5.5)

**Decision**

Result visibility in Sprint 5.5: EVALUATED ⇒ immediately visible to the owner.

* Enforcement of `Test.resultPublishPolicy` (AFTER_END_TIME, MANUAL) is
  intentionally deferred to Sprint 6. The column exists on the Test blueprint;
  the result endpoints do not yet consult it.
* `correctOptionKey` is revealed only after evaluation (post-submission).
* Question/option explanations are NOT returned by `GET /result` in
  Sprint 5.5. If they are added to the result payload later, they must follow
  the same post-evaluation gate — never exposed before submission.

**Status**

Approved

---

## BR-029

**Category**

Architecture — Ranking Infrastructure (Sprint 6.1)

**Decision**

The Leaderboard table serves ALL_TIME ranks for the four MVP scopes only.
Future scopes must NOT be implemented by adding new rank columns.

The four rank columns (schoolRank, districtRank, stateRank, indiaRank) are
frozen at the MVP scope set. If future scopes (CITY, FRIENDS, CUSTOM) were
added as new columns, the table would grow unboundedly with each new scope
type and require a migration plus a code change for every addition.

Intended evolution:

* MVP scopes (Sprint 6.1–6.2): SCHOOL · DISTRICT · STATE · NATIONAL
  * ALL_TIME cached in Leaderboard for fast single-table reads
  * All period snapshots and history in RankSnapshot

* Future scopes (Sprint 6.3+): CITY · FRIENDS · CUSTOM
  * No new columns in Leaderboard
  * ALL_TIME served from RankSnapshot (latest published ALL_TIME snapshot
    per (scope, scopeId)); one additional query on the read path is acceptable
  * Period snapshots and history: same RankSnapshot table, same pattern

The RankSnapshot table's open-string (scope, scopeId) design explicitly
accommodates unlimited future scope types without schema changes.

**Status**

Approved

---

## BR-030

**Category**

Architecture — Ranking Infrastructure (Sprint 6.1)

**Decision**

scopeId values in RankSnapshot must be canonical — sourced from the schools
table, not from caller-supplied strings.

The calculation job (Sprint 6.2) is the sole authority for scopeId values.
It must read the canonical string from the School record before writing to
RankSnapshot, not derive it from request parameters or student input. This
prevents the same geographic entity appearing under multiple spellings (e.g.
"Bangalore" vs "Bengaluru" vs "Bangalore Urban").

Canonical sources per scope:

* SCHOOL   → schools.id (UUID, PK — unambiguous)
* DISTRICT → schools.district column value (read from School at job time)
* STATE    → schools.state column value (read from School at job time)
* NATIONAL → literal 'INDIA' (hardcoded, no lookup needed)
* CITY     → schools.city column value (Sprint 6.3+, same pattern)

The Sprint 6.1 read API applies structural validation only for
DISTRICT/STATE/CITY (non-empty string). Full entity validation is deferred
to the calculation job (Sprint 6.2) which controls the write path.

**Status**

Approved (enforcement deferred to Sprint 6.2 calculation job)

---

## BR-031

**Category**

Architecture — Ranking Infrastructure (Sprint 6.1)

**Decision**

rankingVersion is monotonically increasing within
(scope, scopeId, period, academicYear) and is incremented only to correct
a verified calculation bug — never for routine new-period runs.

Semantics:

* Version 1 is written by the first correct calculation for a given
  (scope, scopeId, period, academicYear) combination.
* A new version (N+1) is written when a verified bug in version N is
  corrected. The calculation job re-runs the full affected bucket,
  inserts new RankSnapshot rows at the new version, and publishes them.
  The old version rows are never deleted (audit trail).
* Routine new-period calculations (e.g. the weekly job producing
  WEEKLY_2026_W29) write a new period string at version 1 — they do
  NOT increment the version of the prior week.
* The API always serves the highest published version for a given
  (scope, scopeId, period) combination via findLatestRankingVersion.
* Only the calculation job may write RankSnapshot rows. The read API has
  no insert or update path on this table.

**Status**

Approved

---

## BR-032

**Category**

Architecture — Ranking Calculation Engine (Sprint 6.2)

**Decision**

Rankings are determined by **examination performance**, not by studyPoints.

The deterministic sort order for ranking students on the same test is:

1. `percentage DESC` — primary ranking metric; the student's normalised score (0–100) on this specific test. Percentage is used instead of raw score so the metric is comparable across test variants with different total-mark values.
2. `totalMarks DESC` — tie-break 1: on equal percentage, higher absolute marks indicate more correct answers; only meaningful within the same test, but included for future multi-variant support.
3. `accuracy DESC` — tie-break 2: on equal percentage and marks, the student with fewer wrong answers (correct ÷ answered) ranks higher; rewards precision over guessing.
4. `submittedAt ASC` — tie-break 3: on identical statistics, the earlier finisher ranks higher; rewards speed.
5. `studentId ASC` — tie-break 4: UUID stable tiebreaker; guarantees a unique, deterministic rank for every student.

**studyPoints is NOT a ranking input.** It belongs exclusively to the Gamification system (Milestone 8): XP levels, achievements, and streaks. studyPoints continues to appear on the leaderboard as a *display field only* — it has no effect on rank order.

**Status**

Approved

**Reason**

Board Ranking is an academic platform. Ranks must reflect examination ability, not gamification engagement. A student who practised many tests but answered incorrectly should not outrank a student with higher exam accuracy.

**Alternatives Considered**

studyPoints-based ranking — rejected (gamification metric, not academic performance).
Average percentage across all tests — deferred to Sprint 6.3+ (requires aggregate column or complex GROUP BY).

---

## BR-033

**Category**

Architecture — Ranking Calculation Engine (Sprint 6.2)

**Decision**

**ALL_TIME** (`period = 'ALL_TIME'`) is defined as:

* **Per-test scope**: The student's rank among **all students who ever completed the same specific test** (`testId`), with no time-window restriction.
* **Leaderboard cache (global view)**: The `Leaderboard` table stores each student's rank on their **most recently submitted ranked test**, computed under the Best Attempt retake policy (BR-036) — i.e. the rank is derived from the student's best attempt on that test, not necessarily the triggering attempt. Each new ranked submission overwrites the student's cached rank.
* **Known MVP limitation**: The global Leaderboard combines students who may have taken different tests. These ranks are not directly comparable across tests. This is acceptable for the MVP where most students take the same curated tests.
* **Future evolution**: Sprint 6.3+ will introduce a cross-test aggregate ranking (weighted average percentage across all RANKED-mode tests). The existing schema and API accommodate this with no changes.

ALL_TIME is not a placeholder. It has the specific meaning above. Periodic rankings (WEEKLY, MONTHLY, YEARLY) are introduced with the batch job in Sprint 6.3+.

**Status**

Approved

---

## BR-034

**Category**

Architecture — Ranking Calculation Engine (Sprint 6.2)

**Decision**

The Sprint 6.2 MVP performs **COUNT() queries immediately after each submission** (two queries per scope: above-count + total-count). This is an MVP-only approach accepted with documented limitations.

**Why it works for MVP**: COUNT() with a WHERE clause on indexed columns (`testId`, `status`, `percentage`, `schoolId`) uses a B-tree index scan, O(log N). For hundreds to low thousands of students this completes in single-digit milliseconds.

**Retake handling**: Fully implemented in Sprint 6.2 via the Best Attempt policy (BR-036) — the count queries use a `DISTINCT ON ("studentId")` best-attempt CTE, so each student counts exactly once per test. Retake handling is NOT deferred work.

**Production-scale evolution path** (no API or schema changes required):

```
Student submits test
    ↓
Submission transaction commits → EVALUATED
    ↓
Enqueue ranking job message (SQS / Bull / pg-boss)
    ↓
Background ranking worker picks up message
    ↓
Batch recalculation for the affected test + scope
  (same best-attempt DISTINCT ON query, executed once per batch
   instead of once per submission)
    ↓
Bulk upsert RankSnapshot + Leaderboard refresh
    ↓
Attempt transitions to RANKED
```

**Status**

Approved (MVP implementation; production evolution scheduled Sprint 6.3+)

---

## BR-035

**Category**

Architecture — Ranking Calculation Engine (Sprint 6.2)

**Decision**

**Recovery strategy for orphaned EVALUATED attempts.**

An attempt becomes orphaned if the server crashes after the submission transaction commits but before the fire-and-forget `triggerRankingForAttempt` promise resolves. Orphaned attempts remain permanently EVALUATED, never RANKED.

**Recovery architecture (implemented):**

1. **Startup scan** — `scanOrphanedEvaluatedAttempts()` (in `ranking-calculation.service.ts`) is called on every server start. It queries for EVALUATED ranked-mode attempts submitted more than 10 minutes ago and re-triggers ranking for each. The 10-minute grace period prevents racing with in-flight fire-and-forget calls.

2. **Periodic cron scan** (Sprint 6.3+) — a cron job calls `scanOrphanedEvaluatedAttempts()` every 15 minutes, catching any runtime failures that the fire-and-forget swallowed.

3. **Idempotency guarantee** — the CAS in `rankCalculationTransaction` (`UPDATE WHERE status = 'EVALUATED'`) ensures retrying an already-RANKED attempt is a no-op. No duplicate snapshots or duplicate Leaderboard updates are possible.

4. **Audit detection** — every successful ranking writes an `AUDIT_ACTIONS.RANK_COMPUTED` entry. An orphaned attempt has no such entry — a second detection mechanism for ops tooling.

**Wiring (Sprint 6.3+):**

```typescript
// server startup (src/server.ts, after DB connection confirmed):
import { scanOrphanedEvaluatedAttempts } from '@/services/ranking-calculation.service'
void scanOrphanedEvaluatedAttempts()

// cron (every 15 min):
cron.schedule('*/15 * * * *', () => void scanOrphanedEvaluatedAttempts())
```

**Status**

Approved (startup scan implemented; cron wiring scheduled Sprint 6.3+)

---

## BR-036

**Category**

Product / Architecture — Ranking Calculation Engine (Sprint 6.2)

**Decision**

**Retake policy: BEST ATTEMPT.**

Each student is represented in the ranking by exactly **one attempt per test** — their best attempt under the BR-032 deterministic sort order (percentage DESC, totalMarks DESC, accuracy DESC, submittedAt ASC, studentId ASC).

**Why Best Attempt (and not Latest or First):**

* **Best** aligns with BR-025 ("does this help students learn better?"): retaking a test to improve is exactly the behaviour the platform wants to encourage. Under Best Attempt, a retake can only improve or maintain a student's rank — it can never hurt. Students retake without fear.
* **Latest** was rejected: a bad day would erase a student's earned standing, punishing the act of practising — the opposite of the platform's mission. It also creates rank volatility that confuses leaderboards.
* **First** was rejected: it makes retakes pointless for ranking (BR-011 explicitly says New Challenge "updates rankings"), removing the core motivation loop.

**How duplicate leaderboard entries are impossible:**

* Both calculation count queries select the per-student best attempt via `DISTINCT ON ("studentId") ORDER BY <5-field order>` (see `countStudentsAboveForTest` / `countStudentsForTest` in `ranking.repository.ts`). One student = one comparison row = one rank position per test, regardless of retake count.
* The `Leaderboard` table has a unique constraint on `studentId` (one cache row per student), and it is written via upsert.

**Effect on the three surfaces:**

* **RankSnapshot** — every ranked submission (including a worse retake) appends new immutable snapshot rows recording the rank *as computed under the Best Attempt policy at that moment*. Rows are never deleted or updated. A worse retake therefore produces snapshot rows whose rank equals the prior standing (the best attempt still represents the student).
* **Leaderboard** — the cache is overwritten on every ranked submission with the rank derived from the student's best attempt. It always reflects the policy: a better retake raises the cached rank; a worse retake leaves it effectively unchanged (recomputed from the same best attempt).
* **Rank History** (`GET /students/:studentId/rank-history`) — shows one entry per calculation run, i.e. the full evolution of the student's standing across retakes. Because worse retakes recompute from the same best attempt, history entries after a worse retake show a stable rank (it may still shift slightly if *other* students' standings changed in between).

The `AuditLog` metadata for each calculation records `retakePolicy: 'BEST_ATTEMPT'` and the `representativeAttemptId` (which may differ from the triggering attempt on a worse retake).

**Status**

Approved

---

# Pending Decisions

The following topics are still under discussion and will be finalized later:

* Subscription Plans
* Premium Feature List
* School Partnership Model
* AI Roadmap
* Parent Dashboard
* Teacher Dashboard
* Mobile Application Strategy
* Regional Language Support
* Offline Learning Products

---

# Decision Governance

Every approved decision must:

* Have a unique Decision ID.
* Include a clear business or technical reason.
* Be reviewed before major architectural changes.
* Remain documented for future team members.

No major product or architecture decision should be implemented without first being recorded in this document.

---

# Change Log

| Version | Changes                                                                     |
| ------- | --------------------------------------------------------------------------- |
| 1.0     | Initial set of Board Ranking product and architecture decisions documented. |

---

# CTO Statement

A successful software product is built on good decisions, not just good code.

Developers may change.

Designers may change.

Technology may change.

Artificial Intelligence may change.

But well-documented decisions preserve the vision of the product.

This document is the institutional memory of Board Ranking.

Every important decision should be recorded here before it is implemented, ensuring that the platform grows consistently, scales intelligently, and remains true to its original mission of helping students learn better.

---

**Document Status:** Living Document

**Version:** 1.0

**Last Updated:** To be updated with each approved decision.
