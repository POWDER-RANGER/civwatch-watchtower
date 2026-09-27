# CIVWATCH: WATCHTOWER — Status & Needs List

> **Last updated:** 2026-09-27 (Phase 0 close-out fixes)  
> **Phase:** 0 — Foundation (vertical slice + env load path)  
> **Architecture:** Modular monolith (see `ARCHITECTURE.md`)

---

## What this actually is right now

A modular-monolith scaffold with working Postgres wiring, shared packages, health canary, CI typecheck gate, and `.env` loading for both server and migrations.

---

## Sector-by-sector status

| Sector | Status |
|---|---|
| **Monorepo / workspaces** | Reconciled. `packages/*` are real workspace packages; client/server stay root code. |
| **Packages** | `types`, `config`, `core`, `api-client` have real `src/`. `ui` export stub only (DashCard → Phase 2). |
| **Infra / Postgres** | docker-compose + `pg` pool + `node-pg-migrate` + `001_init`. `.env` loaded via dotenv (config) and `--envPath .env` (migrate). |
| **Server** | `GET /api/health` wired; returns 200/503 based on live DB check. |
| **CI/CD** | `.github/workflows/ci.yml` — install + `pnpm check`. |
| Auth → Mobile pipelines | **0%** |

---

## Phase 0 checklist

- [x] Architecture ADR + docs alignment
- [x] Config landmines fixed
- [x] Package skeletons with real `src/index.ts`
- [x] Postgres client + first migration
- [x] Health route with real DB canary
- [x] Minimal CI (typecheck) — green after api-client Vite decoupling
- [x] `.env` load path for migrate (`--envPath .env`) and server (`dotenv` in `@civwatch/config`)
- [ ] Operator: commit regenerated `pnpm-lock.yaml`; restore CI `--frozen-lockfile` when ready

---

## Documented close-out (should work end-to-end)

```bash
cp .env.example .env
docker-compose up -d postgres   # or local Postgres matching DATABASE_URL
pnpm install
pnpm migrate
pnpm dev:server
curl -s localhost:3000/api/health   # expect 200, db: ok
```

Stop Postgres → expect `503` and `"db":"error"`.

---

## What's next

- Phase 1 Auth or Phase 2 Dashboard shell
- Commit lockfile after `pnpm install` picks up `dotenv`

*CIVWATCH: WATCHTOWER — 2026-09-27*
