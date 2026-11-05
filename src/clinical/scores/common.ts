import { SCORES } from "../spec/registry";
import { SPEC_VERSION } from "../spec/version";
import type { Band, Ctx, ScoreComponent, ScoreResult } from "../types";

export function meta(id: string) {
  const m = SCORES.find((s) => s.id === id);
  if (!m) throw new Error(`Unknown score ${id}`);
  return m;
}

/** Item helper. `points` null => missing. */
export function item(itemId: string, label: string, answer: string | number | null, points: number | null, rule: string): ScoreComponent {
  return { itemId, label, answer, points, rule };
}

export type Interpreter = (total: number) => { label: string; band: Band; rule: string } | null;

/** Builds an additive-score result. Never totals when an item is missing. */
export function additive(
  id: string,
  components: ScoreComponent[],
  ctx: Ctx,
  range: { min: number; max: number | null },
  interpret: Interpreter | null,
  notes: string[] = [],
): ScoreResult {
  const m = meta(id);
  const missing = components.filter((c) => c.points == null).map((c) => c.label);
  const complete = missing.length === 0;
  const total = complete ? components.reduce((s, c) => s + (c.points as number), 0) : null;
  const interpretation = total != null && interpret ? interpret(total) : null;
  return {
    scoreId: id,
    scoreName: m.name,
    category: m.category,
    specVersion: SPEC_VERSION,
    specStatus: m.specStatus,
    status: complete ? "complete" : "incomplete",
    total,
    range,
    components,
    interpretation,
    interpretationStatus: interpretation ? (m.specStatus === "approved" ? "approved" : "unapproved") : "none",
    missing,
    notes,
    calculatedAt: ctx.now,
    references: [{ citation: m.reference, doi: m.doi }],
  };
}

/** Map a coded enum answer ("0".."n") to points; "" / unknown / not_assessed => null. */
export function coded(v: string | undefined): number | null {
  if (v == null || v === "" || v === "unknown" || v === "not_assessed" || v === "not_done") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export const answerLabel = (v: string | undefined, labels: Record<string, string>) =>
  v == null || v === "" ? null : (labels[v] ?? v);
