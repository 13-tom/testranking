# Board Ranking

India's competitive ranking platform for CBSE students. Monorepo: Next.js
frontend, Express API, Prisma/Postgres, Redis.

See `CLAUDE.md` for coding standards and the milestone roadmap (M1
scaffolding → M2 auth → M3 question bank → M4 test engine → M5 ranking →
M6 analytics → M7 polish). This README covers **M1**: a working skeleton
with one real check — a landing page that confirms the frontend, API,
database, and cache are all connected.

## Project layout

```
apps/
  web/      Next.js frontend (Vercel)
  api/      Express API (Render)
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
