import { describe, expect, it } from "vitest";
import { assessmentSchema, emptyAssessment, type Assessment, type AssessmentInput } from "@/clinical/assessment-schema";
import { buildFacts } from "@/clinical/facts";
import { hbi, pdai } from "@/clinical/scores/cd";
import { lichtiger, mayoFull, mayoPartial, pro2Uc, pucai, sccai, trueloveWitts } from "@/clinical/scores/uc";

const ctx = { now: "2026-11-05T10:00:00.000Z" };
type Patch = (a: AssessmentInput) => void;
function build(...patches: Patch[]): Assessment {
  const a = emptyAssessment();
  a.patient.caseId = "T";
  a.patient.diagnosis = "uc";
  a.patient.ageYears = 30 as never;
  patches.forEach((p) => p(a));
  return assessmentSchema.parse(a);
}
const n = (x: number) => x as never;
const run = <T,>(fn: (a: Assessment, f: ReturnType<typeof buildFacts>, c: typeof ctx) => T, a: Assessment) => fn(a, buildFacts(a), ctx);

/* ---------------- SCCAI ---------------- */
const sccaiBase: Patch = (a) => {
  Object.assign(a.activity, { dayStools: n(1), nightStools: n(0), urgency: "0", sccaiBlood: "0", wellBeing5: "0", extracolonicUcAssessed: "no" });
};
describe("SCCAI", () => {
  it("minimum 0 and maximum 19", () => {
    expect(run(sccai, build(sccaiBase)).total).toBe(0);
    const max = build((a) => Object.assign(a.activity, { dayStools: n(12), nightStools: n(5), urgency: "3", sccaiBlood: "3", wellBeing5: "4", extracolonicUcAssessed: "yes", extracolonicUc: ["arthritis", "uveitis", "erythema_nodosum", "pyoderma_gangrenosum"] }));
    expect(run(sccai, max).total).toBe(19);
  });
  it.each([[0, 0], [3, 0], [4, 1], [6, 1], [7, 2], [9, 2], [10, 3]])("day %i → %i", (d, p) => {
    expect(run(sccai, build(sccaiBase, (a) => { a.activity.dayStools = n(d); })).total).toBe(p);
  });
  it.each([[0, 0], [1, 1], [3, 1], [4, 2], [6, 2], [8, 2]])("night %i → %i", (d, p) => {
    expect(run(sccai, build(sccaiBase, (a) => { a.activity.nightStools = n(d); })).total).toBe(p);
  });
  it.each(["0", "1", "2", "3"])("urgency %s", (v) => {
    expect(run(sccai, build(sccaiBase, (a) => { a.activity.urgency = v as never; })).total).toBe(Number(v));
  });
  it.each(["0", "1", "2", "3"])("blood %s", (v) => {
    expect(run(sccai, build(sccaiBase, (a) => { a.activity.sccaiBlood = v as never; })).total).toBe(Number(v));
  });
  it.each(["0", "1", "2", "3", "4"])("well-being %s", (v) => {
    expect(run(sccai, build(sccaiBase, (a) => { a.activity.wellBeing5 = v as never; })).total).toBe(Number(v));
  });
  it("interpretation boundaries 2/3 and 4/5", () => {
    const at = (day: number, urg: string) => run(sccai, build(sccaiBase, (a) => { a.activity.dayStools = n(day); a.activity.urgency = urg as never; })).interpretation?.label;
    expect(at(1, "2")).toBe("Remission range");
    expect(at(4, "2")).toBe("Intermediate (no agreed label)");
    expect(at(10, "1")).toBe("Intermediate (no agreed label)");
    expect(at(10, "2")).toBe("Active disease");
  });
  it("missing or unknown item → incomplete, no total", () => {
    const r = run(sccai, build(sccaiBase, (a) => { a.activity.urgency = "unknown"; a.activity.extracolonicUcAssessed = ""; }));
    expect(r.status).toBe("incomplete");
    expect(r.total).toBeNull();
    expect(r.missing).toEqual(["Urgency of defecation", "Extracolonic features"]);
  });
  it("results are marked unapproved while spec is pending", () => {
    expect(run(sccai, build(sccaiBase)).interpretationStatus).toBe("unapproved");
  });
});

/* ---------------- Mayo / PRO2 ---------------- */
const mayoBase: Patch = (a) => {
  a.presentation.stools24h = n(2);
  a.presentation.usualStoolsPerDay = n(2);
  Object.assign(a.activity, { mayoBleeding: "0", mayoPga: "0" });
};
describe("Mayo", () => {
  it.each([[2, 0], [3, 1], [4, 1], [5, 2], [6, 2], [7, 3], [15, 3], [0, 0]])("stools %i vs usual 2 → %i", (s, p) => {
    expect(run(mayoPartial, build(mayoBase, (a) => { a.presentation.stools24h = n(s); })).total).toBe(p);
  });
  it("partial Mayo min 0, max 9; no band", () => {
    expect(run(mayoPartial, build(mayoBase)).total).toBe(0);
    const r = run(mayoPartial, build(mayoBase, (a) => { a.presentation.stools24h = n(9); Object.assign(a.activity, { mayoBleeding: "3", mayoPga: "3" }); }));
    expect(r.total).toBe(9);
    expect(r.interpretation).toBeNull();
  });
  it("usual stool frequency unknown → incomplete", () => {
    const r = run(mayoPartial, build(mayoBase, (a) => { a.presentation.usualStoolsPerDay = "" as never; }));
    expect(r.status).toBe("incomplete");
    expect(r.missing).toContain("Stool frequency");
  });
  it("PGA not assessed → incomplete (physician-only item)", () => {
    expect(run(mayoPartial, build(mayoBase, (a) => { a.activity.mayoPga = "not_assessed"; })).status).toBe("incomplete");
  });
  it("full Mayo needs endoscopy", () => {
    expect(run(mayoFull, build(mayoBase))).toBeNull();
    expect(run(mayoFull, build(mayoBase, (a) => { a.activity.mayoEndoscopy = "not_done"; }))).toBeNull();
  });
  it("full Mayo remission requires total ≤ 2 and no subscore > 1", () => {
    const rem = run(mayoFull, build(mayoBase, (a) => { Object.assign(a.activity, { mayoBleeding: "1", mayoEndoscopy: "1" }); }))!;
    expect(rem.total).toBe(2);
    expect(rem.interpretation?.label).toBe("Remission");
    const notRem = run(mayoFull, build(mayoBase, (a) => { a.activity.mayoEndoscopy = "2"; }))!;
    expect(notRem.total).toBe(2);
    expect(notRem.interpretation).toBeNull();
    const max = run(mayoFull, build(mayoBase, (a) => { a.presentation.stools24h = n(9); Object.assign(a.activity, { mayoBleeding: "3", mayoPga: "3", mayoEndoscopy: "3" }); }))!;
    expect(max.total).toBe(12);
  });
  it("PRO2 UC = stool + bleeding subscores, 0–6", () => {
    expect(run(pro2Uc, build(mayoBase)).total).toBe(0);
    expect(run(pro2Uc, build(mayoBase, (a) => { a.presentation.stools24h = n(8); a.activity.mayoBleeding = "3"; })).total).toBe(6);
  });
});

/* ---------------- Lichtiger ---------------- */
const lichBase: Patch = (a) => {
  a.presentation.stools24h = n(0);
  a.presentation.tri.nocturnalBm = "no";
  a.presentation.abdominalPain = "none";
  a.exam.tenderness = "none";
  Object.assign(a.activity, { lichtigerBlood: "0", incontinence: "no", wellBeing6: "0", antidiarrheals: "no" });
};
describe("Lichtiger", () => {
  it("min 0, max 21", () => {
    expect(run(lichtiger, build(lichBase)).total).toBe(0);
    const max = build((a) => {
      a.presentation.stools24h = n(12); a.presentation.tri.nocturnalBm = "yes"; a.presentation.abdominalPain = "severe"; a.exam.tenderness = "severe_or_rebound";
      Object.assign(a.activity, { lichtigerBlood: "3", incontinence: "yes", wellBeing6: "5", antidiarrheals: "yes" });
    });
    expect(run(lichtiger, max).total).toBe(21);
  });
  it.each([[2, 0], [3, 1], [4, 1], [5, 2], [6, 2], [7, 3], [9, 3], [10, 4]])("stools %i → %i", (s, p) => {
    expect(run(lichtiger, build(lichBase, (a) => { a.presentation.stools24h = n(s); })).total).toBe(p);
  });
  it.each([["mild_localised", 1], ["mild_moderate_diffuse", 2], ["severe_or_rebound", 3]])("tenderness %s → %i", (t, p) => {
    expect(run(lichtiger, build(lichBase, (a) => { a.exam.tenderness = t as never; })).total).toBe(p);
  });
  it.each(["0", "1", "2", "3", "4", "5"])("well-being %s", (v) => {
    expect(run(lichtiger, build(lichBase, (a) => { a.activity.wellBeing6 = v as never; })).total).toBe(Number(v));
  });
  it("boundary 9/10", () => {
    const at = (wb: string) => run(lichtiger, build(lichBase, (a) => { a.presentation.stools24h = n(10); a.activity.wellBeing6 = wb as never; a.activity.lichtigerBlood = "3"; a.exam.tenderness = "mild_localised"; a.presentation.tri.nocturnalBm = "yes"; }));
    expect(at("0").total).toBe(9);
    expect(at("0").interpretation?.rule).toContain("< 10");
    expect(at("1").total).toBe(10);
    expect(at("1").interpretation?.rule).toBe("≥ 10");
  });
  it("tenderness not assessed → incomplete", () => {
    expect(run(lichtiger, build(lichBase, (a) => { a.exam.tenderness = "not_assessed"; })).status).toBe("incomplete");
  });
});

/* ---------------- PUCAI ---------------- */
const pucBase: Patch = (a) => {
  a.patient.ageYears = n(12);
  a.presentation.stools24h = n(0);
  a.presentation.tri.nocturnalBm = "no";
  Object.assign(a.activity, { pucaiPain: "0", pucaiBleeding: "0", pucaiConsistency: "0", pucaiActivity: "0" });
};
describe("PUCAI", () => {
  it("min 0, max 85", () => {
    expect(run(pucai, build(pucBase)).total).toBe(0);
    const max = build(pucBase, (a) => { a.presentation.stools24h = n(12); a.presentation.tri.nocturnalBm = "yes"; Object.assign(a.activity, { pucaiPain: "10", pucaiBleeding: "30", pucaiConsistency: "10", pucaiActivity: "10" }); });
    expect(run(pucai, max).total).toBe(85);
  });
  it.each([[2, 0], [3, 5], [5, 5], [6, 10], [8, 10], [9, 15]])("stools %i → %i", (s, p) => {
    expect(run(pucai, build(pucBase, (a) => { a.presentation.stools24h = n(s); })).total).toBe(p);
  });
  it.each(["10", "20", "30"])("bleeding %s", (v) => {
    expect(run(pucai, build(pucBase, (a) => { a.activity.pucaiBleeding = v as never; })).total).toBe(Number(v));
  });
  it.each([
    [5, "Remission"], [10, "Mild"], [30, "Mild"], [35, "Moderate"], [60, "Moderate"], [65, "Severe (acute severe colitis)"],
  ])("total %i → %s", (target, label) => {
    // build exact totals from items: bleeding 0/10/20/30, pain/consistency/activity 0/5/10, nocturnal 0/10
    const combos: Record<number, { [k: string]: string | number | boolean | undefined; noct?: boolean; stools?: number }> = {
      5: { pucaiPain: "5" }, 10: { pucaiBleeding: "10" }, 30: { pucaiBleeding: "20", pucaiPain: "10" },
      35: { pucaiBleeding: "30", pucaiPain: "5" }, 60: { pucaiBleeding: "30", pucaiPain: "10", pucaiConsistency: "10", pucaiActivity: "10" },
      65: { pucaiBleeding: "30", pucaiPain: "10", pucaiConsistency: "10", pucaiActivity: "10", stools: 3 },
    };
    const c = combos[target];
    const r = run(pucai, build(pucBase, (a) => { const { stools, noct, ...rest } = c; Object.assign(a.activity, rest); if (stools != null) a.presentation.stools24h = n(stools as number); if (noct) a.presentation.tri.nocturnalBm = "yes"; }));
    expect(r.total).toBe(target);
    expect(r.interpretation?.label).toBe(label);
  });
  it("nocturnal unknown → incomplete", () => {
    expect(run(pucai, build(pucBase, (a) => { a.presentation.tri.nocturnalBm = "unknown"; })).status).toBe("incomplete");
  });
});

/* ---------------- HBI ---------------- */
const hbiBase: Patch = (a) => {
  a.patient.diagnosis = "cd";
  a.presentation.abdominalPain = "none";
  a.exam.abdominalMass = "none";
  Object.assign(a.activity, { wellBeing5: "0", liquidStoolsPrevDay: n(0), hbiComplicationsAssessed: "no" });
};
describe("HBI", () => {
  it("min 0; complications 1 each", () => {
    expect(run(hbi, build(hbiBase)).total).toBe(0);
    const all = build(hbiBase, (a) => { a.activity.hbiComplicationsAssessed = "yes"; a.activity.hbiComplications = ["arthralgia", "uveitis", "erythema_nodosum", "aphthous_ulcers", "pyoderma_gangrenosum", "anal_fissure", "new_fistula", "abscess"]; });
    expect(run(hbi, all).total).toBe(8);
  });
  it.each([["dubious", 1], ["definite", 2], ["definite_tender", 3]])("mass %s → %i", (m, p) => {
    expect(run(hbi, build(hbiBase, (a) => { a.exam.abdominalMass = m as never; })).total).toBe(p);
  });
  it.each([[4, "Remission"], [5, "Mild"], [7, "Mild"], [8, "Moderate"], [16, "Moderate"], [17, "Severe"]])("total %i → %s", (s, label) => {
    const r = run(hbi, build(hbiBase, (a) => { a.activity.liquidStoolsPrevDay = n(s); }));
    expect(r.total).toBe(s);
    expect(r.interpretation?.label).toBe(label);
  });
  it("ostomy: total shown, no interpretation", () => {
    const r = run(hbi, build(hbiBase, (a) => { a.patient.hasOstomy = "yes"; a.activity.liquidStoolsPrevDay = n(10); }));
    expect(r.total).toBe(10);
    expect(r.interpretation).toBeNull();
    expect(r.notes.join(" ")).toMatch(/stoma/);
  });
  it("mass not assessed → incomplete", () => {
    expect(run(hbi, build(hbiBase, (a) => { a.exam.abdominalMass = "not_assessed"; })).status).toBe("incomplete");
  });
});

/* ---------------- PDAI ---------------- */
const pdaiAll = (v: string): Patch => (a) => { Object.assign(a.activity, { pdaiDischarge: v, pdaiPain: v, pdaiSexual: v, pdaiType: v, pdaiInduration: v }); };
describe("PDAI", () => {
  it("min 0, max 20", () => {
    expect(run(pdai, build(pdaiAll("0"))).total).toBe(0);
    expect(run(pdai, build(pdaiAll("4"))).total).toBe(20);
  });
  it("boundary 4/5", () => {
    const at = (x: string) => run(pdai, build(pdaiAll("1"), (a) => { a.activity.pdaiInduration = x as never; }));
    expect(at("0").total).toBe(4);
    expect(at("0").interpretation?.label).toBe("Not active by PDAI");
    expect(at("1").total).toBe(5);
    expect(at("1").interpretation?.label).toBe("Active perianal disease");
  });
  it("sexual activity not assessed → incomplete", () => {
    expect(run(pdai, build(pdaiAll("1"), (a) => { a.activity.pdaiSexual = "not_assessed"; })).status).toBe("incomplete");
  });
});

/* ---------------- Truelove & Witts ---------------- */
const twBase: Patch = (a) => {
  a.presentation.bloodyStools24h = n(6);
  a.presentation.stools24h = n(6);
  Object.assign(a.vitals, { heartRate: n(80), temperature: n(37) });
  a.labs.values.hemoglobin = { status: "resulted", value: n(12), unit: "g/dL", flag: "" };
  a.labs.values.esr = { status: "resulted", value: n(20), unit: "mm/h", flag: "" };
  a.labs.values.crp = { status: "resulted", value: n(10), unit: "mg/L", flag: "" };
};
const tw = (mod: boolean, ...p: Patch[]) => { const a = build(twBase, ...p); return trueloveWitts(a, buildFacts(a), ctx, mod); };
describe("Truelove & Witts", () => {
  it("6 bloody stools, no systemic criterion → not severe", () => {
    expect(tw(true).interpretation?.label).toBe("Severe criteria not met");
  });
  it("5 bloody stools with all systemic criteria → not severe", () => {
    expect(tw(false, (a) => { a.presentation.bloodyStools24h = n(5); a.vitals.heartRate = n(120); }).interpretation?.band).toBe("other");
  });
  it.each([
    ["HR 91", (a: AssessmentInput) => { a.vitals.heartRate = n(91); }],
    ["Temp 37.9", (a: AssessmentInput) => { a.vitals.temperature = n(37.9); }],
    ["Hb 10.4", (a: AssessmentInput) => { a.labs.values.hemoglobin.value = n(10.4); }],
    ["ESR 31", (a: AssessmentInput) => { a.labs.values.esr.value = n(31); }],
  ])("%s triggers severe", (_l, p) => {
    expect(tw(false, p).interpretation?.band).toBe("severe");
  });
  it.each([
    ["HR 90", (a: AssessmentInput) => { a.vitals.heartRate = n(90); }],
    ["Temp 37.8", (a: AssessmentInput) => { a.vitals.temperature = n(37.8); }],
    ["Hb 10.5", (a: AssessmentInput) => { a.labs.values.hemoglobin.value = n(10.5); }],
    ["ESR 30", (a: AssessmentInput) => { a.labs.values.esr.value = n(30); }],
  ])("%s does not (boundary)", (_l, p) => {
    expect(tw(false, p).interpretation?.band).toBe("other");
  });
  it("CRP > 30 counts only in the modified criteria", () => {
    const crp = (a: AssessmentInput) => { a.labs.values.crp.value = n(31); };
    expect(tw(true, crp).interpretation?.band).toBe("severe");
    expect(tw(false, crp).interpretation?.band).toBe("other");
    expect(tw(true, (a) => { a.labs.values.crp.value = n(30); }).interpretation?.band).toBe("other");
  });
  it("Hb in g/L is converted (104 g/L = 10.4 g/dL)", () => {
    expect(tw(false, (a) => { a.labs.values.hemoglobin = { status: "resulted", value: n(104), unit: "g/L", flag: "" }; }).interpretation?.band).toBe("severe");
  });
  it("CRP in mg/dL is converted (3.1 mg/dL = 31 mg/L)", () => {
    expect(tw(true, (a) => { a.labs.values.crp = { status: "resulted", value: n(3.1), unit: "mg/dL", flag: "" }; }).interpretation?.band).toBe("severe");
  });
  it("pending lab is not treated as normal", () => {
    const r = tw(false, (a) => { a.labs.values.esr = { status: "pending", value: "" as never, unit: "mm/h", flag: "" }; });
    expect(r.status).toBe("incomplete");
    expect(r.missing).toEqual(["ESR"]);
  });
  it("one met criterion is enough even if others are unknown", () => {
    const r = tw(false, (a) => { a.vitals.heartRate = n(100); a.labs.values.esr = { status: "pending", value: "" as never, unit: "mm/h", flag: "" }; });
    expect(r.interpretation?.band).toBe("severe");
    expect(r.missing).toEqual(["ESR"]);
  });
  it("bloody stools missing → incomplete", () => {
    expect(tw(false, (a) => { a.presentation.bloodyStools24h = "" as never; }).status).toBe("incomplete");
  });
});
