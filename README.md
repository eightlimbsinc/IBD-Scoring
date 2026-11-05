# IBD Emergency Triage & Clinical Scoring

Mobile-first PWA to help ED nurses and interns assess patients with inflammatory bowel disease: structured data entry, published disease-activity scores, and guideline-based emergency warnings.

> **Clinical decision-support output only.** This tool does not replace clinical assessment, institutional emergency triage protocols, or the judgment of the treating physician. Not approved for clinical use: all scoring specifications are pending gastroenterologist review.

## Status
- Phase 1 — research and specification: done, awaiting GI sign-off (`docs/GI-REVIEW-CHECKLIST.md`).
- Phase 2 — app shell, soft-UI design system, assessment form: done.
- Phase 3 — draft scoring, emergency warnings, triage summary, printable report, reviewer feedback, 11 demo cases, home-screen install with offline mode: done. **Draft for clinical review — not for patient care.**

Live: https://ibd-scoring.netlify.app/ · Reviewer instructions: [`docs/REVIEWER-GUIDE.md`](docs/REVIEWER-GUIDE.md)

## Run locally
```bash
npm install
```
```bash
npm run dev
```
```bash
npm test
```
`npm run build` produces a static site in `out/` (deployed on Netlify via `netlify.toml`). No environment variables or secrets are needed in v1.

- [`docs/IBD-CLINICAL-RESEARCH.md`](docs/IBD-CLINICAL-RESEARCH.md) — scoring systems, emergency criteria, references, open questions.
- [`docs/IBD-SCORING-SPECIFICATIONS.md`](docs/IBD-SCORING-SPECIFICATIONS.md) — exact calculation and warning-rule specs, with the sign-off table.
- [`docs/GI-REVIEW-CHECKLIST.md`](docs/GI-REVIEW-CHECKLIST.md) — decisions for the gastroenterologist, with proposed defaults.
- [`docs/TESTING.md`](docs/TESTING.md) — tests and hand-calculated scenarios.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Netlify setup.
- [`docs/CLINICAL-SAFETY.md`](docs/CLINICAL-SAFETY.md) — intended use, hazards and controls.
- [`docs/ARCHITECTURE-PROPOSAL.md`](docs/ARCHITECTURE-PROPOSAL.md) — v1 architecture (no stored patient data, soft-UI design).

## v1 principles
- No patient data stored anywhere (no backend, no browser storage).
- Deterministic TypeScript scoring; no AI in calculations.
- Missing data is never treated as normal.
- No ESI level, no admission/discharge/treatment recommendations.
