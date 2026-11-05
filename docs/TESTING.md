# Testing

Run with `npm test` (Vitest). Status on 2026-11-05: **160 tests passing**, 5 files.

| File | What it covers |
| --- | --- |
| `tests/clinical/units.test.ts` | Unit conversions (Hb g/L↔g/dL, CRP mg/dL↔mg/L, creatinine µmol/L↔mg/dL, lactate, bilirubin, WBC, °F, lb, in), plausibility catching unit slips, BMI, MAP |
| `tests/clinical/assessment-schema.test.ts` | Validation: required fields, implausible vitals, DBP ≥ SBP, °F/°C, bloody > total stools, lab status vs value, C. difficile result, pathway by age |
| `tests/clinical/scores.test.ts` | Each score: minimum, maximum, every response option, band boundaries, missing/unknown items → incomplete, unit conversion inside T&W, pending labs not treated as normal |
| `tests/clinical/pdf-text.test.ts` | PDF text: superscript units stay unambiguous (×10^9/L), ≥/≤ replaced |
| `tests/clinical/scenarios.test.ts` | 11 synthetic patients end to end (scores, warnings, missing investigations, summary level), plus determinism |

## Synthetic scenarios — hand-calculated reference results

All patients are made up (`src/clinical/demo-cases.ts`). Expected values were calculated by hand from the spec, then checked by the tests.

| # | Scenario | Key inputs | Expected scores | Expected warnings | Summary |
| --- | --- | --- | --- | --- | --- |
| 1 | Mild UC | 4 stools (1 bloody), usual 2, HR 78 | SCCAI 4 · pMayo 3 · Lichtiger 5 · PRO2 2 · T&W not severe | none | No emergency warning (no band) |
| 2 | Moderate UC | 7 stools (4 bloody), nocturnal, C. diff pending | SCCAI 8 · pMayo 7 · Lichtiger 12 · PRO2 5 | none; missing: C. diff (pending), stool culture (not ordered) | No band |
| 3 | Acute severe UC | 8 bloody stools, HR 108, T 38.0, Hb 10.1, ESR 42, CRP 86, K 3.3, steroids | SCCAI 11 · Lichtiger 16 · pMayo 9 | W-ASUC; W-TACHY; W-HYPOKALAEMIA; I-MASKING; SIRS 2 (no fever → no sepsis flag) | Emergency |
| 4 | Crohn's flare | 6 liquid stools, wb poor, moderate pain, dubious mass, arthralgia, anti-TNF | HBI 2+2+6+1+1 = 12 (moderate) | I-MASKING | Moderate |
| 5 | Crohn's + obstruction | Vomiting, distension, no stool/gas, HR 104, K 3.4 | HBI 3+3+0+0+0 = 6 (mild) | W-OBSTRUCTION; W-TACHY; W-HYPOKALAEMIA | **Emergency despite mild HBI** |
| 6 | Toxic megacolon | Dilated colon on imaging, T 38.9, HR 128, WBC 15.8, Hb 9.2 (M), Na 131, dehydration, RR 24, SBP 92, lactate 2.6 | — | W-TOXIC-MEGACOLON (met: 4 systemic + dehydration/electrolytes); W-ASUC; W-SEPSIS (qSOFA 2, SIRS 4, lactate); W-TACHY-MARKED; W-BLEEDING (shock index 1.39); W-DEHYDRATION | Emergency |
| 7 | GI bleeding | 9 bloody stools, SBP 86/52, HR 118, Hb 68 g/L, RR 22, lactate 3.1 | pMayo 9; SCCAI incomplete | W-BLEEDING (SBP, SI 1.37, Hb 6.8); W-HYPOTENSION (SBP, MAP 63); W-ASUC; W-SEPSIS (qSOFA 2, lactate) | Emergency |
| 8 | Dehydration (CD) | 12 liquid stools, vomiting, low urine, HR 112, Na 131, K 3.1 | HBI 2+1+12 = 15 (moderate) | W-DEHYDRATION; W-TACHY; W-HYPOKALAEMIA | Moderate |
| 9 | Suspected infection | T 38.7, HR 104, RR 21, WBC 14.2, C. diff positive, azathioprine | T&W not severe (3 bloody) | W-SEPSIS (SIRS 4 with fever); W-CDIFF; W-TACHY; I-MASKING | Emergency |
| 10 | Incomplete labs | 6 bloody stools, HR 86, T 37.5, Hb/ESR/CRP pending | T&W incomplete (missing Hb, ESR, CRP) | none | Incomplete; 10 missing investigations |
| 11 | Pediatric ASC (14 y) | PUCAI items 10+20+10+10+10+10 | PUCAI 70 (severe) | W-PED-ASC; adult vital thresholds not applied | Emergency |

## Manual checks (iPhone 14 viewport, Playwright)
- All screens render; no console errors.
- Demo case → triage summary → report → feedback.
- Offline: after one online visit, the app reloads offline, loads a demo case and shows all screens; status chip reads "Offline".
- PDF (Android Pixel 7 profile, offline): Save / share PDF downloads a 6-page A4 report; text checked with pdftotext.

## Not yet covered
- Automated UI/E2E tests in CI (manual Playwright script only).
- Auth, roles, database: not applicable in v1 (no backend).
- Gastroenterologist sign-off of reference cases.
