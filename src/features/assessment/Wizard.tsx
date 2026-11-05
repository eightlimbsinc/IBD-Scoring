"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAssessment } from "./AssessmentProvider";
import { ActivityStep } from "./ActivityStep";
import { LabsStep, PatientStep, PresentationStep, VitalsStep } from "./steps";
import { ResultStep } from "@/features/summary/ResultStep";
import { Button, cx } from "@/ui/primitives";

const STEPS = [
  { key: "patient", label: "Patient", short: "Patient", Comp: PatientStep, fields: ["patient"] },
  { key: "presentation", label: "Symptoms & exam", short: "Exam", Comp: PresentationStep, fields: ["presentation", "exam"] },
  { key: "activity", label: "Score questions", short: "Scores", Comp: ActivityStep, fields: ["activity"] },
  { key: "vitals", label: "Vital signs", short: "Vitals", Comp: VitalsStep, fields: ["vitals"] },
  { key: "labs", label: "Labs & imaging", short: "Labs", Comp: LabsStep, fields: ["labs", "imaging"] },
  { key: "result", label: "Triage summary", short: "Result", Comp: ResultStep, fields: [] },
] as const;

export function Wizard() {
  const { form, setStarted, setCompleted, demoTitle } = useAssessment();
  const params = useSearchParams();
  const [i, setI] = useState(() => (params.get("step") === "result" ? STEPS.length - 1 : 0));
  const router = useRouter();
  const top = useRef<HTMLDivElement>(null);
  const step = STEPS[i];

  useEffect(() => {
    setStarted(true);
  }, [setStarted]);
  useEffect(() => {
    top.current?.scrollIntoView({ block: "start" });
  }, [i]);

  const next = async () => {
    const ok = step.fields.length === 0 || (await form.trigger(step.fields as never));
    if (ok) setI((n) => Math.min(n + 1, STEPS.length - 1));
  };

  const finish = form.handleSubmit(
    (data) => {
      setCompleted(data);
      router.push("/report/");
      window.scrollTo(0, 0);
    },
    (errors) => {
      const idx = STEPS.findIndex((s) => s.fields.some((f) => f in errors));
      if (idx >= 0) setI(idx);
    },
  );

  return (
    <div ref={top} className="scroll-mt-40 space-y-5">
      <div>
        {demoTitle && <p className="mb-1 inline-block rounded-full bg-info-bg px-3 py-0.5 text-[13px] font-semibold text-info">Demo case: {demoTitle} (synthetic)</p>}
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{step.label}</h1>
        <p className="text-[15px] text-ink-muted">Step {i + 1} of {STEPS.length}</p>
      </div>

      <ol className="grid grid-cols-6 gap-1" aria-label="Assessment steps">
        {STEPS.map((s, n) => (
          <li key={s.key}>
            <button
              type="button"
              onClick={() => setI(n)}
              aria-current={n === i ? "step" : undefined}
              className={cx(
                "focus-ring w-full truncate rounded-xl px-0.5 py-2 text-[12px] font-semibold",
                n === i ? "pressed bg-info-bg text-accent" : "raised-sm text-ink-muted",
              )}
            >
              {s.short}
            </button>
          </li>
        ))}
      </ol>

      <form onSubmit={(e) => e.preventDefault()} noValidate>
        <step.Comp />
        <div className="no-print mt-6 flex gap-3">
          {i > 0 && <Button type="button" onClick={() => setI(i - 1)}>Back</Button>}
          {i < STEPS.length - 1 ? (
            <Button type="button" variant="primary" className="flex-1" onClick={next}>{i === STEPS.length - 2 ? "See triage summary" : "Continue"}</Button>
          ) : (
            <Button type="button" variant="primary" className="flex-1" onClick={finish}>Create report</Button>
          )}
        </div>
      </form>
    </div>
  );
}
