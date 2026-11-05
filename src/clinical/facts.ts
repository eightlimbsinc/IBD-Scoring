import type { Assessment, TriState } from "./assessment-schema";
import { toCanonical, type Analyte } from "./units";

/** Canonical numeric facts. `undefined` = not available (never assumed normal). */
export interface Facts {
  age?: number;
  sex: "female" | "male" | "unknown";
  diagnosis: "uc" | "cd" | "ibdu" | "suspected";
  hr?: number;
  sbp?: number;
  dbp?: number;
  map?: number;
  tempC?: number;
  rr?: number;
  spo2?: number;
  lab: Partial<Record<Analyte, number>>;
  labStatus: Record<string, string>;
  tri: (v: TriState | undefined) => boolean | undefined;
}

export const triBool = (v: TriState | undefined): boolean | undefined => (v === "yes" ? true : v === "no" ? false : undefined);

export function buildFacts(a: Assessment): Facts {
  const v = a.vitals;
  const tempC = v.temperature == null ? undefined : v.temperatureUnit === "F" ? ((v.temperature - 32) * 5) / 9 : v.temperature;
  const lab: Partial<Record<Analyte, number>> = {};
  const labStatus: Record<string, string> = {};
  for (const [k, l] of Object.entries(a.labs.values) as [Analyte, (typeof a.labs.values)[Analyte]][]) {
    labStatus[k] = l.status || "not_recorded";
    if (l.status === "resulted" && l.value != null) lab[k] = toCanonical(k, l.value, l.unit);
  }
  return {
    age: a.patient.ageYears,
    sex: a.patient.sex === "female" || a.patient.sex === "male" ? a.patient.sex : "unknown",
    diagnosis: a.patient.diagnosis as Facts["diagnosis"],
    hr: v.heartRate,
    sbp: v.sbp,
    dbp: v.dbp,
    map: v.sbp != null && v.dbp != null ? (v.sbp + 2 * v.dbp) / 3 : undefined,
    tempC,
    rr: v.respiratoryRate,
    spo2: v.spo2,
    lab,
    labStatus,
    tri: triBool,
  };
}

/** Three-valued comparison: true/false when the value is known, undefined otherwise. */
export const gt = (x: number | undefined, t: number) => (x == null ? undefined : x > t);
export const lt = (x: number | undefined, t: number) => (x == null ? undefined : x < t);
export const gte = (x: number | undefined, t: number) => (x == null ? undefined : x >= t);
export const lte = (x: number | undefined, t: number) => (x == null ? undefined : x <= t);

export const fmt = (x: number | undefined, d = 0) => (x == null ? "not recorded" : x.toFixed(d));
