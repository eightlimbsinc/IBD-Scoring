# Clinical Safety

**Status:** v0.1 (2026-11-05). Living document. Update it whenever a safety-relevant behaviour changes.

## Intended use
Decision support for **nurses and interns** in the emergency department assessing patients with known or suspected IBD. It structures data entry, calculates published disease-activity scores and highlights guideline-based danger signs. Physicians review the output.

## Not intended for
- Triage category assignment (ESI or local equivalent).
- Recommending admission, discharge, surgery, medication changes or withholding treatment.
- Use as the only safety net: the app supplements the hospital's own triage process.

Every screen and report states: *"Clinical decision-support output only. This report does not replace clinical assessment, institutional emergency triage protocols, or the judgment of the treating physician."*

## Safety controls in the design

| Hazard | Control |
| --- | --- |
| Wrong formula or threshold | Specs written from cited sources; each score carries `specStatus`; nothing is shown as approved until the GI signs `GI-REVIEW-CHECKLIST.md`; unit tests for every option and boundary |
| App used before sign-off | Permanent "Not approved for clinical use" banner. Review screen says warnings are **not active** and that the user should follow the usual triage process |
| Missing data read as normal | Every field starts as "not answered"; blank, Unknown and Not assessed are kept separate; labs carry status (not ordered / pending / not available / resulted); a score with a missing item shows as **incomplete** with the missing items listed |
| Low score hides an emergency | Emergency warnings are evaluated separately and always take precedence over disease-activity results (spec §4.1) |
| Unit slip (e.g. Hb g/L entered as g/dL) | Unit chosen per lab; plausibility check in canonical units flags the entry |
| Different scores mixed up | No combined score; trends (v2) only within the same score |
| Nurse unsure of an exam finding | "Not assessed" option; examiner role recorded; physician-only items (PGA, endoscopy) |
| Warning noticed but not acted on | Escalation line under every emergency warning: "Inform the responsible doctor now, per local protocol." |
| Data loss mistaken for saving | Nothing is stored; UI says so; leaving the page asks for confirmation; no "saved" messages anywhere |
| Patient data left on a shared phone | No localStorage, IndexedDB, cookies or service-worker caching of patient data; closing the app erases the assessment |
| Imprecise reading under pressure | Navy text ≥ 7:1 contrast; ≥ 16 px inputs; ≥ 48 px touch targets; status shown by colour **plus** icon and text |
| AI error | No AI or LLM in any calculation; all scoring is deterministic TypeScript |

## Evidence categories
A published score · B guideline criteria · C research model · D local protocol · E experimental. Each result shows its category. Categories C and E never trigger warnings.

## Before clinical use
1. GI signs `GI-REVIEW-CHECKLIST.md`, and each score's `specStatus` is set to `approved`.
2. All unit tests and the ≥ 10 synthetic scenarios pass; reference cases are calculated independently.
3. A pilot with synthetic cases, run by nurses and interns, with the GI present.
4. Institutional approval (ED and GI leads; data-privacy officer before any v2 data storage, Data Privacy Act of 2012).
