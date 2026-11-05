"use client";

import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { assess } from "@/clinical/assess";
import { assessmentSchema, type Assessment } from "@/clinical/assessment-schema";
import type { AssessmentOutput } from "@/clinical/types";
import { useAssessment } from "@/features/assessment/AssessmentProvider";

export type Live =
  | { ok: true; data: Assessment; output: AssessmentOutput }
  | { ok: false; errors: { path: string; message: string }[] };

/** Re-validates and re-scores the open assessment whenever any answer changes. */
export function useLiveOutput(): Live {
  const { form } = useAssessment();
  const values = useWatch({ control: form.control });
  return useMemo(() => {
    const r = assessmentSchema.safeParse(values);
    if (!r.success) return { ok: false, errors: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) };
    return { ok: true, data: r.data, output: assess(r.data, { now: new Date().toISOString() }) };
  }, [values]);
}
