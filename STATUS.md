# CIVWATCH: WATCHTOWER — Status & Needs List

> **Last updated:** 2026-09-27 (architecture reconciliation)  
> **Phase:** 0 — Foundation (incomplete)  
> **Architecture:** Modular monolith (see `ARCHITECTURE.md`)

---

## What this actually is right now

A **scaffold, not a build**. Fresh Manus/Replit-style Vite+React+Express template with the docs for an 11-pipeline civic-intel platform written on top of it. Docs and code were disconnected; architecture has now been reconciled.

**Commit history (pre-reconciliation):** bootstrap → scaffold → roadmap/pipelines docs → monorepo doc → pnpm workspace setup → docs reconciliation → docker-compose. All docs and empty structure, zero feature code.

---

## Sector-by-sector status (post-reconciliation)

| Sector | Doc says | Repo has | Status |
|---|---|---|---|
| **Monorepo / workspaces** | Modular monolith: `client/`, `server/`, `packages/*` (ADR) | `client/`, `server/`, `packages/*` (5 empty stubs — package.json+tsconfig only, no `src/`) | **Reconciled.** Docs now match tree. Stubs still empty. |
| Auth (Pipeline 9) | Supabase JWT, RLS, RBAC | Nothing | **0%** |
| Dashboard shell (Pipeline 2) | DashCard, CardDrawer, 6 card types, glassmorphism | `Home.tsx` is unmodified template placeholder | **0%** — shadcn/ui primitives installed (50+ `components/ui/*.tsx`), nothing built on top |
| Map engine (Pipeline 1) | Mapbox GL JS v3, 3D buildings, custom style | `Map.tsx` is Google Maps template leftover (will be replaced) | **0%** — Mapbox chosen in ADR |
| Data ingestion (Pipeline 7) | Prefect ETL, FEC/ProPublica/OpenSecrets/USASpending/NOAA/AirNow workers | Nothing | **0%** |
| Political finance (Pipeline 4) | Postgres schema, FEC/OpenSecrets APIs, anomaly scoring, official profiles | Nothing | **0%** |
| Communications log (Pipeline 3, slimmed) | NOAA alert stream, ScannerCard | Nothing | **0%** |
| Citizen reports (Pipeline 5) | Submission form, S3 upload, PostGIS storage, moderation | Nothing | **0%** |
| Surveillance mapping (Pipeline 6) | Overpass scraper, EFF Atlas CSV, DBSCAN dedup | Nothing | **0%** |
| Anomaly detection (Pipeline 8) | IsolationForest, DBSCAN clustering, scoring | Nothing | **0%** |
| Push notifications (Pipeline 10) | FCM/APNs, geofencing | Nothing | **0%** |
| Mobile (Pipeline 11 partial) | Expo 52 app | Nothing | **0%** |
| Infra | Postgres+PostGIS, Redis, Meilisearch, S3/R2 | `docker-compose.yml` has the three containers — no schema, no migrations, no seed, server has zero DB client | **Container defs only** |
| CI/CD | GitHub Actions (Phase 0 deliverable) | No `.github/workflows/` | **0%** |
| Server | Express with routes, middleware, DB | `server/index.ts` is 25 lines: static + SPA fallback | **Boilerplate only** |

---

## Architecture reconciliation (done)

| Item | Decision |
|------|----------|
| Process topology | **Modular monolith** — keep `client/` + `server/` + `packages/*`. Do **not** scaffold `apps/*` / `services/*` / `workers/*` until a real need appears. |
| Map engine | **Mapbox GL JS v3** (docs were correct; Google Maps file is template debt). |
| Extraction path | Documented in `ARCHITECTURE.md`. Domains can be lifted into services later without rewriting contracts. |
| Docs alignment | `ARCHITECTURE.md` (new ADR), this `STATUS.md`, and updates to `PIPELINES.md` + `ROADMAP.md` Phase 0. |

---

## What's needed next (prioritized)

### P0 — Finish Phase 0 foundation (do these before any feature code)

1. **Wire infra that already exists**
   - Add Postgres client (`pg` or Drizzle/Kysely) to `server/`
   - First migration: core tables (users stub, map_features, sources)
   - Connect server to docker-compose Postgres; health-check endpoint that pings DB
   - Env management: `.env.example` + Zod validation in `packages/config`

2. **Minimal CI**
   - `.github/workflows/ci.yml`: `pnpm install` → `pnpm check` (tsc) → optional lint
   - No deploy jobs yet

3. **Package skeletons**
   - Give `packages/types`, `packages/ui`, `packages/core`, `packages/api-client`, `packages/config` a real `src/index.ts` and proper exports so Phase 2 can import them
   - Fix root workspace config if `pnpm-workspace.yaml` is missing or incomplete

4. **Quarantine Map.tsx conflict**
   - Leave Google Maps file in place for now (or move to `_legacy/`) so it does not block other work
   - Ticket / note that Phase 3 replaces it with Mapbox

### P1 — Phase 1 (Auth) and Phase 2 (Dashboard shell)

- Supabase project + JWT + RLS (or self-hosted equivalent if preferred)
- `DashCard` + `CardDrawer` + 6 mocked cards using `packages/ui`
- Status bar + responsive map+drawer layout

### P2 — Phase 3 (Mapbox) and Phase 4 (first real data)

- Mapbox account + Studio style + rewrite of map component
- First ETL (NOAA or FEC) so cards and map have live data

### Explicitly deferred

- Full `services/*` microservice split
- Kubernetes / Helm
- RTL-SDR / faster-whisper scanner pipeline (slimmed Pipeline 3 stays NOAA-only for now)
- Mobile Expo app until web dashboard has real data

---

## Suggestions for moving forward

1. **Treat `ARCHITECTURE.md` as the source of truth for layout.** Any new folder that is not under `client/`, `server/`, `packages/`, or a future `workers/`/`apps/mobile` should be justified against the ADR.
2. **One vertical slice before breadth.** Prefer: Postgres up → one health route → one mocked DashCard → one Mapbox map with a single GeoJSON layer. That proves the whole stack works before writing the other 10 pipelines.
3. **Keep docs in lockstep.** When a Phase checklist item is completed, update this STATUS.md and the corresponding ROADMAP checkbox in the same commit.
4. **Do not invent microservices to match the old diagram.** If a domain grows painful, extract it then; the modular boundaries already defined make that a rename + process split, not a rewrite.
5. **Mapbox token and Studio style are the critical path for the “wow” surface.** Get the free token and a dark purple/blue style early so Phase 3 is not blocked on account setup.

---

## Bottom line

Phase 0 is still incomplete, but the single highest-leverage blocker (docs vs tree disagreement) is resolved. Every subsequent file can now be written against a single, agreed layout. Next concrete work: wire the existing docker-compose Postgres into `server/`, add the first migration, and land minimal CI.

*CIVWATCH: WATCHTOWER — living status after architecture reconciliation, 2026-09-27*
