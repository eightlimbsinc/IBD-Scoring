# IBD Scoring Specifications

**Spec version:** `0.1.0-draft` (2026-11-05)
**Status:** Pending gastroenterologist review. **No calculation may be used for patient care until each item below is marked `approved` with reviewer name and date.**
**Evidence:** see `IBD-CLINICAL-RESEARCH.md` (section numbers referenced as R§).

---

## 1. Engine-wide rules

1. **Deterministic, pure TypeScript functions.** No AI/LLM, no network, no randomness, no clock inside the calculation (timestamp is passed in).
2. **Signature:** `calculateX(input: XInput, ctx: { now: string; specVersion: string }): ScoreResult`.
3. **Missing data:** every input field is `value | "unknown" | "not_assessed"` (and for labs, a `LabValue` with status). A missing required item **never** defaults to 0 or normal.
   - If any required item is missing → `status: "incomplete"`, `total: null`, list `missing[]`. A "minimum possible / maximum possible" range may be shown (`partialRange`) but is **never** interpreted.
   - Scores with "not applicable" preconditions (e.g. no endoscopy for full Mayo) → `status: "not_applicable"` with reason.
4. **Validation:** inputs validated with Zod before calculation. Out-of-range values → `status: "invalid"` with field errors; no score.
5. **Interpretation** is only attached when the score's spec status is `approved`. While `pending_gi_review`, the engine returns the interpretation with `interpretationStatus: "unapproved"` and the UI shows a banner.
6. **Every result includes:** `scoreId`, `scoreName`, `specVersion`, `specStatus`, `category` (A–E), `calculatedAt`, `total`, `range`, `components[]` (item, raw answer, points, rule text), `interpretation`, `missing[]`, `references[]`.
7. **No combined scores.** No function adds results of different scores.
8. **Pathway gating:** adult scores reject `pathway: "pediatric"` and vice versa (`status: "not_applicable"`).

### 1.1 Result type

```ts
type SpecStatus = "pending_gi_review" | "approved" | "not_implemented";
type ScoreStatus = "complete" | "incomplete" | "not_applicable" | "invalid";

interface ScoreComponent {
  itemId: string;
  label: string;
  answer: string | number | null;   // what the clinician entered
  points: number | null;            // null if missing
  rule: string;                     // e.g. "7–9 stools/day → 2"
}

interface ScoreResult {
  scoreId: string;
  scoreName: string;
  category: "A" | "B" | "C" | "D" | "E";
  specVersion: string;
  specStatus: SpecStatus;
  status: ScoreStatus;
  total: number | null;
  range: { min: number; max: number | null };
  components: ScoreComponent[];
  interpretation: { label: string; band: "remission" | "mild" | "moderate" | "severe" | "other"; rule: string } | null;
  interpretationStatus: "approved" | "unapproved" | "none";
  missing: string[];
  calculatedAt: string;             // ISO 8601, supplied by caller
  references: { citation: string; doi?: string }[];
}
```

---

## 2. Units and conversions

Internal canonical units (all calculations use these):

| Analyte | Canonical | Accepted input units | Conversion to canonical |
| --- | --- | --- | --- |
| Haemoglobin | g/dL | g/dL, g/L | g/L ÷ 10 |
| Haematocrit | % | %, L/L | L/L × 100 |
| WBC | ×10⁹/L | ×10⁹/L, ×10³/µL, /mm³ | ×10³/µL × 1; /mm³ ÷ 1000 |
| Platelets | ×10⁹/L | ×10⁹/L, ×10³/µL | × 1 |
| CRP | mg/L | mg/L, mg/dL | mg/dL × 10 |
| ESR | mm/h | mm/h | — |
| Albumin | g/dL | g/dL, g/L | g/L ÷ 10 |
| Sodium, Potassium | mmol/L | mmol/L, mEq/L | × 1 |
| Creatinine | mg/dL | mg/dL, µmol/L | µmol/L ÷ 88.42 |
| Lactate | mmol/L | mmol/L, mg/dL | mg/dL ÷ 9.008 |
| Temperature | °C | °C, °F | (°F − 32) × 5/9 |
| Weight | kg | kg, lb | lb × 0.45359237 |
| Height | cm | cm, in | in × 2.54 |
| Faecal calprotectin | µg/g | µg/g, mg/kg | × 1 |

- Conversions are applied once at entry; the original value and unit are kept for the report.
- Rounding: keep full precision internally; compare thresholds on unrounded values; display to the analyte's usual decimals.
- **Open question U-1:** confirm which units Philippine partner laboratories report (many report Hb in g/L, creatinine in µmol/L, albumin in g/L).

### 2.1 Lab status

```ts
type LabStatus = "not_ordered" | "pending" | "not_available" | "resulted";
interface LabValue { status: LabStatus; value?: number; unit?: string; flag?: "normal" | "abnormal"; resultedAt?: string }
```
Only `status: "resulted"` with a numeric value participates in any rule. `normal/abnormal` is the lab's own flag, stored for display, **never** used to fill a missing number.

### 2.2 Plausibility ranges (input validation; reject outside, warn near edges)

| Field | Reject outside | Note |
| --- | --- | --- |
| Heart rate | 20–250 bpm | |
| SBP | 40–300 mmHg | SBP must exceed DBP |
| DBP | 20–200 mmHg | |
| Temperature | 30.0–44.0 °C | |
| Respiratory rate | 4–80 /min | |
| SpO₂ | 50–100 % | |
| Weight | 1–350 kg | |
| Height | 40–250 cm | |
| Haemoglobin | 2–25 g/dL | |
| CRP | 0–600 mg/L | |
| ESR | 0–150 mm/h | |
| Albumin | 0.5–7 g/dL | |
| Stools / 24 h | 0–60 | integer |

These are data-entry sanity limits, **not clinical thresholds**. BMI = weight (kg) / height (m)², shown to 1 decimal; not used by any score.

---

## 3. Score specifications

### 3.1 `tw_severity` — Truelove & Witts (adult UC) — `pending_gi_review` — R§2.1

Inputs: `bloodyStoolsPer24h: int`, `heartRate`, `temperatureC`, `hbGdl` (LabValue), `esr` (LabValue).

Logic:
```
severeStool = bloodyStoolsPer24h >= 6
systemic = [HR > 90, Temp > 37.8, Hb < 10.5, ESR > 30]   // each: true | false | unknown
if bloodyStoolsPer24h unknown → incomplete
if !severeStool → result "Severe criteria not met" (mild/moderate by clinician, TW-1)
if severeStool and any(systemic == true) → "Meets Truelove & Witts severe criteria"
if severeStool and all(systemic == false) → "Severe criteria not met"
if severeStool and none true and some unknown → incomplete, missing = unknown systemic items
```
Output: categorical (no total). Components list each criterion with value and threshold.

### 3.2 `tw_modified` — Modified Truelove & Witts / ASUC (adult UC) — `pending_gi_review` — R§2.2

Same as 3.1 with an extra systemic criterion `CRP > 30 mg/L` (threshold configurable; TW-2). Result true → **ASUC emergency warning** (see §4, `W-ASUC`).

### 3.3 `sccai` — SCCAI (adult UC) — `pending_gi_review` — R§2.3

| Item | Input | Points |
| --- | --- | --- |
| dayFrequency | int ≥ 0 | 0–3 → 0 (*0 treated as 0; original lists 1–3*); 4–6 → 1; 7–9 → 2; ≥ 10 → 3 |
| nightFrequency | int ≥ 0 | 0 → 0 (*SC-1*); 1–3 → 1; ≥ 4 → 2 (*> 6 SC-1*) |
| urgency | enum none/hurry/immediately/incontinence | 0/1/2/3 |
| blood | enum none/trace/occasionally_frank/usually_frank | 0/1/2/3 |
| wellBeing | enum very_well/slightly_below_par/poor/very_poor/terrible | 0/1/2/3/4 |
| extracolonic | set of {arthritis, uveitis, erythema_nodosum, pyoderma_gangrenosum} | 1 each |

Total = sum. Range 0–19. Interpretation (unapproved): ≤ 2 remission; ≥ 5 active; 3–4 "intermediate (no agreed label)".

### 3.4 `mayo_full` — Full Mayo (adult UC) — `pending_gi_review` — R§2.4

Precondition: `endoscopySubscore` entered (0–3) from an endoscopy report; otherwise `not_applicable` ("requires endoscopic assessment").
Items: `stoolFrequency` 0–3, `rectalBleeding` 0–3, `endoscopy` 0–3, `pga` 0–3 (labels per R§2.4).
Stool frequency is derived when both `stoolsPer24h` and `normalStoolsPer24h` are known: excess = stools − normal; ≤ 0 → 0; 1–2 → 1; 3–4 → 2; ≥ 5 → 3. If normal is unknown, clinician may enter subscore directly; otherwise missing.
Total 0–12. Interpretation (unapproved): remission = total ≤ 2 **and** no subscore > 1. No severity bands until MY-1.

### 3.5 `mayo_partial` — Partial Mayo (adult UC) — `pending_gi_review` — R§2.5
Items: stoolFrequency, rectalBleeding, pga (as 3.4). Total 0–9. Interpretation: **none until PM-1**.

### 3.6 `lichtiger` — Lichtiger CAI (adult UC) — `pending_gi_review` — R§2.6

| Item | Points |
| --- | --- |
| stoolsPer24h | 0–2 → 0; 3–4 → 1; 5–6 → 2; 7–9 → 3; ≥ 10 → 4 |
| nocturnal | no 0 / yes 1 |
| visibleBloodPct | enum 0 / lt50 / gte50 / 100 → 0/1/2/3 |
| incontinence | no 0 / yes 1 |
| abdominalPain | none/mild/moderate/severe → 0–3 |
| wellBeing | perfect/very_good/good/average/poor/terrible → 0–5 |
| tenderness | none / mild_localised / mild_moderate_diffuse / severe_or_rebound → 0–3 |
| antidiarrhoeals | no 0 / yes 1 |

Total 0–21. Interpretation (unapproved): reference only — "< 10 = response threshold used in Lichtiger 1994 (on 2 consecutive days)". Side effect: `tenderness = severe_or_rebound` raises flag `W-PERITONISM`.

### 3.7 `pro2_uc` — UC PRO2 — `pending_gi_review` — R§2.7
Items: Mayo stoolFrequency (0–3) + rectalBleeding (0–3). Total 0–6. No interpretation (PR-1).

### 3.8 `pucai` — PUCAI (pediatric UC) — `pending_gi_review` — R§2.8

| Item | Points |
| --- | --- |
| abdominalPain: none / can_be_ignored / cannot_be_ignored | 0 / 5 / 10 |
| rectalBleeding: none / small_lt50 / small_most / large_gt50 | 0 / 10 / 20 / 30 |
| consistency: formed / partially_formed / unformed | 0 / 5 / 10 |
| stoolsPer24h (int) | 0–2 → 0; 3–5 → 5; 6–8 → 10; > 8 → 15 |
| nocturnal: no / yes | 0 / 10 |
| activity: none / occasional / severe | 0 / 5 / 10 |

Total 0–85. Interpretation (unapproved): < 10 remission; 10–34 mild; 35–64 moderate; ≥ 65 severe → raises `W-PED-ASC`.
Pathway: pediatric only (age cut-off PU-1).

### 3.9 `hbi` — Harvey-Bradshaw Index (adult CD) — `pending_gi_review` — R§3.1

| Item | Points |
| --- | --- |
| wellBeing: very_well / slightly_below_par / poor / very_poor / terrible | 0–4 |
| abdominalPain: none / mild / moderate / severe | 0–3 |
| liquidStoolsPrevDay (int ≥ 0) | 1 per stool |
| abdominalMass: none / dubious / definite / definite_tender | 0–3 |
| complications ⊆ {arthralgia, uveitis, erythema_nodosum, aphthous_ulcers, pyoderma_gangrenosum, anal_fissure, new_fistula, abscess} | 1 each |

Total ≥ 0 (no fixed max). If `hasOstomy = true` → result carries warning "HBI stool item not valid with ostomy" and interpretation withheld.
Interpretation (unapproved): < 5 remission; 5–7 mild; 8–16 moderate; > 16 severe.
Side effects: `abdominalMass = definite_tender` + fever > 38 °C → `W-ABSCESS`; complication `abscess` → `W-ABSCESS`.

### 3.10 `pdai` — PDAI (CD with perianal disease) — `pending_gi_review` — R§3.3
Five items, each 0–4 (labels per R§3.3): discharge, painActivity, sexualActivity, perianalType, induration. Each may be `not_assessed` → incomplete. Total 0–20. Interpretation (unapproved): > 4 "active perianal disease". Side effect: `induration = 4` → `W-PERIANAL-ABSCESS` (fires even if other items missing).

### 3.11 `cdai` — `not_implemented` (v1) — CD-1, CD-2
Formula documented in R§3.2. Engine stub returns `not_applicable` with reason "Requires 7-day diary; specification pending GI decision on standard weight".

### 3.12 `pro2_cd` — `pending_gi_review`
Inputs: `avgDailyLiquidStools7d` (number ≥ 0), `avgDailyPain7d` (0–3), `diaryDays` (int). Precondition: `diaryDays = 7`, otherwise `not_applicable`. Total = 2 × stools + 5 × pain. No interpretation (PR-2).

### 3.13 Not implemented in v1
`ses_cd`, `rutgeerts`, `pcdai`, `wpcdai`, `seo`, `verma_ed` → `specStatus: "not_implemented"`; shown in Clinical Reference only.

---

## 4. Emergency warning rules

Each rule: `id`, `category` (B or D), `severity` (`emergency` | `warning` | `info`), `trigger`, `sources`. Rules fire **independently of disease-activity scores**. Any `emergency` warning means the summary can never show "lower disease activity" as the headline.

| ID | Severity | Category | Trigger (all thresholds configurable, defaults shown) | Source |
| --- | --- | --- | --- | --- |
| W-ASUC | emergency | B | `tw_modified` severe criteria met (adult UC/IBD-U) | ECCO 2022, BSG 2025 |
| W-PED-ASC | emergency | B | PUCAI ≥ 65 | ECCO/ESPGHAN 2018 |
| W-TOXIC-MEGACOLON | emergency | B | imaging colon > 6 cm + ≥ 3 of [T > 38.6, HR > 120, WBC > 10.5, anaemia (Hb < local LLN)] + ≥ 1 of [dehydration, altered consciousness, electrolyte disturbance, hypotension] | Jalan 1969 |
| W-TOXIC-MEGACOLON-POSSIBLE | emergency | B/D | abdominal distension = yes + ≥ 3 systemic criteria above, imaging not available (TM-1) | Jalan 1969 (adapted) |
| W-PERITONISM | emergency | B | guarding/rigidity/rebound = yes, or Lichtiger tenderness = severe_or_rebound, or free air on imaging | WSES-AAST 2021 |
| W-OBSTRUCTION | emergency | B | cannot pass stool/gas = yes, **or** (vomiting = yes **and** distension = yes) (OB-1) | WSES-AAST 2021 |
| W-BLEEDING | emergency | D | rectal bleeding = yes **and** (SBP < 90 or HR > 100 or HR/SBP ≥ 1.0 or Hb < 7 g/dL) (BL-1) | local |
| W-SEPSIS | emergency | B | qSOFA ≥ 2, or (SIRS ≥ 2 and fever/suspected infection), or lactate ≥ 2 mmol/L (SP-1) | Sepsis-3; SSC 2021 |
| W-HYPOTENSION | emergency | D | SBP < 90 or MAP < 65 (VS-1) | local |
| W-TACHY-MARKED | emergency | D | HR > 120 | local |
| W-TACHY | warning | D | HR > 100 | local |
| W-HYPOXIA | warning | D | SpO₂ < 92% | local |
| W-DEHYDRATION | warning | D | reduced urine output = yes, or clinician dehydration signs = yes (DH-1) | local |
| W-AKI | warning | B | KDIGO creatinine criterion (needs baseline) | KDIGO 2012 |
| W-HYPOKALAEMIA | warning | D | K < 3.5 mmol/L (severe if < 3.0) | local |
| W-ABSCESS | emergency | B/D | CD + fever > 38 °C + tender mass; or HBI complication "abscess" (AB-1) | ECCO-ESGAR 2019; WSES-AAST 2021 |
| W-PERIANAL-ABSCESS | emergency | B | perianal swelling/fluctuance = yes, or PDAI induration = 4 | WSES-AAST 2021 |
| W-CDIFF | warning | B | C. difficile = positive, or other stool pathogen = positive | ECCO infections 2021 |
| I-MASKING | info | B | on corticosteroids / biologic / immunomodulator: "peritoneal signs and fever may be masked" | WSES-AAST 2021 |
| M-* | missing | B | in UC/IBD-U flare: CBC, CRP, electrolytes/creatinine, albumin, C. difficile, stool culture not resulted → listed as missing investigations (never as "normal") | ECCO 2021/2022, BSG 2025 |

qSOFA: RR ≥ 22, altered mentation, SBP ≤ 100 (count 0–3; incomplete if any unknown and count < 2).
SIRS: T > 38 or < 36; HR > 90; RR > 20; WBC > 12 or < 4 (count 0–4; same incomplete rule).
MAP = (SBP + 2 × DBP) / 3.

### 4.0 Escalation line (decided 2026-11-05)
Every `emergency` warning is followed by the configured escalation line, default **"Inform the responsible doctor now, per local protocol."** (category D, `src/clinical/spec/local-protocol.ts`; wording pending GI sign-off). It tells the user who to notify; it never recommends a treatment, admission, discharge or surgery.

### 4.0.1 Who enters exam-dependent items (decided 2026-11-05)
- Nurses and interns **may enter** bedside exam findings (tenderness, guarding/rigidity/rebound, distension, abdominal mass, perianal swelling/fluctuance, mentation), because these drive the emergency warnings. Each finding can be "Not assessed"; the "Examined by" role is recorded and printed on the report.
- **Physician-only items:** Mayo physician global assessment and endoscopic subscores (Mayo, SES-CD, Rutgeerts). Until a physician enters them, the dependent scores show as incomplete.
- PDAI exam items may be entered by any role, marked with the examiner's role.

### 4.1 Summary status precedence
1. Any `emergency` warning → **Emergency warning** (red).
2. Else any disease activity score with approved band `severe` → **Severe disease activity**.
3. Else `moderate` → **Moderate**.
4. Else `mild`/`remission` → **Lower disease activity**.
5. Required inputs missing for every applicable score, or no vitals → **Incomplete assessment** (shown alongside 1–4 when relevant).

While specs are `pending_gi_review`, bands 2–4 are labelled "unapproved".
The summary never shows ESI level, admission, discharge, surgical or treatment recommendations.

---

## 5. Test requirements per score
Minimum/maximum totals; every response option; each band boundary (e.g. PUCAI 9/10, 34/35, 64/65); missing each required item; invalid values (negative, non-integer stools, out-of-range); unit conversions (g/L ↔ g/dL, mg/dL ↔ mg/L, µmol/L ↔ mg/dL); published worked examples where the GI provides them. Reference cases must be calculated independently (by hand/spreadsheet) and recorded in `docs/TESTING.md`.

---

## 6. Sign-off

| Score / rule | Spec status | Reviewer | Date |
| --- | --- | --- | --- |
| tw_severity, tw_modified | pending_gi_review | | |
| sccai | pending_gi_review | | |
| mayo_full, mayo_partial | pending_gi_review | | |
| lichtiger | pending_gi_review | | |
| pro2_uc, pro2_cd | pending_gi_review | | |
| pucai | pending_gi_review | | |
| hbi | pending_gi_review | | |
| pdai | pending_gi_review | | |
| Emergency rules W-* | pending_gi_review | | |
