"use client";

import Link from "next/link";
import { useState } from "react";
import { buildReportPdf, deliverPdf } from "./pdf";
import type { Assessment } from "@/clinical/assessment-schema";
import { DIAGNOSES, EXAM_TRI, IMMUNO_MEDS, LAB_STATUS, NUMERIC_LABS, PRESENTATION_TRI, ROLES } from "@/clinical/assessment-schema";
import type { AssessmentOutput } from "@/clinical/types";
import { ANALYTES, bmi } from "@/clinical/units";
import { SCORES, CATEGORY_LABEL } from "@/clinical/spec/registry";
import { APP_VERSION, SPEC_VERSION } from "@/clinical/spec/version";
import { LOCAL_PROTOCOL } from "@/clinical/spec/local-protocol";
import { Button } from "@/ui/primitives";
import { ScoreCard, WarningCard } from "./TriageSummary";
import { useAssessment } from "@/features/assessment/AssessmentProvider";
import { useLiveOutput } from "./useLiveOutput";
import { FeedbackButton } from "@/features/feedback/FeedbackButton";

const DISCLAIMER = "Clinical decision-support output only. This report does not replace clinical assessment, institutional emergency triage protocols, or the judgment of the treating physician.";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid-page border-t border-line pt-4">
      <h2 className="text-[18px] font-semibold">{title}</h2>
      <div className="mt-2 space-y-2 text-[15px]">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-2 py-0.5">
      <dt className="text-ink-muted">{k}</dt>
      <dd>{v === "" || v == null ? <span className="italic text-ink-muted">not recorded</span> : v}</dd>
    </div>
  );
}

const tri = (v: string) => (v === "yes" ? "Yes" : v === "no" ? "No" : v === "unknown" ? "Unknown" : "");

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Report() {
  const live = useLiveOutput();
  const { started, demoTitle } = useAssessment();
  const [pdfState, setPdfState] = useState<"" | "working" | "shared" | "downloaded" | "error">("");

  if (!started) {
    return (
      <div className="space-y-4">
        <h1 className="text-[28px] font-semibold tracking-tight">Report</h1>
        <p>No assessment open. <Link href="/" className="font-semibold text-accent underline">Start one or load a demo case</Link>.</p>
      </div>
    );
  }
  if (!live.ok) {
    return (
      <div className="space-y-4">
        <h1 className="text-[28px] font-semibold tracking-tight">Report</h1>
        <p>Some entries need fixing first. <Link href="/assess/" className="font-semibold text-accent underline">Go back to the assessment</Link>.</p>
      </div>
    );
  }
  const a: Assessment = live.data;
  const out: AssessmentOutput = live.output;
  const p = a.patient;
  const v = a.vitals;
  const fileBase = `ibd-assessment-${p.caseId.replace(/[^\w-]/g, "_")}-${out.calculatedAt.slice(0, 16).replace(/[:T]/g, "-")}`;

  const exportJson = () => {
    if (!confirm("The exported file contains the patient identifiers you entered. Only save or send it through an authorised channel. Continue?")) return;
    download(`${fileBase}.json`, JSON.stringify({ app: APP_VERSION, specVersion: SPEC_VERSION, synthetic: Boolean(demoTitle), assessment: a, result: out }, null, 2), "application/json");
  };

  const savePdf = async () => {
    if (!demoTitle && !confirm("The PDF contains the patient identifiers you entered. Only save or send it through an authorised channel. Continue?")) return;
    setPdfState("working");
    try {
      const blob = await buildReportPdf(a, out, demoTitle);
      const r = await deliverPdf(blob, `${fileBase}.pdf`);
      setPdfState(r === "cancelled" ? "" : r);
    } catch {
      setPdfState("error");
    }
  };

  const emergencies = out.warnings.filter((w) => w.severity === "emergency");
  const otherWarnings = out.warnings.filter((w) => w.severity !== "emergency");
  const usedRefs = Array.from(new Set(out.scores.flatMap((s) => s.references.map((r) => `${r.citation}${r.doi ? ` — doi:${r.doi}` : ""}`)).concat(out.warnings.map((w) => w.source))));

  return (
    <div className="space-y-5">
      <div className="no-print space-y-3">
        <h1 className="text-[28px] font-semibold tracking-tight">Report</h1>
        <Button type="button" variant="primary" className="w-full" disabled={pdfState === "working"} onClick={savePdf}>
          {pdfState === "working" ? "Creating PDF…" : "Save / share PDF"}
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" onClick={() => window.print()}>Print</Button>
          <Button type="button" onClick={exportJson}>Export data</Button>
        </div>
        {pdfState === "downloaded" && <p role="status" className="text-[14px] font-semibold text-lower">PDF saved to Downloads.</p>}
        {pdfState === "shared" && <p role="status" className="text-[14px] font-semibold text-lower">PDF shared.</p>}
        {pdfState === "error" && <p role="alert" className="text-[14px] font-semibold text-emergency">Could not create the PDF. Try Print instead.</p>}
        <p className="text-[14px] text-ink-muted">Save / share PDF opens your phone&apos;s share sheet: choose Files, Drive, Messages or email. Nothing is stored by the app.</p>
        <FeedbackButton target="screen:report" label="Report layout" />
      </div>

      <article className="raised rounded-card p-5 print:rounded-none print:p-0">
        <header className="space-y-1">
          {demoTitle && <p className="font-semibold text-info">SYNTHETIC DEMO CASE — {demoTitle}. Not a real patient.</p>}
          <p className="text-[13px] font-semibold uppercase tracking-wider text-ink-muted">IBD Emergency Assessment Report</p>
          <h2 className="text-[24px] font-semibold">Case {p.caseId}{p.name ? ` · ${p.name}` : ""}</h2>
          <p className="text-[14px]">Assessed {new Date(p.assessedAt).toLocaleString()} · Report generated {new Date(out.calculatedAt).toLocaleString()}</p>
          <p className="rounded-chip border-2 border-severe bg-severe-bg p-2 text-[14px] font-semibold text-severe">{DISCLAIMER}</p>
          <p className="text-[13px] text-ink-muted">DRAFT rules — scoring specification {SPEC_VERSION} not yet signed off by a gastroenterologist.</p>
        </header>

        <div className="mt-4 space-y-4">
          <Section title="Clinical assessment summary">
            <p className="text-[18px] font-semibold">{out.summary.headline}</p>
            {emergencies.length > 0 && <p className="font-semibold text-emergency">{LOCAL_PROTOCOL.escalationText}</p>}
            {out.summary.incomplete && <p>Incomplete: {out.summary.reasons.join(" · ")}</p>}
            <p className="text-[13px] text-ink-muted">No triage category assigned. No admission, discharge, surgical or treatment recommendation is made.</p>
          </Section>

          <Section title="Emergency warning signs">
            {emergencies.length === 0 ? <p>None found from the information entered.</p> : emergencies.map((w) => <WarningCard key={w.id} w={w} interactive={false} />)}
            {otherWarnings.length > 0 && (
              <>
                <p className="pt-2 font-semibold">Other alerts</p>
                {otherWarnings.map((w) => <WarningCard key={w.id} w={w} interactive={false} />)}
              </>
            )}
          </Section>

          <Section title="Patient information">
            <dl>
              <Row k="Age / pathway" v={`${p.ageYears ?? "?"} y · ${out.pathway ?? "unknown"}`} />
              <Row k="Sex" v={p.sex === "not_recorded" ? "Not recorded" : p.sex} />
              <Row k="Diagnosis" v={p.diagnosis ? DIAGNOSES[p.diagnosis as keyof typeof DIAGNOSES] : ""} />
              <Row k="Extent / location" v={[p.ucExtent, p.cdLocation, p.cdUpperGi === "yes" ? "L4" : "", p.cdPerianal === "yes" ? "perianal" : ""].filter(Boolean).join(", ")} />
              <Row k="Disease duration" v={p.diseaseDurationYears != null ? `${p.diseaseDurationYears} y` : ""} />
              <Row k="Advanced / immuno therapy" v={p.immuno.map((m) => IMMUNO_MEDS[m]).join(", ")} />
              <Row k="Other medications" v={p.medications} />
              <Row k="Previous surgery" v={p.surgeries} />
              <Row k="Stoma" v={tri(p.hasOstomy)} />
              <Row k="Previous admissions" v={p.previousAdmissions} />
              <Row k="Comorbidities" v={p.comorbidities} />
            </dl>
          </Section>

          <Section title="Presenting symptoms and examination">
            <dl>
              <Row k="Chief complaint" v={a.presentation.chiefComplaint} />
              <Row k="Abdominal pain" v={a.presentation.abdominalPain} />
              <Row k="Stools / 24 h" v={a.presentation.stools24h} />
              <Row k="Bloody stools / 24 h" v={a.presentation.bloodyStools24h} />
              <Row k="Usual stools / day" v={a.presentation.usualStoolsPerDay} />
              <Row k="Symptom duration" v={a.presentation.symptomDurationDays != null ? `${a.presentation.symptomDurationDays} days` : ""} />
              {Object.entries(PRESENTATION_TRI).map(([k, l]) => <Row key={k} k={l} v={tri(a.presentation.tri[k as keyof typeof PRESENTATION_TRI])} />)}
              <Row k="Tenderness" v={a.exam.tenderness.replace(/_/g, " ")} />
              <Row k="Abdominal mass" v={a.exam.abdominalMass.replace(/_/g, " ")} />
              {Object.entries(EXAM_TRI).map(([k, l]) => <Row key={k} k={l} v={tri(a.exam.tri[k as keyof typeof EXAM_TRI])} />)}
              <Row k="Examined by" v={a.exam.examinedByRole ? ROLES[a.exam.examinedByRole as keyof typeof ROLES] : ""} />
              <Row k="Imaging" v={a.imaging.done === "yes" ? `Dilatation: ${tri(a.imaging.colonicDilatation) || "?"} · Free air: ${tri(a.imaging.freeAir) || "?"} · Collection: ${tri(a.imaging.collection) || "?"}` : tri(a.imaging.done)} />
            </dl>
          </Section>

          <Section title="Vital signs">
            <dl>
              <Row k="Heart rate" v={v.heartRate != null ? `${v.heartRate} bpm` : ""} />
              <Row k="Blood pressure" v={v.sbp != null || v.dbp != null ? `${v.sbp ?? "?"}/${v.dbp ?? "?"} mmHg` : ""} />
              <Row k="Temperature" v={v.temperature != null ? `${v.temperature} °${v.temperatureUnit}` : ""} />
              <Row k="Respiratory rate" v={v.respiratoryRate != null ? `${v.respiratoryRate} /min` : ""} />
              <Row k="SpO₂" v={v.spo2 != null ? `${v.spo2}%` : ""} />
              <Row k="Weight / height" v={v.weightKg != null || v.heightCm != null ? `${v.weightKg ?? "?"} kg / ${v.heightCm ?? "?"} cm` : ""} />
              <Row k="BMI" v={bmi(v.weightKg, v.heightCm)?.toFixed(1) ?? ""} />
            </dl>
          </Section>

          <Section title="Laboratory results">
            <table className="w-full text-left text-[14px]">
              <tbody>
                {NUMERIC_LABS.map((k) => {
                  const l = a.labs.values[k];
                  return (
                    <tr key={k} className="border-t border-line/50">
                      <td className="py-1 pr-2">{ANALYTES[k].label}</td>
                      <td className="py-1 pr-2">{l.status === "resulted" ? `${l.value} ${l.unit}` : <span className="italic text-ink-muted">{l.status ? LAB_STATUS[l.status as keyof typeof LAB_STATUS] : "not recorded"}</span>}</td>
                      <td className="py-1 text-ink-muted">{l.flag ? `lab: ${l.flag}` : ""}</td>
                    </tr>
                  );
                })}
                {(["cdiff", "stoolOther"] as const).map((k) => {
                  const t = a.labs[k];
                  return (
                    <tr key={k} className="border-t border-line/50">
                      <td className="py-1 pr-2">{k === "cdiff" ? "C. difficile" : "Other stool infection"}</td>
                      <td className="py-1 pr-2">{t.status === "resulted" ? `${t.result}${t.detail ? ` (${t.detail})` : ""}` : <span className="italic text-ink-muted">{t.status ? LAB_STATUS[t.status as keyof typeof LAB_STATUS] : "not recorded"}</span>}</td>
                      <td />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>

          <Section title="Calculated IBD scores (with components)">
            {out.scores.length === 0 ? <p>No scores apply.</p> : out.scores.map((s) => <ScoreCard key={s.scoreId} s={s} interactive={false} open />)}
            {out.notApplicable.map((n) => <p key={n.scoreName} className="text-[14px]"><span className="font-semibold">{n.scoreName}</span> not calculated: {n.reason}</p>)}
          </Section>

          <Section title="Missing information">
            {out.missingInvestigations.length === 0 ? <p>All listed investigations have results.</p> : (
              <ul className="list-disc pl-5">{out.missingInvestigations.map((m) => <li key={m.id}>{m.label} — {m.status}</li>)}</ul>
            )}
            {out.scores.filter((s) => s.missing.length).map((s) => <p key={s.scoreId} className="text-[14px]">{s.scoreName}: missing {s.missing.join(", ")}</p>)}
          </Section>

          <Section title="References used">
            <ul className="list-disc pl-5 text-[13px]">{usedRefs.map((r) => <li key={r}>{r}</li>)}</ul>
            <p className="text-[12px] text-ink-muted">Evidence categories: {Object.entries(CATEGORY_LABEL).map(([k, l]) => `${k} = ${l}`).join("; ")}. Score list: {SCORES.length} documented, see Clinical Reference.</p>
          </Section>

          <Section title="Clinician">
            <dl>
              <Row k="Entered by" v={[p.enteredBy, p.enteredByRole ? ROLES[p.enteredByRole as keyof typeof ROLES] : ""].filter(Boolean).join(" · ")} />
            </dl>
            <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-2">
              <div><div className="h-10 border-b border-ink" /><p className="mt-1 text-[13px] text-ink-muted">Reviewing clinician name</p></div>
              <div><div className="h-10 border-b border-ink" /><p className="mt-1 text-[13px] text-ink-muted">Signature · date / time</p></div>
            </div>
          </Section>

          <p className="border-t border-line pt-3 text-[13px] font-semibold">{DISCLAIMER}</p>
          <p className="text-[12px] text-ink-muted">App {APP_VERSION} · spec {SPEC_VERSION}</p>
        </div>
      </article>
    </div>
  );
}
