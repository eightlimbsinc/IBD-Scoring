"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES, setTheme, useTheme, type ThemeId } from "./theme";
import { cx } from "@/ui/primitives";

const DOT: Record<ThemeId, string> = {
  soft: "linear-gradient(135deg,#ffffff 0%,#e6ebf1 50%,#bec8d4 100%)",
  er: "linear-gradient(135deg,#ffffff 0 55%,#b42318 55% 100%)",
  "er-night": "linear-gradient(135deg,#161b22 0 55%,#b42318 55% 100%)",
};

function Swatch({ id, size = 18 }: { id: ThemeId; size?: number }) {
  return <span aria-hidden className="inline-block shrink-0 rounded-full border border-line" style={{ width: size, height: size, background: DOT[id] }} />;
}

/** Three big side-by-side theme buttons. */
export function ThemeSegmented({ onPick }: { onPick?: () => void }) {
  const current = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
      {(Object.keys(THEMES) as ThemeId[]).map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={current === id}
          onClick={() => { setTheme(id); onPick?.(); }}
          className={cx("focus-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-ctl px-2 py-2 text-[14px] font-semibold", current === id ? "pressed text-accent" : "raised-sm")}
        >
          <Swatch id={id} size={22} />
          {THEMES[id].label}
        </button>
      ))}
    </div>
  );
}

/** Labelled header button showing the current theme; opens a quick switcher in place. */
export function ThemeHeaderButton() {
  const current = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Theme: ${THEMES[current].label}. Change theme`}
        className="focus-ring raised-sm flex h-9 shrink-0 items-center gap-1.5 rounded-full pl-2 pr-3 text-[13px] font-semibold"
      >
        <Swatch id={current} />
        <span className="whitespace-nowrap"><span className="hidden text-ink-muted min-[360px]:inline">Theme: </span>{THEMES[current].label}</span>
        <svg aria-hidden viewBox="0 0 20 20" className={cx("h-4 w-4 transition-transform", open && "rotate-180")} fill="currentColor"><path d="M5 8l5 5 5-5z" /></svg>
      </button>
      {open && (
        <div role="dialog" aria-label="Choose theme" className="raised absolute right-0 top-11 z-30 w-[min(20rem,calc(100vw-2rem))] space-y-3 rounded-card p-3">
          <p className="text-[14px] font-semibold">Choose a look</p>
          <ThemeSegmented onPick={() => setOpen(false)} />
          <p className="text-[12px] text-ink-muted">Only the look changes — rules, scores and alerts are the same.</p>
        </div>
      )}
    </div>
  );
}
