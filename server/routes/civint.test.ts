import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { civintRouter, fetchCivintSurveillance } from "./civint";

function app() {
  const a = express();
  a.use("/api/civint", civintRouter);
  return a;
}

function mockFetch(routes: Record<string, unknown>, fail = false) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (fail) throw new Error("network down");
      const hit = Object.entries(routes).find(([suffix]) => String(url).endsWith(suffix));
      if (!hit) return new Response("not found", { status: 404 });
      return new Response(JSON.stringify(hit[1]), { status: 200, headers: { "content-type": "application/json" } });
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CIVINT feed proxy", () => {
  it("passes alerts and awards arrays through and flags missing feeds", async () => {
    mockFetch({ "alerts.json": [{ id: 1 }] });
    const alerts = await request(app()).get("/api/civint/alerts").expect(200);
    expect(alerts.body).toEqual({ source: "civint", alerts: [{ id: 1 }], ok: true });
    const awards = await request(app()).get("/api/civint/awards").expect(200);
    expect(awards.body).toEqual({ source: "civint", awards: [], ok: false });
  });

  it("returns ALPR elements with the OSM timestamp", async () => {
    mockFetch({ "alpr_overpass.json": { elements: [{ id: 7 }], osm3s: { timestamp_osm_base: "2026-10-01T00:00:00Z" } } });
    const res = await request(app()).get("/api/civint/alpr").expect(200);
    expect(res.body).toMatchObject({ elements: [{ id: 7 }], asOf: "2026-10-01T00:00:00Z", ok: true });
  });

  it("reports an unavailable surveillance feed honestly when the network fails", async () => {
    mockFetch({}, true);
    expect(await fetchCivintSurveillance()).toEqual({ state: "unavailable", asOf: null, elements: [] });
    const res = await request(app()).get("/api/civint/surveillance").expect(200);
    expect(res.body.ok).toBe(false);
  });

  it("returns the surveillance snapshot state when available", async () => {
    mockFetch({ "surveillance.json": { state: "snapshot", as_of: "2026-10-20", elements: [] } });
    const res = await request(app()).get("/api/civint/surveillance").expect(200);
    expect(res.body).toMatchObject({ state: "snapshot", asOf: "2026-10-20", ok: true });
  });

  it("wraps the ALPR TileJSON and reports upstream failure as 502", async () => {
    mockFetch({ "cameras-us-hourly.json": { tiles: ["https://example/{z}/{x}/{y}.pbf"] } });
    const ok = await request(app()).get("/api/civint/alpr/tiles").expect(200);
    expect(ok.body.state).toBe("live");
    mockFetch({});
    const missing = await request(app()).get("/api/civint/alpr/tiles").expect(502);
    expect(missing.body.state).toBe("unavailable");
    mockFetch({}, true);
    await request(app()).get("/api/civint/alpr/tiles").expect(502);
  });

  it("lists federated sources", async () => {
    mockFetch({ "sources.json": { sources: [{ id: "osm" }] } });
    const res = await request(app()).get("/api/civint/sources").expect(200);
    expect(res.body).toEqual({ source: "civint", sources: [{ id: "osm" }], ok: true });
  });
});
