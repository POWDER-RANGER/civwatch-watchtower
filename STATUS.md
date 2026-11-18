# WATCHTOWER — operational status

**Updated:** 2026-10-24
**Phase:** 0 foundation + API shell
**Architecture:** Integrated into the CIVINTELLIGENCE system of record
**Validation:** CI green on `main` (typecheck; tests, coverage gate and build added in this change)
**Upstream:** [CivilianIntelligence](https://github.com/POWDER-RANGER/CivilianIntelligence)

## Done

- [x] Modular monorepo (`packages/*`, client, server)
- [x] Postgres / PostGIS via docker-compose + health canary
- [x] `GET /api/health` live DB check
- [x] Shared types, config, core geo helpers
- [x] CI typecheck workflow defined
- [x] **Features API** — list/create map features
- [x] **Reports API** — citizen report intake
- [x] **CIVINT proxy** — alerts / awards / alpr soft-load
- [x] **Home dashboard** — metrics + feature list wired to API
- [x] README aligned with CIVINTELLIGENCE baseline
- [x] Integration hardening merged into `main`

## Validation

The 2026-10-04 CI runner blocker is resolved: CI runs on `main` complete successfully since 2026-10-20. Historical incident record: [CivilianIntelligence CI runner incident](https://github.com/POWDER-RANGER/CivilianIntelligence/blob/main/docs/CI_RUNNER_INCIDENT_2026-10-04.md).

## Next

- [x] Resolve CI runner/setup/logging blocker
- [x] Persist features/reports in Postgres (migration 002; survives restart, verified)
- [x] Test suite: 36 Vitest tests incl. PostGIS integration, 90% line coverage, 80% gate in CI
- [x] Citizen reports moderated: anonymous readers see approved reports only
- [ ] Mapbox/MapLibre canvas with feature layers
- [ ] Auth gate for report moderation
- [ ] Import `alpr_overpass.json` as native camera features
- [ ] Commit regenerated `pnpm-lock.yaml` when operators run local `pnpm install`

## Runbook

~~~bash
cp .env.example .env
docker compose up -d postgres
pnpm install
pnpm dev:server
curl -s localhost:3000/api/health
curl -s localhost:3000/api/features
~~~
