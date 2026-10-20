# CIVWATCH Platform

**Map and report services for the [CIVWATCH web app](https://civintelligence.onrender.com).** Repository name: `civwatch-watchtower` (internal codename; not a public product name).

The Platform serves map features, citizen reports and public-record snapshots (NWS alerts, USAspending awards, OpenStreetMap ALPR nodes) to the CIVWATCH web app. It documents public infrastructure and public records; it does not access camera feeds or track individuals.

> **Status:** Phase 0 API baseline; integration hardening merged. Automated CI validation is currently blocked by a reproducible setup/logging failure.

## Role in CIVWATCH

[CivilianIntelligence](https://github.com/POWDER-RANGER/CivilianIntelligence) (the CIVWATCH web app) is the system of record. The Platform owns:

- map feature presentation
- citizen reports
- proxy access to the web app's public alert, award, ALPR and normalized surveillance snapshots (API paths keep their `/api/civint/` prefix)
- map-oriented service health

Mapped surveillance infrastructure comes from the web app's normalized public feed. The Platform does not scrape or keep a second copy of DeFlock/FlockHopper data.

## Design system

`packages/ui` carries **CIVWATCH Design Standard v2**:

| File | Use |
|---|---|
| `packages/ui/tokens/civwatch-tokens.v2.json` | W3C DTCG 2025.10 source tokens (ops dark + editorial light) |
| `packages/ui/src/tokens.css` | The same tokens as CSS custom properties |
| `packages/ui/src/tokens.ts` | Category colors, glyphs and basemap values for Mapbox GL / MapLibre paint properties |
| `packages/ui/src/view-cone.ts` | Geodesic camera view cones (bearing + field of view + range) as GeoJSON |

Map categories always pair an Okabe-Ito color with a glyph; never encode a category by color alone.

## Quick start

~~~bash
cp .env.example .env
docker compose up -d postgres
pnpm install
pnpm migrate
pnpm dev:server
# API: http://localhost:3000
~~~

~~~bash
curl -s localhost:3000/api/health
curl -s localhost:3000/api
curl -s localhost:3000/api/features
curl -s localhost:3000/api/civint/alerts
~~~

## API

| Method | Path | Purpose |
|---|---|---|
| GET | /api/health | Service + database health |
| GET | /api | Service descriptor |
| GET | /api/features | Map features |
| POST | /api/features | Create a feature |
| GET | /api/reports | Citizen reports |
| POST | /api/reports | Submit a report |
| GET | /api/civint/alerts | CIVINT NWS snapshot proxy |
| GET | /api/civint/awards | CIVINT USAspending snapshot proxy |
| GET | /api/civint/alpr | CIVINT OSM ALPR compatibility proxy |
| GET | /api/civint/surveillance | CIVINT normalized surveillance feed proxy |

## Security

The merged integration adds:

- security response headers
- bounded JSON request bodies
- request rate limiting
- explicit CORS allowlisting
- production bearer authentication for feature/report writes
- coordinate, category, and text validation

Production configuration:

~~~dotenv
CORS_ORIGINS=https://your-approved-client.example
WATCHTOWER_WRITE_TOKEN=<strong-random-secret>
CIVINT_BASE_URL=https://raw.githubusercontent.com/POWDER-RANGER/CivilianIntelligence/main/public/civint
~~~

When NODE_ENV=production, write operations fail closed if WATCHTOWER_WRITE_TOKEN is not configured.

## Architecture

~~~text
client/
server/
  routes/
  middleware/
packages/
  types/
  config/
  core/
  api-client/
  ui/
~~~

## Integration

The CIVWATCH web app consumes:

- GET /api/health
- GET /api/features

See the [cross-repo integration contract](https://github.com/POWDER-RANGER/CivilianIntelligence/blob/main/docs/CROSS_REPO_INTEGRATION.md).

## Development status

Feature/report persistence and the full production mapping layer remain future work. The integration hardening is merged, but automated CI validation is currently blocked before executable workflow steps. Do not interpret a successful repository merge as production readiness.

See the [CI runner incident record](https://github.com/POWDER-RANGER/CivilianIntelligence/blob/main/docs/CI_RUNNER_INCIDENT_2026-10-04.md).

## Related repositories

- [CivilianIntelligence](https://github.com/POWDER-RANGER/CivilianIntelligence) — CIVWATCH web app, system of record
- [civwatch-cell-titan](https://github.com/POWDER-RANGER/civwatch-cell-titan) — CIVWATCH Cell Monitor
- [CIVWATCH](https://github.com/POWDER-RANGER/CIVWATCH) — project site and legacy source

## License

MIT


The normalized surveillance proxy treats `state=unavailable` as an upstream failure
and a valid empty snapshot as a successful feed with zero elements. Consumers should use
the explicit `state` field rather than interpreting `count=0` as an outage.


### Live ALPR tile source

The Platform exposes `/api/civint/alpr/tiles`, proxying the current FlockHopper/DeFlock
TileJSON by default. This keeps the national ALPR dataset upstream-owned and current rather
than copying it into the Platform. Set `CIVINT_ALPR_TILEJSON_URL` to select a compatible
TileJSON source.


---
