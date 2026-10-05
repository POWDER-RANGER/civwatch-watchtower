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


The normalized surveillance proxy treats `state=unavailable` as an upstream failure
and a valid empty snapshot as a successful feed with zero elements. Consumers should use
the explicit `state` field rather than interpreting `count=0` as an outage.


### Live ALPR tile source

Watchtower exposes `/api/civint/alpr/tiles`, proxying the current FlockHopper/DeFlock
TileJSON by default. This keeps the national ALPR dataset upstream-owned and current rather
than copying it into Watchtower. Set `CIVINT_ALPR_TILEJSON_URL` to select a compatible
TileJSON source.


---

## Public platform status — October 2026

**CIVINTELLIGENCE is live on the public web and its REST/API surface is active.**

**Public site:** https://civintelligence.onrender.com

The web platform is now the working reference implementation for the CIVWATCH ecosystem: the core application, public-data surfaces, evidence/provenance model, specialized pillars, and integration boundaries are being exercised through the deployed CIVINTELLIGENCE service.

### Applications are next

With the web application and REST contracts now active, the remaining client work is primarily **productization and platform packaging**, not rebuilding the intelligence platform from scratch. Native applications for the major target platforms are planned and will be coming soon.

The application layer can consume the same stable contracts already used by the web experience:

- **Android**
- **iOS**
- **Windows**
- **Linux**
- additional platform clients as the shared API contract matures

The existing Flutter client and service boundaries give the ecosystem a head start. Mobile/desktop applications can progressively adopt the established authentication, API, provenance, map, evidence, and desk contracts rather than duplicating backend intelligence.

### How quickly this came together

The current milestone is notable because the ecosystem moved from a multi-repository architecture and integration plan to a functioning public platform in a short development window. The difficult architectural work — ownership boundaries, public-data ingestion, REST contracts, evidence/provenance rules, Watchtower/Cell Titan integration, and the user-facing desk model — is already substantially established.

That means the next step should be treated as **client delivery on top of an operating platform**. The web application is the reference surface; native clients become additional presentation and interaction layers over the same CIVINTELLIGENCE contracts.

> **Build once at the platform layer. Deliver many clients at the edge.**

### Ecosystem rule

CIVINTELLIGENCE remains the system of record. Specialized repositories retain clear ownership of their domains, while clients consume stable public/service contracts. Legacy and predecessor repositories remain valuable migration/reference material but are not silently represented as unified production capabilities.

**Status discipline:** live means exposed and usable; available means implemented and integrated; in progress means actively being built; planned means not yet shipped. No synthetic or unavailable source is represented as live evidence.
