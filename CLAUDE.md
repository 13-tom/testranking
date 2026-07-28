# Board Ranking — Project Rules

India's competitive ranking platform for CBSE students. Monorepo: Next.js
frontend, Express API, Prisma/Postgres, Redis. See the milestone plan in
conversation history for the overall roadmap (M1 scaffolding → M2 auth →
M3 question bank → M4 test engine → M5 ranking → M6 analytics → M7 polish).

## Folder structure

Feature-based, not type-based.

- API: `apps/api/src/features/<feature>/` containing
  `<feature>.controller.ts`, `<feature>.service.ts`, `<feature>.routes.ts`,
  `<feature>.schema.ts` (Zod). No global `controllers/`, `services/` dirs.
- Web: `apps/web/src/features/<feature>/` for feature logic and components.
  Route groups: `app/(public)`, `app/(student)`, `app/(admin)`.
- Shared types/DTOs used by both apps live in `packages/shared`, never
  duplicated.
- Reusable UI primitives (buttons, inputs, cards) live in
  `apps/web/src/components/ui`; feature components compose them.

## Type safety

- TypeScript `strict: true` everywhere. No `any` without a comment
  explaining why it's unavoidable.
- Zod schemas validate every API boundary (request bodies, query/path
  params). Schemas live next to the feature that owns them.

## API conventions

- Consistent JSON response shape: `{ success, data, error }`.
- Routes are REST-ish per resource, versioned under `/api/v1`.
- One centralized Express error-handling middleware. Features throw typed
  errors (`AppError` subclasses); never `res.status(500).send(...)` inline
  in a route handler.

## Logging

- Structured logging via pino in the API. No bare `console.log` in
  committed code (local scratch debugging only, remove before commit).

## Secrets and config

- All config comes through `.env`, validated at process boot with a
  Zod-parsed env schema — fail fast on missing/invalid vars.
- No hardcoded connection strings, API keys, or secrets in source, ever.

## Git hygiene

- Small, focused commits per logical change.
- One milestone = one PR (or a small number of PRs), not a single branch
  dump at the end.

## Testing baseline

- Every feature ships at least a happy-path test: API via supertest,
  frontend via component render tests. Test runner: Vitest.
- Not chasing full coverage in early milestones, but the tooling/pattern
  is established from M1 so testing isn't bolted on later.

## Scope discipline

- No premature abstraction: don't build generic plugin systems, config
  layers, or multi-tenancy/i18n scaffolding for hypothetical future needs.
  Solve what's specified now; keep it modular enough to extend later.
- Don't add features, refactors, or abstractions beyond what the current
  milestone asks for.
