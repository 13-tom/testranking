# Board Ranking — Project Rules

India's competitive practice-and-ranking platform for CBSE students
(Classes 9–12, Release 1). Monorepo: Next.js frontend, Express API,
Prisma/Postgres, Redis.

## Source of truth

The `PRD/` (13 chapters) and `docs/` (12 engineering docs) folders are the
**authoritative product and engineering spec** — read them before making
product or architecture decisions, don't guess. Where they conflict with
each other, prefer the more specific/later-numbered decision in
`docs/12_Product_Decisions.md` over general prose elsewhere. Where this repo's
actual build deviates from the docs, the deviation is recorded as a new
`BR-###` entry in `docs/12_Product_Decisions.md` (e.g. BR-037, BR-038) —
never diverge silently.

**Current build target**: Release 1 MVP scope (BR-038) — roadmap Phases 0–9
per `docs/06_Feature_Roadmap.md`: Foundation → Authentication → Student
Dashboard → Question Bank → Test Engine → Analytics → Ranking System → core
Study Points/Gamification → Admin Panel. Phases 10+ (Teacher/Parent Portals,
AI Features, Community, Arena/Competitive features, Marketplace, Mobile
Apps) are documented but deferred.

**Progress**: Phases 0–4 (Foundation, Authentication, Student Dashboard,
Question Bank, Test Engine) are built and tested locally; Phases 0–3 are
deployed live (Vercel + Render + Neon + Upstash), Phase 4 pending its next
deploy. Phase 5 (Analytics) is next. See `docs/12_Product_Decisions.md`
BR-037 through BR-042 for every deviation recorded so far.

**Known deviations from the docs**: Release 1 auth in this build is email +
password (not Mobile+OTP) — see BR-037. `User.phone` stays in the schema as
optional/nullable so OTP can be added later without a migration rework.
Admin routes are gated by a simple `role === "ADMIN"` check reusing the
student JWT, not the full Admin JWT audience/RBAC system — see BR-040.
Question Bank content authoring (seed script + minimal admin CRUD) stands
in for the Phase 9 Admin Panel's review workflow until that phase is
built — see BR-041.

## Folder structure

Layered, per `docs/02_Engineering_Guide.md` (not feature-based folders):

- API (`apps/api/src/`): `routes/`, `controllers/` (req/res only, never
  business logic), `services/` (business logic), `rules/` (pure/
  deterministic logic — validation, calculations), `repositories/` (DB
  access only, no business logic), `middleware/`, `validators/` (Zod
  schemas), `config/`, `types/`, `constants/`. Layering is one-directional:
  Routes → Controllers → Services → Rules → Repositories → Prisma. Never
  skip a layer.
- Web (`apps/web/src/`): `app/`, `components/`, `features/`, `hooks/`,
  `services/`, `store/`, `types/`, `lib/`.
- Shared types/DTOs used by both apps live in `packages/shared`, never
  duplicated.
- Reusable UI primitives (buttons, inputs, cards) live in
  `apps/web/src/components/ui`; feature components compose them.

## Business logic ownership

Backend only: marks, percentages, XP, Study Points, Study Level, ranks,
achievements, badges, streaks, recommendations. The frontend and API
controllers never calculate these — they only request/display values the
Service/Rules layers computed. Never trust a score, rank, or XP value sent
from the frontend.

## Type safety

- TypeScript `strict: true` everywhere. No `any` without a comment
  explaining why it's unavoidable.
- Zod schemas validate every API boundary (request bodies, query/path
  params), living in `validators/`.

## API conventions

- Base path `/api/v1/`; never break existing versioned routes.
- Standard response envelope (exact shape, per `docs/05_API_Blueprint.md`):
  - Success: `{ success: true, message: "", data: {} }`
  - Error: `{ success: false, message: "", errors: [] }`
- Status codes: 200, 201, 400, 401, 403, 404, 409, 500. Never leak stack
  traces, SQL errors, or internal details in error messages.
- Auth tiers: Public (no JWT) / Protected (JWT) / Admin (separate Admin JWT
  audience — admin tokens must be rejected on student-only routes and vice
  versa).
- One centralized Express error-handling middleware. Features throw typed
  errors (`AppError` subclasses); never `res.status(500).send(...)` inline
  in a route handler.

## Naming conventions

DB tables PascalCase, DB columns camelCase, API routes kebab-case, files/
variables camelCase, components PascalCase, constants/env vars UPPER_CASE.

## Logging

- Structured logging via pino in the API. No bare `console.log` in
  committed code (local scratch debugging only, remove before commit).
- Log logins/logouts, OTP verification (when built), payments, errors,
  suspicious activity. Never log passwords, OTP codes, JWTs, or other
  secrets.

## Secrets and config

- All config comes through `.env`, validated at process boot with a
  Zod-parsed env schema — fail fast on missing/invalid vars.
- No hardcoded connection strings, API keys, or secrets in source, ever.

## Git hygiene

- Small, focused commits per logical change.
- One roadmap phase (or a small number of PRs) at a time, not a single
  branch dump at the end.

## Testing baseline

- Every feature ships at least a happy-path test: API via supertest,
  frontend via component render tests. Test runner: Vitest.
- Not chasing full coverage in early phases, but the tooling/pattern is
  established from the start so testing isn't bolted on later.

## Scope discipline

- No premature abstraction: don't build generic plugin systems, config
  layers, or multi-tenancy/i18n scaffolding for hypothetical future needs.
  Solve the current roadmap phase; keep it modular enough to extend later.
- Don't add features, refactors, or abstractions beyond what the current
  phase asks for — this includes not reaching ahead into later roadmap
  phases (Gamification, Arena, Notifications, Admin RBAC, etc.) before
  their turn.
