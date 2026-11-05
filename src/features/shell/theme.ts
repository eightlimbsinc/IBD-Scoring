"use client";

import { useSyncExternalStore } from "react";

export const THEMES = {
  soft: { label: "Soft", description: "Soft neumorphic look (original).", themeColor: "#e6ebf1" },
  er: { label: "ER", description: "Flat and high-contrast, like ER tracking boards and bedside calculators. Emergencies shown in solid red.", themeColor: "#eef1f5" },
  "er-night": { label: "ER Night", description: "Dark version of ER for night shifts and dim rooms.", themeColor: "#0d1117" },
} as const;
export type ThemeId = keyof typeof THEMES;

const KEY = "ibd-theme-v1";
const listeners = new Set<() => void>();

export function getTheme(): ThemeId {
  if (typeof document === "undefined") return "soft";
  const t = document.documentElement.dataset.theme as ThemeId | undefined;
  return t && t in THEMES ? t : "soft";
}

export function setTheme(t: ThemeId) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEMES[t].themeColor);
  try { localStorage.setItem(KEY, t); } catch { /* preference not kept */ }
  listeners.forEach((l) => l());
}

export function useTheme(): ThemeId {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, getTheme, () => "soft");
}

/** Runs before first paint (inline in <head>) so the saved theme shows without a flash. */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("${KEY}");if(t==="er"||t==="er-night"){document.documentElement.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="er"?"#eef1f5":"#0d1117")}}catch(e){}`;
