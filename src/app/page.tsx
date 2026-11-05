"use client";

import Link from "next/link";
import { useAssessment } from "@/features/assessment/AssessmentProvider";
import { DIAGNOSES } from "@/clinical/assessment-schema";
import { Badge, Banner, Button, Card } from "@/ui/primitives";

export default function Dashboard() {
  const { started, completed, form, reset } = useAssessment();
  const caseId = form.watch("patient.caseId");
  const dx = form.watch("patient.diagnosis");

  return (
    <div className="space-y-5">
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight">Dashboard</h1>

      {!started ? (
        <Card title="No assessment open" subtitle="Start a structured assessment for a patient with known or suspected IBD.">
          <Link href="/assess/" className="focus-ring block rounded-2xl bg-accent px-5 py-4 text-center text-[17px] font-semibold text-white shadow-[4px_4px_10px_var(--shadow-dark),-4px_-4px_10px_var(--shadow-light)]">
            New assessment
          </Link>
        </Card>
      ) : (
        <Card title={caseId ? `Case ${caseId}` : "Assessment in progress"} subtitle={dx ? DIAGNOSES[dx as keyof typeof DIAGNOSES] : "Diagnosis not entered"}>
          <div className="flex flex-wrap gap-2">
            {completed ? <Badge tone="lower">Data entry complete</Badge> : <Badge tone="incomplete">In progress</Badge>}
            <Badge tone="incomplete">Scores not active</Badge>
          </div>
          <div className="flex gap-3">
            <Link href="/assess/" className="focus-ring raised-sm flex min-h-12 flex-1 items-center justify-center rounded-2xl px-5 font-semibold">
              {completed ? "Review entries" : "Continue"}
            </Link>
            <Button type="button" onClick={() => { if (confirm("Discard this assessment? It is not stored anywhere.")) reset(); }}>
              Discard
            </Button>
          </div>
        </Card>
      )}

      <Banner tone="info" title="Nothing is stored">
        Assessments stay on this screen only. They are not saved on the phone or on a server, and they are erased when the app is closed or reloaded.
      </Banner>
      <p className="px-1 text-[14px] text-ink-muted">
        Clinical decision-support output only. This tool does not replace clinical assessment, institutional emergency triage protocols, or the judgment of the treating physician.
      </p>
    </div>
  );
}
