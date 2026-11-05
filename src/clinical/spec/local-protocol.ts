/**
 * Category D — locally configured hospital protocol values.
 * Defaults are proposals pending sign-off (docs/GI-REVIEW-CHECKLIST.md). Change only through code review.
 */
export const LOCAL_PROTOCOL = {
  status: "pending_gi_review" as const,
  /** Shown under every emergency warning (decided by product owner 2026-11-05; wording pending GI). */
  escalationText: "Inform the responsible doctor now, per local protocol.",
  pediatricAgeCutoffYears: 18, // PU-1: pediatric pathway if age < cutoff
  thresholds: {
    hypotensionSbp: { value: 90, rule: "SBP < 90 mmHg" },
    hypotensionMap: { value: 65, rule: "MAP < 65 mmHg" },
    tachycardia: { value: 100, rule: "HR > 100 bpm" },
    tachycardiaMarked: { value: 120, rule: "HR > 120 bpm" },
    hypoxia: { value: 92, rule: "SpO₂ < 92%" },
    bleedingShockIndex: { value: 1.0, rule: "Rectal bleeding with SBP < 90, shock index (HR/SBP) ≥ 1.0 or Hb < 7 g/dL" },
    bleedingHb: { value: 7, rule: "" },
    hypokalemia: { value: 3.5, rule: "K < 3.5 mmol/L" },
    asucCrp: { value: 30, rule: "CRP > 30 mg/L (modified Truelove & Witts)" },
  },
};
