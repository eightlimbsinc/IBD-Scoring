# IBD Clinical Research — Scoring Systems and Emergency Assessment

**Status:** Draft v0.1 (2026-11-05). Not approved for clinical use.
**Purpose:** Evidence base for the IBD Emergency Triage & Clinical Scoring PWA.
**Review required:** Every scoring table, threshold and reference in this document must be checked against the original publication by the supervising gastroenterologist before any calculation is used for patient care.

---

## 0. How this document was produced (read first)

- The research was done on 2026-11-05 from a cloud session. **PubMed, PubMed Central and SpringerLink could not be opened directly** (blocked by the session's network policy). Facts were cross-checked through web search summaries of the original papers, secondary references (e.g. guideline summaries, MDCalc-type references), and established clinical literature.
- So **no item below is marked "verified against primary source"**. Each scoring system has a *verification status*:
  - `SECONDARY-CONFIRMED` — scoring items and values agree across at least two independent secondary sources and the well-known original description. Still needs GI sign-off against the original paper.
  - `PARTIAL` — structure is confirmed but at least one value, coding or threshold is inconsistent between sources. Those items are listed under **Open questions**.
  - `UNVERIFIED` — critical details could not be confirmed. **Not to be implemented** until the original paper is reviewed.
- DOIs are given as known from the literature; **each DOI must be confirmed** when the GI reviewer pulls the paper.
- Nothing here is a recommendation for treatment, admission, discharge or surgery.

### Evidence categories (kept separate throughout the app)

| Category | Meaning | Examples |
| --- | --- | --- |
| **A. Published validated score** | Index with a defined formula from a peer-reviewed publication | Truelove & Witts, SCCAI, Mayo, HBI, PUCAI |
| **B. Guideline-based emergency criteria** | Criteria taken from a named guideline or consensus definition | ASUC definition (ECCO/BSG), toxic megacolon (Jalan), Sepsis-3 qSOFA |
| **C. Research-derived predictive model** | Single-centre or derivation-cohort models without broad validation | Verma et al. ED score (2022), Seo index |
| **D. Locally configured hospital protocol** | Thresholds a hospital decides for itself | Tachycardia alert cut-off, hypotension alert cut-off |
| **E. Experimental** | Anything not in A–D | None in v1 |

---

## 1. Guidelines consulted

| Guideline | Publication | Date | DOI / URL |
| --- | --- | --- | --- |
| ECCO Guidelines on Therapeutics in UC: Medical Treatment (Raine et al.) | J Crohns Colitis 16(1):2–17 | Jan 2022 | 10.1093/ecco-jcc/jjab178 |
| ECCO Guidelines on Therapeutics in UC: Surgical Treatment (Spinelli et al.) — includes ASUC | J Crohns Colitis 16(2):179–189 | Feb 2022 | 10.1093/ecco-jcc/jjab177 |
| ECCO Guidelines on Therapeutics in Crohn's Disease: Medical Treatment (Gordon et al.) | J Crohns Colitis 18(10):1531–1555 | 2024 | 10.1093/ecco-jcc/jjae091 |
| ECCO Guidelines on Prevention, Diagnosis and Management of Infections in IBD (Kucharzik et al.) | J Crohns Colitis 15(6):879–913 | 2021 | 10.1093/ecco-jcc/jjab052 |
| ECCO-ESGAR Guideline for Diagnostic Assessment in IBD, Part 1 (Maaser et al.) | J Crohns Colitis 13(2):144–164 | 2019 | 10.1093/ecco-jcc/jjy113 |
| ECCO-ESGAR Part 2: IBD scores and general principles / complications (Sturm et al.) | J Crohns Colitis 13(3):273–284 | 2019 | 10.1093/ecco-jcc/jjy114 |
| BSG Guidelines on IBD in adults: 2025 (Moran et al.) | Gut 74(2) | 2025 | 10.1136/gutjnl-2024-334395 |
| ACG Clinical Guideline Update: Crohn's Disease in Adults (Lichtenstein et al.) | Am J Gastroenterol 120(6):1225–1264 | 2025 | GI to confirm DOI |
| ACG Clinical Guideline: Ulcerative Colitis in Adults (Rubin et al.) | Am J Gastroenterol 114(3):384–413 | 2019 | 10.14309/ajg.0000000000000152 — **check for 2025 update** |
| WSES-AAST guidelines: management of IBD in the emergency setting (de Simone et al.) | World J Emerg Surg 16:23 | May 2021 | 10.1186/s13017-021-00362-3 |
| ECCO/ESPGHAN: Management of paediatric UC, Part 2: acute severe colitis (Turner et al.) | J Pediatr Gastroenterol Nutr 67(2):292–310 | 2018 | 10.1097/MPG.0000000000002036 |
| Sepsis-3: Third International Consensus Definitions for Sepsis and Septic Shock (Singer et al.) | JAMA 315(8):801–810 | 2016 | 10.1001/jama.2016.0287 |
| Surviving Sepsis Campaign: International Guidelines 2021 (Evans et al.) | Crit Care Med 49(11):e1063–e1143 | 2021 | 10.1097/CCM.0000000000005337 |

**Open question G-1:** Confirm whether the ACG adult UC guideline has a 2025 update in force at the GI's institution and whether local Philippine Society of Gastroenterology guidance should take precedence.

---

## 2. Ulcerative colitis scores

### 2.1 Truelove and Witts Severity Index — `SECONDARY-CONFIRMED`

- **Original:** Truelove SC, Witts LJ. Cortisone in ulcerative colitis; final report on a therapeutic trial. *BMJ* 1955;2(4947):1041–1048. DOI 10.1136/bmj.2.4947.1041
- **Purpose:** Classify UC flare severity (mild / moderate / severe). Basis of the ASUC definition used by ECCO and BSG.
- **Inputs:** bowel movements per day, blood in stool, temperature, pulse, haemoglobin, ESR.
- **Labs required:** Yes (Hb, ESR) for full classification. **Endoscopy:** No.
- **ER suitable:** **Yes** — the main bedside tool for adult ASUC.

| Feature | Mild | Moderate | Severe |
| --- | --- | --- | --- |
| Bloody stools / day | < 4 | 4–5 (intermediate) | **≥ 6** |
| Pulse | normal (≤ 90) | intermediate | **> 90 bpm** |
| Temperature | normal (≤ 37.5 °C) | intermediate | **> 37.8 °C** |
| Haemoglobin | normal | intermediate | **< 10.5 g/dL** |
| ESR | ≤ 20 mm/h (normal) | ≤ 30 mm/h | **> 30 mm/h** |

- **Severe (ASUC):** ≥ 6 bloody stools per day **AND** at least one of: pulse > 90, temperature > 37.8 °C, Hb < 10.5 g/dL, ESR > 30 mm/h.
- **Mild:** < 4 stools/day with only small amounts of blood, and no systemic toxicity.
- **Moderate:** between mild and severe.
- **Not a points score** — it is a categorical classification. No "total score".
- **Limitations:** 1955 trial population; "moderate" is defined only as intermediate; ESR is slow and often not available in the ED; designed for adults.

**Open question TW-1:** The "mild" column's exact original wording ("small amounts of blood", "no anaemia") is qualitative. The app should classify **only "severe" vs "not meeting severe criteria"** by rule, and leave mild/moderate as a clinician-confirmed label unless the GI approves explicit rules.

### 2.2 Modified Truelove and Witts (ASUC criteria with CRP) — `SECONDARY-CONFIRMED`

- **Source:** ECCO UC guidelines (2017 consensus; reaffirmed in the 2022 surgical and medical guidelines) and BSG 2019/2025 allow **CRP > 30 mg/L** in place of ESR > 30 mm/h.
- **Definition used:** ≥ 6 bloody stools/day **AND** ≥ 1 of: HR > 90 bpm, temperature > 37.8 °C, Hb < 10.5 g/dL, ESR > 30 mm/h **or CRP > 30 mg/L**.
- **ER suitable:** **Yes** — CRP is usually available faster than ESR.
- **Note:** Some sources (e.g. UK IBD audit) used CRP > 10 mg/L. The app must use the threshold the GI approves. **Open question TW-2.**
- **Pediatric:** Not used. Pediatric ASC is defined by PUCAI ≥ 65.

### 2.3 Simple Clinical Colitis Activity Index (SCCAI) — `PARTIAL`

- **Original:** Walmsley RS, Ayres RC, Pounder RE, Allan RN. A simple clinical colitis activity index. *Gut* 1998;43(1):29–32. DOI 10.1136/gut.43.1.29
- **Purpose:** Bedside clinical activity index (no labs, no endoscopy). Correlated with the Powell-Tuck index (r = 0.959).
- **Labs / endoscopy:** None. **ER suitable:** Yes (symptom-based; fast).

| Item | Response | Points |
| --- | --- | --- |
| Bowel frequency (day) | 1–3 | 0 |
| | 4–6 | 1 |
| | 7–9 | 2 |
| | > 9 | 3 |
| Bowel frequency (night) | 1–3 | 1 |
| | 4–6 | 2 |
| Urgency of defecation | none | 0 |
| | hurry | 1 |
| | immediately | 2 |
| | incontinence | 3 |
| Blood in stool | none | 0 |
| | trace | 1 |
| | occasionally frank | 2 |
| | usually frank | 3 |
| General well-being | very well | 0 |
| | slightly below par | 1 |
| | poor | 2 |
| | very poor | 3 |
| | terrible | 4 |
| Extracolonic features | 1 point per feature: arthritis, uveitis, erythema nodosum, pyoderma gangrenosum | 0–4 |

- **Formula:** sum of item points. **Range:** 0–19.
- **Interpretation (as commonly cited, not from the original paper):** remission ≤ 2 (some studies < 3); active disease ≥ 5. No universally agreed severity bands.
- **Open questions:**
  - SC-1: Night frequency of **0** — original lists only 1–3 and 4–6. Assumed 0 points for no nocturnal stools; **GI to confirm**. Nocturnal frequency > 6 is not defined in the table; assumed to score as 4–6 (2). **GI to confirm.**
  - SC-2: Some secondary sources score extracolonic features as a single count with different groupings, and one gives a maximum of 20. Use 4 named features, 1 point each, max 19, **pending GI check against original**.
  - SC-3: Remission/activity thresholds to display.

### 2.4 Full Mayo Score (Mayo Clinic Score / DAI) — `SECONDARY-CONFIRMED`

- **Original:** Schroeder KW, Tremaine WJ, Ilstrup DM. Coated oral 5-aminosalicylic acid therapy for mildly to moderately active ulcerative colitis. *N Engl J Med* 1987;317(26):1625–1629. DOI 10.1056/NEJM198712243172603
- **Purpose:** Trial outcome measure of UC activity.
- **Requires endoscopy:** **Yes** (flexible sigmoidoscopy). **Labs:** No. **ER suitable:** Only if endoscopy has been done (rare in the ED).

| Subscore | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| Stool frequency (vs patient's normal) | normal | 1–2 more than normal | 3–4 more than normal | ≥ 5 more than normal |
| Rectal bleeding | none | streaks of blood < half the time | obvious blood most of the time | blood alone passed |
| Endoscopic findings | normal / inactive | mild (erythema, decreased vascular pattern, mild friability) | moderate (marked erythema, absent vascular pattern, friability, erosions) | severe (spontaneous bleeding, ulceration) |
| Physician's global assessment | normal | mild | moderate | severe |

- **Formula:** sum of 4 subscores. **Range:** 0–12.
- **Interpretation (commonly used; varies by trial):** remission ≤ 2 with no subscore > 1; response = decrease ≥ 3 points and ≥ 30% with fall in rectal bleeding ≥ 1 or bleeding subscore ≤ 1. Severity bands often cited: 3–5 mild, 6–10 moderate, 11–12 severe.
- **Limitations:** stool frequency is relative to the patient's own normal (often unknown in the ED); PGA is subjective; endoscopic subscore has inter-observer variability. FDA "modified Mayo" removes friability from endoscopic subscore 1 and drops the PGA — a different score.
- **Open question MY-1:** Which severity bands to display (if any). Default: show total and subscores only, plus remission definition.

### 2.5 Partial Mayo Score — `PARTIAL`

- **Source:** Lewis JD et al. Use of the noninvasive components of the Mayo score to assess clinical response in ulcerative colitis. *Inflamm Bowel Dis* 2008;14(12):1660–1666. DOI 10.1002/ibd.20520
- **Items:** stool frequency + rectal bleeding + PGA (the Mayo items without endoscopy). **Range:** 0–9.
- **ER suitable:** Yes, *if* the patient's normal stool frequency is known.
- **Interpretation:** Lewis 2008 used partial Mayo for response/remission; remission is commonly cited as **≤ 1** or **≤ 2**. Severity bands (e.g. 2–4 mild, 5–6 moderate, 7–9 severe) appear in secondary sources but **were not confirmed** from the original. **Open question PM-1.**

### 2.6 Lichtiger Clinical Activity Index (modified Truelove-Witts, Lichtiger) — `SECONDARY-CONFIRMED`

- **Original:** Lichtiger S, Present DH, Kornbluth A, et al. Cyclosporine in severe ulcerative colitis refractory to steroid therapy. *N Engl J Med* 1994;330(26):1841–1845. DOI 10.1056/NEJM199406303302601
- **Purpose:** Monitor inpatient response in severe UC (rescue therapy trials).
- **Labs / endoscopy:** None. **ER suitable:** Yes (but designed for monitoring a hospitalised patient, not triage).

| Item | Response | Points |
| --- | --- | --- |
| Diarrhoea (stools/day) | 0–2 | 0 |
| | 3–4 | 1 |
| | 5–6 | 2 |
| | 7–9 | 3 |
| | ≥ 10 | 4 |
| Nocturnal diarrhoea | no | 0 |
| | yes | 1 |
| Visible blood in stool (% of movements) | 0% | 0 |
| | < 50% | 1 |
| | ≥ 50% | 2 |
| | 100% | 3 |
| Faecal incontinence | no | 0 |
| | yes | 1 |
| Abdominal pain/cramping | none | 0 |
| | mild | 1 |
| | moderate | 2 |
| | severe | 3 |
| General well-being | perfect | 0 |
| | very good | 1 |
| | good | 2 |
| | average | 3 |
| | poor | 4 |
| | terrible | 5 |
| Abdominal tenderness | none | 0 |
| | mild and localised | 1 |
| | mild to moderate and diffuse | 2 |
| | severe or rebound | 3 |
| Need for antidiarrhoeal drugs | no | 0 |
| | yes | 1 |

- **Formula:** sum. **Range:** 0–21.
- **Interpretation:** In the original trial, **response = score < 10 on two consecutive days**. Remission is often cited as ≤ 3 in later studies (**Open question LI-1**). No validated triage bands.
- **Note:** "Severe or rebound" tenderness should also raise the surgical-complication flag (see §5).

### 2.7 PRO2 for UC — `PARTIAL`

- **Source:** Jairath V, Khanna R, Zou GY, et al. Development of interim patient-reported outcome measures for the assessment of ulcerative colitis disease activity in clinical trials. *Aliment Pharmacol Ther* 2015;42(10):1200–1210. DOI 10.1111/apt.13408
- **Items:** Mayo stool frequency subscore (0–3) + Mayo rectal bleeding subscore (0–3). **Range:** 0–6.
- **ER suitable:** Limited — trial tool; usually averaged over 3 days of diary data.
- **Interpretation:** Remission definitions vary between trials (e.g. RB = 0 and SF ≤ 1). **No severity bands.** **Open question PR-1.** The app will show the subscores and total with no severity label.

### 2.8 Pediatric Ulcerative Colitis Activity Index (PUCAI) — `SECONDARY-CONFIRMED`

- **Original:** Turner D, Otley AR, Mack D, et al. Development, validation, and evaluation of a pediatric ulcerative colitis activity index: a prospective multicenter study. *Gastroenterology* 2007;133(2):423–432. DOI 10.1053/j.gastro.2007.05.029
- **Purpose:** Non-invasive activity index for children; PUCAI ≥ 65 defines pediatric acute severe colitis (ECCO/ESPGHAN 2018).
- **Labs / endoscopy:** None. **ER suitable:** **Yes** (pediatric pathway only).

| Item | Response | Points |
| --- | --- | --- |
| Abdominal pain | no pain | 0 |
| | pain can be ignored | 5 |
| | pain cannot be ignored | 10 |
| Rectal bleeding | none | 0 |
| | small amount only, in < 50% of stools | 10 |
| | small amount with most stools | 20 |
| | large amount (> 50% of the stool content) | 30 |
| Stool consistency of most stools | formed | 0 |
| | partially formed | 5 |
| | completely unformed | 10 |
| Number of stools per 24 h | 0–2 | 0 |
| | 3–5 | 5 |
| | 6–8 | 10 |
| | > 8 | 15 |
| Nocturnal stools (any episode causing wakening) | no | 0 |
| | yes | 10 |
| Activity level | no limitation | 0 |
| | occasional limitation | 5 |
| | severe restricted activity | 10 |

- **Formula:** sum. **Range:** 0–85.
- **Interpretation:** < 10 remission; 10–34 mild; 35–64 moderate; **≥ 65 severe**. Clinically significant change ≥ 20 points.
- **Age range:** validated in children; **Open question PU-1:** age cut-off for the pediatric pathway (< 18? < 17?) and use in 16–17-year-olds treated in adult EDs.

### 2.9 Seo Index — `PARTIAL` — **document only, do not implement in v1**

- **Original:** Seo M, Okada M, Yao T, et al. An index of disease activity in patients with ulcerative colitis. *Am J Gastroenterol* 1992;87(8):971–976.
- **Formula:** AI = 60 × (blood in stool) + 13 × (bowel movements) + 0.5 × ESR (mm/h) − 4 × Hb (g/dL) − 15 × albumin (g/dL) + 200.
- **Interpretation:** < 150 mild; 150–220 moderate; > 220 severe (approximately matching Truelove & Witts).
- **Problem:** Secondary sources disagree on how "blood in stool" and "bowel movements" are coded (e.g. bowel movements 0–4/day = 1, 5–7 = 2, ≥ 8 = 3 vs other groupings; blood 0/1). Reported score range also varies (70–300 vs other). **Do not implement** until the GI confirms the coding from the original paper. Japanese single-centre derivation (72 patients); limited external validation; needs ESR and albumin.

---

## 3. Crohn's disease scores

### 3.1 Harvey-Bradshaw Index (HBI) — `SECONDARY-CONFIRMED`

- **Original:** Harvey RF, Bradshaw JM. A simple index of Crohn's-disease activity. *Lancet* 1980;1(8167):514. DOI 10.1016/S0140-6736(80)92767-1
- **Purpose:** Simplified CDAI for single-day bedside use. **Labs / endoscopy:** None. **ER suitable:** **Yes.**

| Item | Response | Points |
| --- | --- | --- |
| General well-being (previous day) | very well | 0 |
| | slightly below par | 1 |
| | poor | 2 |
| | very poor | 3 |
| | terrible | 4 |
| Abdominal pain (previous day) | none | 0 |
| | mild | 1 |
| | moderate | 2 |
| | severe | 3 |
| Number of liquid / soft stools (previous day) | count | 1 per stool |
| Abdominal mass | none | 0 |
| | dubious | 1 |
| | definite | 2 |
| | definite and tender | 3 |
| Complications (1 each) | arthralgia, uveitis, erythema nodosum, aphthous ulcers, pyoderma gangrenosum, anal fissure, new fistula, abscess | 0–8 |

- **Formula:** sum. **Range:** 0 to open-ended (stool count is unbounded).
- **Interpretation (Best 2010 / Vermeire 2010 correlation with CDAI):** < 5 remission; 5–7 mild; 8–16 moderate; > 16 severe. Response = fall ≥ 3. Reference: Vermeire S, et al. *Clin Gastroenterol Hepatol* 2010;8(4):357–363. DOI 10.1016/j.cgh.2010.01.001.
- **Limitations:** stool count dominates; not valid with ostomy (stool count meaningless); abdominal mass needs examination skill. Perianal disease is under-weighted (use PDAI).
- **Open question HB-1:** confirm the band thresholds to display.

### 3.2 Crohn's Disease Activity Index (CDAI) — `PARTIAL`

- **Original:** Best WR, Becktel JM, Singleton JW, Kern F Jr. Development of a Crohn's disease activity index. *Gastroenterology* 1976;70(3):439–444. DOI 10.1016/S0016-5085(76)80163-1
- **Purpose:** Reference outcome measure in CD trials.
- **Labs:** Yes (haematocrit). **Endoscopy:** No.
- **ER suitable:** **No** — needs a **7-day patient diary** (stools, pain, well-being). Retrospective recall in an emergency is not a valid substitute. Compute only if a completed diary is entered.

| Variable | Multiplier |
| --- | --- |
| Sum of liquid or very soft stools over 7 days | × 2 |
| Sum of daily abdominal pain ratings over 7 days (0 none, 1 mild, 2 moderate, 3 severe) | × 5 |
| Sum of daily general well-being ratings over 7 days (0 generally well, 1 slightly under par, 2 poor, 3 very poor, 4 terrible) | × 7 |
| Number of complication categories present: arthritis/arthralgia; iritis/uveitis; erythema nodosum, pyoderma gangrenosum or aphthous stomatitis; anal fissure, fistula or abscess; other fistula; fever > 37.8 °C (100 °F) in past week | × 20 |
| Use of antidiarrhoeal drugs (Lomotil/opiates) — 0 no, 1 yes | × 30 |
| Abdominal mass — 0 none, 2 questionable, 5 definite | × 10 |
| Haematocrit deficit: males (47 − Hct), females (42 − Hct) | × 6 |
| Body weight: percentage below standard weight = 100 × (1 − weight / standard weight) | × 1 |

- **Range:** approx. 0–600. **Interpretation:** < 150 remission; 150–219 mild; 220–450 moderate; > 450 severe. Response: fall ≥ 70 or ≥ 100.
- **Open questions:**
  - CD-1: How "standard weight" is defined (original used height-based tables; implementations vary). **Not implementable without GI decision.**
  - CD-2: Whether to floor the haematocrit term at 0 and the weight term at −10 (common in implementations, not confirmed in the original).
  - CD-3: Requires sex — the only score in scope needing it.
- **Limitations:** 7-day diary; subjective items dominate; poorly correlated with endoscopic activity; distorted by IBS overlap, ostomy and previous resection.

### 3.3 Perianal Disease Activity Index (PDAI) — `SECONDARY-CONFIRMED`

- **Original:** Irvine EJ. Usual therapy improves perianal Crohn's disease as measured by a new disease activity index. *J Clin Gastroenterol* 1995;20(1):27–32. DOI 10.1097/00004836-199501000-00008
- **Labs / endoscopy:** None; needs perianal examination. **ER suitable:** Yes, when perianal symptoms are present.

| Item | 0 | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- | --- |
| Discharge | none | minimal mucous | moderate mucous or purulent | substantial | gross faecal soiling |
| Pain / restriction of activities | no activity restriction | mild discomfort, no restriction | moderate discomfort, some limitation | marked discomfort, marked limitation | severe pain, severe limitation |
| Restriction of sexual activity | none | slight | moderate | marked | unable to engage |
| Type of perianal disease | none / skin tags | anal fissure or mucosal tear | < 3 perianal fistulae | ≥ 3 perianal fistulae | anal sphincter ulceration or fistulae with significant undermining of skin |
| Degree of induration | none | minimal | moderate | substantial | gross fluctuance / abscess |

- **Formula:** sum. **Range:** 0–20.
- **Interpretation:** > 4 suggests active fistula / inflammation (Losco A, et al. *Inflamm Bowel Dis* 2009;15(5):742–749, DOI 10.1002/ibd.20834). **Open question PD-1.**
- **Emergency link:** Induration 4 ("gross fluctuance / abscess") → perianal abscess warning (§5), independent of total.
- Sexual-activity item may be unanswerable or inappropriate in the ED; app must allow "not assessed" and then report the score as incomplete.

### 3.4 Simple Endoscopic Score for Crohn's Disease (SES-CD) — `PARTIAL` — v2

- **Original:** Daperno M, D'Haens G, Van Assche G, et al. Development and validation of a new, simplified endoscopic activity score for Crohn's disease: the SES-CD. *Gastrointest Endosc* 2004;60(4):505–512. DOI 10.1016/S0016-5107(04)01878-4
- **Requires:** ileocolonoscopy. **ER suitable:** No (included for completeness when endoscopy results exist).
- **Segments:** ileum, right colon, transverse colon, left colon, rectum. Each scored on 4 variables:

| Variable | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| Size of ulcers | none | aphthous (0.1–0.5 cm) | large (0.5–2 cm) | very large (> 2 cm) |
| Ulcerated surface | none | < 10% | 10–30% | > 30% |
| Affected surface | unaffected | < 50% | 50–75% | > 75% |
| Narrowing | none | single, can be passed | multiple, can be passed | cannot be passed |

- **Formula:** sum of all segment-variable scores. Commonly reported range **0–56** (sum of item maxima is 60). **Open question SE-1:** confirm range and any segment-exploration correction.
- **Interpretation (commonly cited):** 0–2 inactive; 3–6 mild; 7–15 moderate; > 15 severe. **Open question SE-2.**

### 3.5 Rutgeerts Score — `SECONDARY-CONFIRMED` — v2

- **Original:** Rutgeerts P, Geboes K, Vantrappen G, et al. Predictability of the postoperative course of Crohn's disease. *Gastroenterology* 1990;99(4):956–963. DOI 10.1016/0016-5085(90)90613-6
- **Applies to:** postoperative CD after ileocolonic resection, at ileocolonoscopy. **ER suitable:** No; display only if a recent report exists.
- **Categories (not additive):**
  - i0: no lesions.
  - i1: ≤ 5 aphthous lesions.
  - i2: > 5 aphthous lesions with normal mucosa between them, or skip areas of larger lesions, or lesions confined to the ileocolonic anastomosis.
  - i3: diffuse aphthous ileitis with diffusely inflamed mucosa.
  - i4: diffuse inflammation with large ulcers, nodules and/or narrowing.
- Endoscopic recurrence usually defined as ≥ i2. Modified version splits i2 into i2a (anastomotic) and i2b. **Open question RU-1:** original vs modified.

### 3.6 Pediatric Crohn's Disease Activity Index (PCDAI) — `UNVERIFIED` — **not implemented in v1**

- **Original:** Hyams JS, Ferry GD, Mandel FS, et al. Development and validation of a pediatric Crohn's disease activity index. *J Pediatr Gastroenterol Nutr* 1991;12(4):439–447. DOI 10.1097/00005176-199105000-00005
- **Components:** history (pain, stools, well-being), labs (Hct with age/sex-specific cut-offs, ESR, albumin), exam (weight, height / height velocity, abdomen, perirectal disease, extraintestinal manifestations). **Range:** 0–100. Commonly cited: < 10 remission, 10–30 mild, > 30 moderate–severe.
- **Why not implemented:** needs height velocity and age/sex-specific haematocrit tables that could not be verified. Alternatives: **weighted PCDAI (wPCDAI)** — Turner D, et al. *Inflamm Bowel Dis* 2012;18(1):55–62, DOI 10.1002/ibd.21649 — which drops height velocity and is better suited to acute settings. **Open question PC-1:** GI to choose PCDAI vs wPCDAI and supply verified tables.

### 3.7 PRO2 for Crohn's disease — `PARTIAL`

- **Source:** Khanna R, Zou G, D'Haens G, et al. A retrospective analysis: the development of patient reported outcome measures for the assessment of Crohn's disease activity. *Aliment Pharmacol Ther* 2015;41(1):77–86. DOI 10.1111/apt.13001
- **Items:** average daily number of liquid/very soft stools (7 days) × 2 + average daily abdominal pain (0–3, 7 days) × 5 (CDAI weights).
- **ER suitable:** **No** — needs 7-day averages. Compute only with diary data.
- **Interpretation:** Remission cut-offs differ between publications (**< 8** vs **< 11** reported to match CDAI < 150). **Open question PR-2.** The app will show the total without a remission label until approved.

---

## 4. Emergency risk assessment — research-derived model

### 4.1 Verma et al. ED-based score — category C (research-derived) — `UNVERIFIED (point values)`

- **Citation:** Verma A, Varma S, Freedberg DE, Axelrad JE. A Simple Emergency Department-Based Score Predicts Complex Hospitalization in Patients with Inflammatory Bowel Disease. *Dig Dis Sci* 2022;67(2):629–638. DOI 10.1007/s10620-021-06877-8
- **Background:** ~30% of IBD patients hospitalised with flare need salvage therapy or surgery; no ED-based index existed to predict this at admission.
- **Population:** 164 IBD admissions for flare at a single US academic centre (retrospective). 56 (34%) had a complex hospitalisation.
- **Outcome ("complex hospitalisation"):** length of stay > 7 days, inpatient colectomy, or inpatient infliximab or cyclosporine (salvage).
- **Variables:** ED triage **heart rate** and serum **albumin**.
- **Performance:** AUC 0.744 (95% CI 0.671–0.816). Score 0 (HR < 99 bpm and albumin ≥ 3.4 g/dL): 44/48 (91.7%) had a non-complex hospitalisation.
- **Not confirmed:** exact point allocation for scores 1 and 2 (presumably 1 point per abnormal variable, but **this was not verifiable** from the accessible abstract).
- **Limitations:** single centre, retrospective, small, derivation only, US tertiary population; outcome includes treatment decisions (salvage therapy) that are practice-dependent; predicts complex hospitalisation **among patients already admitted**, not need for admission.
- **App rule:** Not an established or validated triage standard. **Not calculated in v1.** It may be shown in Clinical Reference only. If the GI later approves it, it must be labelled "Research-derived model — not a triage tool" and never feed any flag.

---

## 5. Emergency complications — guideline-based criteria

These generate **warnings**, not scores. A warning is shown regardless of disease-activity score.

### 5.1 Acute severe ulcerative colitis (adult)
- Definition: Truelove & Witts / modified criteria (§2.1–2.2). ECCO and BSG define ASUC this way; it is a medical emergency needing hospital assessment.
- ECCO/BSG workup typically includes FBC, CRP, U&E, LFT/albumin, stool culture and *C. difficile* testing, and plain abdominal radiograph. The app lists **which of these are not yet documented** — it does not order or recommend.
- Pediatric equivalent: PUCAI ≥ 65 (ECCO/ESPGHAN 2018).

### 5.2 Toxic megacolon
- **Jalan criteria:** Jalan KN, et al. An experience of ulcerative colitis. I. Toxic dilation in 55 cases. *Gastroenterology* 1969;57(1):68–82.
  - Radiographic colonic distension (classically transverse colon > 6 cm), **plus**
  - ≥ 3 of: fever > 38.6 °C; HR > 120 bpm; WBC > 10.5 × 10⁹/L; anaemia; **plus**
  - ≥ 1 of: dehydration; altered consciousness; electrolyte disturbance; hypotension.
- In the ED, imaging may not be available. App rule: **"Possible toxic megacolon"** warning when abdominal distension is reported and ≥ 3 systemic criteria are present, even without imaging; full criteria only when imaging distension is entered. **Open question TM-1** (GI to approve the partial-criteria trigger).

### 5.3 Intestinal perforation
- No validated scoring system. Clinical features: sudden severe pain, peritonism (guarding, rigidity, rebound), free air on imaging.
- **Steroids and immunosuppressants can mask peritonism** (WSES-AAST 2021). App shows an information note when the patient is on corticosteroids/biologics/immunomodulators.
- App rule: warning when clinician records guarding/rigidity/rebound, or free air on imaging.

### 5.4 Bowel obstruction (mainly CD strictures)
- Features: inability to pass stool or flatus, vomiting, distension, colicky pain (WSES-AAST 2021).
- App rule: warning when **inability to pass stool/gas = Yes**, or **vomiting AND distension = Yes**. **Open question OB-1.**

### 5.5 Severe gastrointestinal bleeding
- No IBD-specific validated bleeding score. Rule uses haemodynamics + bleeding: rectal bleeding = Yes **and** (SBP < 90 **or** shock index HR/SBP ≥ 1.0 **or** Hb < 7 g/dL).
- These thresholds are **category D (locally configured)** — common emergency-medicine cut-offs, not IBD-specific. **Open question BL-1.**

### 5.6 Sepsis
- **qSOFA** (Sepsis-3, Singer 2016): RR ≥ 22/min; altered mentation (GCS < 15); SBP ≤ 100 mmHg. ≥ 2 = higher risk of poor outcome. Surviving Sepsis Campaign 2021 recommends **against qSOFA alone** as a screening tool.
- **SIRS** (ACCP/SCCM 1992): temperature > 38 °C or < 36 °C; HR > 90; RR > 20 (or PaCO₂ < 32 mmHg); WBC > 12 or < 4 × 10⁹/L (or > 10% bands). ≥ 2 = SIRS.
- Lactate ≥ 2 mmol/L (hypoperfusion marker in Sepsis-3 septic shock definition).
- App: display qSOFA count and SIRS count with their sources; warning if qSOFA ≥ 2 or (SIRS ≥ 2 and suspected infection) or lactate ≥ 2. **Open question SP-1** (local sepsis protocol may override).
- Immunosuppressed patients may not mount fever or tachycardia.

### 5.7 Hypotension and tachycardia (category D)
- Proposed defaults: hypotension SBP < 90 mmHg or MAP < 65 mmHg; tachycardia HR > 100 bpm ("significant"); HR > 120 bpm ("marked"). HR > 90 is used separately as the T&W criterion.
- **All locally configurable; GI/ED lead to approve.** **Open question VS-1.**

### 5.8 Dehydration / hypovolaemia / acute kidney injury
- No validated adult dehydration score for IBD. Clinical signs captured as Yes/No/Unknown.
- **KDIGO AKI (2012):** creatinine rise ≥ 0.3 mg/dL (26.5 µmol/L) within 48 h, or ≥ 1.5× baseline within 7 days, or urine output < 0.5 mL/kg/h for 6 h. Needs a baseline creatinine — the app will only evaluate it if baseline is entered.
- Electrolytes: hypokalaemia (K < 3.5 mmol/L) is relevant in severe colitis (risk factor for toxic dilatation); thresholds are category D. **Open question DH-1.**

### 5.9 Intra-abdominal abscess (CD)
- Features: fever, localised pain, tender mass, raised inflammatory markers; confirmed on CT/MRI/US (ECCO-ESGAR 2019; WSES-AAST 2021).
- App rule: "Possible intra-abdominal abscess" when CD + fever (> 38 °C) + tender abdominal mass (or HBI mass = "definite and tender"). **Open question AB-1.**

### 5.10 Perianal abscess / fistula complication
- Features: perianal pain, swelling, fluctuance, fever. WSES-AAST: perianal abscess requires surgical drainage evaluation.
- App rule: warning when perianal swelling/fluctuance = Yes, or PDAI induration = 4.

### 5.11 Infectious colitis — *C. difficile* and other enteric infection
- ECCO infections guideline (2021): stool testing for *C. difficile* (and enteric pathogens) in all patients with a flare; CMV in steroid-refractory severe colitis.
- App rules: **infection warning** if *C. difficile* or other stool pathogen = positive; **missing-investigation item** if *C. difficile* = not ordered / not available. A missing result is never treated as negative.

---

## 6. Recommended ED assessment workflow (for the app's flow, not a clinical protocol)

1. Patient details and diagnosis → choose adult or pediatric pathway (age cut-off pending PU-1).
2. **Red-flag screen first** (peritonism, inability to pass stool/gas, vomiting, heavy bleeding, altered mentation) — warnings appear immediately as data are entered.
3. Vital signs → physiological instability flags (category D thresholds), qSOFA/SIRS counts.
4. Symptoms → applicable bedside scores (UC: T&W/modified, SCCAI, partial Mayo, Lichtiger; CD: HBI, PDAI; pediatric UC: PUCAI).
5. Labs (with status: not ordered / pending / not available / result) → T&W lab criteria, modified T&W, sepsis/AKI, missing-investigation list.
6. Summary dashboard: emergency warnings → physiological instability → disease activity → surgical → infection → scores → missing items.
7. Report (print / PDF / JSON export). No server storage in v1.

The app **does not** assign ESI levels, recommend admission/discharge, surgery or drugs. All decisions remain with the treating team.

---

## 7. Proposed initial scope (v1)

| Pathway | Implement in v1 | Deferred / document only |
| --- | --- | --- |
| Adult UC | Truelove & Witts (severe rule), modified T&W, SCCAI, partial Mayo, full Mayo (only with endoscopy), Lichtiger, UC PRO2 (no labels) | Seo index |
| Adult CD | HBI, PDAI | CDAI (needs diary + standard-weight decision), CD PRO2 (needs diary), SES-CD, Rutgeerts |
| Pediatric UC | PUCAI | — |
| Pediatric CD | — | PCDAI / wPCDAI (pending tables) |
| IBD-U / suspected IBD | Emergency warnings, vitals, labs; UC scores optional with label "UC index applied to IBD-U" (**Open question IB-1**) | — |
| Emergency | All §5 warnings | Verma ED score (Reference only) |

Every implemented score ships with `specStatus: "pending_gi_review"` and a visible "Not yet approved for clinical use" banner until the GI signs off in `IBD-SCORING-SPECIFICATIONS.md`.

---

## 8. Open questions for gastroenterologist sign-off

| ID | Question |
| --- | --- |
| G-1 | Which guideline set is the local reference (ECCO / BSG / ACG / PSG)? |
| TW-1 | Classify only "severe" by rule, or also mild/moderate? |
| TW-2 | CRP threshold for modified T&W: > 30 mg/L (ECCO) or other? |
| SC-1 | SCCAI: scoring for 0 nocturnal stools and > 6 nocturnal stools. |
| SC-2 | SCCAI extracolonic features coding and maximum (19 vs 20). |
| SC-3 | SCCAI remission/activity thresholds to display. |
| MY-1 | Full Mayo severity bands. |
| PM-1 | Partial Mayo remission and severity bands. |
| LI-1 | Lichtiger remission threshold. |
| PR-1 / PR-2 | PRO2 remission definitions (UC and CD). |
| PU-1 | Age cut-off for pediatric pathway. |
| HB-1 | HBI bands. |
| CD-1 / CD-2 | CDAI standard weight; term floors. |
| PD-1 | PDAI activity threshold. |
| SE-1 / SE-2 | SES-CD range and bands. |
| RU-1 | Rutgeerts original vs modified. |
| PC-1 | PCDAI vs wPCDAI; verified tables. |
| TM-1 | Toxic megacolon partial-criteria warning. |
| OB-1 | Obstruction trigger. |
| BL-1 | Bleeding thresholds. |
| SP-1 | Sepsis warning rule vs local sepsis protocol. |
| VS-1 | Hypotension/tachycardia thresholds. |
| DH-1 | Electrolyte and dehydration thresholds. |
| AB-1 | Abscess trigger. |
| IB-1 | Apply UC indices to IBD-U? |
| U-1 | Lab units used locally (SI vs conventional) — see spec §2. |

---

## 9. Sources checked in this session

- Verma et al. 2022 abstract (SpringerLink): https://link.springer.com/article/10.1007/s10620-021-06877-8
- WSES-AAST 2021 guideline: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8111988/ · https://pubmed.ncbi.nlm.nih.gov/33971899/
- ECCO 2022 UC surgical guideline (PubMed): https://pubmed.ncbi.nlm.nih.gov/34635910/ · ECCO news on 2022 UC guidelines: https://ecco-ibd.eu/publications/ecco-news/item/2022-1-guidelines-on-therapeutics-in-ulcerative-colitis-report-on-the-uc-guidelines.html
- BSG 2025 IBD guideline announcement: https://www.bsg.org.uk/news/inflammatory-bowel-disease-guideline-2025 · https://ueaeprints.uea.ac.uk/id/eprint/103386/
- ACG 2025 Crohn's guideline summary: https://gi.org/journals-publications/ebgi/zhai_dalal_sep2025/
- SCCAI secondary sources: https://www.medicalalgorithms.com/simple-clinical-colitis-activity-index-of-walmsley-et-al · https://en.wikipedia.org/wiki/Simple_clinical_colitis_activity_index · original PMC1727189
- Seo index secondary sources: https://www.medicalalgorithms.com/disease-activity-index-of-seo-et-al-for-a-patient-with-ulcerative-colitis · https://trialsjournal.biomedcentral.com/articles/10.1186/1745-6215-8-17/tables/2
- CD PRO2 description: https://awellhealth.com/care-flow-library/patient-reported-outcome-pro-2-crohns-disease-outcome-measure-flow
