/**
 * Postgres + PostGIS integration tests for the persistent store (P2-2).
 * Runs when TEST_DATABASE_URL is set (CI provides a PostGIS service container).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import path from "path";
import { runner } from "node-pg-migrate";
import request from "supertest";
import { createPgStore } from "./store";
import { createApp } from "./app";

const url = process.env.TEST_DATABASE_URL;
const migrationsDir = path.resolve(__dirname, "db/migrations");

async function migrate(direction: "up" | "down", count = Infinity) {
  await runner({
    databaseUrl: url!,
    dir: migrationsDir,
    direction,
    count,
    migrationsTable: "pgmigrations",
    log: () => {},
  });
}

describe.skipIf(!url)("postgres store", () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    const admin = new pg.Client({ connectionString: url });
    await admin.connect();
    await admin.query("DROP TABLE IF EXISTS reports, map_features, users, sources, pgmigrations CASCADE");
    await admin.end();
    await migrate("up");
    pool = new pg.Pool({ connectionString: url });
  });

  afterAll(async () => {
    await pool?.end();
  });

  it("persists features across store instances (survives a restart)", async () => {
    const first = createPgStore(pool);
    const created = await first.insertFeature({
      sourceId: "field-survey",
      category: "camera",
      longitude: -91.4,
      latitude: 40.4,
      properties: { label: "Pole camera" },
      confidence: 0.75,
    });
    const restarted = createPgStore(pool);
    const fetched = await restarted.getFeature(created.id);
    expect(fetched).toMatchObject({
      sourceId: "field-survey",
      category: "camera",
      properties: { label: "Pole camera" },
      confidence: 0.75,
    });
    expect(fetched!.longitude).toBeCloseTo(-91.4, 6);
    expect(fetched!.latitude).toBeCloseTo(40.4, 6);
    expect((await restarted.listFeatures("camera")).some((f) => f.id === created.id)).toBe(true);
    expect((await restarted.listFeatures("incident")).some((f) => f.id === created.id)).toBe(false);
  });

  it("returns null for malformed and unknown feature ids", async () => {
    const store = createPgStore(pool);
    expect(await store.getFeature("not-a-uuid")).toBeNull();
    expect(await store.getFeature("00000000-0000-4000-8000-000000000000")).toBeNull();
  });

  it("stores reports as pending and filters by status", async () => {
    const store = createPgStore(pool);
    const report = await store.insertReport({ category: "alpr", title: "New camera", body: null, longitude: 1, latitude: 2 });
    expect(report.status).toBe("pending");
    expect(await store.listReports({ statuses: ["approved"], limit: 10 })).toHaveLength(0);
    await pool.query("UPDATE reports SET status = 'approved' WHERE id = $1", [report.id]);
    const approved = await store.listReports({ statuses: ["approved"], limit: 10 });
    expect(approved.map((r) => r.id)).toContain(report.id);
  });

  it("enforces report constraints in the database", async () => {
    await expect(
      pool.query("INSERT INTO reports (category, title, geom, status) VALUES ('x', 'y', ST_MakePoint(0,0)::geography, 'bogus')"),
    ).rejects.toThrow();
    await expect(
      pool.query("INSERT INTO reports (category, title, geom) VALUES ('x', '', ST_MakePoint(0,0)::geography)"),
    ).rejects.toThrow();
  });

  it("serves persisted submissions through the HTTP app", async () => {
    const app = createApp({
      store: createPgStore(pool),
      checkDb: async () => true,
      fetchSurveillance: async () => ({ state: "unavailable", asOf: null, elements: [] }),
      staticPath: "/nonexistent",
    });
    const created = await request(app).post("/api/features").send({ longitude: 5, latitude: 6, category: "sensor" }).expect(201);
    const res = await request(app).get(`/api/features/${created.body.id}`).expect(200);
    expect(res.body.category).toBe("sensor");
  });

  it("migration 002 rolls back and re-applies cleanly", async () => {
    await migrate("down", 1);
    const { rows } = await pool.query("SELECT to_regclass('public.reports') AS t");
    expect(rows[0].t).toBeNull();
    await migrate("up");
    const again = await pool.query("SELECT to_regclass('public.reports') AS t");
    expect(again.rows[0].t).toBe("reports");
  });
});
