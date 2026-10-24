import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app";
import { createMemoryStore, type WatchtowerStore } from "./store";
import type { CivintSurveillanceAsset } from "./routes/civint";

const asset: CivintSurveillanceAsset = {
  type: "node",
  id: 42,
  lat: 41.59,
  lon: -93.62,
  category: "alpr",
  surveillance_type: "ALPR",
  operator: "City of Des Moines",
  manufacturer: "Flock Safety",
  name: null,
  zone: null,
  direction: "90",
  tags: {},
  confidence: 0.9,
  provenance: { source_id: "osm", source_url: "https://www.openstreetmap.org/node/42", state: "snapshot" },
};

function build(store: WatchtowerStore = createMemoryStore(), dbOk = true) {
  return createApp({
    store,
    checkDb: async () => dbOk,
    fetchSurveillance: async () => ({ state: "snapshot", asOf: "2026-10-24T00:00:00Z", elements: [asset] }),
    staticPath: "/nonexistent",
  });
}

describe("health", () => {
  it("is 200 when the database answers", async () => {
    const res = await request(build()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", db: "ok" });
  });

  it("is 503 when the database is down", async () => {
    const res = await request(build(createMemoryStore(), false)).get("/api/health");
    expect(res.status).toBe(503);
    expect(res.body.db).toBe("error");
  });
});

describe("features", () => {
  it("merges the CIVINT snapshot with stored submissions and reports provenance", async () => {
    const app = build();
    await request(app).post("/api/features").send({ longitude: -91.4, latitude: 40.4, category: "camera" }).expect(201);
    const res = await request(app).get("/api/features").expect(200);
    expect(res.body.count).toBe(2);
    expect(res.body.provenance).toMatchObject({ state: "snapshot", surveillanceCount: 1, submittedCount: 1 });
    expect(res.body.features[0].id).toBe("civint-surveillance-42");
  });

  it("filters by category and rejects unknown categories", async () => {
    const app = build();
    await request(app).post("/api/features").send({ longitude: 1, latitude: 1, category: "incident" }).expect(201);
    const cams = await request(app).get("/api/features?category=camera").expect(200);
    expect(cams.body.features.every((f: { category: string }) => f.category === "camera")).toBe(true);
    await request(app).get("/api/features?category=bogus").expect(400);
  });

  it("gets a stored feature and a CIVINT feature by id; unknown is 404", async () => {
    const app = build();
    const created = await request(app).post("/api/features").send({ longitude: 2, latitude: 3 }).expect(201);
    await request(app).get(`/api/features/${created.body.id}`).expect(200);
    await request(app).get("/api/features/civint-surveillance-42").expect(200);
    await request(app).get("/api/features/civint-surveillance-999").expect(404);
    await request(app).get("/api/features/does-not-exist").expect(404);
  });

  it("validates coordinates, category and property size", async () => {
    const app = build();
    await request(app).post("/api/features").send({ longitude: 200, latitude: 0 }).expect(400);
    await request(app).post("/api/features").send({ longitude: 0, latitude: -91 }).expect(400);
    await request(app).post("/api/features").send({ longitude: 0, latitude: 0, category: "spy" }).expect(400);
    await request(app)
      .post("/api/features")
      .send({ longitude: 0, latitude: 0, properties: { blob: "x".repeat(20_000) } })
      .expect(400);
  });

  it("clamps confidence and truncates sourceId", async () => {
    const res = await request(build())
      .post("/api/features")
      .send({ longitude: 0, latitude: 0, confidence: 7, sourceId: "s".repeat(300) })
      .expect(201);
    expect(res.body.confidence).toBe(1);
    expect(res.body.sourceId).toHaveLength(128);
  });
});

describe("reports", () => {
  it("accepts a valid report as pending and hides it from anonymous readers", async () => {
    const app = build();
    const created = await request(app)
      .post("/api/reports")
      .send({ title: "New ALPR on Main St", body: "Pole-mounted", longitude: -91.4, latitude: 40.4 })
      .expect(201);
    expect(created.body.status).toBe("pending");
    const pub = await request(app).get("/api/reports").expect(200);
    expect(pub.body).toMatchObject({ count: 0, visibility: "approved" });
  });

  it("rejects invalid reports", async () => {
    const app = build();
    await request(app).post("/api/reports").send({ title: "", longitude: 0, latitude: 0 }).expect(400);
    await request(app).post("/api/reports").send({ title: "x".repeat(241), longitude: 0, latitude: 0 }).expect(400);
    await request(app).post("/api/reports").send({ title: "ok", longitude: "abc", latitude: 0 }).expect(400);
    await request(app).post("/api/reports").send({ title: "ok", body: "b".repeat(10_001), longitude: 0, latitude: 0 }).expect(400);
  });

  it("returns 400 on malformed JSON and 503 when storage fails", async () => {
    await request(build()).post("/api/reports").set("content-type", "application/json").send("{bad").expect(400);
    const failing: WatchtowerStore = {
      ...createMemoryStore(),
      insertReport: async () => {
        throw new Error("db down");
      },
    };
    const res = await request(build(failing)).post("/api/reports").send({ title: "t", longitude: 0, latitude: 0 });
    expect(res.status).toBe(503);
    expect(res.body.error).toBe("storage_unavailable");
  });
});

describe("write auth", () => {
  beforeEach(() => {
    process.env.WATCHTOWER_WRITE_TOKEN = "test-token-123";
  });
  afterEach(() => {
    delete process.env.WATCHTOWER_WRITE_TOKEN;
    delete process.env.NODE_ENV;
  });

  it("requires the bearer token for writes when configured", async () => {
    const app = build();
    await request(app).post("/api/reports").send({ title: "t", longitude: 0, latitude: 0 }).expect(401);
    await request(app)
      .post("/api/reports")
      .set("authorization", "Bearer wrong-token-xyz")
      .send({ title: "t", longitude: 0, latitude: 0 })
      .expect(401);
    await request(app)
      .post("/api/reports")
      .set("authorization", "Bearer test-token-123")
      .send({ title: "t", longitude: 0, latitude: 0 })
      .expect(201);
  });

  it("token holders see pending reports (moderation view)", async () => {
    const app = build();
    await request(app)
      .post("/api/reports")
      .set("authorization", "Bearer test-token-123")
      .send({ title: "t", longitude: 0, latitude: 0 })
      .expect(201);
    const res = await request(app).get("/api/reports").set("authorization", "Bearer test-token-123").expect(200);
    expect(res.body).toMatchObject({ count: 1, visibility: "all" });
  });

  it("fails closed in production when no token is configured", async () => {
    delete process.env.WATCHTOWER_WRITE_TOKEN;
    process.env.NODE_ENV = "production";
    await request(build()).post("/api/features").send({ longitude: 0, latitude: 0 }).expect(503);
  });
});

describe("api surface", () => {
  it("unknown API paths are JSON 404 and security headers are set", async () => {
    const res = await request(build()).get("/api/nope").expect(404);
    expect(res.body.error).toBe("not_found");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("DENY");
  });

  it("describes its routes at /api", async () => {
    const res = await request(build()).get("/api").expect(200);
    expect(res.body.service).toBe("civwatch-watchtower");
  });
});
