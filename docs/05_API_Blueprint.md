# Board Ranking API Blueprint v1.0

Version: 1.0

Status: Active

Owner: Backend Team

Purpose:

This document defines every API used in Board Ranking.

Every API must follow this document.

No API should be created without documentation.

---

# API Standards

Base URL

/api/v1/

Example

/api/v1/auth/login

---

Authentication

Public APIs

No JWT Required

Protected APIs

JWT Required

Admin APIs

Admin JWT Required

---

Standard Response

Success

{
    success: true,
    message: "",
    data: {}
}

Error

{
    success: false,
    message: "",
    errors: []
}

---

Status Codes

200 OK

201 Created

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

500 Internal Server Error

---

# MODULE 1

Authentication

Purpose

Register and Login Users.

Routes

POST

/auth/send-otp

Public

Purpose

Send OTP

Uses

Users Table

Validation

Valid Indian Mobile Number

Rate Limit

5 Requests / Hour

---

POST

/auth/verify-otp

Public

Purpose

Verify OTP

Business Logic

Create User if not exists.

Generate JWT.

Return User.

---

GET

/auth/me

Protected

Purpose

Return Logged In User

Uses

Users

StudentProfile

---

POST

/auth/logout

Protected

Purpose

Logout User

---

# MODULE 2

Student Profile

GET

/profile

Protected

Purpose

Fetch Student Profile

Uses

Users

StudentProfile

---

PUT

/profile

Protected

Purpose

Update Student Profile

Validation

Name

Class

School

Business Logic

Update Profile Completion.

Award Study Points if profile milestone reached.

---

GET

/profile/progress

Protected

Purpose

Return Profile Completion

---

# MODULE 3

Dashboard

GET

/dashboard

Protected

Purpose

Load Dashboard

Tables

Users

StudentProfile

Leaderboard

RecentAttempts

Response

Name

Study Points

Study Level

Study Streak

Today's Goal

Recent Tests

Recommended Test

Rank

---

# MODULE 4

Subjects

GET

/subjects

Public

Return All Subjects

---

GET

/subjects/:id

Public

Subject Details

---

# MODULE 5

Chapters

GET

/chapters

Public

Return Chapters

Filter

Class

Subject

---

# MODULE 6

Tests

GET

/tests

Public

Return Tests

Filters

Class

Subject

Chapter

Difficulty

---

GET

/tests/:id

Protected

Purpose

Return Test Information

---

POST

/tests/start

Protected

Purpose

Start Test

Business Logic

Create TestAttempt

Return Questions

---

POST

/tests/submit

Protected

Purpose

Submit Test

Business Logic

Check Answers

Calculate Marks

Calculate Percentage

Calculate Accuracy

Calculate Study Points

Update Level

Update Streak

Update Rank

Store Attempt

Generate Analytics

Return Result

This API NEVER trusts frontend score.

---

# MODULE 7

Leaderboard (implemented — Sprint 6.1 read infrastructure + Sprint 6.3.1 read APIs)

## Endpoints

**Sprint 6.1 (frozen):**

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/leaderboards` | Protected | Metadata: scopes, periods, current academic year |
| GET | `/leaderboards/:scope` | Protected | NATIONAL leaderboard (other scopes → 400, need scopeId) |
| GET | `/leaderboards/:scope/:scopeId` | Protected | Primary scoped leaderboard (cursor-paginated) |
| GET | `/students/:studentId/ranks` | Protected | A student's current ranks across all scopes |
| GET | `/students/:studentId/rank-history` | Protected (owner/admin) | Immutable historical snapshots |

**Sprint 6.3.1:**

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/leaderboards/me` | Protected | My rank + percentile + XP + representative attempt (BR-036) |
| GET | `/leaderboards/top` | Protected | Top 10 / 50 / 100 for a scope; filters: class, board, academicYear, testId |
| GET | `/leaderboards/nearby` | Protected | Rank window around me (default 5 above + 5 below, max 10) |

Scopes: `SCHOOL · DISTRICT · STATE · NATIONAL` (6.3.1 endpoints reject CITY/FRIENDS/CUSTOM until calculation support exists).

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin, no logic)
    → leaderboard.service (scope/pagination validation, authorization, DTO mapping)
      → leaderboard.repository (SELECT only)
        → Prisma → PostgreSQL
```

## Repository responsibilities

`leaderboard.repository.ts` is strictly READ-ONLY — no insert/update/delete path exists. Methods: `findLeaderboard` (cursor-paginated cache read), `findTopStudents` (delegates to findLeaderboard), `findStudentRank` (unique cache row), `findNearbyStudents` (bounded rank-range scan), `countLeaderboardEntries`, plus snapshot/attempt lookups (`findLatestSnapshotForScope`, `findRepresentativeAttempt`, `findTestLeaderboardPage`). The Sprint 6.2 ranking engine is the only writer of Leaderboard and RankSnapshot; read APIs can never trigger recalculation.

## Cursor pagination strategy

Keyset cursors only — never OFFSET, never page numbers. The cursor is an opaque base64 token encoding the last `(rank, id)` pair. The next page filters `rank > cursor.rank OR (rank = cursor.rank AND id > cursor.id)` — an O(log N) index seek regardless of depth, stable under concurrent cache rewrites. Every ORDER BY ends with `id ASC` for full determinism. Responses carry `{ limit, hasMore, nextCursor }`.

## Why cached leaderboards

Ranking is expensive (multi-field tuple comparison across all attempts of a test — BR-032). The Sprint 6.2 engine pays that cost once at submission time and materialises results into the `Leaderboard` cache (one row per student, indexed rank columns). Read endpoints become single-table indexed queries: top-N = first page of the rank index, nearby = bounded range scan, my-rank = unique-key lookup. No aggregation at request time; recalculation is structurally impossible from the read path.

## Filters & future compatibility

Filters are individual optional query params (`academicYear`, `board`, `class`, `testId`). Future filters (subjectId, chapterId, topicId) are added as new optional params — additive, non-breaking. `testId` switches the data source to RankSnapshot (latest published ALL_TIME snapshot per student for that test) because the cache is deliberately not per-test (BR-029). `academicYear` must be the current year — historical years are served by `/rank-history`.

## Redis caching layer (Sprint 6.3.4)

All leaderboard GET endpoints are transparently cached via Redis (ioredis). PostgreSQL remains the source of truth; Redis is an optimization layer.

**Architecture:**
```
Client GET → cache.middleware (Redis check)
  → HIT:  return cached JSON (X-Cache: HIT header)
  → MISS: controller → service → repository → PostgreSQL
          ↓ intercept res.json() → populate Redis with TTL
```

**Key design:** deterministic, human-readable: `br:lb:{route}:{scope}:{scopeId}:{extras…}`. The `br:` prefix isolates Board Ranking keys. Personal endpoints (/me, /nearby) include the userId.

**TTLs:** top 60s · my-rank 30s · nearby 30s · period leaderboards 120s · historical data 300s · period metadata 300s. TTL-based expiry is the safety net; targeted invalidation runs after ranking events.

**Invalidation:** `invalidateScopeCache(scope, scopeId)` after ranking calculations; `invalidatePeriodCache(periodStr)` after period generation; `invalidateStudentCache(studentId)` after a student's rank changes. All use SCAN-based pattern matching (never KEYS).

**Warm-up:** `warmUpEntry(target, responseBody, ttl)` preloads top-10/50/100 for each scope after ranking events. Cron/event-only — never exposed via HTTP.

**Fallback:** every Redis operation catches errors and returns null. When Redis is unavailable, the middleware is a transparent no-op — all requests proceed to PostgreSQL. The API never fails because Redis is offline.

**Observability:** in-memory counters (hits, misses, fallbacks, invalidations, warmUps, latencies, hitRatio) exposed via `GET /health/detailed`. Response headers: `X-Cache: HIT|MISS`, `X-Cache-Latency-Ms`.

**Performance targets:** cached response <50ms, uncached response <100ms, cache hit ratio >90% (after warm-up). Logged warnings when targets exceeded.

**Health:** `GET /api/v1/health/detailed` — database connectivity + latency, Redis connectivity + latency, cache metrics snapshot. Unauthenticated (infra probes). No secrets exposed.

**Configuration:** `REDIS_URL` env var (optional). When absent, caching is disabled entirely — graceful degradation to PostgreSQL-only mode.

**Files:**
| File | Purpose |
|---|---|
| `config/redis.ts` | ioredis singleton, graceful connect/disconnect, health check |
| `types/cache.types.ts` | Key params, metrics snapshot, health view, warm-up target |
| `constants/cache.constants.ts` | TTLs, key prefixes, performance budgets |
| `utils/cache-metrics.util.ts` | In-memory hit/miss/fallback/latency counters |
| `repositories/cache.repository.ts` | Low-level get/set/del/pattern-invalidate with fallback |
| `services/cache.service.ts` | Invalidation, warm-up, health, TTL lookup |
| `middleware/cache.middleware.ts` | Express response-level caching middleware |

## Historical leaderboards & rank movement (Sprint 6.3.2)

**Endpoints:**

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/leaderboards/history` | Protected | Leaderboard as it existed at `asOf` (filters: scope, scopeId, academicYear, class, board, testId) |
| GET | `/leaderboards/history/top` | Protected | Historical top 10 / 50 / 100 |
| GET | `/leaderboards/history/me` | Protected (self) | My snapshot history + historical representative attempts |
| GET | `/leaderboards/history/me/movement` | Protected (self) | UP / DOWN / UNCHANGED vs previous snapshot |
| GET | `/leaderboards/history/me/timeline` | Protected (self) | Chronological rank evolution (Jan → Feb → Mar …) |

**Source-of-truth doctrine:** `RankSnapshot` is the immutable append-only history — every ranked submission adds rows; rows are never updated or deleted. `Leaderboard` is the mutable current-state cache and is **never consulted** by history endpoints. Only `isPublished = true` snapshots are served, so unpublished calculation output cannot be enumerated.

**Rank movement calculation:** compares the two most recent consecutive published snapshots in the same `(scope, scopeId)` bucket. Lower rank number = better: previous 27 → current 14 ⇒ `UP`, amount 13; reversed ⇒ `DOWN`; equal ⇒ `UNCHANGED`, amount 0. Fewer than two snapshots ⇒ `movement: null` (no comparison fabricated).

**Historical API flow:** Route (authenticate + Zod) → Controller → history.service (movement derivation, percentile arithmetic, DTO mapping) → history.repository (SELECT on RankSnapshot only) → Prisma. Percentile is arithmetic on stored values `((totalStudents − rank + 1) / totalStudents) × 100` — never a recalculation.

**Historical leaderboard design:** "as of T" = each student's latest published snapshot with `computedAt ≤ T`, selected via `DISTINCT ON (studentId) ORDER BY computedAt DESC, rankingVersion DESC` in parameterised raw SQL, ordered by rank with a `(rank, studentId)` keyset cursor. class/board filters join `student_profiles`/`schools` directly, so all filters combine freely (unlike the 6.3.1 cache path). Historical representative attempts use a `LEFT JOIN LATERAL` picking the best attempt (BR-036 order) with `submittedAt ≤ computedAt` — one query, no N+1.

**Validation:** future timestamps rejected (60s skew allowance); `from ≤ to` enforced; academic year format-checked; scope restricted to the four calculated scopes; cursors decoded defensively (400 on garbage); limits bounded (1–100; top tiers 10/50/100).

## DTO discipline

Leaderboard entries expose only: rank, studentId, studentName, class, profileImage, studyPoints (XP display, not the ranking metric — BR-032), schoolName (STATE/NATIONAL only). NEVER exposed: email, phone, tokens, passwords, device ids, audit metadata. Representative-attempt details (score/percentage/accuracy) are returned only to their owner via `/leaderboards/me`.

---

# MODULE 7B

Period Leaderboards (Sprint 6.3.3 — period-based read APIs + cron generation)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/leaderboards/periods` | Protected | Current period metadata: resolved strings, windows, academic year |
| GET | `/leaderboards/periods/me` | Protected | My rank + percentile + XP for a specific period label |
| GET | `/leaderboards/periods/history` | Protected (self) | My period rank history (newest first) |
| GET | `/leaderboards/weekly` | Protected | Current week leaderboard (cursor-paginated) |
| GET | `/leaderboards/monthly` | Protected | Current month leaderboard (cursor-paginated) |
| GET | `/leaderboards/yearly` | Protected | Current academic year leaderboard (cursor-paginated) |

Period labels: `WEEKLY · MONTHLY · YEARLY` (ALL_TIME served by Module 7 Sprint 6.3.1 endpoints).

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin, no logic)
    → period.service (window resolution, scope validation, DTO mapping)
      → period.repository (SELECT on RankSnapshot only; generation inserts are cron-only)
        → Prisma → PostgreSQL
```

## Period strings

| Label | Example resolved string | Window |
|---|---|---|
| WEEKLY | `WEEKLY_2026_W28` | Monday 00:00 UTC → following Monday 00:00 UTC |
| MONTHLY | `MONTHLY_2026_07` | 1st of month 00:00 UTC → 1st of next month 00:00 UTC |
| YEARLY | `YEARLY_2026-27` | 1 Apr 00:00 UTC → 1 Apr (next year) 00:00 UTC (India academic year) |

## Snapshot generation (cron-only)

`generatePeriodSnapshots(label, scope, scopeId, academicYear?)` in `period.service.ts` is the sole writer of period RankSnapshot rows. It is never callable from HTTP handlers.

**Ranking algorithm**: reuses BR-032 deterministic order — `percentage DESC → totalMarks DESC → accuracy DESC → submittedAt ASC → studentId ASC` — via a SQL `RANK() OVER (…)` window function applied to a `DISTINCT ON (studentId)` best-attempt CTE (BR-036). No second ranking algorithm.

**Idempotency**: if a published snapshot batch already exists for `(scope, scopeId, periodStr, rankingVersion=1)`, the generation run is a no-op. Safe to call the cron multiple times per period window.

**Empty leaderboard**: when no snapshots have been generated yet for the current period window, read endpoints return `{ entries: [], totalStudents: 0 }` — a 200 with an empty payload, not a 404.

---

# MODULE 13

Student Analytics (Sprint 7.1 — pre-computed analytics infrastructure)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/analytics/overview` | Protected (self) | Student's overall analytics: tests taken, accuracy, average/best scores, rank, study time |
| GET | `/analytics/subjects` | Protected (self) | All subjects the student has analytics for (accuracy desc) |
| GET | `/analytics/subjects/:subjectId` | Protected (self) | Single subject analytics detail |
| GET | `/analytics/chapters/:chapterId` | Protected (self) | Chapter analytics detail (includes weakness score) |
| GET | `/analytics/topics/:topicId` | Protected (self) | Topic analytics detail (includes mastery score) |
| GET | `/analytics/progress` | Protected (self) | Time-series progress snapshots for charting |

All endpoints are self-scoped — `studentId` comes from the JWT. No endpoint accepts a `studentId` from the client. Raw attempt data is never exposed.

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin, no logic)
    → analytics.service (DTO mapping, resolves studentId from JWT)
      → analytics.repository (reads from pre-computed analytics tables only)
        → Prisma → PostgreSQL
```

## Analytics pipeline (write path)

```
Test Submission → Evaluation → Ranking → Analytics Aggregation → Dashboard Read
```

`triggerAnalyticsUpdate(studentId)` in `analytics.service.ts` is the sole writer. It runs fire-and-forget after each evaluated attempt (never during GET requests). Full recompute of ALL evaluated attempts — idempotent, self-correcting, no incremental deltas.

## Pre-computed tables

| Table | Grain | Key metric |
|---|---|---|
| `StudentAnalytics` | One row per student | testsTaken, accuracy, averageScore, bestRank, totalStudyTime |
| `StudentSubjectAnalytics` | One row per (student, subject) | accuracy, bestScore, averageScore, averageTimePerQuestion |
| `StudentChapterAnalytics` | One row per (student, chapter) | weaknessScore (100 - accuracy; higher = weaker) |
| `StudentTopicAnalytics` | One row per (student, topic) | masteryScore (accuracy × min(1, questionsSolved/10)) |
| `StudentProgressSnapshot` | One row per (student, date) | rank, accuracy, averageScore, studyPoints, testsTaken |

## Query parameters

### GET /analytics/progress

| Param | Type | Default | Notes |
|---|---|---|---|
| `from` | `YYYY-MM-DD` | — | Optional start date |
| `to` | `YYYY-MM-DD` | — | Optional end date; `from` must not be after `to` |
| `limit` | `1–365` | `90` | Max snapshots returned |

## Empty state

When a student has no evaluated attempts, `GET /analytics/overview` returns a zeroed-out object (all counts 0, ranks null). Other endpoints return 404 when no analytics exist for the requested entity.

---

# MODULE 14

Student Performance Dashboard (Sprint 7.2 — read-only dashboard APIs)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/dashboard/overview` | Protected (self) | Full overview: rank, percentile, accuracy, scores, study points, level, streak |
| GET | `/dashboard/subjects` | Protected (self) | All subjects sorted by display order |
| GET | `/dashboard/chapters` | Protected (self) | Chapters sorted by weakness/strength (cursor-paginated) |
| GET | `/dashboard/topics` | Protected (self) | Topics sorted by mastery (cursor-paginated) |
| GET | `/dashboard/progress` | Protected (self) | Time-series snapshots with daily/weekly/monthly interval aggregation |
| GET | `/dashboard/strengths` | Protected (self) | Top subjects, chapters, topics by accuracy/mastery |
| GET | `/dashboard/weaknesses` | Protected (self) | Weakest subjects, chapters, topics by accuracy/weakness score |
| GET | `/dashboard/summary` | Protected (self) | Lightweight homepage card: rank, accuracy, today's progress, best/weakest subject |

All endpoints are self-scoped — `studentId` comes from the JWT. Read-only: never writes to any table. Never reads from TestAttempt or StudentAnswer.

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin, no logic)
    → dashboard.service (DTO composition from multiple analytics tables)
      → dashboard.repository (read-only queries against analytics + supporting tables)
        → Prisma → PostgreSQL
```

## Data sources

| Table | Used by |
|---|---|
| `StudentAnalytics` | overview, summary |
| `StudentSubjectAnalytics` | subjects, strengths, weaknesses, summary |
| `StudentChapterAnalytics` | chapters, strengths, weaknesses |
| `StudentTopicAnalytics` | topics, strengths, weaknesses |
| `StudentProgressSnapshot` | progress, summary (today/week) |
| `StudentProfile` | overview (studyPoints, studyLevel, studyStreak), summary |
| `Leaderboard` | overview (currentRank), summary |
| `RankSnapshot` | overview (totalStudents for percentile) |

## Query parameters

### GET /dashboard/chapters

| Param | Type | Default | Notes |
|---|---|---|---|
| `sort` | `weakest` or `strongest` | `weakest` | Sort direction |
| `limit` | `1–50` | `10` | Page size |
| `cursor` | UUID | — | Cursor for next page |

### GET /dashboard/topics

| Param | Type | Default | Notes |
|---|---|---|---|
| `sort` | `strongest` or `weakest` | `strongest` | Sort direction |
| `limit` | `1–50` | `10` | Page size |
| `cursor` | UUID | — | Cursor for next page |

### GET /dashboard/progress

| Param | Type | Default | Notes |
|---|---|---|---|
| `from` | `YYYY-MM-DD` | — | Optional start date |
| `to` | `YYYY-MM-DD` | — | Optional end date; `from` must not be after `to` |
| `interval` | `daily`, `weekly`, `monthly` | `daily` | Aggregation interval |
| `limit` | `1–365` | `90` | Max raw snapshots fetched (pre-aggregation) |

### GET /dashboard/strengths and /dashboard/weaknesses

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–20` | `5` | Items per category (subjects, chapters, topics) |

## Mastery status thresholds

| Score range | Status |
|---|---|
| 80–100 | `MASTERED` |
| 60–79 | `PROFICIENT` |
| 40–59 | `DEVELOPING` |
| 0–39 | `NEEDS_WORK` |

## Empty state

When a student has no evaluated attempts, all endpoints return zeroed-out/empty responses (not 404). `GET /dashboard/summary` returns a `recommendedNextAction` placeholder suggesting the student take their first test.

## Future integration points

- AI-powered recommendations (replace placeholder `recommendedNextAction` with model output)
- Teacher/parent dashboard views (separate endpoints, not extensions of student dashboard)
- Real-time WebSocket updates for live progress tracking

---

# MODULE 15

Subject, Chapter & Topic Intelligence (Sprint 7.3 — deterministic classification layer)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/intelligence/mastery` | Protected (self) | Mastery classification for every subject, chapter, topic |
| GET | `/intelligence/readiness` | Protected (self) | Readiness score (0–100) overall and per-subject |
| GET | `/intelligence/improvement` | Protected (self) | Improvement trend detection and per-entity ranking |
| GET | `/intelligence/consistency` | Protected (self) | Temporal and cross-entity consistency analysis |
| GET | `/intelligence/difficulty` | Protected (self) | Personalized difficulty classification per entity |
| GET | `/intelligence/learning-patterns` | Protected (self) | Speed-accuracy profile, practice frequency, insights |

All endpoints are self-scoped, read-only, and deterministic. No AI, no ML, no randomness.

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin, no logic)
    → intelligence.service (deterministic algorithms)
      → intelligence.repository (read-only queries against analytics tables)
        → Prisma → PostgreSQL
```

## Intelligence algorithms

### Mastery classification

| Level | Thresholds |
|---|---|
| `MASTER` | accuracy >= 85 AND questionsSolved >= 10 |
| `PROFICIENT` | accuracy >= 65 AND questionsSolved >= 5 |
| `DEVELOPING` | accuracy >= 40 AND questionsSolved >= 1 |
| `BEGINNER` | everything else |

### Readiness formula (overall)

```
readiness = (accuracy × 0.4) + (volumeScore × 0.3) + (recencyScore × 0.2) + (consistencyBonus × 0.1)

volumeScore      = min(100, questionsSolved / 20 × 100)
recencyScore     = clamp(100 − daysSinceLastTest × 2, 0, 100)
consistencyBonus = 100 if CV < 0.15, 50 if CV < 0.30, else 0
```

### Readiness formula (per-subject)

```
readiness = (accuracy × 0.5) + (volumeScore × 0.3) + (speedScore × 0.2)

volumeScore = min(100, questionsSolved / 15 × 100)
speedScore  = clamp(100 − (avgTime − 30) × 0.8, 0, 100)
```

### Improvement detection

- **Overall trend**: split progress snapshots into two halves, compare average accuracy. Delta > 2 = IMPROVING, < −2 = DECLINING, else STABLE. Minimum 4 snapshots required.
- **Per-subject**: improvement indicator = `(bestScore − averageScore) / averageScore × 100`. Higher = more improvement signal.
- **Per-chapter**: entities ranked by accuracy relative to overall accuracy.
- **Per-topic**: entities ranked by mastery score.

### Consistency formula (CV = coefficient of variation)

| CV range | Classification |
|---|---|
| CV < 0.10 | `VERY_CONSISTENT` |
| CV < 0.20 | `CONSISTENT` |
| CV < 0.35 | `VARIABLE` |
| CV >= 0.35 | `HIGHLY_VARIABLE` |
| < 3 data points | `INSUFFICIENT_DATA` |

Four dimensions: temporal (accuracy over time from snapshots), cross-subject, cross-chapter, cross-topic (accuracy variance across entities).

### Difficulty classification (personalized)

| Student's accuracy + speed | Classification |
|---|---|
| accuracy >= 80 AND avgTime <= 60s | `EASY` |
| accuracy >= 60 OR (>= 50 AND avgTime <= 90s) | `MODERATE` |
| accuracy >= 35 | `CHALLENGING` |
| accuracy < 35 | `DIFFICULT` |

Confidence level = `min(100, questionsSolved / 20 × 100)`. Per-question-difficulty breakdowns require analytics pipeline extension (future).

### Learning pattern classification

| avgTime + accuracy | Pattern |
|---|---|
| < 30s AND < 50% | `FAST_INACCURATE` |
| > 90s AND >= 70% | `SLOW_ACCURATE` |
| <= 60s AND >= 75% | `EFFICIENT` |
| > 90s AND < 50% | `STRUGGLING` |
| everything else | `BALANCED` |

Practice frequency: DEDICATED (>= 100 questions), MODERATE (>= 30), LIGHT (>= 10), MINIMAL (< 10).

## Query parameters

### GET /intelligence/mastery and /intelligence/difficulty

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–50` | `20` | Max entities per category |

### GET /intelligence/improvement

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–20` | `5` | Items per improvement/decline category |

## Future AI integration points

- Replace deterministic pattern detection with ML-based models trained on student cohort data
- AI-powered readiness prediction using historical performance patterns
- Natural language insight generation (LLM-based explanations)
- Predictive difficulty estimation using collaborative filtering

---

# MODULE 16

Weakness Detection Engine (Sprint 7.4 — deterministic weakness scoring + revision queue)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/weakness/overview` | Protected (self) | Summary: distribution, top 5 weaknesses, total revision estimate |
| GET | `/weakness/subjects` | Protected (self) | All subject weaknesses with priority + reasons |
| GET | `/weakness/chapters` | Protected (self) | Chapter weaknesses (cursor-paginated, weakest first) |
| GET | `/weakness/topics` | Protected (self) | Topic weaknesses (cursor-paginated, weakest first) |
| GET | `/weakness/revision-plan` | Protected (self) | Ordered revision queue (HIGH + CRITICAL only) |
| GET | `/weakness/priority-queue` | Protected (self) | Full priority queue (all levels, cursor-paginated) |

All endpoints are self-scoped, read-only, deterministic. Every recommendation includes explainable reasons.

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin)
    → weakness.service (orchestration)
      → weakness.rules (pure deterministic scoring + classification)
      → weakness.repository (read-only from analytics tables)
        → Prisma → PostgreSQL
```

## Weakness score formula

```
weaknessScore = (0.40 × accuracyPenalty)
             + (0.25 × volumePenalty)
             + (0.15 × speedPenalty)
             + (0.20 × masteryPenalty)
```

| Penalty | Formula | Range |
|---|---|---|
| `accuracyPenalty` | `100 - accuracy` | 0–100 |
| `volumePenalty` | `max(0, 100 - questionsSolved / 15 × 100)` | 0–100 |
| `speedPenalty` | `clamp((avgTime - 45) × 1.5, 0, 100)` | 0–100 |
| `masteryPenalty` | Entity-specific (see below) | 0–100 |

Mastery penalty per entity type:
- **Subject**: `100 - (averageScore / bestScore × 100)` — gap between peak and average
- **Chapter**: stored `weaknessScore` (= 100 - accuracy, from Sprint 7.1)
- **Topic**: `100 - masteryScore` (from Sprint 7.1)

## Priority thresholds

| Score range | Level | Estimated study time |
|---|---|---|
| >= 80 | `CRITICAL` | 150 minutes |
| >= 60 | `HIGH` | 90 minutes |
| >= 40 | `MEDIUM` | 45 minutes |
| >= 20 | `LOW` | 20 minutes |
| < 20 | `VERY_LOW` | 10 minutes |

## Reason generation

Each weakness includes all applicable reasons (penalty > 20% of max), sorted by contribution weight:

| Code | Trigger |
|---|---|
| `LOW_ACCURACY` | accuracy below 80% (penalty > 20) |
| `LOW_VOLUME` | fewer than 12 questions solved |
| `SLOW_SOLVING` | avgTime > 58s (penalty > 20) |
| `LOW_MASTERY` | mastery penalty > 20 |
| `DECLINING_PERFORMANCE` | accuracy < 40% AND 10+ attempts |

## Knowledge gap analysis

Each entity includes: currentLevel (MASTER/PROFICIENT/DEVELOPING/BEGINNER), targetLevel (next up), gapScore (accuracy needed), requiredImprovement (human-readable).

## Revision plan algorithm

1. Score ALL entities (subjects, chapters, topics) using the weakness formula
2. Filter to HIGH + CRITICAL priority only
3. Sort by weakness score descending (most urgent first)
4. Return top N items with position, estimated time, and reasons

## Query parameters

### GET /weakness/chapters and /weakness/topics

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–50` | `10` | Page size |
| `cursor` | UUID | — | Cursor for next page |

### GET /weakness/revision-plan

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–30` | `10` | Max items in plan |

### GET /weakness/priority-queue

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–50` | `10` | Page size |
| `cursor` | UUID | — | Cursor for next page |

## Future AI integration points

- ML-based weakness prediction (predict future weaknesses before they manifest)
- Adaptive scheduling (calendar integration for revision sessions)
- Natural language reason generation (LLM explanations)
- Peer comparison (how this student's weaknesses compare to cohort)

---

# MODULE 17

Progress & Trend Engine (Sprint 7.5 — deterministic trend classification, momentum, milestones, forecasting)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/trends/overview` | Protected (self) | Multi-metric trend summary with momentum + period info |
| GET | `/trends/accuracy` | Protected (self) | Accuracy trend with data points + moving average |
| GET | `/trends/rank` | Protected (self) | Rank trend with best/worst/average rank |
| GET | `/trends/speed` | Protected (self) | Speed analysis across subjects |
| GET | `/trends/study-time` | Protected (self) | Study frequency + session analysis |
| GET | `/trends/subjects` | Protected (self) | Per-subject trend classification + confidence |
| GET | `/trends/milestones` | Protected (self) | Achievement milestones (12 rules) |
| GET | `/trends/momentum` | Protected (self) | Momentum score + factors breakdown + forecast |

All endpoints are self-scoped, read-only, deterministic. No AI/ML.

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin)
    → trend.service (orchestration)
      → trend.rules (pure deterministic formulas)
      → trend.repository (read-only from analytics tables)
        → Prisma → PostgreSQL
```

## Trend classification thresholds

### Accuracy trend (delta = recent avg - older avg)

| Delta | Classification |
|---|---|
| > +8 | `RAPIDLY_IMPROVING` |
| > +3 | `IMPROVING` |
| -3 to +3 | `STABLE` |
| < -3 | `DECLINING` |
| < -8 | `RAPIDLY_DECLINING` |
| < 4 data points | `INSUFFICIENT_DATA` |

### Rank trend (inverted — lower rank is better)

| Delta | Classification |
|---|---|
| < -15 | `RAPIDLY_IMPROVING` |
| < -5 | `IMPROVING` |
| -5 to +5 | `STABLE` |
| > +5 | `DECLINING` |
| > +15 | `RAPIDLY_DECLINING` |

## Momentum formula

```
momentum = (0.35 × accuracyTrendScore)
         + (0.25 × rankTrendScore)
         + (0.25 × frequencyScore)
         + (0.15 × consistencyScore)
```

| Factor | Computation |
|---|---|
| `accuracyTrendScore` | Maps accuracy delta to 0–100 via thresholds |
| `rankTrendScore` | Maps rank delta (inverted) to 0–100 via thresholds |
| `frequencyScore` | Maps tests-last-7-days to 0–100 (7+ = 100) |
| `consistencyScore` | Maps studyStreak to 0–100 (14+ = 100) |

### Momentum levels

| Score | Level |
|---|---|
| >= 80 | `SURGING` |
| >= 60 | `STRONG` |
| >= 40 | `MODERATE` |
| >= 20 | `LOW` |
| < 20 | `STALLED` |

## Milestone rules

12 predefined milestones across categories:

- Accuracy: 90%+ highest, 95%+ highest
- Rank: Top 100, Top 50, Top 10
- Volume: 100+ questions, 500+ questions, 50+ tests, 200+ tests
- Streak: 7-day, 14-day, 30-day

Each milestone returns: code, title, achieved (boolean), achievedDate, value.

## Forecast algorithm

Rule-based extrapolation:
- **Days to next mastery**: `(90 - currentAccuracy) / dailyImprovementRate`
- **Days to target rank**: `currentRank × 0.1 / dailyRankImprovement`

Returns `null` when trend is STABLE/DECLINING/INSUFFICIENT_DATA (no positive projection).

## Query parameters

### GET /trends/overview, /trends/accuracy, /trends/rank, /trends/study-time

| Param | Type | Default | Notes |
|---|---|---|---|
| `from` | `YYYY-MM-DD` | — | Start date filter (inclusive) |
| `to` | `YYYY-MM-DD` | — | End date filter (inclusive) |

Refinement: `to` must be after `from` when both provided.

## Data source

All endpoints read ONLY from pre-computed tables:
- `StudentAnalytics` — overall stats
- `StudentSubjectAnalytics` — per-subject data
- `StudentProgressSnapshot` — temporal data
- `StudentProfile` — streaks
- `Leaderboard` — current rank

Never reads from TestAttempt, AttemptQuestion, or StudentAnswer.

---

# MODULE 18

Study Recommendation Engine (Sprint 7.6 — deterministic, explainable study recommendations)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/recommendations/today` | Protected (self) | Daily study plan (ordered, time-bounded) |
| GET | `/recommendations/week` | Protected (self) | Weekly plan distributed across 7 days |
| GET | `/recommendations/chapters` | Protected (self) | Chapter recommendations (cursor-paginated) |
| GET | `/recommendations/topics` | Protected (self) | Topic recommendations (cursor-paginated) |
| GET | `/recommendations/practice` | Protected (self) | Practice type suggestions (tests, MCQs, mocks) |
| GET | `/recommendations/revision` | Protected (self) | Revision priority queue (cursor-paginated) |
| GET | `/recommendations/goals` | Protected (self) | Short/medium/long-term goals |
| GET | `/recommendations/summary` | Protected (self) | Lightweight homepage summary widget |

All endpoints are self-scoped, read-only, deterministic. Every recommendation includes explainable reasoning.

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin)
    → recommendation.service (orchestration)
      → recommendation.rules (pure deterministic scoring + classification)
      → recommendation.repository (read-only from analytics tables)
        → Prisma → PostgreSQL
```

## Recommendation score formula

```
recommendationScore = (0.30 × weaknessFactor)
                    + (0.20 × trendFactor)
                    + (0.15 × readinessFactor)
                    + (0.15 × masteryGapFactor)
                    + (0.10 × frequencyFactor)
                    + (0.10 × consistencyFactor)
```

| Factor | Derivation | Range |
|---|---|---|
| `weaknessFactor` | From Sprint 7.4 weakness score (100 - accuracy) | 0–100 |
| `trendFactor` | Trend classification → score (RAPIDLY_DECLINING=100, IMPROVING=15) | 0–100 |
| `readinessFactor` | Inverted readiness (100 - readinessScore) | 0–100 |
| `masteryGapFactor` | Gap to 85% mastery threshold, scaled to 0–100 | 0–100 |
| `frequencyFactor` | Inverse of practice volume (15 questions = fully practiced) | 0–100 |
| `consistencyFactor` | Inverse of attempt count (5 attempts = consistent) | 0–100 |

## Recommendation types

| Type | Trigger |
|---|---|
| `WEAKNESS_RECOVERY` | weaknessScore >= 60 |
| `DECLINING_RECOVERY` | trend is DECLINING or RAPIDLY_DECLINING |
| `MASTERY_PUSH` | mastery 60-84% (near threshold) |
| `PRACTICE_GAP` | questionsSolved < 10 |
| `REVISION` | previously practiced, accuracy < 70% or weakness >= 40 |
| `STRENGTH_MAINTENANCE` | weakness < 20 and mastery >= 85 |

## Priority classification

| Score range | Level | Estimated study time |
|---|---|---|
| >= 80 | `CRITICAL` | 60 minutes |
| >= 60 | `HIGH` | 45 minutes |
| >= 40 | `MEDIUM` | 30 minutes |
| >= 20 | `LOW` | 20 minutes |
| < 20 | `VERY_LOW` | 10 minutes |

## Daily scheduling rules

- Maximum 120 minutes per day
- Maximum 5 items per day
- At most 60% of time on weakness recovery
- At least 15% on revision
- Items ordered by recommendation score descending

## Weekly scheduling rules

| Day | Theme | Focus types |
|---|---|---|
| MON | Weakness Recovery | WEAKNESS_RECOVERY, DECLINING_RECOVERY |
| TUE | Balanced Practice | PRACTICE_GAP, MASTERY_PUSH |
| WED | Weakness Recovery | WEAKNESS_RECOVERY, DECLINING_RECOVERY |
| THU | Mixed Practice | MASTERY_PUSH, PRACTICE_GAP, REVISION |
| FRI | Revision Day | REVISION, STRENGTH_MAINTENANCE |
| SAT | Deep Practice | WEAKNESS_RECOVERY, PRACTICE_GAP, MASTERY_PUSH |
| SUN | Light Review | REVISION, STRENGTH_MAINTENANCE, MASTERY_PUSH |

Algorithm: themed assignment first (match item type to day's focus), then round-robin remaining items to underfilled days.

## Goal generation rules

| Timeframe | Duration | Example goals |
|---|---|---|
| SHORT_TERM | 1-7 days | +5% accuracy, 50 more questions, 7-day streak |
| MEDIUM_TERM | 1-4 weeks | +15% accuracy, rank improvement, master N topics, 14-day streak |
| LONG_TERM | 1-3 months | 95% accuracy, top 10 rank, 500 questions, 30-day streak |

Each goal includes: target, currentValue, requiredImprovement, estimatedDaysToComplete, confidence (0-100), explanation.

## Revision rules

An area needs revision if:
- accuracy < 70% AND questionsSolved >= 5 (previously practiced)
- OR weaknessScore >= 40 AND attempts >= 3

Revision urgency: `min(100, accuracyDeficit × 0.6 + weaknessScore × 0.3 + volumeBonus)`

## Practice recommendation rules

| Condition | Recommendation |
|---|---|
| 3+ weak chapters | Chapter Test |
| 2+ weak subjects | Subject Test |
| Overall accuracy < 70% | Mixed Practice |
| 5+ tests taken, 50+ questions | Mock Test |
| 20+ questions solved | Speed Drill |
| Always | Revision Practice |

## Explainability guarantees

Every recommendation includes:
- `reason`: primary explanation sentence
- `contributingFactors[]`: each with code, message, weight, value
- `expectedBenefit`: predicted improvement outcome
- `suggestedActivity` + `suggestedQuantity`: actionable next step

## Query parameters

### GET /recommendations/today

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–10` | `5` | Max items in daily plan |

### GET /recommendations/week

| Param | Type | Default | Notes |
|---|---|---|---|
| `maxPerDay` | `1–8` | `4` | Max items per day |

### GET /recommendations/chapters and /topics

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–50` | `10` | Page size |
| `cursor` | UUID | — | Cursor for next page |

### GET /recommendations/practice

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–10` | `5` | Max practice suggestions |

### GET /recommendations/revision

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–30` | `10` | Page size |
| `cursor` | UUID | — | Cursor for next page |

### GET /recommendations/goals

| Param | Type | Default | Notes |
|---|---|---|---|
| `timeframe` | enum | — | Filter: SHORT_TERM, MEDIUM_TERM, LONG_TERM |

## Data source

All endpoints read ONLY from pre-computed tables:
- `StudentAnalytics` — overall stats
- `StudentSubjectAnalytics` — per-subject data
- `StudentChapterAnalytics` — per-chapter data
- `StudentTopicAnalytics` — per-topic data
- `StudentProgressSnapshot` — temporal data
- `StudentProfile` — streaks
- `Leaderboard` — current rank

Never reads from TestAttempt, AttemptQuestion, or StudentAnswer.

## Future AI integration points

- ML-powered recommendation scoring (learn from completion/improvement patterns)
- Adaptive scheduling (adjust based on student's actual completion rates)
- Natural language explanations via LLM
- Calendar integration (sync with school timetable)
- Social recommendations (what peers are studying)
- Notification triggers (push reminders for scheduled items)

---

# MODULE 19

XP & Level Engine (Sprint 8.1 — deterministic XP progression, immutable transactions, auditable)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/xp/profile` | Protected (self) | Current XP, level, title, progress, rank |
| GET | `/xp/history` | Protected (self) | Transaction history (cursor-paginated) |
| GET | `/xp/levels` | Protected (self) | Level definitions (formula-generated, 1-100) |
| GET | `/xp/progress` | Protected (self) | Detailed progress: recent XP, daily avg, top sources, ETA |
| GET | `/xp/leaderboard` | Protected (self) | XP-based leaderboard (cursor-paginated) |

All read endpoints are self-scoped. XP awards happen via internal service calls from other modules.

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin)
    → xp.service (orchestration + awardXp write)
      → xp.rules (pure deterministic formulas + XP amounts)
      → xp.repository (read/write XpTransaction + StudentLevel)
        → Prisma → PostgreSQL
```

## XP sources and amounts

| Source | XP | Trigger |
|---|---|---|
| REGISTRATION | 25 | First-time student registration |
| DAILY_LOGIN | 5 | Daily login (once per day) |
| DAILY_STUDY_GOAL | 15 | Daily study goal completion |
| TEST_CHAPTER | 10 | Chapter test completion |
| TEST_SUBJECT | 20 | Subject test completion |
| TEST_MOCK | 40 | Mock test completion |
| PERFECT_SCORE | 50 | 100% on any test |
| RANK_TOP_100 | 100 | First time reaching Top 100 |
| RANK_TOP_50 | 150 | First time reaching Top 50 |
| RANK_TOP_10 | 250 | First time reaching Top 10 |
| RANK_TOP_3 | 400 | First time reaching Top 3 |
| RANK_1 | 500 | First time reaching Rank 1 |
| STREAK_7 | 75 | Maintaining 7-day study streak |
| STREAK_30 | 200 | Maintaining 30-day study streak |
| RECOMMENDATION_COMPLETED | 10 | Completing a study recommendation |
| MILESTONE_ACHIEVED | 30 | Achieving a study milestone |

## Level progression formula

```
xpRequired(n) = 25 × n × (n + 1) − 50    for n ≥ 2
xpRequired(1) = 0
```

XP increment per level: `increment(n) = 50 × n`

| Level | XP Required | Title |
|---|---|---|
| 1 | 0 | Beginner |
| 2 | 100 | Beginner |
| 5 | 700 | Beginner |
| 10 | 2,700 | Learner |
| 20 | 10,450 | Practitioner |
| 50 | 63,700 | Expert |
| 100 | 252,450 | Legend |

### Title brackets

| Levels | Title |
|---|---|
| 1-5 | Beginner |
| 6-10 | Learner |
| 11-15 | Explorer |
| 16-20 | Practitioner |
| 21-30 | Achiever |
| 31-40 | Scholar |
| 41-50 | Expert |
| 51-60 | Specialist |
| 61-70 | Master |
| 71-80 | Virtuoso |
| 81-90 | Champion |
| 91-100 | Legend |

## Deduplication

Unique constraint: `(studentId, source, referenceId)`

| Source type | referenceId value |
|---|---|
| One-time (registration, rank) | `"ONCE"` |
| Daily (login, study goal) | Date string `"2026-07-19"` |
| Per-event (test completion) | Attempt ID |
| Per-milestone | Milestone code |

Service performs a friendly pre-check before DB constraint fires.

## Immutability guarantees

- XP transactions are NEVER updated or deleted
- Every change creates a new row with previousXp → newXp audit trail
- Current XP persisted in StudentLevel (never computed from transactions)
- Transactions remain as audit history

## Query parameters

### GET /xp/history

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–50` | `20` | Page size |
| `cursor` | UUID | — | Cursor for next page |
| `source` | string | — | Filter by XP source code |

### GET /xp/levels

| Param | Type | Default | Notes |
|---|---|---|---|
| `from` | `1–100` | `1` | Start level |
| `to` | `1–100` | `100` | End level |

### GET /xp/leaderboard

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–50` | `20` | Page size |
| `cursor` | UUID | — | Cursor for next page |

## Database tables

### XpTransaction (append-only)
- `id`, `studentId`, `source`, `reason`, `xpAwarded`, `previousXp`, `newXp`, `referenceId`, `createdAt`
- Unique: `(studentId, source, referenceId)`

### StudentLevel (persisted state)
- `id`, `studentId` (unique), `currentXp`, `currentLevel`, `xpToNext`, `totalXpForNext`, `createdAt`, `updatedAt`

### LevelDefinition (reference)
- `level` (PK), `xpRequired`, `title`

## Future integration points

- Coins / virtual currency (exchange XP for coins)
- Badges / achievements tied to XP milestones
- XP boosts (2× XP events, streak multipliers)
- Teacher-awarded bonus XP
- XP decay for inactivity (future consideration)
- Seasonal leaderboard resets

---

# MODULE 20

Coins & Economy Engine (Sprint 8.2 — deterministic virtual economy, immutable transactions)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/coins/wallet` | Protected (self) | Balance, lifetime earned/spent, rank, last earned |
| GET | `/coins/history` | Protected (self) | Transaction history (cursor-paginated, filterable) |
| GET | `/coins/sources` | Protected (self) | Earning breakdown by source |
| GET | `/coins/spending` | Protected (self) | Spending breakdown by sink |
| GET | `/coins/leaderboard` | Protected (self) | Coin leaderboard (by lifetime earned) |

All read endpoints are self-scoped. Earn/spend happens via internal service calls.

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin)
    → coin.service (orchestration + earnCoins/spendCoins write)
      → coin.rules (amounts, descriptions, spend validation)
      → coin.repository (read/write CoinTransaction + StudentWallet)
        → Prisma → PostgreSQL
```

## Coin earning amounts

| Source | Coins | Trigger |
|---|---|---|
| REGISTRATION | 100 | First-time registration |
| DAILY_LOGIN | 20 | Daily login (once per day) |
| DAILY_STUDY_GOAL | 30 | Daily study goal completion |
| TEST_CHAPTER | 15 | Chapter test completion |
| TEST_SUBJECT | 30 | Subject test completion |
| TEST_MOCK | 60 | Mock test completion |
| PERFECT_SCORE | 100 | 100% on any test |
| RANK_TOP_100 | 200 | First time reaching Top 100 |
| RANK_TOP_50 | 300 | First time reaching Top 50 |
| RANK_TOP_10 | 500 | First time reaching Top 10 |
| RANK_TOP_3 | 750 | First time reaching Top 3 |
| RANK_1 | 1000 | First time reaching Rank 1 |
| STREAK_7 | 150 | 7-day study streak |
| STREAK_30 | 400 | 30-day study streak |
| BADGE_UNLOCK | 75 | Badge unlocked |
| ACHIEVEMENT_UNLOCK | 50 | Achievement unlocked |
| SPECIAL_EVENT | 200 | Special event participation |
| REFERRAL | 500 | Referral (future) |
| RECOMMENDATION_COMPLETED | 20 | Completed a recommendation |

## Coin sinks (spending categories)

| Sink | Description |
|---|---|
| AVATAR_ITEM | Avatar customization |
| THEME | UI theme purchase |
| PROFILE_FRAME | Profile frame |
| NAME_COLOR | Name color change |
| MARKETPLACE_ITEM | Future marketplace |
| STORE_ITEM | Future store |
| ENTRY_TICKET | Future entry tickets |
| COSMETIC | Future cosmetics |

## Wallet rules

- Balance may NEVER become negative
- All deductions validate balance first (400 if insufficient)
- Every balance change creates an immutable CoinTransaction
- Balance persisted in StudentWallet (never computed from transactions)

## Deduplication

Unique constraint: `(studentId, type, source, referenceId)`

Same pattern as XP engine (Sprint 8.1). Service performs friendly pre-check.

## Query parameters

### GET /coins/history

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–50` | `20` | Page size |
| `cursor` | UUID | — | Cursor for next page |
| `type` | `EARN\|SPEND` | — | Filter by transaction type |
| `source` | string | — | Filter by source/sink code |

### GET /coins/leaderboard

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–50` | `20` | Page size |
| `cursor` | UUID | — | Cursor for next page |

## Database tables

### CoinTransaction (append-only)
- `id`, `studentId`, `type` (EARN/SPEND), `source`, `reason`, `amount`, `previousBalance`, `newBalance`, `referenceId`, `createdAt`
- Unique: `(studentId, type, source, referenceId)`

### StudentWallet (persisted state)
- `id`, `studentId` (unique), `currentBalance`, `lifetimeEarned`, `lifetimeSpent`, `createdAt`, `updatedAt`

## Fraud prevention

- No public write endpoints — coins only change through internal service
- Unique constraint prevents duplicate awards
- Balance validated before every spend
- Transaction audit trail (immutable, never updated/deleted)
- Amount determined by rules engine — never from client input

## Future marketplace integration

- Item catalog model (future sprint)
- Purchase flow: validate balance → create transaction → grant item
- Refund flow: reverse transaction → credit balance
- Gifting between students (future consideration)
- Seasonal sales / discounts

---

# MODULE 21

Badges & Achievement Engine (Sprint 8.3 — deterministic badge unlocks, achievement progress tracking)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/badges` | Protected (self) | All badge definitions with earned status |
| GET | `/badges/earned` | Protected (self) | Earned badges only (cursor-paginated) |
| GET | `/badges/progress` | Protected (self) | Achievement progress bars |
| GET | `/badges/categories` | Protected (self) | Badges grouped by category with stats |
| GET | `/badges/:code` | Protected (self) | Single badge detail + earned status |

All read endpoints are self-scoped. Badge unlocks happen via internal `checkAndUnlockBadges()` call.

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin)
    → badge.service (orchestration + unlock evaluation)
      → badge.rules (unlock conditions, seed definitions)
      → badge.repository (read/write StudentBadge + StudentAchievementProgress)
        → Prisma → PostgreSQL
    → xp.service (awardXp on badge unlock)
    → coin.service (earnCoins on badge unlock)
```

## Badge categories

| Category | Description |
|---|---|
| PERFORMANCE | Accuracy-based badges |
| RANKING | National rank position badges |
| CONSISTENCY | Study streak badges |
| PARTICIPATION | Tests taken, questions solved |
| MASTERY | Study Points milestones |
| SPEED | Speed/time-based (future) |
| PRACTICE | Questions solved milestones |
| MILESTONES | XP/Level milestones |
| SPECIAL | Admin-granted, surprise badges |

## Badge tiers

BRONZE → SILVER → GOLD → PLATINUM → DIAMOND

## Unlock logic

All badge conditions evaluated in `badge.rules.ts` (`UNLOCK_RULES` map). Each rule is a pure function over `BadgeAnalyticsSnapshot` (pre-computed analytics — never raw attempts). `checkAndUnlockBadges(studentId, source, referenceId)` is called after:
- Attempt evaluation
- Streak update
- Rank recalculation

## Idempotency

Unique constraint: `(studentId, badgeCode)` on `student_badges`.

Service performs friendly pre-check before insert. Same badge can never be awarded twice.

## Rewards on unlock

- XP: via `awardXp({ source: 'MILESTONE_ACHIEVED', referenceId: 'BADGE_<code>' })`
- Coins: via `earnCoins({ source: 'BADGE_UNLOCK', referenceId: 'BADGE_<code>' })`

Both internally deduplicated by their own unique constraints.

## Achievement progress

`AchievementDefinition` records define progress-tracked milestones (incremental, numeric). `StudentAchievementProgress` stores current progress vs. target for each student. Updated on every `checkAndUnlockBadges` call.

## Query parameters

### GET /badges

| Param | Type | Default | Notes |
|---|---|---|---|
| `category` | enum | — | Filter by badge category |
| `tier` | `BRONZE\|SILVER\|GOLD\|PLATINUM\|DIAMOND` | — | Filter by tier |

### GET /badges/earned

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–100` | `20` | Page size |
| `cursor` | UUID | — | Cursor for next page |
| `category` | enum | — | Filter by category |

### GET /badges/progress

| Param | Type | Default | Notes |
|---|---|---|---|
| `category` | enum | — | Filter by category |
| `completed` | `true\|false` | — | Filter completed/pending |

## Database tables

### BadgeDefinition (seed data)
- `code` (PK), `name`, `description`, `category`, `tier`, `icon`, `unlockRule`, `xpReward`, `coinReward`, `isVisible`

### StudentBadge (append-only)
- `id`, `studentId`, `badgeCode` (FK), `unlockedAt`, `source`, `referenceId`
- Unique: `(studentId, badgeCode)`

### AchievementDefinition (seed data)
- `code` (PK), `name`, `description`, `metric`, `target`, `category`, `xpReward`, `coinReward`

### StudentAchievementProgress (upserted)
- `id`, `studentId`, `achievementCode` (FK), `currentProgress`, `target`, `completed`, `completedAt`, `updatedAt`
- Unique: `(studentId, achievementCode)`

---

# MODULE 22

Daily Missions & Streak Engine (Sprint 8.4 — deterministic engagement, lazy assignment, persisted streaks)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/missions/today` | Protected (self) | Today's daily missions with progress |
| GET | `/missions/week` | Protected (self) | This week's challenges with progress |
| GET | `/missions/streaks` | Protected (self) | All streak types with current/longest |
| GET | `/missions/history` | Protected (self) | Completed/expired mission history (cursor-paginated) |
| GET | `/missions/summary` | Protected (self) | Aggregate stats: completion rate, total XP/coins, streaks |

All read endpoints are self-scoped. Mission completion occurs only through internal `updateMissionProgress()` calls triggered by other engines.

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin)
    → mission.service (lazy assignment + reads)
      → mission.rules (period dates, streak math, progress compute)
      → mission.repository (CRUD for StudentMission, MissionProgress, StudentStreak)
        → Prisma → PostgreSQL
    → xp.service (awardXp on mission complete)
    → coin.service (earnCoins on mission complete)
    → badge.service (checkAndUnlockBadges after mission complete)
```

## Mission assignment

Assignment is **lazy** — missions are created for the student on the **first read** of each period:
- `GET /missions/today` triggers `assignMissions(studentId, 'DAILY', todayDate)`
- `GET /missions/week` triggers `assignMissions(studentId, 'WEEKLY', mondayDate)`

`upsertStudentMission` is idempotent — the `@@unique([studentId, missionCode, assignedDate])` constraint prevents duplicates. All active `MissionDefinition` rows for the type are assigned.

## Period dates

| Type | assignedDate | Reset time |
|---|---|---|
| DAILY | Current UTC date (00:00 UTC) | 00:00 UTC daily |
| WEEKLY | Monday of current UTC week | Monday 00:00 UTC |

## Mission categories

| Category | Description |
|---|---|
| DAILY | Daily engagement missions |
| WEEKLY | Weekly challenge missions |
| PRACTICE | Tests and questions |
| REVISION | Study recommendations |
| ACCURACY | Score-based missions |
| SPEED | Time-based (future) |
| CONSISTENCY | Streak maintenance |
| RANKING | Rank-based (future) |
| ENGAGEMENT | Login and XP |

## Mission difficulty

EASY → MEDIUM → HARD → EPIC

## Metric types

| Metric | Aggregation | Event that fires it |
|---|---|---|
| `DAILY_LOGIN` | counter | Login event |
| `CHAPTER_TESTS_COMPLETED` | counter | Chapter test evaluated |
| `SUBJECT_TESTS_COMPLETED` | counter | Subject test evaluated |
| `TESTS_COMPLETED` | counter | Any test evaluated |
| `QUESTIONS_SOLVED` | counter | Answers saved/evaluated |
| `STUDY_MINUTES` | counter | Test time (seconds/60) |
| `ACCURACY_HIT_80` | threshold | Test score ≥ 80% |
| `ACCURACY_HIT_90` | threshold | Test score ≥ 90% |
| `RECOMMENDATIONS_COMPLETED` | counter | Recommendation marked done |
| `XP_EARNED` | counter | XP awarded |
| `STREAK_LOGIN` | absolute | Current LOGIN streak value |

**counter** — `currentProgress += value`; **threshold** — sets target if met; **absolute** — `max(current, value)`

## Completion flow

1. `updateMissionProgress(studentId, metric, value)` is called by other engines
2. For each ACTIVE mission matching the metric in the current period:
   - `newProgress = computeNewProgress(metric, current, target, value)`
   - If `newProgress >= target`: call `completeMissionAndAward`
3. `completeMissionAndAward` sequence:
   - `markMissionCompleted` (sets status = COMPLETED, completedAt = now)
   - `awardXp({ source: MILESTONE_ACHIEVED, referenceId: MISSION_<id> })`
   - `earnCoins({ source: BADGE_UNLOCK, referenceId: MISSION_<id> })`
   - `markMissionClaimed` (sets claimed = true)
   - `checkAndUnlockBadges` (fire-and-forget)

## Idempotency

- `StudentMission.claimed` flag: once true, rewards are not re-issued
- XP dedup: `@@unique([studentId, source, referenceId])` where `referenceId = MISSION_<id>`
- Coin dedup: same pattern
- Mission assignment: `@@unique([studentId, missionCode, assignedDate])`

## Streak rules

1. `lastActivityDate == today` → no change (already counted)
2. `lastActivityDate == yesterday` → `currentStreak + 1`
3. Gap ≥ 2 days or first activity → reset to 1

`longestStreak = max(longestStreak, newCurrentStreak)` on every update.

## Streak types

| Type | Qualifying event |
|---|---|
| LOGIN | User logs in |
| STUDY | Test attempt evaluated |
| TEST | Any test completed |
| RECOMMENDATION | Recommendation completed |
| REVISION | Revision session completed (future) |

## History preservation

Old `StudentMission` rows are **never deleted**. ACTIVE missions from prior periods are marked `EXPIRED` lazily when new daily missions are assigned (`expireOldMissions` call in `getToday`).

Status values: `ACTIVE` → `COMPLETED` or `EXPIRED`

## Query parameters

### GET /missions/history

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–100` | `20` | Page size |
| `cursor` | UUID | — | Cursor for next page |
| `type` | `DAILY\|WEEKLY` | — | Filter by mission type |
| `category` | enum | — | Filter by category |
| `status` | `ACTIVE\|COMPLETED\|EXPIRED` | — | Filter (default: COMPLETED + EXPIRED) |

## Database tables

### MissionDefinition (seed data)
- `code` (PK), `name`, `description`, `missionType`, `category`, `difficulty`, `metric`, `target`, `xpReward`, `coinReward`, `resetFrequency`, `isActive`
- Index: `(missionType, isActive)` — fast lookup on assignment

### StudentMission (one per student per mission per period)
- `id`, `studentId`, `missionCode`, `assignedDate` (@db.Date), `status`, `claimed`, `completedAt`, `createdAt`, `updatedAt`
- Unique: `(studentId, missionCode, assignedDate)` — idempotent assignment
- Index: `(studentId, assignedDate)` — period reads
- Index: `(studentId, status)` — active mission filter

### MissionProgress (1:1 with StudentMission)
- `id`, `studentMissionId` (unique), `currentProgress`, `target`, `updatedAt`

### StudentStreak (one per student per streak type)
- `id`, `studentId`, `streakType`, `currentStreak`, `longestStreak`, `lastActivityDate` (@db.Date), `createdAt`, `updatedAt`
- Unique: `(studentId, streakType)` — one row per type per student
- Never computed from raw history — always persisted on activity

## Seeded missions

**Daily (12):** DAILY_LOGIN, DAILY_1_CHAPTER_TEST, DAILY_2_TESTS, DAILY_3_TESTS, DAILY_25_QUESTIONS, DAILY_50_QUESTIONS, DAILY_100_QUESTIONS, DAILY_STUDY_30_MIN, DAILY_STUDY_60_MIN, DAILY_ACCURACY_80, DAILY_ACCURACY_90, DAILY_RECOMMENDATION, DAILY_LOGIN_STREAK_7

**Weekly (10):** WEEKLY_10_TESTS, WEEKLY_5_TESTS, WEEKLY_300_QUESTIONS, WEEKLY_100_QUESTIONS, WEEKLY_500_XP, WEEKLY_1000_XP, WEEKLY_5_RECOMMENDATIONS, WEEKLY_7_DAY_STREAK, WEEKLY_ACCURACY_80

## Future scope

- Seasonal / event missions (`isActive = false` until event starts)
- Guild / group missions (requires group model)
- Mission editor admin panel
- Push notification on mission completion
- Difficulty scaling per student class/level

---

# MODULE 23

Rewards & Claim System (Sprint 8.5 — centralized reward orchestration, atomic claims, idempotent flow)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/rewards/pending` | Protected (self) | Paginated AVAILABLE rewards with aggregate XP/coin totals |
| GET | `/rewards/history` | Protected (self) | Paginated CLAIMED + EXPIRED reward history |
| GET | `/rewards/catalog` | Public | All active reward definitions |
| POST | `/rewards/claim-all` | Protected (self) | Claim all available rewards in one call |
| POST | `/rewards/:id/claim` | Protected (self) | Claim a single reward by ID |

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin)
    → reward.service (read, claim, create)
      → reward.rules (definitions, validateClaim, resolveAmounts, computeExpiresAt)
      → reward.repository (CRUD for RewardDefinition, StudentReward, RewardClaim)
        → Prisma → PostgreSQL (atomic $transaction for claim commit)
    → xp.service (awardXp before commit — idempotent)
    → coin.service (earnCoins before commit — idempotent)
```

## Reward lifecycle

```
[internal createStudentReward] → AVAILABLE → [claim] → CLAIMED
                                          ↘ [expiresAt < now] → EXPIRED
```

- Status is stored on `StudentReward.status` — never computed from history
- `expireStudentRewards(studentId, now)` runs lazily before each read or claim-all

## Claim flow (idempotency guarantee)

1. Load reward; verify ownership
2. `validateClaim(reward)` → reject if CLAIMED, EXPIRED, or not AVAILABLE
3. `awardXp({ referenceId: REWARD_<id>_XP })` — engine-level dedup; no-op on retry
4. `earnCoins({ referenceId: REWARD_<id>_COINS })` — engine-level dedup; no-op on retry
5. `prisma.$transaction([rewardClaim.create, studentReward.update])` — atomic commit

If step 5 fails and the student retries, steps 3–4 are no-ops and step 5 succeeds.

## Per-instance amount override

`StudentReward.xpAmount` and `coinAmount` override the `RewardDefinition` defaults when set. `resolveAmounts(defXp, defCoins, instanceXp, instanceCoins)` applies `instanceOverride ?? definitionDefault`.

## Query parameters

### GET /rewards/pending

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–100` | `20` | Page size |
| `cursor` | UUID | — | Cursor for next page |
| `type` | enum | — | Filter by reward type |
| `source` | enum | — | Filter by source |

### GET /rewards/history

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–100` | `20` | Page size |
| `cursor` | UUID | — | Cursor for next page |
| `status` | `AVAILABLE\|CLAIMED\|EXPIRED` | — | Filter (default: CLAIMED + EXPIRED) |
| `type` | enum | — | Filter by reward type |
| `source` | enum | — | Filter by source |

### POST /rewards/claim-all (body, optional)

| Field | Type | Notes |
|---|---|---|
| `type` | enum | Claim only rewards of this type |
| `source` | enum | Claim only rewards from this source |

## Reward types

| Type | Description |
|---|---|
| XP | XP award |
| COINS | Coin award |
| BADGE | Badge unlock |
| BUNDLE | XP + Coins together |
| AVATAR | Avatar item (future) |
| THEME | UI theme (future) |
| PROFILE_FRAME | Profile frame (future) |
| TITLE | Title (future) |
| COUPON | Coupon (future) |
| COSMETIC | Cosmetic item (future) |

## Reward sources

MISSION · BADGE_UNLOCK · ACHIEVEMENT · STREAK · SPECIAL_EVENT · ADMIN · REFERRAL · TOURNAMENT

## Claim methods

| Method | Trigger |
|---|---|
| MANUAL | Student explicitly claims one reward |
| CLAIM_ALL | Student uses claim-all endpoint |
| AUTO | System auto-claims on certain events (future) |

## Idempotency

- `StudentReward` unique: `(studentId, rewardCode, sourceReference)` — one reward per event
- XP dedup: `@@unique([studentId, source, referenceId])` where `referenceId = REWARD_<id>_XP`
- Coin dedup: same pattern with `REWARD_<id>_COINS`
- `RewardClaim` is 1:1 with `StudentReward` — impossible to claim twice

## Database tables

### RewardDefinition (seed data)
- `code` (PK), `name`, `description`, `rewardType`, `source`, `xpAmount`, `coinAmount`, `badgeCode` (nullable, no FK), `itemCode`, `isClaimable`, `expiresAfterDays`, `isActive`
- Index: `(rewardType, isActive)`, `(source, isActive)`

### StudentReward (one per student per reward event)
- `id`, `studentId`, `rewardCode` (FK), `status`, `sourceReference`, `earnedAt`, `expiresAt`, `xpAmount` (override), `coinAmount` (override)
- Unique: `(studentId, rewardCode, sourceReference)` — idempotent creation
- Index: `(studentId, status)`, `(studentId, earnedAt)`

### RewardClaim (append-only — one per claimed StudentReward)
- `id`, `studentRewardId` (unique), `claimedAt`, `claimMethod`, `previousState`, `newState`

## Seeded definitions

**Mission:** MISSION_BUNDLE_SMALL (10 XP + 15 coins, 7d), MISSION_BUNDLE_MEDIUM (25 + 30, 7d), MISSION_BUNDLE_HARD (50 + 60, 7d), MISSION_BUNDLE_EPIC (100 + 100, 7d), WEEKLY_CHALLENGE_REWARD (100 + 150, 14d)

**Badge:** BADGE_REWARD_BRONZE (25 XP + 10c), BADGE_REWARD_SILVER (75 + 30), BADGE_REWARD_GOLD (150 + 75), BADGE_REWARD_PLATINUM (300 + 150), BADGE_REWARD_DIAMOND (500 + 250)

**Achievement:** ACHIEVEMENT_REWARD_SMALL (50 + 25), ACHIEVEMENT_REWARD_LARGE (200 + 100)

**Streak:** STREAK_BONUS_7 (75 + 50, 3d), STREAK_BONUS_30 (300 + 200, 3d), STREAK_BONUS_100 (1000 + 500, 3d)

**Special Events:** SPECIAL_WELCOME (25 + 100, 30d), SPECIAL_EVENT_SMALL (100 + 75, 7d), SPECIAL_EVENT_LARGE (500 + 300, 7d)

**Admin:** ADMIN_GRANT_STANDARD (100 + 100, 30d)

**Referral:** REFERRAL_BONUS (200 + 100, 14d)

**Inactive (future cosmetics):** AVATAR_UNLOCK, PROFILE_FRAME_UNLOCK

## Future scope

- Push notification on reward earned
- Tournament reward type (TOURNAMENT source)
- Admin panel to issue ad-hoc rewards
- Cosmetic item delivery (AVATAR, THEME, PROFILE_FRAME, TITLE)

# MODULE 24

Gamification Dashboard APIs (Sprint 8.6 — BFF aggregation, read-only)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/gamification/dashboard` | Protected (self) | Complete gamification dashboard |
| GET | `/gamification/profile` | Protected (self) | Player profile card |
| GET | `/gamification/progress` | Protected (self) | XP, badge, mission progression |
| GET | `/gamification/activity` | Protected (self) | Recent gamification events feed |
| GET | `/gamification/summary` | Protected (self) | Homepage widget payload |

All endpoints are self-scoped. No writes occur. No raw attempt tables are scanned.

## Architecture

```
Route (authenticate + Zod validate)
  → Controller (thin)
    → gamification.service (aggregate + map to view)
      → gamification.repository (batched Prisma queries via Promise.all)
        ↙          ↓          ↓         ↓           ↓
  xp.repository  coin.repository  badge.repository  mission.repository  reward.repository
        ↓
      Prisma → PostgreSQL
```

## Performance guarantees

- All sub-queries within each endpoint are batched with `Promise.all()` — at most 2 sequential round trips (phase 1: independent queries; phase 2: rank queries that depend on phase-1 values)
- Activity feed: 6 parallel streams, client-side merge + sort, no N+1
- Limits enforced: activity (default 20, max 50), recent badges (5), recent claims (5), pending rewards (5)
- Only pre-computed state is read: `StudentLevel`, `StudentWallet`, `StudentBadge`, `StudentAchievementProgress`, `StudentMission`, `StudentStreak`, `StudentReward`
- Never scans: `TestAttempt`, `AttemptQuestion`, `StudentAnswer`, raw submission tables

## Read-only guarantee

This module contains no `create`, `update`, `delete`, or `upsert` Prisma calls. It never calls `awardXp`, `earnCoins`, `claimReward`, or any other write service.

## Query parameters

### GET /gamification/activity

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–50` | `20` | Number of activity items to return |

## Activity feed item types

| Type | Source | Points field |
|---|---|---|
| `XP_EARNED` | XpTransaction | xpAwarded |
| `COINS_EARNED` | CoinTransaction (EARN only) | amount |
| `BADGE_UNLOCKED` | StudentBadge | badge.xpReward |
| `MISSION_COMPLETED` | StudentMission (COMPLETED) | mission.xpReward |
| `REWARD_CLAIMED` | StudentReward (CLAIMED) | xpAmount + coinAmount |
| `ACHIEVEMENT_UNLOCKED` | StudentAchievementProgress (completed) | achievement.xpReward |

## Dashboard sections

### Student
fullName, class, profileImage; currentTitle/Avatar/Theme always null (cosmetics not yet implemented).

### Level
currentLevel, levelTitle (via `titleForLevel()`), currentXp, xpToNext, totalXpForNext, progressPercent, xpRank.

### Wallet
currentCoins, lifetimeEarned, lifetimeSpent, walletRank.

### Badges
total (all active definitions), unlocked (earned count), hidden (earned with isVisible=false), completionPercent, recent 5, categories breakdown, nextUnlockable (first unearned visible badge by tier order).

### Achievements
completed, inProgress, total, completionPercent, closest 5 (not-yet-completed, sorted by progressPercent desc).

### Missions
today's DAILY missions, this week's WEEKLY missions, completedToday, remainingToday, completionPercent, nextReset (midnight UTC tonight).

### Streaks
login/study/practice/recommendation/revision as typed items, longestEver (max of all longestStreak), bestCategory (streakType with highest currentStreak).

### Rewards
pendingCount = claimableCount (all AVAILABLE are claimable), expiredCount, up to 5 pending rewards, up to 5 recent claims.

## Future scope

- Cache: badge definitions, mission definitions, reward catalog (Redis, 5-min TTL)
- Teacher/parent/admin dashboard variants
- Seasonal widgets (special events)
- Notification center integration
- Arena/tournament widget

---

# MODULE 25

Arena Foundation & Match Engine (Sprint 9.1 — deterministic match lifecycle, immutable results)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/arena` | Protected (self) | Create a new arena match |
| GET | `/arena` | Protected (self) | List my active matches (paginated) |
| GET | `/arena/history` | Protected (self) | Past matches (COMPLETED / CANCELLED / EXPIRED) |
| GET | `/arena/:matchId` | Protected (participant) | Match details with participants and invites |
| POST | `/arena/:matchId/invite` | Protected (creator only) | Invite a student to the match |
| POST | `/arena/invites/:inviteId/accept` | Protected (receiver only) | Accept a pending invite |
| POST | `/arena/invites/:inviteId/decline` | Protected (receiver only) | Decline a pending invite |
| POST | `/arena/:matchId/cancel` | Protected (creator only) | Cancel the match |

Route registration order: `/history` and `/invites/...` are registered BEFORE `/:matchId` to prevent Express from capturing literal paths as match IDs.

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin)
    → arena.service (lifecycle, ownership checks)
      → arena.rules (pure validation + state transitions)
      → arena.repository (CRUD)
        → Prisma → PostgreSQL
```

## Match lifecycle

```
[POST /arena]
  → CREATED (creator auto-accepted as participant)
    → [POST /:matchId/invite] → INVITED (first invite sent)
      → [accept invite] → WAITING (≥2 ACCEPTED participants)
        → ACTIVE        (future: startMatch called by scoring engine)
          → COMPLETED   (future: finishMatch + ArenaResult rows created)
  CREATED/INVITED/WAITING → CANCELLED (creator cancels)
  CREATED/INVITED/WAITING → EXPIRED   (expiresAt passes)
```

## Match types

FRIEND · PRIVATE · PUBLIC · SCHOOL · DISTRICT · STATE · NATIONAL · TOURNAMENT

## Match visibility

| Value | Meaning |
|---|---|
| PRIVATE | Only invited participants can join |
| PUBLIC | Open to all (future: matchmaking) |
| INVITE_ONLY | Visible to invited students only |

## Match status transitions (deterministic)

| From | Event | To |
|---|---|---|
| CREATED | First invite sent | INVITED |
| CREATED/INVITED | ≥2 accepted | WAITING |
| WAITING | startMatch() | ACTIVE |
| ACTIVE | finishMatch() | COMPLETED |
| CREATED/INVITED/WAITING | Creator cancels | CANCELLED |
| Any non-terminal | expiresAt passed | EXPIRED |

Invalid transitions → 409 Conflict.

## Participant status transitions

INVITED → ACCEPTED → READY → PLAYING → FINISHED (via future scoring engine)
INVITED → LEFT (decline or leave)
Any → DISQUALIFIED

## Invite status transitions

PENDING → ACCEPTED (receiver accepts)
PENDING → DECLINED (receiver declines)
PENDING → CANCELLED (match cancelled or invite rescinded)
PENDING → EXPIRED (expiresAt < now)

## Business rules

- A student cannot join the same match twice — `@@unique([matchId, studentId])` on ArenaParticipant
- A student cannot accept an expired invite — checked in `validateAcceptInvite()`
- A student cannot accept after match is ACTIVE/COMPLETED/CANCELLED/EXPIRED
- Only the match creator can invite, cancel
- Only the invite receiver can accept or decline
- Completed matches are immutable — cannot be cancelled or modified
- ArenaResult rows are immutable — `@@unique([matchId, studentId])` prevents duplicate results

## Code generation

- Match codes: 8-char uppercase alphanumeric (e.g. "A3BX7KQP"), unique in DB
- Invite codes: 10-char uppercase alphanumeric (e.g. "B7KXMN3QPZ"), unique in DB
- Generated via `crypto.randomBytes` for uniform distribution; retry on P2002

## Expiry defaults

| Resource | Default expiry |
|---|---|
| ArenaMatch | 48 hours from creation; or scheduledStart + 30 min |
| ArenaInvite | 24 hours; or scheduledStart − 30 min (whichever is sooner; minimum 5 min from now) |

## Internal methods (for future sprints)

| Method | Purpose |
|---|---|
| `startMatch(matchId)` | WAITING → ACTIVE, validates ≥2 accepted participants |
| `finishMatch(matchId, winnerId?)` | ACTIVE → COMPLETED, sets endedAt and winnerId |
| `expireMatch(matchId)` | Any non-terminal → EXPIRED if expiresAt passed |
| `createMatchResult(input)` | Creates immutable ArenaResult row |

## Query parameters

### GET /arena

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–100` | `20` | Page size |
| `cursor` | UUID | — | Cursor for next page |
| `status` | enum | — | Filter by match status |

### GET /arena/history

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–100` | `20` | Page size |
| `cursor` | UUID | — | Cursor for next page |
| `matchType` | enum | — | Filter by match type |

## Security

- Students access only matches they participate in
- Match creator authorization enforced at service layer (not just middleware)
- Invite receiver authorization enforced at service layer
- ArenaResult immutability enforced by DB unique constraint — no update path exists

## Future scope (out of this sprint)

- Scoring engine integration (startMatch / finishMatch triggers)
- Tournament bracket engine
- School / district / national matchmaking
- Friend battle scoring and real-time play
- Spectator mode
- Live countdown and match timers
- Reward distribution on completion
- Arena dashboard widget

---

# MODULE 27

School, District & Open Competition Engine (Sprint 9.3 — reuses ArenaMatch + ArenaParticipant, immutable leaderboard snapshots)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/competitions` | Admin | Create a competition (DRAFT status) |
| GET | `/competitions` | Protected | List PUBLIC competitions (paginated) |
| GET | `/competitions/my` | Protected | List my own registrations |
| GET | `/competitions/:competitionId` | Protected | Competition detail + my registration |
| POST | `/competitions/:competitionId/register` | Protected | Register (eligibility validated on register) |
| DELETE | `/competitions/:competitionId/register` | Protected | Cancel my registration |
| GET | `/competitions/:competitionId/participants` | Protected | List participants (paginated) |
| GET | `/competitions/:competitionId/leaderboard` | Protected | Latest leaderboard snapshot |
| GET | `/competitions/:competitionId/history` | Protected | Historical snapshot metadata |

Route registration order: `/my` registered BEFORE `/:competitionId` to prevent Express capturing the literal as a UUID.

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin)
    → competition.service (lifecycle, eligibility, snapshot orchestration)
      → competition.rules (pure validation + eligibility)
      → competition.repository (CRUD)
        → Arena Foundation (ArenaMatch + ArenaParticipant — direct Prisma writes)
        → Prisma → PostgreSQL
```

## Competition types

| Type | Eligibility |
|---|---|
| `SCHOOL` | Only students whose `schoolId` matches `competition.schoolId` |
| `DISTRICT` | Only students whose school's `district` matches `competition.districtId` |
| `STATE` | Only students whose school's `state` matches `competition.stateId` |
| `NATIONAL` | Any student (optional class filter applies) |
| `PUBLIC` | Open to everyone satisfying optional class/subject filters |

## Competition status lifecycle

```
DRAFT → REGISTRATION_OPEN → REGISTRATION_CLOSED → READY → ACTIVE → COMPLETED → ARCHIVED
Any non-terminal → CANCELLED
```

| Status | Meaning |
|---|---|
| `DRAFT` | Created; not yet visible for registration |
| `REGISTRATION_OPEN` | Students can register |
| `REGISTRATION_CLOSED` | No new registrations; admin finalizing |
| `READY` | Ready to start |
| `ACTIVE` | Match in progress; ArenaMatch created, participants linked |
| `COMPLETED` | Finished; ArenaResults finalized; immutable snapshot created |
| `ARCHIVED` | Archived for historical reference |
| `CANCELLED` | All REGISTERED/APPROVED registrations cancelled |

## Registration lifecycle

```
(none)
  → REGISTERED [POST /register — eligibility validated, auto-approved on success]
  → APPROVED   [immediate on successful eligibility check]
  → CANCELLED  [DELETE /register — only before ACTIVE]
  → COMPLETED  [internal — when competition completes, finalRank + score set]
  → REJECTED   [internal admin override]
```

## Arena Foundation reuse

When a competition transitions to `ACTIVE` (`startCompetition` internal method):
1. One `ArenaMatch` is created with `matchType = competition.competitionType`
2. All `APPROVED` registrations become `ArenaParticipant` rows (`status = ACCEPTED`)
3. `CompetitionRegistration.arenaMatchId` is set for all registrations

When the competition `COMPLETES`:
1. `ArenaResult` rows for the match are read
2. `CompetitionRegistration.finalRank` and `.score` are populated
3. An immutable `CompetitionLeaderboardSnapshot` is created

## Leaderboard read policy

- `GET /leaderboard` returns the latest `CompetitionLeaderboardSnapshot` (never rebuilds from raw `ArenaResult`)
- `GET /history` returns snapshot metadata list (without the heavy `top100` JSON blob)
- Snapshots are append-only — never updated after creation

## Visibility

| Value | Who sees it |
|---|---|
| `PUBLIC` | Listed in `GET /competitions` for all authenticated students |
| `PRIVATE` | Not listed; visible only via direct URL or own registration (`/my`) |
| `INVITE_ONLY` | Not listed; students must be invited by admin |

## Security

- Only ADMIN role may `POST /competitions`
- Eligibility is validated at registration time, not list time
- Students may only cancel their own registrations and only before `ACTIVE`
- `ArenaResult` immutability inherited from Sprint 9.1 constraints
- Leaderboard snapshots immutable by design (no update path in repository)
- Duplicate registrations impossible via `@@unique([competitionId, studentId])`

## Eligibility validation detail

`checkEligibility` in `competition.rules.ts` requires a fully resolved `StudentEligibilityContext`:
- `studentClass` — from `StudentProfile.class`
- `schoolId` — from `StudentProfile.schoolId`
- `schoolDistrict` — from `StudentProfile.school.district` (resolved via JOIN)
- `schoolState` — from `StudentProfile.school.state` (resolved via JOIN)

All resolved in `competition.service.registerForCompetition` before calling the pure rule.

## Internal methods (not exposed as HTTP endpoints in this sprint)

| Method | Trigger |
|---|---|
| `openRegistration(id)` | Admin panel (Sprint 9.4+) |
| `closeRegistration(id)` | Admin panel |
| `markReady(id)` | Admin panel |
| `startCompetition(id)` | Scheduled job or admin panel |
| `completeCompetition(id)` | After match scores are finalized |
| `cancelCompetition(id)` | Admin panel |
| `archiveCompetition(id)` | Admin panel |
| `buildLeaderboardSnapshot(id)` | Called by `completeCompetition` |

## Query parameters

### GET /competitions

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–100` | `20` | Page size |
| `cursor` | UUID | — | Cursor-based pagination |
| `competitionType` | enum | — | Filter by type |
| `status` | enum | — | Filter by status |

### GET /competitions/:competitionId/participants

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–100` | `20` | Page size |
| `cursor` | UUID | — | Cursor |
| `status` | enum | — | Filter by registration status |

---

# MODULE 26

Friend Battles & Private Challenge Engine (Sprint 9.2 — friendship graph, CASUAL/RANKED/PRACTICE battles, rematch system)

## Friend Management Endpoints (`/friends`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/friends/request` | Protected (self) | Send a friend request |
| GET | `/friends/pending` | Protected (self) | List incoming pending requests |
| GET | `/friends/sent` | Protected (self) | List outgoing pending requests |
| GET | `/friends` | Protected (self) | List accepted friends (paginated) |
| POST | `/friends/:id/accept` | Protected (receiver) | Accept a friend request |
| POST | `/friends/:id/reject` | Protected (receiver) | Reject a friend request |
| DELETE | `/friends/:id` | Protected (either side) | Remove an accepted friend |
| POST | `/friends/:id/block` | Protected (either side) | Block a student |
| POST | `/friends/:id/unblock` | Protected (either side) | Unblock a student |

Route registration order: `/pending` and `/sent` registered BEFORE `/:id` to prevent Express from capturing literals as param values.

## Battle Endpoints (`/battle`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/battle/challenge` | Protected (self) | Challenge a friend to a battle |
| POST | `/battle/:matchId/accept` | Protected (opponent) | Accept a battle challenge |
| POST | `/battle/:matchId/decline` | Protected (opponent) | Decline a battle challenge |
| GET | `/battle/statistics` | Protected (self) | Cumulative battle statistics |
| GET | `/battle/history` | Protected (self) | Past battles (paginated) |
| POST | `/battle/:matchId/rematch` | Protected (participant) | Request a rematch |
| POST | `/battle/rematches/:rematchId/accept` | Protected (requestee) | Accept a rematch |
| POST | `/battle/rematches/:rematchId/decline` | Protected (requestee) | Decline a rematch |

Route registration order: `/statistics`, `/history`, `/challenge`, `/rematches/...` registered BEFORE `/:matchId`.

## API flow

```
Route (authenticate + Zod validate)
  → Controller (thin)
    → battle.service (friendship, challenge, rematch orchestration)
      → battle.rules (pure validation + state transitions)
      → battle.repository (CRUD + cross-arena reads)
        → Prisma → PostgreSQL
```

## Battle types

| Type | Description |
|---|---|
| `CASUAL` | Unranked, no XP/coin awards |
| `RANKED` | Winner earns XP + coins; stats affect BattleStatistics |
| `PRACTICE` | No scoring pressure, for learning |

Stored in `ArenaMatch.metadata.battleType` (not a separate column).

## Challenge flow

```
POST /battle/challenge
  → ArenaMatch (FRIEND type) created, matchType = 'FRIEND'
  → challenger auto-accepted (ArenaParticipant, status = ACCEPTED)
  → opponent gets ArenaInvite (PENDING) + ArenaParticipant (INVITED)
  → match status → INVITED

POST /battle/:matchId/accept (opponent)
  → invite status → ACCEPTED, participant status → ACCEPTED
  → acceptedCount ≥ 2 → match status → WAITING

POST /battle/:matchId/decline (opponent)
  → invite status → DECLINED, participant status → LEFT
```

## Rematch flow

```
POST /battle/:matchId/rematch (either participant, after COMPLETED)
  → BattleRematch created (PENDING), expiresAt = +24h

POST /battle/rematches/:rematchId/accept (requestee)
  → new ArenaMatch created (matchType = FRIEND, same battleType)
  → both players added as ACCEPTED participants
  → BattleRematch.newMatchId set, status → ACCEPTED

POST /battle/rematches/:rematchId/decline (requestee)
  → BattleRematch status → DECLINED
```

## Friendship status machine

```
(none) → PENDING  [sendFriendRequest]
PENDING → ACCEPTED [acceptFriendRequest]
PENDING → REMOVED  [rejectFriendRequest]
ACCEPTED → REMOVED [removeFriend]
ACCEPTED/PENDING → BLOCKED [blockFriend]
BLOCKED → ACCEPTED [unblockFriend]
```

## Security

- Blocked students cannot be challenged
- RANKED challenges blocked if active RANKED battle already exists between the pair
- Rematch only allowed for completed matches; only participants can request
- Only the requestee can accept/decline a rematch
- Bidirectional friendship dedup enforced at DB level via functional unique index on LEAST/GREATEST(senderId, receiverId)

## Query parameters

### GET /friends

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–50` | `20` | Page size |
| `cursor` | UUID | — | Cursor for next page |

### GET /battle/history

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | `1–50` | `20` | Page size |
| `cursor` | UUID | — | Cursor for next page |
| `battleType` | `CASUAL\|RANKED\|PRACTICE` | — | Filter by type |

---

# MODULE 8

Achievements

GET

/achievements

Protected

Return Earned Achievements

---

GET

/achievements/available

Protected

Return Locked Achievements

---

# MODULE 9

Notifications

GET

/notifications

Protected

PUT

/notifications/read

Protected

---

# MODULE 10

Subscription

GET

/subscription

Protected

POST

/subscription/purchase

Protected

---

# MODULE 11

Payments

POST

/payment/create-order

Protected

POST

/payment/webhook

Internal

POST

/payment/verify

Protected

---

# MODULE 12

Admin

/Admin APIs

Require

Admin Role

Examples

/users

/tests

/questions

/dashboard

/reports

---

# Validation Rules

Validate

Phone

OTP

JWT

UUID

Arrays

Objects

Required Fields

IDs

Never Trust Frontend

---

# Security Rules

JWT Required

Role Validation

Ownership Validation

Input Validation

Rate Limiting

Helmet

CORS

No Sensitive Data Exposure

Audit Logs

---

# Rate Limits

OTP

5/hour

Login

10/hour

Profile Update

30/hour

Test Submit

Unlimited

Admin APIs

100/hour

---

# Logging

Log

Login

Logout

Profile Update

Test Submit

Payment

Errors

Never Log

Password

OTP

JWT

---

# Error Messages

User Friendly

Examples

"Invalid OTP"

"Test Already Submitted"

"Unauthorized"

"Session Expired"

Never Return

Stack Trace

SQL Errors

Internal Details

---

# API Versioning

Always

/api/v1/

Future

/api/v2/

Never Break Existing APIs

---

# MODULE 28

Tournament Engine (Sprint 9.4 — KNOCKOUT / ROUND_ROBIN / LEAGUE / SWISS_FOUNDATION; reuses ArenaMatch for match execution)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/tournaments` | Admin | Create a tournament (DRAFT status) |
| GET | `/tournaments` | Protected | List tournaments (paginated, filterable) |
| GET | `/tournaments/my` | Protected | List tournaments I am registered for |
| GET | `/tournaments/:tournamentId` | Protected | Tournament detail + my standing |
| GET | `/tournaments/:tournamentId/rounds` | Protected | All rounds with matches |
| GET | `/tournaments/:tournamentId/standings` | Protected | Full standings table |
| POST | `/tournaments/:tournamentId/register` | Protected | Register for tournament |
| DELETE | `/tournaments/:tournamentId/register` | Protected | Cancel my registration |
| POST | `/tournaments/:tournamentId/open-registration` | Admin | Transition DRAFT → REGISTRATION_OPEN |
| POST | `/tournaments/:tournamentId/close-registration` | Admin | Transition REGISTRATION_OPEN → REGISTRATION_CLOSED |
| POST | `/tournaments/:tournamentId/ready` | Admin | Transition REGISTRATION_CLOSED → READY |
| POST | `/tournaments/:tournamentId/start` | Admin | Generate round 1 bracket + transition → ACTIVE |
| POST | `/tournaments/:tournamentId/advance-round` | Admin | Create next round from current winners |
| POST | `/tournaments/:tournamentId/result` | Admin | Record match result + update standings |
| POST | `/tournaments/:tournamentId/complete` | Admin | Finalise standings + transition → COMPLETED |
| POST | `/tournaments/:tournamentId/cancel` | Admin | Cancel from any non-terminal status |
| POST | `/tournaments/:tournamentId/archive` | Admin | Archive COMPLETED or CANCELLED tournament |

## Status Lifecycle

```
DRAFT → REGISTRATION_OPEN → REGISTRATION_CLOSED → READY → ACTIVE → COMPLETED → ARCHIVED
Any non-terminal → CANCELLED
```

## Formats

| Format | Bracket | Rounds | Points |
|---|---|---|---|
| KNOCKOUT | Single-elimination; loser eliminated | ceil(log2(n)) | Winner advances |
| ROUND_ROBIN | Circle method; every participant plays every other | n-1 (even) / n (odd) | win=3, draw=1, loss=0 |
| LEAGUE | Round-robin variant with fixture scheduling | Same as ROUND_ROBIN | Same |
| SWISS_FOUNDATION | Fixed rounds, no elimination | ceil(log2(n)) | win=3, draw=1, loss=0 |

## Registration Model

Presence of a `TournamentStanding` row = registered. Stats start at zero and accumulate per round.

## Bracket Generation

- KNOCKOUT: sort participants by studentId, pair consecutively; odd count = last gets a bye (auto-WALKOVER)
- ROUND_ROBIN/LEAGUE/SWISS_FOUNDATION: circle method — fix position 0, rotate the rest clockwise each round

---

# MODULE 29

Arena Dashboard (Sprint 9.4 — read-only BFF aggregator; mounts at /arena BEFORE Sprint 9.1's arena routes)

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/arena/dashboard` | Protected | Summary card (profile + active + upcoming + recent results) |
| GET | `/arena/profile` | Protected | Arena profile + arena rating |
| GET | `/arena/history` | Protected | Rich history — arena + tournaments + competitions |
| GET | `/arena/statistics` | Protected | Detailed breakdown: battles / tournaments / competitions |
| GET | `/arena/upcoming` | Protected | All scheduled activities with live event state |

## Route Ordering (CRITICAL)

These 5 literal paths are registered at `/arena` BEFORE Sprint 9.1's arena routes. Express matches in registration order, so `/arena/dashboard`, `/arena/profile`, etc. are never captured by Sprint 9.1's `/:matchId` param route.

## Live Event State

Computed as pure derived fields from date arithmetic — no DB writes, no cron dependency.

| Field | Meaning |
|---|---|
| `isLive` | Activity is currently underway (status ACTIVE, or within 15min grace after scheduledStart) |
| `gracePeriodActive` | Within 15 min after scheduledStart |
| `lateJoinLocked` | Grace period ended; activity not yet COMPLETED |
| `minutesUntilStart` | Whole minutes until scheduledStart; null if already started |

## Arena Rating

Deterministic aggregation — not stored as a separate DB column.

```
arenaRating = 1000 + (totalTournamentPoints × 10) + (battleWins × 5)
```

---

# MODULE 30

Notification Platform (Sprint 10.1 — storage, delivery pipeline, templates, preferences, delivery tracking)

## Endpoints

### Notifications (`/notifications`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/notifications` | Protected | List my notifications (paginated, filterable) |
| GET | `/notifications/unread` | Protected | List unread notifications only |
| GET | `/notifications/:id` | Protected | Get a single notification |
| PATCH | `/notifications/:id/read` | Protected | Mark one notification as read |
| PATCH | `/notifications/read-all` | Protected | Mark all as read |
| PATCH | `/notifications/:id/archive` | Protected | Archive a notification (soft) |
| DELETE | `/notifications/:id` | Protected | Hard-delete an archived notification |

### Templates (`/notification-templates`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/notification-templates` | Protected | List all active templates |
| GET | `/notification-templates/:code` | Protected | Get template by code |

### Preferences (`/notifications/preferences`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/notifications/preferences` | Protected | Get my channel preferences |
| PATCH | `/notifications/preferences` | Protected | Update my channel preferences |

## Route Registration Order

`/unread`, `/read-all`, and `/preferences` are literal paths registered **before** `/:id` to prevent Express capturing them as notification IDs.

## Security

- Students access **only their own** notifications (userId scoped in repository)
- Templates are **read-only** for all authenticated users
- Preferences belong only to the authenticated user
- Delivery logs are never exposed via student-facing API

## Notification Types

`TEST` · `RESULT` · `RANKING` · `GAMIFICATION` · `ARENA` · `COMPETITION` · `PAYMENT` · `SECURITY` · `SYSTEM` · `ANNOUNCEMENT`

## Priority Levels

| Priority | Behaviour |
|---|---|
| LOW | Normal delivery; respects quiet hours and channel preferences |
| NORMAL | Normal delivery; respects quiet hours and channel preferences |
| HIGH | Normal delivery; respects quiet hours and channel preferences |
| CRITICAL | Bypasses quiet hours AND channel preferences — always delivered |

## Template Rendering

Templates use `{{variable}}` placeholders. `renderTemplate()` in `notification.rules.ts` replaces all declared variables; throws 400 if any are missing.

## Channel Abstraction

| Channel | Sprint 10.1 Provider | Sprint 10.2 Provider |
|---|---|---|
| IN_APP | mock (no-op; row IS the notification) | — |
| PUSH | mock | Firebase Cloud Messaging |
| EMAIL | mock | SendGrid |
| SMS | mock | MSG91 / Twilio |
| WHATSAPP | mock | WhatsApp Business API |

## Retry Strategy

- Max 3 attempts per notification
- Exponential backoff: attempt n → `min(30s × 2^(n-1), 300s)`
- Only `FAILED` notifications are retried; `CANCELLED` notifications are never retried
- Each retry creates a **new** `NotificationDeliveryLog` row — logs are append-only

## Immutability Rules

| Field | Mutable? |
|---|---|
| title, message, type, data | Never — immutable after creation |
| status | Yes — delivery pipeline updates only |
| readAt | Yes — set once on first read |
| archivedAt | Yes — set once on archive |

---

# MODULE 31 — Event Engine (Sprint 10.2)

Base: `/api/v1/events`

Auth: All endpoints require `authorize(ROLES.ADMIN)`.

## Endpoints

### POST /events
Emit a domain event. The engine processes it synchronously in Phase 1.

**Body**
```json
{
  "eventType":     "LEVEL_UP",
  "aggregateType": "StudentProfile",
  "aggregateId":   "<uuid>",
  "payload":       { "targetUserId": "<uuid>", "newLevel": 5 },
  "targetUserId":  "<uuid>"
}
```

**Response** `201`
```json
{ "success": true, "data": { "id": "...", "status": "PROCESSED", ... } }
```

**Errors**: 400 unknown event type · 400 invalid UUID

---

### GET /events
List domain events with optional status filter and cursor pagination.

**Query**: `status?` (PENDING|PROCESSING|PROCESSED|FAILED|CANCELLED) · `cursor?` · `limit` (default 20)

**Response** `200`
```json
{
  "success": true,
  "data": {
    "events": [...],
    "hasMore": true,
    "nextCursor": "uuid",
    "total": 142
  }
}
```

---

### GET /events/:id
Get a single event by id.

**Response** `200` — event object · `404` not found

---

## DomainEvent view fields

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| eventType | DomainEventType | |
| aggregateType | string | |
| aggregateId | UUID | |
| payload | object | |
| status | EventStatus | PENDING \| PROCESSING \| PROCESSED \| FAILED \| CANCELLED |
| processedAt | ISO string \| null | |
| retryCount | number | |
| createdAt | ISO string | |

## Event types

| Category | Event Types |
|---|---|
| Authentication | USER_REGISTERED · LOGIN_SUCCESS · PASSWORD_CHANGED · NEW_DEVICE_LOGIN |
| Tests | TEST_ASSIGNED · TEST_REMINDER · TEST_SUBMITTED · RESULT_PUBLISHED |
| Ranking | RANK_UPDATED · TOP_100_ENTERED |
| Gamification | LEVEL_UP · BADGE_UNLOCKED · MISSION_COMPLETED · REWARD_CLAIMED |
| Arena | FRIEND_CHALLENGE · MATCH_STARTED · MATCH_COMPLETED · TOURNAMENT_STARTED |
| Competition | REGISTRATION_APPROVED · COMPETITION_STARTING · COMPETITION_COMPLETED |
| Payments | SUBSCRIPTION_CREATED · PAYMENT_SUCCESS · PAYMENT_FAILED |
| System | ANNOUNCEMENT_CREATED |

## Event lifecycle rules

- Only PENDING events can be processed — PROCESSING/PROCESSED/CANCELLED are immutable.
- `processEvent()` always creates a DomainEvent row before touching any notification logic.
- Business modules call `emitEvent()` — never `createNotification()` directly.
- Phase 1: events are processed synchronously inline after creation.
- Phase 2: `processPendingEvents()` will be called by a background worker.

---

# MODULE 32 — Announcement Center (Sprint 10.2)

Base: `/api/v1/announcements`

## Endpoints

### POST /announcements _(admin)_
Create an announcement. If `scheduledFor` is in the future, status is set to SCHEDULED automatically.

**Body**
```json
{
  "title":          "CBSE Board Exam 2026 Schedule",
  "message":        "Exams start from 15 Feb 2026...",
  "type":           "BOARD",
  "priority":       "HIGH",
  "targetAudience": "BOARD",
  "boardId":        "<uuid>",
  "scheduledFor":   "2026-01-01T00:00:00Z",
  "expiresAt":      "2026-02-15T00:00:00Z"
}
```

**Response** `201` — announcement view

**Errors**: 400 validation · 422 expiresAt ≤ scheduledFor · 422 required audience filter missing

---

### GET /announcements _(admin)_
List announcements with optional type/status filter.

**Query**: `type?` · `status?` · `cursor?` · `limit` (default 20)

**Response** `200`
```json
{
  "success": true,
  "data": {
    "announcements": [...],
    "hasMore": true,
    "nextCursor": "uuid",
    "total": 8
  }
}
```

---

### GET /announcements/my _(student — registered before /:id)_
Student's own announcement feed. Excludes dismissed and expired announcements.

**Query**: `cursor?` · `limit` (default 20)

**Response** `200`
```json
{
  "success": true,
  "data": {
    "announcements": [...],
    "unreadCount": 3,
    "hasMore": false,
    "nextCursor": null
  }
}
```

---

### GET /announcements/:id _(admin)_
Get single announcement detail.

**Response** `200` · `404` not found

---

### PATCH /announcements/:id _(admin)_
Content update or status transition. Discriminated by optional `action` field.

**Body (content update — DRAFT/SCHEDULED only)**
```json
{ "title": "Updated title", "message": "New message", "priority": "CRITICAL" }
```

**Body (status transition)**
```json
{ "action": "publish" }   // → PUBLISHED; resolves audience + creates recipients + emits events
{ "action": "schedule" }  // → SCHEDULED; requires scheduledFor to be in the future
{ "action": "cancel" }    // → CANCELLED; only from DRAFT or SCHEDULED
```

**Errors**: 409 wrong status for the requested action · 422 scheduledFor in the past

---

### DELETE /announcements/:id _(admin)_
Hard-delete the announcement. Only allowed from DRAFT or CANCELLED status.

**Errors**: 409 cannot delete PUBLISHED/SCHEDULED announcement

---

### PATCH /announcements/:id/read _(student)_
Mark an announcement as read (sets `readAt` if not already set).

**Errors**: 404 not in recipient list

---

### PATCH /announcements/:id/dismiss _(student)_
Dismiss an announcement (sets `dismissedAt`; excluded from future feed queries).

**Errors**: 404 not in recipient list

---

## Notification Dashboard (Sprint 10.2)

Base: `/api/v1/notifications` (literal paths; mounted before Sprint 10.1's /:id router)

### GET /notifications/dashboard _(student)_
Aggregate notification stats for the authenticated student.

**Response** `200`
```json
{
  "success": true,
  "data": {
    "totalCount":  148,
    "unreadCount": 12,
    "recentCount": 5,
    "byType":      { "RESULT": 40, "GAMIFICATION": 30, "SYSTEM": 15 },
    "byPriority":  { "NORMAL": 80, "HIGH": 50, "LOW": 18 }
  }
}
```

---

### GET /notifications/activity _(student)_
Recent notification activity feed (lightweight — no message body).

**Query**: `cursor?` · `limit` (default 20, max 50)

**Response** `200`
```json
{
  "success": true,
  "data": {
    "notifications": [
      { "id": "...", "type": "RESULT", "priority": "HIGH", "title": "Result Ready", "status": "READ", "readAt": "...", "createdAt": "..." }
    ],
    "hasMore": false,
    "nextCursor": null
  }
}
```

---

## Announcement view fields

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| title | string | |
| message | string | |
| type | AnnouncementType | |
| priority | AnnouncementPriority | |
| targetAudience | AudienceScope | ALL \| BOARD \| CLASS \| SCHOOL \| DISTRICT \| STATE |
| boardId | UUID \| null | |
| academicYearId | string \| null | |
| class | string \| null | |
| schoolId | UUID \| null | |
| districtId | string \| null | |
| stateId | string \| null | |
| scheduledFor | ISO string \| null | |
| expiresAt | ISO string \| null | |
| status | AnnouncementStatus | |
| recipientCount | number | `_count.recipients` |
| createdBy | UUID | |
| createdAt | ISO string | |

## Security

- Only admins may create, list (admin view), update, publish, or delete announcements.
- Students only access `GET /announcements/my`, `PATCH /:id/read`, `PATCH /:id/dismiss`.
- Audience resolution happens server-side — client never submits a recipient list.
- Published announcements are immutable except `readAt` / `dismissedAt` on recipient rows.
- Domain events are immutable once PROCESSED or CANCELLED.
- Business modules never import `notification.service` — they call `emitEvent()` only.

---

# MODULE 33 — Admin Foundation & Access Control (Sprint 12.1)

Base: `/api/v1/admin`

**Auth model**: Admin endpoints require admin JWTs (`audience: 'board-ranking-admin'`). Student tokens are rejected even with a valid signature. Login/refresh are public.

---

## Authentication

### POST /admin/auth/login _(public)_
Authenticate an admin user. Issues an admin-audience JWT pair.

**Body**
```json
{ "email": "admin@school.com", "password": "secretpass" }
```
or
```json
{ "phone": "+919876543210", "password": "secretpass" }
```

**Response** `200`
```json
{
  "success": true,
  "data": {
    "accessToken": "<admin-jwt>",
    "admin": { "id": "...", "email": "...", "role": "ADMIN", "adminRole": "SUPER_ADMIN" }
  }
}
```

Sets `adminRefreshToken` HttpOnly cookie.

**Errors**: 401 invalid credentials

---

### POST /admin/auth/refresh _(public)_
Rotate admin access + refresh tokens. Reads from `adminRefreshToken` cookie or `body.refreshToken`.

**Response** `200` — `{ accessToken }` · rotates `adminRefreshToken` cookie

**Errors**: 401 invalid/expired/wrong-audience refresh token

---

### POST /admin/auth/logout _(admin JWT)_
Invalidates admin session (clears cookie).

**Response** `200`

---

### GET /admin/auth/me _(admin JWT)_
Returns the authenticated admin's profile.

**Response** `200` — AdminView

---

## Roles

### GET /admin/roles _(admin JWT)_
List all admin roles with their assigned permissions.

**Response** `200` — AdminRoleView[]

---

### POST /admin/roles _(admin JWT)_
Create a new admin role. Name must be UPPER_SNAKE_CASE and globally unique.

**Body**
```json
{ "name": "CONTENT_MANAGER", "description": "Manages questions and tests" }
```

**Response** `201` — AdminRoleView · **Errors**: 409 duplicate name · 400 invalid name format

---

### PATCH /admin/roles/:id _(admin JWT)_
Update role name or description. System roles (`isSystem = true`) cannot be modified.

**Body** — any subset of `{ name, description }`

**Errors**: 403 system role · 404 not found · 409 duplicate name

---

### DELETE /admin/roles/:id _(admin JWT)_
Delete a role. System roles cannot be deleted.

**Errors**: 403 system role · 404 not found

---

## Permissions

### GET /admin/permissions _(admin JWT)_
List all platform permission codes with module and action metadata.

**Response** `200` — AdminPermissionView[]

---

### GET /admin/roles/:id/permissions _(admin JWT)_
Get all permissions currently assigned to a role.

**Response** `200` — AdminPermissionView[]

---

### PUT /admin/roles/:id/permissions _(admin JWT)_
Replace the entire permission set for a role (idempotent full replace, not additive).
System roles cannot be modified. Unknown permission codes return 400.

**Body**
```json
{ "permissionCodes": ["QUESTION_CREATE", "QUESTION_UPDATE", "TEST_CREATE"] }
```

**Response** `200` — AdminPermissionView[] (current state after replace)

**Errors**: 400 unknown codes · 403 system role · 404 role not found

---

## Audit Logs

### GET /admin/audit-logs _(admin JWT)_
Cursor-paginated list of admin audit log entries.

**Query**: `module?` · `action?` · `adminId?` (UUID) · `cursor?` · `limit` (default 20)

**Response** `200`
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "hasMore": true,
    "nextCursor": "uuid",
    "total": 350
  }
}
```

---

### GET /admin/audit-logs/:id _(admin JWT)_
Get a single audit log entry including `beforeData` / `afterData`.

**Response** `200` · `404` not found

---

## Dashboard

### GET /admin/dashboard/summary _(admin JWT)_
Lightweight platform metrics via aggregated count queries.

**Response** `200`
```json
{
  "success": true,
  "data": {
    "totalStudents":       12450,
    "totalQuestions":      3820,
    "totalTests":          148,
    "activeCompetitions":  3,
    "activeArenaMatches":  24,
    "unreadNotifications": 1840
  }
}
```

---

## View schemas

### AdminView
| Field | Type |
|---|---|
| id | UUID |
| email | string \| null |
| phone | string \| null |
| role | "ADMIN" |
| adminRole | string \| null — AdminRole.name |
| createdAt | ISO string |

### AdminRoleView
| Field | Type |
|---|---|
| id | UUID |
| name | string |
| description | string \| null |
| isSystem | boolean |
| permissions | AdminPermissionView[] |
| createdAt | ISO string |
| updatedAt | ISO string |

### AdminPermissionView
| Field | Type |
|---|---|
| id | UUID |
| code | string — e.g. QUESTION_CREATE |
| module | string |
| action | string |
| description | string \| null |
| createdAt | ISO string |

### AdminAuditLogView
| Field | Type |
|---|---|
| id | UUID |
| adminId | UUID |
| action | string |
| module | string |
| entityType | string \| null |
| entityId | UUID \| null |
| beforeData | object \| null |
| afterData | object \| null |
| ipAddress | string \| null |
| userAgent | string \| null |
| createdAt | ISO string |

---

## Security

- Student tokens (audience `board-ranking-client`) are rejected by all `/admin/*` routes.
- `SUPER_ADMIN` role bypasses all permission checks. All other roles are checked via `assertPermission()`.
- System roles (`isSystem = true`) cannot be updated or deleted — enforced in `admin.rules.ts`.
- Admin refresh token travels in `adminRefreshToken` HttpOnly cookie, never in body.
- Every write operation creates an `AdminAuditLog` row with before/after data.
- Audit logs are immutable — never updated or deleted.

---

# MODULE 34 — Content & Academic Management (Sprint 12.2)

All routes are under `/api/v1/admin/` and require an Admin JWT (`audience: 'board-ranking-admin'`).
RBAC is enforced per endpoint via `assertPermission`. SUPER_ADMIN bypasses all permission checks.

## Auth model

| Symbol | Meaning |
|---|---|
| `Admin` | Valid admin JWT (`authenticateAdmin`) |
| `BOARD_MANAGE` | Admin with `BOARD_MANAGE` permission code |
| `QUESTION_REVIEW` | Admin with `QUESTION_REVIEW` permission code |
| `QUESTION_APPROVE` | Admin with `QUESTION_APPROVE` permission code |
| `TEST_PUBLISH` | Admin with `TEST_PUBLISH` permission code |
| `COMPETITION_MANAGE` | Admin with `COMPETITION_MANAGE` permission code |
| `ANNOUNCEMENT_PUBLISH` | Admin with `ANNOUNCEMENT_PUBLISH` permission code |

## Dashboard Overview

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/content/overview` | `Admin` | 9 aggregate counts: boards, subjects, questions (total/draft/approved), tests (published/scheduled), competitions (active), announcements (scheduled) |

**Response:**
```json
{
  "success": true,
  "message": "Content overview fetched",
  "data": {
    "totalBoards": 5,
    "totalSubjects": 42,
    "totalQuestions": 1200,
    "draftQuestions": 85,
    "approvedQuestions": 320,
    "publishedTests": 18,
    "scheduledTests": 4,
    "activeCompetitions": 2,
    "scheduledAnnouncements": 6
  }
}
```

---

## Academic Hierarchy — Boards (`/admin/boards`)

Permission required: `BOARD_MANAGE`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/boards` | `BOARD_MANAGE` | List all boards (cursor-paginated, filterable) |
| POST | `/admin/boards` | `BOARD_MANAGE` | Create a new board |
| PATCH | `/admin/boards/:id` | `BOARD_MANAGE` | Update board name or archive/restore (`isActive`) |

### GET /admin/boards

| Query param | Type | Default | Notes |
|---|---|---|---|
| `cursor` | UUID | — | Cursor-based pagination |
| `limit` | `1–100` | `20` | Page size |
| `isActive` | boolean | — | Filter by active status |
| `search` | string | — | Case-insensitive name search |

**Lifecycle notes:**
- Setting `isActive: false` soft-archives the board — all child subjects, chapters, topics, and questions return 404 to students (via `visibleOnlyFor`)
- Board names must be unique (case-insensitive); duplicate check returns 409

---

## Academic Hierarchy — Subjects (`/admin/subjects`)

Permission required: `BOARD_MANAGE`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/subjects` | `BOARD_MANAGE` | List subjects (cursor-paginated, filterable) |
| POST | `/admin/subjects` | `BOARD_MANAGE` | Create a new subject |
| PATCH | `/admin/subjects/:id` | `BOARD_MANAGE` | Update subject or archive/restore |

### POST /admin/subjects body

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | 1–200 chars |
| `boardId` | UUID | Yes | Must be an active board |
| `class` | integer | Yes | 9–12 |
| `description` | string | No | Max 1000 chars |
| `displayOrder` | integer | No | Default 0 |

### GET /admin/subjects query params

| Param | Type | Notes |
|---|---|---|
| `boardId` | UUID | Filter by board |
| `class` | integer | Filter by class (9–12) |
| `isActive` | boolean | Filter by active status |
| `search` | string | Name search |
| `cursor`, `limit` | — | Pagination |

---

## Academic Hierarchy — Chapters (`/admin/chapters`)

Permission required: `BOARD_MANAGE`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/chapters` | `BOARD_MANAGE` | List chapters (cursor-paginated, filterable) |
| POST | `/admin/chapters` | `BOARD_MANAGE` | Create a new chapter |
| PATCH | `/admin/chapters/:id` | `BOARD_MANAGE` | Update chapter or archive/restore |

### POST /admin/chapters body

| Field | Type | Required | Notes |
|---|---|---|---|
| `subjectId` | UUID | Yes | Must be an active subject |
| `name` | string | Yes | 1–200 chars |
| `chapterNumber` | integer | Yes | ≥ 1 |
| `description` | string | No | Max 1000 chars |
| `displayOrder` | integer | No | Default 0 |

---

## Question Moderation (`/admin/questions`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/questions/review` | `QUESTION_REVIEW` | Questions in `IN_REVIEW` status (moderation queue) |
| GET | `/admin/questions` | `QUESTION_REVIEW` | All questions — any status, full filter set |
| PATCH | `/admin/questions/:id/approve` | `QUESTION_APPROVE` | Approve a single question (`IN_REVIEW → APPROVED`) |
| PATCH | `/admin/questions/:id/reject` | `QUESTION_APPROVE` | Reject a single question (`IN_REVIEW → REJECTED`) |
| PATCH | `/admin/questions/:id/archive` | `QUESTION_APPROVE` | Archive a question (`APPROVED|PUBLISHED → ARCHIVED`) |
| POST | `/admin/questions/bulk-approve` | `QUESTION_APPROVE` | Bulk approve (up to 100) — `IN_REVIEW → APPROVED` |
| POST | `/admin/questions/bulk-reject` | `QUESTION_APPROVE` | Bulk reject (up to 100) — `IN_REVIEW → REJECTED` |
| POST | `/admin/questions/bulk-archive` | `QUESTION_APPROVE` | Bulk archive (up to 100) — `APPROVED|PUBLISHED → ARCHIVED` |

**Route registration order (critical):** `/questions/review` and `/questions/bulk-*` are mounted **before** `/questions/:id` so they are not captured as an `:id` path parameter.

### GET /admin/questions query params

| Param | Type | Notes |
|---|---|---|
| `status` | enum | `DRAFT│IN_REVIEW│APPROVED│PUBLISHED│REJECTED│ARCHIVED` |
| `topicId` | UUID | Filter by topic |
| `subjectId` | UUID | Filter by subject (via topic → chapter → subject join) |
| `boardId` | UUID | Filter by board |
| `difficulty` | enum | `EASY│MEDIUM│HARD` |
| `questionType` | enum | `MCQ` |
| `language` | string | Language code |
| `search` | string | Full-text on `questionText`, `source` |
| `isActive` | boolean | Soft-delete filter |
| `cursor`, `limit` | — | Cursor-based pagination |

### POST /admin/questions/bulk-approve body

```json
{ "questionIds": ["uuid1", "uuid2", ...] }
```

Max 100 IDs per request. Questions not in `IN_REVIEW` are silently skipped (count reflects affected rows).

### PATCH /admin/questions/:id/reject body

```json
{ "comment": "Explanation must match NCERT standard." }
```

### Lifecycle guards

- `approve`: requires status = `IN_REVIEW`
- `reject`: requires status = `IN_REVIEW` — returns to `DRAFT`
- `archive`: requires status = `APPROVED` or `PUBLISHED`
- Single operations: CAS via `question-workflow.service` (captures immutable `QuestionVersion` on approve)
- Bulk operations: `updateMany` directly — no CAS; `AdminAuditLog` covers the batch

---

## Test Management (`/admin/tests`)

Permission required: `TEST_PUBLISH`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/tests` | `TEST_PUBLISH` | List tests (cursor-paginated, filterable) |
| POST | `/admin/tests` | `TEST_PUBLISH` | Create a new test (blueprint) |
| PATCH | `/admin/tests/:id` | `TEST_PUBLISH` | Update a DRAFT test (CAS via `updatedAt`) |
| PATCH | `/admin/tests/:id/publish` | `TEST_PUBLISH` | Publish: `DRAFT → ACTIVE` (pool gate runs) |
| PATCH | `/admin/tests/:id/unpublish` | `TEST_PUBLISH` | Unpublish: `ACTIVE → DRAFT` |
| POST | `/admin/tests/:id/duplicate` | `TEST_PUBLISH` | Clone test as a new DRAFT |

### POST /admin/tests body (test blueprint)

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `name` | string | Yes | — | 3–200 chars |
| `boardId` | UUID | Yes | — | |
| `class` | integer | Yes | — | 9–12 |
| `subjectIds` | UUID[] | Yes | — | 1–10 subjects |
| `chapterIds` | UUID[] | No | `[]` | |
| `topicIds` | UUID[] | No | `[]` | |
| `questionCount` | integer | Yes | — | 1–200 |
| `difficultyDistribution` | Record | Yes | — | `{ EASY, MEDIUM, HARD }` summing to 100 |
| `questionTypeDistribution` | Record | No | `{ MCQ: 100 }` | |
| `duration` | integer | Yes | — | Minutes, 1–600 |
| `passingMarks` | integer | Yes | — | |
| `positiveMarks` | integer | No | `1` | 1–10 |
| `negativeMarks` | number | No | `0` | 0–10 |
| `category` | enum | Yes | — | `CHAPTER│SUBJECT│FULL_SYLLABUS│MOCK│DAILY_CHALLENGE` |
| `mode` | enum | No | `PRACTICE` | `PRACTICE│RANKED` |
| `visibility` | enum | No | `PUBLIC` | `PUBLIC│PRIVATE` |
| `shuffleQuestions` | boolean | No | `true` | |
| `shuffleOptions` | boolean | No | `true` | |
| `resultPublishPolicy` | enum | No | `IMMEDIATE` | `IMMEDIATE│AFTER_END_TIME│MANUAL` |
| `rankingScope` | enum | No | `NONE` | `NONE│SCHOOL│DISTRICT│STATE│INDIA` |
| `maxAttempts` | integer | No | `1` | |
| `startTime`, `endTime` | ISO datetime | No | — | |
| `instructions` | string | No | — | Max 5000 chars |
| `calculatorAllowed` | boolean | No | `false` | |
| `reviewAllowed` | boolean | No | `true` | |

### PATCH /admin/tests/:id body

All fields optional. **Must include `updatedAt`** (optimistic-lock CAS token) to prevent concurrent overwrites (409 on stale token).

### Lifecycle guards

- Edit: requires status = `DRAFT`
- Publish: requires status = `DRAFT`; pool gate validates question pool size and difficulty distribution
- Unpublish: requires status = `ACTIVE`
- Duplicate: allowed on any status; clone is always `DRAFT`

---

## Competition Management (`/admin/competitions`)

Permission required: `COMPETITION_MANAGE`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/competitions` | `COMPETITION_MANAGE` | List competitions (cursor-paginated, filterable) |
| POST | `/admin/competitions` | `COMPETITION_MANAGE` | Create a new competition (DRAFT) |
| PATCH | `/admin/competitions/:id` | `COMPETITION_MANAGE` | Update a DRAFT competition |
| PATCH | `/admin/competitions/:id/publish` | `COMPETITION_MANAGE` | Publish: `DRAFT → REGISTRATION_OPEN` |
| PATCH | `/admin/competitions/:id/cancel` | `COMPETITION_MANAGE` | Cancel + cancel all registrations |
| POST | `/admin/competitions/:id/clone` | `COMPETITION_MANAGE` | Clone as new DRAFT (new code, "Copy of…" name) |

### POST /admin/competitions body

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `name` | string | Yes | — | 3–200 chars |
| `competitionType` | enum | Yes | — | `SCHOOL│DISTRICT│STATE│NATIONAL│PUBLIC` |
| `startsAt` | ISO datetime | Yes | — | Must be after `registrationEndsAt` |
| `endsAt` | ISO datetime | Yes | — | Must be after `startsAt` |
| `registrationStartsAt` | ISO datetime | Yes | — | Must be before `registrationEndsAt` |
| `registrationEndsAt` | ISO datetime | Yes | — | Must be ≤ `startsAt` |
| `visibility` | enum | No | `PUBLIC` | `PUBLIC│PRIVATE│INVITE_ONLY` |
| `maxParticipants` | integer | No | — | Min 2 |
| `rankingEnabled` | boolean | No | `true` | |
| `rewardEnabled` | boolean | No | `false` | |
| `boardId`, `subjectId`, `chapterId` | UUID | No | — | Academic scope |
| `class` | integer | No | — | 9–12 |
| `schoolId`, `districtId`, `stateId` | string/UUID | No | — | Geographic scope |
| `academicYear` | string | No | — | E.g. "2025-26" |
| `description` | string | No | — | Max 1000 chars |

**Date validation refinements:**
1. `startsAt < endsAt`
2. `registrationStartsAt < registrationEndsAt`
3. `registrationEndsAt ≤ startsAt`

### Clone

3-attempt retry loop for `competitionCode` uniqueness (catches Prisma P2002). Cloned competition starts as `DRAFT` with name `"Copy of <original>"` (max 200 chars).

### Lifecycle guards

- Edit: requires status = `DRAFT`
- Publish: requires status = `DRAFT` — moves to `REGISTRATION_OPEN`
- Cancel: requires status in `DRAFT│REGISTRATION_OPEN│REGISTRATION_CLOSED│READY` — also calls `cancelAllRegistrations()`

---

## Announcement Management (`/admin/announcements`)

Permission required: `ANNOUNCEMENT_PUBLISH`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/announcements` | `ANNOUNCEMENT_PUBLISH` | List announcements (cursor-paginated, filterable) |
| POST | `/admin/announcements` | `ANNOUNCEMENT_PUBLISH` | Create a new announcement (DRAFT) |
| PATCH | `/admin/announcements/:id` | `ANNOUNCEMENT_PUBLISH` | Update a DRAFT announcement |
| PATCH | `/admin/announcements/:id/publish` | `ANNOUNCEMENT_PUBLISH` | Publish: `DRAFT → PUBLISHED│SCHEDULED` |
| PATCH | `/admin/announcements/:id/cancel` | `ANNOUNCEMENT_PUBLISH` | Cancel a DRAFT or SCHEDULED announcement |

### POST /admin/announcements body

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `title` | string | Yes | — | 1–200 chars |
| `message` | string | Yes | — | 1–5000 chars |
| `type` | enum | Yes | — | `GLOBAL│BOARD│CLASS│SCHOOL│DISTRICT│STATE│COMPETITION│SYSTEM│MAINTENANCE` |
| `priority` | enum | No | `NORMAL` | `LOW│NORMAL│HIGH│CRITICAL` |
| `targetAudience` | enum | Yes | — | `ALL│BOARD│CLASS│SCHOOL│DISTRICT│STATE` |
| `boardId` | UUID | No | — | For BOARD/CLASS audience |
| `class` | string | No | — | Stored as String (e.g. `"10"`, `"11"`) |
| `schoolId` | UUID | No | — | For SCHOOL audience |
| `districtId` | string | No | — | |
| `stateId` | string | No | — | |
| `scheduledFor` | ISO datetime | No | — | If set, announcement is SCHEDULED not immediately PUBLISHED |
| `expiresAt` | ISO datetime | No | — | Expiry time |
| `academicYearId` | UUID | No | — | |

### Publish flow

Delegates to `announcement.service.publishAnnouncement`:
1. Resolves target audience → finds matching `NotificationRecipient` rows
2. Creates `NotificationRecipient` rows
3. Emits `AnnouncementPublished` domain event (picked up by notification engine)
4. If `scheduledFor` is in the future, status → `SCHEDULED`; otherwise → `PUBLISHED`

### Lifecycle guards

- Edit: requires status = `DRAFT`
- Publish: requires status = `DRAFT`
- Cancel: requires status in `DRAFT│SCHEDULED`

---

## Error Codes (Sprint 12.2)

| HTTP | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid request body or query params |
| 403 | `FORBIDDEN` | Admin lacks the required permission code |
| 404 | `NOT_FOUND` | Board / subject / chapter / question / test / competition / announcement not found |
| 409 | `CONFLICT` | Duplicate board name; CAS token stale (`updatedAt` mismatch); question/test/competition in wrong lifecycle state for the requested action |
| 500 | `INTERNAL_ERROR` | Unhandled server error |

---

# MODULE 35 — Operations & Analytics (Sprint 12.3)

All routes are under `/api/v1/admin/` and require an Admin JWT (`audience: 'board-ranking-admin'`).
Permission codes enforced per endpoint. SUPER_ADMIN bypasses permission checks.

## Auth model

| Symbol | Meaning |
|---|---|
| `Admin` | Valid admin JWT |
| `STUDENT_VIEW` | Admin with `STUDENT_VIEW` permission |
| `STUDENT_SUSPEND` | Admin with `STUDENT_SUSPEND` permission |
| `SCHOOL_MANAGE` | Admin with `SCHOOL_MANAGE` permission |
| `COMPETITION_MANAGE` | Admin with `COMPETITION_MANAGE` permission |
| `NOTIFICATION_SEND` | Admin with `NOTIFICATION_SEND` permission |
| `ANALYTICS_VIEW` | Admin with `ANALYTICS_VIEW` permission |
| `SUPPORT_VIEW` | Admin with `SUPPORT_VIEW` permission |
| `SYSTEM_SETTINGS` | Admin with `SYSTEM_SETTINGS` permission |
| `SUPER_ADMIN` | System role — `assertSuperAdmin` guard (not a permission code) |

---

## Operations Overview

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/operations/overview` | `Admin` | 12 aggregate counts: students, schools, tests, arena, competitions, notifications, settings |

---

## Module 1 — Student Management (`/admin/students`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/students` | `STUDENT_VIEW` | Search and list students (cursor-paginated) |
| GET | `/admin/students/:id` | `STUDENT_VIEW` | View full student profile |
| PATCH | `/admin/students/:id/suspend` | `STUDENT_SUSPEND` | Suspend account (requires reason) |
| PATCH | `/admin/students/:id/reactivate` | `STUDENT_SUSPEND` | Reactivate suspended account |
| PATCH | `/admin/students/:id/reset-streak` | `SUPER_ADMIN` | Reset study streak to 0 |
| POST | `/admin/students/:id/grant-xp` | `SUPER_ADMIN` | Grant XP (1–1000, creates XpTransaction) |
| POST | `/admin/students/:id/grant-coins` | `SUPER_ADMIN` | Grant coins (1–500, creates CoinTransaction) |

### GET /admin/students query params

| Param | Type | Notes |
|---|---|---|
| `search` | string | Name, email, or phone search |
| `class` | integer | Filter by class (9–12) |
| `schoolId` | UUID | Filter by school |
| `isSuspended` | boolean | Filter by suspension status |
| `subscriptionPlan` | enum | `FREE` or `PREMIUM` |
| `cursor`, `limit` | — | Cursor-based pagination (default 20, max 100) |

### POST /admin/students/:id/grant-xp body

```json
{ "amount": 100, "reason": "Competition prize compensation" }
```

Grant records `source: 'ADMIN_GRANT'` in XpTransaction. Deduplication key includes `Date.now()` so each grant is always unique.

### POST /admin/students/:id/grant-coins body

```json
{ "amount": 50, "reason": "Platform support goodwill" }
```

Same pattern — `source: 'ADMIN_GRANT'` in CoinTransaction.

### Suspension lifecycle

```
PATCH /suspend  → isSuspended=true, suspendedAt=now, suspendedReason=<reason>
PATCH /reactivate → isSuspended=false, suspendedAt=null, suspendedReason=null
```

- Double-suspend returns 409 (`Student is already suspended`)
- Double-reactivate returns 409 (`Student is not suspended`)
- Students are never hard-deleted

---

## Module 2 — School Management (`/admin/schools`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/schools` | `SCHOOL_MANAGE` | List schools (cursor-paginated, filterable) |
| GET | `/admin/schools/:id` | `SCHOOL_MANAGE` | View school details |
| GET | `/admin/schools/:id/stats` | `SCHOOL_MANAGE` | School statistics (students, attempts, top performers) |
| PATCH | `/admin/schools/:id/archive` | `SCHOOL_MANAGE` | Soft-archive school (`isActive → false`) |
| PATCH | `/admin/schools/:id/activate` | `SCHOOL_MANAGE` | Restore archived school (`isActive → true`) |
| POST | `/admin/schools/:id/merge` | `SUPER_ADMIN` | Merge duplicate school into target school |

### GET /admin/schools query params

| Param | Type | Notes |
|---|---|---|
| `search` | string | School name search |
| `state` | string | Filter by state |
| `district` | string | Filter by district |
| `isActive` | boolean | Filter by active status |
| `cursor`, `limit` | — | Pagination |

### POST /admin/schools/:id/merge body

```json
{ "targetSchoolId": "uuid-of-target" }
```

Atomically moves all student profiles from source school to target school, then archives the source school. Irreversible — creates an AdminAuditLog with before/after data.

---

## Module 3 — Competition & Arena Operations

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/operations/competitions` | `COMPETITION_MANAGE` | List competitions (admin view, all statuses) |
| POST | `/admin/operations/competitions/:id/recalculate` | `COMPETITION_MANAGE` | Rebuild leaderboard snapshot from completed registrations |
| GET | `/admin/operations/arena` | `COMPETITION_MANAGE` | List arena matches (all statuses) |
| POST | `/admin/operations/arena/:id/force-close` | `SUPER_ADMIN` | Force-cancel a non-terminal match |
| POST | `/admin/operations/arena/:id/retry` | `SUPER_ADMIN` | Re-queue FAILED domain events for a match |

**Constraints:**
- `force-close`: rejected if match is already `COMPLETED` or `CANCELLED` (409)
- `retry`: re-queues all `FAILED` DomainEvent rows for the given `aggregateId`; ArenaResult rows are never modified
- `recalculate`: creates a new `CompetitionLeaderboardSnapshot` from current `COMPLETED` registration data

---

## Module 4 — Notification Operations

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/operations/notifications` | `NOTIFICATION_SEND` | Delivery stats: sent/failed/pending counts, delivery rate, breakdown by channel |
| POST | `/admin/operations/notifications/retry` | `NOTIFICATION_SEND` | Re-queue FAILED delivery logs back to PENDING |

### POST /admin/operations/notifications/retry body

```json
{ "limit": 100 }
```

Limit defaults to 100 (max 500). Returns `{ retriedCount: number }`.

---

## Module 5 — Platform Analytics

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/analytics` | `ANALYTICS_VIEW` | Aggregated platform KPIs |

**Response includes:**
- `students`: total, suspended, new in 7 days, new in 30 days
- `tests`: total attempts, completed today, average score
- `arena`: total matches, active matches
- `competitions`: total, active, total registrations
- `notifications`: total sent, total failed, delivery rate
- `topSchools`: top 5 schools by student count (with name resolved)
- `topDistricts`: top 5 districts by student count
- `topStates`: top 5 states by student count

All counts use pre-existing indexed columns — no raw scans.

---

## Module 6 — Support & Moderation

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/support/users/:id` | `SUPPORT_VIEW` | View student support timeline (profile + notes + audit logs) |
| POST | `/admin/support/users/:id/note` | `SUPPORT_VIEW` | Add an immutable support note |

### POST /admin/support/users/:id/note body

```json
{ "note": "Student reported login issue — resolved by password reset." }
```

Max 2000 chars. Notes are immutable after creation (append-only, never updated or deleted).

### Support timeline response

```json
{
  "profile": { "id": "...", "fullName": "...", "isSuspended": false, ... },
  "notes": [{ "id": "...", "adminId": "...", "note": "...", "createdAt": "..." }],
  "auditLogs": [{ "id": "...", "action": "LOGIN", "entity": null, ... }]
}
```

---

## Module 7 — Global Settings

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/settings` | `SYSTEM_SETTINGS` | List all system settings |
| PATCH | `/admin/settings` | `SUPER_ADMIN` | Create or update a setting (upsert semantics) |

### PATCH /admin/settings body

```json
{
  "key": "MAX_DAILY_QUESTIONS",
  "value": 50,
  "description": "Max questions a student can attempt in one day",
  "isPublic": false
}
```

- `key` must be UPPER_SNAKE_CASE
- `value` accepts any JSON value (number, string, boolean, array, object)
- Upsert: writing to an existing key replaces the value and updates `updatedAt`
- Only SUPER_ADMIN may write (`assertSuperAdmin` guard — rejects even admins with `SYSTEM_SETTINGS` permission)

---

## Error Codes (Sprint 12.3)

| HTTP | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid body or query params |
| 403 | `FORBIDDEN` | Insufficient permission or not SUPER_ADMIN |
| 404 | `NOT_FOUND` | Student / school / competition / arena match not found |
| 409 | `CONFLICT` | Student already suspended / not suspended; school already archived / active; match in terminal state |
| 500 | `INTERNAL_ERROR` | Unhandled server error |

---

# Golden Rules

Every API

Must Validate Input

Must Authenticate

Must Authorize

Must Return Standard Response

Must Log Important Events

Must Handle Errors

Must Follow Business Logic

Must Remain Backward Compatible
