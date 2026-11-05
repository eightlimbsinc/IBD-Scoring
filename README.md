# IBD Emergency Triage & Clinical Scoring

Mobile-first PWA to help ED nurses and interns assess patients with inflammatory bowel disease: structured data entry, published disease-activity scores, and guideline-based emergency warnings.

> **Clinical decision-support output only.** This tool does not replace clinical assessment, institutional emergency triage protocols, or the judgment of the treating physician. Not approved for clinical use: all scoring specifications are pending gastroenterologist review.

## Status
Phase 1 (research and specification) — no application code yet.

- [`docs/IBD-CLINICAL-RESEARCH.md`](docs/IBD-CLINICAL-RESEARCH.md) — scoring systems, emergency criteria, references, open questions.
- [`docs/IBD-SCORING-SPECIFICATIONS.md`](docs/IBD-SCORING-SPECIFICATIONS.md) — exact calculation and warning-rule specs, with the sign-off table.
- [`docs/ARCHITECTURE-PROPOSAL.md`](docs/ARCHITECTURE-PROPOSAL.md) — v1 architecture (no stored patient data, soft-UI design).

## v1 principles
- No patient data stored anywhere (no backend, no browser storage).
- Deterministic TypeScript scoring; no AI in calculations.
- Missing data is never treated as normal.
- No ESI level, no admission/discharge/treatment recommendations.
