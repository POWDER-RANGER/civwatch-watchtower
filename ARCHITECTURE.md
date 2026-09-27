# CIVWATCH: WATCHTOWER — Architecture Decision Record

> **Status:** Accepted  
> **Date:** 2026-09-27  
> **Decision:** Modular monolith first (evolve current scaffold). Full microservice extraction is deferred until Phase 4+ data volume and team size justify it.

---

## Context

As of the audit on 2026-09-27:

| Aspect | Docs (PIPELINES.md / ROADMAP.md) said | Repo actually had |
|--------|---------------------------------------|-------------------|
| Layout | `apps/*` + `services/*` + `workers/*` + `packages/*` + `infra/*` | `client/` + `server/` + `packages/*` (5 empty stubs) |
| Workspaces | Full monorepo with service boundaries | Root `package.json` declares `"workspaces": ["apps/*", "packages/*"]` but **no `apps/` directory exists** |
| Map engine | Mapbox GL JS v3 + custom Studio style + 3D buildings | `client/src/components/Map.tsx` is a Google Maps integration (template leftover) |
| Server | Express gateway with rate limiting, per-service routing, DB client | 25-line SPA static + fallback server; zero routes, zero DB |
| Infra | Postgres+PostGIS, Redis, Meilisearch, S3/R2 wired | `docker-compose.yml` defines the three containers; nothing connects to them |
| CI/CD | GitHub Actions as Phase 0 deliverable | No `.github/workflows/` |
| Feature code | 11 pipelines specified in detail | Zero feature code — docs only |

Commit history (7 commits) is bootstrap → scaffold → docs → pnpm workspace → docker-compose. All docs, no implementation.

---

## Decision

**We will not restructure the repository into the full microservice layout described in the original PIPELINES.md at this stage.**

### Chosen path: Modular Monolith (current scaffold evolved)

```
civwatch-watchtower/
├── client/                     # React 19 + Vite (web app) — maps to future apps/web
│   └── src/
│       ├── components/         # UI + dashboard cards + Map
│       ├── pages/
│       ├── hooks/
│       ├── lib/                # API clients, map helpers
│       └── store/              # Zustand (when needed)
├── server/                     # Express gateway + all domain routes for now
│   ├── index.ts                # Entry + middleware
│   ├── routes/                 # /api/auth, /api/map, /api/reports, ...
│   ├── db/                     # Postgres client + migrations
│   └── middleware/             # rate-limit, auth, error
├── packages/
│   ├── ui/                     # Shared components (DashCard, etc.) — already stubbed
│   ├── types/                  # Shared TS interfaces
│   ├── core/                   # Shared business logic / utils
│   ├── api-client/             # Typed fetch/websocket client
│   └── config/                 # Shared env / constants
├── workers/                    # (add when Phase 4 ETL starts) Prefect / scripts
├── docker-compose.yml          # Postgres+PostGIS, Redis, Meilisearch
├── .github/workflows/          # CI (to be added)
└── docs/                       # PIPELINES, ROADMAP, STATUS, this file
```

### Why this over immediate microservices

1. **Zero feature code exists.** Scaffolding 9 services + workers + k8s before any working map or card is pure overhead.
2. **Solo / small-team velocity.** A single Express process with clear route modules is faster to iterate and debug than 9 processes + service discovery.
3. **Extraction is still possible.** When a domain (e.g. scoring, ingest) becomes a bottleneck or needs independent scaling, extract `server/routes/X` + related logic into `services/X` and keep the same packages/ contracts. The modular boundaries we establish now become the future service boundaries.
4. **pnpm workspaces already declared.** We only need to flesh out `packages/*` and keep the client/server layout; no forced rewrite of the workspace config.
5. **Mobile (Expo) can still land as `apps/mobile` later** without forcing the rest of the tree into `apps/` today.

### Explicit non-goals for Phase 0–3

- No Kubernetes / Helm until Phase 12.
- No separate auth/map/political/etc. Node processes until a concrete scaling or isolation need appears.
- No Prefect workers until the first real ETL pipeline is written (Phase 4).

---

## Map Engine Decision (resolves conflict)

| Option | Pros | Cons |
|--------|------|------|
| **Mapbox GL JS v3 (chosen)** | 3D buildings, custom Studio styles, excellent GeoJSON + heatmap layers, matches all PIPELINES/ROADMAP language, free tier sufficient for early use | Token required, style authoring in Studio |
| Google Maps (current file) | Template already present | No first-class 3D extrusion control matching the gamified aesthetic, weaker custom basemap story, contradicts every doc |

**Decision: Mapbox.**  
`client/src/components/Map.tsx` will be rewritten to Mapbox GL JS v3 in Phase 3. The Google Maps implementation is treated as dead template code and will be deleted when the Mapbox component lands. Until then it remains as a non-functional placeholder.

---

## Target Package Boundaries (even inside the monolith)

These boundaries make later extraction cheap:

| Package / folder | Owns |
|------------------|------|
| `packages/types` | All shared interfaces (Feature, Report, Official, AnomalyScore, …) |
| `packages/ui` | DashCard, CardDrawer, MapAvatar, skeleton loaders, design tokens |
| `packages/api-client` | Typed REST + socket client used by client and (later) mobile |
| `packages/core` | Pure functions: scoring helpers, geo utils, classifiers |
| `packages/config` | Zod env schemas, constants |
| `server/routes/*` | HTTP surface; one file/folder per domain |
| `server/db` | Migrations, query helpers, PostGIS helpers |
| `client/src/components/dashboard` | Card implementations that consume `packages/ui` + `api-client` |
| `client/src/components/map` | Mapbox init, layers, CategoryBar |

---

## Migration Path (when we outgrow the monolith)

1. Extract a domain (e.g. `scoring-service`) by moving `server/routes/scoring` + related `packages/core` logic into `services/scoring`.
2. Keep the same TypeScript types and API contracts; only the process boundary changes.
3. Gateway (`server/`) becomes a thin router or is replaced by nginx / Cloudflare.
4. Workers move under `workers/` with their own Dockerfiles.
5. `apps/web` and `apps/mobile` appear when the second client is real.

Until that moment, the monorepo tree above is the source of truth.

---

## Immediate Follow-ups (post-reconciliation)

See `STATUS.md` for the living checklist. Highest leverage items:

1. Wire Postgres client + first migration into `server/`.
2. Add minimal GitHub Actions CI (typecheck + lint).
3. Flesh out `packages/types` and `packages/ui` skeletons so Phase 2 cards have a home.
4. Delete or quarantine the Google Maps `Map.tsx` comment block once Mapbox work starts.
5. Align `package.json` workspaces and add a root `pnpm-workspace.yaml` if missing.

---

*This ADR supersedes the original monorepo tree diagram in PIPELINES.md. The pipeline *behaviors* remain the same; only the process topology is simplified for the current stage of the project.*
