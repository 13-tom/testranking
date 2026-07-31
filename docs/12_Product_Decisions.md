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

## BR-037

**Category**

Product / Architecture — Authentication (Release 1 build)

**Decision**

**Release 1 student authentication is email + password, not Mobile Number + OTP.** This overrides BR-002 and PRD Chapter 8's Decision 002 for the current build phase.

**Why**

The product owner explicitly requested email + password as the primary login method for this build, with OTP/Mobile login deferred to a later phase rather than built now. Standard password auth avoids requiring a paid SMS provider account (e.g. MSG91) before the platform can be used and tested end-to-end.

**Implementation notes**

* `User.passwordHash` is used (bcrypt), reversing BR-002's "no passwords in MVP" for the student flow. Admin auth already used password auth separately, so this brings student auth in line with that pattern rather than introducing a wholly new mechanism.
* `User.phone` is kept as an optional, nullable, unique-when-present column now, so Mobile+OTP can be added in a later phase without a schema migration rework.
* All other Release 1 auth requirements from PRD Chapter 8 still apply where they don't conflict: JWT-based sessions, backend-only authorization, protected route lists, rate limiting on auth endpoints.

**Status**

Approved

---

## BR-038

**Category**

Product / Architecture — Build Sequencing

**Decision**

**Build order is Release 1 MVP scope first**, following `docs/06_Feature_Roadmap.md` Phases 0–9 (Foundation, Authentication, Student Dashboard, Question Bank, Test Engine, Analytics, Ranking System, core Study Points/Gamification, Admin Panel). Phases 10+ (Teacher Portal, Parent Portal, AI Features, Community, Competitive/Arena features, Marketplace, Mobile Apps, Future Expansion) remain documented but are deferred until the MVP phases are complete.

**Why**

The full documented system (including the Arena/Battles/Tournaments engine, the full Notification Platform, and granular Admin RBAC described in later sprints of `docs/04_database.md` and `docs/05_API_Blueprint.md`) is significantly larger than a buildable first increment. The product owner confirmed Release 1 MVP scope as the near-term target, consistent with BR-024 ("ship small polished MVP, not feature-heavy platform").

**Status**

Approved

---

## BR-039

**Category**

Architecture — Frontend Session Storage (Phase 2, Student Dashboard)

**Decision**

**The student JWT is stored in `localStorage`**, sent as `Authorization: Bearer <token>` on every protected request. Route protection (redirecting an unauthenticated visitor away from `/dashboard`, `/profile`, `/settings`) is a client-side React guard, not Next.js Edge middleware.

**Why**

The backend already returns the token in the JSON response body (not a `Set-Cookie` header), CORS has no `credentials: true`, and there is no `cookie-parser` anywhere in the API. Switching to httpOnly cookies now would mean reworking the already-shipped, already-tested Phase 1 auth code. Since the token lives in `localStorage` rather than a cookie, Edge middleware can't see it before render, so route protection is necessarily a client component.

**Implementation notes**

* `apps/web/src/lib/auth-storage.ts` wraps `localStorage` access (SSR-safe).
* `apps/web/src/components/protected-route.tsx` is the client-side guard.
* Accepted tradeoff: `localStorage` is readable by any injected script (XSS exposure) vs. httpOnly cookies which aren't. Acceptable for Release 1 MVP scope (no third-party or user-generated HTML rendering surface yet) — flagged here as a future hardening item, not a blocker.

**Status**

Approved

---

## BR-040

**Category**

Architecture — Admin Authentication (Phase 3, Question Bank)

**Decision**

**Admin-only routes are gated by a simple role check**, not the full audience-based Admin JWT system described in `docs/04_database.md`/`docs/05_API_Blueprint.md` (separate token audience, `verifyAdminAccessToken()`, RBAC permission codes). A `requireAdmin` middleware composes after the existing `authenticate` middleware and checks the already-issued JWT's `role === "ADMIN"` field.

**Why**

Question Bank content authoring (Phase 3) needs *some* admin gating today, but the full Admin JWT audience/RBAC system is explicitly Phase 9 (Admin Panel) scope per BR-038's build sequencing. Building it early would mean reaching ahead of the roadmap for a feature this phase doesn't otherwise need — `User.role` already has an `ADMIN` enum value from Phase 0, unused until now, which is enough to gate `POST`/`PATCH` on Subject/Chapter/Topic/Question/QuestionOption.

**Implementation notes**

* `apps/api/src/middleware/requireAdmin.ts` — throws the new `ForbiddenError` (403) if `req.user?.role !== "ADMIN"`.
* No separate admin login/audience/token-issuance flow exists. Admin accounts are currently created out-of-band (directly in the database); the existing `/auth/login` endpoint is student-specific (requires a `StudentProfile`) and does not serve admins. A proper admin onboarding/login flow is Phase 9 scope.
* Revisit when Phase 9 (Admin Panel) is built — this decision is explicitly a placeholder, not a permanent architecture choice.

**Status**

Approved

---

## BR-041

**Category**

Product / Architecture — Question Bank Content Authoring (Phase 3)

**Decision**

**Question Bank content gets into the system two ways**: (1) an idempotent seed script (`apps/api/prisma/seed.ts`) loading real, accurate starter content, and (2) minimal admin-only CRUD endpoints (`POST`/`PATCH` on `/admin/subjects`, `/admin/chapters`, `/admin/topics`, `/admin/questions`, `/admin/questions/:id/options`). Neither builds the full Phase 9 Admin Panel review workflow — no review queue, no bulk-approve/reject/archive endpoints, no permission-coded RBAC (`QUESTION_REVIEW`/`QUESTION_APPROVE`), no `QuestionVersions` audit trail.

**Why**

The documented spec never actually resolved this: `docs/05_API_Blueprint.md` MODULE 34 (the real Admin Panel build, Phase 9) only has question *moderation* endpoints (approve/reject/archive/bulk-*) — there is no `POST /admin/questions` or `PATCH /admin/questions/:id` anywhere in the blueprint, despite `QUESTION_CREATE`/`QUESTION_UPDATE` permission codes being referenced elsewhere as if such endpoints existed. Phase 3's own roadmap deliverable is "Questions available," which requires *some* way to author content well before Phase 9 exists.

**Implementation notes**

* Publish-gate validation (`apps/api/src/rules/question-bank.rules.ts`'s `evaluatePublishGate`) is the one piece of the documented editorial workflow actually enforced: a question can only transition to `PUBLISHED` with exactly one correct active option, 2-6 active options total, and a non-empty explanation (matching PRD Chapter 11's "questions without explanations cannot be published"). A direct admin `PATCH .../questions/:id { status: "PUBLISHED" }` is sufficient for this phase — no separate review-queue endpoints.
* Reference codes (BR-008) use a single-letter subject code (e.g. `10M0101`), matching the docs' own worked example, not the two-letter `CCSSCCQQ` label text that appears alongside it in `docs/04_database.md` — a documentation-format clarification, not a behavioral deviation.
* Revisit when Phase 9 (Admin Panel) is built: the review-queue/bulk-moderation/RBAC endpoints and `QuestionVersions` audit trail described in the docs should be added then, not retrofitted piecemeal.

**Status**

Approved

---

## BR-042

**Category**

Product / Architecture — Test Engine schema scope (Phase 4)

**Decision**

Phase 4 (Test Engine) builds the full documented architecture — admin-authored `Test` blueprints, seeded/reproducible question selection with the topic→chapter→subject pool-widening fallback, immutable per-question snapshot pinning, CAS-guarded exactly-once submission, and a lazy auto-submit-on-read path — rather than a lean roadmap-only subset. Two schema pieces this structurally requires are added now, narrower than their originally-deferred scope:

* **`QuestionVersion`** (system-generated snapshots only, no admin versioning/browse/audit UI). `AttemptQuestion` must pin to an immutable snapshot of a question's text/options/correct-answer so a live edit to the Question Bank can never retroactively change an in-progress or already-scored attempt. This narrows BR-041's deferral: the deferred piece is specifically the Phase 9 admin authoring/audit UI around versions, not the FK-supporting snapshot table itself, which the Test Engine cannot function correctly without.
* **`AuditLog`** (minimal — a plain `eventType` string column, not an enum; only `"TEST_SUBMITTED"` is emitted this phase). BR-026's submission transaction requires one audit entry per submission; this is one extra row inside a transaction the code already opens, not new infrastructure. No admin browsing UI is built for it.

One additional field, `StudentAnswer.markedForReview`, is added to support the PRD Chapter 12 §10 "Review Screen" (mark-a-question-for-review-before-submitting) — it's in the PRD narrative but not in `docs/04_database.md`'s literal `StudentAnswer` field list, so it's recorded here rather than added silently.

The one piece of the documented architecture NOT made to run live is the background auto-submit sweeper (`apps/api/src/jobs/attempt-sweeper.job.ts`): it is fully implemented and correct, but its periodic `setInterval` registration in `index.ts` is commented out, because Render's free-tier single Node process spins down on inactivity and cannot reliably run a background timer. A lazy check-and-close-on-read (`ensureAttemptFreshRow`, called at the top of every attempt read/write path) gives the same "no student is ever stuck on an expired attempt" guarantee in practice, since it only needs to hold by the time someone next looks at the attempt. Activation notes for real infra (a paid worker dyno, or an external cron hitting an internal endpoint) are left in the file as comments.

**Why**

`docs/04_database.md` and `docs/05_API_Blueprint.md`'s Test Engine design (§12-15, BR-026/027/028) is unambiguous that snapshot-pinning and submission auditing are load-bearing correctness requirements, not optional polish — without `QuestionVersion`, a mid-attempt admin edit to a question's correct answer would silently corrupt already-in-progress or already-scored attempts. Building Test Engine at all, per this session's explicit scope decision, means building on top of these two tables now rather than stubbing scoring against the live, editable `Question` table.

**Implementation notes**

* `QuestionVersion` rows are created lazily by `ensureCurrentQuestionVersion()` in `apps/api/src/services/test-attempt.service.ts` at paper-generation time, reused (not duplicated) if the live question is unchanged since the latest version via a JSON deep-equality check (`isSnapshotCurrent`, `apps/api/src/rules/question-version.rules.ts`).
* All scoring, result display, and pre-submission question rendering read exclusively from `QuestionVersion.snapshot` (`apps/api/src/rules/test-scoring.rules.ts`, `test-attempt.service.ts`'s DTO mappers) — never the live `Question`/`QuestionOption` tables — once an attempt has been generated.
* `AuditLog` gets its one `"TEST_SUBMITTED"` write inside the same `prisma.$transaction` as scoring/evaluation in `evaluateClaimedAttempt()`. No query/browsing endpoint exists yet; that's Phase 9 Admin Panel scope, consistent with BR-040/BR-041.
* Revisit `QuestionVersion`/`AuditLog` UI (admin diff view, audit log browser) when Phase 9 (Admin Panel) is built — this decision only narrows what "deferred to Phase 9" means, it doesn't reverse it.

**Status**

Approved

---

## BR-043

**Category**

Product / Architecture — Analytics (Phase 5)

**Decision**

Phase 5 (Analytics) builds the full documented system — 5 new pre-computed analytics tables (`StudentAnalytics`, `StudentSubjectAnalytics`, `StudentChapterAnalytics`, `StudentTopicAnalytics`, `StudentProgressSnapshot`, `docs/04_database.md` §16b-16f) and 6 read-only API modules (Analytics, Analytics Dashboard, Intelligence, Weakness Detection, Trend Engine, Recommendation Engine — `docs/05_API_Blueprint.md` Modules 13-18, ~35 endpoints) — rather than the roadmap's lean 6-bullet subset, matching the precedent set for Phase 4 (Test Engine). This narrowed several points the docs themselves leave unspecified or in conflict; all are recorded here as one entry, following BR-041/BR-042's pattern:

1. **FK target**: all 5 tables FK to `User.id`, not `StudentProfile.id` as literally listed in the docs — matches `TestAttempt.studentId`'s existing FK target, avoiding a second identifier scheme on every join.
2. **`onDelete` behavior**: all 5 `studentId` FKs use `Cascade`, not `Restrict` as literally listed in the docs — these tables are pure derived/computed caches (the sole writer fully recomputes them from `TestAttempt`/`StudentAnswer` on every run), so deleting a `User` should clean them up automatically rather than being blocked by them, matching `TestAttempt.studentId`'s existing `Cascade` behavior. (`subjectId`/`chapterId`/`topicId` FKs stay `Restrict`, consistent with the existing Question Bank/Test Engine reference-data pattern.)
3. **`averageTimePerQuestion`**: no per-question elapsed-time field exists anywhere in the schema (`AttemptQuestion` has none, `StudentAnswer.answeredAt` is a last-write timestamp, not elapsed time). Approximated as `attempt.timeTaken / questionsInAttempt`, evenly distributing whole-attempt time across its pinned questions — a known, documented approximation, not true per-question timing.
4. **`weaknessScore` name collision**: `StudentChapterAnalytics.weaknessScore` (DB column, `100 - accuracy`) and Module 16's response field of the same name (a 4-term weighted composite: `0.40×accuracyPenalty + 0.25×volumePenalty + 0.15×speedPenalty + 0.20×masteryPenalty`) are different values sharing one name in the source docs. The raw DB column is never exposed as `weaknessScore` in Module 16 responses — it's consumed only as the `masteryPenalty` input signal for chapters. Module 13's own `/analytics/chapters/:id` legitimately calls the DB column `weaknessScore` (1:1, no collision there).
5. **Rank data doesn't exist yet** (Leaderboard/RankSnapshot are Phase 6, not built): `StudentAnalytics.averageRank`/`bestRank` and `StudentProgressSnapshot.rank` stay `null`. One stub pair, `getCurrentRank()`/`getTotalStudents()` (`apps/api/src/repositories/rank.repository.ts`), returns `null` today with a Phase-6 pointer comment, mirroring the existing `// Phase 6 (Ranking) doesn't exist yet` comment in `test-attempt.service.ts`. Every rank-dependent endpoint degrades gracefully instead of erroring: `/trends/rank` always classifies `INSUFFICIENT_DATA`, Rank milestones always `achieved:false, value:null`, momentum's `rankTrendScore` defaults to neutral `50`, and rank-based forecasts/goals are always `null`.
6. **Module 14 route collision**: its documented `/dashboard/*` paths collide with the existing Phase 2 mount at `/api/v1/dashboard`. Mounted instead at `/api/v1/analytics-dashboard`, with files named `analytics-dashboard.*` throughout (never bare `dashboard.*`) to avoid import confusion with the Phase 2 files of the same short name. The existing Phase 2 dashboard (`dashboard.service.ts`/`dashboard.rules.ts`) is untouched — Analytics is purely additive.
7. **Momentum's accuracy/rank trend-score curves** (docs give threshold anchors only, no interpolation formula): linear and symmetric — `accuracyTrendScore = clamp(50 + delta×6.25, 0, 100)`, `rankTrendScore = clamp(50 − delta×3.33, 0, 100)` (defaults to `50` when rank is absent, per #5).
8. **Momentum's frequency/consistency scores** (docs give only a ceiling anchor): `frequencyScore = min(100, testsLast7Days/7×100)`, `consistencyScore = min(100, studyStreak/14×100)`.
9. **Forecast's daily-improvement rates** (referenced in docs but never derived): computed as the observed delta-per-day between the two-halves split already used for trend classification; only non-null when the classification is IMPROVING/RAPIDLY_IMPROVING.
10. **Recommendation `trendFactor`** (docs give only 2 of 5 anchor points — `IMPROVING=15`, `RAPIDLY_DECLINING=100`): filled in as `RAPIDLY_IMPROVING=0`, `STABLE=50`, `DECLINING=75`, `INSUFFICIENT_DATA=50`.
11. **Revision urgency's `volumeBonus`** (undefined in docs): a small capped term, `min(10, questionsSolved/50×10)`, so it can't dominate the accuracy/weakness terms.
12. **Rank trend's missing `INSUFFICIENT_DATA` row**: added for consistency with accuracy trend's own classifier (moot today since rank is always null per #5).
13. **Cursor pagination** (no existing pattern in the repo, and the leaderboard-style base64 `(rank,id)` cursor doesn't fit these taxonomy-bounded lists): in-memory — fetch the student's full scope (bounded by chapter/topic taxonomy size, not attempt volume), sort deterministically in the rules layer, slice with a shared `paginateByCursor()` helper (`apps/api/src/rules/pagination.rules.ts`). No raw SQL keyset pagination needed.
14. **PRACTICE vs RANKED inclusion**: analytics counts every `EVALUATED` attempt regardless of mode or retake — it measures learning volume, not competitive standing, so BR-036's Best-Attempt dedup does not apply here.
15. **`testsTaken` vs `testsCompleted`**: identical value (both = count of `EVALUATED` attempts) — Release 1 has no meaningful in-between state to distinguish them with.
16. **`StudentProgressSnapshot.studyPoints`**: redefined as cumulative `Σ TestAttempt.studyPointsEarned` (not a snapshot of `StudentProfile.studyPoints`, which has no historical ledger) — keeps it derivable purely from `TestAttempt`, so the writer stays a true idempotent recompute. Type `Int`, matching `studyPointsEarned`'s type (docs literally list `Float`).
17. **Per-attempt subject score** (undefined for multi-subject tests): `Σ marksAwarded` of that attempt's answers whose question resolves to the target subject via the pinned question hierarchy — correct regardless of test category.
18. **Snapshot grain**: cumulative-as-of-that-date (not single-day stats), recomputed for every distinct date the student has ever submitted on; `/analytics-dashboard/progress?interval=weekly|monthly` bucketing takes the last (max-date) snapshot per period, not an average.
19. **Module 17's `/trends/subjects` per-subject trend** (no per-subject-per-date time series exists in the schema — `StudentProgressSnapshot` is overall-only): reuses the account's overall accuracy trend classification for every subject, with `confidence` scaling by that subject's own practice volume — a lightly-practiced subject's trend reads as low-confidence rather than being fabricated per-subject history.

**Why**

`docs/04_database.md` and `docs/05_API_Blueprint.md`'s Analytics design is a large, internally cross-referencing system (Modules 13-18 all read from the same 5 tables, several formulas reference values — like `avgTime`, rank, or per-subject history — that the schema doesn't actually store at that grain). Building it at all, per this session's explicit full-scope decision, means resolving these gaps concretely rather than leaving `TODO`s or guessing silently during implementation.

**Implementation notes**

* The aggregation writer (`analytics.service.ts`'s `triggerAnalyticsUpdate(studentId)`, pure math in `apps/api/src/rules/analytics-aggregation.rules.ts`) is fire-and-forget, called right after `test-attempt.service.ts`'s `evaluateClaimedAttempt()` transaction commits — not inside it, since analytics tolerates lag per the docs' own pipeline (`Test Submission → Evaluation → Ranking → Analytics Aggregation → Dashboard Read`).
* Every module follows the established layered quartet (`repositories/` → `rules/` → `services/` → `controllers/` → `routes/` + `validators/`), with rules files composing across modules directly as pure functions (e.g. `recommendation.rules.ts` reuses `weakness.rules.ts`'s score functions and `intelligence.rules.ts`'s readiness formula) — no formula is duplicated.
* `apps/api/test/analytics.test.ts` covers the aggregation writer's correctness against known submitted attempts, one happy-path test per module, an empty-state test, a pagination test, and a rank-gap test — pragmatic coverage given the ~35-endpoint surface, not exhaustive per-endpoint testing.
* Revisit rank-dependent fields/endpoints (#5) once Phase 6 (Ranking) ships — activation is a one-file change in `rank.repository.ts`. Revisit the Module 14 dashboard integration (#6) as a deliberate, separate refactor if the existing Phase 2 dashboard should ever consume the new Recommendation Engine's `/recommendations/summary` instead of its own simple rule.

**Status**

Approved

---

## BR-044

**Category**

Product / Architecture — Ranking System (Phase 6 implementation)

**Decision**

Phase 6 implements the Sprint 6.1 read infrastructure (`Leaderboard`/`RankSnapshot` schema, the 5 frozen read endpoints) and the Sprint 6.2 calculation engine (BR-029 through BR-036) exactly as those already-approved decisions specify. Sprint 6.3+ (Redis leaderboard caching, period/cron leaderboards, historical movement/timeline endpoints, `/leaderboards/me`+`/top`+`/nearby`, CITY/FRIENDS/CUSTOM scopes) is explicitly deferred — each of those pieces is labeled a later sprint in `docs/05_API_Blueprint.md` Module 7/7B itself, so deferring them is following the existing plan, not cutting scope from it. This entry resolves the points BR-029 through BR-036 left as implementation-time judgment calls, and reverses one piece of this session's own earlier (pre-implementation) guidance now that the schema's actual shape is visible.

1. **`Test.rankingScope` cascades downward, it is not single-scope.** Earlier in this session, before any of BR-029 through BR-036 existed in this doc, a single-scope-only interpretation was recommended as a simplification. Implementing against the real `Leaderboard` schema (four simultaneous rank columns per student) and the real seed data (one shared test per class, no school-specific tests, no admin UI to create them) makes clear that single-scope would leave 3 of 4 Leaderboard columns permanently null for every student — a materially worse product outcome for no correctness benefit. Cascading (`INDIA` computes NATIONAL+STATE+DISTRICT+SCHOOL; `STATE` computes STATE+DISTRICT+SCHOOL; `DISTRICT` computes DISTRICT+SCHOOL; `SCHOOL` computes SCHOOL only) is the design actually implemented, in `resolveApplicableScopes()` (`apps/api/src/rules/ranking.rules.ts`).
2. **`RankSnapshot.testId` is populated on every Sprint 6.2 calculation**, not left null-until-6.3+ as `docs/04_database.md` §16a's evolution-path note reads in isolation — BR-033's own text ("Per-test scope: the student's rank among all students who ever completed the same specific test") already establishes this for MVP; this entry just makes the reconciliation explicit rather than leaving the two docs looking contradictory.
3. **Nullable `StudentProfile.schoolId`**: a student with no school on file gets `schoolRank`/`districtRank`/`stateRank` left `null` forever (only `indiaRank` populates, since NATIONAL never needs a school). None of BR-029 through BR-036 address this — the schema has always allowed a schoolless student, and Phase 6 has to decide what happens to them rather than crash or silently invent a scope.
4. **`rank.repository.ts` activation** (`getCurrentRank`/`getTotalStudents`, consumed by Modules 14/17/18 since Phase 5): now reads the student's NATIONAL/ALL_TIME `Leaderboard.indiaRank` and the latest published NATIONAL/ALL_TIME `RankSnapshot.totalStudents` — "rank" in those existing call sites means the PRD's Overall Platform Rank, the one scope every student has regardless of school. No other Phase 5 file changed; this is the one-file activation BR-043 already designed for.
5. **`CursorPage<T>` reused, not the API blueprint's literal `{limit, hasMore, nextCursor}` envelope** — `LeaderboardResponseData = CursorPage<LeaderboardEntry> & { totalStudents: number }`, matching every other cursor-paginated DTO already in `packages/shared` (analytics-dashboard, recommendation, weakness) rather than introducing a second, divergent pagination shape for one module.
6. **`studentId` FKs on `Leaderboard`/`RankSnapshot` target `User.id`**, not `StudentProfile` as the docs' prose literally says — matching every existing `studentId` FK in this schema (`TestAttempt`, all 5 Phase 5 Analytics tables), per the same reconciliation BR-043 already made for its own tables.
7. **StudentAnalytics.averageRank/bestRank stay unpopulated** — wiring a student's full rank history into the Analytics aggregation writer would require linking `RankSnapshot` rows back to individual attempts, which the roadmap's Phase 6 deliverable ("Ranking system operational": School/District/State/India Rank, Leaderboard, Rank History) doesn't ask for. `rank.repository.ts`'s activation (#4) already lights up the current-rank fields Modules 14/17/18 actually use; the two Analytics-table columns remain a Sprint 6.3+ item, same as they were under BR-043.

**Status**

Approved

---

## BR-045

**Category**

Product / Architecture — Gamification (Phase 7 implementation)

**Decision**

Phase 7 builds the lean MVP gamification system documented in
`docs/04_database.md` §17-19 (`Achievement`, `StudentAchievement`,
`StudyStreakHistory`) plus the pre-existing `StudentProfile` fields
(`studyPoints`, `studyLevel`, `studyStreak`, `longestStreak`,
`profileCompletion`) from Phase 0 — **not** the much larger documented
Sprint 8.1-8.6 system (`XpTransaction`/`StudentLevel`/`LevelDefinition`,
`CoinTransaction`/`StudentWallet`, `BadgeDefinition`/
`StudentAchievementProgress`, `MissionDefinition`/`StudentMission`,
`RewardDefinition`/`RewardClaim`). "Badges" and "Achievements" are one
concept here, matching PRD Ch6 §13's simple framing ("Study Points
unlock: Study Levels, Badges, Progress") — the roadmap's Phase 7 bullet
list (Study Points, Study Levels, Achievements, Badges, Study Streaks,
Daily Goals, Profile Completion Rewards, Milestones) matches this simple
model, not the transaction-ledger one. This mirrors Phase 6's precedent
of building the documented MVP subset, not the full sprint-numbered
system.

1. **Milestones is not rebuilt** — Phase 5's `/trends/milestones`
   (`evaluateMilestones`, `apps/api/src/rules/trend.rules.ts`) already
   covers all 12 documented milestones including `STREAK_7/14/30`. Those
   were permanently unachievable before this phase because nothing ever
   incremented `StudentProfile.studyStreak`; Phase 7 makes them real by
   making streak tracking real, not by building a new milestones feature.
2. **PRACTICE-mode submissions now earn Study Points.** Phase 4
   (Test Engine) gated Study Points credit to `test.mode === "RANKED"`
   only — an implementation choice never recorded as a BR, discovered
   while building this phase. BR-032 already establishes that Study
   Points and ranking are separate concerns; gating points to RANKED mode
   only discouraged practice, the opposite of the platform's stated
   mission (BR-025). This corrects that undocumented Phase 4 behavior
   rather than preserving it.
3. **Study Level has no persisted ledger or reference table.** Level is
   computed from `StudentProfile.studyPoints` via a pure function
   (`computeStudyLevel`, `apps/api/src/rules/gamification.rules.ts`)
   reusing docs §16g's exact cumulative curve
   (`xpRequired(n) = 25n(n+1) - 50`, capped at level 100) without
   building the Sprint 8.1 `XpTransaction`/`LevelDefinition` audit-ledger
   architecture — recomputed and persisted to `StudentProfile.studyLevel`
   atomically whenever `studyPoints` changes, same pattern as every other
   derived `StudentProfile` field.
4. **Study Points sources**: registration (+50, once), profile completion
   (+50, once, folded into `PROFILE_COMPLETE`'s achievement reward),
   correct answers (+10 each, all modes per #2), test completion (+5
   flat, all modes), and each achievement's own `studyPointsReward` on
   unlock. This satisfies PRD Ch6 §13's five listed sources
   (Registration, Profile Completion, Completing Tests, Correct Answers,
   Achievements) without inventing new ones.
5. **`profileCompletion` formula, given no profile-edit endpoint exists
   yet** (out of Phase 7 scope — a pre-existing gap, not something this
   phase introduces): 70% base (the always-present registration fields)
   + 30% if `schoolId` was provided at registration. 100% is reachable
   today by registering with a school; `profileImage` isn't part of the
   formula since nothing anywhere can set it yet. Revisit once a profile
   edit flow exists.
6. **Achievement catalogue** is a lean, self-contained 10-item starter set
   (`ACHIEVEMENT_DEFINITIONS`), not the full Sprint 8.3 badge catalogue —
   one achievement per category (PROFILE/TESTS/ACCURACY/STREAK/
   STUDY_POINTS/RANK), reusing round thresholds from the documented
   badge/milestone lists where they already existed (`STREAK_7/30`,
   `RANK_TOP_100`, `ACCURACY_90`) so they stay consistent with Phase 5's
   milestones. Seeded by code in `prisma/seed.ts`, matching BR-041's
   seed-script-as-content-authoring precedent — no admin CRUD endpoint
   for achievements exists (there's nothing to author; the catalogue is
   fixed).
7. **Backend only this pass** — no gamification frontend page, matching
   how Phase 4/5/6 shipped backend first. `studyPoints`/`studyLevel`/
   `studyStreak` already surface through existing dashboard/profile
   widgets from Phase 1/2, so those come alive with real data immediately
   without new frontend work; the new `GET /achievements` and
   `GET /streak` reads are available for a future dedicated page.

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
| 1.1     | BR-037 (email+password auth override for Release 1 build), BR-038 (Release 1 MVP build sequencing) added. |
| 1.2     | BR-039 (localStorage JWT storage, Phase 2), BR-040 (simple admin role check in place of the full Admin JWT audience system, Phase 3), BR-041 (Question Bank content authoring: seed script + minimal admin CRUD in place of the Phase 9 review workflow) added. |
| 1.3     | BR-042 (Test Engine, Phase 4: minimal `QuestionVersion` + `AuditLog` tables added now rather than fully deferred to Phase 9, `StudentAnswer.markedForReview` added, background auto-submit sweeper implemented but left disabled on this infra in favor of a lazy check-on-read) added. |
| 1.4     | BR-043 (Analytics, Phase 5: full documented system built — 5 pre-computed tables + 6 API modules; FK target/onDelete, weaknessScore name collision, rank-data-doesn't-exist-yet, Module 14 route collision, and several unspecified formula curves all resolved) added. |
| 1.5     | BR-044 (Ranking, Phase 6: Sprint 6.1 read infrastructure + Sprint 6.2 calculation engine built per BR-029 through BR-036, Sprint 6.3+ deferred; cascading rankingScope, testId population, nullable-schoolId handling, rank.repository.ts activation, CursorPage reuse, and FK target all resolved) added. |
| 1.6     | BR-045 (Gamification, Phase 7: lean MVP system per docs/04_database.md §17-19 built, the larger Sprint 8.1-8.6 XP/Coin/Mission/Reward ledger system deferred; Milestones reuse from Phase 5, PRACTICE-mode Study Points gate removed, level formula without a persisted ledger, Study Points sources, profileCompletion formula, achievement catalogue, and backend-only scoping all resolved) added. |

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
