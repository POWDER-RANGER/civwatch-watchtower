# CIVWATCH WATCHTOWER

**Map-first civic oversight** — the geospatial pillar of [CIVINTELLIGENCE](https://github.com/POWDER-RANGER/CivilianIntelligence).

Aggregates public-interest signals, citizen reports, and CIVINT snapshots (NWS alerts, federal surveillance awards, OSM ALPR points) onto a situational dashboard. Neutral scoring. Traceable sources. Defensive use only.

> Status: **Phase 0 complete + operational API shell** — Postgres health canary, feature/report APIs, CIVINT soft-proxy, map-ready home surface.

## Quick start

```bash
cp .env.example .env
docker compose up -d postgres   # PostGIS 16
pnpm install
pnpm migrate                    # if scripts defined
pnpm dev:server                 # API on :3000
# optional Vite client
pnpm dev
```

```bash
curl -s localhost:3000/api/health
curl -s localhost:3000/api
curl -s localhost:3000/api/features
curl -s localhost:3000/api/civint/alerts
```

## API (current)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Process + DB canary |
| GET | `/api` | Service descriptor |
| GET/POST | `/api/features` | Map features (in-memory seed + write) |
| GET/POST | `/api/reports` | Citizen reports queue |
| GET | `/api/civint/alerts` | Soft-load CIVINT NWS alerts |
| GET | `/api/civint/awards` | Soft-load USAspending awards |
| GET | `/api/civint/alpr` | Soft-load OSM ALPR snapshot |

CIVINT base URL override: `CIVINT_BASE_URL` (default: CivilianIntelligence `public/civint` on `main`).

In production, `POST /api/features` and `POST /api/reports` require `Authorization: Bearer <WATCHTOWER_WRITE_TOKEN>`. Configure `CORS_ORIGINS` only for browser clients that need cross-origin access.

## Architecture

```
client/          React + Vite dashboard (Home situational surface)
server/          Express API
  routes/        health, features, reports, civint
packages/
  types/         shared domain types
  config/        env (zod + dotenv)
  core/          haversine, confidence normalize
  api-client/    typed fetch helpers
  ui/            shared UI stubs
```

See [ARCHITECTURE.md](./ARCHITECTURE.md), [MODULES.md](./MODULES.md), [STATUS.md](./STATUS.md).

## Integration

CivilianIntelligence is the system of record. See its [cross-repo integration contract](https://github.com/POWDER-RANGER/CivilianIntelligence/blob/main/docs/CROSS_REPO_INTEGRATION.md) for runtime wiring and release gates.

## Principles

- Public-interest first; neutral analysis over spin
- Evidence-based — every layer cites a source type
- Soft-fail remote feeds so the tower stays up
- **Defensive only** — community awareness, not targeting

## Consolidation

Watchtower merges into CIVINTELLIGENCE as the map/oversight module. Charter:
https://github.com/POWDER-RANGER/CivilianIntelligence/blob/main/docs/CIVINTELLIGENCE.md

## License

MIT — built for citizens, by citizens.
