"use client";

import type { AssessmentOutput, ClinicalWarning, ScoreResult, WarningGroup } from "@/clinical/types";
import { CATEGORY_LABEL } from "@/clinical/spec/registry";
import { LOCAL_PROTOCOL } from "@/clinical/spec/local-protocol";
import { Badge, Banner, Card, cx, type Tone } from "@/ui/primitives";
import { FeedbackButton } from "@/features/feedback/FeedbackButton";

const LEVEL: Record<AssessmentOutput["summary"]["level"], { tone: Tone; label: string }> = {
  emergency: { tone: "emergency", label: "Emergency warning" },
  severe: { tone: "severe", label: "Severe disease activity" },
  moderate: { tone: "moderate", label: "Moderate disease activity" },
  lower: { tone: "lower", label: "Lower disease activity" },
  incomplete: { tone: "incomplete", label: "Incomplete assessment" },
  unbanded: { tone: "info", label: "No emergency warning found" },
};

const GROUPS: { id: WarningGroup; title: string }[] = [
  { id: "immediate", title: "1 · Immediate emergency warning signs" },
  { id: "physiological", title: "2 · Physiological instability" },
  { id: "severe_activity", title: "3 · Possible severe IBD activity" },
  { id: "surgical", title: "4 · Possible surgical complications" },
  { id: "infection", title: "5 · Possible infection" },
];

const sevTone = (w: ClinicalWarning): Tone => (w.severity === "emergency" ? "emergency" : w.severity === "warning" ? "moderate" : "info");

export function WarningCard({ w, interactive = true }: { w: ClinicalWarning; interactive?: boolean }) {
  return (
    <div>
      <Banner tone={sevTone(w)} title={w.title}>
        <ul className="list-disc space-y-0.5 pl-5">{w.because.map((b) => <li key={b}>{b}</li>)}</ul>
        {w.severity === "emergency" && <p className="mt-2 font-semibold text-emergency">{LOCAL_PROTOCOL.escalationText}</p>}
        <p className="mt-2 text-[13px] text-ink-muted">{w.source} · {CATEGORY_LABEL[w.category]} · Draft rule</p>
      </Banner>
      {interactive && <FeedbackButton target={`warning:${w.id}`} label={`Warning — ${w.title}`} />}
    </div>
  );
}

const bandTone = (s: ScoreResult): Tone =>
  s.status !== "complete" ? "incomplete"
    : s.interpretation?.band === "severe" ? "severe"
      : s.interpretation?.band === "moderate" ? "moderate"
        : s.interpretation?.band === "mild" || s.interpretation?.band === "remission" ? "lower" : "info";

export function ScoreCard({ s, interactive = true, open = false }: { s: ScoreResult; interactive?: boolean; open?: boolean }) {
  const range = `${s.range.min}–${s.range.max ?? "open"}`;
  return (
    <div className="raised-sm rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[17px] font-semibold">{s.scoreName}</p>
          <p className="text-[13px] text-ink-muted">{CATEGORY_LABEL[s.category]}</p>
        </div>
        <div className="text-right">
          {s.total != null ? (
            <p className="text-[28px] font-semibold leading-none tabular-nums">{s.total}<span className="text-[14px] font-medium text-ink-muted"> / {s.range.max ?? "—"}</span></p>
          ) : s.status === "incomplete" ? (
            <Badge tone="incomplete">Incomplete</Badge>
          ) : null}
        </div>
      </div>
      {s.interpretation && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={bandTone(s)}>{s.interpretation.label}</Badge>
          <span className="text-[13px] text-ink-muted">{s.interpretation.rule}{s.interpretationStatus === "unapproved" ? " · draft band" : ""}</span>
        </div>
      )}
      {s.missing.length > 0 && (
        <p className="mt-2 text-[14px]"><span className="font-semibold">Missing:</span> {s.missing.join(", ")}</p>
      )}
      {s.notes.map((n) => <p key={n} className="mt-1 text-[13px] text-ink-muted">{n}</p>)}
      <details className="mt-2" open={open}>
        <summary className="focus-ring cursor-pointer rounded-lg py-1 text-[14px] font-semibold text-accent">How this was calculated</summary>
        <table className="mt-2 w-full text-left text-[14px]">
          <thead><tr className="text-ink-muted"><th className="py-1 pr-2 font-semibold">Item</th><th className="py-1 pr-2 font-semibold">Answer</th><th className="py-1 text-right font-semibold">Pts</th></tr></thead>
          <tbody>
            {s.components.map((c) => (
              <tr key={c.itemId} className="border-t border-line/60 align-top">
                <td className="py-1.5 pr-2">{c.label}<div className="text-[12px] text-ink-muted">{c.rule}</div></td>
                <td className="py-1.5 pr-2">{c.answer ?? <span className="italic text-ink-muted">missing</span>}</td>
                <td className="py-1.5 text-right tabular-nums">{c.points ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[12px] text-ink-muted">
          Range {range} · Spec {s.specVersion} ({s.specStatus.replace(/_/g, " ")}) · Calculated {new Date(s.calculatedAt).toLocaleString()}
          <br />{s.references.map((r) => `${r.citation}${r.doi ? ` doi:${r.doi}` : ""}`).join(" · ")}
        </p>
      </details>
      {interactive && <FeedbackButton target={`score:${s.scoreId}`} label={`Score — ${s.scoreName}`} />}
    </div>
  );
}

export function TriageSummary({ out, interactive = true }: { out: AssessmentOutput; interactive?: boolean }) {
  const lvl = LEVEL[out.summary.level];
  const emergencyCount = out.warnings.filter((w) => w.severity === "emergency").length;
  return (
    <div className="space-y-5">
      <div className={cx("rounded-3xl border-2 p-5", {
        emergency: "border-emergency bg-emergency-bg", severe: "border-severe bg-severe-bg", moderate: "border-moderate bg-moderate-bg",
        lower: "border-lower bg-lower-bg", incomplete: "border-dashed border-incomplete bg-incomplete-bg", info: "border-info bg-info-bg",
      }[lvl.tone])}>
        <p className="text-[13px] font-bold uppercase tracking-wider">{lvl.label}</p>
        <p className="mt-1 text-[22px] font-semibold leading-tight">{out.summary.headline}</p>
        {emergencyCount > 0 && <p className="mt-2 font-semibold text-emergency">{LOCAL_PROTOCOL.escalationText}</p>}
        {out.summary.incomplete && out.summary.reasons.length > 0 && (
          <p className="mt-2 text-[14px]"><span className="font-semibold">Incomplete:</span> {out.summary.reasons.join(" · ")}</p>
        )}
        <p className="mt-2 text-[12px] text-ink-muted">Draft rules for review. Pathway: {out.pathway ?? "unknown"} · No triage category is assigned.</p>
      </div>

      {GROUPS.map((g) => {
        const ws = out.warnings.filter((w) => w.group === g.id);
        return (
          <Card key={g.id} title={g.title}>
            {ws.length === 0 ? (
              <p className="text-[15px] text-ink-muted">None found from the information entered.</p>
            ) : ws.map((w) => <WarningCard key={w.id} w={w} interactive={interactive} />)}
            {g.id === "physiological" && out.qsofa && out.sirs && (
              <div className="grid grid-cols-2 gap-3">
                {([["qSOFA", out.qsofa, 3], ["SIRS", out.sirs, 4]] as const).map(([name, x, max]) => (
                  <div key={name} className="well rounded-2xl p-3">
                    <p className="text-[13px] font-semibold text-ink-muted">{name}</p>
                    <p className="text-2xl font-semibold tabular-nums">{x.count}<span className="text-[14px] text-ink-muted"> / {max}</span></p>
                    {x.unknown.length > 0 && <p className="text-[12px] text-ink-muted">Unknown: {x.unknown.map((u) => u.split(" (")[0]).join(", ")}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}

      <Card title="6 · Disease activity scores" subtitle="Each score is shown separately. Scores are never added together.">
        {out.scores.length === 0 && <p className="text-[15px] text-ink-muted">No scores apply.</p>}
        {out.scores.map((s) => <ScoreCard key={s.scoreId} s={s} interactive={interactive} />)}
        {out.notApplicable.length > 0 && (
          <div>
            <p className="text-[14px] font-semibold text-ink-muted">Not calculated</p>
            <ul className="mt-1 space-y-1 text-[14px]">{out.notApplicable.map((n) => <li key={n.scoreName}><span className="font-semibold">{n.scoreName}:</span> {n.reason}</li>)}</ul>
          </div>
        )}
      </Card>

      <Card title="7 · Missing clinical investigations" subtitle="Not resulted yet. Missing results are never treated as normal.">
        {out.missingInvestigations.length === 0 ? (
          <p className="text-[15px] text-ink-muted">All listed investigations have results.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {out.missingInvestigations.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-incomplete px-3 py-2 text-[15px]">
                <span>{m.label}</span><Badge tone="incomplete">{m.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
