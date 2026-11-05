"use client";

import { THEMES, setTheme, useTheme, type ThemeId } from "./theme";
import { cx } from "@/ui/primitives";

const SWATCH: Record<ThemeId, { bg: string; card: string; ink: string; alert: string; alertInk: string; border: string; shadow: string; radius: string }> = {
  soft: { bg: "#e6ebf1", card: "#e6ebf1", ink: "#0b2545", alert: "#fde8e6", alertInk: "#b42318", border: "rgba(255,255,255,.6)", shadow: "4px 4px 9px #bec8d4,-4px -4px 9px #fff", radius: "14px" },
  er: { bg: "#eef1f5", card: "#ffffff", ink: "#0b1f33", alert: "#b42318", alertInk: "#ffffff", border: "#b9c3d0", shadow: "none", radius: "6px" },
  "er-night": { bg: "#0d1117", card: "#161b22", ink: "#e6edf3", alert: "#b42318", alertInk: "#ffffff", border: "#3b4552", shadow: "none", radius: "6px" },
};

export function ThemePicker() {
  const current = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-1 gap-3">
      {(Object.keys(THEMES) as ThemeId[]).map((id) => {
        const sw = SWATCH[id];
        const active = id === current;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(id)}
            className={cx("focus-ring flex items-center gap-4 rounded-ctl p-3 text-left", active ? "pressed" : "raised-sm")}
          >
            <span aria-hidden className="flex h-16 w-20 shrink-0 flex-col justify-center gap-1.5 p-2" style={{ background: sw.bg, borderRadius: sw.radius, border: `1px solid ${sw.border}` }}>
              <span className="block h-4 w-full text-[8px] font-bold leading-4" style={{ background: sw.alert, color: sw.alertInk, borderRadius: 3, paddingLeft: 4 }}>ALERT</span>
              <span className="block h-6 w-full" style={{ background: sw.card, boxShadow: sw.shadow, border: `1px solid ${sw.border}`, borderRadius: sw.radius }} />
            </span>
            <span>
              <span className="flex items-center gap-2 text-[17px] font-semibold">{THEMES[id].label}{active && <span className="text-[13px] font-semibold text-accent">· in use</span>}</span>
              <span className="block text-[14px] text-ink-muted">{THEMES[id].description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
