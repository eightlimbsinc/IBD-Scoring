"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAssessment } from "@/features/assessment/AssessmentProvider";
import { DIAGNOSES } from "@/clinical/assessment-schema";
import { DEMO_CASES } from "@/clinical/demo-cases";
import { Badge, Banner, Button, Card } from "@/ui/primitives";
import { useLiveOutput } from "@/features/summary/useLiveOutput";

function Current() {
  const { form, reset, demoTitle } = useAssessment();
  const live = useLiveOutput();
  const caseId = form.watch("patient.caseId");
  const dx = form.watch("patient.diagnosis");
  const level = live.ok ? live.output.summary : null;
  const tone = level?.level === "emergency" ? "emergency" : level?.level === "severe" ? "severe" : level?.level === "moderate" ? "moderate" : level?.level === "lower" ? "lower" : level?.level === "unbanded" ? "info" : "incomplete";
  return (
    <Card title={caseId ? `Case ${caseId}` : "Assessment in progress"} subtitle={dx ? DIAGNOSES[dx as keyof typeof DIAGNOSES] : "Diagnosis not entered"}>
      {demoTitle && <Badge tone="info">Demo: {demoTitle}</Badge>}
      {level && <Banner tone={tone} title={level.headline}>{level.incomplete ? `Incomplete: ${level.reasons.join(" · ")}` : null}</Banner>}
      <div className="flex gap-3">
        <Link href="/assess/" className="focus-ring raised-sm flex min-h-12 flex-1 items-center justify-center rounded-ctl px-4 font-semibold">Open assessment</Link>
        <Link href="/report/" className="focus-ring raised-sm flex min-h-12 flex-1 items-center justify-center rounded-ctl px-4 font-semibold">Report</Link>
      </div>
      <Button type="button" onClick={() => { if (confirm("Discard this assessment? It is not stored anywhere.")) reset(); }}>Discard</Button>
    </Card>
  );
}

export default function Home() {
  const { started, loadDemo } = useAssessment();
  const router = useRouter();

  return (
    <div className="space-y-5">
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight">Home</h1>

      {started ? <Current /> : (
        <Card title="New assessment" subtitle="Structured assessment for a patient with known or suspected IBD.">
          <Link href="/assess/" className="focus-ring block rounded-ctl bg-accent px-5 py-4 text-center text-[17px] font-semibold text-white shadow-[var(--primary-shadow)]">
            Start new assessment
          </Link>
        </Card>
      )}

      <Card title="Try a demo case" subtitle="Made-up patients for review and training. Tap one to load it and jump to the triage summary.">
        <ul className="space-y-2">
          {DEMO_CASES.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  if (started && !confirm("Replace the open assessment with this demo case?")) return;
                  loadDemo(c.title, c.input());
                  router.push("/assess/?step=result");
                }}
                className="focus-ring raised-sm w-full rounded-ctl px-4 py-3 text-left active:pressed"
              >
                <p className="font-semibold">{c.title}</p>
                <p className="text-[14px] text-ink-muted">{c.summary}</p>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Banner tone="info" title="Nothing is stored">
        Assessments stay on this screen only. They are not saved on the phone or on a server, and they are erased when the app is closed or reloaded.
      </Banner>
      <p className="px-1 text-[14px] text-ink-muted">
        Clinical decision-support output only. This tool does not replace clinical assessment, institutional emergency triage protocols, or the judgment of the treating physician.
      </p>
    </div>
  );
}
