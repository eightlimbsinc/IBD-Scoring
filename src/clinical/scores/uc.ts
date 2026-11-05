import type { Assessment } from "../assessment-schema";
import { gt, lt, fmt, type Facts } from "../facts";
import { LOCAL_PROTOCOL } from "../spec/local-protocol";
import { SPEC_VERSION } from "../spec/version";
import type { Ctx, ScoreComponent, ScoreResult } from "../types";
import { additive, answerLabel, coded, item, meta } from "./common";

/* ---------- labels (shared with UI) ---------- */

export const WELLBEING5 = { "0": "Very well", "1": "Slightly below par", "2": "Poor", "3": "Very poor", "4": "Terrible" };
export const SCCAI_URGENCY = { "0": "None", "1": "Hurry", "2": "Immediately", "3": "Incontinence" };
export const SCCAI_BLOOD = { "0": "None", "1": "Trace", "2": "Occasionally frank", "3": "Usually frank" };
export const MAYO_BLEEDING = { "0": "No blood seen", "1": "Streaks of blood, less than half the time", "2": "Obvious blood most of the time", "3": "Blood alone passed" };
export const MAYO_PGA = { "0": "Normal", "1": "Mild disease", "2": "Moderate disease", "3": "Severe disease" };
export const MAYO_ENDO = { "0": "Normal / inactive", "1": "Mild (erythema, ↓ vascular pattern, mild friability)", "2": "Moderate (marked erythema, absent vascular pattern, friability, erosions)", "3": "Severe (spontaneous bleeding, ulceration)" };
export const LICHTIGER_BLOOD = { "0": "None (0%)", "1": "Less than 50%", "2": "50% or more", "3": "All stools (100%)" };
export const WELLBEING6 = { "0": "Perfect", "1": "Very good", "2": "Good", "3": "Average", "4": "Poor", "5": "Terrible" };
export const PUCAI_PAIN = { "0": "No pain", "5": "Pain can be ignored", "10": "Pain cannot be ignored" };
export const PUCAI_BLEEDING = { "0": "None", "10": "Small amount, in < 50% of stools", "20": "Small amount with most stools", "30": "Large amount (> 50% of stool content)" };
export const PUCAI_CONSISTENCY = { "0": "Formed", "5": "Partially formed", "10": "Completely unformed" };
export const PUCAI_ACTIVITY = { "0": "No limitation", "5": "Occasional limitation", "10": "Severely restricted" };
export const UC_EXTRACOLONIC = { arthritis: "Arthritis", uveitis: "Uveitis", erythema_nodosum: "Erythema nodosum", pyoderma_gangrenosum: "Pyoderma gangrenosum" };

const PAIN4: Record<string, number> = { none: 0, mild: 1, moderate: 2, severe: 3 };
const TENDER: Record<string, number> = { none: 0, mild_localised: 1, mild_moderate_diffuse: 2, severe_or_rebound: 3 };
const TENDER_LABEL: Record<string, string> = { none: "None", mild_localised: "Mild and localised", mild_moderate_diffuse: "Mild–moderate and diffuse", severe_or_rebound: "Severe or rebound", not_assessed: "Not assessed" };

const yn = (v: string | undefined) => (v === "yes" ? 1 : v === "no" ? 0 : null);
const ynLabel = (v: string | undefined) => (v === "yes" ? "Yes" : v === "no" ? "No" : v === "unknown" ? "Unknown" : null);

/* ---------- Truelove & Witts (classic and modified) ---------- */

export function trueloveWitts(a: Assessment, f: Facts, ctx: Ctx, modified: boolean): ScoreResult {
  const id = modified ? "tw_modified" : "tw_severity";
  const m = meta(id);
  const bloody = a.presentation.bloodyStools24h;
  const crpCut = LOCAL_PROTOCOL.thresholds.asucCrp.value;

  const criteria: { label: string; met: boolean | undefined; answer: string; rule: string }[] = [
    { label: "Heart rate", met: gt(f.hr, 90), answer: `${fmt(f.hr)} bpm`, rule: "> 90 bpm" },
    { label: "Temperature", met: gt(f.tempC, 37.8), answer: `${fmt(f.tempC, 1)} °C`, rule: "> 37.8 °C" },
    { label: "Hemoglobin", met: lt(f.lab.hemoglobin, 10.5), answer: `${fmt(f.lab.hemoglobin, 1)} g/dL`, rule: "< 10.5 g/dL" },
    { label: "ESR", met: gt(f.lab.esr, 30), answer: `${fmt(f.lab.esr)} mm/h`, rule: "> 30 mm/h" },
  ];
  if (modified) criteria.push({ label: "CRP", met: gt(f.lab.crp, crpCut), answer: `${fmt(f.lab.crp, 1)} mg/L`, rule: `> ${crpCut} mg/L (in place of ESR)` });

  const components: ScoreComponent[] = [
    item("bloody", "Bloody stools / 24 h", bloody ?? null, bloody == null ? null : bloody >= 6 ? 1 : 0, "≥ 6 required for severe"),
    ...criteria.map((c) => item(c.label, c.label, c.answer, c.met == null ? null : c.met ? 1 : 0, c.rule)),
  ];

  const base = {
    scoreId: id, scoreName: m.name, category: m.category, specVersion: SPEC_VERSION, specStatus: m.specStatus,
    total: null, range: { min: 0, max: null }, components, calculatedAt: ctx.now, notes: [] as string[],
    references: [{ citation: m.reference, doi: m.doi }, ...(modified ? [{ citation: "Truelove SC, Witts LJ. BMJ 1955;2:1041–1048", doi: "10.1136/bmj.2.4947.1041" }] : [])],
  };
  const unapproved = m.specStatus === "approved" ? ("approved" as const) : ("unapproved" as const);

  if (bloody == null) {
    return { ...base, status: "incomplete", interpretation: null, interpretationStatus: "none", missing: ["Bloody stools / 24 h"] };
  }
  const systemicMet = criteria.filter((c) => c.met === true);
  const unknown = criteria.filter((c) => c.met === undefined).map((c) => c.label);

  if (bloody >= 6 && systemicMet.length > 0) {
    return {
      ...base, status: "complete", missing: unknown,
      interpretation: { label: modified ? "Meets acute severe UC criteria" : "Severe (Truelove & Witts)", band: "severe", rule: `≥ 6 bloody stools + ${systemicMet.map((c) => c.label).join(", ")}` },
      interpretationStatus: unapproved,
    };
  }
  if (bloody >= 6 && unknown.length > 0) {
    return { ...base, status: "incomplete", interpretation: null, interpretationStatus: "none", missing: unknown, notes: ["≥ 6 bloody stools: severe criteria may be met — complete the missing items."] };
  }
  return {
    ...base, status: "complete", missing: unknown,
    interpretation: { label: "Severe criteria not met", band: "other", rule: bloody < 6 ? "< 6 bloody stools / 24 h" : "No systemic criterion met" },
    interpretationStatus: unapproved,
    notes: ["Mild vs moderate is a clinical judgement in this draft (spec TW-1)."],
  };
}

/* ---------- SCCAI ---------- */

export function sccai(a: Assessment, _f: Facts, ctx: Ctx): ScoreResult {
  const x = a.activity;
  const day = x.dayStools;
  const night = x.nightStools;
  const dayPts = day == null ? null : day <= 3 ? 0 : day <= 6 ? 1 : day <= 9 ? 2 : 3;
  const nightPts = night == null ? null : night === 0 ? 0 : night <= 3 ? 1 : 2;
  const extra = x.extracolonicUcAssessed === "yes" ? x.extracolonicUc.length : x.extracolonicUcAssessed === "no" ? 0 : null;
  const components = [
    item("day", "Bowel frequency (day)", day ?? null, dayPts, "1–3 → 0 · 4–6 → 1 · 7–9 → 2 · ≥ 10 → 3"),
    item("night", "Bowel frequency (night)", night ?? null, nightPts, "0 → 0* · 1–3 → 1 · ≥ 4 → 2*"),
    item("urgency", "Urgency of defecation", answerLabel(x.urgency, SCCAI_URGENCY), coded(x.urgency), "none 0 · hurry 1 · immediately 2 · incontinence 3"),
    item("blood", "Blood in stool", answerLabel(x.sccaiBlood, SCCAI_BLOOD), coded(x.sccaiBlood), "none 0 · trace 1 · occasionally frank 2 · usually frank 3"),
    item("wellbeing", "General well-being", answerLabel(x.wellBeing5, WELLBEING5), coded(x.wellBeing5), "very well 0 … terrible 4"),
    item("extra", "Extracolonic features", extra == null ? null : x.extracolonicUc.map((e) => UC_EXTRACOLONIC[e]).join(", ") || "None", extra, "1 point each: arthritis, uveitis, erythema nodosum, pyoderma gangrenosum"),
  ];
  return additive("sccai", components, ctx, { min: 0, max: 19 }, (t) =>
    t <= 2 ? { label: "Remission range", band: "remission", rule: "≤ 2" }
      : t >= 5 ? { label: "Active disease", band: "other", rule: "≥ 5" }
        : { label: "Intermediate (no agreed label)", band: "other", rule: "3–4" },
    ["* Night 0 and > 6 are not in the original table (spec SC-1)."]);
}

/* ---------- Mayo ---------- */

function mayoStoolSubscore(a: Assessment): { pts: number | null; answer: string | null } {
  const s = a.presentation.stools24h;
  const n = a.presentation.usualStoolsPerDay;
  if (s == null || n == null) return { pts: null, answer: s == null ? null : `${s}/day, usual not known` };
  const ex = s - n;
  return { pts: ex <= 0 ? 0 : ex <= 2 ? 1 : ex <= 4 ? 2 : 3, answer: `${s}/day vs usual ${n}/day (${ex > 0 ? "+" : ""}${ex})` };
}

export function mayoPartial(a: Assessment, _f: Facts, ctx: Ctx): ScoreResult {
  const sf = mayoStoolSubscore(a);
  const components = [
    item("sf", "Stool frequency", sf.answer, sf.pts, "normal 0 · +1–2 → 1 · +3–4 → 2 · ≥ +5 → 3"),
    item("rb", "Rectal bleeding", answerLabel(a.activity.mayoBleeding, MAYO_BLEEDING), coded(a.activity.mayoBleeding), "0–3"),
    item("pga", "Physician global assessment", answerLabel(a.activity.mayoPga, MAYO_PGA), coded(a.activity.mayoPga), "0–3 (physician only)"),
  ];
  return additive("mayo_partial", components, ctx, { min: 0, max: 9 }, null, ["No severity bands in this draft (spec PM-1)."]);
}

export function mayoFull(a: Assessment, f: Facts, ctx: Ctx): ScoreResult | null {
  if (a.activity.mayoEndoscopy === "" || a.activity.mayoEndoscopy === "not_done") return null;
  const p = mayoPartial(a, f, ctx);
  const components = [
    ...p.components,
    item("endo", "Endoscopic findings", answerLabel(a.activity.mayoEndoscopy, MAYO_ENDO), coded(a.activity.mayoEndoscopy), "0–3"),
  ];
  return additive("mayo_full", components, ctx, { min: 0, max: 12 }, (t) => {
    const anyOver1 = components.some((c) => (c.points ?? 0) > 1);
    return t <= 2 && !anyOver1 ? { label: "Remission", band: "remission", rule: "≤ 2 and no subscore > 1" } : null;
  }, ["Only the remission definition is shown (spec MY-1)."]);
}

/* ---------- Lichtiger ---------- */

export function lichtiger(a: Assessment, f: Facts, ctx: Ctx): ScoreResult {
  const x = a.activity;
  const s = a.presentation.stools24h;
  const pain = a.presentation.abdominalPain;
  const tender = a.exam.tenderness;
  const components = [
    item("stools", "Diarrhea (stools / day)", s ?? null, s == null ? null : s <= 2 ? 0 : s <= 4 ? 1 : s <= 6 ? 2 : s <= 9 ? 3 : 4, "0–2 → 0 · 3–4 → 1 · 5–6 → 2 · 7–9 → 3 · ≥ 10 → 4"),
    item("noct", "Nocturnal diarrhea", ynLabel(a.presentation.tri.nocturnalBm), yn(a.presentation.tri.nocturnalBm), "no 0 · yes 1"),
    item("blood", "Visible blood in stool", answerLabel(x.lichtigerBlood, LICHTIGER_BLOOD), coded(x.lichtigerBlood), "0% 0 · < 50% 1 · ≥ 50% 2 · 100% 3"),
    item("incont", "Fecal incontinence", ynLabel(x.incontinence), yn(x.incontinence), "no 0 · yes 1"),
    item("pain", "Abdominal pain / cramping", pain || null, pain in PAIN4 ? PAIN4[pain] : null, "none 0 · mild 1 · moderate 2 · severe 3"),
    item("wb", "General well-being", answerLabel(x.wellBeing6, WELLBEING6), coded(x.wellBeing6), "perfect 0 … terrible 5"),
    item("tender", "Abdominal tenderness", TENDER_LABEL[tender] ?? null, tender in TENDER ? TENDER[tender] : null, "none 0 · mild localised 1 · mild–moderate diffuse 2 · severe/rebound 3"),
    item("antidiarrheal", "Needs antidiarrheal drugs", ynLabel(x.antidiarrheals), yn(x.antidiarrheals), "no 0 · yes 1"),
  ];
  return additive("lichtiger", components, ctx, { min: 0, max: 21 }, (t) =>
    t < 10 ? { label: "Below 10 (response threshold in the 1994 trial)", band: "other", rule: "< 10 on 2 consecutive days = response" } : { label: "10 or more", band: "other", rule: "≥ 10" },
    ["Designed to monitor inpatient response, not to triage."]);
}

/* ---------- PRO2 (UC) ---------- */

export function pro2Uc(a: Assessment, _f: Facts, ctx: Ctx): ScoreResult {
  const sf = mayoStoolSubscore(a);
  const components = [
    item("sf", "Mayo stool frequency subscore", sf.answer, sf.pts, "0–3"),
    item("rb", "Mayo rectal bleeding subscore", answerLabel(a.activity.mayoBleeding, MAYO_BLEEDING), coded(a.activity.mayoBleeding), "0–3"),
  ];
  return additive("pro2_uc", components, ctx, { min: 0, max: 6 }, null, ["Usually averaged over 3 diary days in trials; single-day value shown. No bands (spec PR-1)."]);
}

/* ---------- PUCAI ---------- */

export function pucai(a: Assessment, _f: Facts, ctx: Ctx): ScoreResult {
  const x = a.activity;
  const s = a.presentation.stools24h;
  const noct = a.presentation.tri.nocturnalBm;
  const components = [
    item("pain", "Abdominal pain", answerLabel(x.pucaiPain, PUCAI_PAIN), coded(x.pucaiPain), "0 / 5 / 10"),
    item("bleed", "Rectal bleeding", answerLabel(x.pucaiBleeding, PUCAI_BLEEDING), coded(x.pucaiBleeding), "0 / 10 / 20 / 30"),
    item("consistency", "Stool consistency", answerLabel(x.pucaiConsistency, PUCAI_CONSISTENCY), coded(x.pucaiConsistency), "0 / 5 / 10"),
    item("stools", "Number of stools / 24 h", s ?? null, s == null ? null : s <= 2 ? 0 : s <= 5 ? 5 : s <= 8 ? 10 : 15, "0–2 → 0 · 3–5 → 5 · 6–8 → 10 · > 8 → 15"),
    item("noct", "Nocturnal stools", ynLabel(noct), noct === "yes" ? 10 : noct === "no" ? 0 : null, "no 0 · yes 10"),
    item("activity", "Activity level", answerLabel(x.pucaiActivity, PUCAI_ACTIVITY), coded(x.pucaiActivity), "0 / 5 / 10"),
  ];
  return additive("pucai", components, ctx, { min: 0, max: 85 }, (t) =>
    t < 10 ? { label: "Remission", band: "remission", rule: "< 10" }
      : t < 35 ? { label: "Mild", band: "mild", rule: "10–34" }
        : t < 65 ? { label: "Moderate", band: "moderate", rule: "35–64" }
          : { label: "Severe (acute severe colitis)", band: "severe", rule: "≥ 65" });
}
