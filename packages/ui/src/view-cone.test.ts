import { describe, expect, it } from "vitest";
import { destination, viewCone, viewCones } from "./view-cone";
import { haversineDistance } from "../../core/src/index";

describe("view cones", () => {
  it("destination moves the requested distance along the bearing", () => {
    const origin: [number, number] = [-91.4, 40.4];
    const north = destination(origin, 0, 1000);
    expect(north[0]).toBeCloseTo(origin[0], 6);
    expect(north[1]).toBeGreaterThan(origin[1]);
    expect(haversineDistance(origin[1], origin[0], north[1], north[0])).toBeCloseTo(1000, -1);
  });

  it("builds a closed sector when a bearing is known", () => {
    const cone = viewCone({ position: [0, 0], bearing: 90, hfov: 60, rangeM: 100, properties: { id: "a" } }, 8);
    const ring = cone.geometry.coordinates[0]!;
    expect(cone.properties).toMatchObject({ id: "a", coneType: "sector" });
    expect(ring[0]).toEqual([0, 0]);
    expect(ring.at(-1)).toEqual([0, 0]);
    expect(ring).toHaveLength(8 + 3);
  });

  it("builds an omnidirectional ring when the bearing is unknown or hfov is 360", () => {
    expect(viewCone({ position: [0, 0] }).properties.coneType).toBe("omni");
    expect(viewCone({ position: [0, 0], bearing: 10, hfov: 360 }).properties.coneType).toBe("omni");
    expect(viewCone({ position: [0, 0], bearing: Number.NaN }).properties.coneType).toBe("omni");
  });

  it("wraps longitudes across the antimeridian", () => {
    const [lon] = destination([179.9999, 0], 90, 1000);
    expect(lon).toBeLessThan(-179);
  });

  it("returns a FeatureCollection for many devices", () => {
    const fc = viewCones([{ position: [0, 0] }, { position: [1, 1], bearing: 0 }], 4);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(2);
  });
});
