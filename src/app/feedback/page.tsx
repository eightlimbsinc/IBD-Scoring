"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearNotes, deleteNote, feedbackText, getReviewerName, saveNote, setReviewerName, useFeedback } from "@/features/feedback/store";
import { SPEC_VERSION } from "@/clinical/spec/version";
import { Banner, Button, Card, Field, TextArea, TextInput } from "@/ui/primitives";

export default function FeedbackPage() {
  const notes = useFeedback();
  const [name, setName] = useState("");
  const [general, setGeneral] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setName(getReviewerName()), []);

  const text = feedbackText(notes, name, SPEC_VERSION);
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "IBD app feedback", text }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight">Reviewer feedback</h1>
      <Banner tone="info" title="How to review">
        Load a demo case from Home (or enter your own made-up case) and look through the triage summary. Tap <strong>💬 Comment</strong> on any score or warning to note what should change. When finished, tap <strong>Send feedback</strong>. Comments stay on this phone until you clear them. Please don&apos;t include real patient details.
      </Banner>

      <Card title="Your name">
        <TextInput aria-label="Reviewer name" value={name} onChange={(e) => { setName(e.target.value); setReviewerName(e.target.value); }} placeholder="Dr …" />
      </Card>

      <Card title="General comments" subtitle="Anything about the workflow, wording, missing items, thresholds…">
        <Field label="Comment" htmlFor="gen">
          <TextArea id="gen" rows={4} value={general} onChange={(e) => setGeneral(e.target.value)} />
        </Field>
        <Button type="button" disabled={!general.trim()} onClick={() => { saveNote({ target: "general", label: "General", text: general.trim() }); setGeneral(""); }}>
          Add comment
        </Button>
      </Card>

      <Card title={`Comments (${notes.length})`}>
        {notes.length === 0 ? <p className="text-ink-muted">No comments yet.</p> : (
          <ul className="space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="raised-sm rounded-2xl p-3">
                <p className="text-[13px] font-semibold text-ink-muted">{n.label}{n.caseTitle ? ` · ${n.caseTitle}` : ""}</p>
                <p className="mt-1">{n.text}</p>
                <button type="button" onClick={() => deleteNote(n.id)} className="focus-ring mt-1 text-[14px] font-semibold text-emergency underline">Delete</button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="primary" disabled={!notes.length} onClick={share}>Send feedback</Button>
          <Button type="button" disabled={!notes.length} onClick={() => { if (confirm("Delete all comments on this phone?")) clearNotes(); }}>Clear all</Button>
        </div>
        {copied && <p className="text-[14px] font-semibold text-lower">Copied — paste it into a message or email.</p>}
      </Card>

      <p className="text-[14px]"><Link href="/settings/" className="font-semibold text-accent underline">Settings and local protocol values</Link></p>
    </div>
  );
}
