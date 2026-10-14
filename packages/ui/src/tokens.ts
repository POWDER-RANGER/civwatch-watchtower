/**
 * CIVWATCH Design Standard v2 — token values for code that cannot read CSS
 * variables (Mapbox GL / MapLibre paint properties, canvas, charts).
 *
 * Source of truth: tokens/civwatch-tokens.v2.json (W3C DTCG 2025.10).
 * CSS custom properties for the same values: src/tokens.css.
 */

/** Map layer categories, fixed order. Always pair the color with its glyph. */
export const categoryColor = {
  alprFixed: "#E69F00",
  alprMobilePtz: "#56B4E9",
  acousticGunshot: "#CC79A7",
  publicMic: "#009E73",
  contractGeo: "#F0E442",
  cellAnomaly: "#D55E00",
  otherDevice: "#0072B2",
  unclassified: "#A8B0BC",
} as const;

export type Category = keyof typeof categoryColor;

/** Glyph each category must be drawn with (legends, markers, exports). */
export const categoryGlyph: Record<Category, string> = {
  alprFixed: "triangle (filled)",
  alprMobilePtz: "triangle (outlined), dashed cone",
  acousticGunshot: "diamond",
  publicMic: "circle",
  contractGeo: "polygon outline",
  cellAnomaly: "cross",
  otherDevice: "square",
  unclassified: "ring",
};

/** Dark operational basemap (ops theme). */
export const basemap = {
  land: "#12161B",
  water: "#0B1016",
  road: "#232A33",
  label: "#8B949E",
  markerStroke: "#0A0C10",
} as const;

/** Marker outline on the editorial (light) canvas — required for 3:1. */
export const markerStrokeLight = "#111418";

/** cividis, 9 stops sampled from the published LUT. Low → high. */
export const cividis = [
  "#00224E", "#1A386F", "#434E6C", "#61656F", "#7D7C78",
  "#9B9476", "#BCAE6C", "#DEC958", "#FEE838",
] as const;

/** View-cone styling. */
export const coneStyle = {
  fillOpacity: 0.18,
  strokeWidth: 1.5,
  ptzDash: [4, 3] as [number, number],
  minZoom: 15,
} as const;

/** Positional-uncertainty halo for unverified points. */
export const uncertaintyHalo = { fillOpacity: 0.08, defaultRadiusM: 25 } as const;

/** Verification states and their colors (ops theme). */
export const verification = {
  verified: "#3FB37F",
  reported: "#E8A33D",
  unverified: "#8B949E",
} as const;
