# CIVWATCH: WATCHTOWER — Development Roadmap

This document outlines the phased development approach for CIVWATCH: WATCHTOWER, aligned with the 11-pipeline architecture defined in `PIPELINES.md`, the module mapping in `MODULES.md`, and the **modular-monolith architecture decision** in `ARCHITECTURE.md`.

> **2026-09-27 update:** Phase 0 checklist revised to match the reconciled architecture (client/server + packages/*, not full microservices). Map engine locked to Mapbox.

---

## Phase 0: Foundation (Weeks 1–2) — IN PROGRESS

### Monorepo & layout (reconciled)
- [x] pnpm workspaces declared at root
- [x] `client/` (Vite + React) + `server/` (Express) + `packages/*` stubs present
- [x] Architecture decision recorded (`ARCHITECTURE.md`) — modular monolith first
- [ ] Flesh out `packages/types`, `packages/ui`, `packages/core`, `packages/api-client`, `packages/config` with real `src/` and exports
- [ ] Ensure `pnpm-workspace.yaml` (if required) and workspace globs are correct
- [ ] Shared TypeScript config that packages can extend

### Infrastructure
- [x] `docker-compose.yml` defines Postgres+PostGIS, Redis, Meilisearch
- [ ] Wire Postgres client into `server/` (connection pool + health check)
- [ ] First SQL migration(s) under `server/db/migrations/`
- [ ] Env management: `.env.example` + Zod schema in `packages/config`
- [ ] Redis client available to server (optional for Phase 0, required before rate limiting)
- [ ] Meilisearch client stub (can wait until search is needed)

### CI/CD
- [ ] `.github/workflows/ci.yml` — install, typecheck (`pnpm check`), optional lint
- [ ] Branch protection / required checks (optional early)

### Documentation
- [x] PIPELINES.md, ROADMAP.md, MODULES.md, ARCHITECTURE.md, STATUS.md
- [ ] API specification (OpenAPI stub or markdown)
- [ ] Database schema documentation (generated from migrations preferred)

**Deliverable**: Working docker-compose stack, server that can talk to Postgres, packages importable, minimal CI green.

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

**Deliverable**: Fully functional authentication system with role-based access control.

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

**Deliverable**: Complete dashboard shell with all card components (mocked data).

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

**Deliverable**: Fully functional 3D map with all civic data layers and real-time updates.

---

## Phase 4: Data Ingestion & Storage (Weeks 11–13)

### Pipeline 7 Implementation
- [ ] Set up ETL orchestration (Prefect or equivalent scripts under `workers/`)
- [ ] Build FEC candidate and transaction ingest workers
- [ ] Build ProPublica Congress voting record ingest
- [ ] Build OpenSecrets contribution ingest
- [ ] Build FollowTheMoney state-level finance ingest
- [ ] Build USASpending federal contracts ingest
- [ ] Build NOAA weather alerts ingest
- [ ] Build AirNow AQI ingest
- [ ] Implement deduplication and normalization logic

### Scheduling
- [ ] Configure cron jobs for all ETL pipelines
- [ ] Implement retry logic and error handling
- [ ] Build monitoring and alerting for failed jobs
- [ ] Create data quality validation checks

**Deliverable**: Automated data ingestion with Postgres populated with civic data.

---

## Phase 5: Political Finance Tracker (Weeks 14–16)

### Pipeline 4 Implementation
- [ ] Build Postgres schema (officials, transactions, voting_records)
- [ ] Implement FEC API integration
- [ ] Implement OpenSecrets API integration
- [ ] Implement ProPublica Congress API integration
- [ ] Build official profile page with full detail view
- [ ] Implement donor network graph visualization (D3 or Cytoscape.js)
- [ ] Build voting record timeline

### Anomaly Detection
- [ ] Implement IsolationForest donation anomaly scorer
- [ ] Build transparency score computation
- [ ] Implement dark money ratio calculation
- [ ] Build industry concentration analysis

### UI Components
- [ ] Wire `PoliticalCard` to live API data
- [ ] Build official search and filtering
- [ ] Implement jurisdiction-based filtering
- [ ] Build donation trend charts

**Deliverable**: Complete political finance tracking with anomaly detection and detailed official profiles.

---

## Phase 6: Communications Log (NOAA Only) (Weeks 17–18)

### Slimmed Pipeline 3 Implementation
- [ ] Build historical log API for NOAA alerts with pagination
- [ ] Implement confidence scoring and filtering for alerts

### UI Components
- [ ] Wire `ScannerCard` to live NOAA alert stream
- [ ] Build alert detail view
- [ ] Implement alert search and filtering
- [ ] Build alert timeline visualization

**Deliverable**: Live communications log focused on NOAA weather alerts.

---

## Phase 7: Citizen Reports (Weeks 19–21)

### Pipeline 5 Implementation
- [ ] Build report submission form (React)
- [ ] Implement file upload to S3/R2
- [ ] Build Postgres report storage with PostGIS location
- [ ] Implement auto-classifier (keyword matching → type)
- [ ] Build admin moderation panel
- [ ] Implement WebSocket fan-out for approved reports
- [ ] Build community upvote/downvote system

### Moderation
- [ ] Build moderation queue UI
- [ ] Implement report approval/rejection workflow
- [ ] Build report edit functionality
- [ ] Implement rate limiting (Redis sliding window)

### UI Components
- [ ] Wire `ReportsCard` to live report stream
- [ ] Build report detail view
- [ ] Implement report history feed (paginated, filterable)
- [ ] Build anonymous submission mode

**Deliverable**: Complete community reporting system with moderation and real-time updates.

---

## Phase 8: Surveillance Mapping & Visualizations (Weeks 22–24)

### Pipeline 6 Implementation
- [ ] Build OpenStreetMap Overpass scraper
- [ ] Load EFF Atlas of Surveillance CSV data
- [ ] Wire community report `surveillance_camera` type
- [ ] Build DBSCAN deduplication worker (50m clustering)
- [ ] Build surveillance density GeoJSON endpoint

### Map Integration
- [ ] Build Mapbox heatmap layer for camera density
- [ ] Build individual camera pin layer
- [ ] Implement camera detail popup (operator, type, confirmations)
- [ ] Build FOIA request template generator

### UI Components
- [ ] Wire `SurveillanceCard` to live camera data
- [ ] Build camera registry browser
- [ ] Implement FOIA letter generation

**Deliverable**: Complete surveillance mapping with community contributions and FOIA support.

---

## Phase 9: Anomaly Detection & Scoring (Weeks 25–26)

### Pipeline 8 Implementation
- [ ] Implement DBSCAN incident clustering
- [ ] Build emergency hotspot detection
- [ ] Implement neutral scoring rubric for officials
- [ ] Build FEC filing completeness checker
- [ ] Implement voting attendance rate calculator
- [ ] Build dark money ratio computation

### Batch Jobs
- [ ] Implement daily anomaly scoring job
- [ ] Build cluster detection and notification
- [ ] Create scoring dashboard for admins

**Deliverable**: Automated anomaly detection and neutral scoring system.

---

## Phase 10: Push Notifications (Week 27)

### Pipeline 10 Implementation
- [ ] Set up Firebase Cloud Messaging (FCM)
- [ ] Implement APNs via Expo for iOS
- [ ] Build geofenced alert logic (PostGIS queries)
- [ ] Implement push notification service

### Triggers
- [ ] High-confidence scanner events (fire/ems/police, >0.7 confidence) → 2km radius
- [ ] Approved community reports within 1km of user location
- [ ] High-severity incident clusters (>5 events, severity >3) → 5km radius
- [ ] NOAA emergency weather alerts for user's county

### UI Components
- [ ] Build notification settings panel
- [ ] Implement notification history
- [ ] Build notification detail views

**Deliverable**: Real-time push notifications with geofencing and user preferences.

---

## Phase 11: Mobile Application (Weeks 28–32)

### Expo Setup
- [ ] Initialize Expo 52 project under `apps/mobile` with file-based routing
- [ ] Configure iOS and Android build profiles
- [ ] Set up EAS (Expo Application Services)

### Components
- [ ] Port dashboard components to React Native
- [ ] Build native map integration (Mapbox GL Native)
- [ ] Implement native gesture handling
- [ ] Build native notification handling

### Features
- [ ] Implement offline-first data sync
- [ ] Build background location tracking
- [ ] Implement push notification integration
- [ ] Build app store submission workflow

**Deliverable**: Production-ready iOS and Android applications.

---

## Phase 12: Deployment & Scaling (Weeks 33–36)

### Packaging
- [ ] Build Docker images for client + server (+ workers if present)
- [ ] Create Kubernetes Helm charts **only if** multi-service extraction has begun
- [ ] Set up Cloudflare Pages (or equivalent) for web frontend
- [ ] Configure production CI/CD GitHub Actions workflows
- [ ] Implement blue-green or rolling deployment strategy

### Monitoring & Observability
- [ ] Set up application performance monitoring (APM)
- [ ] Implement centralized logging
- [ ] Build alerting and incident response
- [ ] Create runbooks for common issues

### Documentation
- [ ] Complete API documentation (OpenAPI/Swagger)
- [ ] Write deployment guides
- [ ] Create troubleshooting guides
- [ ] Document architecture decisions (ADRs)

**Deliverable**: Production-ready deployment with monitoring and observability.

---

## Phase 13: Launch & Iteration (Weeks 37+)

### Beta Launch
- [ ] Soft launch to limited user group
- [ ] Collect feedback and iterate
- [ ] Monitor system performance and stability
- [ ] Fix critical bugs and issues

### Post-Launch
- [ ] Public launch and marketing
- [ ] Community engagement and moderation
- [ ] Continuous feature development
- [ ] Regular security audits and updates

---

## Key Milestones

| Milestone | Target | Criteria |
|---|---|---|
| Architecture reconciled | Done (2026-09-27) | ADR + STATUS + aligned docs |
| Foundation Complete | Week 2 | Packages exportable, Postgres wired, CI green |
| Auth System Live | Week 4 | User authentication and RBAC functional |
| Dashboard MVP | Week 7 | All cards rendered, mocked data working |
| Map Engine Live | Week 10 | Mapbox 3D map with layers and real-time updates |
| Data Pipeline Running | Week 13 | Postgres populated with civic data |
| Political Finance Live | Week 16 | Official profiles, anomaly detection working |
| Communications Log Live | Week 18 | NOAA alerts integrated and streaming |
| Citizen Reports Live | Week 21 | Moderation system and map pins working |
| Surveillance Mapping Live | Week 24 | Heatmap and camera registry live |
| Anomaly Detection Live | Week 26 | Scoring and clustering operational |
| Push Notifications Live | Week 27 | Geofenced alerts firing correctly |
| Mobile App Submitted | Week 32 | iOS and Android apps submitted to stores |
| Production Deploy | Week 36 | Services running in production |
| Public Launch | Week 37+ | Beta launch to community |

---

## Success Metrics

- **System Uptime**: 99.5% availability for core services
- **Data Freshness**: Political data updated daily, scanner events within 30 seconds
- **User Engagement**: 10,000+ monthly active users within 6 months
- **Report Quality**: 95%+ accuracy on community reports after moderation
- **Performance**: Map loads in <2 seconds, dashboard cards render in <500ms
- **Security**: Zero critical vulnerabilities, regular penetration testing
- **Community**: 1,000+ verified reporters, active moderation team

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Data source API changes | High | Monitor API status pages, build abstraction layer |
| Scanner hardware failures | High | Redundant RTL-SDR setup, Broadcastify fallback (when enabled) |
| Database performance | High | PostGIS indexing, TimescaleDB for time-series if needed |
| Moderation overload | Medium | Auto-classification, community verification system |
| Privacy concerns | High | Anonymization options, clear data policies |
| Regulatory compliance | High | Legal review, GDPR/CCPA compliance |
| Premature microservices | Medium | Follow ADR; extract only on proven need |

---

## Resource Requirements

### Team Composition (aspirational)
- **Backend Engineers**: 2–3 (Node.js, Python, PostgreSQL)
- **Frontend Engineers**: 2 (React, React Native)
- **DevOps Engineer**: 1 (Docker, Kubernetes, CI/CD)
- **Data Engineer**: 1 (ETL, data quality)
- **Product Manager**: 1
- **Community Manager**: 1
- **Legal/Compliance**: 1 (part-time)

### Infrastructure Costs (Estimated Monthly, early stage)
- PostgreSQL + PostGIS: $0–200 (local / small managed)
- Redis: $0–50
- S3/R2 Storage: $5–50
- Mapbox: $0–200 (free tier first)
- Tomorrow.io Weather: $0–100
- Firebase/APNs: $0–50
- Hosting: $20–200
- **Total early**: ~$25–650/month

---

## Next Steps (immediate)

1. Complete remaining Phase 0 items in `STATUS.md` (Postgres wire-up, package skeletons, CI).
2. Begin Phase 1 (Auth) once Phase 0 checklist is green.
3. Keep docs and code in the same commit whenever a Phase item is finished.

For detailed implementation guidance, refer to `PIPELINES.md` and `ARCHITECTURE.md`.
