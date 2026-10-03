import { Router } from "express";
import type { Feature, MapFeatureCategory } from "@civwatch/types";
import { normalizeConfidence } from "@civwatch/core";

const store: Feature[] = [
  {
    id: "feat-alpr-demo-1",
    sourceId: "osm",
    category: "camera",
    longitude: -91.5302,
    latitude: 41.6611,
    properties: {
      label: "Mapped ALPR (demo)",
      operator: "Flock Safety",
      note: "Replace with civint alpr_overpass.json import",
    },
    confidence: 0.7,
    createdAt: new Date().toISOString(),
  },
  {
    id: "feat-report-demo-1",
    sourceId: "community",
    category: "report",
    longitude: -91.54,
    latitude: 41.665,
    properties: { label: "Community report (demo)", status: "approved" },
    confidence: 0.5,
    createdAt: new Date().toISOString(),
  },
];

export const featuresRouter = Router();

featuresRouter.get("/", (req, res) => {
  const category = req.query.category as MapFeatureCategory | undefined;
  const items = category ? store.filter((f) => f.category === category) : store;
  res.json({ features: items, count: items.length });
});

featuresRouter.get("/:id", (req, res) => {
  const f = store.find((x) => x.id === req.params.id);
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
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    res.status(400).json({ error: "longitude_and_latitude_required" });
    return;
  }
  const feature: Feature = {
    id: `feat-${Date.now()}`,
    sourceId: body.sourceId ?? null,
    category: (body.category as MapFeatureCategory) || "report",
    longitude,
    latitude,
    properties: typeof body.properties === "object" && body.properties ? body.properties : {},
    confidence: normalizeConfidence(Number(body.confidence ?? 0.5)),
    createdAt: new Date().toISOString(),
  };
  store.push(feature);
  res.status(201).json(feature);
});
