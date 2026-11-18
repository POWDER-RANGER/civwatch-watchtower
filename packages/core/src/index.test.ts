import { describe, expect, it } from "vitest";
import { haversineDistance, normalizeConfidence } from "./index";

describe("haversineDistance", () => {
  it("is zero for the same point", () => {
    expect(haversineDistance(40.4, -91.4, 40.4, -91.4)).toBe(0);
  });

  it("matches a known distance (Keokuk to Des Moines, about 238 km)", () => {
    const d = haversineDistance(40.3973, -91.3849, 41.5868, -93.625);
    expect(d / 1000).toBeGreaterThan(225);
    expect(d / 1000).toBeLessThan(250);
  });

  it("is symmetric", () => {
    expect(haversineDistance(1, 2, 3, 4)).toBeCloseTo(haversineDistance(3, 4, 1, 2), 6);
  });
});

describe("normalizeConfidence", () => {
  it("clamps to [0, 1] and zeroes non-finite input", () => {
    expect(normalizeConfidence(-1)).toBe(0);
    expect(normalizeConfidence(0.4)).toBe(0.4);
    expect(normalizeConfidence(3)).toBe(1);
    expect(normalizeConfidence(Number.NaN)).toBe(0);
    expect(normalizeConfidence(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
