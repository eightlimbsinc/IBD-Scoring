import type { EvidenceCategory, SpecStatus } from "./spec/registry";

export type ScoreStatus = "complete" | "incomplete" | "not_applicable" | "invalid";
export type Band = "remission" | "mild" | "moderate" | "severe" | "other";

export interface ScoreComponent {
  itemId: string;
  label: string;
  answer: string | number | null;
  points: number | null;
  rule: string;
}

export interface ScoreResult {
  scoreId: string;
  scoreName: string;
  category: EvidenceCategory;
  specVersion: string;
  specStatus: SpecStatus;
  status: ScoreStatus;
  total: number | null;
  range: { min: number; max: number | null };
  components: ScoreComponent[];
  interpretation: { label: string; band: Band; rule: string } | null;
  interpretationStatus: "approved" | "unapproved" | "none";
  missing: string[];
  notes: string[];
  calculatedAt: string;
  references: { citation: string; doi?: string }[];
}

export type WarningSeverity = "emergency" | "warning" | "info";
export type WarningGroup = "immediate" | "physiological" | "severe_activity" | "surgical" | "infection";

export interface ClinicalWarning {
  id: string;
  group: WarningGroup;
  severity: WarningSeverity;
  category: EvidenceCategory;
  title: string;
  because: string[];
  source: string;
  status: "met" | "possible";
}

export interface MissingInvestigation {
  id: string;
  label: string;
  status: string;
}

export type SummaryLevel = "emergency" | "severe" | "moderate" | "lower" | "incomplete" | "unbanded";

export interface AssessmentOutput {
  pathway: "adult" | "pediatric" | null;
  scores: ScoreResult[];
  notApplicable: { scoreName: string; reason: string }[];
  warnings: ClinicalWarning[];
  missingInvestigations: MissingInvestigation[];
  qsofa: { count: number; unknown: string[]; items: string[] } | null;
  sirs: { count: number; unknown: string[]; items: string[] } | null;
  summary: { level: SummaryLevel; headline: string; incomplete: boolean; reasons: string[] };
  calculatedAt: string;
  specVersion: string;
}

export interface Ctx {
  now: string;
}
