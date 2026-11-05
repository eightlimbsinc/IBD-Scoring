import { describe, expect, it } from "vitest";
import { FORM_NAME, formFields } from "@/features/feedback/store";
import { readFileSync } from "node:fs";

describe("Netlify Forms payload", () => {
  const note = { id: "1", target: "score:sccai", label: "Score — SCCAI", text: "Night 0 should be 0", at: "2026-11-05T10:00:00Z", caseTitle: "Mild UC" };
  const fields = formFields(note, "Dr Test", "0.1.0-draft");

  it("sends only the comment and its context", () => {
    expect(fields).toEqual({
      "form-name": FORM_NAME, reviewer: "Dr Test", about: "Score — SCCAI", target: "score:sccai",
      comment: "Night 0 should be 0", "demo-case": "Mild UC", "written-at": "2026-11-05T10:00:00Z", "spec-version": "0.1.0-draft",
    });
  });

  it("every field exists in the static form Netlify detects", () => {
    const html = readFileSync("public/__forms.html", "utf8");
    expect(html).toContain(`name="${FORM_NAME}"`);
    expect(html).toContain('data-netlify="true"');
    for (const k of Object.keys(fields).filter((k) => k !== "form-name")) expect(html, k).toContain(`name="${k}"`);
  });
});
