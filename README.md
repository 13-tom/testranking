# Board Ranking

India's competitive practice-and-ranking platform for CBSE students
(Classes 9–12, Release 1). Monorepo: Next.js frontend, Express API,
Prisma/Postgres, Redis.

`PRD/` and `docs/` are the authoritative product and engineering spec — see
`CLAUDE.md` for how they govern this codebase and the current build target
(Release 1 MVP, roadmap Phases 0–9 per `docs/06_Feature_Roadmap.md`).
Decisions made specifically for this build (that deviate from or extend the
docs) are logged as `BR-###` entries in `docs/12_Product_Decisions.md`.

**Current status**: Phase 0 (Foundation) + Phase 1 (Authentication) done —
email/password register, login, logout, and `me` endpoints, backed by the
real `User`/`StudentProfile`/academic-hierarchy schema from
`docs/04_database.md`. Next up: Phase 2, Student Dashboard.

## Project layout

```
PRD/        Product requirements (13 chapters) — read before changing product behavior
docs/       Engineering docs: database schema, API blueprint, design system,
            engineering guide, feature roadmap, product decisions
apps/
  web/      Next.js frontend (Vercel)
  api/      Express API (Render) — layered: routes/controllers/services/
            rules/repositories, per docs/02_Engineering_Guide.md
packages/
  shared/   TypeScript types shared by both apps
```

## Local development

Requires Node.js 20+.

1. `npm install` at the repo root (installs all workspaces).
2. Copy env files and fill them in:
   - `apps/api/.env.example` → `apps/api/.env`
   - `apps/web/.env.example` → `apps/web/.env`
3. Build the shared package once: `npm run build -w packages/shared`.
4. Run Prisma migrations against your database:
   `npm run prisma:migrate -w apps/api`
5. Start both apps (in separate terminals):
   - `npm run dev:api` — API on `http://localhost:4000`
   - `npm run dev:web` — web on `http://localhost:3000`
6. Open `http://localhost:3000` — it should show "API status: ok".

### Auth endpoints (Phase 1)

```
POST /api/v1/auth/register  { email, password, fullName, class, schoolId? }
POST /api/v1/auth/login     { email, password }
POST /api/v1/auth/logout    (requires Authorization: Bearer <token>)
GET  /api/v1/auth/me        (requires Authorization: Bearer <token>)
```

Quick manual check once the API is running locally:

```
curl -X POST localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"hunter22","fullName":"Test Student","class":10}'
```

## Deploying on free tiers

You'll need four free accounts. Signing in to each with the GitHub account
that owns this repo is the simplest path (works fine from a phone browser).

### 1. Database — Neon (neon.tech)

1. Sign up, create a new project.
2. Copy the connection string it gives you (starts with `postgresql://`).
3. This becomes `DATABASE_URL`.

### 2. Cache — Upstash (upstash.com)

1. Sign up, create a new Redis database (choose a region close to where
   Render will run).
2. Copy the connection string (starts with `rediss://`).
3. This becomes `REDIS_URL`.

### 3. API — Render (render.com)

1. Sign up, connect your GitHub account, select this repo.
2. Render should detect `render.yaml` at the repo root and offer to create
   the `board-ranking-api` service from it. If not, create a new **Web
   Service** manually with:
   - Build command: `npm install && npm run build -w packages/shared && npm run build -w apps/api && npm run prisma:generate -w apps/api`
   - Start command: `npm run start -w apps/api`
   - Health check path: `/api/v1/health`
3. In the service's Environment settings, set: `DATABASE_URL`, `REDIS_URL`,
   `JWT_SECRET` (any long random string for now), and `CORS_ORIGIN` (set
   this after step 4, once you have the Vercel URL).
4. Deploy. Once live, visiting `<your-render-url>/api/v1/health` should
   return JSON with `"status":"ok"`.

### 4. Frontend — Vercel (vercel.com)

1. Sign up, connect GitHub, import this repo.
2. Set **Root Directory** to `apps/web` in the project settings (Vercel
   auto-detects Next.js and the npm workspace).
3. Add environment variable `NEXT_PUBLIC_API_URL` = your Render URL from
   step 3.
4. Deploy. Open the resulting Vercel URL — it should show "API status: ok".
5. Go back to Render and set `CORS_ORIGIN` to this Vercel URL, then
   redeploy the API so it accepts requests from the frontend.

That URL is what you can open on your phone to confirm the whole stack is
live.

## Scripts (from repo root)

- `npm run dev:web` / `npm run dev:api` — local dev servers
- `npm run build` — build all workspaces
- `npm run typecheck` — TypeScript checks across all workspaces
- `npm run lint` — lint both apps
- `npm run test` — run tests in both apps
