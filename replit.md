# AI Coder

An AI-powered coding assistant that lets users chat with an LLM to generate, explain, and improve code.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/ai-coder/` — React + Vite frontend (chat UI)
- `artifacts/api-server/` — Express 5 backend (AI proxy, sessions)
- `lib/db/` — Drizzle ORM schema and migrations
- `lib/api-spec/` — OpenAPI spec + generated hooks/schemas
- `render.yaml` — Render deployment config (infra-as-code)

## Architecture decisions

- Contract-first API: OpenAPI spec in `lib/api-spec` drives codegen for React Query hooks and Zod schemas
- Single monorepo with pnpm workspaces; frontend and API deploy as separate Render services
- GROQ API used for LLM inference (fast, free tier available)

## Product

- AI chat interface where users type prompts and get code/explanations back from an LLM
- Backend proxies requests to GROQ so the API key is never exposed to the browser

## Deployment (Render)

Services created via Render API on 2026-06-07:

| Service | Type | URL | Render ID |
|---------|------|-----|-----------|
| `ai-coder-api` | Node.js web service | https://ai-coder-api.onrender.com | srv-d8igk2tckfvc73bptnu0 |
| `ai-coder-frontend` | Static site | https://ai-coder-frontend.onrender.com | srv-d8igjvmrnols73bn2hm0 |

Both services auto-deploy from `main` branch of `https://github.com/sunam0809/ai-coder`.

API service env vars set: `NODE_ENV=production`, `PORT=10000`, `SESSION_SECRET`, `GROQ_API_KEY`, `DATABASE_URL`.

> **Note**: `DATABASE_URL` currently points to Replit's internal Helium DB, which is unreachable from Render.
> A public Postgres instance (Render Postgres, Neon, or Supabase) is needed for production persistence.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Replit's `DATABASE_URL` is an internal Helium DB URL — not accessible from Render or any external host
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes before building

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
