# CIVWATCH WATCHTOWER

**Map-first civic oversight — the geospatial pillar of [CIVINTELLIGENCE](https://github.com/POWDER-RANGER/CivilianIntelligence).**

Watchtower provides the map/report service surface for public-interest signals, citizen reports, and CIVINT public snapshots.

> **Status:** Phase 0 API baseline; integration hardening merged. Automated CI validation is currently blocked by a reproducible setup/logging failure.

## Role in the ecosystem

**CivilianIntelligence is the system of record.**

Watchtower owns:

- map feature presentation
- citizen reports
- CIVINT alert / award / ALPR / normalized-surveillance proxy access
- map-oriented service health

Mapped surveillance infrastructure is sourced from CIVINT's normalized public feed. Watchtower does not scrape or
maintain a second copy of DeFlock/FlockHopper databases.

The unified hub can consume Watchtower health and feature data server-side.

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

CIVINTELLIGENCE consumes:

- GET /api/health
- GET /api/features

See the [cross-repo integration contract](https://github.com/POWDER-RANGER/CivilianIntelligence/blob/main/docs/CROSS_REPO_INTEGRATION.md).

## Development status

Feature/report persistence and the full production mapping layer remain future work. The integration hardening is merged, but automated CI validation is currently blocked before executable workflow steps. Do not interpret a successful repository merge as production readiness.

See the [CI runner incident record](https://github.com/POWDER-RANGER/CivilianIntelligence/blob/main/docs/CI_RUNNER_INCIDENT_2026-10-04.md).

## Related repositories

- [CivilianIntelligence](https://github.com/POWDER-RANGER/CivilianIntelligence) — system of record
- [Cell Titan](https://github.com/POWDER-RANGER/civwatch-cell-titan) — defensive RF pillar
- [CIVWATCH](https://github.com/POWDER-RANGER/CIVWATCH) — migration source

## License

MIT
