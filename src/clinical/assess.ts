import { pathwayForAge, type Assessment } from "./assessment-schema";
import { buildFacts } from "./facts";
import { missingInvestigations, evaluateWarnings, qsofa, sirs } from "./rules";
import { hbi, pdai } from "./scores/cd";
import { lichtiger, mayoFull, mayoPartial, pro2Uc, pucai, sccai, trueloveWitts } from "./scores/uc";
import { LOCAL_PROTOCOL } from "./spec/local-protocol";
import { SPEC_VERSION } from "./spec/version";
import type { AssessmentOutput, Ctx, ScoreResult } from "./types";

/**
 * Deterministic entry point. Pure: same input + ctx → same output.
 * No combined score is ever produced.
 */
export function assess(a: Assessment, ctx: Ctx): AssessmentOutput {
  const f = buildFacts(a);
  const pathway = pathwayForAge(a.patient.ageYears, LOCAL_PROTOCOL.pediatricAgeCutoffYears);
  const dx = a.patient.diagnosis;
  const scores: ScoreResult[] = [];
  const notApplicable: { scoreName: string; reason: string }[] = [];
  const ucLike = dx === "uc" || dx === "ibdu";

  if (pathway === null) {
    notApplicable.push({ scoreName: "All disease activity scores", reason: "Age not entered — adult or pediatric pathway unknown" });
  } else if (dx === "suspected") {
    notApplicable.push({ scoreName: "Disease activity scores", reason: "Not validated for suspected (undiagnosed) IBD" });
  } else if (pathway === "adult" && ucLike) {
    scores.push(trueloveWitts(a, f, ctx, true), trueloveWitts(a, f, ctx, false), sccai(a, f, ctx), mayoPartial(a, f, ctx));
    const full = mayoFull(a, f, ctx);
    if (full) scores.push(full);
    else notApplicable.push({ scoreName: "Full Mayo", reason: "Needs an endoscopy result" });
    scores.push(lichtiger(a, f, ctx), pro2Uc(a, f, ctx));
    if (dx === "ibdu") scores.forEach((s) => s.notes.unshift("UC index applied to IBD-unclassified (spec IB-1)."));
  } else if (pathway === "pediatric" && ucLike) {
    scores.push(pucai(a, f, ctx));
  } else if (pathway === "adult" && dx === "cd") {
    scores.push(hbi(a, f, ctx));
    const perianal = a.presentation.tri.perianalSymptoms === "yes" || a.patient.cdPerianal === "yes";
    if (perianal) scores.push(pdai(a, f, ctx));
    else notApplicable.push({ scoreName: "PDAI", reason: "No perianal symptoms or known perianal disease" });
    notApplicable.push({ scoreName: "CDAI / PRO2", reason: "Need a 7-day symptom diary" });
  } else if (pathway === "pediatric" && dx === "cd") {
    notApplicable.push({ scoreName: "PCDAI / wPCDAI", reason: "Not in this version (needs verified age/sex tables)" });
  }

  const warnings = evaluateWarnings(a, f, pathway, scores);
  const missing = missingInvestigations(a, f);
  const adult = pathway !== "pediatric";

  const emergencies = warnings.filter((w) => w.severity === "emergency");
  const bands = scores.map((s) => s.interpretation?.band);
  const vitalsMissing = [f.hr, f.sbp, f.tempC, f.rr].some((x) => x == null);
  const anyIncomplete = scores.some((s) => s.status === "incomplete");
  const incomplete = vitalsMissing || anyIncomplete || pathway === null;

  let level: AssessmentOutput["summary"]["level"];
  let headline: string;
  if (emergencies.length) {
    level = "emergency";
    headline = emergencies.length === 1 ? emergencies[0].title : `${emergencies.length} emergency warnings`;
  } else if (bands.includes("severe")) {
    level = "severe"; headline = "Severe disease activity";
  } else if (bands.includes("moderate")) {
    level = "moderate"; headline = "Moderate disease activity";
  } else if (bands.includes("mild") || bands.includes("remission")) {
    level = "lower"; headline = "Lower disease activity on available scores";
  } else if (incomplete) {
    level = "incomplete"; headline = "Incomplete assessment";
  } else {
    level = "unbanded"; headline = "No emergency warning found — no score gives a severity band";
  }
  const reasons: string[] = [];
  if (vitalsMissing) reasons.push("Vital signs incomplete");
  if (anyIncomplete) reasons.push("Some scores have missing items");
  if (pathway === null) reasons.push("Age not entered");

  return {
    pathway,
    scores,
    notApplicable,
    warnings,
    missingInvestigations: missing,
    qsofa: adult ? qsofa(a, f) : null,
    sirs: adult ? sirs(f) : null,
    summary: { level, headline, incomplete, reasons },
    calculatedAt: ctx.now,
    specVersion: SPEC_VERSION,
  };
}
