"use client";

import { useSyncExternalStore } from "react";

/**
 * Reviewer feedback notes. Stored in localStorage on purpose (it is not patient data),
 * so notes survive closing the app. The UI tells reviewers not to type patient details here.
 */
export interface FeedbackNote {
  id: string;
  target: string; // e.g. "score:sccai", "warning:W-ASUC", "general"
  label: string;
  text: string;
  at: string;
  caseTitle?: string;
}

const KEY = "ibd-review-feedback-v1";
const NAME_KEY = "ibd-review-name-v1";
const listeners = new Set<() => void>();
let cache: FeedbackNote[] | null = null;

function read(): FeedbackNote[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    cache = [];
  }
  return cache!;
}

function write(notes: FeedbackNote[]) {
  cache = notes;
  try {
    localStorage.setItem(KEY, JSON.stringify(notes));
  } catch {
    /* storage unavailable: notes live for this session only */
  }
  listeners.forEach((l) => l());
}

const EMPTY: FeedbackNote[] = [];
export function useFeedback() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    read,
    () => EMPTY,
  );
}

export function saveNote(n: Omit<FeedbackNote, "id" | "at">) {
  write([...read(), { ...n, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: new Date().toISOString() }]);
}

export function deleteNote(id: string) {
  write(read().filter((n) => n.id !== id));
}

export function clearNotes() {
  write([]);
}

export function getReviewerName(): string {
  try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; }
}
export function setReviewerName(v: string) {
  try { localStorage.setItem(NAME_KEY, v); } catch { /* ignore */ }
}

export function feedbackText(notes: FeedbackNote[], reviewer: string, version: string): string {
  const lines = [`IBD Assessment app — reviewer feedback`, `Reviewer: ${reviewer || "(not given)"}`, `App spec: ${version}`, `Exported: ${new Date().toLocaleString()}`, ""];
  const groups = new Map<string, FeedbackNote[]>();
  for (const n of notes) groups.set(n.label, [...(groups.get(n.label) ?? []), n]);
  for (const [label, ns] of groups) {
    lines.push(`■ ${label}`);
    for (const n of ns) lines.push(`  - ${n.text}${n.caseTitle ? `  [demo case: ${n.caseTitle}]` : ""}`);
    lines.push("");
  }
  return lines.join("\n");
}
