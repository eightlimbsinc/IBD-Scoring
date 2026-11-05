"use client";

import { forwardRef, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Card({ title, subtitle, children, className }: { title?: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx("raised rounded-3xl p-5", className)}>
      {title && <h2 className="text-xl font-semibold tracking-tight">{title}</h2>}
      {subtitle && <p className="mt-1 text-[15px] text-ink-muted">{subtitle}</p>}
      <div className={cx(title && "mt-4", "space-y-5")}>{children}</div>
    </section>
  );
}

export function Field({ label, hint, error, htmlFor, children }: { label: string; hint?: string; error?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[16px] font-semibold">{label}</label>
      {hint && <p className="mt-0.5 text-[14px] text-ink-muted">{hint}</p>}
      <div className="mt-2">{children}</div>
      {error && <p role="alert" className="mt-1.5 text-[15px] font-medium text-emergency">{error}</p>}
    </div>
  );
}

const inputCls = "well focus-ring w-full rounded-2xl px-4 py-3 text-[17px] placeholder:text-ink-muted/70";

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(props, ref) {
  return <input ref={ref} {...props} className={cx(inputCls, props.className)} />;
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(props, ref) {
  return <textarea ref={ref} rows={3} {...props} className={cx(inputCls, "resize-y", props.className)} />;
});

export const NumberInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { unit?: ReactNode }>(
  function NumberInput({ unit, ...props }, ref) {
    return (
      <div className="flex items-stretch gap-2">
        <input ref={ref} type="text" inputMode="decimal" autoComplete="off" {...props} className={cx(inputCls, "tabular-nums")} />
        {unit && <div className="flex min-w-12 shrink-0 items-center text-[15px] font-medium text-ink-muted">{unit}</div>}
      </div>
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(props, ref) {
  return <select ref={ref} {...props} className={cx(inputCls, "appearance-none bg-no-repeat pr-10", props.className)} />;
});

/** Radio pills. `"" ` (not answered) is never one of the options, so nothing is pre-selected. */
export function Segmented({ options, reg, name, columns }: { options: Record<string, string>; reg: UseFormRegisterReturn; name: string; columns?: number }) {
  const entries = Object.entries(options);
  return (
    <div role="radiogroup" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns ?? Math.min(entries.length, 3)}, minmax(0, 1fr))` }}>
      {entries.map(([value, label]) => (
        <label key={value} className="relative">
          <input type="radio" value={value} {...reg} className="peer sr-only" id={`${name}-${value}`} />
          <span
            className={cx(
              "raised-sm flex min-h-12 cursor-pointer items-center justify-center rounded-2xl px-3 py-2 text-center text-[15px] font-medium leading-tight",
              "peer-checked:pressed peer-checked:bg-info-bg peer-checked:font-semibold peer-checked:text-accent",
              "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
              value === "unknown" || value === "not_assessed" ? "italic" : "",
            )}
          >
            {label}
          </span>
        </label>
      ))}
    </div>
  );
}

export const TRI_OPTIONS = { yes: "Yes", no: "No", unknown: "Unknown" };

export function Button({ variant = "default", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" | "ghost" }) {
  return (
    <button
      {...props}
      className={cx(
        "focus-ring min-h-12 rounded-2xl px-5 py-3 text-[17px] font-semibold active:pressed disabled:opacity-50",
        variant === "primary" && "bg-accent text-white shadow-[4px_4px_10px_var(--shadow-dark),-4px_-4px_10px_var(--shadow-light)]",
        variant === "default" && "raised-sm",
        variant === "ghost" && "text-accent underline-offset-4 hover:underline",
        className,
      )}
    />
  );
}

export type Tone = "emergency" | "severe" | "moderate" | "lower" | "incomplete" | "info";

const toneCls: Record<Tone, string> = {
  emergency: "bg-emergency-bg text-emergency border-emergency",
  severe: "bg-severe-bg text-severe border-severe",
  moderate: "bg-moderate-bg text-moderate border-moderate",
  lower: "bg-lower-bg text-lower border-lower",
  incomplete: "bg-incomplete-bg text-incomplete border-incomplete border-dashed",
  info: "bg-info-bg text-info border-info",
};

const toneIcon: Record<Tone, string> = { emergency: "!", severe: "▲", moderate: "◆", lower: "●", incomplete: "…", info: "i" };

export function Banner({ tone, title, children }: { tone: Tone; title: string; children?: ReactNode }) {
  return (
    <div role={tone === "emergency" ? "alert" : "status"} className={cx("rounded-2xl border-2 p-4", toneCls[tone])}>
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-current text-[13px] font-bold">
          {toneIcon[tone]}
        </span>
        <div>
          <p className="font-semibold">{title}</p>
          {children && <div className="mt-1 text-[15px] text-ink">{children}</div>}
        </div>
      </div>
    </div>
  );
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={cx("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[13px] font-semibold", toneCls[tone])}>{children}</span>;
}
