# Architecture Proposal (v1) — for review before any clinical code

**Date:** 2026-11-05 · **Status:** Proposal

## 1. Decisions from the product owner
- **No patient data is stored in v1.** No Supabase yet. Everything lives in the browser tab's memory and is gone on reload/close.
- **UI style: neumorphism (soft UI)**, adapted for clinical legibility (see §5).
- **Primary users: nurses and interns** in the ED triaging IBD patients. Physicians review the output.

## 2. What changes from the original brief because of this

| Brief item | v1 decision |
| --- | --- |
| Supabase auth, RLS, roles, audit log, tables | **Deferred.** Documented later in `DATABASE-SCHEMA.md` as the v2 design. No login in v1. |
| Patients / Assessment History / trend charts (Recharts) | **Hidden in v1** (nothing to show without storage). Navigation: Dashboard (current assessment), New Assessment, Clinical Reference, Settings. |
| "Do not report as saved unless server confirms" | Nothing is ever "saved". UI says "Not stored — export or print before closing". Leaving the page with an open assessment shows a confirm dialog. |
| Offline caching | Service worker caches **only the static app shell and reference content**. No patient data in Cache Storage, localStorage or IndexedDB. |
| Export / share | Print, Save as PDF (browser print), JSON download. The user is warned the file contains patient identifiers. "Share via authorised workflow" deferred to v2. |
| Patient name | Optional and off by default; MRN or an anonymous case code recommended. |

## 3. Stack
- **Next.js (App Router) + React + TypeScript**, `output: "export"` (fully static) → deployed on **Netlify** as static files. No server code, no secrets, no environment variables in v1.
- **Tailwind CSS** with design tokens for the soft-UI system.
- **React Hook Form + Zod** for the step forms; the same Zod schemas validate engine inputs.
- **Vitest** for unit tests (scoring, rules, conversions); **Playwright** for end-to-end flows on an iPhone viewport.
- **PWA:** `manifest.webmanifest`, Apple touch icons, `apple-mobile-web-app-capable`, `display: standalone`, safe-area insets, hand-written service worker (cache-first for hashed static assets only), online/offline indicator.

## 4. Module layout

```
src/
  clinical/                 # pure TS, no React, no browser APIs — independently testable
    spec/                   # spec version, per-score specStatus, thresholds config (category D values)
    units/                  # conversions + plausibility ranges
    scores/                 # one file per score: tw.ts, sccai.ts, mayo.ts, lichtiger.ts, pro2.ts, pucai.ts, hbi.ts, pdai.ts
    rules/                  # emergency warning rules W-*, qSOFA/SIRS, missing-investigation list
    summary/                # precedence logic (spec §4.1) — never sums scores
    types.ts                # Assessment, LabValue, ScoreResult, Warning
  features/
    assessment/             # step forms (patient, presentation, vitals, labs), RHF + Zod
    summary/                # ER triage dashboard
    report/                 # printable report
    reference/              # Clinical Reference screens (rendered from spec data)
  ui/                       # soft-UI component library (Card, Field, Segmented Yes/No/Unknown, Stepper, Badge)
  app/                      # Next.js routes
tests/
  clinical/                 # unit tests per score/rule; synthetic scenarios (≥ 10)
  e2e/                      # Playwright
```

Rules of the architecture:
- `clinical/` has **no dependency** on UI code; UI calls `assess(assessment, ctx)` and renders the returned results.
- Thresholds of category D (local protocol) live in one config file, shown in Settings as read-only with their source, so a hospital can change them through code review only.
- Every score file exports `meta` (name, category, references, specStatus) used by both the report and Clinical Reference — one source of truth.
- Scores with `specStatus !== "approved"` render with a "Not yet approved for clinical use" banner. A build flag `CLINICAL_MODE` refuses to build if any shipped score is unapproved.

## 5. Neumorphism for a clinical tool
Classic neumorphism has very low contrast (controls barely distinguished from the background), which fails accessibility and is risky when nurses are reading under pressure. Proposal — **"soft clinical"**:
- Light cool-grey base (≈ `#E8EDF3`), raised cards with paired light/dark soft shadows; pressed/selected state = inset shadow.
- **Text navy (≈ `#0B2545`) with ≥ 7:1 contrast**; field labels ≥ 16 px; values large.
- Inputs and buttons keep a **visible 1 px border and a strong focus ring** — shadows are decoration, not the only cue.
- **Status colours are solid, not soft:** emergency = red chip with icon + text; severe = orange; moderate = amber; lower = teal/green; incomplete = grey-striped. Never colour alone.
- Yes / No / Unknown as large segmented pills (≥ 44 px touch targets); "Unknown" is visually distinct, never pre-selected.
- No animation beyond 150 ms state transitions; respects `prefers-reduced-motion`.
- Light mode first; dark mode optional later (neumorphism is weak in dark mode).

## 6. Design for nurses and interns
- Plain-language labels with the scoring term underneath (e.g. "How many stools in the last 24 h?" / *SCCAI day frequency*).
- Inline "what does this mean?" definitions for each answer (e.g. what "definite and tender mass" means).
- Items that need physician judgement or procedures — **Mayo physician global assessment, endoscopic subscores, abdominal mass, PDAI exam items** — are marked "clinician examination" and can be left "Not assessed"; the score then shows as incomplete rather than guessed. **Question for GI:** should nurses enter these at all?
- Emergency warnings are written as facts ("Meets criteria for acute severe UC", "Possible bowel obstruction"). **Decided 2026-11-05:** each emergency warning is followed by "Inform the responsible doctor now, per local protocol." (configurable; wording pending GI sign-off).
- **Decided 2026-11-05:** nurses and interns enter bedside exam findings (they drive warnings), with "Not assessed" available and the examiner's role recorded. The Mayo PGA and endoscopy subscores are physician-only.
- **Reviewer:** the product owner's gastroenterologist signs off via `GI-REVIEW-CHECKLIST.md`.

## 7. Build order (after this review)
1. Clinical safety doc + design tokens / soft-UI components.
2. Assessment step forms (no scoring yet).
3. Scoring engines + unit tests (once you've reviewed the spec).
4. Emergency rules + summary dashboard.
5. Report (print/PDF/JSON).
6. PWA + Netlify deploy.
7. Tests + `TESTING.md`; synthetic scenarios.
8. v2 (separate approval): Supabase, roles, history, trends, Data Privacy Act 2012 assessment.
