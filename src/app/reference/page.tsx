import { CATEGORY_LABEL, SCORES } from "@/clinical/spec/registry";
import { Badge, Card } from "@/ui/primitives";

const STATUS = {
  pending_gi_review: { tone: "moderate", label: "Pending sign-off" },
  approved: { tone: "lower", label: "Approved" },
  not_implemented: { tone: "incomplete", label: "Not in v1" },
} as const;

export default function ReferencePage() {
  const groups = [
    { title: "Ulcerative colitis — adult", items: SCORES.filter((s) => s.disease === "UC" && s.pathway === "adult") },
    { title: "Ulcerative colitis — pediatric", items: SCORES.filter((s) => s.disease === "UC" && s.pathway === "pediatric") },
    { title: "Crohn's disease — adult", items: SCORES.filter((s) => s.disease === "CD" && s.pathway === "adult") },
    { title: "Crohn's disease — pediatric", items: SCORES.filter((s) => s.disease === "CD" && s.pathway === "pediatric") },
    { title: "Research-derived models", items: SCORES.filter((s) => s.disease === "IBD") },
  ];
  return (
    <div className="space-y-5">
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight">Clinical reference</h1>
      {groups.map((g) => (
        <Card key={g.title} title={g.title}>
          <ul className="space-y-3">
            {g.items.map((s) => (
              <li key={s.id} className="raised-sm rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[17px] font-semibold">{s.name}</p>
                  <Badge tone={STATUS[s.specStatus].tone}>{STATUS[s.specStatus].label}</Badge>
                </div>
                <p className="mt-1 text-[14px] text-ink-muted">{CATEGORY_LABEL[s.category]}</p>
                <p className="mt-2 text-[15px]"><span className="font-semibold">Use in the ED:</span> {s.edSuitable}</p>
                <p className="text-[15px]"><span className="font-semibold">Needs:</span> {s.needs.join(", ")}</p>
                <p className="mt-2 text-[14px] text-ink-muted">
                  {s.reference}
                  {s.doi && <> · <a className="text-accent underline" href={`https://doi.org/${s.doi}`} target="_blank" rel="noreferrer">doi:{s.doi}</a></>}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
