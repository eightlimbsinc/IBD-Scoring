import { describe, expect, it } from "vitest";
import { bmi, fahrenheitToCelsius, isPlausible, map, toCanonical, inToCm, lbToKg } from "@/clinical/units";

describe("lab unit conversions", () => {
  it.each([
    ["hemoglobin", 105, "g/L", 10.5],
    ["hemoglobin", 10.5, "g/dL", 10.5],
    ["albumin", 34, "g/L", 3.4],
    ["crp", 3, "mg/dL", 30],
    ["crp", 30, "mg/L", 30],
    ["hematocrit", 0.42, "L/L", 42],
    ["wbc", 10500, "/mm³", 10.5],
    ["wbc", 10.5, "×10³/µL", 10.5],
    ["potassium", 3.4, "mEq/L", 3.4],
  ] as const)("%s %d %s → %d canonical", (a, v, u, expected) => {
    expect(toCanonical(a, v, u)).toBeCloseTo(expected, 6);
  });

  it("creatinine µmol/L → mg/dL", () => {
    expect(toCanonical("creatinine", 88.42, "µmol/L")).toBeCloseTo(1, 6);
    expect(toCanonical("creatinine", 176.84, "µmol/L")).toBeCloseTo(2, 6);
  });

  it("lactate mg/dL → mmol/L", () => {
    expect(toCanonical("lactate", 18.016, "mg/dL")).toBeCloseTo(2, 6);
  });

  it("bilirubin µmol/L → mg/dL", () => {
    expect(toCanonical("bilirubin", 17.104, "µmol/L")).toBeCloseTo(1, 6);
  });

  it("rejects unknown units and non-finite values", () => {
    expect(() => toCanonical("hemoglobin", 10, "mmol/L")).toThrow();
    expect(() => toCanonical("hemoglobin", Number.NaN, "g/dL")).toThrow();
  });

  it("catches a unit slip via plausibility (Hb 105 entered as g/dL)", () => {
    expect(isPlausible("hemoglobin", 105, "g/dL")).toBe(false);
    expect(isPlausible("hemoglobin", 105, "g/L")).toBe(true);
  });
});

describe("vital sign helpers", () => {
  it("°F → °C", () => {
    expect(fahrenheitToCelsius(100)).toBeCloseTo(37.78, 2);
    expect(fahrenheitToCelsius(98.6)).toBeCloseTo(37, 6);
  });
  it("lb and in", () => {
    expect(lbToKg(220)).toBeCloseTo(99.79, 2);
    expect(inToCm(70)).toBeCloseTo(177.8, 6);
  });
  it("BMI", () => {
    expect(bmi(70, 175)).toBeCloseTo(22.857, 3);
    expect(bmi(undefined, 175)).toBeNull();
    expect(bmi(70, 0)).toBeNull();
  });
  it("MAP", () => {
    expect(map(120, 80)).toBeCloseTo(93.33, 2);
    expect(map(120, undefined)).toBeNull();
  });
});
