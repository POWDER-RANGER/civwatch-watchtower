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
