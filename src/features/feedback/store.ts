"use client";

import { useSyncExternalStore } from "react";
import { SPEC_VERSION } from "@/clinical/spec/version";

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
  /** "sent" once Netlify Forms accepted it; missing/"pending" until then. */
  status?: "sent" | "pending";
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

export function saveNote(n: Omit<FeedbackNote, "id" | "at" | "status">) {
  write([...read(), { ...n, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: new Date().toISOString(), status: "pending" }]);
  void sendPending();
}

/* ---------- Netlify Forms delivery ---------- */

/** Must match the hidden form in public/__forms.html (Netlify detects forms from static HTML at deploy time). */
export const FORM_NAME = "reviewer-feedback";
const FORM_ENDPOINT = "/__forms.html";
let sending = false;

/** Fields sent for one note. Only the comment and its context — never patient identifiers. */
export function formFields(n: FeedbackNote, reviewer: string, specVersion: string, theme = ""): Record<string, string> {
  return {
    "form-name": FORM_NAME,
    reviewer: reviewer || "(not given)",
    about: n.label,
    target: n.target,
    comment: n.text,
    "demo-case": n.caseTitle ?? "",
    "written-at": n.at,
    "spec-version": specVersion,
    theme,
  };
}

/** Sends every unsent note. Safe to call often: one run at a time; failures stay pending and retry later. */
export async function sendPending(specVersion = SPEC_VERSION): Promise<{ sent: number; failed: number }> {
  if (sending || typeof navigator === "undefined" || !navigator.onLine) return { sent: 0, failed: 0 };
  sending = true;
  let sent = 0;
  let failed = 0;
  try {
    for (const n of read().filter((x) => x.status !== "sent")) {
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(formFields(n, getReviewerName(), specVersion, document.documentElement.dataset.theme || "soft")).toString(),
        });
        if (!res.ok) throw new Error(String(res.status));
        write(read().map((x) => (x.id === n.id ? { ...x, status: "sent" } : x)));
        sent++;
      } catch {
        failed++;
      }
    }
  } finally {
    sending = false;
  }
  return { sent, failed };
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
  for (const [label, ns] of Array.from(groups)) {
    lines.push(`■ ${label}`);
    for (const n of ns) lines.push(`  - ${n.text}${n.caseTitle ? `  [demo case: ${n.caseTitle}]` : ""}`);
    lines.push("");
  }
  return lines.join("\n");
}
