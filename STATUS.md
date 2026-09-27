# CIVWATCH: WATCHTOWER — Status & Needs List

> **Last updated:** 2026-09-27 (Phase 0 vertical slice)  
> **Phase:** 0 — Foundation (vertical slice landed)  
> **Architecture:** Modular monolith (see `ARCHITECTURE.md`)

---

## What this actually is right now

A modular-monolith scaffold with working Postgres wiring, shared packages, health canary, and CI typecheck gate. Feature pipelines remain unstarted.

---

## Sector-by-sector status

| Sector | Status |
|---|---|
| **Monorepo / workspaces** | Reconciled. `packages/*` are real workspace packages; client/server stay root code. Dead `workspaces` field removed from package.json. |
| **Packages** | `types`, `config`, `core`, `api-client` have real `src/`. `ui` export stub only (DashCard → Phase 2). |
| **Infra / Postgres** | docker-compose + `pg` pool + `node-pg-migrate` + `001_init` (sources, users, map_features + PostGIS). |
| **Server** | `GET /api/health` wired; returns 200/503 based on live DB check. |
| **CI/CD** | `.github/workflows/ci.yml` — install + `pnpm check` (covers packages/*). |
| Auth (Pipeline 9) | **0%** — users table stub only |
| Dashboard shell (Pipeline 2) | **0%** |
| Map engine (Pipeline 1) | **0%** — Mapbox chosen; Google Maps file still present as template debt |
| Data ingestion → Push / Mobile | **0%** |

---

## Phase 0 checklist

- [x] Architecture ADR + docs alignment
- [x] Config landmines (workspaces field, tsconfig include, zod on config, workspace:* deps)
- [x] Package skeletons with real `src/index.ts`
- [x] Postgres client + first migration
- [x] Health route with real DB canary
- [x] Minimal CI (typecheck)
- [ ] Local verify: `docker-compose up -d postgres` → `pnpm migrate` → `pnpm dev:server` → `curl /api/health` (operator step)

---

## What's needed next

### Remaining Phase 0 operator step
1. `cp .env.example .env`
2. `docker-compose up -d postgres`
3. `pnpm install && pnpm migrate`
4. `pnpm dev:server` then `curl -s localhost:3000/api/health`

### Phase 1 — Auth
- Supabase (or self-hosted) JWT + RLS
- Expand `users` + role middleware

### Phase 2 — Dashboard shell
- `DashCard` / `CardDrawer` in `@civwatch/ui`
- Six mocked cards

### Explicitly deferred
- Mapbox rewrite, Redis/Meilisearch clients, microservices split, DashCard this pass

---

## Bottom line

Phase 0 vertical slice is in the tree: types/config/core/api-client compose, DB migrates, health reflects real connectivity, CI typechecks packages. Close the operator loop locally, then start Phase 1 or 2.

*CIVWATCH: WATCHTOWER — 2026-09-27*
