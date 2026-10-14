/**
 * Geodesic camera view cones (CIVWATCH Design Standard v2).
 *
 * A cone is a sector polygon from the device position, its compass bearing,
 * horizontal field of view and range, computed on a sphere so it keeps its
 * true ground footprint at every latitude and zoom. Devices without a bearing
 * get a full ring (an omnidirectional or pan-tilt-zoom camera).
 *
 * No dependencies; output is plain GeoJSON for Mapbox GL / MapLibre sources.
 */

export type ConeInput = {
  /** [longitude, latitude] in degrees. */
  position: [number, number];
  /** Compass bearing in degrees (0 = north, clockwise). null/undefined = unknown. */
  bearing?: number | null;
  /** Horizontal field of view in degrees. Default 90. */
  hfov?: number;
  /** Range in metres. Default 60. */
  rangeM?: number;
  /** Extra GeoJSON properties copied onto the polygon. */
  properties?: Record<string, unknown>;
};

export type ConeFeature = {
  type: "Feature";
  geometry: { type: "Polygon"; coordinates: [number, number][][] };
  properties: Record<string, unknown> & { coneType: "sector" | "omni" };
};

const EARTH_RADIUS_M = 6_371_008.8;
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Point reached from `origin` after `distanceM` metres along `bearingDeg`. */
export function destination(
  origin: [number, number],
  bearingDeg: number,
  distanceM: number,
): [number, number] {
  const [lon, lat] = origin;
  const angular = distanceM / EARTH_RADIUS_M;
  const theta = toRad(bearingDeg);
  const lat1 = toRad(lat);
  const lon1 = toRad(lon);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(theta),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );
  return [((toDeg(lon2) + 540) % 360) - 180, toDeg(lat2)];
}

/** Build the cone polygon for one device. */
export function viewCone(input: ConeInput, steps = 48): ConeFeature {
  const { position, bearing, hfov = 90, rangeM = 60, properties = {} } = input;
  const ring: [number, number][] = [];
  const omni = bearing === null || bearing === undefined || !Number.isFinite(bearing) || hfov >= 360;

  if (omni) {
    for (let i = 0; i <= steps; i++) ring.push(destination(position, (360 * i) / steps, rangeM));
  } else {
    const start = (bearing as number) - hfov / 2;
    ring.push(position);
    for (let i = 0; i <= steps; i++) ring.push(destination(position, start + (hfov * i) / steps, rangeM));
    ring.push(position);
  }

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [ring] },
    properties: { ...properties, coneType: omni ? "omni" : "sector" },
  };
}

/** Cones for many devices as a FeatureCollection. */
export function viewCones(inputs: ConeInput[], steps = 48) {
  return { type: "FeatureCollection" as const, features: inputs.map((i) => viewCone(i, steps)) };
}
