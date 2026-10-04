# WATCHTOWER — operational status

**Updated:** 2026-10-04
**Phase:** 0 foundation + API shell
**Architecture:** Integrated into the CIVINTELLIGENCE system of record
**Validation:** **CI/CD blocked at job initialization / log availability**
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

## Validation blocker

The primary CI job currently creates a GitHub Actions job and then fails before reporting executable steps. The same failure was reproduced on the integration PR and on `main`.

Observed evidence:

- PR CI run `37178951215`, job `111367384263`
- Post-merge CI run `37179131159`, job `111368723414`
- Job logs are unavailable at the repository layer and prior retrieval returned `BlobNotFound`
- Watchtower dependency/security automation has executed successfully, so this is not evidence of a complete repository-wide Actions outage

**Do not modify workflow YAML solely to chase this symptom.** The next trustworthy milestone is a CI run that reaches setup/checkout and produces usable logs.

Central incident record: [CivilianIntelligence CI runner incident](https://github.com/POWDER-RANGER/CivilianIntelligence/blob/main/docs/CI_RUNNER_INCIDENT_2026-10-04.md).

## Next

- [ ] Resolve CI runner/setup/logging blocker
- [ ] Persist features/reports in Postgres (replace in-memory stores)
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
