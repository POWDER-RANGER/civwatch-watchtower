# CIVWATCH: WATCHTOWER — Development Roadmap

This document outlines the phased development approach for CIVWATCH: WATCHTOWER, aligned with the 11-pipeline architecture defined in `PIPELINES.md`, the module mapping in `MODULES.md`, and the **modular-monolith architecture decision** in `ARCHITECTURE.md`.

> **2026-09-27:** Phase 0 vertical slice landed (packages, Postgres, health, CI).

---

## Phase 0: Foundation (Weeks 1–2) — MOSTLY COMPLETE

### Monorepo & layout (reconciled)
- [x] pnpm workspaces declared at root (`pnpm-workspace.yaml` → `packages/*`)
- [x] `client/` (Vite + React) + `server/` (Express) + `packages/*` present
- [x] Architecture decision recorded (`ARCHITECTURE.md`) — modular monolith first
- [x] Flesh out `packages/types`, `packages/config`, `packages/core`, `packages/api-client` with real `src/` and exports (`ui` stub only)
- [x] Dead Yarn-style `workspaces` field removed from root `package.json`
- [x] Root `tsconfig.json` includes `packages/*/src/**/*` + path aliases for `@civwatch/*`

### Infrastructure
- [x] `docker-compose.yml` defines Postgres+PostGIS, Redis, Meilisearch
- [x] Wire Postgres client into `server/` (`server/db/pool.ts`)
- [x] First migration under `server/db/migrations/` (sources, users, map_features + PostGIS)
- [x] Env management: `.env.example` + Zod schema in `packages/config`
- [ ] Redis client (defer until rate limiting / pub-sub)
- [ ] Meilisearch client (defer until search)

### CI/CD
- [x] `.github/workflows/ci.yml` — install, typecheck (`pnpm check`)
- [ ] Branch protection / required checks (optional early)

### Documentation
- [x] PIPELINES.md, ROADMAP.md, MODULES.md, ARCHITECTURE.md, STATUS.md
- [ ] API specification (OpenAPI stub or markdown)
- [ ] Database schema documentation (generated from migrations preferred)

**Deliverable:** Working docker-compose stack, server that talks to Postgres, packages importable, minimal CI green. **In tree — confirm locally with migrate + health curl.**

---

## Phase 1: Authentication & Authorization (Weeks 3–4)

### Pipeline 9 Implementation
- [ ] Initialize Supabase project with JWT configuration (or document self-hosted alternative)
- [ ] Implement custom JWT role claim hook
- [ ] Set up Row-Level Security (RLS) policies
- [ ] Build authentication routes in `server/routes/auth.ts` with refresh token logic
- [ ] Implement role-based access control (RBAC) middleware

### User Management
- [ ] Create user profile schema and endpoints
- [ ] Build email verification workflow
- [ ] Implement password reset functionality
- [ ] Set up device token management for push notifications (stub)

**Deliverable:** Fully functional authentication system with role-based access control.

---

## Phase 2: Dashboard Foundation (Weeks 5–7)

### Pipeline 2 Implementation
- [ ] Build `DashCard` base component with glassmorphism styling (`packages/ui`)
- [ ] Implement skeleton loaders for all card types
- [ ] Create `CardDrawer` swipe-up component with Framer Motion
- [ ] Build responsive layout for map + dashboard shell
- [ ] Implement status bar (location, weather, menu)

### Components
- [ ] `EmergencyCard` (mocked data)
- [ ] `PoliticalCard` (mocked data)
- [ ] `ScannerCard` (mocked data)
- [ ] `ReportsCard` (mocked data)
- [ ] `SurveillanceCard` (mocked data)
- [ ] `WeatherCard` (mocked data)

### Styling & Theme
- [ ] Define dark theme color palette (purple/blue gamified aesthetic)
- [ ] Create Tailwind CSS design tokens
- [ ] Implement theme provider with switchable dark/light modes
- [ ] Build responsive breakpoints for mobile-first design

**Deliverable:** Complete dashboard shell with all card components (mocked data).

---

## Phase 3: Map Engine (Weeks 8–10)

### Pipeline 1 Implementation
- [ ] Set up Mapbox GL JS v3 integration (replace Google Maps template in `Map.tsx`)
- [ ] Create custom Mapbox Studio style (dark purple/blue, 3D buildings)
- [ ] Implement 3D building extrusion layer
- [ ] Build custom avatar marker component with glow effects
- [ ] Create category layer toggle bar (Incidents, Reports, Cameras, Officials, Footsteps, History)

### Map Features
- [ ] Implement bbox-based GeoJSON feature fetching (`server/routes/map.ts`)
- [ ] Build incident circle layer
- [ ] Build camera heatmap layer
- [ ] Build report pin layer
- [ ] Implement weather overlay integration (Tomorrow.io)
- [ ] Build real-time WebSocket feature updates

### Interactions
- [ ] Implement map click-to-report location picker
- [ ] Build feature detail popups
- [ ] Implement zoom/pan animations
- [ ] Add map state persistence

**Deliverable:** Fully functional 3D map with all civic data layers and real-time updates.

---

## Phase 4: Data Ingestion & Storage (Weeks 11–13)

### Pipeline 7 Implementation
- [ ] Set up ETL orchestration (Prefect or equivalent scripts under `workers/`)
- [ ] Build FEC / ProPublica / OpenSecrets / FollowTheMoney / USASpending / NOAA / AirNow ingest
- [ ] Implement deduplication and normalization logic
- [ ] Cron, retries, monitoring, data quality checks

**Deliverable:** Automated data ingestion with Postgres populated with civic data.

---

## Phase 5–13

Unchanged in substance from prior ROADMAP (Political Finance → Launch). See git history for full text of Phases 5–13 if needed; priorities remain sequential after Phase 0 close-out.

---

## Key Milestones

| Milestone | Target | Criteria |
|---|---|---|
| Architecture reconciled | Done (2026-09-27) | ADR + STATUS + aligned docs |
| Phase 0 vertical slice | Done (2026-09-27) | Packages, migrate, health, CI in tree |
| Foundation verified locally | Operator | migrate + health 200/503 proven |
| Auth System Live | Week 4 | JWT + RBAC functional |
| Dashboard MVP | Week 7 | All cards rendered, mocked data |
| Map Engine Live | Week 10 | Mapbox 3D + layers |
| … | … | (see prior roadmap for later milestones) |

---

## Next Steps (immediate)

1. Locally: `docker-compose up -d postgres` → `pnpm install` → `pnpm migrate` → `pnpm dev:server` → verify `/api/health`.
2. Confirm GitHub Actions is green on this commit.
3. Begin Phase 1 (Auth) or Phase 2 (Dashboard shell).

For detailed implementation guidance, refer to `PIPELINES.md` and `ARCHITECTURE.md`.
