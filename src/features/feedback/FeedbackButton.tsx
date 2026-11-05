"use client";

import { useState } from "react";
import { saveNote, useFeedback } from "./store";
import { useAssessment } from "@/features/assessment/AssessmentProvider";

/** Small "Comment" control for reviewers, attached to a score, warning or screen. */
export function FeedbackButton({ target, label }: { target: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const notes = useFeedback().filter((n) => n.target === target);
  const { demoTitle } = useAssessment();

  return (
    <div className="no-print">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="focus-ring rounded-chip px-2 py-1 text-[14px] font-semibold text-accent underline underline-offset-4">
          💬 Comment{notes.length ? ` (${notes.length})` : ""}
        </button>
      ) : (
        <div className="well mt-2 space-y-2 rounded-ctl p-3">
          <label className="block text-[14px] font-semibold" htmlFor={`fb-${target}`}>Feedback on: {label}</label>
          <textarea
            id={`fb-${target}`}
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. threshold should be…, wording unclear…, missing item…"
            className="focus-ring w-full rounded-chip border border-line bg-field p-3 text-[16px]"
          />
          <p className="text-[13px] text-ink-muted">Don&apos;t include patient names or details.</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!text.trim()}
              onClick={() => { saveNote({ target, label, text: text.trim(), caseTitle: demoTitle ?? undefined }); setText(""); setOpen(false); }}
              className="focus-ring min-h-11 flex-1 rounded-chip bg-accent px-4 font-semibold text-white disabled:opacity-50"
            >
              Save comment
            </button>
            <button type="button" onClick={() => setOpen(false)} className="focus-ring raised-sm min-h-11 rounded-chip px-4 font-semibold">Cancel</button>
          </div>
          {notes.length > 0 && (
            <ul className="space-y-1 text-[14px] text-ink-muted">
              {notes.map((n) => <li key={n.id}>• {n.text}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
