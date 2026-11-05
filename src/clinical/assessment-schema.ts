import { z } from "zod";
import { ANALYTES, type Analyte, isPlausible } from "./units";

/**
 * Assessment data model + validation. "Not answered" is always distinct from "No" and from "Unknown":
 * nothing defaults to normal.
 */

const emptyToUndefined = (v: unknown) =>
  v === "" || v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : v;

/** Optional number in a plausible data-entry range (not a clinical threshold). */
export const optNum = (min: number, max: number, opts: { int?: boolean; label?: string } = {}) =>
  z.preprocess(
    (v) => {
      const e = emptyToUndefined(v);
      return e === undefined ? undefined : Number(e);
    },
    (opts.int ? z.number().int("Whole number") : z.number())
      .min(min, `Check value: below ${min}`)
      .max(max, `Check value: above ${max}`)
      .optional(),
  );

export const triState = z.enum(["", "yes", "no", "unknown"]);
export type TriState = z.infer<typeof triState>;

export const DIAGNOSES = {
  uc: "Ulcerative colitis",
  cd: "Crohn's disease",
  ibdu: "IBD unclassified",
  suspected: "Suspected IBD",
} as const;

export const ROLES = {
  nurse: "Nurse",
  intern: "Intern",
  resident: "Resident",
  physician: "Physician",
} as const;

export const UC_EXTENT = { "": "Not known", E1: "Proctitis (E1)", E2: "Left-sided (E2)", E3: "Extensive (E3)" } as const;
export const CD_LOCATION = {
  "": "Not known",
  L1: "Ileal (L1)",
  L2: "Colonic (L2)",
  L3: "Ileocolonic (L3)",
} as const;

export const IMMUNO_MEDS = {
  corticosteroids: "Corticosteroids",
  thiopurine: "Azathioprine / 6-MP",
  methotrexate: "Methotrexate",
  antiTnf: "Anti-TNF (infliximab, adalimumab…)",
  vedolizumab: "Vedolizumab",
  ustekinumab: "Ustekinumab / IL-23",
  jak: "JAK inhibitor",
  other: "Other advanced therapy",
} as const;

export const PRESENTATION_TRI = {
  distension: "Abdominal distension",
  nocturnalBm: "Nocturnal bowel movements",
  rectalBleeding: "Rectal bleeding",
  diarrhea: "Diarrhea",
  vomiting: "Vomiting",
  fever: "Fever (reported)",
  urgency: "Urgency",
  tenesmus: "Tenesmus",
  dehydrationSymptoms: "Dehydration symptoms (thirst, dizziness, dry mouth)",
  reducedUrine: "Reduced urine output",
  cannotPassStoolGas: "Unable to pass stool or gas",
  weightLoss: "Weight loss",
  perianalSymptoms: "Perianal pain, swelling or discharge",
} as const;

export const EXAM_TRI = {
  guarding: "Guarding, rigidity or rebound tenderness",
  perianalFluctuance: "Perianal swelling or fluctuance",
  alteredMentation: "Altered mentation / confusion",
} as const;

const triRecord = <K extends string>(keys: Record<K, string>) =>
  z.object(Object.fromEntries(Object.keys(keys).map((k) => [k, triState])) as Record<K, typeof triState>);

export const LAB_STATUS = {
  not_ordered: "Not ordered",
  pending: "Pending",
  not_available: "Not available",
  resulted: "Resulted",
} as const;

export const NUMERIC_LABS: Analyte[] = [
  "hemoglobin", "hematocrit", "wbc", "platelets", "crp", "esr", "albumin", "sodium", "potassium",
  "creatinine", "egfr", "alt", "ast", "alp", "bilirubin", "lactate", "calprotectin",
];

const labValue = z
  .object({
    status: z.enum(["", "not_ordered", "pending", "not_available", "resulted"]),
    value: optNum(-1e9, 1e9),
    unit: z.string(),
    flag: z.enum(["", "normal", "abnormal"]),
  });

const stoolTest = z.object({
  status: z.enum(["", "not_ordered", "pending", "not_available", "resulted"]),
  result: z.enum(["", "positive", "negative"]),
  detail: z.string().max(200),
});

export const assessmentSchema = z
  .object({
    patient: z.object({
      caseId: z.string().trim().min(1, "Required — MRN or case code").max(40),
      name: z.string().max(100),
      ageYears: optNum(0, 120, { int: true }),
      sex: z.enum(["", "female", "male", "not_recorded"]),
      assessedAt: z.string().min(1, "Required"),
      diagnosis: z.enum(["", "uc", "cd", "ibdu", "suspected"]).refine((v) => v !== "", "Select a diagnosis"),
      diseaseDurationYears: optNum(0, 100),
      ucExtent: z.enum(["", "E1", "E2", "E3"]),
      cdLocation: z.enum(["", "L1", "L2", "L3"]),
      cdUpperGi: triState,
      cdPerianal: triState,
      medications: z.string().max(1000),
      immuno: z.array(z.enum(Object.keys(IMMUNO_MEDS) as [keyof typeof IMMUNO_MEDS])),
      surgeries: z.string().max(1000),
      hasOstomy: triState,
      previousAdmissions: optNum(0, 200, { int: true }),
      comorbidities: z.string().max(1000),
      enteredBy: z.string().max(100),
      enteredByRole: z.enum(["", "nurse", "intern", "resident", "physician"]),
    }),
    presentation: z.object({
      chiefComplaint: z.string().max(500),
      abdominalPain: z.enum(["", "none", "mild", "moderate", "severe", "unknown"]),
      stools24h: optNum(0, 60, { int: true }),
      bloodyStools24h: optNum(0, 60, { int: true }),
      usualStoolsPerDay: optNum(0, 20, { int: true }),
      symptomDurationDays: optNum(0, 3650, { int: true }),
      tri: triRecord(PRESENTATION_TRI),
    }),
    exam: z.object({
      tenderness: z.enum(["", "none", "mild_localised", "mild_moderate_diffuse", "severe_or_rebound", "not_assessed"]),
      abdominalMass: z.enum(["", "none", "dubious", "definite", "definite_tender", "not_assessed"]),
      tri: triRecord(EXAM_TRI),
      examinedByRole: z.enum(["", "nurse", "intern", "resident", "physician"]),
    }),
    vitals: z.object({
      heartRate: optNum(20, 250, { int: true }),
      sbp: optNum(40, 300, { int: true }),
      dbp: optNum(20, 200, { int: true }),
      temperature: optNum(30, 111),
      temperatureUnit: z.enum(["C", "F"]),
      respiratoryRate: optNum(4, 80, { int: true }),
      spo2: optNum(50, 100, { int: true }),
      weightKg: optNum(1, 350),
      heightCm: optNum(40, 250),
    }),
    labs: z.object({
      values: z.object(Object.fromEntries(NUMERIC_LABS.map((a) => [a, labValue])) as Record<Analyte, typeof labValue>),
      cdiff: stoolTest,
      stoolOther: stoolTest,
    }),
  })
  .superRefine((d, ctx) => {
    const v = d.vitals;
    if (v.sbp != null && v.dbp != null && v.dbp >= v.sbp) {
      ctx.addIssue({ code: "custom", path: ["vitals", "dbp"], message: "Diastolic must be lower than systolic" });
    }
    if (v.temperature != null) {
      const c = v.temperatureUnit === "F" ? ((v.temperature - 32) * 5) / 9 : v.temperature;
      if (c < 30 || c > 44) ctx.addIssue({ code: "custom", path: ["vitals", "temperature"], message: "Check value: outside 30–44 °C" });
    }
    const p = d.presentation;
    if (p.stools24h != null && p.bloodyStools24h != null && p.bloodyStools24h > p.stools24h) {
      ctx.addIssue({ code: "custom", path: ["presentation", "bloodyStools24h"], message: "Cannot exceed total stools" });
    }
    for (const a of NUMERIC_LABS) {
      const lab = d.labs.values[a];
      if (lab.status === "resulted") {
        if (lab.value == null) {
          ctx.addIssue({ code: "custom", path: ["labs", "values", a, "value"], message: "Enter the result or change status" });
        } else if (!isPlausible(a, lab.value, lab.unit)) {
          const { min, max } = ANALYTES[a].plausible;
          ctx.addIssue({ code: "custom", path: ["labs", "values", a, "value"], message: `Check value/unit: outside ${min}–${max} ${ANALYTES[a].canonical}` });
        }
      }
    }
    for (const k of ["cdiff", "stoolOther"] as const) {
      const t = d.labs[k];
      if (t.status === "resulted" && t.result === "") {
        ctx.addIssue({ code: "custom", path: ["labs", k, "result"], message: "Select positive or negative" });
      }
    }
  });

export type AssessmentInput = z.input<typeof assessmentSchema>;
export type Assessment = z.output<typeof assessmentSchema>;

const triDefaults = <K extends string>(keys: Record<K, string>) =>
  Object.fromEntries(Object.keys(keys).map((k) => [k, ""])) as Record<K, TriState>;

export function nowLocalInput(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function emptyAssessment(): AssessmentInput {
  return {
    patient: {
      caseId: "", name: "", ageYears: "" as never, sex: "", assessedAt: nowLocalInput(), diagnosis: "",
      diseaseDurationYears: "" as never, ucExtent: "", cdLocation: "", cdUpperGi: "", cdPerianal: "",
      medications: "", immuno: [], surgeries: "", hasOstomy: "", previousAdmissions: "" as never,
      comorbidities: "", enteredBy: "", enteredByRole: "",
    },
    presentation: {
      chiefComplaint: "", abdominalPain: "", stools24h: "" as never, bloodyStools24h: "" as never,
      usualStoolsPerDay: "" as never, symptomDurationDays: "" as never, tri: triDefaults(PRESENTATION_TRI),
    },
    exam: { tenderness: "", abdominalMass: "", tri: triDefaults(EXAM_TRI), examinedByRole: "" },
    vitals: {
      heartRate: "" as never, sbp: "" as never, dbp: "" as never, temperature: "" as never, temperatureUnit: "C",
      respiratoryRate: "" as never, spo2: "" as never, weightKg: "" as never, heightCm: "" as never,
    },
    labs: {
      values: Object.fromEntries(
        NUMERIC_LABS.map((a) => [a, { status: "", value: "" as never, unit: ANALYTES[a].canonical, flag: "" }]),
      ) as unknown as AssessmentInput["labs"]["values"],
      cdiff: { status: "", result: "", detail: "" },
      stoolOther: { status: "", result: "", detail: "" },
    },
  };
}

/** Pathway by age (PU-1 cutoff pending GI). Unknown age → null (clinician must choose). */
export function pathwayForAge(age: number | undefined, cutoff: number): "adult" | "pediatric" | null {
  if (age == null) return null;
  return age < cutoff ? "pediatric" : "adult";
}
