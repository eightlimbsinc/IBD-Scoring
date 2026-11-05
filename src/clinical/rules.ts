import type { Assessment } from "./assessment-schema";
import { fmt, gt, gte, lt, lte, triBool, type Facts } from "./facts";
import { LOCAL_PROTOCOL } from "./spec/local-protocol";
import type { ClinicalWarning, MissingInvestigation, ScoreResult } from "./types";

const T = LOCAL_PROTOCOL.thresholds;

/** Count criteria; returns count of true and the labels of unknown criteria. */
function countCriteria(list: { label: string; v: boolean | undefined }[]) {
  return {
    count: list.filter((c) => c.v === true).length,
    unknown: list.filter((c) => c.v === undefined).map((c) => c.label),
    items: list.filter((c) => c.v === true).map((c) => c.label),
  };
}

export function qsofa(a: Assessment, f: Facts) {
  return countCriteria([
    { label: `RR ≥ 22 (${fmt(f.rr)})`, v: gte(f.rr, 22) },
    { label: `SBP ≤ 100 (${fmt(f.sbp)})`, v: lte(f.sbp, 100) },
    { label: "Altered mentation", v: triBool(a.exam.tri.alteredMentation) },
  ]);
}

export function sirs(f: Facts) {
  const temp = f.tempC == null ? undefined : f.tempC > 38 || f.tempC < 36;
  const wbc = f.lab.wbc == null ? undefined : f.lab.wbc > 12 || f.lab.wbc < 4;
  return countCriteria([
    { label: `Temp > 38 or < 36 °C (${fmt(f.tempC, 1)})`, v: temp },
    { label: `HR > 90 (${fmt(f.hr)})`, v: gt(f.hr, 90) },
    { label: `RR > 20 (${fmt(f.rr)})`, v: gt(f.rr, 20) },
    { label: `WBC > 12 or < 4 ×10⁹/L (${fmt(f.lab.wbc, 1)})`, v: wbc },
  ]);
}

/** WHO anaemia: Hb < 13 (male) / < 12 (female). Unknown sex → only decided when unambiguous. */
function anaemia(f: Facts): boolean | undefined {
  const hb = f.lab.hemoglobin;
  if (hb == null) return undefined;
  if (f.sex === "male") return hb < 13;
  if (f.sex === "female") return hb < 12;
  if (hb < 12) return true;
  if (hb >= 13) return false;
  return undefined;
}

export function evaluateWarnings(a: Assessment, f: Facts, pathway: "adult" | "pediatric" | null, scores: ScoreResult[]): ClinicalWarning[] {
  const w: ClinicalWarning[] = [];
  const add = (x: ClinicalWarning) => w.push(x);
  const tri = (v: Parameters<typeof triBool>[0]) => triBool(v);
  const p = a.presentation;
  const ex = a.exam;
  const img = a.imaging;
  const adult = pathway !== "pediatric";

  // --- Severe disease activity criteria ---
  const twMod = scores.find((s) => s.scoreId === "tw_modified");
  if (twMod?.interpretation?.band === "severe") {
    add({ id: "W-ASUC", group: "severe_activity", severity: "emergency", category: "B", status: "met",
      title: "Meets criteria for acute severe ulcerative colitis",
      because: [twMod.interpretation.rule], source: "Truelove & Witts / ECCO 2022, BSG 2025" });
  }
  const puc = scores.find((s) => s.scoreId === "pucai");
  if (puc?.total != null && puc.total >= 65) {
    add({ id: "W-PED-ASC", group: "severe_activity", severity: "emergency", category: "B", status: "met",
      title: "PUCAI ≥ 65: acute severe colitis (pediatric)", because: [`PUCAI ${puc.total}`], source: "ECCO/ESPGHAN 2018" });
  }

  // --- Toxic megacolon (Jalan) ---
  const systemic = countCriteria([
    { label: `Temp > 38.6 °C (${fmt(f.tempC, 1)})`, v: gt(f.tempC, 38.6) },
    { label: `HR > 120 (${fmt(f.hr)})`, v: gt(f.hr, 120) },
    { label: `WBC > 10.5 ×10⁹/L (${fmt(f.lab.wbc, 1)})`, v: gt(f.lab.wbc, 10.5) },
    { label: `Anaemia (Hb ${fmt(f.lab.hemoglobin, 1)} g/dL)`, v: anaemia(f) },
  ]);
  const electrolyte = f.lab.sodium == null && f.lab.potassium == null ? undefined
    : (f.lab.sodium != null && (f.lab.sodium < 135 || f.lab.sodium > 145)) || (f.lab.potassium != null && f.lab.potassium < 3.5);
  const hypot = f.sbp == null ? undefined : f.sbp < T.hypotensionSbp.value;
  const other = countCriteria([
    { label: "Dehydration", v: tri(p.tri.dehydrationSymptoms) === true || tri(p.tri.reducedUrine) === true ? true : tri(p.tri.dehydrationSymptoms) },
    { label: "Altered consciousness", v: tri(ex.tri.alteredMentation) },
    { label: "Electrolyte disturbance", v: electrolyte },
    { label: "Hypotension", v: hypot },
  ]);
  if (tri(img.colonicDilatation) === true && systemic.count >= 3 && other.count >= 1) {
    add({ id: "W-TOXIC-MEGACOLON", group: "immediate", severity: "emergency", category: "B", status: "met",
      title: "Meets toxic megacolon criteria", because: ["Colonic dilatation on imaging", ...systemic.items, ...other.items], source: "Jalan 1969" });
  } else if ((tri(img.colonicDilatation) === true || tri(p.tri.distension) === true) && systemic.count >= 3) {
    add({ id: "W-TOXIC-MEGACOLON-POSSIBLE", group: "immediate", severity: "emergency", category: "B", status: "possible",
      title: "Possible toxic megacolon",
      because: [tri(img.colonicDilatation) ? "Colonic dilatation on imaging" : "Abdominal distension (no imaging confirmation)", ...systemic.items],
      source: "Jalan 1969 (adapted, spec TM-1)" });
  }

  // --- Perforation / peritonism ---
  const periton: string[] = [];
  if (tri(ex.tri.guarding)) periton.push("Guarding, rigidity or rebound");
  if (ex.tenderness === "severe_or_rebound") periton.push("Severe or rebound tenderness");
  if (tri(img.freeAir)) periton.push("Free air on imaging");
  if (periton.length) {
    add({ id: "W-PERITONISM", group: "immediate", severity: "emergency", category: "B", status: tri(img.freeAir) ? "met" : "possible",
      title: tri(img.freeAir) ? "Free air: suspected perforation" : "Peritoneal signs: possible perforation", because: periton, source: "WSES-AAST 2021" });
  }

  // --- Obstruction ---
  const obst: string[] = [];
  if (tri(p.tri.cannotPassStoolGas)) obst.push("Unable to pass stool or gas");
  if (tri(p.tri.vomiting) && tri(p.tri.distension)) obst.push("Vomiting with abdominal distension");
  if (obst.length) {
    add({ id: "W-OBSTRUCTION", group: "immediate", severity: "emergency", category: "B", status: "possible",
      title: "Possible bowel obstruction", because: obst, source: "WSES-AAST 2021 (spec OB-1)" });
  }

  // --- Bleeding (local) ---
  const bleeding = tri(p.tri.rectalBleeding) === true || (p.bloodyStools24h ?? 0) > 0;
  if (bleeding) {
    const why: string[] = [];
    if (adult && lt(f.sbp, T.hypotensionSbp.value)) why.push(`SBP ${f.sbp} < ${T.hypotensionSbp.value}`);
    if (adult && f.hr != null && f.sbp != null && f.hr / f.sbp >= T.bleedingShockIndex.value) why.push(`Shock index ${(f.hr / f.sbp).toFixed(2)} ≥ ${T.bleedingShockIndex.value}`);
    if (lt(f.lab.hemoglobin, T.bleedingHb.value)) why.push(`Hb ${f.lab.hemoglobin?.toFixed(1)} < ${T.bleedingHb.value} g/dL`);
    if (why.length) add({ id: "W-BLEEDING", group: "immediate", severity: "emergency", category: "D", status: "possible",
      title: "Rectal bleeding with instability or low hemoglobin", because: why, source: "Local protocol (spec BL-1)" });
  }

  // --- Abscesses ---
  const fever = (f.tempC != null && f.tempC > 38) || tri(p.tri.fever) === true;
  if (f.diagnosis === "cd") {
    const why: string[] = [];
    if (fever && ex.abdominalMass === "definite_tender") why.push("Fever with a tender abdominal mass");
    if (a.activity.hbiComplications.includes("abscess")) why.push("Abscess recorded");
    if (tri(img.collection)) why.push("Collection on imaging");
    if (why.length) add({ id: "W-ABSCESS", group: "surgical", severity: "emergency", category: "B", status: tri(img.collection) ? "met" : "possible",
      title: "Possible intra-abdominal abscess", because: why, source: "ECCO-ESGAR 2019; WSES-AAST 2021 (spec AB-1)" });
  }
  const peri: string[] = [];
  if (tri(ex.tri.perianalFluctuance)) peri.push("Perianal swelling or fluctuance");
  if (a.activity.pdaiInduration === "4") peri.push("PDAI induration: gross fluctuance / abscess");
  if (peri.length) add({ id: "W-PERIANAL-ABSCESS", group: "surgical", severity: "emergency", category: "B", status: "possible",
    title: "Possible perianal abscess", because: peri, source: "WSES-AAST 2021" });

  // --- Physiological instability (adult thresholds only) ---
  let qs: ReturnType<typeof qsofa> | null = null;
  let si: ReturnType<typeof sirs> | null = null;
  if (adult) {
    qs = qsofa(a, f);
    si = sirs(f);
    const sepsis: string[] = [];
    if (qs.count >= 2) sepsis.push(`qSOFA ${qs.count}/3: ${qs.items.join(", ")}`);
    if (si.count >= 2 && (fever || tri(p.tri.fever))) sepsis.push(`SIRS ${si.count}/4 with fever: ${si.items.join(", ")}`);
    if (gte(f.lab.lactate, 2)) sepsis.push(`Lactate ${f.lab.lactate?.toFixed(1)} ≥ 2 mmol/L`);
    if (sepsis.length) add({ id: "W-SEPSIS", group: "infection", severity: "emergency", category: "B", status: "possible",
      title: "Possible sepsis", because: sepsis, source: "Sepsis-3 (2016); Surviving Sepsis Campaign 2021 (spec SP-1)" });

    const hyp: string[] = [];
    if (lt(f.sbp, T.hypotensionSbp.value)) hyp.push(`SBP ${f.sbp} mmHg`);
    if (lt(f.map, T.hypotensionMap.value)) hyp.push(`MAP ${Math.round(f.map!)} mmHg`);
    if (hyp.length) add({ id: "W-HYPOTENSION", group: "physiological", severity: "emergency", category: "D", status: "met",
      title: "Hypotension", because: hyp, source: `Local protocol: ${T.hypotensionSbp.rule} or ${T.hypotensionMap.rule}` });

    if (gt(f.hr, T.tachycardiaMarked.value)) add({ id: "W-TACHY-MARKED", group: "physiological", severity: "emergency", category: "D", status: "met",
      title: "Marked tachycardia", because: [`HR ${f.hr} bpm`], source: `Local protocol: ${T.tachycardiaMarked.rule}` });
    else if (gt(f.hr, T.tachycardia.value)) add({ id: "W-TACHY", group: "physiological", severity: "warning", category: "D", status: "met",
      title: "Tachycardia", because: [`HR ${f.hr} bpm`], source: `Local protocol: ${T.tachycardia.rule}` });

    if (lt(f.spo2, T.hypoxia.value)) add({ id: "W-HYPOXIA", group: "physiological", severity: "warning", category: "D", status: "met",
      title: "Low oxygen saturation", because: [`SpO₂ ${f.spo2}%`], source: `Local protocol: ${T.hypoxia.rule}` });
  } else {
    add({ id: "I-PEDS-VITALS", group: "physiological", severity: "info", category: "D", status: "met",
      title: "Adult vital-sign thresholds are not applied to children",
      because: ["Use pediatric age-specific reference ranges"], source: "Spec §4" });
  }

  const dehyd: string[] = [];
  if (tri(p.tri.reducedUrine)) dehyd.push("Reduced urine output");
  if (tri(p.tri.dehydrationSymptoms)) dehyd.push("Dehydration symptoms");
  if (dehyd.length) add({ id: "W-DEHYDRATION", group: "physiological", severity: "warning", category: "D", status: "possible",
    title: "Possible dehydration", because: dehyd, source: "Local protocol (spec DH-1)" });

  if (lt(f.lab.potassium, T.hypokalemia.value)) add({ id: "W-HYPOKALAEMIA", group: "physiological", severity: f.lab.potassium! < 3 ? "emergency" : "warning", category: "D", status: "met",
    title: f.lab.potassium! < 3 ? "Severe hypokalemia" : "Hypokalemia", because: [`K ${f.lab.potassium!.toFixed(1)} mmol/L`], source: `Local protocol: ${T.hypokalemia.rule}` });

  // --- Infection ---
  const inf: string[] = [];
  if (a.labs.cdiff.status === "resulted" && a.labs.cdiff.result === "positive") inf.push("C. difficile positive");
  if (a.labs.stoolOther.status === "resulted" && a.labs.stoolOther.result === "positive") inf.push(`Stool pathogen positive${a.labs.stoolOther.detail ? `: ${a.labs.stoolOther.detail}` : ""}`);
  if (inf.length) add({ id: "W-CDIFF", group: "infection", severity: "warning", category: "B", status: "met",
    title: "Enteric infection detected", because: inf, source: "ECCO infections guideline 2021" });

  // --- Masking ---
  if (a.patient.immuno.length > 0) add({ id: "I-MASKING", group: "surgical", severity: "info", category: "B", status: "met",
    title: "Steroids or immunosuppressants: fever and peritoneal signs may be masked",
    because: a.patient.immuno.map((m) => m.replace(/([A-Z])/g, " $1").toLowerCase()), source: "WSES-AAST 2021" });

  return w;
}

const STATUS_LABEL: Record<string, string> = { not_recorded: "not recorded", not_ordered: "not ordered", pending: "pending", not_available: "not available" };

export function missingInvestigations(a: Assessment, f: Facts): MissingInvestigation[] {
  const list: { id: string; label: string; status: string }[] = [
    { id: "hemoglobin", label: "Hemoglobin (CBC)", status: f.labStatus.hemoglobin },
    { id: "wbc", label: "White cell count", status: f.labStatus.wbc },
    { id: "platelets", label: "Platelets", status: f.labStatus.platelets },
    { id: "crp", label: "CRP", status: f.labStatus.crp },
    { id: "sodium", label: "Sodium", status: f.labStatus.sodium },
    { id: "potassium", label: "Potassium", status: f.labStatus.potassium },
    { id: "creatinine", label: "Creatinine", status: f.labStatus.creatinine },
    { id: "albumin", label: "Albumin", status: f.labStatus.albumin },
    { id: "cdiff", label: "C. difficile", status: a.labs.cdiff.status || "not_recorded" },
    { id: "stool", label: "Stool culture / pathogens", status: a.labs.stoolOther.status || "not_recorded" },
  ];
  return list
    .filter((x) => x.status !== "resulted")
    .map((x) => ({ ...x, status: STATUS_LABEL[x.status] ?? x.status }));
}
