import { Router } from "express";
import type { Feature, MapFeatureCategory } from "@civwatch/types";
import { normalizeConfidence } from "@civwatch/core";
import { fetchCivintSurveillance, type CivintSurveillanceAsset } from "./civint.js";



function surveillanceToFeature(asset: CivintSurveillanceAsset): Feature {
  const isSensor = asset.category === "gunshot_detector" || asset.category === "other";
  const label =
    asset.name ||
    asset.operator ||
    (asset.category === "gunshot_detector"
      ? "Gunshot detector"
      : asset.category === "alpr"
        ? "ALPR"
        : "Surveillance camera");

  return {
    id: `civint-surveillance-${asset.id}`,
    sourceId: asset.provenance?.source_id ?? "osm",
    category: isSensor ? "sensor" : "camera",
    longitude: asset.lon,
    latitude: asset.lat,
    properties: {
      label,
      state: asset.provenance?.state ?? "snapshot",
      surveillanceType: asset.surveillance_type,
      operator: asset.operator,
      manufacturer: asset.manufacturer,
      zone: asset.zone,
      direction: asset.direction,
      sourceUrl: asset.provenance?.source_url,
      observedAt: asset.provenance?.observed_at ?? null,
      method: asset.provenance?.method ?? "CIVINT normalized public source",
      attribution: asset.provenance?.attribution ?? "© OpenStreetMap contributors",
      tags: asset.tags,
    },
    confidence: normalizeConfidence(Number(asset.confidence ?? 0)),
    createdAt: asset.provenance?.observed_at ?? new Date().toISOString(),
  };
}



export const featuresRouter = Router();

featuresRouter.get("/", async (req, res) => {
  const category = req.query.category as MapFeatureCategory | undefined;
  const civint = await fetchCivintSurveillance();
  const mapped = civint.elements.map(surveillanceToFeature);
  const items = mapped;
  const filtered = category ? items.filter((f) => f.category === category) : items;
  res.json({
    features: filtered,
    count: filtered.length,
    provenance: {
      source: "CIVINTELLIGENCE",
      state: civint.state,
      asOf: civint.asOf,
      surveillanceCount: mapped.length,
    },
  });
});

featuresRouter.get("/:id", async (req, res) => {
  const civint = await fetchCivintSurveillance();
  const dynamic = civint.elements.map(surveillanceToFeature);
  const f = dynamic.find((x) => x.id === req.params.id);
  if (!f) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json(f);
});

featuresRouter.post("/", (req, res) => {
  const body = req.body ?? {};
  const longitude = Number(body.longitude);
  const latitude = Number(body.latitude);
  const category = String(body.category ?? "report") as MapFeatureCategory;
  const allowedCategories = new Set<MapFeatureCategory>([
    "incident", "camera", "report", "official", "footstep", "historical", "sensor",
  ]);
  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    res.status(400).json({ error: "invalid_coordinates" });
    return;
  }
  if (!allowedCategories.has(category)) {
    res.status(400).json({ error: "invalid_category" });
    return;
  }
  const sourceId =
    body.sourceId == null ? null : String(body.sourceId).trim().slice(0, 128) || null;
  const properties =
    typeof body.properties === "object" && body.properties && !Array.isArray(body.properties)
      ? body.properties
      : {};
  const feature: Feature = {
    id: `feat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sourceId,
    category,
    longitude,
    latitude,
    properties,
    confidence: normalizeConfidence(Number(body.confidence ?? 0.5)),
    createdAt: new Date().toISOString(),
  };
  store.push(feature);
  res.status(201).json(feature);
});
