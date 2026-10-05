/** Shared domain types for CIVWATCH Watchtower. Align with server/db schema. */

export type SourceType =
  | "noaa"
  | "fec"
  | "opensecrets"
  | "propublica"
  | "usaspending"
  | "community"
  | "osm"
  | "airnow"
  | "other";

export type MapFeatureCategory =
  | "incident"
  | "camera"
  | "report"
  | "official"
  | "footstep"
  | "historical"
  | "sensor";

export type UserRole = "viewer" | "reporter" | "moderator" | "admin";

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  url: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

/** GeoJSON-compatible point feature stored in map_features. */
export interface Feature {
  id: string;
  sourceId: string | null;
  category: MapFeatureCategory;
  /** WGS84 lon/lat */
  longitude: number;
  latitude: number;
  properties: Record<string, unknown>;
  confidence: number | null;
  createdAt: string;
}

export interface Report {
  id: string;
  userId: string | null;
  category: string;
  title: string;
  body: string | null;
  longitude: number;
  latitude: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface Official {
  id: string;
  name: string;
  office: string;
  party: string | null;
  jurisdiction: string;
  fecId: string | null;
  transparencyScore: number | null;
  createdAt: string;
}

export interface AnomalyScore {
  id: string;
  entityType: "official" | "transaction" | "incident" | "cluster";
  entityId: string;
  score: number;
  method: string;
  label: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface HealthResponse {
  status: "ok" | "error";
  db: "ok" | "error";
  timestamp: string;
  version?: string;
}
