# CIVWATCH WATCHTOWER

**Map-first civic oversight — the geospatial pillar of [CIVINTELLIGENCE](https://github.com/POWDER-RANGER/CivilianIntelligence).**

Watchtower provides the map/report service surface for public-interest signals, citizen reports, and CIVINT public snapshots.

> **Status:** Phase 0 API baseline with integration hardening staged.

## Role in the ecosystem

**CivilianIntelligence is the system of record.**

Watchtower owns:

- map features
- citizen reports
- CIVINT alert / award / ALPR proxy access
- map-oriented service health

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
| GET | /api/civint/alpr | CIVINT OSM ALPR snapshot proxy |

## Security

The integration branch adds:

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

Feature/report persistence and the full production mapping layer remain future work. This repository's README does not treat those pending phases as complete.

## Related repositories

- [CivilianIntelligence](https://github.com/POWDER-RANGER/CivilianIntelligence) — system of record
- [Cell Titan](https://github.com/POWDER-RANGER/civwatch-cell-titan) — defensive RF pillar
- [CIVWATCH](https://github.com/POWDER-RANGER/CIVWATCH) — migration source

## License

MIT
