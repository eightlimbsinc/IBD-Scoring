import { describe, expect, it } from "vitest";
import { assessmentSchema, emptyAssessment, pathwayForAge, type AssessmentInput } from "@/clinical/assessment-schema";

function base(): AssessmentInput {
  const a = emptyAssessment();
  a.patient.caseId = "SYN-001";
  a.patient.diagnosis = "uc";
  return a;
}

const issues = (a: AssessmentInput) => {
  const r = assessmentSchema.safeParse(a);
  return r.success ? [] : r.error.issues.map((i) => i.path.join("."));
};

describe("assessment validation", () => {
  it("accepts a minimal record and keeps blanks as missing, not normal", () => {
    const r = assessmentSchema.parse(base());
    expect(r.vitals.heartRate).toBeUndefined();
    expect(r.presentation.tri.rectalBleeding).toBe("");
    expect(r.labs.values.crp.status).toBe("");
  });

  it("requires case code and diagnosis", () => {
    const a = emptyAssessment();
    expect(issues(a)).toEqual(expect.arrayContaining(["patient.caseId", "patient.diagnosis"]));
  });

  it("rejects implausible vitals", () => {
    const a = base();
    a.vitals.heartRate = "400" as never;
    a.vitals.spo2 = "101" as never;
    expect(issues(a)).toEqual(expect.arrayContaining(["vitals.heartRate", "vitals.spo2"]));
  });

  it("rejects diastolic ≥ systolic", () => {
    const a = base();
    a.vitals.sbp = "90" as never;
    a.vitals.dbp = "95" as never;
    expect(issues(a)).toContain("vitals.dbp");
  });

  it("checks temperature in °F against the °C range", () => {
    const a = base();
    a.vitals.temperatureUnit = "F";
    a.vitals.temperature = "101.5" as never;
    expect(issues(a)).toEqual([]);
    a.vitals.temperature = "38.5" as never; // °C value entered with °F selected
    expect(issues(a)).toContain("vitals.temperature");
  });

  it("rejects bloody stools > total stools and non-integer counts", () => {
    const a = base();
    a.presentation.stools24h = "4" as never;
    a.presentation.bloodyStools24h = "6" as never;
    expect(issues(a)).toContain("presentation.bloodyStools24h");
    a.presentation.bloodyStools24h = "2.5" as never;
    expect(issues(a)).toContain("presentation.bloodyStools24h");
  });

  it("needs a value when a lab is marked resulted, and checks plausibility in the chosen unit", () => {
    const a = base();
    a.labs.values.hemoglobin.status = "resulted";
    expect(issues(a)).toContain("labs.values.hemoglobin.value");
    a.labs.values.hemoglobin.value = "105" as never; // g/L number with g/dL unit
    expect(issues(a)).toContain("labs.values.hemoglobin.value");
    a.labs.values.hemoglobin.unit = "g/L";
    expect(issues(a)).toEqual([]);
  });

  it("pending lab keeps no value", () => {
    const a = base();
    a.labs.values.crp.status = "pending";
    const r = assessmentSchema.parse(a);
    expect(r.labs.values.crp.value).toBeUndefined();
  });

  it("needs positive/negative when C. difficile is resulted", () => {
    const a = base();
    a.labs.cdiff.status = "resulted";
    expect(issues(a)).toContain("labs.cdiff.result");
  });
});

describe("pathway by age", () => {
  it.each([
    [undefined, null],
    [17, "pediatric"],
    [18, "adult"],
    [0, "pediatric"],
  ] as const)("age %s → %s", (age, expected) => {
    expect(pathwayForAge(age, 18)).toBe(expected);
  });
});
