"use client";

import { useFormContext, useWatch, type FieldErrors } from "react-hook-form";
import {
  CD_LOCATION, DIAGNOSES, EXAM_TRI, IMMUNO_MEDS, LAB_STATUS, NUMERIC_LABS, PRESENTATION_TRI, ROLES, UC_EXTENT,
  pathwayForAge, type Assessment, type AssessmentInput,
} from "@/clinical/assessment-schema";
import { ANALYTES, bmi, fahrenheitToCelsius, map } from "@/clinical/units";
import { LOCAL_PROTOCOL } from "@/clinical/spec/local-protocol";
import { Badge, Banner, Card, Field, NumberInput, Segmented, Select, TextArea, TextInput, TRI_OPTIONS } from "@/ui/primitives";

type F = AssessmentInput;

function useF() {
  return useFormContext<F, unknown, Assessment>();
}

/** Read a nested error message by dotted path. */
function err(errors: FieldErrors<F>, path: string): string | undefined {
  let cur: unknown = errors;
  for (const p of path.split(".")) cur = (cur as Record<string, unknown> | undefined)?.[p];
  return (cur as { message?: string } | undefined)?.message;
}

const num = (v: unknown) => (v === "" || v == null || Number.isNaN(Number(v)) ? undefined : Number(v));

/* ---------------- Step 1: Patient ---------------- */

export function PatientStep() {
  const { register, formState: { errors }, control } = useF();
  const [age, diagnosis] = useWatch({ control, name: ["patient.ageYears", "patient.diagnosis"] });
  const pathway = pathwayForAge(num(age), LOCAL_PROTOCOL.pediatricAgeCutoffYears);

  return (
    <div className="space-y-5">
      <Card title="Patient" subtitle="Use the MRN or a case code. The name is optional and is not needed for scoring.">
        <Field label="MRN / case code" htmlFor="caseId" error={err(errors, "patient.caseId")}>
          <TextInput id="caseId" autoCapitalize="characters" {...register("patient.caseId")} />
        </Field>
        <Field label="Patient name (optional)" htmlFor="pname">
          <TextInput id="pname" autoComplete="off" {...register("patient.name")} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Age" htmlFor="age" error={err(errors, "patient.ageYears")}>
            <NumberInput id="age" inputMode="numeric" unit="years" {...register("patient.ageYears")} />
          </Field>
          <Field label="Pathway">
            <div className="flex min-h-12 items-center">
              {pathway === null ? <Badge tone="incomplete">Enter age</Badge> : pathway === "pediatric" ? <Badge tone="info">Pediatric</Badge> : <Badge tone="info">Adult</Badge>}
            </div>
          </Field>
        </div>
        <Field label="Sex" hint="Only needed by some scores (e.g. CDAI).">
          <Segmented name="sex" reg={register("patient.sex")} options={{ female: "Female", male: "Male", not_recorded: "Not recorded" }} />
        </Field>
        <Field label="Date and time of assessment" htmlFor="at" error={err(errors, "patient.assessedAt")}>
          <TextInput id="at" type="datetime-local" {...register("patient.assessedAt")} />
        </Field>
      </Card>

      <Card title="IBD history">
        <Field label="Known diagnosis" error={err(errors, "patient.diagnosis")}>
          <Segmented name="dx" columns={2} reg={register("patient.diagnosis")} options={DIAGNOSES} />
        </Field>
        <Field label="Disease duration" htmlFor="dur" error={err(errors, "patient.diseaseDurationYears")}>
          <NumberInput id="dur" unit="years" {...register("patient.diseaseDurationYears")} />
        </Field>
        {(diagnosis === "uc" || diagnosis === "ibdu") && (
          <Field label="Known extent (Montreal)" htmlFor="ext">
            <Select id="ext" {...register("patient.ucExtent")}>
              {Object.entries(UC_EXTENT).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
        )}
        {diagnosis === "cd" && (
          <>
            <Field label="Known location (Montreal)" htmlFor="loc">
              <Select id="loc" {...register("patient.cdLocation")}>
                {Object.entries(CD_LOCATION).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Upper GI involvement (L4)">
              <Segmented name="l4" reg={register("patient.cdUpperGi")} options={TRI_OPTIONS} />
            </Field>
            <Field label="Known perianal disease">
              <Segmented name="peri" reg={register("patient.cdPerianal")} options={TRI_OPTIONS} />
            </Field>
          </>
        )}
        <Field label="Biologics, immunosuppressants and steroids" hint="These can hide fever and peritoneal signs.">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.entries(IMMUNO_MEDS).map(([v, l]) => (
              <label key={v} className="raised-sm flex min-h-12 cursor-pointer items-center gap-3 rounded-ctl px-4 has-checked:pressed has-checked:bg-info-bg">
                <input type="checkbox" value={v} {...register("patient.immuno")} className="h-5 w-5 accent-[var(--accent)]" />
                <span className="text-[15px] font-medium">{l}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Other current medications" htmlFor="meds">
          <TextArea id="meds" {...register("patient.medications")} />
        </Field>
        <Field label="Previous IBD surgery" htmlFor="surg">
          <TextArea id="surg" rows={2} {...register("patient.surgeries")} />
        </Field>
        <Field label="Has a stoma (ostomy)" hint="Stool-count items are not valid with a stoma.">
          <Segmented name="ostomy" reg={register("patient.hasOstomy")} options={TRI_OPTIONS} />
        </Field>
        <Field label="Previous IBD admissions" htmlFor="adm" error={err(errors, "patient.previousAdmissions")}>
          <NumberInput id="adm" inputMode="numeric" unit="times" {...register("patient.previousAdmissions")} />
        </Field>
        <Field label="Relevant comorbidities" htmlFor="comorb">
          <TextArea id="comorb" rows={2} {...register("patient.comorbidities")} />
        </Field>
      </Card>

      <Card title="Entered by">
        <Field label="Your name" htmlFor="by">
          <TextInput id="by" autoComplete="name" {...register("patient.enteredBy")} />
        </Field>
        <Field label="Your role">
          <Segmented name="role" columns={2} reg={register("patient.enteredByRole")} options={ROLES} />
        </Field>
      </Card>
    </div>
  );
}

/* ---------------- Step 2: Presentation + exam ---------------- */

export function PresentationStep() {
  const { register, formState: { errors } } = useF();
  return (
    <div className="space-y-5">
      <Card title="Presentation">
        <Field label="Chief complaint" htmlFor="cc">
          <TextArea id="cc" rows={2} {...register("presentation.chiefComplaint")} />
        </Field>
        <Field label="Abdominal pain">
          <Segmented name="pain" reg={register("presentation.abdominalPain")} options={{ none: "None", mild: "Mild", moderate: "Moderate", severe: "Severe", unknown: "Unknown" }} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Stools, last 24 h" htmlFor="st" error={err(errors, "presentation.stools24h")}>
            <NumberInput id="st" inputMode="numeric" {...register("presentation.stools24h")} />
          </Field>
          <Field label="Bloody stools, last 24 h" htmlFor="bst" error={err(errors, "presentation.bloodyStools24h")}>
            <NumberInput id="bst" inputMode="numeric" {...register("presentation.bloodyStools24h")} />
          </Field>
          <Field label="Usual stools per day" hint="When well" htmlFor="ust" error={err(errors, "presentation.usualStoolsPerDay")}>
            <NumberInput id="ust" inputMode="numeric" {...register("presentation.usualStoolsPerDay")} />
          </Field>
          <Field label="Symptom duration" hint="Current episode" htmlFor="sd" error={err(errors, "presentation.symptomDurationDays")}>
            <NumberInput id="sd" inputMode="numeric" unit="days" {...register("presentation.symptomDurationDays")} />
          </Field>
        </div>
      </Card>

      <Card title="Symptoms" subtitle="Leave blank if not asked. Choose Unknown if the patient cannot say.">
        {Object.entries(PRESENTATION_TRI).map(([k, label]) => (
          <Field key={k} label={label}>
            <Segmented name={`tri-${k}`} reg={register(`presentation.tri.${k as keyof typeof PRESENTATION_TRI}`)} options={TRI_OPTIONS} />
          </Field>
        ))}
      </Card>

      <Card title="Bedside examination" subtitle="These findings set off the perforation, obstruction and abscess warnings. If you are not sure, choose Not assessed and ask a doctor to examine.">
        <Field label="Abdominal tenderness">
          <Segmented
            name="tender"
            columns={2}
            reg={register("exam.tenderness")}
            options={{ none: "None", mild_localised: "Mild, one area", mild_moderate_diffuse: "Mild–moderate, widespread", severe_or_rebound: "Severe or rebound", not_assessed: "Not assessed" }}
          />
        </Field>
        <Field label="Abdominal mass" hint="Definite and tender = a lump you can feel that hurts when pressed.">
          <Segmented
            name="mass"
            columns={2}
            reg={register("exam.abdominalMass")}
            options={{ none: "None", dubious: "Unsure / dubious", definite: "Definite", definite_tender: "Definite and tender", not_assessed: "Not assessed" }}
          />
        </Field>
        {Object.entries(EXAM_TRI).map(([k, label]) => (
          <Field key={k} label={label}>
            <Segmented name={`ex-${k}`} reg={register(`exam.tri.${k as keyof typeof EXAM_TRI}`)} options={{ yes: "Yes", no: "No", unknown: "Not assessed" }} />
          </Field>
        ))}
        <Field label="Examined by">
          <Segmented name="exby" columns={2} reg={register("exam.examinedByRole")} options={ROLES} />
        </Field>
      </Card>
    </div>
  );
}

/* ---------------- Step 3: Vitals ---------------- */

export function VitalsStep() {
  const { register, formState: { errors }, control } = useF();
  const [w, h, sbp, dbp, temp, tu] = useWatch({ control, name: ["vitals.weightKg", "vitals.heightCm", "vitals.sbp", "vitals.dbp", "vitals.temperature", "vitals.temperatureUnit"] });
  const b = bmi(num(w), num(h));
  const m = map(num(sbp), num(dbp));
  const tC = num(temp) != null && tu === "F" ? fahrenheitToCelsius(num(temp)!) : undefined;

  return (
    <Card title="Vital signs" subtitle="Leave blank if not measured. Blank is shown as missing, never as normal.">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Heart rate" htmlFor="hr" error={err(errors, "vitals.heartRate")}>
          <NumberInput id="hr" inputMode="numeric" unit="bpm" {...register("vitals.heartRate")} />
        </Field>
        <Field label="Respiratory rate" htmlFor="rr" error={err(errors, "vitals.respiratoryRate")}>
          <NumberInput id="rr" inputMode="numeric" unit="/min" {...register("vitals.respiratoryRate")} />
        </Field>
        <Field label="Systolic BP" htmlFor="sbp" error={err(errors, "vitals.sbp")}>
          <NumberInput id="sbp" inputMode="numeric" unit="mmHg" {...register("vitals.sbp")} />
        </Field>
        <Field label="Diastolic BP" htmlFor="dbp" error={err(errors, "vitals.dbp")}>
          <NumberInput id="dbp" inputMode="numeric" unit="mmHg" {...register("vitals.dbp")} />
        </Field>
        <Field label="SpO₂" htmlFor="spo2" error={err(errors, "vitals.spo2")}>
          <NumberInput id="spo2" inputMode="numeric" unit="%" {...register("vitals.spo2")} />
        </Field>
        <Field label="Temperature" htmlFor="temp" error={err(errors, "vitals.temperature")} hint={tC != null ? `= ${tC.toFixed(1)} °C` : undefined}>
          <div className="flex gap-2">
            <NumberInput id="temp" {...register("vitals.temperature")} />
            <Select aria-label="Temperature unit" className="w-20 px-3" {...register("vitals.temperatureUnit")}>
              <option value="C">°C</option>
              <option value="F">°F</option>
            </Select>
          </div>
        </Field>
        <Field label="Weight" htmlFor="wt" error={err(errors, "vitals.weightKg")}>
          <NumberInput id="wt" unit="kg" {...register("vitals.weightKg")} />
        </Field>
        <Field label="Height" htmlFor="ht" error={err(errors, "vitals.heightCm")}>
          <NumberInput id="ht" unit="cm" {...register("vitals.heightCm")} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="well rounded-ctl p-3">
          <p className="text-[13px] font-semibold text-ink-muted">BMI (calculated)</p>
          <p className="text-2xl font-semibold tabular-nums">{b != null ? b.toFixed(1) : "—"}</p>
        </div>
        <div className="well rounded-ctl p-3">
          <p className="text-[13px] font-semibold text-ink-muted">MAP (calculated)</p>
          <p className="text-2xl font-semibold tabular-nums">{m != null ? `${Math.round(m)} mmHg` : "—"}</p>
        </div>
      </div>
    </Card>
  );
}

/* ---------------- Step 4: Labs ---------------- */

function LabRow({ a }: { a: (typeof NUMERIC_LABS)[number] }) {
  const { register, formState: { errors }, control } = useF();
  const status = useWatch({ control, name: `labs.values.${a}.status` });
  const def = ANALYTES[a];
  const units = Object.keys(def.units);
  return (
    <div className="raised-sm space-y-3 rounded-ctl p-4">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`lab-${a}-status`} className="font-semibold">{def.label}</label>
        <Select id={`lab-${a}-status`} className="max-w-48 py-2 text-[15px]" {...register(`labs.values.${a}.status`)}>
          <option value="">Not recorded</option>
          {Object.entries(LAB_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>
      {status === "resulted" && (
        <>
          <div className="flex gap-2">
            <NumberInput aria-label={`${def.label} value`} {...register(`labs.values.${a}.value`)} />
            {units.length > 1 ? (
              <Select aria-label={`${def.label} unit`} className="w-36 px-3 text-[15px]" {...register(`labs.values.${a}.unit`)}>
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>
            ) : (
              <span className="flex min-w-24 items-center justify-center text-[15px] text-ink-muted">{units[0]}</span>
            )}
          </div>
          {err(errors, `labs.values.${a}.value`) && <p role="alert" className="text-[15px] font-medium text-emergency">{err(errors, `labs.values.${a}.value`)}</p>}
          <Segmented name={`flag-${a}`} reg={register(`labs.values.${a}.flag`)} options={{ normal: "Lab says normal", abnormal: "Lab says abnormal" }} columns={2} />
        </>
      )}
    </div>
  );
}

function StoolTest({ k, label }: { k: "cdiff" | "stoolOther"; label: string }) {
  const { register, formState: { errors }, control } = useF();
  const status = useWatch({ control, name: `labs.${k}.status` });
  return (
    <div className="raised-sm space-y-3 rounded-ctl p-4">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`st-${k}`} className="font-semibold">{label}</label>
        <Select id={`st-${k}`} className="max-w-48 py-2 text-[15px]" {...register(`labs.${k}.status`)}>
          <option value="">Not recorded</option>
          {Object.entries(LAB_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>
      {status === "resulted" && (
        <>
          <Segmented name={`res-${k}`} reg={register(`labs.${k}.result`)} options={{ positive: "Positive", negative: "Negative" }} columns={2} />
          {err(errors, `labs.${k}.result`) && <p role="alert" className="text-[15px] font-medium text-emergency">{err(errors, `labs.${k}.result`)}</p>}
          {k === "stoolOther" && <TextInput placeholder="Organism / test" {...register(`labs.${k}.detail`)} />}
        </>
      )}
    </div>
  );
}

function ImagingFields() {
  const { register, control } = useF();
  const done = useWatch({ control, name: "imaging.done" });
  return (
    <>
      <Field label="Abdominal imaging done">
        <Segmented name="imgdone" reg={register("imaging.done")} options={{ yes: "Yes", no: "No", unknown: "Not known" }} />
      </Field>
      {done === "yes" && (
        <>
          <Field label="Colonic dilatation (transverse colon > 6 cm)"><Segmented name="dil" reg={register("imaging.colonicDilatation")} options={TRI_OPTIONS} /></Field>
          <Field label="Free air (pneumoperitoneum)"><Segmented name="air" reg={register("imaging.freeAir")} options={TRI_OPTIONS} /></Field>
          <Field label="Abscess / collection"><Segmented name="col" reg={register("imaging.collection")} options={TRI_OPTIONS} /></Field>
        </>
      )}
    </>
  );
}

export function LabsStep() {
  return (
    <div className="space-y-5">
      <Card title="Laboratory results" subtitle="Set a status for each test. Only resulted values are used. Pending or not ordered is never treated as normal.">
        <div className="space-y-3">
          {NUMERIC_LABS.map((a) => <LabRow key={a} a={a} />)}
        </div>
      </Card>
      <Card title="Imaging (if done)" subtitle="From an X-ray, CT or ultrasound report. Leave blank if no imaging yet.">
        <ImagingFields />
      </Card>
      <Card title="Stool tests">
        <StoolTest k="cdiff" label="C. difficile" />
        <StoolTest k="stoolOther" label="Other stool infection" />
      </Card>
    </div>
  );
}
