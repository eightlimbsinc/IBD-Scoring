"use client";

import { Banner } from "@/ui/primitives";
import { TriageSummary } from "./TriageSummary";
import { useLiveOutput } from "./useLiveOutput";

const FIELD_LABEL: Record<string, string> = {
  "patient.caseId": "MRN / case code",
  "patient.diagnosis": "Diagnosis",
};

export function ResultStep() {
  const live = useLiveOutput();
  if (!live.ok) {
    return (
      <Banner tone="incomplete" title="Fix these entries to see the summary">
        <ul className="list-disc pl-5">{live.errors.map((e) => <li key={e.path}>{FIELD_LABEL[e.path] ?? e.path}: {e.message}</li>)}</ul>
      </Banner>
    );
  }
  return <TriageSummary out={live.output} />;
}
