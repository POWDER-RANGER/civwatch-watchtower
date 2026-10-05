import { Router } from "express";

const DEFAULT_BASE =
  process.env.CIVINT_BASE_URL ??
  "https://raw.githubusercontent.com/POWDER-RANGER/CivilianIntelligence/main/public/civint";

export const civintRouter = Router();

async function softGet(name: string): Promise<unknown> {
  try {
    const url = `${DEFAULT_BASE.replace(/\/$/, "")}/${name}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

civintRouter.get("/alerts", async (_req, res) => {
  const data = await softGet("alerts.json");
  res.json({ source: "civint", alerts: Array.isArray(data) ? data : [], ok: Array.isArray(data) });
});

civintRouter.get("/awards", async (_req, res) => {
  const data = await softGet("awards.json");
  res.json({ source: "civint", awards: Array.isArray(data) ? data : [], ok: Array.isArray(data) });
});

civintRouter.get("/alpr", async (_req, res) => {
  const data = (await softGet("alpr_overpass.json")) as
    | { elements?: unknown[]; osm3s?: { timestamp_osm_base?: string } }
    | null;
  const elements = Array.isArray(data?.elements) ? data!.elements : [];
  res.json({
    source: "civint",
    elements,
    asOf: data?.osm3s?.timestamp_osm_base ?? null,
    ok: Boolean(data),
  });
});


export type CivintSurveillanceAsset = {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  category: "alpr" | "gunshot_detector" | "camera" | "other";
  surveillance_type: string | null;
  operator: string | null;
  manufacturer: string | null;
  name: string | null;
  zone: string | null;
  direction: string | null;
  tags: Record<string, string>;
  confidence: number | null;
  provenance?: {
    source_id?: string;
    source_url?: string;
    observed_at?: string | null;
    method?: string;
    state?: string;
    attribution?: string;
  };
};

export async function fetchCivintSurveillance(): Promise<{
  state: string;
  asOf: string | null;
  elements: CivintSurveillanceAsset[];
}> {
  const data = (await softGet("surveillance.json")) as
    | { state?: string; as_of?: string | null; elements?: CivintSurveillanceAsset[] }
    | null;
  return {
    state: data?.state ?? "unavailable",
    asOf: data?.as_of ?? null,
    elements: Array.isArray(data?.elements) ? data.elements : [],
  };
}

civintRouter.get("/surveillance", async (_req, res) => {
  const data = await fetchCivintSurveillance();
  res.json({
    source: "civint",
    ...data,
    ok: data.state !== "unavailable",
  });
});


civintRouter.get("/alpr/tiles", async (_req, res) => {
  const upstream =
    process.env.CIVINT_ALPR_TILEJSON_URL ??
    "https://tiles.dontgetflocked.com/cameras-us-hourly.json";
  try {
    const response = await fetch(upstream, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      res.status(502).json({ source: "flockhopper", state: "unavailable", status: response.status });
      return;
    }
    const body = await response.json();
    res.json({
      source: "flockhopper-deflock-tiles",
      state: "live",
      upstream,
      tilejson: body,
    });
  } catch {
    res.status(502).json({ source: "flockhopper", state: "unavailable" });
  }
});

civintRouter.get("/sources", async (_req, res) => {
  const data = (await softGet("sources.json")) as { sources?: unknown[] } | null;
  const sources = Array.isArray(data?.sources) ? data.sources : [];
  res.json({ source: "civint", sources, ok: Boolean(data) });
});
