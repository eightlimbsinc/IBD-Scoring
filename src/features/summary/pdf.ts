import type { Assessment } from "@/clinical/assessment-schema";
import { DIAGNOSES, EXAM_TRI, IMMUNO_MEDS, LAB_STATUS, NUMERIC_LABS, PRESENTATION_TRI, ROLES } from "@/clinical/assessment-schema";
import type { AssessmentOutput } from "@/clinical/types";
import { ANALYTES, bmi } from "@/clinical/units";
import { LOCAL_PROTOCOL } from "@/clinical/spec/local-protocol";
import { APP_VERSION, SPEC_VERSION } from "@/clinical/spec/version";

export const DISCLAIMER =
  "Clinical decision-support output only. This report does not replace clinical assessment, institutional emergency triage protocols, or the judgment of the treating physician.";

/** Standard PDF fonts only cover Latin-1; swap symbols they can't draw. */
const SUBS: [RegExp, string][] = [
  [/≥/g, ">="], [/≤/g, "<="], [/→/g, "->"], [/↓/g, "decreased "], [/₂/g, "2"], [/⁹/g, "^9"], [/²/g, "^2"], [/³/g, "^3"],
  [/■/g, "-"], [/…/g, "..."], [/[“”]/g, '"'], [/[‘’]/g, "'"], [/[^\x20-\x7E\xA0-\xFF–—•\n]/g, ""],
];
export const pdfText = (s: unknown): string => {
  let x = s == null ? "" : String(s);
  for (const [re, r] of SUBS) x = x.replace(re, r);
  return x;
};

const tri = (v: string) => (v === "yes" ? "Yes" : v === "no" ? "No" : v === "unknown" ? "Unknown" : "");
const nr = (v: unknown) => (v === "" || v == null ? "not recorded" : String(v));

const NAVY: [number, number, number] = [11, 37, 69];
const RED: [number, number, number] = [180, 35, 24];
const MUTED: [number, number, number] = [63, 80, 104];

/** Builds the assessment report as a PDF (text, not a screenshot) — works offline and in installed apps. */
export async function buildReportPdf(a: Assessment, out: AssessmentOutput, demoTitle: string | null): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 14;
  let y = 16;

  const ensure = (h: number) => {
    if (y + h > doc.internal.pageSize.getHeight() - 18) { doc.addPage(); y = 16; }
  };
  const text = (s: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number } = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 10);
    doc.setTextColor(...(opts.color ?? NAVY));
    const lines = doc.splitTextToSize(pdfText(s), W - 2 * M) as string[];
    const lh = (opts.size ?? 10) * 0.45;
    ensure(lines.length * lh);
    doc.text(lines, M, y);
    y += lines.length * lh + (opts.gap ?? 1.5);
  };
  const heading = (s: string) => { y += 3; ensure(10); text(s, { size: 13, bold: true, gap: 2 }); };
  const table = (head: string[] | null, body: (string | number)[][], widths?: number[]) => {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M, bottom: 18 },
      head: head ? [head.map(pdfText)] : undefined,
      body: body.map((r) => r.map((c) => pdfText(c))),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 1.6, textColor: NAVY, lineColor: [200, 207, 216], lineWidth: 0.2, overflow: "linebreak" },
      headStyles: { fillColor: [230, 235, 241], textColor: NAVY, fontStyle: "bold" },
      columnStyles: widths ? Object.fromEntries(widths.map((w, i) => [i, { cellWidth: w }])) : undefined,
    });
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY ?? y) + 3;
  };

  const p = a.patient;
  const v = a.vitals;

  // Header
  if (demoTitle) text(`SYNTHETIC DEMO CASE — ${demoTitle}. Not a real patient.`, { bold: true, color: [19, 78, 138] });
  text("IBD EMERGENCY ASSESSMENT REPORT", { size: 9, bold: true, color: MUTED });
  text(`Case ${p.caseId}${p.name ? ` · ${p.name}` : ""}`, { size: 16, bold: true, gap: 2 });
  text(`Assessed ${new Date(p.assessedAt).toLocaleString()} · Report generated ${new Date(out.calculatedAt).toLocaleString()}`, { size: 9, color: MUTED });
  text(DISCLAIMER, { bold: true, color: RED, gap: 1 });
  text(`DRAFT rules — scoring specification ${SPEC_VERSION} not yet signed off by a gastroenterologist.`, { size: 9, color: MUTED });

  heading("Clinical assessment summary");
  text(out.summary.headline, { size: 12, bold: true });
  const emergencies = out.warnings.filter((w) => w.severity === "emergency");
  if (emergencies.length) text(LOCAL_PROTOCOL.escalationText, { bold: true, color: RED });
  if (out.summary.incomplete) text(`Incomplete: ${out.summary.reasons.join(" · ")}`);
  text("No triage category assigned. No admission, discharge, surgical or treatment recommendation is made.", { size: 9, color: MUTED });

  heading("Emergency warning signs and alerts");
  if (!out.warnings.length) text("None found from the information entered.");
  else table(["Level", "Warning", "Because", "Source"], out.warnings.map((w) => [
    w.severity === "emergency" ? "EMERGENCY" : w.severity === "warning" ? "Warning" : "Info", w.title, w.because.join("; "), w.source,
  ]), [24, 48, 60, 50]);

  heading("Patient information");
  table(null, [
    ["Age / pathway", `${p.ageYears ?? "?"} y · ${out.pathway ?? "unknown"}`],
    ["Sex", p.sex === "not_recorded" || !p.sex ? "not recorded" : p.sex],
    ["Diagnosis", p.diagnosis ? DIAGNOSES[p.diagnosis as keyof typeof DIAGNOSES] : "not recorded"],
    ["Extent / location", nr([p.ucExtent, p.cdLocation, p.cdUpperGi === "yes" ? "L4" : "", p.cdPerianal === "yes" ? "perianal" : ""].filter(Boolean).join(", "))],
    ["Disease duration", p.diseaseDurationYears != null ? `${p.diseaseDurationYears} y` : "not recorded"],
    ["Advanced / immuno therapy", nr(p.immuno.map((m) => IMMUNO_MEDS[m]).join(", "))],
    ["Other medications", nr(p.medications)],
    ["Previous surgery", nr(p.surgeries)],
    ["Stoma", nr(tri(p.hasOstomy))],
    ["Previous admissions", nr(p.previousAdmissions)],
    ["Comorbidities", nr(p.comorbidities)],
  ], [50, 132]);

  heading("Presenting symptoms and examination");
  table(null, [
    ["Chief complaint", nr(a.presentation.chiefComplaint)],
    ["Abdominal pain", nr(a.presentation.abdominalPain)],
    ["Stools / 24 h", nr(a.presentation.stools24h)],
    ["Bloody stools / 24 h", nr(a.presentation.bloodyStools24h)],
    ["Usual stools / day", nr(a.presentation.usualStoolsPerDay)],
    ["Symptom duration", a.presentation.symptomDurationDays != null ? `${a.presentation.symptomDurationDays} days` : "not recorded"],
    ...Object.entries(PRESENTATION_TRI).map(([k, l]) => [l, nr(tri(a.presentation.tri[k as keyof typeof PRESENTATION_TRI]))]),
    ["Tenderness", nr(a.exam.tenderness.replace(/_/g, " "))],
    ["Abdominal mass", nr(a.exam.abdominalMass.replace(/_/g, " "))],
    ...Object.entries(EXAM_TRI).map(([k, l]) => [l, nr(tri(a.exam.tri[k as keyof typeof EXAM_TRI]))]),
    ["Examined by", a.exam.examinedByRole ? ROLES[a.exam.examinedByRole as keyof typeof ROLES] : "not recorded"],
    ["Imaging", a.imaging.done === "yes" ? `Dilatation: ${tri(a.imaging.colonicDilatation) || "?"} · Free air: ${tri(a.imaging.freeAir) || "?"} · Collection: ${tri(a.imaging.collection) || "?"}` : nr(tri(a.imaging.done))],
  ], [60, 122]);

  heading("Vital signs");
  table(null, [
    ["Heart rate", v.heartRate != null ? `${v.heartRate} bpm` : "not recorded"],
    ["Blood pressure", v.sbp != null || v.dbp != null ? `${v.sbp ?? "?"}/${v.dbp ?? "?"} mmHg` : "not recorded"],
    ["Temperature", v.temperature != null ? `${v.temperature} °${v.temperatureUnit}` : "not recorded"],
    ["Respiratory rate", v.respiratoryRate != null ? `${v.respiratoryRate} /min` : "not recorded"],
    ["SpO2", v.spo2 != null ? `${v.spo2}%` : "not recorded"],
    ["Weight / height", v.weightKg != null || v.heightCm != null ? `${v.weightKg ?? "?"} kg / ${v.heightCm ?? "?"} cm` : "not recorded"],
    ["BMI", bmi(v.weightKg, v.heightCm)?.toFixed(1) ?? "not recorded"],
    ...(out.qsofa ? [["qSOFA", `${out.qsofa.count}/3${out.qsofa.unknown.length ? ` (unknown: ${out.qsofa.unknown.length})` : ""}`]] : []),
    ...(out.sirs ? [["SIRS", `${out.sirs.count}/4${out.sirs.unknown.length ? ` (unknown: ${out.sirs.unknown.length})` : ""}`]] : []),
  ], [60, 122]);

  heading("Laboratory results");
  table(["Test", "Result", "Lab flag"], [
    ...NUMERIC_LABS.map((k) => {
      const l = a.labs.values[k];
      return [ANALYTES[k].label, l.status === "resulted" ? `${l.value} ${l.unit}` : l.status ? LAB_STATUS[l.status as keyof typeof LAB_STATUS] : "not recorded", l.flag || ""];
    }),
    ...(["cdiff", "stoolOther"] as const).map((k) => {
      const t = a.labs[k];
      return [k === "cdiff" ? "C. difficile" : "Other stool infection", t.status === "resulted" ? `${t.result}${t.detail ? ` (${t.detail})` : ""}` : t.status ? LAB_STATUS[t.status as keyof typeof LAB_STATUS] : "not recorded", ""];
    }),
  ], [60, 82, 40]);

  heading("Calculated IBD scores (each shown separately; never combined)");
  if (!out.scores.length) text("No scores apply.");
  for (const s of out.scores) {
    ensure(20);
    const total = s.total != null ? `${s.total}${s.range.max != null ? ` / ${s.range.max}` : ""}` : s.status === "incomplete" ? "Incomplete" : "";
    text(total ? `${s.scoreName}: ${total}` : s.scoreName, { size: 11, bold: true, gap: 1 });
    if (s.interpretation) text(`${s.interpretation.label} (${s.interpretation.rule})${s.interpretationStatus === "unapproved" ? " · draft band" : ""}`, { gap: 1 });
    table(["Item", "Answer", "Points"], s.components.map((c) => [`${c.label}\n${c.rule}`, c.answer ?? "missing", c.points ?? "—"]), [92, 70, 20]);
    if (s.missing.length) text(`Missing: ${s.missing.join(", ")}`, { size: 9 });
    for (const n of s.notes) text(n, { size: 8, color: MUTED, gap: 0.8 });
    text(`Spec ${s.specVersion} (${s.specStatus.replace(/_/g, " ")}) · ${s.references.map((r) => `${r.citation}${r.doi ? ` doi:${r.doi}` : ""}`).join(" · ")}`, { size: 8, color: MUTED, gap: 3 });
  }
  for (const n of out.notApplicable) text(`${n.scoreName} not calculated: ${n.reason}`, { size: 9 });

  heading("Missing information");
  if (!out.missingInvestigations.length) text("All listed investigations have results.");
  else text(out.missingInvestigations.map((m) => `${m.label} — ${m.status}`).join("\n"));

  heading("References used");
  const refs = Array.from(new Set(out.scores.flatMap((s) => s.references.map((r) => `${r.citation}${r.doi ? ` — doi:${r.doi}` : ""}`)).concat(out.warnings.map((w) => w.source))));
  text(refs.map((r) => `• ${r}`).join("\n"), { size: 8 });

  ensure(42); // keep the clinician block (heading, entered-by, signature lines) on one page
  heading("Clinician");
  text(`Entered by: ${nr([p.enteredBy, p.enteredByRole ? ROLES[p.enteredByRole as keyof typeof ROLES] : ""].filter(Boolean).join(" · "))}`);
  y += 12;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.line(M, y, M + 80, y);
  doc.line(W - M - 80, y, W - M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Reviewing clinician name", M, y + 4);
  doc.text(pdfText("Signature · date / time"), W - M - 80, y + 4);
  y += 8;

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    const h = doc.internal.pageSize.getHeight();
    doc.text(doc.splitTextToSize(pdfText(DISCLAIMER), W - 2 * M - 20) as string[], M, h - 10);
    doc.text(`${i} / ${pages}`, W - M, h - 10, { align: "right" });
    doc.text(pdfText(`Case ${p.caseId} · app ${APP_VERSION} · spec ${SPEC_VERSION}`), M, h - 4);
  }

  return doc.output("blob");
}

/** Share the PDF (Android/iOS share sheet) or download it. */
export async function deliverPdf(blob: Blob, filename: string): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([blob], filename, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
      /* fall through to download */
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "downloaded";
}
