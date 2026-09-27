/** Shared pure utilities for CIVWATCH Watchtower. */

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two WGS84 points in meters (Haversine).
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Clamp and normalize a raw model score into [0, 1].
 */
export function normalizeConfidence(raw: number): number {
  if (Number.isNaN(raw) || !Number.isFinite(raw)) return 0;
  if (raw <= 0) return 0;
  if (raw >= 1) return 1;
  return raw;
}
