import type { Assessment } from "../assessment-schema";
import type { Facts } from "../facts";
import type { Ctx, ScoreResult } from "../types";
import { additive, answerLabel, coded, item } from "./common";
import { WELLBEING5 } from "./uc";

export const HBI_COMPLICATIONS = {
  arthralgia: "Arthralgia",
  uveitis: "Uveitis",
  erythema_nodosum: "Erythema nodosum",
  aphthous_ulcers: "Aphthous ulcers",
  pyoderma_gangrenosum: "Pyoderma gangrenosum",
  anal_fissure: "Anal fissure",
  new_fistula: "New fistula",
  abscess: "Abscess",
};

export const PDAI_ITEMS = {
  pdaiDischarge: { label: "Discharge", options: ["None", "Minimal mucous", "Moderate mucous or purulent", "Substantial", "Gross fecal soiling"] },
  pdaiPain: { label: "Pain / restriction of activities", options: ["No restriction", "Mild discomfort, no restriction", "Moderate discomfort, some limitation", "Marked discomfort, marked limitation", "Severe pain, severe limitation"] },
  pdaiSexual: { label: "Restriction of sexual activity", options: ["None", "Slight", "Moderate", "Marked", "Unable to engage"] },
  pdaiType: { label: "Type of perianal disease", options: ["None / skin tags", "Anal fissure or mucosal tear", "< 3 perianal fistulae", "≥ 3 perianal fistulae", "Sphincter ulceration or fistulae with significant undermining of skin"] },
  pdaiInduration: { label: "Degree of induration", options: ["None", "Minimal", "Moderate", "Substantial", "Gross fluctuance / abscess"] },
} as const;

const PAIN4: Record<string, number> = { none: 0, mild: 1, moderate: 2, severe: 3 };
const MASS: Record<string, number> = { none: 0, dubious: 1, definite: 2, definite_tender: 3 };
const MASS_LABEL: Record<string, string> = { none: "None", dubious: "Dubious", definite: "Definite", definite_tender: "Definite and tender", not_assessed: "Not assessed" };

export function hbi(a: Assessment, _f: Facts, ctx: Ctx): ScoreResult {
  const x = a.activity;
  const pain = a.presentation.abdominalPain;
  const mass = a.exam.abdominalMass;
  const liquid = x.liquidStoolsPrevDay;
  const comps = x.hbiComplicationsAssessed === "yes" ? x.hbiComplications.length : x.hbiComplicationsAssessed === "no" ? 0 : null;
  const components = [
    item("wb", "General well-being", answerLabel(x.wellBeing5, WELLBEING5), coded(x.wellBeing5), "very well 0 … terrible 4"),
    item("pain", "Abdominal pain", pain || null, pain in PAIN4 ? PAIN4[pain] : null, "none 0 · mild 1 · moderate 2 · severe 3"),
    item("liquid", "Liquid stools (previous day)", liquid ?? null, liquid ?? null, "1 point per stool"),
    item("mass", "Abdominal mass", MASS_LABEL[mass] ?? null, mass in MASS ? MASS[mass] : null, "none 0 · dubious 1 · definite 2 · definite and tender 3"),
    item("comp", "Complications", comps == null ? null : x.hbiComplications.map((c) => HBI_COMPLICATIONS[c]).join(", ") || "None", comps, "1 point each"),
  ];
  const ostomy = a.patient.hasOstomy === "yes";
  const r = additive("hbi", components, ctx, { min: 0, max: null }, ostomy ? null : (t) =>
    t < 5 ? { label: "Remission", band: "remission", rule: "< 5" }
      : t <= 7 ? { label: "Mild", band: "mild", rule: "5–7" }
        : t <= 16 ? { label: "Moderate", band: "moderate", rule: "8–16" }
          : { label: "Severe", band: "severe", rule: "> 16" });
  if (ostomy) r.notes.push("Patient has a stoma: the stool item is not valid, so no interpretation is shown.");
  return r;
}

export function pdai(a: Assessment, _f: Facts, ctx: Ctx): ScoreResult {
  const x = a.activity;
  const components = (Object.keys(PDAI_ITEMS) as (keyof typeof PDAI_ITEMS)[]).map((k) => {
    const v = x[k];
    const n = coded(v);
    return item(k, PDAI_ITEMS[k].label, n == null ? (v === "not_assessed" ? "Not assessed" : null) : PDAI_ITEMS[k].options[n], n, "0–4");
  });
  return additive("pdai", components, ctx, { min: 0, max: 20 }, (t) =>
    t > 4 ? { label: "Active perianal disease", band: "other", rule: "> 4" } : { label: "Not active by PDAI", band: "other", rule: "≤ 4" });
}
