"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { pathwayForAge, type Assessment, type AssessmentInput } from "@/clinical/assessment-schema";
import { LOCAL_PROTOCOL } from "@/clinical/spec/local-protocol";
import {
  LICHTIGER_BLOOD, MAYO_BLEEDING, MAYO_ENDO, MAYO_PGA, PUCAI_ACTIVITY, PUCAI_BLEEDING, PUCAI_CONSISTENCY, PUCAI_PAIN,
  SCCAI_BLOOD, SCCAI_URGENCY, UC_EXTRACOLONIC, WELLBEING5, WELLBEING6,
} from "@/clinical/scores/uc";
import { HBI_COMPLICATIONS, PDAI_ITEMS } from "@/clinical/scores/cd";
import { Badge, Banner, Card, Field, NumberInput, Segmented, TRI_OPTIONS } from "@/ui/primitives";

const withUnknown = (o: Record<string, string>) => ({ ...o, unknown: "Unknown" });
const withNA = (o: Record<string, string>) => ({ ...o, not_assessed: "Not assessed" });

function Checks({ name, options }: { name: "activity.extracolonicUc" | "activity.hbiComplications"; options: Record<string, string> }) {
  const { register } = useFormContext<AssessmentInput, unknown, Assessment>();
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {Object.entries(options).map(([v, l]) => (
        <label key={v} className="raised-sm flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl px-4 has-checked:pressed has-checked:bg-info-bg">
          <input type="checkbox" value={v} {...register(name)} className="h-5 w-5 accent-[var(--accent)]" />
          <span className="text-[15px] font-medium">{l}</span>
        </label>
      ))}
    </div>
  );
}

function Shared({ items }: { items: string[] }) {
  return <p className="text-[14px] text-ink-muted">Also uses earlier answers: {items.join(" · ")}</p>;
}

export function ActivityStep() {
  const { register, control, formState: { errors } } = useFormContext<AssessmentInput, unknown, Assessment>();
  const [age, dx, perianal, cdPerianal, extraAssessed, compAssessed] = useWatch({
    control,
    name: ["patient.ageYears", "patient.diagnosis", "presentation.tri.perianalSymptoms", "patient.cdPerianal", "activity.extracolonicUcAssessed", "activity.hbiComplicationsAssessed"],
  });
  const ageN = age === "" || age == null ? undefined : Number(age);
  const pathway = pathwayForAge(Number.isFinite(ageN) ? ageN : undefined, LOCAL_PROTOCOL.pediatricAgeCutoffYears);
  const ucLike = dx === "uc" || dx === "ibdu";

  if (!dx || pathway === null) {
    return <Banner tone="incomplete" title="Enter age and diagnosis first">The questions on this step depend on the diagnosis and on the adult or pediatric pathway (Patient step).</Banner>;
  }
  if (dx === "suspected") {
    return <Banner tone="info" title="No disease activity scores for suspected IBD">These scores are only validated in diagnosed UC or Crohn&apos;s disease. Emergency warnings still apply — continue to Vitals.</Banner>;
  }

  const nightErr = (errors.activity?.nightStools?.message as string | undefined) ?? undefined;

  return (
    <div className="space-y-5">
      <p className="text-[15px] text-ink-muted">
        Only the questions the scores need for this patient ({pathway}, {dx === "cd" ? "Crohn's disease" : dx === "ibdu" ? "IBD unclassified" : "ulcerative colitis"}). Leave blank or choose Unknown if not known — the score will show as incomplete.
      </p>

      {ucLike && pathway === "adult" && (
        <>
          <Card title="SCCAI" subtitle="Simple Clinical Colitis Activity Index">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Stools during the day" htmlFor="ds" error={errors.activity?.dayStools?.message as string | undefined}>
                <NumberInput id="ds" inputMode="numeric" {...register("activity.dayStools")} />
              </Field>
              <Field label="Stools at night" htmlFor="ns" error={nightErr}>
                <NumberInput id="ns" inputMode="numeric" {...register("activity.nightStools")} />
              </Field>
            </div>
            <Field label="Urgency"><Segmented name="urg" columns={2} reg={register("activity.urgency")} options={withUnknown(SCCAI_URGENCY)} /></Field>
            <Field label="Blood in stool"><Segmented name="sb" columns={2} reg={register("activity.sccaiBlood")} options={withUnknown(SCCAI_BLOOD)} /></Field>
            <Field label="General well-being" hint="Also used by the Harvey-Bradshaw Index."><Segmented name="wb5" columns={2} reg={register("activity.wellBeing5")} options={withUnknown(WELLBEING5)} /></Field>
            <Field label="Extracolonic features checked?">
              <Segmented name="exa" reg={register("activity.extracolonicUcAssessed")} options={{ yes: "Yes — tick below", no: "None present", unknown: "Not checked" }} />
            </Field>
            {extraAssessed === "yes" && <Checks name="activity.extracolonicUc" options={UC_EXTRACOLONIC} />}
          </Card>

          <Card title="Mayo score" subtitle="Partial Mayo, and full Mayo if endoscopy was done">
            <Shared items={["Stools in 24 h", "Usual stools per day"]} />
            <Field label="Rectal bleeding"><Segmented name="mb" columns={1} reg={register("activity.mayoBleeding")} options={withUnknown(MAYO_BLEEDING)} /></Field>
            <Field label="Physician global assessment" hint="Physician only. Nurses and interns: choose Not assessed.">
              <div className="mb-2"><Badge tone="info">Physician only</Badge></div>
              <Segmented name="pga" columns={2} reg={register("activity.mayoPga")} options={withNA(MAYO_PGA)} />
            </Field>
            <Field label="Endoscopic subscore" hint="Only from an endoscopy report.">
              <Segmented name="endo" columns={1} reg={register("activity.mayoEndoscopy")} options={{ ...MAYO_ENDO, not_done: "No endoscopy" }} />
            </Field>
          </Card>

          <Card title="Lichtiger index">
            <Shared items={["Stools in 24 h", "Nocturnal stools", "Abdominal pain", "Abdominal tenderness"]} />
            <Field label="Visible blood (share of stools)"><Segmented name="lb" columns={2} reg={register("activity.lichtigerBlood")} options={withUnknown(LICHTIGER_BLOOD)} /></Field>
            <Field label="Fecal incontinence"><Segmented name="inc" reg={register("activity.incontinence")} options={TRI_OPTIONS} /></Field>
            <Field label="Needs antidiarrheal drugs"><Segmented name="ad" reg={register("activity.antidiarrheals")} options={TRI_OPTIONS} /></Field>
            <Field label="General well-being (6 levels)"><Segmented name="wb6" reg={register("activity.wellBeing6")} options={withUnknown(WELLBEING6)} /></Field>
          </Card>
        </>
      )}

      {ucLike && pathway === "pediatric" && (
        <Card title="PUCAI" subtitle="Pediatric Ulcerative Colitis Activity Index">
          <Shared items={["Stools in 24 h", "Nocturnal stools"]} />
          <Field label="Abdominal pain"><Segmented name="pp" columns={1} reg={register("activity.pucaiPain")} options={withUnknown(PUCAI_PAIN)} /></Field>
          <Field label="Rectal bleeding"><Segmented name="pbl" columns={1} reg={register("activity.pucaiBleeding")} options={withUnknown(PUCAI_BLEEDING)} /></Field>
          <Field label="Stool consistency (most stools)"><Segmented name="pc" columns={2} reg={register("activity.pucaiConsistency")} options={withUnknown(PUCAI_CONSISTENCY)} /></Field>
          <Field label="Activity level"><Segmented name="pa" columns={2} reg={register("activity.pucaiActivity")} options={withUnknown(PUCAI_ACTIVITY)} /></Field>
        </Card>
      )}

      {dx === "cd" && pathway === "adult" && (
        <>
          <Card title="Harvey-Bradshaw Index" subtitle="Answers are about the previous day">
            <Shared items={["Abdominal pain", "Abdominal mass"]} />
            <Field label="General well-being"><Segmented name="wb5" columns={2} reg={register("activity.wellBeing5")} options={withUnknown(WELLBEING5)} /></Field>
            <Field label="Liquid or soft stools (previous day)" htmlFor="ls" error={errors.activity?.liquidStoolsPrevDay?.message as string | undefined}>
              <NumberInput id="ls" inputMode="numeric" {...register("activity.liquidStoolsPrevDay")} />
            </Field>
            <Field label="Complications checked?">
              <Segmented name="hca" reg={register("activity.hbiComplicationsAssessed")} options={{ yes: "Yes — tick below", no: "None present", unknown: "Not checked" }} />
            </Field>
            {compAssessed === "yes" && <Checks name="activity.hbiComplications" options={HBI_COMPLICATIONS} />}
          </Card>

          {(perianal === "yes" || cdPerianal === "yes") && (
            <Card title="Perianal Disease Activity Index (PDAI)" subtitle="Needs a perianal examination. Any item can be Not assessed.">
              {(Object.keys(PDAI_ITEMS) as (keyof typeof PDAI_ITEMS)[]).map((k) => (
                <Field key={k} label={PDAI_ITEMS[k].label}>
                  <Segmented name={k} columns={1} reg={register(`activity.${k}`)} options={withNA(Object.fromEntries(PDAI_ITEMS[k].options.map((o, i) => [String(i), `${i} · ${o}`])))} />
                </Field>
              ))}
            </Card>
          )}
          <Banner tone="info" title="CDAI and PRO2 not calculated">They need a 7-day symptom diary, which isn&apos;t available in the ED.</Banner>
        </>
      )}

      {dx === "cd" && pathway === "pediatric" && (
        <Banner tone="info" title="No pediatric Crohn's score in this version">PCDAI / wPCDAI need verified age- and sex-specific tables. Emergency warnings still apply.</Banner>
      )}
    </div>
  );
}
