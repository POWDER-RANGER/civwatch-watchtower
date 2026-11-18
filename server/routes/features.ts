import { Router } from "express";
import type { Feature, MapFeatureCategory } from "@civwatch/types";
import { normalizeConfidence } from "@civwatch/core";
import { fetchCivintSurveillance, type CivintSurveillanceAsset } from "./civint.js";
import type { WatchtowerStore } from "../store.js";



export function surveillanceToFeature(asset: CivintSurveillanceAsset): Feature {
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



type SurveillanceFetcher = typeof fetchCivintSurveillance;

const ALLOWED_CATEGORIES = new Set<MapFeatureCategory>([
  "incident", "camera", "report", "official", "footstep", "historical", "sensor",
]);

/**
 * Features = CIVINT surveillance snapshot (read-only) + submissions persisted
 * in the store (roadmap P2-2; the in-memory array lost every submission on
 * restart).
 */
export function createFeaturesRouter(deps: { store: WatchtowerStore; fetchSurveillance?: SurveillanceFetcher }): Router {
  const { store } = deps;
  const fetchSurveillance = deps.fetchSurveillance ?? fetchCivintSurveillance;
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const raw = req.query.category;
      const category = typeof raw === "string" && raw ? (raw as MapFeatureCategory) : undefined;
      if (category && !ALLOWED_CATEGORIES.has(category)) {
        res.status(400).json({ error: "invalid_category" });
        return;
      }
      const [civint, submitted] = await Promise.all([fetchSurveillance(), store.listFeatures(category)]);
      const mapped = civint.elements.map(surveillanceToFeature);
      const items = [...(category ? mapped.filter((f) => f.category === category) : mapped), ...submitted];
      res.json({
        features: items,
        count: items.length,
        provenance: {
          source: "CIVINTELLIGENCE",
          state: civint.state,
          asOf: civint.asOf,
          surveillanceCount: mapped.length,
          submittedCount: submitted.length,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const id = req.params.id;
      if (id.startsWith("civint-surveillance-")) {
        const civint = await fetchSurveillance();
        const f = civint.elements.map(surveillanceToFeature).find((x) => x.id === id);
        if (f) {
          res.json(f);
          return;
        }
      } else {
        const f = await store.getFeature(id);
        if (f) {
          res.json(f);
          return;
        }
      }
      res.status(404).json({ error: "not_found" });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const body = req.body ?? {};
      const longitude = Number(body.longitude);
      const latitude = Number(body.latitude);
      const category = String(body.category ?? "report") as MapFeatureCategory;
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
      if (!ALLOWED_CATEGORIES.has(category)) {
        res.status(400).json({ error: "invalid_category" });
        return;
      }
      const sourceId =
        body.sourceId == null ? null : String(body.sourceId).trim().slice(0, 128) || null;
      const properties =
        typeof body.properties === "object" && body.properties && !Array.isArray(body.properties)
          ? (body.properties as Record<string, unknown>)
          : {};
      if (JSON.stringify(properties).length > 16_384) {
        res.status(400).json({ error: "properties_too_large" });
        return;
      }
      const feature = await store.insertFeature({
        sourceId,
        category,
        longitude,
        latitude,
        properties,
        confidence: normalizeConfidence(Number(body.confidence ?? 0.5)),
      });
      res.status(201).json(feature);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
