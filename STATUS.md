# WATCHTOWER — operational status

**Updated:** 2026-10-03
**Phase:** 0 foundation + API shell
**Upstream:** [CivilianIntelligence](https://github.com/POWDER-RANGER/CivilianIntelligence)

## Done

- [x] Modular monorepo (`packages/*`, client, server)
- [x] Postgres / PostGIS via docker-compose + health canary
- [x] `GET /api/health` live DB check
- [x] Shared types, config, core geo helpers
- [x] CI typecheck workflow
- [x] **Features API** — list/create map features
- [x] **Reports API** — citizen report intake
- [x] **CIVINT proxy** — alerts / awards / alpr soft-load
- [x] **Home dashboard** — metrics + feature list wired to API
- [x] README aligned with CIVINTELLIGENCE baseline

## Next

- [ ] Persist features/reports in Postgres (replace in-memory stores)
- [ ] Mapbox/MapLibre canvas with feature layers
- [ ] Auth gate for report moderation
- [ ] Import `alpr_overpass.json` as native camera features
- [ ] Commit regenerated `pnpm-lock.yaml` when operators run local `pnpm install`

## Runbook

```bash
cp .env.example .env
docker compose up -d postgres
pnpm install
pnpm dev:server
curl -s localhost:3000/api/health
curl -s localhost:3000/api/features
```
