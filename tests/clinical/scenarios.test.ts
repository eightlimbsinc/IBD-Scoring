import { describe, expect, it } from "vitest";
import { assess } from "@/clinical/assess";
import { assessmentSchema } from "@/clinical/assessment-schema";
import { DEMO_CASES } from "@/clinical/demo-cases";

const ctx = { now: "2026-11-05T10:00:00.000Z" };
const run = (id: string) => {
  const c = DEMO_CASES.find((d) => d.id === id)!;
  return assess(assessmentSchema.parse(c.input()), ctx);
};
const score = (o: ReturnType<typeof run>, id: string) => o.scores.find((s) => s.scoreId === id);
const ids = (o: ReturnType<typeof run>, sev?: string) => o.warnings.filter((w) => !sev || w.severity === sev).map((w) => w.id).sort();

describe("synthetic scenarios (hand-calculated, docs/TESTING.md)", () => {
  it("all demo cases pass validation", () => {
    for (const c of DEMO_CASES) expect(assessmentSchema.safeParse(c.input()).success, c.id).toBe(true);
    expect(DEMO_CASES.length).toBeGreaterThanOrEqual(10);
  });

  it("1. mild UC", () => {
    const o = run("mild-uc");
    expect(score(o, "sccai")?.total).toBe(4);
    expect(score(o, "mayo_partial")?.total).toBe(3);
    expect(score(o, "lichtiger")?.total).toBe(5);
    expect(score(o, "pro2_uc")?.total).toBe(2);
    expect(score(o, "tw_modified")?.interpretation?.label).toBe("Severe criteria not met");
    expect(ids(o)).toEqual([]);
    expect(o.missingInvestigations).toEqual([]);
    expect(o.summary.level).toBe("unbanded");
  });

  it("2. moderate UC", () => {
    const o = run("moderate-uc");
    expect(score(o, "sccai")?.total).toBe(8);
    expect(score(o, "mayo_partial")?.total).toBe(7);
    expect(score(o, "lichtiger")?.total).toBe(12);
    expect(score(o, "pro2_uc")?.total).toBe(5);
    expect(ids(o, "emergency")).toEqual([]);
    expect(o.missingInvestigations.map((m) => `${m.id}:${m.status}`)).toEqual(["cdiff:pending", "stool:not ordered"]);
  });

  it("3. acute severe UC is flagged as emergency", () => {
    const o = run("asuc");
    expect(ids(o, "emergency")).toEqual(["W-ASUC"]);
    expect(ids(o)).toEqual(["I-MASKING", "W-ASUC", "W-HYPOKALAEMIA", "W-TACHY"]);
    expect(score(o, "sccai")?.total).toBe(11);
    expect(score(o, "lichtiger")?.total).toBe(16);
    expect(score(o, "mayo_partial")?.total).toBe(9);
    expect(o.sirs?.count).toBe(2);
    expect(o.summary.level).toBe("emergency");
  });

  it("4. Crohn's flare: HBI 12 moderate", () => {
    const o = run("cd-flare");
    expect(score(o, "hbi")?.total).toBe(12);
    expect(score(o, "hbi")?.interpretation?.band).toBe("moderate");
    expect(score(o, "pdai")).toBeUndefined();
    expect(ids(o)).toEqual(["I-MASKING"]);
    expect(o.summary.level).toBe("moderate");
  });

  it("5. Crohn's with obstruction: low HBI does not hide the emergency", () => {
    const o = run("cd-obstruction");
    expect(score(o, "hbi")?.total).toBe(6);
    expect(score(o, "hbi")?.interpretation?.band).toBe("mild");
    expect(ids(o)).toEqual(["W-HYPOKALAEMIA", "W-OBSTRUCTION", "W-TACHY"]);
    expect(o.summary.level).toBe("emergency");
  });

  it("6. suspected toxic megacolon", () => {
    const o = run("toxic-megacolon");
    expect(ids(o, "emergency")).toEqual(["W-ASUC", "W-BLEEDING", "W-SEPSIS", "W-TACHY-MARKED", "W-TOXIC-MEGACOLON"]);
    expect(o.warnings.find((w) => w.id === "W-TOXIC-MEGACOLON")?.status).toBe("met");
    expect(ids(o)).toContain("W-DEHYDRATION");
    expect(o.qsofa?.count).toBe(2);
  });

  it("7. significant GI bleeding", () => {
    const o = run("gi-bleed");
    expect(ids(o, "emergency")).toEqual(["W-ASUC", "W-BLEEDING", "W-HYPOTENSION", "W-SEPSIS"]);
    expect(o.warnings.find((w) => w.id === "W-BLEEDING")?.because).toHaveLength(3);
    expect(score(o, "mayo_partial")?.total).toBe(9);
    expect(score(o, "sccai")?.status).toBe("incomplete");
  });

  it("8. dehydration with Crohn's", () => {
    const o = run("dehydration");
    expect(score(o, "hbi")?.total).toBe(15);
    expect(ids(o)).toEqual(["W-DEHYDRATION", "W-HYPOKALAEMIA", "W-TACHY"]);
    expect(o.summary.level).toBe("moderate");
  });

  it("9. suspected infection", () => {
    const o = run("infection");
    expect(ids(o)).toEqual(["I-MASKING", "W-CDIFF", "W-SEPSIS", "W-TACHY"]);
    expect(o.sirs?.count).toBe(4);
    expect(score(o, "tw_modified")?.interpretation?.label).toBe("Severe criteria not met");
  });

  it("10. incomplete labs: severity left undecided, nothing assumed normal", () => {
    const o = run("incomplete");
    const tw = score(o, "tw_modified")!;
    expect(tw.status).toBe("incomplete");
    expect(tw.missing).toEqual(["Hemoglobin", "ESR", "CRP"]);
    expect(ids(o, "emergency")).toEqual([]);
    expect(o.summary.level).toBe("incomplete");
    expect(o.missingInvestigations).toHaveLength(10);
  });

  it("11. pediatric acute severe colitis uses PUCAI, not adult vital thresholds", () => {
    const o = run("peds-asc");
    expect(o.pathway).toBe("pediatric");
    expect(score(o, "pucai")?.total).toBe(70);
    expect(o.scores.map((s) => s.scoreId)).toEqual(["pucai"]);
    expect(ids(o)).toEqual(["I-PEDS-VITALS", "W-PED-ASC"]);
    expect(o.qsofa).toBeNull();
  });

  it("is deterministic", () => {
    expect(run("asuc")).toEqual(run("asuc"));
  });
});
