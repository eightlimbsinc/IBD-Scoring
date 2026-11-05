export type EvidenceCategory = "A" | "B" | "C" | "D" | "E";
export type SpecStatus = "pending_gi_review" | "approved" | "not_implemented";

export interface ScoreMeta {
  id: string;
  name: string;
  disease: "UC" | "CD" | "IBD";
  pathway: "adult" | "pediatric";
  category: EvidenceCategory;
  specStatus: SpecStatus;
  needs: string[];
  edSuitable: string;
  reference: string;
  doi?: string;
}

export const CATEGORY_LABEL: Record<EvidenceCategory, string> = {
  A: "Published validated score",
  B: "Guideline-based emergency criteria",
  C: "Research-derived predictive model",
  D: "Local hospital protocol",
  E: "Experimental",
};

export const SCORES: ScoreMeta[] = [
  { id: "tw_severity", name: "Truelove & Witts", disease: "UC", pathway: "adult", category: "A", specStatus: "pending_gi_review", needs: ["Bloody stools/24 h", "HR", "Temp", "Hb", "ESR"], edSuitable: "Yes — main bedside tool for acute severe UC", reference: "Truelove SC, Witts LJ. BMJ 1955;2:1041–1048", doi: "10.1136/bmj.2.4947.1041" },
  { id: "tw_modified", name: "Modified Truelove & Witts (ASUC)", disease: "UC", pathway: "adult", category: "B", specStatus: "pending_gi_review", needs: ["As T&W", "CRP"], edSuitable: "Yes", reference: "ECCO UC guidelines 2022; BSG 2025", doi: "10.1093/ecco-jcc/jjab177" },
  { id: "sccai", name: "SCCAI", disease: "UC", pathway: "adult", category: "A", specStatus: "pending_gi_review", needs: ["Symptoms only"], edSuitable: "Yes", reference: "Walmsley RS et al. Gut 1998;43:29–32", doi: "10.1136/gut.43.1.29" },
  { id: "mayo_partial", name: "Partial Mayo", disease: "UC", pathway: "adult", category: "A", specStatus: "pending_gi_review", needs: ["Usual stool frequency", "Physician global assessment"], edSuitable: "Yes, if usual stool frequency is known", reference: "Lewis JD et al. Inflamm Bowel Dis 2008;14:1660–1666", doi: "10.1002/ibd.20520" },
  { id: "mayo_full", name: "Full Mayo", disease: "UC", pathway: "adult", category: "A", specStatus: "pending_gi_review", needs: ["Endoscopy subscore"], edSuitable: "Only with endoscopy", reference: "Schroeder KW et al. N Engl J Med 1987;317:1625–1629", doi: "10.1056/NEJM198712243172603" },
  { id: "lichtiger", name: "Lichtiger index", disease: "UC", pathway: "adult", category: "A", specStatus: "pending_gi_review", needs: ["Symptoms", "Abdominal tenderness"], edSuitable: "Yes (designed for inpatient monitoring)", reference: "Lichtiger S et al. N Engl J Med 1994;330:1841–1845", doi: "10.1056/NEJM199406303302601" },
  { id: "pro2_uc", name: "PRO2 (UC)", disease: "UC", pathway: "adult", category: "A", specStatus: "pending_gi_review", needs: ["Mayo stool + bleeding subscores"], edSuitable: "Limited", reference: "Jairath V et al. Aliment Pharmacol Ther 2015;42:1200–1210", doi: "10.1111/apt.13408" },
  { id: "pucai", name: "PUCAI", disease: "UC", pathway: "pediatric", category: "A", specStatus: "pending_gi_review", needs: ["Symptoms only"], edSuitable: "Yes (children)", reference: "Turner D et al. Gastroenterology 2007;133:423–432", doi: "10.1053/j.gastro.2007.05.029" },
  { id: "hbi", name: "Harvey-Bradshaw Index", disease: "CD", pathway: "adult", category: "A", specStatus: "pending_gi_review", needs: ["Symptoms", "Abdominal exam"], edSuitable: "Yes", reference: "Harvey RF, Bradshaw JM. Lancet 1980;1:514", doi: "10.1016/S0140-6736(80)92767-1" },
  { id: "pdai", name: "PDAI", disease: "CD", pathway: "adult", category: "A", specStatus: "pending_gi_review", needs: ["Perianal exam"], edSuitable: "Yes, with perianal symptoms", reference: "Irvine EJ. J Clin Gastroenterol 1995;20:27–32", doi: "10.1097/00004836-199501000-00008" },
  { id: "pro2_cd", name: "PRO2 (Crohn's)", disease: "CD", pathway: "adult", category: "A", specStatus: "pending_gi_review", needs: ["7-day diary"], edSuitable: "No — needs 7-day diary", reference: "Khanna R et al. Aliment Pharmacol Ther 2015;41:77–86", doi: "10.1111/apt.13001" },
  { id: "cdai", name: "CDAI", disease: "CD", pathway: "adult", category: "A", specStatus: "not_implemented", needs: ["7-day diary", "Hematocrit", "Standard weight"], edSuitable: "No — needs 7-day diary", reference: "Best WR et al. Gastroenterology 1976;70:439–444", doi: "10.1016/S0016-5085(76)80163-1" },
  { id: "ses_cd", name: "SES-CD", disease: "CD", pathway: "adult", category: "A", specStatus: "not_implemented", needs: ["Ileocolonoscopy"], edSuitable: "No", reference: "Daperno M et al. Gastrointest Endosc 2004;60:505–512", doi: "10.1016/S0016-5107(04)01878-4" },
  { id: "rutgeerts", name: "Rutgeerts score", disease: "CD", pathway: "adult", category: "A", specStatus: "not_implemented", needs: ["Post-op ileocolonoscopy"], edSuitable: "No", reference: "Rutgeerts P et al. Gastroenterology 1990;99:956–963", doi: "10.1016/0016-5085(90)90613-6" },
  { id: "pcdai", name: "PCDAI / wPCDAI", disease: "CD", pathway: "pediatric", category: "A", specStatus: "not_implemented", needs: ["Age/sex lab tables", "Height velocity"], edSuitable: "wPCDAI possibly", reference: "Hyams JS et al. J Pediatr Gastroenterol Nutr 1991;12:439–447", doi: "10.1097/00005176-199105000-00005" },
  { id: "seo", name: "Seo index", disease: "UC", pathway: "adult", category: "C", specStatus: "not_implemented", needs: ["ESR", "Hb", "Albumin"], edSuitable: "Coding unverified", reference: "Seo M et al. Am J Gastroenterol 1992;87:971–976" },
  { id: "verma_ed", name: "ED complex-hospitalization score", disease: "IBD", pathway: "adult", category: "C", specStatus: "not_implemented", needs: ["Triage HR", "Albumin"], edSuitable: "Research model only — not a triage tool", reference: "Verma A et al. Dig Dis Sci 2022;67:629–638", doi: "10.1007/s10620-021-06877-8" },
];
