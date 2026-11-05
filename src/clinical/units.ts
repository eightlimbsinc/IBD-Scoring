/**
 * Unit conversions to the canonical units in docs/IBD-SCORING-SPECIFICATIONS.md §2.
 * Pure functions. Original value and unit are kept by the caller for reporting.
 */

export type Analyte =
  | "hemoglobin"
  | "hematocrit"
  | "wbc"
  | "platelets"
  | "crp"
  | "esr"
  | "albumin"
  | "sodium"
  | "potassium"
  | "creatinine"
  | "egfr"
  | "alt"
  | "ast"
  | "alp"
  | "bilirubin"
  | "lactate"
  | "calprotectin";

export interface AnalyteDef {
  label: string;
  canonical: string;
  /** factor that converts each accepted unit into the canonical unit (value × factor) */
  units: Record<string, number>;
  /** data-entry sanity limits in canonical units (not clinical thresholds) */
  plausible: { min: number; max: number };
  decimals: number;
}

export const ANALYTES: Record<Analyte, AnalyteDef> = {
  hemoglobin: { label: "Hemoglobin", canonical: "g/dL", units: { "g/dL": 1, "g/L": 0.1 }, plausible: { min: 2, max: 25 }, decimals: 1 },
  hematocrit: { label: "Hematocrit", canonical: "%", units: { "%": 1, "L/L": 100 }, plausible: { min: 5, max: 75 }, decimals: 0 },
  wbc: { label: "White blood cells", canonical: "×10⁹/L", units: { "×10⁹/L": 1, "×10³/µL": 1, "/mm³": 0.001 }, plausible: { min: 0, max: 500 }, decimals: 1 },
  platelets: { label: "Platelets", canonical: "×10⁹/L", units: { "×10⁹/L": 1, "×10³/µL": 1 }, plausible: { min: 0, max: 3000 }, decimals: 0 },
  crp: { label: "CRP", canonical: "mg/L", units: { "mg/L": 1, "mg/dL": 10 }, plausible: { min: 0, max: 600 }, decimals: 1 },
  esr: { label: "ESR", canonical: "mm/h", units: { "mm/h": 1 }, plausible: { min: 0, max: 150 }, decimals: 0 },
  albumin: { label: "Albumin", canonical: "g/dL", units: { "g/dL": 1, "g/L": 0.1 }, plausible: { min: 0.5, max: 7 }, decimals: 1 },
  sodium: { label: "Sodium", canonical: "mmol/L", units: { "mmol/L": 1, "mEq/L": 1 }, plausible: { min: 90, max: 200 }, decimals: 0 },
  potassium: { label: "Potassium", canonical: "mmol/L", units: { "mmol/L": 1, "mEq/L": 1 }, plausible: { min: 1, max: 10 }, decimals: 1 },
  creatinine: { label: "Creatinine", canonical: "mg/dL", units: { "mg/dL": 1, "µmol/L": 1 / 88.42 }, plausible: { min: 0.1, max: 25 }, decimals: 2 },
  egfr: { label: "eGFR", canonical: "mL/min/1.73m²", units: { "mL/min/1.73m²": 1 }, plausible: { min: 0, max: 200 }, decimals: 0 },
  alt: { label: "ALT", canonical: "U/L", units: { "U/L": 1 }, plausible: { min: 0, max: 10000 }, decimals: 0 },
  ast: { label: "AST", canonical: "U/L", units: { "U/L": 1 }, plausible: { min: 0, max: 10000 }, decimals: 0 },
  alp: { label: "ALP", canonical: "U/L", units: { "U/L": 1 }, plausible: { min: 0, max: 5000 }, decimals: 0 },
  bilirubin: { label: "Total bilirubin", canonical: "mg/dL", units: { "mg/dL": 1, "µmol/L": 1 / 17.104 }, plausible: { min: 0, max: 50 }, decimals: 1 },
  lactate: { label: "Lactate", canonical: "mmol/L", units: { "mmol/L": 1, "mg/dL": 1 / 9.008 }, plausible: { min: 0, max: 30 }, decimals: 1 },
  calprotectin: { label: "Fecal calprotectin", canonical: "µg/g", units: { "µg/g": 1, "mg/kg": 1 }, plausible: { min: 0, max: 10000 }, decimals: 0 },
};

export function toCanonical(analyte: Analyte, value: number, unit: string): number {
  const factor = ANALYTES[analyte].units[unit];
  if (factor === undefined) throw new Error(`Unsupported unit "${unit}" for ${analyte}`);
  if (!Number.isFinite(value)) throw new Error(`Invalid value for ${analyte}`);
  return value * factor;
}

export function isPlausible(analyte: Analyte, value: number, unit: string): boolean {
  const v = toCanonical(analyte, value, unit);
  const { min, max } = ANALYTES[analyte].plausible;
  return v >= min && v <= max;
}

export const fahrenheitToCelsius = (f: number) => ((f - 32) * 5) / 9;
export const lbToKg = (lb: number) => lb * 0.45359237;
export const inToCm = (inches: number) => inches * 2.54;

/** BMI = kg / m². Display only — not used by any score. Returns null if inputs are missing. */
export function bmi(weightKg?: number | null, heightCm?: number | null): number | null {
  if (weightKg == null || heightCm == null || !(weightKg > 0) || !(heightCm > 0)) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** Mean arterial pressure (display). */
export function map(sbp?: number | null, dbp?: number | null): number | null {
  if (sbp == null || dbp == null) return null;
  return (sbp + 2 * dbp) / 3;
}
