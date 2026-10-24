/**
 * Storage for submitted map features and citizen reports (roadmap P2-2).
 *
 * Production uses `createPgStore` (Postgres + PostGIS, migrations 001–002), so
 * submissions survive restarts. `createMemoryStore` exists for unit tests only.
 */
import type pg from "pg";
import type { Feature, MapFeatureCategory, Report } from "@civwatch/types";

export type NewFeature = Omit<Feature, "id" | "createdAt">;
export type NewReport = Omit<Report, "id" | "createdAt" | "status" | "userId">;
export type ReportStatus = Report["status"];

export interface WatchtowerStore {
  listFeatures(category?: MapFeatureCategory): Promise<Feature[]>;
  getFeature(id: string): Promise<Feature | null>;
  insertFeature(input: NewFeature): Promise<Feature>;
  listReports(options: { statuses: readonly ReportStatus[]; limit: number }): Promise<Report[]>;
  insertReport(input: NewReport): Promise<Report>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type FeatureRow = {
  id: string;
  source_ref: string | null;
  category: MapFeatureCategory;
  longitude: number;
  latitude: number;
  properties: Record<string, unknown>;
  confidence: number | null;
  created_at: Date;
};

type ReportRow = {
  id: string;
  user_id: string | null;
  category: string;
  title: string;
  body: string | null;
  longitude: number;
  latitude: number;
  status: ReportStatus;
  created_at: Date;
};

const FEATURE_COLUMNS = `id, source_ref, category, ST_X(geom::geometry) AS longitude, ST_Y(geom::geometry) AS latitude,
  properties, confidence, created_at`;
const REPORT_COLUMNS = `id, user_id, category, title, body, ST_X(geom::geometry) AS longitude, ST_Y(geom::geometry) AS latitude,
  status, created_at`;

function toFeature(row: FeatureRow): Feature {
  return {
    id: row.id,
    sourceId: row.source_ref,
    category: row.category,
    longitude: Number(row.longitude),
    latitude: Number(row.latitude),
    properties: row.properties ?? {},
    confidence: row.confidence == null ? null : Number(row.confidence),
    createdAt: row.created_at.toISOString(),
  };
}

function toReport(row: ReportRow): Report {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    title: row.title,
    body: row.body,
    longitude: Number(row.longitude),
    latitude: Number(row.latitude),
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

export function createPgStore(pool: pg.Pool): WatchtowerStore {
  return {
    async listFeatures(category) {
      const { rows } = category
        ? await pool.query<FeatureRow>(
            `SELECT ${FEATURE_COLUMNS} FROM map_features WHERE category = $1 ORDER BY created_at DESC LIMIT 1000`,
            [category],
          )
        : await pool.query<FeatureRow>(
            `SELECT ${FEATURE_COLUMNS} FROM map_features ORDER BY created_at DESC LIMIT 1000`,
          );
      return rows.map(toFeature);
    },

    async getFeature(id) {
      if (!UUID_RE.test(id)) return null;
      const { rows } = await pool.query<FeatureRow>(`SELECT ${FEATURE_COLUMNS} FROM map_features WHERE id = $1`, [id]);
      return rows[0] ? toFeature(rows[0]) : null;
    },

    async insertFeature(input) {
      const { rows } = await pool.query<FeatureRow>(
        `INSERT INTO map_features (source_ref, category, geom, properties, confidence)
         VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5::jsonb, $6)
         RETURNING ${FEATURE_COLUMNS}`,
        [input.sourceId, input.category, input.longitude, input.latitude, JSON.stringify(input.properties), input.confidence],
      );
      return toFeature(rows[0]!);
    },

    async listReports({ statuses, limit }) {
      const { rows } = await pool.query<ReportRow>(
        `SELECT ${REPORT_COLUMNS} FROM reports WHERE status = ANY($1::text[]) ORDER BY created_at DESC LIMIT $2`,
        [statuses, limit],
      );
      return rows.map(toReport);
    },

    async insertReport(input) {
      const { rows } = await pool.query<ReportRow>(
        `INSERT INTO reports (category, title, body, geom)
         VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography)
         RETURNING ${REPORT_COLUMNS}`,
        [input.category, input.title, input.body, input.longitude, input.latitude],
      );
      return toReport(rows[0]!);
    },
  };
}

/** Process-local store for unit tests. Not used by the server entry point. */
export function createMemoryStore(): WatchtowerStore {
  const features: Feature[] = [];
  const reports: Report[] = [];
  let n = 0;
  const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
  return {
    async listFeatures(category) {
      const all = features.slice().reverse();
      return category ? all.filter((f) => f.category === category) : all;
    },
    async getFeature(featureId) {
      return features.find((f) => f.id === featureId) ?? null;
    },
    async insertFeature(input) {
      const feature: Feature = { ...input, id: id(), createdAt: new Date().toISOString() };
      features.push(feature);
      return feature;
    },
    async listReports({ statuses, limit }) {
      return reports.filter((r) => statuses.includes(r.status)).reverse().slice(0, limit);
    },
    async insertReport(input) {
      const report: Report = { ...input, id: id(), userId: null, status: "pending", createdAt: new Date().toISOString() };
      reports.push(report);
      return report;
    },
  };
}
