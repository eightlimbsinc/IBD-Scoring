import { emptyAssessment, nowLocalInput, type AssessmentInput } from "./assessment-schema";

/**
 * SYNTHETIC patients only — for demo, review and tests. Not real people.
 * Expected results are calculated by hand in docs/TESTING.md.
 */

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

function merge<T>(base: T, patch: DeepPartial<T>): T {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    const b = out[k];
    out[k] = v && typeof v === "object" && !Array.isArray(v) && b && typeof b === "object" ? merge(b, v as never) : v;
  }
  return out as T;
}

type Lab = { v: number; u?: string };
function labs(values: Record<string, Lab | "pending" | "not_ordered" | "not_available">) {
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(values)) {
    out[k] = typeof x === "string" ? { status: x } : { status: "resulted", value: x.v, ...(x.u ? { unit: x.u } : {}) };
  }
  return out;
}

const n = (x: number) => x as never;

export interface DemoCase {
  id: string;
  title: string;
  summary: string;
  input: () => AssessmentInput;
}

const mk = (id: string, title: string, summary: string, patch: DeepPartial<AssessmentInput>): DemoCase => ({
  id, title, summary,
  input: () => {
    const a = merge(emptyAssessment(), patch);
    a.patient.assessedAt = nowLocalInput();
    return a;
  },
});

const neg = { status: "resulted", result: "negative", detail: "" } as const;

export const DEMO_CASES: DemoCase[] = [
  mk("mild-uc", "Mild UC", "32 F, left-sided UC, 4 stools/day with a little blood, stable.", {
    patient: { caseId: "SYN-01", ageYears: n(32), sex: "female", diagnosis: "uc", ucExtent: "E2", hasOstomy: "no" },
    presentation: { abdominalPain: "mild", stools24h: n(4), bloodyStools24h: n(1), usualStoolsPerDay: n(2),
      tri: { rectalBleeding: "yes", nocturnalBm: "no", distension: "no", vomiting: "no", cannotPassStoolGas: "no", fever: "no" } },
    exam: { tenderness: "none", abdominalMass: "none", tri: { guarding: "no", alteredMentation: "no", perianalFluctuance: "no" }, examinedByRole: "nurse" },
    vitals: { heartRate: n(78), sbp: n(122), dbp: n(76), temperature: n(36.8), respiratoryRate: n(16), spo2: n(98) },
    labs: { values: labs({ hemoglobin: { v: 131, u: "g/L" }, crp: { v: 6 }, esr: { v: 12 }, wbc: { v: 7.2 }, platelets: { v: 280 }, sodium: { v: 139 }, potassium: { v: 4.1 }, creatinine: { v: 71, u: "µmol/L" }, albumin: { v: 41, u: "g/L" } }) as never, cdiff: neg, stoolOther: neg },
    activity: { dayStools: n(4), nightStools: n(0), urgency: "1", sccaiBlood: "1", wellBeing5: "1", extracolonicUcAssessed: "no",
      mayoBleeding: "1", mayoPga: "1", lichtigerBlood: "1", incontinence: "no", antidiarrheals: "no", wellBeing6: "2" },
  }),
  mk("moderate-uc", "Moderate UC", "41 M, 7 stools/day, 4 bloody, nocturnal stools, C. difficile pending.", {
    patient: { caseId: "SYN-02", ageYears: n(41), sex: "male", diagnosis: "uc", ucExtent: "E3", hasOstomy: "no" },
    presentation: { abdominalPain: "moderate", stools24h: n(7), bloodyStools24h: n(4), usualStoolsPerDay: n(2),
      tri: { rectalBleeding: "yes", nocturnalBm: "yes", distension: "no", vomiting: "no", cannotPassStoolGas: "no", fever: "no" } },
    exam: { tenderness: "mild_localised", abdominalMass: "none", tri: { guarding: "no", alteredMentation: "no", perianalFluctuance: "no" }, examinedByRole: "intern" },
    vitals: { heartRate: n(88), sbp: n(118), dbp: n(74), temperature: n(37.4), respiratoryRate: n(18), spo2: n(98) },
    labs: { values: labs({ hemoglobin: { v: 11.8 }, crp: { v: 24 }, esr: { v: 26 }, wbc: { v: 9.8 }, platelets: { v: 410 }, sodium: { v: 137 }, potassium: { v: 3.9 }, creatinine: { v: 0.9 }, albumin: { v: 3.6 } }) as never,
      cdiff: { status: "pending" }, stoolOther: { status: "not_ordered" } },
    activity: { dayStools: n(5), nightStools: n(2), urgency: "2", sccaiBlood: "2", wellBeing5: "2", extracolonicUcAssessed: "no",
      mayoBleeding: "2", mayoPga: "2", lichtigerBlood: "2", incontinence: "no", antidiarrheals: "no", wellBeing6: "3" },
  }),
  mk("asuc", "Acute severe UC", "28 F on steroids, 10 stools/day (8 bloody), HR 108, CRP 86.", {
    patient: { caseId: "SYN-03", ageYears: n(28), sex: "female", diagnosis: "uc", ucExtent: "E3", immuno: ["corticosteroids"], hasOstomy: "no" },
    presentation: { abdominalPain: "moderate", stools24h: n(10), bloodyStools24h: n(8), usualStoolsPerDay: n(1),
      tri: { rectalBleeding: "yes", nocturnalBm: "yes", distension: "no", vomiting: "no", cannotPassStoolGas: "no", fever: "no" } },
    exam: { tenderness: "mild_moderate_diffuse", abdominalMass: "none", tri: { guarding: "no", alteredMentation: "no", perianalFluctuance: "no" }, examinedByRole: "nurse" },
    vitals: { heartRate: n(108), sbp: n(112), dbp: n(70), temperature: n(38.0), respiratoryRate: n(20), spo2: n(97) },
    labs: { values: labs({ hemoglobin: { v: 10.1 }, crp: { v: 86 }, esr: { v: 42 }, wbc: { v: 13.4 }, platelets: { v: 520 }, sodium: { v: 134 }, potassium: { v: 3.3 }, creatinine: { v: 0.9 }, albumin: { v: 2.9 } }) as never, cdiff: neg, stoolOther: neg },
    activity: { dayStools: n(7), nightStools: n(3), urgency: "2", sccaiBlood: "3", wellBeing5: "3", extracolonicUcAssessed: "no",
      mayoBleeding: "3", mayoPga: "3", lichtigerBlood: "3", incontinence: "no", antidiarrheals: "no", wellBeing6: "4" },
  }),
  mk("cd-flare", "Crohn's flare", "36 M on anti-TNF, 6 liquid stools, moderate pain, arthralgia.", {
    patient: { caseId: "SYN-04", ageYears: n(36), sex: "male", diagnosis: "cd", cdLocation: "L3", cdPerianal: "no", immuno: ["antiTnf"], hasOstomy: "no" },
    presentation: { abdominalPain: "moderate", stools24h: n(6), tri: { perianalSymptoms: "no", vomiting: "no", distension: "no", cannotPassStoolGas: "no", fever: "no", rectalBleeding: "no" } },
    exam: { tenderness: "mild_localised", abdominalMass: "dubious", tri: { guarding: "no", alteredMentation: "no", perianalFluctuance: "no" }, examinedByRole: "nurse" },
    vitals: { heartRate: n(96), sbp: n(124), dbp: n(78), temperature: n(37.6), respiratoryRate: n(18), spo2: n(98) },
    labs: { values: labs({ hemoglobin: { v: 12.4 }, crp: { v: 38 }, wbc: { v: 10.1 }, platelets: { v: 390 }, sodium: { v: 138 }, potassium: { v: 4.0 }, creatinine: { v: 1.0 }, albumin: { v: 3.5 } }) as never, cdiff: neg, stoolOther: neg },
    activity: { wellBeing5: "2", liquidStoolsPrevDay: n(6), hbiComplicationsAssessed: "yes", hbiComplications: ["arthralgia"] },
  }),
  mk("cd-obstruction", "Crohn's with possible obstruction", "52 F, previous resection, vomiting, distended, no flatus. HBI only 6.", {
    patient: { caseId: "SYN-05", ageYears: n(52), sex: "female", diagnosis: "cd", cdLocation: "L1", cdPerianal: "no", surgeries: "Ileocecal resection 2019", hasOstomy: "no" },
    presentation: { abdominalPain: "severe", stools24h: n(0), tri: { vomiting: "yes", distension: "yes", cannotPassStoolGas: "yes", perianalSymptoms: "no", fever: "no", rectalBleeding: "no" } },
    exam: { tenderness: "mild_moderate_diffuse", abdominalMass: "none", tri: { guarding: "no", alteredMentation: "no", perianalFluctuance: "no" }, examinedByRole: "intern" },
    vitals: { heartRate: n(104), sbp: n(128), dbp: n(80), temperature: n(37.2), respiratoryRate: n(20), spo2: n(97) },
    labs: { values: labs({ hemoglobin: { v: 13.0 }, crp: { v: 45 }, wbc: { v: 11.2 }, platelets: { v: 300 }, sodium: { v: 133 }, potassium: { v: 3.4 }, creatinine: { v: 1.3 }, albumin: { v: 3.8 } }) as never, cdiff: { status: "not_ordered" }, stoolOther: { status: "not_ordered" } },
    activity: { wellBeing5: "3", liquidStoolsPrevDay: n(0), hbiComplicationsAssessed: "no" },
  }),
  mk("toxic-megacolon", "Suspected toxic megacolon", "45 M, distended, T 38.9, HR 128, colon dilated on X-ray.", {
    patient: { caseId: "SYN-06", ageYears: n(45), sex: "male", diagnosis: "uc", ucExtent: "E3", hasOstomy: "no" },
    presentation: { abdominalPain: "severe", stools24h: n(8), bloodyStools24h: n(6), usualStoolsPerDay: n(1),
      tri: { rectalBleeding: "yes", nocturnalBm: "yes", distension: "yes", dehydrationSymptoms: "yes", vomiting: "no", cannotPassStoolGas: "no", fever: "yes" } },
    exam: { tenderness: "mild_moderate_diffuse", abdominalMass: "none", tri: { guarding: "no", alteredMentation: "no", perianalFluctuance: "no" }, examinedByRole: "physician" },
    vitals: { heartRate: n(128), sbp: n(92), dbp: n(58), temperature: n(38.9), respiratoryRate: n(24), spo2: n(95) },
    imaging: { done: "yes", colonicDilatation: "yes", freeAir: "no", collection: "no" },
    labs: { values: labs({ hemoglobin: { v: 9.2 }, crp: { v: 160 }, esr: { v: 55 }, wbc: { v: 15.8 }, platelets: { v: 480 }, sodium: { v: 131 }, potassium: { v: 3.0 }, creatinine: { v: 1.2 }, albumin: { v: 2.5 }, lactate: { v: 2.6 } }) as never, cdiff: { status: "pending" }, stoolOther: { status: "pending" } },
    activity: { dayStools: n(6), nightStools: n(2), urgency: "2", sccaiBlood: "3", wellBeing5: "4", extracolonicUcAssessed: "no",
      mayoBleeding: "3", mayoPga: "3", lichtigerBlood: "3", incontinence: "no", antidiarrheals: "no", wellBeing6: "5" },
  }),
  mk("gi-bleed", "Significant GI bleeding", "60 M, 9 bloody stools, SBP 86, HR 118, Hb 6.8.", {
    patient: { caseId: "SYN-07", ageYears: n(60), sex: "male", diagnosis: "uc", ucExtent: "E3", hasOstomy: "no" },
    presentation: { abdominalPain: "mild", stools24h: n(9), bloodyStools24h: n(9), usualStoolsPerDay: n(1),
      tri: { rectalBleeding: "yes", nocturnalBm: "yes", distension: "no", vomiting: "no", cannotPassStoolGas: "no", fever: "no" } },
    exam: { tenderness: "mild_localised", abdominalMass: "none", tri: { guarding: "no", alteredMentation: "no", perianalFluctuance: "no" }, examinedByRole: "nurse" },
    vitals: { heartRate: n(118), sbp: n(86), dbp: n(52), temperature: n(36.9), respiratoryRate: n(22), spo2: n(96) },
    labs: { values: labs({ hemoglobin: { v: 68, u: "g/L" }, crp: { v: 40 }, esr: { v: 35 }, wbc: { v: 9.0 }, platelets: { v: 210 }, sodium: { v: 138 }, potassium: { v: 4.0 }, creatinine: { v: 1.4 }, albumin: { v: 3.1 }, lactate: { v: 3.1 } }) as never, cdiff: { status: "pending" }, stoolOther: { status: "not_ordered" } },
    activity: { mayoBleeding: "3", mayoPga: "3" },
  }),
  mk("dehydration", "Dehydration", "23 F Crohn's, 12 liquid stools, vomiting, little urine, K 3.1.", {
    patient: { caseId: "SYN-08", ageYears: n(23), sex: "female", diagnosis: "cd", cdLocation: "L2", cdPerianal: "no", hasOstomy: "no" },
    presentation: { abdominalPain: "mild", stools24h: n(12), tri: { reducedUrine: "yes", dehydrationSymptoms: "yes", vomiting: "yes", distension: "no", cannotPassStoolGas: "no", perianalSymptoms: "no", fever: "no", rectalBleeding: "no" } },
    exam: { tenderness: "mild_localised", abdominalMass: "none", tri: { guarding: "no", alteredMentation: "no", perianalFluctuance: "no" }, examinedByRole: "nurse" },
    vitals: { heartRate: n(112), sbp: n(98), dbp: n(60), temperature: n(37.3), respiratoryRate: n(18), spo2: n(99) },
    labs: { values: labs({ hemoglobin: { v: 14.2 }, crp: { v: 22 }, wbc: { v: 10.0 }, platelets: { v: 330 }, sodium: { v: 131 }, potassium: { v: 3.1 }, creatinine: { v: 1.6 }, albumin: { v: 3.9 } }) as never, cdiff: { status: "pending" }, stoolOther: { status: "pending" } },
    activity: { wellBeing5: "2", liquidStoolsPrevDay: n(12), hbiComplicationsAssessed: "no" },
  }),
  mk("infection", "Suspected infection", "38 F UC on azathioprine, T 38.7, WBC 14.2, C. difficile positive.", {
    patient: { caseId: "SYN-09", ageYears: n(38), sex: "female", diagnosis: "uc", ucExtent: "E2", immuno: ["thiopurine"], hasOstomy: "no" },
    presentation: { abdominalPain: "moderate", stools24h: n(8), bloodyStools24h: n(3), usualStoolsPerDay: n(2),
      tri: { rectalBleeding: "yes", nocturnalBm: "yes", fever: "yes", distension: "no", vomiting: "no", cannotPassStoolGas: "no" } },
    exam: { tenderness: "mild_moderate_diffuse", abdominalMass: "none", tri: { guarding: "no", alteredMentation: "no", perianalFluctuance: "no" }, examinedByRole: "intern" },
    vitals: { heartRate: n(104), sbp: n(108), dbp: n(66), temperature: n(38.7), respiratoryRate: n(21), spo2: n(97) },
    labs: { values: labs({ hemoglobin: { v: 12.2 }, crp: { v: 70 }, esr: { v: 28 }, wbc: { v: 14.2 }, platelets: { v: 350 }, sodium: { v: 136 }, potassium: { v: 3.7 }, creatinine: { v: 1.0 }, albumin: { v: 3.4 } }) as never,
      cdiff: { status: "resulted", result: "positive", detail: "" }, stoolOther: neg },
    activity: { dayStools: n(6), nightStools: n(2), urgency: "2", sccaiBlood: "2", wellBeing5: "2", extracolonicUcAssessed: "no",
      mayoBleeding: "2", mayoPga: "2", lichtigerBlood: "1", incontinence: "no", antidiarrheals: "no", wellBeing6: "3" },
  }),
  mk("incomplete", "Incomplete lab assessment", "50 M, 6 bloody stools, labs still pending — severity can't be decided yet.", {
    patient: { caseId: "SYN-10", ageYears: n(50), sex: "male", diagnosis: "uc", hasOstomy: "no" },
    presentation: { abdominalPain: "mild", stools24h: n(7), bloodyStools24h: n(6),
      tri: { rectalBleeding: "yes", distension: "no", vomiting: "no", cannotPassStoolGas: "no" } },
    exam: { tenderness: "not_assessed", abdominalMass: "not_assessed" },
    vitals: { heartRate: n(86), sbp: n(130), dbp: n(80), temperature: n(37.5) },
    labs: { values: labs({ hemoglobin: "pending", crp: "pending", esr: "pending", wbc: "pending", albumin: "not_ordered" }) as never, cdiff: { status: "not_ordered" } },
  }),
  mk("peds-asc", "Pediatric acute severe UC", "14 F, PUCAI 70. Adult vital-sign thresholds not applied.", {
    patient: { caseId: "SYN-11", ageYears: n(14), sex: "female", diagnosis: "uc", ucExtent: "E3", hasOstomy: "no" },
    presentation: { abdominalPain: "severe", stools24h: n(7), bloodyStools24h: n(6),
      tri: { rectalBleeding: "yes", nocturnalBm: "yes", distension: "no", vomiting: "no", cannotPassStoolGas: "no" } },
    exam: { tenderness: "mild_moderate_diffuse", abdominalMass: "none", tri: { guarding: "no", alteredMentation: "no", perianalFluctuance: "no" }, examinedByRole: "physician" },
    vitals: { heartRate: n(120), sbp: n(104), dbp: n(64), temperature: n(37.9), respiratoryRate: n(22), spo2: n(98) },
    labs: { values: labs({ hemoglobin: { v: 10.4 }, crp: { v: 52 }, albumin: { v: 3.0 } }) as never, cdiff: { status: "pending" } },
    activity: { pucaiPain: "10", pucaiBleeding: "20", pucaiConsistency: "10", pucaiActivity: "10" },
  }),
];
